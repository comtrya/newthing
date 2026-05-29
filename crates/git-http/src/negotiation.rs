//! Placeholder for v2 negotiation logic (ls-refs and fetch command parsing).

#[derive(Debug, Default)]
pub struct Capabilities {
    pub thin_pack: bool,
    pub ofs_delta: bool,
    pub side_band_64k: bool,
}
