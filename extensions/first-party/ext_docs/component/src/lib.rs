// ext_docs — repo-resident docs WASM extension.
//
// The kernel owns CUE evaluation and repo file enumeration. This component
// owns document semantics, starting with the shared MDX front-matter summary
// used by ADR, spec, PRD, scenario, and user-defined doc surfaces.

mod bindings;

use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_docs::docs::{
    DocSummary, Guest as DocsGuest, SummarizeDocInput,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

const MAX_PREVIEW_LEN: usize = 1_048_576;
const EXCERPT_CHARS: usize = 180;

struct Component;

fn err(code: ErrorCode, message: impl Into<String>) -> Error {
    Error {
        code,
        message: message.into(),
        path: None,
    }
}

fn summarize_preview(path: &str, preview: &str) -> DocSummary {
    let (has_front_matter, properties, body) = parse_front_matter(preview);
    let title = properties
        .iter()
        .find_map(|(key, value)| (key == "title" && !value.is_empty()).then(|| value.clone()))
        .unwrap_or_else(|| fallback_title(path));

    DocSummary {
        path: path.to_string(),
        title,
        property_count: properties.len() as u32,
        body_excerpt: body_excerpt(body),
        has_front_matter,
    }
}

fn parse_front_matter(preview: &str) -> (bool, Vec<(String, String)>, &str) {
    if !preview.starts_with("---") {
        return (false, Vec::new(), preview);
    }
    let Some(end) = preview[3..].find("\n---").map(|idx| idx + 3) else {
        return (false, Vec::new(), preview);
    };
    let front = preview[3..end].trim();
    let body = preview[end + 4..].strip_prefix('\n').unwrap_or(&preview[end + 4..]);
    let mut properties = Vec::new();
    for line in front.lines() {
        let Some((raw_key, raw_value)) = line.split_once(':') else {
            continue;
        };
        let key = raw_key.trim();
        if key.is_empty() {
            continue;
        }
        properties.push((key.to_string(), clean_front_matter_value(raw_value)));
    }
    (true, properties, body)
}

fn clean_front_matter_value(raw: &str) -> String {
    raw.trim()
        .trim_matches('"')
        .trim_matches('\'')
        .trim()
        .to_string()
}

fn fallback_title(path: &str) -> String {
    path.rsplit('/')
        .next()
        .filter(|name| !name.is_empty())
        .unwrap_or("(untitled)")
        .to_string()
}

fn body_excerpt(body: &str) -> String {
    let collapsed = body.split_whitespace().collect::<Vec<_>>().join(" ");
    let mut out = collapsed.chars().take(EXCERPT_CHARS).collect::<String>();
    if collapsed.chars().count() > EXCERPT_CHARS {
        out.push_str("...");
    }
    out
}

impl DocsGuest for Component {
    fn ping() -> Result<String, Error> {
        Ok("ok".to_string())
    }

    fn summarize_doc(input: SummarizeDocInput) -> Result<DocSummary, Error> {
        let path = input.path.trim();
        if path.is_empty() {
            return Err(err(ErrorCode::BadInput, "doc path must not be empty"));
        }
        if input.preview.len() > MAX_PREVIEW_LEN {
            return Err(err(
                ErrorCode::BadInput,
                format!("doc preview must be at most {MAX_PREVIEW_LEN} bytes"),
            ));
        }
        Ok(summarize_preview(path, &input.preview))
    }
}

impl ReactorGuest for Component {
    fn subscribed_event_types() -> Result<Vec<String>, Error> {
        Ok(Vec::new())
    }

    fn on_event(_triggering_event: Event) -> Result<Vec<Reaction>, Error> {
        Ok(Vec::new())
    }
}

bindings::export!(Component with_types_in bindings);

#[cfg(test)]
mod tests {
    use super::summarize_preview;

    #[test]
    fn summary_uses_front_matter_title_and_excerpt() {
        let summary = summarize_preview(
            "crates/server/docs/specs/extension-runtime.mdx",
            "---\ntitle: Extension runtime\nowner: platform-maintainers\nstatus: shipping\n---\n\nFirst-party extensions are Component Model WASM components loaded by Wasmtime.",
        );

        assert_eq!(summary.path, "crates/server/docs/specs/extension-runtime.mdx");
        assert_eq!(summary.title, "Extension runtime");
        assert_eq!(summary.property_count, 3);
        assert!(summary.has_front_matter);
        assert!(summary.body_excerpt.starts_with("First-party extensions"));
    }

    #[test]
    fn summary_falls_back_to_filename_without_front_matter() {
        let summary = summarize_preview("docs/plain-note.mdx", "No front matter here.");

        assert_eq!(summary.title, "plain-note.mdx");
        assert_eq!(summary.property_count, 0);
        assert!(!summary.has_front_matter);
        assert_eq!(summary.body_excerpt, "No front matter here.");
    }
}
