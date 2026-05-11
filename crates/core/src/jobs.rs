use crate::error::{CoreError, CoreResult};
use crate::ids::{IdPrefix, OpaqueId};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum JobState {
    Queued,
    Running,
    Succeeded,
    Failed,
    Cancelled,
    Dead,
}

impl JobState {
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Queued => "queued",
            Self::Running => "running",
            Self::Succeeded => "succeeded",
            Self::Failed => "failed",
            Self::Cancelled => "cancelled",
            Self::Dead => "dead",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JobRecord {
    pub id: OpaqueId,
    pub kind: String,
    pub queue: String,
    pub payload_json: String,
    pub state: JobState,
    pub attempts: u32,
    pub max_attempts: u32,
    pub run_after_ms: u64,
    pub locked_by: Option<String>,
    pub locked_until_ms: Option<u64>,
    pub created_at: String,
    pub updated_at: String,
    pub last_error: Option<String>,
    pub correlation_id: Option<OpaqueId>,
    lease_generation: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct JobLease {
    pub job_id: OpaqueId,
    pub worker: String,
    generation: u64,
}

#[derive(Debug, Default, Clone)]
pub struct JobQueue {
    jobs: BTreeMap<String, JobRecord>,
}

impl JobQueue {
    pub fn enqueue(
        &mut self,
        kind: impl Into<String>,
        queue: impl Into<String>,
        payload_json: impl Into<String>,
        run_after_ms: u64,
    ) -> JobRecord {
        let job = JobRecord {
            id: OpaqueId::new(IdPrefix::Job),
            kind: kind.into(),
            queue: queue.into(),
            payload_json: payload_json.into(),
            state: JobState::Queued,
            attempts: 0,
            max_attempts: 3,
            run_after_ms,
            locked_by: None,
            locked_until_ms: None,
            created_at: "1970-01-01T00:00:00Z".to_string(),
            updated_at: "1970-01-01T00:00:00Z".to_string(),
            last_error: None,
            correlation_id: None,
            lease_generation: 0,
        };
        self.jobs.insert(job.id.to_string(), job.clone());
        job
    }

    pub fn claim_next(
        &mut self,
        queue: &str,
        worker: impl Into<String>,
        now_ms: u64,
        lease_ms: u64,
    ) -> Option<(JobLease, JobRecord)> {
        let worker = worker.into();
        let (_, job) = self.jobs.iter_mut().find(|(_, job)| {
            job.queue == queue
                && job.state == JobState::Queued
                && job.run_after_ms <= now_ms
                && job.locked_by.is_none()
        })?;
        job.state = JobState::Running;
        job.attempts += 1;
        job.locked_by = Some(worker.clone());
        job.locked_until_ms = Some(now_ms + lease_ms);
        job.lease_generation += 1;

        Some((
            JobLease {
                job_id: job.id.clone(),
                worker,
                generation: job.lease_generation,
            },
            job.clone(),
        ))
    }

    pub fn complete(&mut self, lease: &JobLease, result_json: impl Into<String>) -> CoreResult<()> {
        let job = self.job_for_lease_mut(lease, u64::MAX)?;
        job.state = JobState::Succeeded;
        job.payload_json = result_json.into();
        job.locked_by = None;
        job.locked_until_ms = None;
        Ok(())
    }

    pub fn fail_with_retry(
        &mut self,
        lease: &JobLease,
        now_ms: u64,
        error: impl Into<String>,
    ) -> CoreResult<JobState> {
        let job = self.job_for_lease_mut(lease, now_ms)?;
        job.last_error = Some(error.into());
        job.locked_by = None;
        job.locked_until_ms = None;
        if job.attempts >= job.max_attempts {
            job.state = JobState::Dead;
        } else {
            job.state = JobState::Queued;
            job.run_after_ms = now_ms + retry_backoff_ms(job.attempts);
        }
        Ok(job.state)
    }

    pub fn extend_lock(
        &mut self,
        lease: &JobLease,
        now_ms: u64,
        extend_by_ms: u64,
        wall_time_quota_ms: u64,
    ) -> CoreResult<()> {
        if extend_by_ms > wall_time_quota_ms {
            return Err(CoreError::forbidden(
                "job lock extension exceeds wall-time quota",
                format!("forgepoint://job/{}", lease.job_id),
                "jobs:run",
            ));
        }
        let job = self.job_for_lease_mut(lease, now_ms)?;
        job.locked_until_ms = Some(now_ms + extend_by_ms);
        Ok(())
    }

    pub fn requeue_expired_locks(&mut self, now_ms: u64) {
        for job in self.jobs.values_mut() {
            if job.state == JobState::Running
                && job
                    .locked_until_ms
                    .is_some_and(|locked_until| locked_until <= now_ms)
            {
                job.state = JobState::Queued;
                job.locked_by = None;
                job.locked_until_ms = None;
                job.lease_generation += 1;
            }
        }
    }

    pub fn get(&self, id: &OpaqueId) -> Option<&JobRecord> {
        self.jobs.get(id.as_str())
    }

    fn job_for_lease_mut(&mut self, lease: &JobLease, now_ms: u64) -> CoreResult<&mut JobRecord> {
        let job = self
            .jobs
            .get_mut(lease.job_id.as_str())
            .ok_or_else(|| CoreError::bad_user_input("unknown job"))?;
        if job.state != JobState::Running
            || job.locked_by.as_deref() != Some(lease.worker.as_str())
            || job.lease_generation != lease.generation
            || job
                .locked_until_ms
                .is_some_and(|locked_until| locked_until <= now_ms)
        {
            return Err(CoreError::conflict("job lease is no longer held by worker"));
        }
        Ok(job)
    }
}

pub fn retry_backoff_ms(attempts: u32) -> u64 {
    let capped = attempts.min(8);
    let exponential = 1_000u64.saturating_mul(1 << capped);
    exponential + (attempts as u64 * 137)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn queued_job_survives_server_restart_clone() {
        let mut queue = JobQueue::default();
        let job = queue.enqueue("index.repository", "default", "{}", 0);
        let restarted = queue.clone();

        assert_eq!(
            restarted.get(&job.id).map(|record| record.state),
            Some(JobState::Queued)
        );
    }

    #[test]
    fn sqlite_style_single_writer_claim_yields_exactly_one_worker() {
        let mut queue = JobQueue::default();
        queue.enqueue("publish", "default", "{}", 0);

        let first = queue.claim_next("default", "worker-a", 0, 1_000);
        let second = queue.claim_next("default", "worker-b", 0, 1_000);

        assert!(first.is_some());
        assert!(second.is_none());
    }

    #[test]
    fn lock_extension_prevents_another_worker_stealing_job() {
        let mut queue = JobQueue::default();
        queue.enqueue("extension.run", "default", "{}", 0);
        let (lease, job) = queue.claim_next("default", "worker-a", 0, 1_000).unwrap();

        queue.extend_lock(&lease, 900, 2_000, 5_000).unwrap();
        queue.requeue_expired_locks(1_100);

        assert_eq!(
            queue.get(&job.id).map(|record| record.locked_by.as_deref()),
            Some(Some("worker-a"))
        );
        assert!(
            queue
                .claim_next("default", "worker-b", 1_100, 1_000)
                .is_none()
        );
    }

    #[test]
    fn worker_that_loses_lock_cannot_write_outcome() {
        let mut queue = JobQueue::default();
        queue.enqueue("extension.run", "default", "{}", 0);
        let (lease, _) = queue.claim_next("default", "worker-a", 0, 1_000).unwrap();

        queue.requeue_expired_locks(1_001);

        assert_eq!(
            queue.complete(&lease, "{}").unwrap_err().code,
            crate::ErrorCode::Conflict
        );
    }

    #[test]
    fn retries_dead_letter_after_max_attempts() {
        let mut queue = JobQueue::default();
        queue.enqueue("publish", "default", "{}", 0);

        let (lease1, _) = queue.claim_next("default", "worker-a", 0, 1_000).unwrap();
        assert_eq!(
            queue.fail_with_retry(&lease1, 10, "nope").unwrap(),
            JobState::Queued
        );
        let (lease2, _) = queue
            .claim_next("default", "worker-a", retry_backoff_ms(1) + 10, 1_000)
            .unwrap();
        assert_eq!(
            queue.fail_with_retry(&lease2, 20, "nope").unwrap(),
            JobState::Queued
        );
        let (lease3, _) = queue
            .claim_next("default", "worker-a", retry_backoff_ms(2) + 20, 1_000)
            .unwrap();
        assert_eq!(
            queue.fail_with_retry(&lease3, 30, "nope").unwrap(),
            JobState::Dead
        );
    }
}
