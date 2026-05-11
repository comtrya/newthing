use crate::domain::ResourceRef;
use crate::error::{CoreError, CoreResult};
use crate::ids::{IdPrefix, OpaqueId};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CheckState {
    Queued,
    InProgress,
    Completed,
}

impl CheckState {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Queued => "QUEUED",
            Self::InProgress => "IN_PROGRESS",
            Self::Completed => "COMPLETED",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CheckConclusion {
    Success,
    Failure,
    Cancelled,
    Skipped,
    Neutral,
    TimedOut,
    ActionRequired,
}

impl CheckConclusion {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Success => "SUCCESS",
            Self::Failure => "FAILURE",
            Self::Cancelled => "CANCELLED",
            Self::Skipped => "SKIPPED",
            Self::Neutral => "NEUTRAL",
            Self::TimedOut => "TIMED_OUT",
            Self::ActionRequired => "ACTION_REQUIRED",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CheckRun {
    pub id: OpaqueId,
    pub repository: ResourceRef,
    pub commit: String,
    pub name: String,
    pub producer: String,
    pub state: CheckState,
    pub conclusion: Option<CheckConclusion>,
    pub details_url: Option<String>,
    pub summary: Option<String>,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
struct CheckIdentity {
    repository: String,
    commit: String,
    name: String,
    producer: String,
}

#[derive(Debug, Default, Clone)]
pub struct CheckRegistry {
    by_identity: BTreeMap<CheckIdentity, CheckRun>,
}

impl CheckRegistry {
    pub fn create(
        &mut self,
        repository: ResourceRef,
        commit: impl Into<String>,
        name: impl Into<String>,
        producer: impl Into<String>,
    ) -> CoreResult<CheckRun> {
        let run = CheckRun {
            id: OpaqueId::new(IdPrefix::Check),
            repository,
            commit: commit.into(),
            name: name.into(),
            producer: producer.into(),
            state: CheckState::Queued,
            conclusion: None,
            details_url: None,
            summary: None,
            started_at: None,
            completed_at: None,
        };
        let identity = run.identity();
        if self.by_identity.contains_key(&identity) {
            return Err(CoreError::conflict("check identity already exists"));
        }
        self.by_identity.insert(identity, run.clone());
        Ok(run)
    }

    pub fn update(
        &mut self,
        id: &OpaqueId,
        state: CheckState,
        conclusion: Option<CheckConclusion>,
    ) -> CoreResult<CheckRun> {
        let Some((_, run)) = self.by_identity.iter_mut().find(|(_, run)| &run.id == id) else {
            return Err(CoreError::bad_user_input("unknown check run"));
        };
        run.state = state;
        run.conclusion = conclusion;
        Ok(run.clone())
    }

    pub fn commit_checks(&self, repository: &ResourceRef, commit: &str) -> Vec<&CheckRun> {
        self.by_identity
            .values()
            .filter(|run| &run.repository == repository && run.commit == commit)
            .collect()
    }

    pub fn required_checks_passed(
        &self,
        repository: &ResourceRef,
        commit: &str,
        required: &[String],
    ) -> bool {
        required.iter().all(|name| {
            self.commit_checks(repository, commit).iter().any(|run| {
                &run.name == name
                    && run.state == CheckState::Completed
                    && run.conclusion == Some(CheckConclusion::Success)
            })
        })
    }
}

impl CheckRun {
    fn identity(&self) -> CheckIdentity {
        CheckIdentity {
            repository: self.repository.canonical(),
            commit: self.commit.clone(),
            name: self.name.clone(),
            producer: self.producer.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ResourceRef;

    fn repo() -> ResourceRef {
        ResourceRef::parse("forgepoint://repository/repo_01HV0K4XAVE2H6R5M8KJZ8Q1A3").unwrap()
    }

    #[test]
    fn check_states_and_conclusions_match_graphql_contract() {
        assert_eq!(CheckState::InProgress.as_str(), "IN_PROGRESS");
        assert_eq!(CheckConclusion::ActionRequired.as_str(), "ACTION_REQUIRED");
    }

    #[test]
    fn required_check_failure_blocks_protected_update() {
        let mut registry = CheckRegistry::default();
        let check = registry
            .create(repo(), "abc123", "ci/server", "forgepoint")
            .unwrap();
        registry
            .update(
                &check.id,
                CheckState::Completed,
                Some(CheckConclusion::Failure),
            )
            .unwrap();

        assert!(!registry.required_checks_passed(&repo(), "abc123", &["ci/server".to_string()]));
    }

    #[test]
    fn required_check_success_allows_protected_update() {
        let mut registry = CheckRegistry::default();
        let check = registry
            .create(repo(), "abc123", "ci/server", "forgepoint")
            .unwrap();
        registry
            .update(
                &check.id,
                CheckState::Completed,
                Some(CheckConclusion::Success),
            )
            .unwrap();

        assert!(registry.required_checks_passed(&repo(), "abc123", &["ci/server".to_string()]));
    }
}
