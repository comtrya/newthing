//! Time formatting for kernel timestamps.
//!
//! Kernel records (events, jobs) stamp wall-clock time supplied by the caller
//! as a Unix-epoch millisecond value, which this module renders as an RFC3339
//! UTC string. Keeping the formatting here means callers thread a real clock in
//! (`now_ms`) rather than baking in a fixed epoch literal.

/// Return the current wall-clock time as Unix-epoch milliseconds.
/// Uses `std::time::SystemTime` so callers do not need to import it.
/// Returns 0 in the astronomically unlikely case the system clock is
/// before the Unix epoch (pre-1970 hardware or a misconfigured clock).
pub fn now_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

/// Render a Unix-epoch millisecond timestamp as an RFC3339 UTC string with
/// millisecond precision (`YYYY-MM-DDTHH:MM:SS.mmmZ`).
pub fn millis_to_rfc3339(millis: u64) -> String {
    let secs = millis / 1_000;
    let ms = millis % 1_000;
    let days = secs / 86_400;
    let rem = secs % 86_400;
    let h = rem / 3_600;
    let m = (rem % 3_600) / 60;
    let s = rem % 60;
    let (y, mo, d) = days_to_ymd(days as i64 + 719_468);
    format!("{y:04}-{mo:02}-{d:02}T{h:02}:{m:02}:{s:02}.{ms:03}Z")
}

/// Convert a day count in the proleptic Gregorian calendar (shifted so that
/// `0` maps to 0000-03-01) into a `(year, month, day)` triple. Algorithm from
/// Howard Hinnant's `civil_from_days`.
fn days_to_ymd(g: i64) -> (i64, u32, u32) {
    let era = g.div_euclid(146_097);
    let doe = g.rem_euclid(146_097) as u64;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = (if mp < 10 { mp + 3 } else { mp - 9 }) as u32;
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_epoch() {
        assert_eq!(millis_to_rfc3339(0), "1970-01-01T00:00:00.000Z");
    }

    #[test]
    fn formats_known_instant() {
        // 2021-01-01T00:00:00.000Z == 1_609_459_200_000 ms.
        assert_eq!(
            millis_to_rfc3339(1_609_459_200_000),
            "2021-01-01T00:00:00.000Z"
        );
    }

    #[test]
    fn preserves_millis_and_time_of_day() {
        // 2021-01-01T12:34:56.789Z.
        let millis = 1_609_459_200_000 + (12 * 3_600 + 34 * 60 + 56) * 1_000 + 789;
        assert_eq!(millis_to_rfc3339(millis), "2021-01-01T12:34:56.789Z");
    }

    #[test]
    fn now_ms_is_post_epoch() {
        // A real clock must be well past 2024-01-01 (1_704_067_200_000 ms).
        // The test uses a floor far enough in the past that it passes on any
        // correctly-set host without relying on a live wall-clock comparison.
        let floor_ms: u64 = 1_704_067_200_000; // 2024-01-01T00:00:00Z
        assert!(
            now_ms() > floor_ms,
            "system clock appears to be before 2024"
        );
    }
}
