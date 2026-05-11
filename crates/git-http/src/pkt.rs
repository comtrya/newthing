//! pkt-line encode/decode and side-band framing (scaffold).

#[allow(dead_code)]
pub fn encode_pkt_line(data: &[u8]) -> Vec<u8> {
    let mut out = Vec::with_capacity(4 + data.len());
    let len = 4 + data.len();
    out.extend_from_slice(format!("{len:04x}").as_bytes());
    out.extend_from_slice(data);
    out
}

#[allow(dead_code)]
pub const PKT_FLUSH: &[u8] = b"0000";

#[allow(dead_code)]
pub const PKT_DELIM: &[u8] = b"0001";

#[allow(dead_code)]
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
        let data_len = len - 4;
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
}
