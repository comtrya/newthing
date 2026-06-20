// ext_docs — repo-resident docs WASM extension.
//
// The kernel owns CUE evaluation and repo file enumeration. This component
// owns document semantics, starting with the shared MDX front-matter summary
// used by ADR, spec, PRD, scenario, and user-defined doc surfaces.

mod bindings;

use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_docs::docs::{
    DocCatalog, DocCatalogInput, DocProperty, DocStatusBoard, DocStatusCard, DocStatusColumn,
    DocSummary, DocTypeInput, DocTypeSummary, Guest as DocsGuest, SummarizeDocInput,
};
use bindings::exports::comtrya::platform::reactor::{Guest as ReactorGuest, Reaction};

const MAX_PREVIEW_LEN: usize = 1_048_576;
const MAX_CATALOG_TYPES: usize = 256;
const MAX_CATALOG_DOCS: usize = 4_096;
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
        properties: properties
            .into_iter()
            .map(|(key, value)| DocProperty { key, value })
            .collect(),
        body_excerpt: body_excerpt(body),
        has_front_matter,
    }
}

fn summarize_catalog(input: DocCatalogInput) -> Result<DocCatalog, Error> {
    if input.types.len() > MAX_CATALOG_TYPES {
        return Err(err(
            ErrorCode::BadInput,
            format!("doc catalog must contain at most {MAX_CATALOG_TYPES} types"),
        ));
    }

    let total_files = input
        .types
        .iter()
        .map(|doc_type| doc_type.files.len())
        .sum::<usize>();
    if total_files > MAX_CATALOG_DOCS {
        return Err(err(
            ErrorCode::BadInput,
            format!("doc catalog must contain at most {MAX_CATALOG_DOCS} docs"),
        ));
    }

    let mut total_docs = 0_u32;
    let mut types = Vec::with_capacity(input.types.len());
    for doc_type in input.types {
        let summary = summarize_doc_type(doc_type)?;
        total_docs += summary.doc_count;
        types.push(summary);
    }

    Ok(DocCatalog { total_docs, types })
}

fn status_board(input: DocCatalogInput) -> Result<DocStatusBoard, Error> {
    let catalog = summarize_catalog(input)?;
    let mut draft = Vec::new();
    let mut active = Vec::new();
    let mut done = Vec::new();
    let mut other = Vec::new();
    let mut missing = Vec::new();

    for doc_type in &catalog.types {
        for doc in &doc_type.docs {
            let card = status_card(doc_type, doc);
            match status_lane(&card.status) {
                StatusLane::Draft => draft.push(card),
                StatusLane::Active => active.push(card),
                StatusLane::Done => done.push(card),
                StatusLane::Other => other.push(card),
                StatusLane::Missing => missing.push(card),
            }
        }
    }

    let mut columns = vec![
        status_column("draft", "Draft", draft),
        status_column("active", "Active", active),
        status_column("done", "Done", done),
    ];
    if !other.is_empty() {
        columns.push(status_column("other", "Other", other));
    }
    if !missing.is_empty() {
        columns.push(status_column("missing", "Missing status", missing));
    }

    Ok(DocStatusBoard {
        total_docs: catalog.total_docs,
        columns,
    })
}

fn summarize_doc_type(input: DocTypeInput) -> Result<DocTypeSummary, Error> {
    let project_name = required_field("project name", input.project_name)?;
    let type_name = required_field("doc type name", input.type_name)?;
    let slug = required_field("doc type slug", input.slug)?;
    let label = clean_optional_label(input.label).unwrap_or_else(|| type_name.clone());
    let description = input.description.and_then(clean_optional_label);

    let mut docs = Vec::with_capacity(input.files.len());
    for file in input.files {
        let path = validate_doc_path(file.path)?;
        validate_preview_len(&file.preview)?;
        docs.push(summarize_preview(&path, &file.preview));
    }

    Ok(DocTypeSummary {
        project_name,
        type_name,
        label,
        description,
        slug,
        doc_count: docs.len() as u32,
        docs,
    })
}

fn status_card(doc_type: &DocTypeSummary, doc: &DocSummary) -> DocStatusCard {
    let status = property_value(doc, "status").unwrap_or_default();
    DocStatusCard {
        project_name: doc_type.project_name.clone(),
        type_name: doc_type.type_name.clone(),
        type_label: doc_type.label.clone(),
        path: doc.path.clone(),
        title: doc.title.clone(),
        owner: property_value(doc, "owner"),
        status,
    }
}

fn property_value(doc: &DocSummary, key: &str) -> Option<String> {
    doc.properties
        .iter()
        .find_map(|property| {
            property
                .key
                .eq_ignore_ascii_case(key)
                .then(|| property.value.trim())
        })
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn status_column(
    key: impl Into<String>,
    label: impl Into<String>,
    docs: Vec<DocStatusCard>,
) -> DocStatusColumn {
    DocStatusColumn {
        key: key.into(),
        label: label.into(),
        count: docs.len() as u32,
        docs,
    }
}

enum StatusLane {
    Draft,
    Active,
    Done,
    Other,
    Missing,
}

fn status_lane(status: &str) -> StatusLane {
    match normalize_status(status).as_str() {
        "" => StatusLane::Missing,
        "draft" | "planned" | "planning" | "proposed" | "todo" | "backlog" => StatusLane::Draft,
        "accepted" | "active" | "in-progress" | "ready" | "review" | "shipping" => {
            StatusLane::Active
        }
        "closed" | "complete" | "completed" | "done" | "shipped" => StatusLane::Done,
        _ => StatusLane::Other,
    }
}

fn normalize_status(status: &str) -> String {
    status.trim().to_ascii_lowercase().replace([' ', '_'], "-")
}

fn required_field(label: &str, value: String) -> Result<String, Error> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        return Err(err(
            ErrorCode::BadInput,
            format!("{label} must not be empty"),
        ));
    }
    Ok(trimmed.to_string())
}

fn clean_optional_label(value: String) -> Option<String> {
    let trimmed = value.trim();
    (!trimmed.is_empty()).then(|| trimmed.to_string())
}

fn validate_doc_path(path: String) -> Result<String, Error> {
    let path = path.trim();
    if path.is_empty() {
        return Err(err(ErrorCode::BadInput, "doc path must not be empty"));
    }
    Ok(path.to_string())
}

fn validate_preview_len(preview: &str) -> Result<(), Error> {
    if preview.len() > MAX_PREVIEW_LEN {
        return Err(err(
            ErrorCode::BadInput,
            format!("doc preview must be at most {MAX_PREVIEW_LEN} bytes"),
        ));
    }
    Ok(())
}

fn parse_front_matter(preview: &str) -> (bool, Vec<(String, String)>, &str) {
    if !preview.starts_with("---") {
        return (false, Vec::new(), preview);
    }
    let Some(end) = preview[3..].find("\n---").map(|idx| idx + 3) else {
        return (false, Vec::new(), preview);
    };
    let front = preview[3..end].trim();
    let body = preview[end + 4..]
        .strip_prefix('\n')
        .unwrap_or(&preview[end + 4..]);
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
        let path = validate_doc_path(input.path)?;
        validate_preview_len(&input.preview)?;
        Ok(summarize_preview(&path, &input.preview))
    }

    fn summarize_catalog(input: DocCatalogInput) -> Result<DocCatalog, Error> {
        crate::summarize_catalog(input)
    }

    fn status_board(input: DocCatalogInput) -> Result<DocStatusBoard, Error> {
        crate::status_board(input)
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
    use super::bindings::exports::comtrya::ext_docs::docs::{
        DocCatalogInput, DocTypeInput, SummarizeDocInput,
    };

    use super::{status_board, summarize_catalog, summarize_preview, MAX_CATALOG_DOCS};

    #[test]
    fn summary_uses_front_matter_title_and_excerpt() {
        let summary = summarize_preview(
            "crates/server/docs/specs/extension-runtime.mdx",
            "---\ntitle: Extension runtime\nowner: platform-maintainers\nstatus: shipping\n---\n\nFirst-party extensions are Component Model WASM components loaded by Wasmtime.",
        );

        assert_eq!(
            summary.path,
            "crates/server/docs/specs/extension-runtime.mdx"
        );
        assert_eq!(summary.title, "Extension runtime");
        assert_eq!(summary.property_count, 3);
        assert_eq!(summary.properties.len(), 3);
        assert_eq!(summary.properties[0].key, "title");
        assert_eq!(summary.properties[0].value, "Extension runtime");
        assert_eq!(summary.properties[1].key, "owner");
        assert_eq!(summary.properties[1].value, "platform-maintainers");
        assert!(summary.has_front_matter);
        assert!(summary.body_excerpt.starts_with("First-party extensions"));
    }

    #[test]
    fn summary_falls_back_to_filename_without_front_matter() {
        let summary = summarize_preview("docs/plain-note.mdx", "No front matter here.");

        assert_eq!(summary.title, "plain-note.mdx");
        assert_eq!(summary.property_count, 0);
        assert!(summary.properties.is_empty());
        assert!(!summary.has_front_matter);
        assert_eq!(summary.body_excerpt, "No front matter here.");
    }

    #[test]
    fn catalog_groups_project_doc_types_and_summaries() {
        let catalog = summarize_catalog(DocCatalogInput {
            types: vec![
                DocTypeInput {
                    project_name: "backend".to_string(),
                    type_name: "prd".to_string(),
                    label: "Backend PRDs".to_string(),
                    description: Some("Product requirements".to_string()),
                    slug: "server/docs/prds".to_string(),
                    files: vec![SummarizeDocInput {
                        path: "crates/server/docs/prds/repository-docs-surface.mdx".to_string(),
                        preview:
                            "---\ntitle: Repository Docs Surface\nstatus: active\n---\n\nDevelopers expect a forge to keep product intent beside implementation."
                                .to_string(),
                    }],
                },
                DocTypeInput {
                    project_name: "backend".to_string(),
                    type_name: "scenario".to_string(),
                    label: "BDD Scenarios".to_string(),
                    description: None,
                    slug: "server/docs/scenarios".to_string(),
                    files: vec![SummarizeDocInput {
                        path: "crates/server/docs/scenarios/repository-docs-surface.mdx"
                            .to_string(),
                        preview:
                            "---\ntitle: Repository docs are discoverable\nfeature: repository-docs\n---\n\nGiven the Comtrya repository has opted into ext_docs"
                                .to_string(),
                    }],
                },
            ],
        })
        .expect("catalog should summarize");

        assert_eq!(catalog.total_docs, 2);
        assert_eq!(catalog.types.len(), 2);
        assert_eq!(catalog.types[0].project_name, "backend");
        assert_eq!(catalog.types[0].type_name, "prd");
        assert_eq!(catalog.types[0].doc_count, 1);
        assert_eq!(catalog.types[0].docs[0].title, "Repository Docs Surface");
        assert_eq!(catalog.types[1].type_name, "scenario");
        assert_eq!(catalog.types[1].docs[0].properties[1].key, "feature");
    }

    #[test]
    fn catalog_rejects_empty_type_metadata() {
        let err = summarize_catalog(DocCatalogInput {
            types: vec![DocTypeInput {
                project_name: "backend".to_string(),
                type_name: " ".to_string(),
                label: String::new(),
                description: None,
                slug: "server/docs/prds".to_string(),
                files: Vec::new(),
            }],
        })
        .expect_err("empty type name should be rejected");

        assert!(err.message.contains("doc type name"));
    }

    #[test]
    fn catalog_rejects_too_many_docs() {
        let files = (0..=MAX_CATALOG_DOCS)
            .map(|idx| SummarizeDocInput {
                path: format!("docs/{idx}.mdx"),
                preview: "body".to_string(),
            })
            .collect();

        let err = summarize_catalog(DocCatalogInput {
            types: vec![DocTypeInput {
                project_name: "backend".to_string(),
                type_name: "spec".to_string(),
                label: "Specs".to_string(),
                description: None,
                slug: "server/docs/specs".to_string(),
                files,
            }],
        })
        .expect_err("catalog limit should be enforced");

        assert!(err.message.contains("4096"));
    }

    #[test]
    fn status_board_groups_docs_by_front_matter_status() {
        let board = status_board(DocCatalogInput {
            types: vec![
                DocTypeInput {
                    project_name: "backend".to_string(),
                    type_name: "prd".to_string(),
                    label: "Backend PRDs".to_string(),
                    description: None,
                    slug: "server/docs/prds".to_string(),
                    files: vec![
                        SummarizeDocInput {
                            path: "crates/server/docs/prds/repository-docs-surface.mdx"
                                .to_string(),
                            preview:
                                "---\ntitle: Repository Docs Surface\nowner: platform-maintainers\nstatus: active\n---\n\nIntent."
                                    .to_string(),
                        },
                        SummarizeDocInput {
                            path: "crates/server/docs/prds/repository-docs-next.mdx"
                                .to_string(),
                            preview: "---\ntitle: Next Docs Surface\nstatus: planned\n---\n\nIntent."
                                .to_string(),
                        },
                    ],
                },
                DocTypeInput {
                    project_name: "backend".to_string(),
                    type_name: "scenario".to_string(),
                    label: "BDD Scenarios".to_string(),
                    description: None,
                    slug: "server/docs/scenarios".to_string(),
                    files: vec![
                        SummarizeDocInput {
                            path: "crates/server/docs/scenarios/repository-docs-surface.mdx"
                                .to_string(),
                            preview:
                                "---\ntitle: Repository docs are discoverable\nstatus: shipped\n---\n\nGiven..."
                                    .to_string(),
                        },
                        SummarizeDocInput {
                            path: "crates/server/docs/scenarios/missing-status.mdx".to_string(),
                            preview: "---\ntitle: Missing Status\n---\n\nGiven...".to_string(),
                        },
                    ],
                },
            ],
        })
        .expect("status board should summarize");

        assert_eq!(board.total_docs, 4);
        let draft = board
            .columns
            .iter()
            .find(|column| column.key == "draft")
            .expect("draft column");
        assert_eq!(draft.count, 1);
        assert_eq!(draft.docs[0].title, "Next Docs Surface");

        let active = board
            .columns
            .iter()
            .find(|column| column.key == "active")
            .expect("active column");
        assert_eq!(active.count, 1);
        assert_eq!(
            active.docs[0].owner.as_deref(),
            Some("platform-maintainers")
        );
        assert_eq!(active.docs[0].type_label, "Backend PRDs");

        let done = board
            .columns
            .iter()
            .find(|column| column.key == "done")
            .expect("done column");
        assert_eq!(done.count, 1);

        let missing = board
            .columns
            .iter()
            .find(|column| column.key == "missing")
            .expect("missing status column");
        assert_eq!(missing.count, 1);
        assert_eq!(missing.docs[0].status, "");
    }
}
