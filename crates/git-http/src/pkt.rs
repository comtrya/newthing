//! pkt-line encode/decode primitives shared by the upload-pack and
//! receive-pack handlers. Side-band framing lives in [`crate::pack`];
//! this module only deals with the underlying length-prefixed packets
//! and the two reserved control packets (flush `0000`, delim `0001`).

pub fn encode_pkt_line(data: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(4 + data.len());
    let len = 4 + data.len();
    out.extend_from_slice(format!("{len:04x}").as_bytes());
    out.extend_from_slice(data);
    out
}

pub const PKT_FLUSH: &[u8] = b"0000";

pub const PKT_DELIM: &[u8] = b"0001";

pub fn decode_pkt_lines(mut buf: &[u8]) -> anyhow::Result<Vec<Pkt>> {
    let mut out = Vec::new();
    while !buf.is_empty() {
        if buf.len() < 4 {
            anyhow::bail!("truncated pkt-line length");
        }
        let len_hex = &buf[..4];
        let len = usize::from_str_radix(std::str::from_utf8(len_hex)?, 16)?;
        buf = &buf[4..];
        if len == 0 {
            out.push(Pkt::Flush);
            continue;
        }
        if len == 1 {
            out.push(Pkt::Delim);
            continue;
        }
        // Lengths 2 and 3 are invalid per the pkt-line spec; reject them
        // explicitly so untrusted input can't underflow `len - 4` (a debug-build
        // panic / release-build wrap on the attacker-controlled request body).
        let data_len = len
            .checked_sub(4)
            .ok_or_else(|| anyhow::anyhow!("invalid pkt-line length {len}"))?;
        if buf.len() < data_len {
            anyhow::bail!("truncated pkt-line data");
        }
        let data = &buf[..data_len];
        out.push(Pkt::Data(data.to_vec()));
        buf = &buf[data_len..];
    }
    Ok(out)
}

#[derive(Debug, Clone)]
pub enum Pkt {
    Data(Vec<u8>),
    Flush,
    Delim,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_pkt_line() {
        let msg = b"hello\n";
        let enc = encode_pkt_line(msg);
        assert_eq!(&enc[..4], b"000a");
        let pkts = decode_pkt_lines(&enc).unwrap();
        assert!(matches!(&pkts[0], Pkt::Data(d) if d == msg));
    }

    #[test]
    fn decode_flush_and_delim() {
        let mut buf = Vec::new();
        buf.extend_from_slice(PKT_FLUSH);
        buf.extend_from_slice(PKT_DELIM);
        let pkts = decode_pkt_lines(&buf).unwrap();
        assert!(matches!(pkts[0], Pkt::Flush));
        assert!(matches!(pkts[1], Pkt::Delim));
    }

    #[test]
    fn decode_rejects_reserved_pkt_line_lengths() {
        // Lengths 2 and 3 are invalid and must be a clean error, never an
        // arithmetic underflow panic, on attacker-controlled input.
        for bad in [b"0002".as_slice(), b"0003".as_slice()] {
            assert!(
                decode_pkt_lines(bad).is_err(),
                "length {:?} must be rejected",
                std::str::from_utf8(bad).unwrap()
            );
        }
    }
}
