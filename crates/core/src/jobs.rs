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
    /// Monotonic enqueue order, used to break ties between jobs that share the
    /// same `run_after_ms` so claim order is FIFO rather than job-id order.
    enqueue_seq: u64,
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
    next_seq: u64,
}

impl JobQueue {
    pub fn enqueue(
        &mut self,
        kind: impl Into<String>,
        queue: impl Into<String>,
        payload_json: impl Into<String>,
        run_after_ms: u64,
        now_ms: u64,
    ) -> JobRecord {
        let now = crate::clock::millis_to_rfc3339(now_ms);
        let enqueue_seq = self.next_seq;
        self.next_seq += 1;
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
            created_at: now.clone(),
            updated_at: now,
            last_error: None,
            correlation_id: None,
            lease_generation: 0,
            enqueue_seq,
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
        // Honor scheduling priority: among ready jobs, pick the one with the
        // smallest (run_after_ms, enqueue_seq) so earlier-scheduled and then
        // earlier-enqueued jobs win, rather than relying on job-id ordering.
        let job_id = self
            .jobs
            .values()
            .filter(|job| {
                job.queue == queue
                    && job.state == JobState::Queued
                    && job.run_after_ms <= now_ms
                    && job.locked_by.is_none()
            })
            .min_by_key(|job| (job.run_after_ms, job.enqueue_seq))
            .map(|job| job.id.to_string())?;
        let job = self
            .jobs
            .get_mut(&job_id)
            .expect("selected job id is present");
        job.state = JobState::Running;
        job.attempts += 1;
        job.locked_by = Some(worker.clone());
        job.locked_until_ms = Some(now_ms + lease_ms);
        job.lease_generation += 1;
        job.updated_at = crate::clock::millis_to_rfc3339(now_ms);

        Some((
            JobLease {
                job_id: job.id.clone(),
                worker,
                generation: job.lease_generation,
            },
            job.clone(),
        ))
    }

    pub fn complete(
        &mut self,
        lease: &JobLease,
        result_json: impl Into<String>,
        now_ms: u64,
    ) -> CoreResult<()> {
        let job = self.job_for_lease_mut(lease, u64::MAX)?;
        job.state = JobState::Succeeded;
        job.payload_json = result_json.into();
        job.locked_by = None;
        job.locked_until_ms = None;
        job.updated_at = crate::clock::millis_to_rfc3339(now_ms);
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
        job.updated_at = crate::clock::millis_to_rfc3339(now_ms);
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
                format!("comtrya://job/{}", lease.job_id),
                "jobs:run",
            ));
        }
        let job = self.job_for_lease_mut(lease, now_ms)?;
        job.locked_until_ms = Some(now_ms + extend_by_ms);
        job.updated_at = crate::clock::millis_to_rfc3339(now_ms);
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
                job.updated_at = crate::clock::millis_to_rfc3339(now_ms);
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
        // `u64::MAX` is the sentinel for "ignore lease expiry" — used by
        // `complete`, which finalizes a held lease and must not be rejected
        // merely because the deadline has notionally passed.
        let lease_expired = now_ms != u64::MAX
            && job
                .locked_until_ms
                .is_some_and(|locked_until| locked_until <= now_ms);
        if job.state != JobState::Running
            || job.locked_by.as_deref() != Some(lease.worker.as_str())
            || job.lease_generation != lease.generation
            || lease_expired
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
        let job = queue.enqueue("index.repository", "default", "{}", 0, 1_000);
        let restarted = queue.clone();

        let record = restarted.get(&job.id).expect("job present");
        assert_eq!(record.state, JobState::Queued);
        assert_eq!(record.created_at, "1970-01-01T00:00:01.000Z");
        assert_eq!(record.updated_at, "1970-01-01T00:00:01.000Z");
    }

    #[test]
    fn sqlite_style_single_writer_claim_yields_exactly_one_worker() {
        let mut queue = JobQueue::default();
        queue.enqueue("publish", "default", "{}", 0, 0);

        let first = queue.claim_next("default", "worker-a", 0, 1_000);
        let second = queue.claim_next("default", "worker-b", 0, 1_000);

        assert!(first.is_some());
        assert!(second.is_none());
    }

    #[test]
    fn claim_next_honors_run_after_then_enqueue_order() {
        let mut queue = JobQueue::default();
        // Enqueue in an order that does not match scheduling priority.
        let later = queue.enqueue("publish", "default", "{\"n\":3}", 5_000, 0);
        let first_ready = queue.enqueue("publish", "default", "{\"n\":1}", 1_000, 1);
        let second_ready = queue.enqueue("publish", "default", "{\"n\":2}", 1_000, 2);

        // The earliest run_after wins; ties broken by enqueue order.
        let (_, claimed_a) = queue.claim_next("default", "w", 10_000, 1_000).unwrap();
        assert_eq!(claimed_a.id, first_ready.id);
        let (_, claimed_b) = queue.claim_next("default", "w", 10_000, 1_000).unwrap();
        assert_eq!(claimed_b.id, second_ready.id);
        let (_, claimed_c) = queue.claim_next("default", "w", 10_000, 1_000).unwrap();
        assert_eq!(claimed_c.id, later.id);
    }

    #[test]
    fn state_transition_advances_updated_at() {
        let mut queue = JobQueue::default();
        let job = queue.enqueue("publish", "default", "{}", 0, 1_000);
        let (lease, _) = queue.claim_next("default", "worker-a", 2_000, 1_000).unwrap();

        assert_eq!(
            queue.get(&job.id).map(|record| record.updated_at.clone()),
            Some("1970-01-01T00:00:02.000Z".to_string())
        );

        queue.complete(&lease, "{}", 3_000).unwrap();
        assert_eq!(
            queue.get(&job.id).map(|record| record.updated_at.clone()),
            Some("1970-01-01T00:00:03.000Z".to_string())
        );
    }

    #[test]
    fn complete_succeeds_on_a_freshly_claimed_lease() {
        // Regression: `complete` ignores lease expiry via the u64::MAX
        // sentinel; it must finalize a held lease rather than always
        // reporting the lease as lost.
        let mut queue = JobQueue::default();
        queue.enqueue("publish", "default", "{}", 0, 0);
        let (lease, _job) = queue
            .claim_next("default", "worker-a", 0, 1_000)
            .expect("claim succeeds");

        queue
            .complete(&lease, "{\"ok\":true}", 0)
            .expect("complete on a held lease must succeed");

        let job = queue.get(&lease.job_id).expect("job present");
        assert_eq!(job.state, JobState::Succeeded);
        assert_eq!(job.locked_by, None);
        assert_eq!(job.locked_until_ms, None);
        assert_eq!(job.payload_json, "{\"ok\":true}");
    }

    #[test]
    fn lock_extension_prevents_another_worker_stealing_job() {
        let mut queue = JobQueue::default();
        queue.enqueue("extension.run", "default", "{}", 0, 0);
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
        queue.enqueue("extension.run", "default", "{}", 0, 0);
        let (lease, _) = queue.claim_next("default", "worker-a", 0, 1_000).unwrap();

        queue.requeue_expired_locks(1_001);

        assert_eq!(
            queue.complete(&lease, "{}", 2_000).unwrap_err().code,
            crate::ErrorCode::Conflict
        );
    }

    #[test]
    fn retries_dead_letter_after_max_attempts() {
        let mut queue = JobQueue::default();
        queue.enqueue("publish", "default", "{}", 0, 0);

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
