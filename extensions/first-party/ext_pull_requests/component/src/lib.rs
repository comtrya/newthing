// ext_pull_requests — WASM Component-Model implementation of `pull-requests.wit`.

mod bindings;

use bindings::comtrya::platform::events;
use bindings::comtrya::platform::identity;
use bindings::comtrya::platform::ids;
use bindings::comtrya::platform::ops;
use bindings::comtrya::platform::relations;
use bindings::comtrya::platform::storage;
use bindings::comtrya::platform::time;
use bindings::comtrya::platform::types::{Error, ErrorCode, Event};
use bindings::exports::comtrya::ext_pull_requests::pulls::{
    ChangeStatePullInput, ClosePullInput, CreatePullInput, Guest as PullsGuest,
    ListPullReviewsInput, ListReviewRequestsInput, MergePullInput, PrState, PullMergeCheckSummary,
    PullMergeReadinessBoard, PullMergeReadinessBoardInput, PullMergeReadinessCard,
    PullMergeReadinessColumn, PullMergeReviewSummary, PullRequest, PullReview, PullReviewBoard,
    PullReviewBoardInput, PullReviewCard, PullReviewColumn, PullReviewDecision,
    PullReviewDecisionBoard, PullReviewDecisionBoardInput, PullReviewDecisionCard,
    PullReviewDecisionColumn, PullReviewRequest, PullReviewRequestBoard,
    PullReviewRequestBoardInput, PullReviewRequestCard, PullReviewRequestColumn, PullReviewerQueue,
    PullReviewerQueueCard, PullReviewerQueueColumn, PullReviewerQueueInput, RequestReviewInput,
    SubmitReviewInput,
};
use bindings::exports::comtrya::platform::reactor::{
    Guest as ReactorGuest, MutationCall, Reaction,
};

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

const COLLECTION: &str = "pull_requests";
const REVIEW_COLLECTION: &str = "pull_request_reviews";
const REVIEW_REQUEST_COLLECTION: &str = "pull_review_requests";
// Renamed from "_meta" (was shared with ext_issues, causing a
// collection_owners BTreeMap last-write-wins collision — see #153).
const COUNTER_COLLECTION: &str = "ext_pull_requests_meta";
const PULL_MERGED_EVENT: &str = "dev.comtrya.pull-request.merged";
const PULL_REVIEWED_EVENT: &str = "dev.comtrya.pull-request.reviewed";
const PULL_REVIEW_REQUESTED_EVENT: &str = "dev.comtrya.pull-request.review-requested";
const CLOSES_RELATION: &str = "comtrya://rel/com.comtrya.pulls/closes";
const ISSUE_REF_PREFIX: &str = "comtrya://issue/";
const CLOSE_ISSUE_MUTATION: &str = "ext_issues/issues.close-issue";
const BY_REF_ISSUE_OP: &str = "issues.by-ref-issue";
const MAX_TITLE_LEN: usize = 512;
const MAX_BODY_LEN: usize = 64 * 1024;

/// Minimal projection of the issue record we need from
/// `ext_issues/issues.by-ref-issue` to decide whether the reactor
/// should skip auto-close. We deliberately don't deserialise the
/// full issue — extra fields are tolerated, missing ones default to
/// `None`.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct IssueClosePolicySnapshot {
    #[serde(default)]
    close_on_merge: Option<bool>,
}

struct Component;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredPullRequest {
    id: String,
    repository: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    workspace_id: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    repository_id: Option<String>,
    number: u64,
    title: String,
    body_markdown: String,
    state: String,
    base: String,
    head: String,
    author_ref: String,
    created_at: String,
    updated_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    merged_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    merged_by_ref: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    closed_at: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    closed_by_ref: Option<String>,
}

impl StoredPullRequest {
    fn workspace_uri(&self) -> Option<String> {
        self.workspace_id
            .as_ref()
            .map(|workspace| format!("comtrya://workspace/{workspace}"))
    }

    fn to_wit(&self) -> PullRequest {
        PullRequest {
            id: self.id.clone(),
            repository: self.repository.clone(),
            workspace: self.workspace_uri(),
            number: self.number,
            title: self.title.clone(),
            body_markdown: self.body_markdown.clone(),
            state: state_from_str(&self.state),
            author_ref: self.author_ref.clone(),
            head_ref: self.head.clone(),
            base_ref: self.base.clone(),
            created_at: self.created_at.clone(),
            updated_at: self.updated_at.clone(),
            merged_at: self.merged_at.clone(),
            merged_by_ref: self.merged_by_ref.clone(),
            closed_at: self.closed_at.clone(),
            closed_by_ref: self.closed_by_ref.clone(),
        }
    }
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredPullReview {
    id: String,
    pull_id: String,
    pull_request_ref: String,
    repository: String,
    reviewer_ref: String,
    decision: String,
    body_markdown: String,
    created_at: String,
}

impl StoredPullReview {
    fn to_wit(&self) -> PullReview {
        PullReview {
            id: self.id.clone(),
            pull_id: self.pull_id.clone(),
            pull_request_ref: self.pull_request_ref.clone(),
            repository: self.repository.clone(),
            reviewer_ref: self.reviewer_ref.clone(),
            decision: review_decision_from_str(&self.decision),
            body_markdown: self.body_markdown.clone(),
            created_at: self.created_at.clone(),
        }
    }
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StoredPullReviewRequest {
    id: String,
    pull_id: String,
    pull_request_ref: String,
    repository: String,
    reviewer_ref: String,
    requested_by_ref: String,
    requested_at: String,
}

impl StoredPullReviewRequest {
    fn to_wit(&self, completed_review: Option<PullReview>) -> PullReviewRequest {
        PullReviewRequest {
            id: self.id.clone(),
            pull_id: self.pull_id.clone(),
            pull_request_ref: self.pull_request_ref.clone(),
            repository: self.repository.clone(),
            reviewer_ref: self.reviewer_ref.clone(),
            requested_by_ref: self.requested_by_ref.clone(),
            requested_at: self.requested_at.clone(),
            completed_review,
        }
    }
}

struct RepositoryScope {
    workspace_id: Option<String>,
    repository_id: Option<String>,
}

enum ReviewLane {
    Draft,
    Ready,
    Review,
    Merged,
    Closed,
}

enum MergeReadinessLane {
    Draft,
    ReviewBlocked,
    CheckBlocked,
    ReviewWaiting,
    CheckWaiting,
    Ready,
    Merged,
    Closed,
}

enum ReviewDecisionLane {
    Awaiting,
    Commented,
    Approved,
    ChangesRequested,
    Merged,
    Closed,
}

enum ReviewRequestLane {
    NeedsReview,
    Reviewed,
    Unrequested,
    Merged,
    Closed,
}

enum ReviewerQueueLane {
    NeedsReview,
    Reviewed,
    Merged,
    Closed,
}

#[derive(Default)]
struct ReviewStats {
    latest_review: Option<PullReview>,
    approval_count: u32,
    change_request_count: u32,
    comment_count: u32,
}

#[derive(Default)]
struct ActiveReviewStats {
    latest_review: Option<PullReview>,
    latest_by_reviewer: BTreeMap<String, PullReview>,
}

struct MergeReadinessFlags {
    check_blocked: bool,
    check_waiting: bool,
    review_blocked: bool,
    review_waiting: bool,
}

fn is_newer_review(candidate: &PullReview, current: Option<&PullReview>) -> bool {
    current.is_none_or(|latest| {
        (latest.created_at.as_str(), latest.id.as_str())
            <= (candidate.created_at.as_str(), candidate.id.as_str())
    })
}

impl ActiveReviewStats {
    fn record(&mut self, review: PullReview) {
        if is_newer_review(&review, self.latest_review.as_ref()) {
            self.latest_review = Some(review.clone());
        }
        let reviewer = review.reviewer_ref.clone();
        let is_newer_for_reviewer =
            is_newer_review(&review, self.latest_by_reviewer.get(&reviewer));
        if is_newer_for_reviewer {
            self.latest_by_reviewer.insert(reviewer, review);
        }
    }

    fn summary(&self, required_approvals: u32) -> PullMergeReviewSummary {
        let mut approval_count = 0u32;
        let mut change_request_count = 0u32;
        let mut comment_count = 0u32;

        for review in self.latest_by_reviewer.values() {
            match review.decision {
                PullReviewDecision::Approve => {
                    approval_count = approval_count.saturating_add(1);
                }
                PullReviewDecision::RequestChanges => {
                    change_request_count = change_request_count.saturating_add(1);
                }
                PullReviewDecision::Comment => {
                    comment_count = comment_count.saturating_add(1);
                }
            }
        }

        PullMergeReviewSummary {
            required_approvals,
            approval_count,
            change_request_count,
            comment_count,
            latest_review: self.latest_review.clone(),
        }
    }
}

fn err(code: ErrorCode, message: impl Into<String>) -> Error {
    Error {
        code,
        message: message.into(),
        path: None,
    }
}

fn review_decision_to_str(decision: PullReviewDecision) -> &'static str {
    match decision {
        PullReviewDecision::Comment => "COMMENT",
        PullReviewDecision::Approve => "APPROVE",
        PullReviewDecision::RequestChanges => "REQUEST_CHANGES",
    }
}

fn review_decision_from_str(decision: &str) -> PullReviewDecision {
    match decision {
        "APPROVE" => PullReviewDecision::Approve,
        "REQUEST_CHANGES" => PullReviewDecision::RequestChanges,
        _ => PullReviewDecision::Comment,
    }
}

fn validate_review_body(decision: PullReviewDecision, body: &str) -> Result<(), Error> {
    if body.len() > MAX_BODY_LEN {
        return Err(err(
            ErrorCode::BadInput,
            format!("review body must be at most {MAX_BODY_LEN} bytes"),
        ));
    }
    if matches!(
        decision,
        PullReviewDecision::Comment | PullReviewDecision::RequestChanges
    ) && body.trim().is_empty()
    {
        return Err(err(
            ErrorCode::BadInput,
            "comment and request-changes reviews require a body",
        ));
    }
    Ok(())
}

fn validate_reviewer_ref(reviewer_ref: &str) -> Result<(), Error> {
    let reviewer_ref = reviewer_ref.trim();
    if reviewer_ref.is_empty() || !reviewer_ref.starts_with("comtrya://") {
        return Err(err(
            ErrorCode::BadInput,
            "reviewerRef must be a non-empty comtrya:// URI",
        ));
    }
    Ok(())
}

fn state_to_str(state: PrState) -> &'static str {
    match state {
        PrState::Draft => "DRAFT",
        PrState::Ready => "READY",
        PrState::Review => "REVIEW",
        PrState::Merged => "MERGED",
        PrState::Closed => "CLOSED",
    }
}

fn state_from_str(state: &str) -> PrState {
    match state {
        "READY" => PrState::Ready,
        "REVIEW" => PrState::Review,
        "MERGED" => PrState::Merged,
        "CLOSED" => PrState::Closed,
        _ => PrState::Draft,
    }
}

fn validate_state_transition(current: &str, requested: PrState) -> Result<&'static str, Error> {
    let requested = state_to_str(requested);
    if current == requested {
        return Ok(requested);
    }
    match (current, requested) {
        ("DRAFT" | "READY" | "REVIEW", "DRAFT" | "READY" | "REVIEW") => Ok(requested),
        ("MERGED", _) | ("CLOSED", _) => Err(err(
            ErrorCode::Conflict,
            format!("cannot change state of a terminal {current} pull request"),
        )),
        (_, "MERGED" | "CLOSED") => Err(err(
            ErrorCode::BadInput,
            "use merge-pull or close-pull for terminal pull request states",
        )),
        _ => Err(err(
            ErrorCode::Conflict,
            format!("cannot change pull request state from {current} to {requested}"),
        )),
    }
}

fn review_lane(pull: &PullRequest) -> ReviewLane {
    match pull.state {
        PrState::Draft => ReviewLane::Draft,
        PrState::Ready => ReviewLane::Ready,
        PrState::Review => ReviewLane::Review,
        PrState::Merged => ReviewLane::Merged,
        PrState::Closed => ReviewLane::Closed,
    }
}

fn review_column(key: &str, label: &str, cards: Vec<PullReviewCard>) -> PullReviewColumn {
    PullReviewColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn review_columns(cards: Vec<PullReviewCard>) -> Vec<PullReviewColumn> {
    let mut drafts = Vec::new();
    let mut ready = Vec::new();
    let mut review = Vec::new();
    let mut merged = Vec::new();
    let mut closed = Vec::new();

    for card in cards {
        match review_lane(&card.pull_request) {
            ReviewLane::Draft => drafts.push(card),
            ReviewLane::Ready => ready.push(card),
            ReviewLane::Review => review.push(card),
            ReviewLane::Merged => merged.push(card),
            ReviewLane::Closed => closed.push(card),
        }
    }

    vec![
        review_column("draft", "Draft", drafts),
        review_column("ready", "Ready", ready),
        review_column("review", "In review", review),
        review_column("merged", "Merged", merged),
        review_column("closed", "Closed", closed),
    ]
}

fn merge_readiness_flags(
    pull: &PullRequest,
    summary: Option<&PullMergeCheckSummary>,
    review_summary: &PullMergeReviewSummary,
) -> MergeReadinessFlags {
    if matches!(
        pull.state,
        PrState::Draft | PrState::Merged | PrState::Closed
    ) {
        return MergeReadinessFlags {
            check_blocked: false,
            check_waiting: false,
            review_blocked: false,
            review_waiting: false,
        };
    }
    let check_blocked =
        summary.is_some_and(|summary| summary.required_missing > 0 || summary.required_failing > 0);
    let check_waiting = !check_blocked
        && match summary {
            Some(summary) => summary.pending > 0,
            None => true,
        };
    let review_blocked = review_summary.change_request_count > 0;
    let review_waiting =
        !review_blocked && review_summary.approval_count < review_summary.required_approvals;
    MergeReadinessFlags {
        check_blocked,
        check_waiting,
        review_blocked,
        review_waiting,
    }
}

fn merge_readiness_lane(card: &PullMergeReadinessCard) -> MergeReadinessLane {
    match card.pull_request.state {
        PrState::Draft => MergeReadinessLane::Draft,
        PrState::Merged => MergeReadinessLane::Merged,
        PrState::Closed => MergeReadinessLane::Closed,
        _ if card.review_blocked => MergeReadinessLane::ReviewBlocked,
        _ if card.check_blocked => MergeReadinessLane::CheckBlocked,
        _ if card.review_waiting => MergeReadinessLane::ReviewWaiting,
        _ if card.check_waiting => MergeReadinessLane::CheckWaiting,
        _ => MergeReadinessLane::Ready,
    }
}

fn merge_readiness_column(
    key: &str,
    label: &str,
    cards: Vec<PullMergeReadinessCard>,
) -> PullMergeReadinessColumn {
    PullMergeReadinessColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn merge_readiness_columns(cards: Vec<PullMergeReadinessCard>) -> Vec<PullMergeReadinessColumn> {
    let mut drafts = Vec::new();
    let mut review_blocked = Vec::new();
    let mut check_blocked = Vec::new();
    let mut review_waiting = Vec::new();
    let mut check_waiting = Vec::new();
    let mut ready = Vec::new();
    let mut merged = Vec::new();
    let mut closed = Vec::new();

    for card in cards {
        match merge_readiness_lane(&card) {
            MergeReadinessLane::Draft => drafts.push(card),
            MergeReadinessLane::ReviewBlocked => review_blocked.push(card),
            MergeReadinessLane::CheckBlocked => check_blocked.push(card),
            MergeReadinessLane::ReviewWaiting => review_waiting.push(card),
            MergeReadinessLane::CheckWaiting => check_waiting.push(card),
            MergeReadinessLane::Ready => ready.push(card),
            MergeReadinessLane::Merged => merged.push(card),
            MergeReadinessLane::Closed => closed.push(card),
        }
    }

    vec![
        merge_readiness_column("draft", "Draft", drafts),
        merge_readiness_column("blocked-review", "Blocked by review", review_blocked),
        merge_readiness_column("blocked-checks", "Blocked by checks", check_blocked),
        merge_readiness_column("needs-review", "Needs review", review_waiting),
        merge_readiness_column("waiting-checks", "Checks running", check_waiting),
        merge_readiness_column("ready", "Ready to merge", ready),
        merge_readiness_column("merged", "Merged", merged),
        merge_readiness_column("closed", "Closed", closed),
    ]
}

fn review_decision_lane(card: &PullReviewDecisionCard) -> ReviewDecisionLane {
    match card.pull_request.state {
        PrState::Merged => ReviewDecisionLane::Merged,
        PrState::Closed => ReviewDecisionLane::Closed,
        _ => match card.latest_review.as_ref().map(|review| review.decision) {
            Some(PullReviewDecision::Approve) => ReviewDecisionLane::Approved,
            Some(PullReviewDecision::RequestChanges) => ReviewDecisionLane::ChangesRequested,
            Some(PullReviewDecision::Comment) => ReviewDecisionLane::Commented,
            None => ReviewDecisionLane::Awaiting,
        },
    }
}

fn review_decision_column(
    key: &str,
    label: &str,
    cards: Vec<PullReviewDecisionCard>,
) -> PullReviewDecisionColumn {
    PullReviewDecisionColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn review_decision_columns(cards: Vec<PullReviewDecisionCard>) -> Vec<PullReviewDecisionColumn> {
    let mut awaiting = Vec::new();
    let mut commented = Vec::new();
    let mut approved = Vec::new();
    let mut changes_requested = Vec::new();
    let mut merged = Vec::new();
    let mut closed = Vec::new();

    for card in cards {
        match review_decision_lane(&card) {
            ReviewDecisionLane::Awaiting => awaiting.push(card),
            ReviewDecisionLane::Commented => commented.push(card),
            ReviewDecisionLane::Approved => approved.push(card),
            ReviewDecisionLane::ChangesRequested => changes_requested.push(card),
            ReviewDecisionLane::Merged => merged.push(card),
            ReviewDecisionLane::Closed => closed.push(card),
        }
    }

    vec![
        review_decision_column("awaiting-review", "Awaiting review", awaiting),
        review_decision_column("commented", "Review comments", commented),
        review_decision_column("approved", "Approved", approved),
        review_decision_column("changes-requested", "Changes requested", changes_requested),
        review_decision_column("merged", "Merged", merged),
        review_decision_column("closed", "Closed", closed),
    ]
}

fn review_after_request(request: &StoredPullReviewRequest, review: &PullReview) -> bool {
    review.pull_id == request.pull_id
        && review.reviewer_ref == request.reviewer_ref
        && review.created_at.as_str() >= request.requested_at.as_str()
}

fn completed_review_for_request(
    request: &StoredPullReviewRequest,
    reviews_by_pull_reviewer: &BTreeMap<(String, String), PullReview>,
) -> Option<PullReview> {
    reviews_by_pull_reviewer
        .get(&(request.pull_id.clone(), request.reviewer_ref.clone()))
        .filter(|review| review_after_request(request, review))
        .cloned()
}

fn review_request_lane(card: &PullReviewRequestCard) -> ReviewRequestLane {
    match card.pull_request.state {
        PrState::Merged => ReviewRequestLane::Merged,
        PrState::Closed => ReviewRequestLane::Closed,
        _ if card.requested_reviewer_refs.is_empty() => ReviewRequestLane::Unrequested,
        _ if card.missing_reviewer_refs.is_empty() => ReviewRequestLane::Reviewed,
        _ => ReviewRequestLane::NeedsReview,
    }
}

fn review_request_column(
    key: &str,
    label: &str,
    cards: Vec<PullReviewRequestCard>,
) -> PullReviewRequestColumn {
    PullReviewRequestColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn review_request_columns(cards: Vec<PullReviewRequestCard>) -> Vec<PullReviewRequestColumn> {
    let mut needs_review = Vec::new();
    let mut reviewed = Vec::new();
    let mut unrequested = Vec::new();
    let mut merged = Vec::new();
    let mut closed = Vec::new();

    for card in cards {
        match review_request_lane(&card) {
            ReviewRequestLane::NeedsReview => needs_review.push(card),
            ReviewRequestLane::Reviewed => reviewed.push(card),
            ReviewRequestLane::Unrequested => unrequested.push(card),
            ReviewRequestLane::Merged => merged.push(card),
            ReviewRequestLane::Closed => closed.push(card),
        }
    }

    vec![
        review_request_column("needs-review", "Needs review", needs_review),
        review_request_column("reviewed", "Reviewed", reviewed),
        review_request_column("unrequested", "Unrequested", unrequested),
        review_request_column("merged", "Merged", merged),
        review_request_column("closed", "Closed", closed),
    ]
}

fn reviewer_queue_lane(card: &PullReviewerQueueCard) -> ReviewerQueueLane {
    match card.pull_request.state {
        PrState::Merged => ReviewerQueueLane::Merged,
        PrState::Closed => ReviewerQueueLane::Closed,
        _ if card.review_request.completed_review.is_some() => ReviewerQueueLane::Reviewed,
        _ => ReviewerQueueLane::NeedsReview,
    }
}

fn reviewer_queue_column(
    key: &str,
    label: &str,
    cards: Vec<PullReviewerQueueCard>,
) -> PullReviewerQueueColumn {
    PullReviewerQueueColumn {
        key: key.to_string(),
        label: label.to_string(),
        count: cards.len() as u32,
        cards,
    }
}

fn reviewer_queue_columns(cards: Vec<PullReviewerQueueCard>) -> Vec<PullReviewerQueueColumn> {
    let mut needs_review = Vec::new();
    let mut reviewed = Vec::new();
    let mut merged = Vec::new();
    let mut closed = Vec::new();

    for card in cards {
        match reviewer_queue_lane(&card) {
            ReviewerQueueLane::NeedsReview => needs_review.push(card),
            ReviewerQueueLane::Reviewed => reviewed.push(card),
            ReviewerQueueLane::Merged => merged.push(card),
            ReviewerQueueLane::Closed => closed.push(card),
        }
    }

    vec![
        reviewer_queue_column("needs-review", "Needs review", needs_review),
        reviewer_queue_column("reviewed", "Reviewed", reviewed),
        reviewer_queue_column("merged", "Merged", merged),
        reviewer_queue_column("closed", "Closed", closed),
    ]
}

fn repository_scope(repository: &str) -> RepositoryScope {
    let Some(rest) = repository.strip_prefix("comtrya://") else {
        return RepositoryScope {
            workspace_id: None,
            repository_id: None,
        };
    };
    if let Some(rest) = rest.strip_prefix("workspace/") {
        if let Some((workspace, repository)) = rest.split_once("/repository/") {
            return RepositoryScope {
                workspace_id: Some(workspace.to_string()),
                repository_id: Some(repository.to_string()),
            };
        }
        return RepositoryScope {
            workspace_id: Some(rest.to_string()),
            repository_id: None,
        };
    }
    RepositoryScope {
        workspace_id: None,
        repository_id: rest.strip_prefix("repository/").map(str::to_string),
    }
}

fn validate_create_repository_scope(
    repository: &str,
    scope: &RepositoryScope,
) -> Result<(), Error> {
    let Some(workspace_id) = scope.workspace_id.as_deref() else {
        return Err(err(
            ErrorCode::BadInput,
            "pulls.create requires a workspace-scoped repository",
        ));
    };
    if workspace_id.trim().is_empty() {
        return Err(err(
            ErrorCode::BadInput,
            "pulls.create requires a workspace-scoped repository",
        ));
    }
    if repository.starts_with("comtrya://workspace/")
        && repository.contains("/repository/")
        && scope
            .repository_id
            .as_deref()
            .is_none_or(|repository_id| repository_id.trim().is_empty())
    {
        return Err(err(
            ErrorCode::BadInput,
            "pulls.create repository id must not be empty",
        ));
    }
    Ok(())
}

fn repository_matches(stored: &StoredPullRequest, repository: &str) -> bool {
    if repository == "comtrya://pulls" {
        return true;
    }
    if stored.repository == repository {
        return true;
    }
    let scope = repository_scope(repository);
    if let Some(workspace) = scope.workspace_id.as_deref() {
        // A workspace-scoped filter must NOT match a stored PR that has no
        // workspace anchor. The previous `.map(...).unwrap_or(false)` form
        // returned `false` (continue past the if) when `stored.workspace_id
        // == None`, falling through to the tail-return and leaking PRs
        // across workspaces. Mirror the strict comparison ext_issues uses
        // (and the TNQ-3 #191 fix in ext_checks) so a missing workspace
        // anchor fails closed.
        match stored.workspace_id.as_deref() {
            Some(stored_workspace) if stored_workspace == workspace => {}
            _ => return false,
        }
    }
    if let Some(repository_id) = scope.repository_id.as_deref() {
        if stored.repository_id.as_deref() != Some(repository_id) {
            return false;
        }
    }
    scope.workspace_id.is_some() || scope.repository_id.is_some()
}

fn decode(id: &str, bytes: &[u8]) -> Result<StoredPullRequest, Error> {
    serde_json::from_slice(bytes).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("parse pull request {id}: {error}"),
        )
    })
}

fn decode_review(id: &str, bytes: &[u8]) -> Result<StoredPullReview, Error> {
    serde_json::from_slice(bytes).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("parse pull review {id}: {error}"),
        )
    })
}

fn decode_review_request(id: &str, bytes: &[u8]) -> Result<StoredPullReviewRequest, Error> {
    serde_json::from_slice(bytes).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("parse pull review request {id}: {error}"),
        )
    })
}

fn read_stored(id: &str) -> Result<Option<StoredPullRequest>, Error> {
    let Some(snap) = storage::get(COLLECTION, id)? else {
        return Ok(None);
    };
    Ok(Some(decode(id, &snap.data)?))
}

fn scan_pull_reviews(
    mut visit: impl FnMut(StoredPullReview) -> Result<bool, Error>,
) -> Result<(), Error> {
    let mut after = None;
    loop {
        let page = storage::list_all(REVIEW_COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            let Ok(stored) = decode_review("<list>", &bytes) else {
                continue;
            };
            if visit(stored)? {
                return Ok(());
            }
        }
        match page.next_page {
            Some(next) => after = Some(next),
            None => return Ok(()),
        }
    }
}

fn scan_pull_review_requests(
    mut visit: impl FnMut(StoredPullReviewRequest) -> Result<bool, Error>,
) -> Result<(), Error> {
    let mut after = None;
    loop {
        let page = storage::list_all(REVIEW_REQUEST_COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            let Ok(stored) = decode_review_request("<list>", &bytes) else {
                continue;
            };
            if visit(stored)? {
                return Ok(());
            }
        }
        match page.next_page {
            Some(next) => after = Some(next),
            None => return Ok(()),
        }
    }
}

fn scan_pull_requests(
    mut visit: impl FnMut(StoredPullRequest) -> Result<bool, Error>,
) -> Result<(), Error> {
    let mut after = None;
    loop {
        let page = storage::list_all(COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            let Ok(stored) = decode("<list>", &bytes) else {
                continue;
            };
            if visit(stored)? {
                return Ok(());
            }
        }
        match page.next_page {
            Some(next) => after = Some(next),
            None => return Ok(()),
        }
    }
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RepoCounter {
    id: String,
    storage_id: String,
    next: u64,
}

/// Counter key for the per-scope PR-number sequence. Workspace-scoped
/// repositories share a single workspace counter; callers without a
/// workspace fall back to the repository URI.
fn number_counter_key(repository: &str, scope: &RepositoryScope) -> String {
    scope
        .workspace_id
        .as_ref()
        .map(|workspace| format!("comtrya://workspace/{workspace}"))
        .unwrap_or_else(|| repository.to_string())
}

/// Maximum number of CAS retries on a counter update before giving up.
/// `update-commit` returns `conflict` if another writer raced ahead since
/// our `update-begin`; we re-read and retry up to this bound. Eight
/// attempts cover any practical PR-create burst without unbounded looping.
const COUNTER_RETRY_LIMIT: u32 = 8;

fn read_counter(counter_id: &str) -> Result<Option<RepoCounter>, Error> {
    let mut after = None;
    let mut found = None;
    loop {
        let page = storage::list_all(COUNTER_COLLECTION, 1024, after.as_ref())?;
        for bytes in page.docs {
            let counter: RepoCounter = serde_json::from_slice(&bytes)
                .map_err(|e| err(ErrorCode::Internal, format!("parse counter: {e}")))?;
            if counter.id == counter_id {
                if found.is_some() {
                    return Err(err(
                        ErrorCode::Internal,
                        format!("counter collection contains duplicate rows for {counter_id}"),
                    ));
                }
                found = Some(counter);
            }
        }
        match page.next_page {
            Some(next) => after = Some(next),
            None => return Ok(found),
        }
    }
}

/// Return the next sequential PR number for `scope_key` and increment the
/// persisted counter atomically via storage's single-document version
/// guard (update-begin/update-commit), seeding the counter on first use.
///
/// The CAS loop retries up to `COUNTER_RETRY_LIMIT` times on `conflict`
/// (another PR-create raced us between begin and commit) and on the
/// first-use seed race (two creators hit `NotFound`, the second sees
/// `conflict` from `storage::create` and re-enters the update path).
fn next_number(scope_key: &str) -> Result<u64, Error> {
    let counter_id = format!("pull-number:{scope_key}");
    for _ in 0..COUNTER_RETRY_LIMIT {
        match read_counter(&counter_id)? {
            Some(counter) => {
                let snap = match storage::update_begin(COUNTER_COLLECTION, &counter.storage_id) {
                    Ok(snap) => snap,
                    Err(Error {
                        code: ErrorCode::NotFound,
                        ..
                    }) => continue,
                    Err(other) => return Err(other),
                };
                let mut counter: RepoCounter = serde_json::from_slice(&snap.data)
                    .map_err(|e| err(ErrorCode::Internal, format!("parse counter: {e}")))?;
                if counter.id != counter_id {
                    return Err(err(
                        ErrorCode::Internal,
                        format!("counter document has wrong id {}", counter.id),
                    ));
                }
                let assigned = counter.next;
                counter.next = counter.next.saturating_add(1);
                let bytes = serde_json::to_vec(&counter)
                    .map_err(|e| err(ErrorCode::Internal, format!("serialise counter: {e}")))?;
                match storage::update_commit(
                    COUNTER_COLLECTION,
                    &counter.storage_id,
                    &snap.version,
                    &bytes,
                ) {
                    Ok(()) => return Ok(assigned),
                    Err(Error {
                        code: ErrorCode::Conflict,
                        ..
                    }) => continue,
                    Err(other) => return Err(other),
                }
            }
            None => {
                // First PR for this scope — seed the counter at 2, return 1.
                let storage_id = ids::mint("pull-counter")?;
                let counter = RepoCounter {
                    id: counter_id.clone(),
                    storage_id: storage_id.clone(),
                    next: 2,
                };
                let bytes = serde_json::to_vec(&counter)
                    .map_err(|e| err(ErrorCode::Internal, format!("serialise counter: {e}")))?;
                match storage::create(
                    COUNTER_COLLECTION,
                    &storage_id,
                    &bytes,
                    &storage::DocumentMetadata {
                        resource_uri: format!("comtrya://pull-counter/{storage_id}"),
                        resource_refs: vec![scope_key.to_string(), counter_id.clone()],
                    },
                ) {
                    Ok(()) => return Ok(1),
                    // Another writer seeded the counter between our
                    // update-begin NotFound and our create. Fall through
                    // to the next iteration which will hit the Ok branch.
                    Err(Error {
                        code: ErrorCode::Conflict,
                        ..
                    }) => continue,
                    Err(other) => return Err(other),
                }
            }
        }
    }
    Err(err(
        ErrorCode::Unavailable,
        format!("pull-number counter for {scope_key} contended past retry limit"),
    ))
}

fn persist_new(stored: &StoredPullRequest) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("serialise pull request: {error}"),
        )
    })?;
    let pr_ref = pull_request_uri(&stored.id);
    let mut refs = vec![pr_ref.clone(), stored.repository.clone()];
    if let Some(workspace_id) = &stored.workspace_id {
        refs.push(format!("comtrya://workspace/{workspace_id}"));
    }
    if let Some(repository_id) = &stored.repository_id {
        refs.push(format!("comtrya://repository/{repository_id}"));
    }
    storage::create(
        COLLECTION,
        &stored.id,
        &bytes,
        &storage::DocumentMetadata {
            resource_uri: pr_ref,
            resource_refs: refs,
        },
    )
}

fn commit_update(id: &str, stored: &StoredPullRequest, version: &str) -> Result<(), Error> {
    let bytes = serde_json::to_vec(stored).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("serialise pull request: {error}"),
        )
    })?;
    storage::update_commit(COLLECTION, id, version, &bytes)
}

fn persist_review(review: &StoredPullReview) -> Result<(), Error> {
    let bytes = serde_json::to_vec(review).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("serialise pull review: {error}"),
        )
    })?;
    storage::create(
        REVIEW_COLLECTION,
        &review.id,
        &bytes,
        &storage::DocumentMetadata {
            resource_uri: pull_review_uri(&review.id),
            resource_refs: vec![
                pull_review_uri(&review.id),
                review.pull_request_ref.clone(),
                review.repository.clone(),
                review.reviewer_ref.clone(),
            ],
        },
    )
}

fn persist_review_request(request: &StoredPullReviewRequest) -> Result<(), Error> {
    let bytes = serde_json::to_vec(request).map_err(|error| {
        err(
            ErrorCode::Internal,
            format!("serialise pull review request: {error}"),
        )
    })?;
    let request_ref = pull_review_request_uri(&request.id);
    storage::create(
        REVIEW_REQUEST_COLLECTION,
        &request.id,
        &bytes,
        &storage::DocumentMetadata {
            resource_uri: request_ref.clone(),
            resource_refs: vec![
                request_ref,
                request.pull_request_ref.clone(),
                request.repository.clone(),
                request.reviewer_ref.clone(),
                request.requested_by_ref.clone(),
            ],
        },
    )
}

fn emit(event_type: &str, payload: &impl Serialize, source_uri: &str) -> Result<(), Error> {
    let bytes = serde_json::to_vec(payload)
        .map_err(|error| err(ErrorCode::Internal, format!("serialise event: {error}")))?;
    let _ = events::append(event_type, &bytes, Some(source_uri))?;
    Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PullEventPayload<'a> {
    pull_request_ref: &'a str,
    #[serde(skip_serializing_if = "Option::is_none")]
    workspace_id: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    number: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    merged_at: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    merged_by_ref: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    closed_by_ref: Option<&'a str>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PullReviewEventPayload<'a> {
    pull_request_ref: &'a str,
    review_ref: &'a str,
    reviewer_ref: &'a str,
    decision: &'a str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PullReviewRequestedEventPayload<'a> {
    pull_request_ref: &'a str,
    review_request_ref: &'a str,
    reviewer_ref: &'a str,
    requested_by_ref: &'a str,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PullMergedEventPayload {
    pull_request_ref: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CloseIssueReactionPayload<'a> {
    id: &'a str,
    reason: &'a str,
    closed_by_ref: &'a str,
}

fn pull_request_uri(id: &str) -> String {
    // Resource kind is "pull-request" (kebab-case), matching the
    // manifest.schema.json `^[a-z][a-z0-9-]*$` constraint and the
    // `contributes.resourceKinds[].name` value in manifest.json.
    // Previously this used "pull_request" (underscore) which made it
    // impossible to declare a `relationshipTypes` entry whose sourceKinds
    // or targetKinds included "pull-request" — the kind extracted from the
    // URI ("pull_request") would never match the schema-valid form
    // ("pull-request"). Fixes #167.
    format!("comtrya://pull-request/{id}")
}

fn pull_review_uri(id: &str) -> String {
    format!("comtrya://pull-review/{id}")
}

fn pull_review_request_uri(id: &str) -> String {
    format!("comtrya://pull-review-request/{id}")
}

impl PullsGuest for Component {
    fn create_pull(input: CreatePullInput) -> Result<PullRequest, Error> {
        let repository = input.repository.trim();
        if repository.is_empty() {
            return Err(err(
                ErrorCode::BadInput,
                "pulls.create requires a repository",
            ));
        }
        let title = input.title.trim();
        if title.is_empty() {
            return Err(err(
                ErrorCode::BadInput,
                "pull-request title must not be empty",
            ));
        }
        if title.len() > MAX_TITLE_LEN {
            return Err(err(
                ErrorCode::BadInput,
                format!("title must be at most {MAX_TITLE_LEN} bytes"),
            ));
        }
        if input.body_markdown.len() > MAX_BODY_LEN {
            return Err(err(
                ErrorCode::BadInput,
                format!("body must be at most {MAX_BODY_LEN} bytes"),
            ));
        }
        if input.base_ref.is_empty() || input.head_ref.is_empty() {
            return Err(err(
                ErrorCode::BadInput,
                "base and head branches must be non-empty",
            ));
        }
        let id = ids::mint("pull-request")?;
        let now = time::now_iso();
        let scope = repository_scope(repository);
        validate_create_repository_scope(repository, &scope)?;
        let number = next_number(&number_counter_key(repository, &scope))?;
        let author = match input.author_ref {
            Some(author) => author,
            None => identity::current_principal()?,
        };
        let stored = StoredPullRequest {
            id: id.clone(),
            repository: repository.to_string(),
            workspace_id: scope.workspace_id,
            repository_id: scope.repository_id,
            number,
            title: title.to_string(),
            body_markdown: input.body_markdown,
            state: state_to_str(PrState::Draft).to_string(),
            base: input.base_ref,
            head: input.head_ref,
            author_ref: author,
            created_at: now.clone(),
            updated_at: now,
            merged_at: None,
            merged_by_ref: None,
            closed_at: None,
            closed_by_ref: None,
        };
        persist_new(&stored)?;
        let pr_ref = pull_request_uri(&stored.id);
        emit(
            "dev.comtrya.pull-request.created",
            &PullEventPayload {
                pull_request_ref: &pr_ref,
                workspace_id: stored.workspace_id.as_deref(),
                number: Some(stored.number),
                merged_at: None,
                merged_by_ref: None,
                closed_by_ref: None,
            },
            &pr_ref,
        )?;
        Ok(stored.to_wit())
    }

    fn merge_pull(input: MergePullInput) -> Result<PullRequest, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        match stored.state.as_str() {
            "MERGED" => return Ok(stored.to_wit()),
            "CLOSED" => {
                return Err(err(
                    ErrorCode::Conflict,
                    "cannot merge a CLOSED pull request",
                ));
            }
            _ => {}
        }
        let now = time::now_iso();
        stored.state = state_to_str(PrState::Merged).to_string();
        stored.updated_at = now.clone();
        stored.merged_at = Some(now.clone());
        stored.merged_by_ref = input.merged_by_ref.clone();
        commit_update(&input.id, &stored, &snap.version)?;
        let pr_ref = pull_request_uri(&input.id);
        emit(
            PULL_MERGED_EVENT,
            &PullEventPayload {
                pull_request_ref: &pr_ref,
                workspace_id: stored.workspace_id.as_deref(),
                number: Some(stored.number),
                merged_at: stored.merged_at.as_deref(),
                merged_by_ref: input.merged_by_ref.as_deref(),
                closed_by_ref: None,
            },
            &pr_ref,
        )?;
        Ok(stored.to_wit())
    }

    fn close_pull(input: ClosePullInput) -> Result<PullRequest, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        match stored.state.as_str() {
            "MERGED" => {
                return Err(err(
                    ErrorCode::Conflict,
                    "cannot close a MERGED pull request",
                ));
            }
            "CLOSED" => return Ok(stored.to_wit()),
            _ => {}
        }
        let now = time::now_iso();
        stored.state = state_to_str(PrState::Closed).to_string();
        stored.updated_at = now;
        stored.closed_at = Some(stored.updated_at.clone());
        stored.closed_by_ref = input.closed_by_ref.clone();
        commit_update(&input.id, &stored, &snap.version)?;
        let pr_ref = pull_request_uri(&input.id);
        emit(
            "dev.comtrya.pull-request.closed",
            &PullEventPayload {
                pull_request_ref: &pr_ref,
                workspace_id: stored.workspace_id.as_deref(),
                number: Some(stored.number),
                merged_at: None,
                merged_by_ref: None,
                closed_by_ref: input.closed_by_ref.as_deref(),
            },
            &pr_ref,
        )?;
        Ok(stored.to_wit())
    }

    fn change_state_pull(input: ChangeStatePullInput) -> Result<PullRequest, Error> {
        let snap = storage::update_begin(COLLECTION, &input.id)?;
        let mut stored = decode(&input.id, &snap.data)?;
        let next = validate_state_transition(&stored.state, input.state)?;
        if stored.state != next {
            stored.state = next.to_string();
            stored.updated_at = time::now_iso();
            commit_update(&input.id, &stored, &snap.version)?;
        }
        Ok(stored.to_wit())
    }

    fn submit_review(input: SubmitReviewInput) -> Result<PullReview, Error> {
        validate_review_body(input.decision, &input.body_markdown)?;
        let Some(pull) = read_stored(&input.pull_id)? else {
            return Err(err(
                ErrorCode::NotFound,
                format!("pull request {} does not exist", input.pull_id),
            ));
        };
        if matches!(pull.state.as_str(), "MERGED" | "CLOSED") {
            return Err(err(
                ErrorCode::Conflict,
                "cannot review a terminal pull request",
            ));
        }
        let reviewer_ref = match input.reviewer_ref {
            Some(reviewer_ref) => reviewer_ref,
            None => identity::current_principal()?,
        };
        let id = ids::mint("pull-review")?;
        let pull_request_ref = pull_request_uri(&pull.id);
        let decision = review_decision_to_str(input.decision).to_string();
        let review = StoredPullReview {
            id: id.clone(),
            pull_id: pull.id,
            pull_request_ref,
            repository: pull.repository,
            reviewer_ref,
            decision,
            body_markdown: input.body_markdown,
            created_at: time::now_iso(),
        };
        persist_review(&review)?;
        let review_ref = pull_review_uri(&review.id);
        emit(
            PULL_REVIEWED_EVENT,
            &PullReviewEventPayload {
                pull_request_ref: &review.pull_request_ref,
                review_ref: &review_ref,
                reviewer_ref: &review.reviewer_ref,
                decision: &review.decision,
            },
            &review.pull_request_ref,
        )?;
        Ok(review.to_wit())
    }

    fn list_pull_reviews(input: ListPullReviewsInput) -> Result<Vec<PullReview>, Error> {
        if read_stored(&input.pull_id)?.is_none() {
            return Err(err(
                ErrorCode::NotFound,
                format!("pull request {} does not exist", input.pull_id),
            ));
        }
        let limit = input.limit.min(1024) as usize;
        if limit == 0 {
            return Ok(Vec::new());
        }
        let mut reviews = Vec::new();
        scan_pull_reviews(|stored| {
            if stored.pull_id == input.pull_id {
                reviews.push(stored.to_wit());
                if reviews.len() >= limit {
                    return Ok(true);
                }
            }
            Ok(false)
        })?;
        Ok(reviews)
    }

    fn request_review(input: RequestReviewInput) -> Result<PullReviewRequest, Error> {
        validate_reviewer_ref(&input.reviewer_ref)?;
        let Some(pull) = read_stored(&input.pull_id)? else {
            return Err(err(
                ErrorCode::NotFound,
                format!("pull request {} does not exist", input.pull_id),
            ));
        };
        if matches!(pull.state.as_str(), "MERGED" | "CLOSED") {
            return Err(err(
                ErrorCode::Conflict,
                "cannot request review for a terminal pull request",
            ));
        }

        let mut existing = None;
        scan_pull_review_requests(|stored| {
            if stored.pull_id == input.pull_id && stored.reviewer_ref == input.reviewer_ref {
                existing = Some(stored);
                return Ok(true);
            }
            Ok(false)
        })?;
        if let Some(existing) = existing {
            return Ok(existing.to_wit(None));
        }

        let requested_by_ref = match input.requested_by_ref {
            Some(requested_by_ref) => requested_by_ref,
            None => identity::current_principal()?,
        };
        let id = ids::mint("pull-review-request")?;
        let request = StoredPullReviewRequest {
            id: id.clone(),
            pull_id: pull.id,
            pull_request_ref: pull_request_uri(&input.pull_id),
            repository: pull.repository,
            reviewer_ref: input.reviewer_ref,
            requested_by_ref,
            requested_at: time::now_iso(),
        };
        persist_review_request(&request)?;
        let review_request_ref = pull_review_request_uri(&request.id);
        emit(
            PULL_REVIEW_REQUESTED_EVENT,
            &PullReviewRequestedEventPayload {
                pull_request_ref: &request.pull_request_ref,
                review_request_ref: &review_request_ref,
                reviewer_ref: &request.reviewer_ref,
                requested_by_ref: &request.requested_by_ref,
            },
            &request.pull_request_ref,
        )?;
        Ok(request.to_wit(None))
    }

    fn list_review_requests(
        input: ListReviewRequestsInput,
    ) -> Result<Vec<PullReviewRequest>, Error> {
        if read_stored(&input.pull_id)?.is_none() {
            return Err(err(
                ErrorCode::NotFound,
                format!("pull request {} does not exist", input.pull_id),
            ));
        }
        let limit = input.limit.min(1024) as usize;
        if limit == 0 {
            return Ok(Vec::new());
        }

        let mut reviews_by_pull_reviewer = BTreeMap::<(String, String), PullReview>::new();
        scan_pull_reviews(|stored| {
            let review = stored.to_wit();
            let key = (review.pull_id.clone(), review.reviewer_ref.clone());
            if is_newer_review(&review, reviews_by_pull_reviewer.get(&key)) {
                reviews_by_pull_reviewer.insert(key, review);
            }
            Ok(false)
        })?;

        let mut requests = Vec::new();
        scan_pull_review_requests(|stored| {
            if stored.pull_id == input.pull_id {
                let completed_review =
                    completed_review_for_request(&stored, &reviews_by_pull_reviewer);
                requests.push(stored.to_wit(completed_review));
                if requests.len() >= limit {
                    return Ok(true);
                }
            }
            Ok(false)
        })?;
        Ok(requests)
    }

    fn get_pull(id: String) -> Result<Option<PullRequest>, Error> {
        Ok(read_stored(&id)?.map(|stored| stored.to_wit()))
    }

    fn list_pulls(repository: String, limit: u32) -> Result<Vec<PullRequest>, Error> {
        let limit = limit.min(1024) as usize;
        if limit == 0 {
            return Ok(Vec::new());
        }
        let mut out = Vec::new();
        scan_pull_requests(|stored| {
            if repository_matches(&stored, &repository) {
                out.push(stored.to_wit());
                if out.len() >= limit {
                    return Ok(true);
                }
            }
            Ok(false)
        })?;
        Ok(out)
    }

    fn review_board(input: PullReviewBoardInput) -> Result<PullReviewBoard, Error> {
        let limit = input.limit.min(1024) as usize;
        let mut cards = Vec::new();
        if limit > 0 {
            scan_pull_requests(|stored| {
                if repository_matches(&stored, &input.repository) {
                    let pull_request = stored.to_wit();
                    let terminal = matches!(pull_request.state, PrState::Merged | PrState::Closed);
                    cards.push(PullReviewCard {
                        pull_request,
                        terminal,
                    });
                    if cards.len() >= limit {
                        return Ok(true);
                    }
                }
                Ok(false)
            })?;
        }
        let total = cards.len() as u32;
        Ok(PullReviewBoard {
            repository: input.repository,
            total,
            columns: review_columns(cards),
        })
    }

    fn merge_readiness_board(
        input: PullMergeReadinessBoardInput,
    ) -> Result<PullMergeReadinessBoard, Error> {
        let limit = input.limit.min(1024) as usize;
        let mut summaries_by_pull = input
            .check_summaries
            .into_iter()
            .map(|summary| (summary.pull_id.clone(), summary))
            .collect::<BTreeMap<_, _>>();
        let mut reviews_by_pull = BTreeMap::<String, ActiveReviewStats>::new();
        if limit > 0 {
            scan_pull_reviews(|stored| {
                let review = stored.to_wit();
                reviews_by_pull
                    .entry(review.pull_id.clone())
                    .or_default()
                    .record(review);
                Ok(false)
            })?;
        }
        let mut cards = Vec::new();
        if limit > 0 {
            scan_pull_requests(|stored| {
                if repository_matches(&stored, &input.repository) {
                    let pull_request = stored.to_wit();
                    let check_summary = summaries_by_pull.remove(&pull_request.id);
                    let review_summary = reviews_by_pull
                        .remove(&pull_request.id)
                        .unwrap_or_default()
                        .summary(input.required_approvals);
                    let flags = merge_readiness_flags(
                        &pull_request,
                        check_summary.as_ref(),
                        &review_summary,
                    );
                    let blocked = flags.check_blocked || flags.review_blocked;
                    let waiting = flags.check_waiting || flags.review_waiting;
                    let terminal = matches!(pull_request.state, PrState::Merged | PrState::Closed);
                    cards.push(PullMergeReadinessCard {
                        pull_request,
                        terminal,
                        blocked,
                        waiting,
                        check_blocked: flags.check_blocked,
                        check_waiting: flags.check_waiting,
                        review_blocked: flags.review_blocked,
                        review_waiting: flags.review_waiting,
                        check_summary,
                        review_summary,
                    });
                    if cards.len() >= limit {
                        return Ok(true);
                    }
                }
                Ok(false)
            })?;
        }
        let total = cards.len() as u32;
        Ok(PullMergeReadinessBoard {
            repository: input.repository,
            total,
            columns: merge_readiness_columns(cards),
        })
    }

    fn review_decision_board(
        input: PullReviewDecisionBoardInput,
    ) -> Result<PullReviewDecisionBoard, Error> {
        let mut reviews_by_pull = BTreeMap::<String, ReviewStats>::new();
        scan_pull_reviews(|stored| {
            if stored.repository == input.repository {
                let review = stored.to_wit();
                let stats = reviews_by_pull.entry(review.pull_id.clone()).or_default();
                match review.decision {
                    PullReviewDecision::Approve => {
                        stats.approval_count = stats.approval_count.saturating_add(1);
                    }
                    PullReviewDecision::RequestChanges => {
                        stats.change_request_count = stats.change_request_count.saturating_add(1);
                    }
                    PullReviewDecision::Comment => {
                        stats.comment_count = stats.comment_count.saturating_add(1);
                    }
                }
                if is_newer_review(&review, stats.latest_review.as_ref()) {
                    stats.latest_review = Some(review);
                }
            }
            Ok(false)
        })?;

        let limit = input.limit.min(1024) as usize;
        let mut cards = Vec::new();
        if limit > 0 {
            scan_pull_requests(|stored| {
                if repository_matches(&stored, &input.repository) {
                    let pull_request = stored.to_wit();
                    let stats = reviews_by_pull.remove(&pull_request.id).unwrap_or_default();
                    let terminal = matches!(pull_request.state, PrState::Merged | PrState::Closed);
                    cards.push(PullReviewDecisionCard {
                        pull_request,
                        latest_review: stats.latest_review,
                        approval_count: stats.approval_count,
                        change_request_count: stats.change_request_count,
                        comment_count: stats.comment_count,
                        terminal,
                    });
                    if cards.len() >= limit {
                        return Ok(true);
                    }
                }
                Ok(false)
            })?;
        }
        let total = cards.len() as u32;
        Ok(PullReviewDecisionBoard {
            repository: input.repository,
            total,
            columns: review_decision_columns(cards),
        })
    }

    fn review_request_board(
        input: PullReviewRequestBoardInput,
    ) -> Result<PullReviewRequestBoard, Error> {
        let mut reviews_by_pull = BTreeMap::<String, ReviewStats>::new();
        let mut reviews_by_pull_reviewer = BTreeMap::<(String, String), PullReview>::new();
        scan_pull_reviews(|stored| {
            if stored.repository == input.repository {
                let review = stored.to_wit();
                let stats = reviews_by_pull.entry(review.pull_id.clone()).or_default();
                if is_newer_review(&review, stats.latest_review.as_ref()) {
                    stats.latest_review = Some(review.clone());
                }
                let key = (review.pull_id.clone(), review.reviewer_ref.clone());
                if is_newer_review(&review, reviews_by_pull_reviewer.get(&key)) {
                    reviews_by_pull_reviewer.insert(key, review);
                }
            }
            Ok(false)
        })?;

        let mut requests_by_pull = BTreeMap::<String, Vec<StoredPullReviewRequest>>::new();
        scan_pull_review_requests(|stored| {
            if stored.repository == input.repository {
                requests_by_pull
                    .entry(stored.pull_id.clone())
                    .or_default()
                    .push(stored);
            }
            Ok(false)
        })?;

        let limit = input.limit.min(1024) as usize;
        let mut cards = Vec::new();
        if limit > 0 {
            scan_pull_requests(|stored| {
                if repository_matches(&stored, &input.repository) {
                    let pull_request = stored.to_wit();
                    let mut requests = requests_by_pull
                        .remove(&pull_request.id)
                        .unwrap_or_default();
                    requests.sort_by(|left, right| {
                        left.requested_at
                            .cmp(&right.requested_at)
                            .then_with(|| left.id.cmp(&right.id))
                    });

                    let mut requested_reviewer_refs = Vec::new();
                    let mut completed_reviewer_refs = Vec::new();
                    let mut missing_reviewer_refs = Vec::new();
                    for request in requests {
                        requested_reviewer_refs.push(request.reviewer_ref.clone());
                        if completed_review_for_request(&request, &reviews_by_pull_reviewer)
                            .is_some()
                        {
                            completed_reviewer_refs.push(request.reviewer_ref);
                        } else {
                            missing_reviewer_refs.push(request.reviewer_ref);
                        }
                    }

                    let latest_review = reviews_by_pull
                        .remove(&pull_request.id)
                        .and_then(|stats| stats.latest_review);
                    let terminal = matches!(pull_request.state, PrState::Merged | PrState::Closed);
                    cards.push(PullReviewRequestCard {
                        pull_request,
                        requested_reviewer_refs,
                        completed_reviewer_refs,
                        missing_reviewer_refs,
                        latest_review,
                        terminal,
                    });
                    if cards.len() >= limit {
                        return Ok(true);
                    }
                }
                Ok(false)
            })?;
        }

        let total = cards.len() as u32;
        Ok(PullReviewRequestBoard {
            repository: input.repository,
            total,
            columns: review_request_columns(cards),
        })
    }

    fn reviewer_queue(input: PullReviewerQueueInput) -> Result<PullReviewerQueue, Error> {
        let reviewer_ref = match input.reviewer_ref {
            Some(reviewer_ref) => {
                validate_reviewer_ref(&reviewer_ref)?;
                reviewer_ref
            }
            None => identity::current_principal()?,
        };

        let mut pulls_by_id = BTreeMap::<String, PullRequest>::new();
        scan_pull_requests(|stored| {
            if repository_matches(&stored, &input.repository) {
                let pull_request = stored.to_wit();
                pulls_by_id.insert(pull_request.id.clone(), pull_request);
            }
            Ok(false)
        })?;

        let mut reviews_by_pull = BTreeMap::<String, ReviewStats>::new();
        let mut reviews_by_pull_reviewer = BTreeMap::<(String, String), PullReview>::new();
        scan_pull_reviews(|stored| {
            if stored.repository == input.repository {
                let review = stored.to_wit();
                let stats = reviews_by_pull.entry(review.pull_id.clone()).or_default();
                if is_newer_review(&review, stats.latest_review.as_ref()) {
                    stats.latest_review = Some(review.clone());
                }
                let key = (review.pull_id.clone(), review.reviewer_ref.clone());
                if is_newer_review(&review, reviews_by_pull_reviewer.get(&key)) {
                    reviews_by_pull_reviewer.insert(key, review);
                }
            }
            Ok(false)
        })?;

        let limit = input.limit.min(1024) as usize;
        let mut requests = Vec::new();
        if limit > 0 {
            scan_pull_review_requests(|stored| {
                if stored.repository == input.repository && stored.reviewer_ref == reviewer_ref {
                    requests.push(stored);
                }
                Ok(false)
            })?;
            requests.sort_by(|left, right| {
                right
                    .requested_at
                    .cmp(&left.requested_at)
                    .then_with(|| right.id.cmp(&left.id))
            });
        }

        let mut cards = Vec::new();
        for request in requests.into_iter().take(limit) {
            let Some(pull_request) = pulls_by_id.get(&request.pull_id).cloned() else {
                continue;
            };
            let latest_review = reviews_by_pull
                .get(&pull_request.id)
                .and_then(|stats| stats.latest_review.clone());
            let completed_review =
                completed_review_for_request(&request, &reviews_by_pull_reviewer);
            let terminal = matches!(pull_request.state, PrState::Merged | PrState::Closed);
            cards.push(PullReviewerQueueCard {
                pull_request,
                review_request: request.to_wit(completed_review),
                latest_review,
                terminal,
            });
        }

        let total = cards.len() as u32;
        Ok(PullReviewerQueue {
            repository: input.repository,
            reviewer_ref,
            total,
            columns: reviewer_queue_columns(cards),
        })
    }
}

impl ReactorGuest for Component {
    fn subscribed_event_types() -> Result<Vec<String>, Error> {
        Ok(vec![PULL_MERGED_EVENT.to_string()])
    }

    fn on_event(triggering_event: Event) -> Result<Vec<Reaction>, Error> {
        if triggering_event.event_type != PULL_MERGED_EVENT {
            return Ok(Vec::new());
        }
        let payload: PullMergedEventPayload = serde_json::from_slice(&triggering_event.payload)
            .map_err(|error| {
                err(
                    ErrorCode::BadInput,
                    format!("parse pull request merged event: {error}"),
                )
            })?;
        if payload.pull_request_ref.trim().is_empty() {
            return Ok(Vec::new());
        }
        let page =
            relations::outgoing(&payload.pull_request_ref, Some(CLOSES_RELATION), 1024, None)?;
        let mut reactions = Vec::new();
        for relation in page.relations {
            let Some(issue_id) = relation.target.strip_prefix(ISSUE_REF_PREFIX) else {
                continue;
            };
            if issue_id.trim().is_empty() {
                continue;
            }
            // CUE-driven policy: ask ext_issues for the issue, and if
            // `close-on-merge` was stamped `false` at open time, skip
            // the close. `None` keeps the historical behaviour
            // (always close).
            if let Some(false) = issue_close_on_merge(&relation.target) {
                continue;
            }
            let reaction_payload = serde_json::to_vec(&CloseIssueReactionPayload {
                id: issue_id,
                reason: "completed",
                closed_by_ref: &payload.pull_request_ref,
            })
            .map_err(|error| {
                err(
                    ErrorCode::Internal,
                    format!("serialise close issue reaction: {error}"),
                )
            })?;
            reactions.push(Reaction::InvokeMutation(MutationCall {
                name: CLOSE_ISSUE_MUTATION.to_string(),
                payload: reaction_payload,
            }));
        }
        Ok(reactions)
    }
}

/// Look up an issue's `close-on-merge` policy via the kernel's
/// cross-extension op broker. Returns `None` when the field is unset
/// (legacy / unscoped issue) or any error happens — the caller then
/// applies the historical default.
fn issue_close_on_merge(issue_ref: &str) -> Option<bool> {
    let payload = serde_json::to_vec(issue_ref).ok()?;
    let response = ops::invoke("ext_issues", BY_REF_ISSUE_OP, &payload).ok()?;
    let snapshot: IssueClosePolicySnapshot = serde_json::from_slice(&response).ok()?;
    snapshot.close_on_merge
}

bindings::export!(Component with_types_in bindings);

#[cfg(test)]
mod tests {
    use super::{
        completed_review_for_request, merge_readiness_columns, merge_readiness_flags,
        review_columns, review_decision_columns, review_request_columns, reviewer_queue_columns,
        state_from_str, state_to_str, validate_review_body, validate_reviewer_ref,
        validate_state_transition, ActiveReviewStats, ErrorCode, PrState, PullMergeCheckSummary,
        PullMergeReadinessCard, PullMergeReviewSummary, PullRequest, PullReview, PullReviewCard,
        PullReviewDecision, PullReviewDecisionCard, PullReviewRequestCard, PullReviewerQueueCard,
        StoredPullReviewRequest,
    };

    use std::collections::BTreeMap;

    /// #6 P0-6 regression: REVIEW round-trips losslessly through the
    /// component's state_to_str/state_from_str pair. Guards against
    /// a future typo (e.g. "review" lowercase) that the unrecognised-
    /// default would silently degrade to PrState::Draft.
    #[test]
    fn state_round_trip_review() {
        let s = state_to_str(PrState::Review);
        assert_eq!(s, "REVIEW");
        assert!(matches!(state_from_str(s), PrState::Review));
    }

    /// Sanity-check existing 4 cases still round-trip — guards against
    /// a rename that breaks the wire format compatibility with the host.
    #[test]
    fn state_round_trip_pre_existing_cases() {
        for state in [
            PrState::Draft,
            PrState::Ready,
            PrState::Merged,
            PrState::Closed,
        ] {
            let s = state_to_str(state);
            // Round-trip through string and back must yield the same
            // variant (compare via to_str again for variant equality
            // since PrState doesn't impl PartialEq).
            assert_eq!(state_to_str(state_from_str(s)), s);
        }
    }

    fn pull_with_state(id: &str, state: PrState) -> PullRequest {
        PullRequest {
            id: id.to_string(),
            repository: "comtrya://workspace/ws/repository/repo".to_string(),
            workspace: Some("comtrya://workspace/ws".to_string()),
            number: 1,
            title: id.to_string(),
            body_markdown: String::new(),
            state,
            author_ref: "comtrya://user/rawkode".to_string(),
            head_ref: "feature/x".to_string(),
            base_ref: "main".to_string(),
            created_at: "2026-06-20T00:00:00Z".to_string(),
            updated_at: "2026-06-20T00:00:00Z".to_string(),
            merged_at: None,
            merged_by_ref: None,
            closed_at: None,
            closed_by_ref: None,
        }
    }

    #[test]
    fn review_columns_group_cards_by_pr_state() {
        let columns = review_columns(vec![
            PullReviewCard {
                pull_request: pull_with_state("draft", PrState::Draft),
                terminal: false,
            },
            PullReviewCard {
                pull_request: pull_with_state("ready", PrState::Ready),
                terminal: false,
            },
            PullReviewCard {
                pull_request: pull_with_state("review", PrState::Review),
                terminal: false,
            },
            PullReviewCard {
                pull_request: pull_with_state("merged", PrState::Merged),
                terminal: true,
            },
            PullReviewCard {
                pull_request: pull_with_state("closed", PrState::Closed),
                terminal: true,
            },
        ]);

        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();
        assert_eq!(keys, ["draft", "ready", "review", "merged", "closed"]);
        assert_eq!(columns.iter().map(|column| column.count).sum::<u32>(), 5);
        assert_eq!(columns[0].cards[0].pull_request.id, "draft");
        assert_eq!(columns[1].cards[0].pull_request.id, "ready");
        assert_eq!(columns[2].cards[0].pull_request.id, "review");
        assert_eq!(columns[3].cards[0].pull_request.id, "merged");
        assert!(columns[3].cards[0].terminal);
        assert_eq!(columns[4].cards[0].pull_request.id, "closed");
        assert!(columns[4].cards[0].terminal);
    }

    fn summary_for(pull_id: &str) -> PullMergeCheckSummary {
        PullMergeCheckSummary {
            pull_id: pull_id.to_string(),
            required_missing: 0,
            required_failing: 0,
            pending: 0,
            optional_failing: 0,
            passing: 3,
            total: 3,
        }
    }

    fn review_summary(
        required_approvals: u32,
        approval_count: u32,
        change_request_count: u32,
    ) -> PullMergeReviewSummary {
        PullMergeReviewSummary {
            required_approvals,
            approval_count,
            change_request_count,
            comment_count: 0,
            latest_review: None,
        }
    }

    fn readiness_card(
        pull_request: PullRequest,
        terminal: bool,
        check_blocked: bool,
        check_waiting: bool,
        review_blocked: bool,
        review_waiting: bool,
        check_summary: Option<PullMergeCheckSummary>,
        review_summary: PullMergeReviewSummary,
    ) -> PullMergeReadinessCard {
        PullMergeReadinessCard {
            pull_request,
            terminal,
            blocked: check_blocked || review_blocked,
            waiting: check_waiting || review_waiting,
            check_blocked,
            check_waiting,
            review_blocked,
            review_waiting,
            check_summary,
            review_summary,
        }
    }

    #[test]
    fn merge_readiness_columns_group_by_checks_and_terminal_state() {
        let blocked_summary = PullMergeCheckSummary {
            required_missing: 1,
            ..summary_for("blocked")
        };
        let waiting_summary = PullMergeCheckSummary {
            pending: 1,
            ..summary_for("waiting")
        };
        let ready_summary = summary_for("ready");

        let blocked_pull = pull_with_state("blocked", PrState::Review);
        let waiting_pull = pull_with_state("waiting", PrState::Ready);
        let ready_pull = pull_with_state("ready", PrState::Review);
        let draft_pull = pull_with_state("draft", PrState::Draft);
        let merged_pull = pull_with_state("merged", PrState::Merged);
        let closed_pull = pull_with_state("closed", PrState::Closed);
        let open_review_summary = review_summary(0, 0, 0);

        let flags =
            merge_readiness_flags(&blocked_pull, Some(&blocked_summary), &open_review_summary);
        assert!(flags.check_blocked);
        assert!(!flags.check_waiting);
        assert!(!flags.review_blocked);
        assert!(!flags.review_waiting);
        let flags =
            merge_readiness_flags(&waiting_pull, Some(&waiting_summary), &open_review_summary);
        assert!(!flags.check_blocked);
        assert!(flags.check_waiting);
        let flags = merge_readiness_flags(&ready_pull, Some(&ready_summary), &open_review_summary);
        assert!(!flags.check_blocked);
        assert!(!flags.check_waiting);
        let flags = merge_readiness_flags(&ready_pull, None, &open_review_summary);
        assert!(!flags.check_blocked);
        assert!(flags.check_waiting);

        let needs_review = review_summary(1, 0, 0);
        let flags = merge_readiness_flags(&ready_pull, Some(&ready_summary), &needs_review);
        assert!(!flags.review_blocked);
        assert!(flags.review_waiting);

        let changes_requested = review_summary(1, 1, 1);
        let flags = merge_readiness_flags(&ready_pull, Some(&ready_summary), &changes_requested);
        assert!(flags.review_blocked);
        assert!(!flags.review_waiting);

        let columns = merge_readiness_columns(vec![
            readiness_card(
                draft_pull,
                false,
                false,
                false,
                false,
                false,
                None,
                review_summary(1, 0, 0),
            ),
            readiness_card(
                pull_with_state("review-blocked", PrState::Review),
                false,
                false,
                false,
                true,
                false,
                Some(summary_for("review-blocked")),
                review_summary(1, 1, 1),
            ),
            readiness_card(
                blocked_pull,
                false,
                true,
                false,
                false,
                false,
                Some(blocked_summary),
                review_summary(0, 0, 0),
            ),
            readiness_card(
                pull_with_state("needs-review", PrState::Review),
                false,
                false,
                false,
                false,
                true,
                Some(summary_for("needs-review")),
                review_summary(1, 0, 0),
            ),
            readiness_card(
                waiting_pull,
                false,
                false,
                true,
                false,
                false,
                Some(waiting_summary),
                review_summary(0, 0, 0),
            ),
            readiness_card(
                ready_pull,
                false,
                false,
                false,
                false,
                false,
                Some(ready_summary),
                review_summary(1, 1, 0),
            ),
            readiness_card(
                merged_pull,
                true,
                false,
                false,
                false,
                false,
                None,
                review_summary(1, 0, 0),
            ),
            readiness_card(
                closed_pull,
                true,
                false,
                false,
                false,
                false,
                None,
                review_summary(1, 0, 0),
            ),
        ]);

        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();
        assert_eq!(
            keys,
            [
                "draft",
                "blocked-review",
                "blocked-checks",
                "needs-review",
                "waiting-checks",
                "ready",
                "merged",
                "closed"
            ]
        );
        assert_eq!(columns.iter().map(|column| column.count).sum::<u32>(), 8);
        assert_eq!(columns[0].cards[0].pull_request.id, "draft");
        assert_eq!(columns[1].cards[0].pull_request.id, "review-blocked");
        assert_eq!(columns[2].cards[0].pull_request.id, "blocked");
        assert_eq!(columns[3].cards[0].pull_request.id, "needs-review");
        assert_eq!(columns[4].cards[0].pull_request.id, "waiting");
        assert_eq!(columns[5].cards[0].pull_request.id, "ready");
        assert_eq!(columns[6].cards[0].pull_request.id, "merged");
        assert!(columns[6].cards[0].terminal);
        assert_eq!(columns[7].cards[0].pull_request.id, "closed");
        assert!(columns[7].cards[0].terminal);
    }

    fn pull_review(id: &str, pull_id: &str, decision: PullReviewDecision) -> PullReview {
        PullReview {
            id: id.to_string(),
            pull_id: pull_id.to_string(),
            pull_request_ref: format!("comtrya://pull-request/{pull_id}"),
            repository: "comtrya://workspace/ws/repository/repo".to_string(),
            reviewer_ref: "comtrya://user/reviewer".to_string(),
            decision,
            body_markdown: "review body".to_string(),
            created_at: format!("2026-06-20T00:00:0{}Z", id.len()),
        }
    }

    fn pull_review_by(id: &str, pull_id: &str, reviewer_ref: &str, created_at: &str) -> PullReview {
        PullReview {
            id: id.to_string(),
            pull_id: pull_id.to_string(),
            pull_request_ref: format!("comtrya://pull-request/{pull_id}"),
            repository: "comtrya://workspace/ws/repository/repo".to_string(),
            reviewer_ref: reviewer_ref.to_string(),
            decision: PullReviewDecision::Approve,
            body_markdown: "review body".to_string(),
            created_at: created_at.to_string(),
        }
    }

    fn review_request(id: &str, pull_id: &str, reviewer_ref: &str) -> StoredPullReviewRequest {
        StoredPullReviewRequest {
            id: id.to_string(),
            pull_id: pull_id.to_string(),
            pull_request_ref: format!("comtrya://pull-request/{pull_id}"),
            repository: "comtrya://workspace/ws/repository/repo".to_string(),
            reviewer_ref: reviewer_ref.to_string(),
            requested_by_ref: "comtrya://user/author".to_string(),
            requested_at: "2026-06-20T00:00:02Z".to_string(),
        }
    }

    #[test]
    fn completed_review_for_request_requires_same_reviewer_after_request() {
        let request = review_request("request", "pull", "comtrya://user/reviewer");
        let mut reviews = BTreeMap::new();
        reviews.insert(
            ("pull".to_string(), "comtrya://user/reviewer".to_string()),
            pull_review_by(
                "old",
                "pull",
                "comtrya://user/reviewer",
                "2026-06-20T00:00:01Z",
            ),
        );
        assert!(completed_review_for_request(&request, &reviews).is_none());

        reviews.insert(
            ("pull".to_string(), "comtrya://user/other".to_string()),
            pull_review_by(
                "other",
                "pull",
                "comtrya://user/other",
                "2026-06-20T00:00:03Z",
            ),
        );
        assert!(completed_review_for_request(&request, &reviews).is_none());

        reviews.insert(
            ("pull".to_string(), "comtrya://user/reviewer".to_string()),
            pull_review_by(
                "new",
                "pull",
                "comtrya://user/reviewer",
                "2026-06-20T00:00:03Z",
            ),
        );
        assert_eq!(
            completed_review_for_request(&request, &reviews)
                .as_ref()
                .map(|review| review.id.as_str()),
            Some("new")
        );
    }

    #[test]
    fn review_request_columns_group_by_missing_reviewers_and_terminal_state() {
        let columns = review_request_columns(vec![
            PullReviewRequestCard {
                pull_request: pull_with_state("needs", PrState::Review),
                requested_reviewer_refs: vec!["comtrya://user/reviewer".to_string()],
                completed_reviewer_refs: Vec::new(),
                missing_reviewer_refs: vec!["comtrya://user/reviewer".to_string()],
                latest_review: None,
                terminal: false,
            },
            PullReviewRequestCard {
                pull_request: pull_with_state("reviewed", PrState::Review),
                requested_reviewer_refs: vec!["comtrya://user/reviewer".to_string()],
                completed_reviewer_refs: vec!["comtrya://user/reviewer".to_string()],
                missing_reviewer_refs: Vec::new(),
                latest_review: Some(pull_review(
                    "reviewed",
                    "reviewed",
                    PullReviewDecision::Approve,
                )),
                terminal: false,
            },
            PullReviewRequestCard {
                pull_request: pull_with_state("unrequested", PrState::Ready),
                requested_reviewer_refs: Vec::new(),
                completed_reviewer_refs: Vec::new(),
                missing_reviewer_refs: Vec::new(),
                latest_review: None,
                terminal: false,
            },
            PullReviewRequestCard {
                pull_request: pull_with_state("merged", PrState::Merged),
                requested_reviewer_refs: Vec::new(),
                completed_reviewer_refs: Vec::new(),
                missing_reviewer_refs: Vec::new(),
                latest_review: None,
                terminal: true,
            },
            PullReviewRequestCard {
                pull_request: pull_with_state("closed", PrState::Closed),
                requested_reviewer_refs: Vec::new(),
                completed_reviewer_refs: Vec::new(),
                missing_reviewer_refs: Vec::new(),
                latest_review: None,
                terminal: true,
            },
        ]);

        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();
        assert_eq!(
            keys,
            [
                "needs-review",
                "reviewed",
                "unrequested",
                "merged",
                "closed"
            ]
        );
        assert_eq!(columns.iter().map(|column| column.count).sum::<u32>(), 5);
        assert_eq!(columns[0].cards[0].pull_request.id, "needs");
        assert_eq!(columns[1].cards[0].pull_request.id, "reviewed");
        assert_eq!(columns[2].cards[0].pull_request.id, "unrequested");
        assert_eq!(columns[3].cards[0].pull_request.id, "merged");
        assert!(columns[3].cards[0].terminal);
        assert_eq!(columns[4].cards[0].pull_request.id, "closed");
        assert!(columns[4].cards[0].terminal);
    }

    #[test]
    fn reviewer_queue_columns_group_by_completion_and_terminal_state() {
        let pending_request = review_request("pending-request", "needs", "comtrya://user/reviewer");
        let reviewed_request =
            review_request("reviewed-request", "reviewed", "comtrya://user/reviewer");
        let reviewed = pull_review_by(
            "reviewed",
            "reviewed",
            "comtrya://user/reviewer",
            "2026-06-20T00:00:03Z",
        );
        let merged_request = review_request("merged-request", "merged", "comtrya://user/reviewer");
        let closed_request = review_request("closed-request", "closed", "comtrya://user/reviewer");

        let columns = reviewer_queue_columns(vec![
            PullReviewerQueueCard {
                pull_request: pull_with_state("needs", PrState::Review),
                review_request: pending_request.to_wit(None),
                latest_review: None,
                terminal: false,
            },
            PullReviewerQueueCard {
                pull_request: pull_with_state("reviewed", PrState::Review),
                review_request: reviewed_request.to_wit(Some(reviewed.clone())),
                latest_review: Some(reviewed),
                terminal: false,
            },
            PullReviewerQueueCard {
                pull_request: pull_with_state("merged", PrState::Merged),
                review_request: merged_request.to_wit(None),
                latest_review: None,
                terminal: true,
            },
            PullReviewerQueueCard {
                pull_request: pull_with_state("closed", PrState::Closed),
                review_request: closed_request.to_wit(None),
                latest_review: None,
                terminal: true,
            },
        ]);

        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();
        assert_eq!(keys, ["needs-review", "reviewed", "merged", "closed"]);
        assert_eq!(columns.iter().map(|column| column.count).sum::<u32>(), 4);
        assert_eq!(columns[0].cards[0].pull_request.id, "needs");
        assert_eq!(columns[1].cards[0].pull_request.id, "reviewed");
        assert!(columns[1].cards[0]
            .review_request
            .completed_review
            .is_some());
        assert_eq!(columns[2].cards[0].pull_request.id, "merged");
        assert!(columns[2].cards[0].terminal);
        assert_eq!(columns[3].cards[0].pull_request.id, "closed");
        assert!(columns[3].cards[0].terminal);
    }

    #[test]
    fn active_review_stats_use_each_reviewers_latest_decision() {
        let mut stats = ActiveReviewStats::default();
        stats.record(pull_review(
            "a",
            "reviewed",
            PullReviewDecision::RequestChanges,
        ));
        stats.record(pull_review(
            "later",
            "reviewed",
            PullReviewDecision::Approve,
        ));

        let summary = stats.summary(1);

        assert_eq!(summary.approval_count, 1);
        assert_eq!(summary.change_request_count, 0);
        assert!(matches!(
            summary.latest_review.as_ref().map(|review| review.decision),
            Some(PullReviewDecision::Approve)
        ));
    }

    #[test]
    fn review_decision_columns_group_by_latest_review_and_terminal_state() {
        let awaiting = PullReviewDecisionCard {
            pull_request: pull_with_state("awaiting", PrState::Review),
            latest_review: None,
            approval_count: 0,
            change_request_count: 0,
            comment_count: 0,
            terminal: false,
        };
        let commented = PullReviewDecisionCard {
            pull_request: pull_with_state("commented", PrState::Review),
            latest_review: Some(pull_review(
                "comment",
                "commented",
                PullReviewDecision::Comment,
            )),
            approval_count: 0,
            change_request_count: 0,
            comment_count: 1,
            terminal: false,
        };
        let approved = PullReviewDecisionCard {
            pull_request: pull_with_state("approved", PrState::Review),
            latest_review: Some(pull_review(
                "approve",
                "approved",
                PullReviewDecision::Approve,
            )),
            approval_count: 1,
            change_request_count: 0,
            comment_count: 0,
            terminal: false,
        };
        let changes_requested = PullReviewDecisionCard {
            pull_request: pull_with_state("changes", PrState::Review),
            latest_review: Some(pull_review(
                "changes",
                "changes",
                PullReviewDecision::RequestChanges,
            )),
            approval_count: 0,
            change_request_count: 1,
            comment_count: 0,
            terminal: false,
        };
        let merged = PullReviewDecisionCard {
            pull_request: pull_with_state("merged", PrState::Merged),
            latest_review: None,
            approval_count: 0,
            change_request_count: 0,
            comment_count: 0,
            terminal: true,
        };
        let closed = PullReviewDecisionCard {
            pull_request: pull_with_state("closed", PrState::Closed),
            latest_review: None,
            approval_count: 0,
            change_request_count: 0,
            comment_count: 0,
            terminal: true,
        };

        let columns = review_decision_columns(vec![
            awaiting,
            commented,
            approved,
            changes_requested,
            merged,
            closed,
        ]);

        let keys: Vec<_> = columns.iter().map(|column| column.key.as_str()).collect();
        assert_eq!(
            keys,
            [
                "awaiting-review",
                "commented",
                "approved",
                "changes-requested",
                "merged",
                "closed"
            ]
        );
        assert_eq!(columns.iter().map(|column| column.count).sum::<u32>(), 6);
        assert_eq!(columns[0].cards[0].pull_request.id, "awaiting");
        assert_eq!(columns[1].cards[0].pull_request.id, "commented");
        assert_eq!(columns[2].cards[0].pull_request.id, "approved");
        assert_eq!(columns[3].cards[0].pull_request.id, "changes");
        assert_eq!(columns[4].cards[0].pull_request.id, "merged");
        assert!(columns[4].cards[0].terminal);
        assert_eq!(columns[5].cards[0].pull_request.id, "closed");
        assert!(columns[5].cards[0].terminal);
    }

    #[test]
    fn validate_review_body_requires_body_for_comments_and_change_requests() {
        assert!(validate_review_body(PullReviewDecision::Approve, "").is_ok());
        let comment = validate_review_body(PullReviewDecision::Comment, "")
            .expect_err("comment reviews need text");
        assert!(matches!(comment.code, ErrorCode::BadInput));
        let request_changes = validate_review_body(PullReviewDecision::RequestChanges, "")
            .expect_err("request-changes reviews need text");
        assert!(matches!(request_changes.code, ErrorCode::BadInput));
    }

    #[test]
    fn validate_reviewer_ref_requires_comtrya_uri() {
        assert!(validate_reviewer_ref("comtrya://user/reviewer").is_ok());

        let empty = validate_reviewer_ref("").expect_err("empty reviewer ref is invalid");
        assert!(matches!(empty.code, ErrorCode::BadInput));

        let external = validate_reviewer_ref("https://example.com/user/reviewer")
            .expect_err("external ref is invalid");
        assert!(matches!(external.code, ErrorCode::BadInput));
    }

    #[test]
    fn state_transition_allows_review_flow_and_blocks_terminal_states() {
        assert_eq!(
            validate_state_transition("DRAFT", PrState::Ready).expect("draft to ready"),
            "READY"
        );
        assert_eq!(
            validate_state_transition("READY", PrState::Review).expect("ready to review"),
            "REVIEW"
        );
        assert_eq!(
            validate_state_transition("REVIEW", PrState::Ready).expect("review to ready"),
            "READY"
        );
        assert_eq!(
            validate_state_transition("READY", PrState::Draft).expect("ready to draft"),
            "DRAFT"
        );
        assert_eq!(
            validate_state_transition("REVIEW", PrState::Draft).expect("review to draft"),
            "DRAFT"
        );
        assert_eq!(
            validate_state_transition("DRAFT", PrState::Review).expect("draft to review"),
            "REVIEW"
        );
        assert_eq!(
            validate_state_transition("REVIEW", PrState::Review).expect("idempotent"),
            "REVIEW"
        );

        let terminal = validate_state_transition("MERGED", PrState::Ready)
            .expect_err("terminal states cannot reopen through change-state-pull");
        assert!(matches!(terminal.code, ErrorCode::Conflict));

        let merge = validate_state_transition("REVIEW", PrState::Merged)
            .expect_err("merge remains a dedicated operation");
        assert!(matches!(merge.code, ErrorCode::BadInput));
    }
}
