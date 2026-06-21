// ext_docs — repo-resident docs WASM extension.
//
// The kernel owns CUE evaluation and repo file enumeration. This component
// owns document semantics, starting with the shared MDX front-matter summary
// used by ADR, spec, PRD, scenario, and user-defined doc surfaces.

mod bindings;

use std::collections::{BTreeMap, HashMap};

use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_docs::docs::{
    BddScenario, BddStep, BddSummary, DocCatalog, DocCatalogInput, DocChecklistItem,
    DocChecklistSection, DocChecklistSummary, DocDecisionBoard, DocDecisionCard, DocDecisionColumn,
    DocDecisionItem, DocDecisionSummary, DocHandoffBoard, DocHandoffCard, DocHandoffColumn,
    DocOutlineHeading, DocOutlineSummary, DocOwnerBoard, DocOwnerCard, DocOwnerColumn,
    DocProjectBoard, DocProjectCard, DocProjectColumn, DocProperty, DocReadinessBoard,
    DocReadinessCard, DocReadinessColumn, DocReference, DocReferenceSummary, DocScenarioBoard,
    DocScenarioCard, DocScenarioColumn, DocStatusBoard, DocStatusCard, DocStatusColumn, DocSummary,
    DocTagBoard, DocTagCard, DocTagColumn, DocTraceabilityBoard, DocTraceabilityCard,
    DocTraceabilityColumn, DocTypeBoard, DocTypeCard, DocTypeColumn, DocTypeInput, DocTypeSummary,
    Guest as DocsGuest, SummarizeDocInput,
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
    validate_catalog_size(&input)?;

    let mut total_docs = 0_u32;
    let mut types = Vec::with_capacity(input.types.len());
    for doc_type in input.types {
        let summary = summarize_doc_type(doc_type)?;
        total_docs += summary.doc_count;
        types.push(summary);
    }

    Ok(DocCatalog { total_docs, types })
}

fn type_board(input: DocCatalogInput) -> Result<DocTypeBoard, Error> {
    let catalog = summarize_catalog(input)?;
    let mut by_type = BTreeMap::<String, (String, String, Vec<DocTypeCard>)>::new();

    for doc_type in &catalog.types {
        let key = doc_type_key(&doc_type.type_name);
        let entry = by_type.entry(key).or_insert_with(|| {
            (
                doc_type.label.clone(),
                doc_type.type_name.clone(),
                Vec::new(),
            )
        });
        if entry.0 != doc_type.label {
            entry.0 = entry.1.clone();
        }

        for doc in &doc_type.docs {
            entry.2.push(type_card(doc_type, doc));
        }
    }

    let columns = by_type
        .into_iter()
        .map(|(key, (label, type_name, docs))| {
            type_column(format!("type-{key}"), label, type_name, docs)
        })
        .collect();

    Ok(DocTypeBoard {
        total_docs: catalog.total_docs,
        columns,
    })
}

fn validate_catalog_size(input: &DocCatalogInput) -> Result<(), Error> {
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

    Ok(())
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

fn owner_board(input: DocCatalogInput) -> Result<DocOwnerBoard, Error> {
    let catalog = summarize_catalog(input)?;
    let mut owned = BTreeMap::<String, (String, Vec<DocOwnerCard>)>::new();
    let mut unowned = Vec::new();

    for doc_type in &catalog.types {
        for doc in &doc_type.docs {
            let card = owner_card(doc_type, doc);
            if let Some(owner) = card.owner.as_ref() {
                let key = owner_key(owner);
                let entry = owned
                    .entry(key)
                    .or_insert_with(|| (owner.to_string(), Vec::new()));
                entry.1.push(card);
            } else {
                unowned.push(card);
            }
        }
    }

    let mut columns = vec![owner_column("unowned", "Unowned", None, unowned)];
    columns.extend(owned.into_iter().map(|(key, (owner, docs))| {
        owner_column(format!("owner-{key}"), owner.clone(), Some(owner), docs)
    }));

    Ok(DocOwnerBoard {
        total_docs: catalog.total_docs,
        columns,
    })
}

fn tag_board(input: DocCatalogInput) -> Result<DocTagBoard, Error> {
    let catalog = summarize_catalog(input)?;
    let mut tagged = BTreeMap::<String, (String, Vec<DocTagCard>)>::new();
    let mut untagged = Vec::new();

    for doc_type in &catalog.types {
        for doc in &doc_type.docs {
            let card = tag_card(doc_type, doc);
            if card.tags.is_empty() {
                untagged.push(card);
                continue;
            }

            for tag in &card.tags {
                let key = tag_key(tag);
                let entry = tagged
                    .entry(key)
                    .or_insert_with(|| (tag.to_string(), Vec::new()));
                entry.1.push(card.clone());
            }
        }
    }

    let mut columns = vec![tag_column("untagged", "Untagged", None, untagged)];
    columns.extend(
        tagged.into_iter().map(|(key, (tag, docs))| {
            tag_column(format!("tag-{key}"), tag.clone(), Some(tag), docs)
        }),
    );

    Ok(DocTagBoard {
        total_docs: catalog.total_docs,
        columns,
    })
}

fn project_board(input: DocCatalogInput) -> Result<DocProjectBoard, Error> {
    validate_catalog_size(&input)?;

    let mut scoped = BTreeMap::<String, (String, Vec<DocProjectCard>)>::new();
    let mut unscoped = Vec::new();
    let mut total_docs = 0_u32;

    for doc_type in input.types {
        let project_name = clean_optional_label(doc_type.project_name);
        let type_name = required_field("doc type name", doc_type.type_name)?;
        let label = clean_optional_label(doc_type.label).unwrap_or_else(|| type_name.clone());
        required_field("doc type slug", doc_type.slug)?;

        for file in doc_type.files {
            let path = validate_doc_path(file.path)?;
            validate_preview_len(&file.preview)?;

            let summary = summarize_preview(&path, &file.preview);
            let status = property_value(&summary, "status").unwrap_or_default();
            let owner = property_value(&summary, "owner");
            let tags = property_value(&summary, "tags")
                .map(|value| parse_tag_list(&value))
                .unwrap_or_default();
            let card = DocProjectCard {
                project_name: project_name.clone().unwrap_or_default(),
                type_name: type_name.clone(),
                type_label: label.clone(),
                path: summary.path,
                title: summary.title,
                status,
                owner,
                tags,
            };

            if let Some(project) = project_name.as_ref() {
                let key = project_key(project);
                let entry = scoped
                    .entry(key)
                    .or_insert_with(|| (project.to_string(), Vec::new()));
                entry.1.push(card);
            } else {
                unscoped.push(card);
            }

            total_docs += 1;
        }
    }

    let mut columns = vec![project_column("unscoped", "Unscoped", None, unscoped)];
    columns.extend(scoped.into_iter().map(|(key, (project, docs))| {
        project_column(
            format!("project-{key}"),
            project.clone(),
            Some(project),
            docs,
        )
    }));

    Ok(DocProjectBoard {
        total_docs,
        columns,
    })
}

fn readiness_board(input: DocCatalogInput) -> Result<DocReadinessBoard, Error> {
    validate_catalog_size(&input)?;

    let mut needs_criteria = Vec::new();
    let mut in_progress = Vec::new();
    let mut ready = Vec::new();
    let mut total_docs = 0_u32;

    for doc_type in input.types {
        let project_name = required_field("project name", doc_type.project_name)?;
        let type_name = required_field("doc type name", doc_type.type_name)?;
        let label = clean_optional_label(doc_type.label).unwrap_or_else(|| type_name.clone());
        required_field("doc type slug", doc_type.slug)?;

        for file in doc_type.files {
            let path = validate_doc_path(file.path)?;
            validate_preview_len(&file.preview)?;

            let summary = summarize_preview(&path, &file.preview);
            let checklists = summarize_checklists(SummarizeDocInput {
                path: path.clone(),
                preview: file.preview.clone(),
            })?;
            let scenarios = summarize_scenarios(SummarizeDocInput {
                path: path.clone(),
                preview: file.preview.clone(),
            })?;
            let references = summarize_references(SummarizeDocInput {
                path,
                preview: file.preview,
            })?;

            let status = property_value(&summary, "status").unwrap_or_default();
            let card = DocReadinessCard {
                project_name: project_name.clone(),
                type_name: type_name.clone(),
                type_label: label.clone(),
                path: summary.path,
                title: summary.title,
                status,
                checklist_total: checklists.total_items,
                checklist_checked: checklists.checked_items,
                scenario_count: scenarios.scenario_count,
                reference_count: references.reference_count,
            };

            match readiness_lane(&card) {
                ReadinessLane::NeedsCriteria => needs_criteria.push(card),
                ReadinessLane::InProgress => in_progress.push(card),
                ReadinessLane::Ready => ready.push(card),
            }
            total_docs += 1;
        }
    }

    Ok(DocReadinessBoard {
        total_docs,
        columns: vec![
            readiness_column("needs-criteria", "Needs criteria", needs_criteria),
            readiness_column("in-progress", "In progress", in_progress),
            readiness_column("ready", "Ready", ready),
        ],
    })
}

fn handoff_board(input: DocCatalogInput) -> Result<DocHandoffBoard, Error> {
    validate_catalog_size(&input)?;

    let mut needs_criteria = Vec::new();
    let mut needs_scenarios = Vec::new();
    let mut needs_product_review = Vec::new();
    let mut ready_for_implementation = Vec::new();
    let mut in_implementation = Vec::new();
    let mut total_docs = 0_u32;

    for doc_type in input.types {
        let project_name = required_field("project name", doc_type.project_name)?;
        let type_name = required_field("doc type name", doc_type.type_name)?;
        let label = clean_optional_label(doc_type.label).unwrap_or_else(|| type_name.clone());
        required_field("doc type slug", doc_type.slug)?;

        for file in doc_type.files {
            let path = validate_doc_path(file.path)?;
            validate_preview_len(&file.preview)?;

            let summary = summarize_preview(&path, &file.preview);
            let checklists = summarize_checklists(SummarizeDocInput {
                path: path.clone(),
                preview: file.preview.clone(),
            })?;
            let scenarios = summarize_scenarios(SummarizeDocInput {
                path: path.clone(),
                preview: file.preview.clone(),
            })?;
            let references = summarize_references(SummarizeDocInput {
                path: path.clone(),
                preview: file.preview.clone(),
            })?;
            let decisions = summarize_decisions(SummarizeDocInput {
                path,
                preview: file.preview,
            })?;
            let implementation_reference_count = references
                .references
                .iter()
                .filter(|reference| is_implementation_reference(&reference.kind))
                .count() as u32;
            let status = property_value(&summary, "status").unwrap_or_default();
            let card = DocHandoffCard {
                project_name: project_name.clone(),
                type_name: type_name.clone(),
                type_label: label.clone(),
                path: summary.path,
                title: summary.title,
                status,
                checklist_total: checklists.total_items,
                checklist_checked: checklists.checked_items,
                scenario_count: scenarios.scenario_count,
                implementation_reference_count,
                open_question_count: decisions.open_question_count,
                risk_count: decisions.risk_count,
            };

            match handoff_lane(&card) {
                HandoffLane::NeedsCriteria => needs_criteria.push(card),
                HandoffLane::NeedsScenarios => needs_scenarios.push(card),
                HandoffLane::NeedsProductReview => needs_product_review.push(card),
                HandoffLane::ReadyForImplementation => ready_for_implementation.push(card),
                HandoffLane::InImplementation => in_implementation.push(card),
            }
            total_docs += 1;
        }
    }

    Ok(DocHandoffBoard {
        total_docs,
        columns: vec![
            handoff_column("needs-criteria", "Needs criteria", needs_criteria),
            handoff_column("needs-scenarios", "Needs scenarios", needs_scenarios),
            handoff_column(
                "needs-product-review",
                "Needs product review",
                needs_product_review,
            ),
            handoff_column(
                "ready-for-implementation",
                "Ready for implementation",
                ready_for_implementation,
            ),
            handoff_column("in-implementation", "In implementation", in_implementation),
        ],
    })
}

fn decision_board(input: DocCatalogInput) -> Result<DocDecisionBoard, Error> {
    validate_catalog_size(&input)?;

    let mut open_questions = Vec::new();
    let mut risks = Vec::new();
    let mut decided = Vec::new();
    let mut missing_review_state = Vec::new();
    let mut total_docs = 0_u32;

    for doc_type in input.types {
        let project_name = required_field("project name", doc_type.project_name)?;
        let type_name = required_field("doc type name", doc_type.type_name)?;
        let label = clean_optional_label(doc_type.label).unwrap_or_else(|| type_name.clone());
        required_field("doc type slug", doc_type.slug)?;

        for file in doc_type.files {
            let path = validate_doc_path(file.path)?;
            validate_preview_len(&file.preview)?;

            let summary = summarize_preview(&path, &file.preview);
            let decisions = summarize_decisions(SummarizeDocInput {
                path,
                preview: file.preview,
            })?;
            let status = property_value(&summary, "status").unwrap_or_default();
            let card = DocDecisionCard {
                project_name: project_name.clone(),
                type_name: type_name.clone(),
                type_label: label.clone(),
                path: summary.path,
                title: summary.title,
                status,
                decision_count: decisions.decision_count,
                open_question_count: decisions.open_question_count,
                risk_count: decisions.risk_count,
            };

            match decision_lane(&card) {
                DecisionLane::OpenQuestions => open_questions.push(card),
                DecisionLane::Risks => risks.push(card),
                DecisionLane::Decided => decided.push(card),
                DecisionLane::MissingReviewState => missing_review_state.push(card),
            }
            total_docs += 1;
        }
    }

    Ok(DocDecisionBoard {
        total_docs,
        columns: vec![
            decision_column("open-questions", "Open questions", open_questions),
            decision_column("risks", "Risks", risks),
            decision_column("decided", "Decided", decided),
            decision_column(
                "missing-review-state",
                "Missing review state",
                missing_review_state,
            ),
        ],
    })
}

fn traceability_board(input: DocCatalogInput) -> Result<DocTraceabilityBoard, Error> {
    validate_catalog_size(&input)?;

    let mut unlinked = Vec::new();
    let mut implementation_linked = Vec::new();
    let mut doc_linked = Vec::new();
    let mut other_linked = Vec::new();
    let mut total_docs = 0_u32;

    for doc_type in input.types {
        let project_name = required_field("project name", doc_type.project_name)?;
        let type_name = required_field("doc type name", doc_type.type_name)?;
        let label = clean_optional_label(doc_type.label).unwrap_or_else(|| type_name.clone());
        required_field("doc type slug", doc_type.slug)?;

        for file in doc_type.files {
            let path = validate_doc_path(file.path)?;
            validate_preview_len(&file.preview)?;

            let summary = summarize_preview(&path, &file.preview);
            let references = summarize_references(SummarizeDocInput {
                path,
                preview: file.preview,
            })?;
            let implementation_reference_count = references
                .references
                .iter()
                .filter(|reference| is_implementation_reference(&reference.kind))
                .count() as u32;
            let doc_reference_count = references
                .references
                .iter()
                .filter(|reference| reference.kind == "doc")
                .count() as u32;
            let other_reference_count = references
                .reference_count
                .saturating_sub(implementation_reference_count + doc_reference_count);
            let status = property_value(&summary, "status").unwrap_or_default();
            let card = DocTraceabilityCard {
                project_name: project_name.clone(),
                type_name: type_name.clone(),
                type_label: label.clone(),
                path: summary.path,
                title: summary.title,
                status,
                reference_count: references.reference_count,
                implementation_reference_count,
                doc_reference_count,
                other_reference_count,
                references: references.references,
            };

            match traceability_lane(&card) {
                TraceabilityLane::Unlinked => unlinked.push(card),
                TraceabilityLane::ImplementationLinked => implementation_linked.push(card),
                TraceabilityLane::DocLinked => doc_linked.push(card),
                TraceabilityLane::OtherLinked => other_linked.push(card),
            }
            total_docs += 1;
        }
    }

    Ok(DocTraceabilityBoard {
        total_docs,
        columns: vec![
            traceability_column("unlinked", "Unlinked", unlinked),
            traceability_column(
                "implementation-linked",
                "Implementation linked",
                implementation_linked,
            ),
            traceability_column("doc-linked", "Doc linked", doc_linked),
            traceability_column("other-linked", "Other links", other_linked),
        ],
    })
}

fn scenario_board(input: DocCatalogInput) -> Result<DocScenarioBoard, Error> {
    validate_catalog_size(&input)?;

    let mut missing_feature = Vec::new();
    let mut missing_scenarios = Vec::new();
    let mut needs_steps = Vec::new();
    let mut ready = Vec::new();
    let mut total_docs = 0_u32;

    for doc_type in input.types {
        let project_name = required_field("project name", doc_type.project_name)?;
        let type_name = required_field("doc type name", doc_type.type_name)?;
        let label = clean_optional_label(doc_type.label).unwrap_or_else(|| type_name.clone());
        required_field("doc type slug", doc_type.slug)?;

        for file in doc_type.files {
            let path = validate_doc_path(file.path)?;
            validate_preview_len(&file.preview)?;

            let summary = summarize_preview(&path, &file.preview);
            let scenarios = summarize_scenarios(SummarizeDocInput {
                path,
                preview: file.preview,
            })?;
            let scenarios_without_steps = scenarios
                .scenarios
                .iter()
                .filter(|scenario| scenario.step_count == 0)
                .count() as u32;
            let status = property_value(&summary, "status").unwrap_or_default();
            let card = DocScenarioCard {
                project_name: project_name.clone(),
                type_name: type_name.clone(),
                type_label: label.clone(),
                path: summary.path,
                title: summary.title,
                status,
                feature: scenarios.feature,
                scenario_count: scenarios.scenario_count,
                step_count: scenarios.step_count,
                scenarios_without_steps,
            };

            match scenario_lane(&card) {
                ScenarioLane::MissingFeature => missing_feature.push(card),
                ScenarioLane::MissingScenarios => missing_scenarios.push(card),
                ScenarioLane::NeedsSteps => needs_steps.push(card),
                ScenarioLane::Ready => ready.push(card),
            }
            total_docs += 1;
        }
    }

    Ok(DocScenarioBoard {
        total_docs,
        columns: vec![
            scenario_column("missing-feature", "Missing feature", missing_feature),
            scenario_column("missing-scenarios", "Missing scenarios", missing_scenarios),
            scenario_column("needs-steps", "Needs steps", needs_steps),
            scenario_column("ready", "Ready", ready),
        ],
    })
}

fn summarize_scenarios(input: SummarizeDocInput) -> Result<BddSummary, Error> {
    let path = validate_doc_path(input.path)?;
    validate_preview_len(&input.preview)?;

    let (_has_front_matter, properties, body) = parse_front_matter(&input.preview);
    let title = front_matter_value(&properties, "title").unwrap_or_else(|| fallback_title(&path));
    let mut feature = front_matter_value(&properties, "feature");
    let mut scenarios = Vec::new();
    let mut current = None;

    for raw_line in body.lines() {
        let line = normalize_bdd_line(raw_line);
        if line.is_empty() || line.starts_with("```") || line.starts_with("~~~") {
            continue;
        }

        if let Some(raw_feature) = strip_ascii_prefix(line, "Feature:") {
            let cleaned = raw_feature.trim();
            if !cleaned.is_empty() {
                feature = Some(cleaned.to_string());
            }
            continue;
        }

        if let Some((kind, title)) = bdd_scenario_heading(line) {
            finish_bdd_scenario(&mut scenarios, &mut current);
            current = Some(BddScenarioDraft::new(kind, title));
            continue;
        }

        if let Some(step) = bdd_step(line) {
            current
                .get_or_insert_with(|| BddScenarioDraft::new("background", "Background"))
                .steps
                .push(step);
        }
    }

    finish_bdd_scenario(&mut scenarios, &mut current);
    let step_count = scenarios
        .iter()
        .map(|scenario| scenario.step_count)
        .sum::<u32>();

    Ok(BddSummary {
        path,
        title,
        feature,
        scenario_count: scenarios.len() as u32,
        step_count,
        scenarios,
    })
}

fn summarize_checklists(input: SummarizeDocInput) -> Result<DocChecklistSummary, Error> {
    let path = validate_doc_path(input.path)?;
    validate_preview_len(&input.preview)?;

    let (_has_front_matter, properties, body) = parse_front_matter(&input.preview);
    let title = front_matter_value(&properties, "title").unwrap_or_else(|| fallback_title(&path));
    let mut sections = Vec::new();
    let mut current_heading = None;
    let mut in_fence = false;

    for raw_line in body.lines() {
        let line = normalize_markdown_line(raw_line);
        if line.starts_with("```") || line.starts_with("~~~") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence || line.is_empty() {
            continue;
        }

        if let Some(heading) = markdown_heading(line) {
            current_heading = Some(heading);
            continue;
        }

        if let Some(item) = checklist_item(line) {
            push_checklist_item(&mut sections, current_heading.as_deref(), item);
        }
    }

    let sections = sections
        .into_iter()
        .map(DocChecklistSectionDraft::finish)
        .collect::<Vec<_>>();
    let total_items = sections
        .iter()
        .map(|section| section.item_count)
        .sum::<u32>();
    let checked_items = sections
        .iter()
        .map(|section| section.checked_count)
        .sum::<u32>();

    Ok(DocChecklistSummary {
        path,
        title,
        total_items,
        checked_items,
        sections,
    })
}

fn summarize_references(input: SummarizeDocInput) -> Result<DocReferenceSummary, Error> {
    let path = validate_doc_path(input.path)?;
    validate_preview_len(&input.preview)?;

    let (_has_front_matter, properties, body) = parse_front_matter(&input.preview);
    let title = front_matter_value(&properties, "title").unwrap_or_else(|| fallback_title(&path));
    let mut references = Vec::new();
    let mut in_fence = false;

    for (line_index, raw_line) in body.lines().enumerate() {
        let line = normalize_markdown_line(raw_line);
        if line.starts_with("```") || line.starts_with("~~~") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence || line.is_empty() {
            continue;
        }

        let line_number = line_index as u32 + 1;
        extract_markdown_link_references(line, line_number, &mut references);
        extract_plain_uri_references(line, line_number, &mut references);
        extract_issue_number_references(line, line_number, &mut references);
    }

    Ok(DocReferenceSummary {
        path,
        title,
        reference_count: references.len() as u32,
        references,
    })
}

fn summarize_outline(input: SummarizeDocInput) -> Result<DocOutlineSummary, Error> {
    let path = validate_doc_path(input.path)?;
    validate_preview_len(&input.preview)?;

    let (_has_front_matter, properties, body) = parse_front_matter(&input.preview);
    let title = front_matter_value(&properties, "title").unwrap_or_else(|| fallback_title(&path));
    let mut headings = Vec::new();
    let mut slug_counts = HashMap::new();
    let mut in_fence = false;

    for (line_index, raw_line) in body.lines().enumerate() {
        let line = normalize_markdown_line(raw_line);
        if line.starts_with("```") || line.starts_with("~~~") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence || line.is_empty() {
            continue;
        }

        if let Some((level, title)) = markdown_heading_with_level(line) {
            let slug = unique_heading_slug(heading_slug(&title), &mut slug_counts);
            headings.push(DocOutlineHeading {
                level,
                title,
                slug,
                line: line_index as u32 + 1,
            });
        }
    }

    Ok(DocOutlineSummary {
        path,
        title,
        heading_count: headings.len() as u32,
        headings,
    })
}

fn summarize_decisions(input: SummarizeDocInput) -> Result<DocDecisionSummary, Error> {
    let path = validate_doc_path(input.path)?;
    validate_preview_len(&input.preview)?;

    let (_has_front_matter, properties, body) = parse_front_matter(&input.preview);
    let title = front_matter_value(&properties, "title").unwrap_or_else(|| fallback_title(&path));
    let mut items = Vec::new();
    let mut current_kind = None;
    let mut in_fence = false;

    for (line_index, raw_line) in body.lines().enumerate() {
        let line = normalize_markdown_line(raw_line);
        if line.starts_with("```") || line.starts_with("~~~") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence || line.is_empty() {
            continue;
        }

        let line_number = line_index as u32 + 1;
        if let Some((_level, heading)) = markdown_heading_with_level(line) {
            current_kind = decision_heading_kind(&heading);
            if let Some((kind, text)) = prefixed_decision_text(&heading) {
                push_decision_item(&mut items, kind, text, line_number);
            }
            continue;
        }

        if let Some((kind, text)) = prefixed_decision_text(line) {
            push_decision_item(&mut items, kind, text, line_number);
            continue;
        }

        if let Some(kind) = current_kind {
            if let Some(text) = section_decision_text(line) {
                push_decision_item(&mut items, kind, text, line_number);
            }
        }
    }

    Ok(DocDecisionSummary {
        path,
        title,
        decision_count: decision_kind_count(&items, "decision"),
        open_question_count: decision_kind_count(&items, "open-question"),
        risk_count: decision_kind_count(&items, "risk"),
        items,
    })
}

fn decision_heading_kind(title: &str) -> Option<&'static str> {
    match heading_slug(title).as_str() {
        "decision" | "decisions" | "design-decisions" | "accepted-decisions" => Some("decision"),
        "open-question" | "open-questions" | "questions" | "unknowns" => Some("open-question"),
        "risk" | "risks" | "risk-mitigations" | "risks-mitigations" => Some("risk"),
        _ => None,
    }
}

fn prefixed_decision_text(line: &str) -> Option<(&'static str, String)> {
    let line = strip_task_marker(strip_markdown_list_marker(line).unwrap_or(line)).trim();
    [
        ("Decision:", "decision"),
        ("Decided:", "decision"),
        ("Open question:", "open-question"),
        ("Question:", "open-question"),
        ("Risk:", "risk"),
    ]
    .into_iter()
    .find_map(|(prefix, kind)| {
        strip_ascii_prefix(line, prefix)
            .and_then(|text| clean_optional_label(text.to_string()).map(|cleaned| (kind, cleaned)))
    })
}

fn section_decision_text(line: &str) -> Option<String> {
    let text = strip_markdown_list_marker(line)?;
    clean_optional_label(strip_task_marker(text).to_string())
}

fn strip_task_marker(text: &str) -> &str {
    let text = text.trim();
    ["[ ]", "[x]", "[X]"]
        .into_iter()
        .find_map(|prefix| text.strip_prefix(prefix))
        .map(str::trim)
        .unwrap_or(text)
}

fn push_decision_item(
    items: &mut Vec<DocDecisionItem>,
    kind: &'static str,
    text: String,
    line: u32,
) {
    items.push(DocDecisionItem {
        kind: kind.to_string(),
        text,
        line,
    });
}

fn decision_kind_count(items: &[DocDecisionItem], kind: &str) -> u32 {
    items.iter().filter(|item| item.kind == kind).count() as u32
}

fn extract_markdown_link_references(
    line: &str,
    line_number: u32,
    references: &mut Vec<DocReference>,
) {
    let mut remaining = line;
    while let Some(open_label) = remaining.find('[') {
        let after_open = &remaining[open_label + 1..];
        let Some(close_label) = after_open.find(']') else {
            break;
        };
        let label = &after_open[..close_label];
        let after_label = &after_open[close_label + 1..];
        if !after_label.starts_with('(') {
            remaining = after_label;
            continue;
        }
        let after_open_target = &after_label[1..];
        let Some(close_target) = after_open_target.find(')') else {
            break;
        };
        let raw_target = after_open_target[..close_target]
            .split_whitespace()
            .next()
            .unwrap_or_default();
        if let Some(reference) = doc_reference(raw_target, Some(label), line_number) {
            push_reference_once(references, reference);
        }
        remaining = &after_open_target[close_target + 1..];
    }
}

fn extract_plain_uri_references(line: &str, line_number: u32, references: &mut Vec<DocReference>) {
    let mut search_start = 0;
    while let Some(offset) = line[search_start..].find("comtrya://") {
        let start = search_start + offset;
        if start > 0 && line.as_bytes()[start - 1] == b'(' {
            search_start = start + "comtrya://".len();
            continue;
        }

        let raw_target = reference_token(&line[start..]);
        if let Some(reference) = doc_reference(raw_target, None, line_number) {
            push_reference_once(references, reference);
        }
        search_start = start + raw_target.len().max("comtrya://".len());
    }
}

fn extract_issue_number_references(
    line: &str,
    line_number: u32,
    references: &mut Vec<DocReference>,
) {
    let bytes = line.as_bytes();
    let mut idx = 0;
    while idx < bytes.len() {
        if bytes[idx] != b'#' || idx + 1 >= bytes.len() || !bytes[idx + 1].is_ascii_digit() {
            idx += 1;
            continue;
        }
        if idx > 0 && is_reference_word_byte(bytes[idx - 1]) {
            idx += 1;
            continue;
        }

        let mut end = idx + 2;
        while end < bytes.len() && bytes[end].is_ascii_digit() {
            end += 1;
        }
        let target = &line[idx..end];
        if let Some(reference) = doc_reference(target, None, line_number) {
            push_reference_once(references, reference);
        }
        idx = end;
    }
}

fn reference_token(raw: &str) -> &str {
    let end = raw
        .find(|ch: char| {
            ch.is_ascii_whitespace()
                || matches!(ch, ')' | ']' | '}' | '>' | '"' | '\'' | '`' | ',' | ';')
        })
        .unwrap_or(raw.len());
    raw[..end].trim_end_matches(['.', '!', '?', ':'])
}

fn doc_reference(target: &str, label: Option<&str>, line: u32) -> Option<DocReference> {
    let target = target.trim();
    if target.is_empty() {
        return None;
    }

    let kind = reference_kind(target)?;
    let label = label.and_then(|value| clean_optional_label(value.to_string()));
    Some(DocReference {
        kind,
        target: target.to_string(),
        label,
        line,
    })
}

fn reference_kind(target: &str) -> Option<String> {
    if target.starts_with('#') && target[1..].chars().all(|ch| ch.is_ascii_digit()) {
        return Some("issue-number".to_string());
    }

    let rest = target.strip_prefix("comtrya://")?;
    let kind = rest.split('/').next().unwrap_or_default().trim();
    (!kind.is_empty()).then(|| kind.to_string())
}

fn push_reference_once(references: &mut Vec<DocReference>, reference: DocReference) {
    if references
        .iter()
        .any(|existing| existing.target == reference.target && existing.line == reference.line)
    {
        return;
    }
    references.push(reference);
}

fn is_reference_word_byte(byte: u8) -> bool {
    byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-')
}

struct DocChecklistSectionDraft {
    heading: String,
    items: Vec<DocChecklistItem>,
}

impl DocChecklistSectionDraft {
    fn new(heading: impl Into<String>) -> Self {
        Self {
            heading: heading.into(),
            items: Vec::new(),
        }
    }

    fn finish(self) -> DocChecklistSection {
        let checked_count = self.items.iter().filter(|item| item.checked).count() as u32;
        DocChecklistSection {
            heading: self.heading,
            item_count: self.items.len() as u32,
            checked_count,
            items: self.items,
        }
    }
}

fn push_checklist_item(
    sections: &mut Vec<DocChecklistSectionDraft>,
    heading: Option<&str>,
    item: DocChecklistItem,
) {
    let heading = heading.unwrap_or("Checklist");
    let needs_section = sections
        .last()
        .map(|section| section.heading != heading)
        .unwrap_or(true);
    if needs_section {
        sections.push(DocChecklistSectionDraft::new(heading));
    }
    sections
        .last_mut()
        .expect("checklist section should exist")
        .items
        .push(item);
}

fn normalize_markdown_line(line: &str) -> &str {
    let mut line = line.trim();
    while let Some(rest) = line.strip_prefix('>') {
        line = rest.trim_start();
    }
    line
}

fn markdown_heading(line: &str) -> Option<String> {
    markdown_heading_with_level(line).map(|(_level, title)| title)
}

fn markdown_heading_with_level(line: &str) -> Option<(u32, String)> {
    let level = line.chars().take_while(|ch| *ch == '#').count();
    if level == 0 || level > 6 {
        return None;
    }
    let rest = line.get(level..)?;
    if !rest
        .chars()
        .next()
        .is_some_and(|ch| ch.is_ascii_whitespace())
    {
        return None;
    }
    clean_optional_label(rest.trim().trim_end_matches('#').trim().to_string())
        .map(|title| (level as u32, title))
}

fn heading_slug(title: &str) -> String {
    let mut slug = String::new();
    let mut pending_separator = false;

    for ch in title.chars() {
        if ch.is_ascii_alphanumeric() {
            if pending_separator && !slug.is_empty() {
                slug.push('-');
            }
            slug.push(ch.to_ascii_lowercase());
            pending_separator = false;
        } else {
            pending_separator = true;
        }
    }

    if slug.is_empty() {
        "section".to_string()
    } else {
        slug
    }
}

fn unique_heading_slug(base: String, counts: &mut HashMap<String, u32>) -> String {
    let count = counts.entry(base.clone()).or_insert(0);
    *count += 1;

    if *count == 1 {
        base
    } else {
        format!("{base}-{count}")
    }
}

fn checklist_item(line: &str) -> Option<DocChecklistItem> {
    let item = strip_markdown_list_marker(line)?;
    let (checked, rest) = if let Some(rest) = item.strip_prefix("[ ]") {
        (false, rest)
    } else if let Some(rest) = item
        .strip_prefix("[x]")
        .or_else(|| item.strip_prefix("[X]"))
    {
        (true, rest)
    } else {
        return None;
    };
    let text = rest.trim();
    (!text.is_empty()).then(|| DocChecklistItem {
        text: text.to_string(),
        checked,
    })
}

fn strip_markdown_list_marker(line: &str) -> Option<&str> {
    ["- ", "* ", "+ "]
        .into_iter()
        .find_map(|prefix| line.strip_prefix(prefix))
        .or_else(|| {
            let (marker, rest) = line.split_once(". ")?;
            marker.chars().all(|ch| ch.is_ascii_digit()).then_some(rest)
        })
}

#[derive(Default)]
struct BddScenarioDraft {
    kind: String,
    title: String,
    steps: Vec<BddStep>,
}

impl BddScenarioDraft {
    fn new(kind: impl Into<String>, title: impl Into<String>) -> Self {
        Self {
            kind: kind.into(),
            title: title.into(),
            steps: Vec::new(),
        }
    }

    fn finish(self) -> BddScenario {
        BddScenario {
            kind: self.kind,
            title: self.title,
            step_count: self.steps.len() as u32,
            steps: self.steps,
        }
    }
}

fn finish_bdd_scenario(scenarios: &mut Vec<BddScenario>, current: &mut Option<BddScenarioDraft>) {
    if let Some(scenario) = current.take() {
        scenarios.push(scenario.finish());
    }
}

fn normalize_bdd_line(line: &str) -> &str {
    let mut line = line.trim();
    while let Some(rest) = line.strip_prefix('>') {
        line = rest.trim_start();
    }
    if let Some(rest) = line.strip_prefix("- ") {
        return rest.trim_start();
    }
    if let Some(rest) = line.strip_prefix("+ ") {
        return rest.trim_start();
    }
    strip_ordered_list_marker(line)
}

fn strip_ordered_list_marker(line: &str) -> &str {
    let Some((marker, rest)) = line.split_once(". ") else {
        return line;
    };
    if marker.chars().all(|ch| ch.is_ascii_digit()) {
        rest.trim_start()
    } else {
        line
    }
}

fn bdd_scenario_heading(line: &str) -> Option<(&'static str, String)> {
    [
        ("Scenario Outline:", "scenario-outline", "Scenario Outline"),
        ("Scenario:", "scenario", "Scenario"),
        ("Example:", "example", "Example"),
        ("Background:", "background", "Background"),
    ]
    .into_iter()
    .find_map(|(prefix, kind, fallback_title)| {
        strip_ascii_prefix(line, prefix).map(|raw_title| {
            let title = clean_optional_label(raw_title.to_string())
                .unwrap_or_else(|| fallback_title.to_string());
            (kind, title)
        })
    })
}

fn bdd_step(line: &str) -> Option<BddStep> {
    ["Given", "When", "Then", "And", "But", "*"]
        .into_iter()
        .find_map(|keyword| {
            let rest = strip_ascii_prefix(line, keyword)?;
            let starts_with_separator = rest
                .chars()
                .next()
                .is_some_and(|ch| ch.is_ascii_whitespace());
            if !starts_with_separator {
                return None;
            }
            let text = rest.trim();
            (!text.is_empty()).then(|| BddStep {
                keyword: keyword.to_string(),
                text: text.to_string(),
            })
        })
}

fn strip_ascii_prefix<'a>(line: &'a str, prefix: &str) -> Option<&'a str> {
    let candidate = line.get(..prefix.len())?;
    candidate
        .eq_ignore_ascii_case(prefix)
        .then(|| &line[prefix.len()..])
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

fn type_card(doc_type: &DocTypeSummary, doc: &DocSummary) -> DocTypeCard {
    DocTypeCard {
        project_name: doc_type.project_name.clone(),
        type_name: doc_type.type_name.clone(),
        type_label: doc_type.label.clone(),
        slug: doc_type.slug.clone(),
        path: doc.path.clone(),
        title: doc.title.clone(),
        status: property_value(doc, "status").unwrap_or_default(),
        owner: property_value(doc, "owner"),
        tags: property_value(doc, "tags")
            .map(|value| parse_tag_list(&value))
            .unwrap_or_default(),
    }
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

fn owner_card(doc_type: &DocTypeSummary, doc: &DocSummary) -> DocOwnerCard {
    DocOwnerCard {
        project_name: doc_type.project_name.clone(),
        type_name: doc_type.type_name.clone(),
        type_label: doc_type.label.clone(),
        path: doc.path.clone(),
        title: doc.title.clone(),
        status: property_value(doc, "status").unwrap_or_default(),
        owner: property_value(doc, "owner"),
    }
}

fn tag_card(doc_type: &DocTypeSummary, doc: &DocSummary) -> DocTagCard {
    DocTagCard {
        project_name: doc_type.project_name.clone(),
        type_name: doc_type.type_name.clone(),
        type_label: doc_type.label.clone(),
        path: doc.path.clone(),
        title: doc.title.clone(),
        status: property_value(doc, "status").unwrap_or_default(),
        tags: property_value(doc, "tags")
            .map(|value| parse_tag_list(&value))
            .unwrap_or_default(),
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

fn front_matter_value(properties: &[(String, String)], key: &str) -> Option<String> {
    properties
        .iter()
        .find_map(|(property_key, value)| {
            property_key.eq_ignore_ascii_case(key).then(|| value.trim())
        })
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn type_column(
    key: impl Into<String>,
    label: impl Into<String>,
    type_name: impl Into<String>,
    docs: Vec<DocTypeCard>,
) -> DocTypeColumn {
    DocTypeColumn {
        key: key.into(),
        label: label.into(),
        type_name: type_name.into(),
        count: docs.len() as u32,
        docs,
    }
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

fn owner_column(
    key: impl Into<String>,
    label: impl Into<String>,
    owner: Option<String>,
    docs: Vec<DocOwnerCard>,
) -> DocOwnerColumn {
    DocOwnerColumn {
        key: key.into(),
        label: label.into(),
        owner,
        count: docs.len() as u32,
        docs,
    }
}

fn tag_column(
    key: impl Into<String>,
    label: impl Into<String>,
    tag: Option<String>,
    docs: Vec<DocTagCard>,
) -> DocTagColumn {
    DocTagColumn {
        key: key.into(),
        label: label.into(),
        tag,
        count: docs.len() as u32,
        docs,
    }
}

fn project_column(
    key: impl Into<String>,
    label: impl Into<String>,
    project_name: Option<String>,
    docs: Vec<DocProjectCard>,
) -> DocProjectColumn {
    DocProjectColumn {
        key: key.into(),
        label: label.into(),
        project_name,
        count: docs.len() as u32,
        docs,
    }
}

fn readiness_column(
    key: impl Into<String>,
    label: impl Into<String>,
    docs: Vec<DocReadinessCard>,
) -> DocReadinessColumn {
    DocReadinessColumn {
        key: key.into(),
        label: label.into(),
        count: docs.len() as u32,
        docs,
    }
}

fn handoff_column(
    key: impl Into<String>,
    label: impl Into<String>,
    docs: Vec<DocHandoffCard>,
) -> DocHandoffColumn {
    DocHandoffColumn {
        key: key.into(),
        label: label.into(),
        count: docs.len() as u32,
        docs,
    }
}

fn decision_column(
    key: impl Into<String>,
    label: impl Into<String>,
    docs: Vec<DocDecisionCard>,
) -> DocDecisionColumn {
    DocDecisionColumn {
        key: key.into(),
        label: label.into(),
        count: docs.len() as u32,
        docs,
    }
}

fn traceability_column(
    key: impl Into<String>,
    label: impl Into<String>,
    docs: Vec<DocTraceabilityCard>,
) -> DocTraceabilityColumn {
    DocTraceabilityColumn {
        key: key.into(),
        label: label.into(),
        count: docs.len() as u32,
        docs,
    }
}

fn scenario_column(
    key: impl Into<String>,
    label: impl Into<String>,
    docs: Vec<DocScenarioCard>,
) -> DocScenarioColumn {
    DocScenarioColumn {
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

fn owner_key(owner: &str) -> String {
    let mut key = String::new();
    let mut last_was_dash = false;
    for ch in owner.trim().chars().flat_map(char::to_lowercase) {
        if ch.is_ascii_alphanumeric() {
            key.push(ch);
            last_was_dash = false;
        } else if !last_was_dash && !key.is_empty() {
            key.push('-');
            last_was_dash = true;
        }
    }
    while key.ends_with('-') {
        key.pop();
    }
    if key.is_empty() {
        "unknown".to_string()
    } else {
        key
    }
}

fn tag_key(tag: &str) -> String {
    owner_key(tag)
}

fn doc_type_key(type_name: &str) -> String {
    owner_key(type_name)
}

fn project_key(project: &str) -> String {
    owner_key(project)
}

fn parse_tag_list(value: &str) -> Vec<String> {
    let trimmed = value
        .trim()
        .trim_start_matches('[')
        .trim_end_matches(']')
        .trim();
    if trimmed.is_empty() {
        return Vec::new();
    }

    let mut tags = Vec::new();
    for raw in trimmed.split(',') {
        let tag = raw
            .trim()
            .trim_matches('"')
            .trim_matches('\'')
            .trim()
            .to_string();
        if tag.is_empty() || tags.iter().any(|existing| existing == &tag) {
            continue;
        }
        tags.push(tag);
    }
    tags
}

enum ReadinessLane {
    NeedsCriteria,
    InProgress,
    Ready,
}

enum HandoffLane {
    NeedsCriteria,
    NeedsScenarios,
    NeedsProductReview,
    ReadyForImplementation,
    InImplementation,
}

enum DecisionLane {
    OpenQuestions,
    Risks,
    Decided,
    MissingReviewState,
}

enum TraceabilityLane {
    Unlinked,
    ImplementationLinked,
    DocLinked,
    OtherLinked,
}

enum ScenarioLane {
    MissingFeature,
    MissingScenarios,
    NeedsSteps,
    Ready,
}

fn readiness_lane(card: &DocReadinessCard) -> ReadinessLane {
    if card.checklist_total > card.checklist_checked {
        return ReadinessLane::InProgress;
    }

    if card.scenario_count > 0
        || (card.checklist_total > 0 && card.checklist_checked == card.checklist_total)
    {
        return ReadinessLane::Ready;
    }

    ReadinessLane::NeedsCriteria
}

fn handoff_lane(card: &DocHandoffCard) -> HandoffLane {
    if card.implementation_reference_count > 0 {
        return HandoffLane::InImplementation;
    }

    if card.checklist_total > card.checklist_checked
        || (card.checklist_total == 0 && card.scenario_count == 0)
    {
        return HandoffLane::NeedsCriteria;
    }

    if card.scenario_count == 0 {
        return HandoffLane::NeedsScenarios;
    }

    if card.open_question_count > 0 || card.risk_count > 0 {
        return HandoffLane::NeedsProductReview;
    }

    HandoffLane::ReadyForImplementation
}

fn decision_lane(card: &DocDecisionCard) -> DecisionLane {
    if card.open_question_count > 0 {
        return DecisionLane::OpenQuestions;
    }

    if card.risk_count > 0 {
        return DecisionLane::Risks;
    }

    if card.decision_count > 0 {
        return DecisionLane::Decided;
    }

    DecisionLane::MissingReviewState
}

fn traceability_lane(card: &DocTraceabilityCard) -> TraceabilityLane {
    if card.implementation_reference_count > 0 {
        return TraceabilityLane::ImplementationLinked;
    }

    if card.doc_reference_count > 0 {
        return TraceabilityLane::DocLinked;
    }

    if card.other_reference_count > 0 {
        return TraceabilityLane::OtherLinked;
    }

    TraceabilityLane::Unlinked
}

fn is_implementation_reference(kind: &str) -> bool {
    matches!(kind, "epic" | "issue" | "issue-number" | "pull-request")
}

fn scenario_lane(card: &DocScenarioCard) -> ScenarioLane {
    if card.feature.is_none() {
        return ScenarioLane::MissingFeature;
    }

    if card.scenario_count == 0 {
        return ScenarioLane::MissingScenarios;
    }

    if card.step_count == 0 || card.scenarios_without_steps > 0 {
        return ScenarioLane::NeedsSteps;
    }

    ScenarioLane::Ready
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

    fn type_board(input: DocCatalogInput) -> Result<DocTypeBoard, Error> {
        crate::type_board(input)
    }

    fn status_board(input: DocCatalogInput) -> Result<DocStatusBoard, Error> {
        crate::status_board(input)
    }

    fn owner_board(input: DocCatalogInput) -> Result<DocOwnerBoard, Error> {
        crate::owner_board(input)
    }

    fn tag_board(input: DocCatalogInput) -> Result<DocTagBoard, Error> {
        crate::tag_board(input)
    }

    fn project_board(input: DocCatalogInput) -> Result<DocProjectBoard, Error> {
        crate::project_board(input)
    }

    fn summarize_scenarios(input: SummarizeDocInput) -> Result<BddSummary, Error> {
        crate::summarize_scenarios(input)
    }

    fn scenario_board(input: DocCatalogInput) -> Result<DocScenarioBoard, Error> {
        crate::scenario_board(input)
    }

    fn summarize_checklists(input: SummarizeDocInput) -> Result<DocChecklistSummary, Error> {
        crate::summarize_checklists(input)
    }

    fn summarize_references(input: SummarizeDocInput) -> Result<DocReferenceSummary, Error> {
        crate::summarize_references(input)
    }

    fn traceability_board(input: DocCatalogInput) -> Result<DocTraceabilityBoard, Error> {
        crate::traceability_board(input)
    }

    fn summarize_outline(input: SummarizeDocInput) -> Result<DocOutlineSummary, Error> {
        crate::summarize_outline(input)
    }

    fn summarize_decisions(input: SummarizeDocInput) -> Result<DocDecisionSummary, Error> {
        crate::summarize_decisions(input)
    }

    fn decision_board(input: DocCatalogInput) -> Result<DocDecisionBoard, Error> {
        crate::decision_board(input)
    }

    fn readiness_board(input: DocCatalogInput) -> Result<DocReadinessBoard, Error> {
        crate::readiness_board(input)
    }

    fn handoff_board(input: DocCatalogInput) -> Result<DocHandoffBoard, Error> {
        crate::handoff_board(input)
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

    use super::{
        decision_board, handoff_board, owner_board, project_board, readiness_board, scenario_board,
        status_board, summarize_catalog, summarize_checklists, summarize_decisions,
        summarize_outline, summarize_preview, summarize_references, summarize_scenarios, tag_board,
        traceability_board, type_board, MAX_CATALOG_DOCS,
    };

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
    fn type_board_groups_docs_by_configured_type() {
        let board = type_board(DocCatalogInput {
            types: vec![
                DocTypeInput {
                    project_name: "backend".to_string(),
                    type_name: "prd".to_string(),
                    label: "Backend PRDs".to_string(),
                    description: None,
                    slug: "server/docs/prds".to_string(),
                    files: vec![SummarizeDocInput {
                        path: "crates/server/docs/prds/repository-docs-surface.mdx"
                            .to_string(),
                        preview:
                            "---\ntitle: Repository Docs Surface\nowner: Platform Maintainers\nstatus: active\ntags: [docs, product]\n---\n\nIntent."
                                .to_string(),
                    }],
                },
                DocTypeInput {
                    project_name: "frontend".to_string(),
                    type_name: "prd".to_string(),
                    label: "Frontend PRDs".to_string(),
                    description: None,
                    slug: "frontend/docs/prds".to_string(),
                    files: vec![SummarizeDocInput {
                        path: "frontend/docs/prds/shell-navigation.mdx".to_string(),
                        preview:
                            "---\ntitle: Shell Navigation\nstatus: planned\n---\n\nIntent."
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
                            "---\ntitle: Repository docs are discoverable\nstatus: review\ntags: bdd, docs\n---\n\nGiven..."
                                .to_string(),
                    }],
                },
                DocTypeInput {
                    project_name: "backend".to_string(),
                    type_name: "spec".to_string(),
                    label: "Specs".to_string(),
                    description: None,
                    slug: "server/docs/specs".to_string(),
                    files: Vec::new(),
                },
            ],
        })
        .expect("type board should summarize");

        assert_eq!(board.total_docs, 3);
        assert_eq!(
            board
                .columns
                .iter()
                .map(|column| column.key.as_str())
                .collect::<Vec<_>>(),
            ["type-prd", "type-scenario", "type-spec"]
        );

        let prds = board
            .columns
            .iter()
            .find(|column| column.key == "type-prd")
            .expect("prd column");
        assert_eq!(prds.label, "prd");
        assert_eq!(prds.type_name, "prd");
        assert_eq!(prds.count, 2);
        assert_eq!(prds.docs[0].project_name, "backend");
        assert_eq!(prds.docs[0].type_label, "Backend PRDs");
        assert_eq!(prds.docs[0].slug, "server/docs/prds");
        assert_eq!(prds.docs[0].owner.as_deref(), Some("Platform Maintainers"));
        assert_eq!(prds.docs[0].tags, ["docs", "product"]);
        assert_eq!(prds.docs[1].project_name, "frontend");
        assert_eq!(prds.docs[1].type_label, "Frontend PRDs");

        let scenarios = board
            .columns
            .iter()
            .find(|column| column.key == "type-scenario")
            .expect("scenario column");
        assert_eq!(scenarios.count, 1);
        assert_eq!(scenarios.docs[0].tags, ["bdd", "docs"]);

        let specs = board
            .columns
            .iter()
            .find(|column| column.key == "type-spec")
            .expect("spec column");
        assert_eq!(specs.label, "Specs");
        assert_eq!(specs.count, 0);
        assert!(specs.docs.is_empty());
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

    #[test]
    fn owner_board_groups_docs_by_front_matter_owner() {
        let board = owner_board(DocCatalogInput {
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
                                "---\ntitle: Repository Docs Surface\nowner: Platform Maintainers\nstatus: active\n---\n\nIntent."
                                    .to_string(),
                        },
                        SummarizeDocInput {
                            path: "crates/server/docs/prds/next-docs-surface.mdx".to_string(),
                            preview:
                                "---\ntitle: Next Docs Surface\nowner: product\nstatus: planned\n---\n\nIntent."
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
                    files: vec![SummarizeDocInput {
                        path: "crates/server/docs/scenarios/missing-owner.mdx".to_string(),
                        preview: "---\ntitle: Missing Owner Scenario\nstatus: review\n---\n\nGiven..."
                            .to_string(),
                    }],
                },
            ],
        })
        .expect("owner board should summarize");

        assert_eq!(board.total_docs, 3);
        assert_eq!(board.columns.len(), 3);

        let unowned = board
            .columns
            .iter()
            .find(|column| column.key == "unowned")
            .expect("unowned column");
        assert_eq!(unowned.label, "Unowned");
        assert_eq!(unowned.owner, None);
        assert_eq!(unowned.count, 1);
        assert_eq!(unowned.docs[0].type_label, "BDD Scenarios");

        let platform = board
            .columns
            .iter()
            .find(|column| column.key == "owner-platform-maintainers")
            .expect("platform owner column");
        assert_eq!(platform.label, "Platform Maintainers");
        assert_eq!(platform.owner.as_deref(), Some("Platform Maintainers"));
        assert_eq!(platform.docs[0].status, "active");
        assert_eq!(
            platform.docs[0].owner.as_deref(),
            Some("Platform Maintainers")
        );

        let product = board
            .columns
            .iter()
            .find(|column| column.key == "owner-product")
            .expect("product owner column");
        assert_eq!(product.count, 1);
        assert_eq!(product.docs[0].title, "Next Docs Surface");
    }

    #[test]
    fn tag_board_groups_docs_by_front_matter_tags() {
        let board = tag_board(DocCatalogInput {
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
                                "---\ntitle: Repository Docs Surface\nstatus: active\ntags: [docs, projects, docs]\n---\n\nIntent."
                                    .to_string(),
                        },
                        SummarizeDocInput {
                            path: "crates/server/docs/prds/without-tags.mdx".to_string(),
                            preview: "---\ntitle: Untagged PRD\nstatus: planned\n---\n\nIntent."
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
                    files: vec![SummarizeDocInput {
                        path: "crates/server/docs/scenarios/repository-docs-surface.mdx"
                            .to_string(),
                        preview:
                            "---\ntitle: Repository docs are discoverable\nstatus: review\ntags: bdd, docs\n---\n\nGiven..."
                                .to_string(),
                    }],
                },
            ],
        })
        .expect("tag board should summarize");

        assert_eq!(board.total_docs, 3);
        assert_eq!(
            board
                .columns
                .iter()
                .map(|column| column.key.as_str())
                .collect::<Vec<_>>(),
            ["untagged", "tag-bdd", "tag-docs", "tag-projects"]
        );

        let untagged = board
            .columns
            .iter()
            .find(|column| column.key == "untagged")
            .expect("untagged column");
        assert_eq!(untagged.count, 1);
        assert_eq!(untagged.docs[0].title, "Untagged PRD");
        assert_eq!(untagged.tag, None);

        let docs = board
            .columns
            .iter()
            .find(|column| column.key == "tag-docs")
            .expect("docs tag column");
        assert_eq!(docs.label, "docs");
        assert_eq!(docs.tag.as_deref(), Some("docs"));
        assert_eq!(docs.count, 2);
        assert_eq!(docs.docs[0].tags, ["docs", "projects"]);
        assert_eq!(docs.docs[1].type_label, "BDD Scenarios");

        let bdd = board
            .columns
            .iter()
            .find(|column| column.key == "tag-bdd")
            .expect("bdd tag column");
        assert_eq!(bdd.count, 1);
        assert_eq!(bdd.docs[0].title, "Repository docs are discoverable");
    }

    #[test]
    fn project_board_groups_docs_by_project_and_unscoped_lane() {
        let board = project_board(DocCatalogInput {
            types: vec![
                DocTypeInput {
                    project_name: "backend".to_string(),
                    type_name: "prd".to_string(),
                    label: "Backend PRDs".to_string(),
                    description: None,
                    slug: "server/docs/prds".to_string(),
                    files: vec![SummarizeDocInput {
                        path: "crates/server/docs/prds/repository-docs-surface.mdx"
                            .to_string(),
                        preview:
                            "---\ntitle: Repository Docs Surface\nowner: platform-maintainers\nstatus: active\ntags: docs, product\n---\n\nIntent."
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
                            "---\ntitle: Repository docs are discoverable\nstatus: review\n---\n\nGiven..."
                                .to_string(),
                    }],
                },
                DocTypeInput {
                    project_name: "frontend shell".to_string(),
                    type_name: "spec".to_string(),
                    label: "Frontend Specs".to_string(),
                    description: None,
                    slug: "frontend/docs/specs".to_string(),
                    files: vec![SummarizeDocInput {
                        path: "frontend/docs/specs/shell-navigation.mdx".to_string(),
                        preview:
                            "---\ntitle: Shell Navigation\nstatus: planned\nowner: design\n---\n\nIntent."
                                .to_string(),
                    }],
                },
                DocTypeInput {
                    project_name: " ".to_string(),
                    type_name: "prd".to_string(),
                    label: "Repo PRDs".to_string(),
                    description: None,
                    slug: "docs/prds".to_string(),
                    files: vec![SummarizeDocInput {
                        path: "docs/prds/repo-level-governance.mdx".to_string(),
                        preview:
                            "---\ntitle: Repo-level Governance\nstatus: draft\n---\n\nIntent."
                                .to_string(),
                    }],
                },
            ],
        })
        .expect("project board should summarize");

        assert_eq!(board.total_docs, 4);
        assert_eq!(
            board
                .columns
                .iter()
                .map(|column| column.key.as_str())
                .collect::<Vec<_>>(),
            ["unscoped", "project-backend", "project-frontend-shell"]
        );

        let unscoped = board
            .columns
            .iter()
            .find(|column| column.key == "unscoped")
            .expect("unscoped column");
        assert_eq!(unscoped.label, "Unscoped");
        assert_eq!(unscoped.project_name, None);
        assert_eq!(unscoped.count, 1);
        assert_eq!(unscoped.docs[0].project_name, "");
        assert_eq!(unscoped.docs[0].title, "Repo-level Governance");

        let backend = board
            .columns
            .iter()
            .find(|column| column.key == "project-backend")
            .expect("backend project column");
        assert_eq!(backend.label, "backend");
        assert_eq!(backend.project_name.as_deref(), Some("backend"));
        assert_eq!(backend.count, 2);
        assert_eq!(backend.docs[0].type_label, "Backend PRDs");
        assert_eq!(
            backend.docs[0].owner.as_deref(),
            Some("platform-maintainers")
        );
        assert_eq!(backend.docs[0].tags, ["docs", "product"]);
        assert_eq!(backend.docs[1].type_name, "scenario");

        let frontend = board
            .columns
            .iter()
            .find(|column| column.key == "project-frontend-shell")
            .expect("frontend shell project column");
        assert_eq!(frontend.count, 1);
        assert_eq!(frontend.docs[0].status, "planned");
        assert_eq!(frontend.docs[0].owner.as_deref(), Some("design"));
    }

    #[test]
    fn summarize_scenarios_extracts_bdd_feature_and_steps() {
        let summary = summarize_scenarios(SummarizeDocInput {
            path: "crates/server/docs/scenarios/repository-docs-surface.mdx".to_string(),
            preview: r#"---
title: Repository docs are discoverable from project context
status: active
---

```gherkin
Feature: Repository docs

Background:
  Given the Comtrya repository has opted into ext_docs

Scenario: Open project docs
  Given a maintainer opens a repository
  When they view project docs
  Then they see specs, PRDs, and BDD scenarios

Scenario Outline: Filter docs by status
  Given docs have <status>
  When the catalog is summarized
  Then the status lane is <lane>
```
"#
            .to_string(),
        })
        .expect("BDD summary should parse");

        assert_eq!(
            summary.path,
            "crates/server/docs/scenarios/repository-docs-surface.mdx"
        );
        assert_eq!(
            summary.title,
            "Repository docs are discoverable from project context"
        );
        assert_eq!(summary.feature.as_deref(), Some("Repository docs"));
        assert_eq!(summary.scenario_count, 3);
        assert_eq!(summary.step_count, 7);
        assert_eq!(summary.scenarios[0].kind, "background");
        assert_eq!(summary.scenarios[0].title, "Background");
        assert_eq!(summary.scenarios[0].step_count, 1);
        assert_eq!(summary.scenarios[1].kind, "scenario");
        assert_eq!(summary.scenarios[1].title, "Open project docs");
        assert_eq!(summary.scenarios[1].steps[0].keyword, "Given");
        assert_eq!(summary.scenarios[1].steps[1].keyword, "When");
        assert_eq!(summary.scenarios[1].steps[2].keyword, "Then");
        assert!(summary.scenarios[1].steps[2]
            .text
            .contains("specs, PRDs, and BDD scenarios"));
        assert_eq!(summary.scenarios[2].kind, "scenario-outline");
    }

    #[test]
    fn scenario_board_groups_docs_by_bdd_coverage() {
        let board = scenario_board(DocCatalogInput {
            types: vec![DocTypeInput {
                project_name: "backend".to_string(),
                type_name: "scenario".to_string(),
                label: "BDD Scenarios".to_string(),
                description: None,
                slug: "server/docs/scenarios".to_string(),
                files: vec![
                    SummarizeDocInput {
                        path: "crates/server/docs/scenarios/missing-feature.mdx".to_string(),
                        preview: r#"---
title: Missing Feature
status: draft
---

```gherkin
Scenario: Missing feature
  Given a scenario exists without a feature
```
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/scenarios/missing-scenarios.mdx".to_string(),
                        preview: r#"---
title: Missing Scenarios
status: review
---

```gherkin
Feature: Repository docs
```
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/scenarios/needs-steps.mdx".to_string(),
                        preview: r#"---
title: Needs Steps
status: active
---

```gherkin
Feature: Repository docs

Scenario: Open project docs
```
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/scenarios/ready.mdx".to_string(),
                        preview: r#"---
title: Ready Scenario
status: accepted
---

```gherkin
Feature: Repository docs

Scenario: Open project docs
  Given a maintainer opens a repository
  When they view project docs
  Then they see PRDs and BDD scenarios
```
"#
                        .to_string(),
                    },
                ],
            }],
        })
        .expect("scenario board should summarize");

        assert_eq!(board.total_docs, 4);

        let missing_feature = board
            .columns
            .iter()
            .find(|column| column.key == "missing-feature")
            .expect("missing feature column");
        assert_eq!(missing_feature.count, 1);
        assert_eq!(missing_feature.docs[0].title, "Missing Feature");
        assert_eq!(missing_feature.docs[0].scenario_count, 1);
        assert_eq!(missing_feature.docs[0].feature.as_deref(), None);

        let missing_scenarios = board
            .columns
            .iter()
            .find(|column| column.key == "missing-scenarios")
            .expect("missing scenarios column");
        assert_eq!(missing_scenarios.count, 1);
        assert_eq!(
            missing_scenarios.docs[0].feature.as_deref(),
            Some("Repository docs")
        );
        assert_eq!(missing_scenarios.docs[0].scenario_count, 0);

        let needs_steps = board
            .columns
            .iter()
            .find(|column| column.key == "needs-steps")
            .expect("needs steps column");
        assert_eq!(needs_steps.count, 1);
        assert_eq!(needs_steps.docs[0].scenarios_without_steps, 1);
        assert_eq!(needs_steps.docs[0].status, "active");
        assert_eq!(needs_steps.docs[0].type_label, "BDD Scenarios");

        let ready = board
            .columns
            .iter()
            .find(|column| column.key == "ready")
            .expect("ready column");
        assert_eq!(ready.count, 1);
        assert_eq!(ready.docs[0].step_count, 3);
        assert_eq!(ready.docs[0].status, "accepted");
    }

    #[test]
    fn summarize_checklists_extracts_prd_acceptance_sections() {
        let summary = summarize_checklists(SummarizeDocInput {
            path: "crates/server/docs/prds/repository-docs-surface.mdx".to_string(),
            preview: r#"---
title: Repository Docs Surface
status: active
---

# Repository Docs Surface

## Acceptance Criteria

- [x] Project docs render beside implementation
- [ ] Scenario docs can be summarized without shell-specific parsing

```md
- [ ] ignored example item
```

## Rollout

1. [ ] Seed demo docs for specs and PRDs
+ [X] Gate docs operations in smoke
"#
            .to_string(),
        })
        .expect("checklist summary should parse");

        assert_eq!(
            summary.path,
            "crates/server/docs/prds/repository-docs-surface.mdx"
        );
        assert_eq!(summary.title, "Repository Docs Surface");
        assert_eq!(summary.total_items, 4);
        assert_eq!(summary.checked_items, 2);
        assert_eq!(summary.sections.len(), 2);
        assert_eq!(summary.sections[0].heading, "Acceptance Criteria");
        assert_eq!(summary.sections[0].item_count, 2);
        assert_eq!(summary.sections[0].checked_count, 1);
        assert_eq!(
            summary.sections[0].items[1].text,
            "Scenario docs can be summarized without shell-specific parsing"
        );
        assert!(!summary.sections[0].items[1].checked);
        assert_eq!(summary.sections[1].heading, "Rollout");
        assert_eq!(summary.sections[1].item_count, 2);
        assert_eq!(summary.sections[1].checked_count, 1);
    }

    #[test]
    fn summarize_references_extracts_forge_traceability_links() {
        let summary = summarize_references(SummarizeDocInput {
            path: "crates/server/docs/prds/repository-docs-surface.mdx".to_string(),
            preview: r#"---
title: Repository Docs Surface
status: active
---

## Traceability

This PRD tracks [repository docs epic](comtrya://epic/epc_01KVJZ0TRACE) and #42.
BDD scenarios link to comtrya://doc/scenario/repository-docs-surface.
Implementation ships through comtrya://pull-request/pr_01KVJZ0TRACE.
[External reference](https://example.com/spec) is ignored.

```md
comtrya://issue/ignored
#999
```
"#
            .to_string(),
        })
        .expect("reference summary should parse");

        assert_eq!(summary.title, "Repository Docs Surface");
        assert_eq!(summary.reference_count, 4);
        assert_eq!(summary.references[0].kind, "epic");
        assert_eq!(
            summary.references[0].target,
            "comtrya://epic/epc_01KVJZ0TRACE"
        );
        assert_eq!(
            summary.references[0].label.as_deref(),
            Some("repository docs epic")
        );
        assert_eq!(summary.references[1].kind, "issue-number");
        assert_eq!(summary.references[1].target, "#42");
        assert_eq!(summary.references[2].kind, "doc");
        assert_eq!(
            summary.references[2].target,
            "comtrya://doc/scenario/repository-docs-surface"
        );
        assert_eq!(summary.references[3].kind, "pull-request");
        assert!(summary
            .references
            .iter()
            .all(|reference| reference.line > 0));
    }

    #[test]
    fn traceability_board_groups_docs_by_link_coverage() {
        let board = traceability_board(DocCatalogInput {
            types: vec![DocTypeInput {
                project_name: "backend".to_string(),
                type_name: "prd".to_string(),
                label: "Backend PRDs".to_string(),
                description: None,
                slug: "server/docs/prds".to_string(),
                files: vec![
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/unlinked.mdx".to_string(),
                        preview: r#"---
title: Unlinked PRD
status: draft
---

Intent without implementation links.
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/implementation-linked.mdx".to_string(),
                        preview: r#"---
title: Implementation Linked PRD
status: active
---

Tracks comtrya://epic/epc_01KVJZ0TRACE, #42, and comtrya://pull-request/pr_01KVJZ0TRACE.
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/doc-linked.mdx".to_string(),
                        preview: r#"---
title: Doc Linked PRD
status: review
---

Scenario coverage lives at comtrya://doc/scenario/repository-docs-surface.
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/other-linked.mdx".to_string(),
                        preview: r#"---
title: Other Linked PRD
status: planned
---

Release note lives at comtrya://release/rel_01KVJZ0TRACE.
"#
                        .to_string(),
                    },
                ],
            }],
        })
        .expect("traceability board should summarize");

        assert_eq!(board.total_docs, 4);

        let unlinked = board
            .columns
            .iter()
            .find(|column| column.key == "unlinked")
            .expect("unlinked column");
        assert_eq!(unlinked.count, 1);
        assert_eq!(unlinked.docs[0].title, "Unlinked PRD");
        assert_eq!(unlinked.docs[0].reference_count, 0);

        let implementation_linked = board
            .columns
            .iter()
            .find(|column| column.key == "implementation-linked")
            .expect("implementation linked column");
        assert_eq!(implementation_linked.count, 1);
        assert_eq!(
            implementation_linked.docs[0].title,
            "Implementation Linked PRD"
        );
        assert_eq!(
            implementation_linked.docs[0].implementation_reference_count,
            3
        );
        assert_eq!(implementation_linked.docs[0].status, "active");
        assert_eq!(implementation_linked.docs[0].type_label, "Backend PRDs");
        assert_eq!(implementation_linked.docs[0].references.len(), 3);

        let doc_linked = board
            .columns
            .iter()
            .find(|column| column.key == "doc-linked")
            .expect("doc linked column");
        assert_eq!(doc_linked.count, 1);
        assert_eq!(doc_linked.docs[0].doc_reference_count, 1);
        assert_eq!(doc_linked.docs[0].references[0].kind, "doc");

        let other_linked = board
            .columns
            .iter()
            .find(|column| column.key == "other-linked")
            .expect("other linked column");
        assert_eq!(other_linked.count, 1);
        assert_eq!(other_linked.docs[0].other_reference_count, 1);
        assert_eq!(other_linked.docs[0].references[0].kind, "release");
    }

    #[test]
    fn summarize_outline_extracts_markdown_headings() {
        let summary = summarize_outline(SummarizeDocInput {
            path: "crates/server/docs/prds/repository-docs-surface.mdx".to_string(),
            preview: r#"---
title: Repository Docs Surface
status: active
---

# Repository Docs Surface

## Acceptance Criteria

```md
## Ignored Example
```

### Rollout

## Acceptance Criteria
"#
            .to_string(),
        })
        .expect("outline summary should parse");

        assert_eq!(summary.title, "Repository Docs Surface");
        assert_eq!(summary.heading_count, 4);
        assert_eq!(summary.headings[0].level, 1);
        assert_eq!(summary.headings[0].title, "Repository Docs Surface");
        assert_eq!(summary.headings[0].slug, "repository-docs-surface");
        assert_eq!(summary.headings[0].line, 2);
        assert_eq!(summary.headings[1].level, 2);
        assert_eq!(summary.headings[1].slug, "acceptance-criteria");
        assert_eq!(summary.headings[2].level, 3);
        assert_eq!(summary.headings[2].slug, "rollout");
        assert_eq!(summary.headings[3].level, 2);
        assert_eq!(summary.headings[3].slug, "acceptance-criteria-2");
        assert!(summary
            .headings
            .iter()
            .all(|heading| heading.title != "Ignored Example"));
    }

    #[test]
    fn summarize_decisions_extracts_decisions_questions_and_risks() {
        let summary = summarize_decisions(SummarizeDocInput {
            path: "crates/server/docs/prds/repository-docs-surface.mdx".to_string(),
            preview: r#"---
title: Repository Docs Surface
status: active
---

# Repository Docs Surface

## Decisions

- Use ext_docs for product-doc semantics.
- Decision: Keep shell queries generic.

## Open Questions

- [ ] Should PRDs expose owner filters?
Question: Which doc types should render first?

## Risks

- Risk: Stale docs may look authoritative.

```md
- Risk: ignored fenced example
Decision: ignored fenced decision
```
"#
            .to_string(),
        })
        .expect("decision summary should parse");

        assert_eq!(summary.title, "Repository Docs Surface");
        assert_eq!(summary.decision_count, 2);
        assert_eq!(summary.open_question_count, 2);
        assert_eq!(summary.risk_count, 1);
        assert_eq!(summary.items.len(), 5);
        assert_eq!(summary.items[0].kind, "decision");
        assert_eq!(
            summary.items[0].text,
            "Use ext_docs for product-doc semantics."
        );
        assert_eq!(summary.items[1].text, "Keep shell queries generic.");
        assert_eq!(summary.items[2].kind, "open-question");
        assert_eq!(summary.items[2].text, "Should PRDs expose owner filters?");
        assert_eq!(
            summary.items[3].text,
            "Which doc types should render first?"
        );
        assert_eq!(summary.items[4].kind, "risk");
        assert!(summary.items.iter().all(|item| item.line > 0));
        assert!(summary
            .items
            .iter()
            .all(|item| !item.text.contains("ignored fenced")));
    }

    #[test]
    fn decision_board_groups_docs_by_review_state() {
        let board = decision_board(DocCatalogInput {
            types: vec![DocTypeInput {
                project_name: "backend".to_string(),
                type_name: "prd".to_string(),
                label: "Backend PRDs".to_string(),
                description: None,
                slug: "server/docs/prds".to_string(),
                files: vec![
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/open-question.mdx".to_string(),
                        preview: r#"---
title: Open Question PRD
status: review
---

## Open Questions

- [ ] Should PRDs expose owner filters?
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/risk.mdx".to_string(),
                        preview: r#"---
title: Risky PRD
status: active
---

## Risks

- Risk: Stale docs may look authoritative.
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/decided.mdx".to_string(),
                        preview: r#"---
title: Decided PRD
status: accepted
---

## Decisions

- Use ext_docs for product-doc semantics.
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/missing-review-state.mdx".to_string(),
                        preview: r#"---
title: Missing Review State PRD
status: planned
---

Intent without decision review state.
"#
                        .to_string(),
                    },
                ],
            }],
        })
        .expect("decision board should summarize");

        assert_eq!(board.total_docs, 4);

        let open_questions = board
            .columns
            .iter()
            .find(|column| column.key == "open-questions")
            .expect("open questions column");
        assert_eq!(open_questions.count, 1);
        assert_eq!(open_questions.docs[0].title, "Open Question PRD");
        assert_eq!(open_questions.docs[0].open_question_count, 1);
        assert_eq!(open_questions.docs[0].status, "review");
        assert_eq!(open_questions.docs[0].type_label, "Backend PRDs");

        let risks = board
            .columns
            .iter()
            .find(|column| column.key == "risks")
            .expect("risks column");
        assert_eq!(risks.count, 1);
        assert_eq!(risks.docs[0].title, "Risky PRD");
        assert_eq!(risks.docs[0].risk_count, 1);

        let decided = board
            .columns
            .iter()
            .find(|column| column.key == "decided")
            .expect("decided column");
        assert_eq!(decided.count, 1);
        assert_eq!(decided.docs[0].decision_count, 1);
        assert_eq!(decided.docs[0].status, "accepted");

        let missing_review_state = board
            .columns
            .iter()
            .find(|column| column.key == "missing-review-state")
            .expect("missing review state column");
        assert_eq!(missing_review_state.count, 1);
        assert_eq!(
            missing_review_state.docs[0].title,
            "Missing Review State PRD"
        );
    }

    #[test]
    fn readiness_board_groups_docs_by_product_readiness() {
        let board = readiness_board(DocCatalogInput {
            types: vec![
                DocTypeInput {
                    project_name: "backend".to_string(),
                    type_name: "prd".to_string(),
                    label: "Backend PRDs".to_string(),
                    description: None,
                    slug: "server/docs/prds".to_string(),
                    files: vec![
                        SummarizeDocInput {
                            path: "crates/server/docs/prds/repository-docs-outline.mdx"
                                .to_string(),
                            preview:
                                "---\ntitle: Repository Docs Outline\nstatus: planned\n---\n\nIntent without criteria."
                                    .to_string(),
                        },
                        SummarizeDocInput {
                            path: "crates/server/docs/prds/repository-docs-surface.mdx"
                                .to_string(),
                            preview: r#"---
title: Repository Docs Surface
status: active
---

## Acceptance Criteria

- [x] Project docs render beside implementation
- [ ] Scenario docs can be summarized without shell-specific parsing

## Traceability

Tracks comtrya://epic/epc_01KVJZ0TRACE.
"#
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
                    files: vec![SummarizeDocInput {
                        path: "crates/server/docs/scenarios/repository-docs-surface.mdx"
                            .to_string(),
                        preview: r#"---
title: Repository docs are discoverable
status: active
---

Feature: Repository docs

Scenario: Open project docs
  Given a maintainer opens a repository
  When they view project docs
  Then they see specs, PRDs, and BDD scenarios
"#
                        .to_string(),
                    }],
                },
            ],
        })
        .expect("readiness board should summarize");

        assert_eq!(board.total_docs, 3);

        let needs_criteria = board
            .columns
            .iter()
            .find(|column| column.key == "needs-criteria")
            .expect("needs criteria column");
        assert_eq!(needs_criteria.label, "Needs criteria");
        assert_eq!(needs_criteria.count, 1);
        assert_eq!(needs_criteria.docs[0].title, "Repository Docs Outline");

        let in_progress = board
            .columns
            .iter()
            .find(|column| column.key == "in-progress")
            .expect("in progress column");
        assert_eq!(in_progress.count, 1);
        assert_eq!(in_progress.docs[0].type_label, "Backend PRDs");
        assert_eq!(in_progress.docs[0].status, "active");
        assert_eq!(in_progress.docs[0].checklist_total, 2);
        assert_eq!(in_progress.docs[0].checklist_checked, 1);
        assert_eq!(in_progress.docs[0].reference_count, 1);

        let ready = board
            .columns
            .iter()
            .find(|column| column.key == "ready")
            .expect("ready column");
        assert_eq!(ready.count, 1);
        assert_eq!(ready.docs[0].type_name, "scenario");
        assert_eq!(ready.docs[0].scenario_count, 1);
    }

    #[test]
    fn handoff_board_groups_docs_by_implementation_handoff_state() {
        let board = handoff_board(DocCatalogInput {
            types: vec![DocTypeInput {
                project_name: "backend".to_string(),
                type_name: "prd".to_string(),
                label: "Backend PRDs".to_string(),
                description: None,
                slug: "server/docs/prds".to_string(),
                files: vec![
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/needs-criteria.mdx".to_string(),
                        preview: r#"---
title: Needs Criteria PRD
status: planned
---

Intent without accepted criteria or scenarios.
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/needs-scenarios.mdx".to_string(),
                        preview: r#"---
title: Needs Scenarios PRD
status: active
---

## Acceptance Criteria

- [x] Project docs render beside implementation
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/needs-review.mdx".to_string(),
                        preview: r#"---
title: Needs Review PRD
status: review
---

## Acceptance Criteria

- [x] Product intent is clear

Feature: Repository docs

Scenario: Open project docs
  Given a maintainer opens a repository

## Open Questions

Question: Should PRDs expose owner filters?
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/ready.mdx".to_string(),
                        preview: r#"---
title: Ready PRD
status: accepted
---

## Acceptance Criteria

- [x] Product intent is clear

Feature: Repository docs

Scenario: Open project docs
  Given a maintainer opens a repository
  When they view project docs
  Then they see implementation-ready context
"#
                        .to_string(),
                    },
                    SummarizeDocInput {
                        path: "crates/server/docs/prds/in-implementation.mdx".to_string(),
                        preview: r#"---
title: In Implementation PRD
status: active
---

## Acceptance Criteria

- [x] Product intent is clear

Feature: Repository docs

Scenario: Open project docs
  Given a maintainer opens a repository
  When they view project docs
  Then they see linked implementation work

## Traceability

Tracks #42 and comtrya://pull-request/pr_01KVJZ0TRACE.
"#
                        .to_string(),
                    },
                ],
            }],
        })
        .expect("handoff board should summarize");

        assert_eq!(board.total_docs, 5);

        let needs_criteria = board
            .columns
            .iter()
            .find(|column| column.key == "needs-criteria")
            .expect("needs criteria column");
        assert_eq!(needs_criteria.count, 1);
        assert_eq!(needs_criteria.docs[0].title, "Needs Criteria PRD");
        assert_eq!(needs_criteria.docs[0].checklist_total, 0);

        let needs_scenarios = board
            .columns
            .iter()
            .find(|column| column.key == "needs-scenarios")
            .expect("needs scenarios column");
        assert_eq!(needs_scenarios.count, 1);
        assert_eq!(needs_scenarios.docs[0].checklist_total, 1);
        assert_eq!(needs_scenarios.docs[0].checklist_checked, 1);
        assert_eq!(needs_scenarios.docs[0].scenario_count, 0);

        let needs_product_review = board
            .columns
            .iter()
            .find(|column| column.key == "needs-product-review")
            .expect("needs product review column");
        assert_eq!(needs_product_review.count, 1);
        assert_eq!(needs_product_review.docs[0].open_question_count, 1);
        assert_eq!(needs_product_review.docs[0].type_label, "Backend PRDs");

        let ready = board
            .columns
            .iter()
            .find(|column| column.key == "ready-for-implementation")
            .expect("ready for implementation column");
        assert_eq!(ready.count, 1);
        assert_eq!(ready.docs[0].title, "Ready PRD");
        assert_eq!(ready.docs[0].scenario_count, 1);
        assert_eq!(ready.docs[0].implementation_reference_count, 0);

        let in_implementation = board
            .columns
            .iter()
            .find(|column| column.key == "in-implementation")
            .expect("in implementation column");
        assert_eq!(in_implementation.count, 1);
        assert_eq!(in_implementation.docs[0].title, "In Implementation PRD");
        assert_eq!(in_implementation.docs[0].implementation_reference_count, 2);
        assert_eq!(in_implementation.docs[0].status, "active");
    }
}
