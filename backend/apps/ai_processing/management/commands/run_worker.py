"""
PostgreSQL-backed background worker for CivicLens AI pipeline.
Claims queued jobs with SELECT ... FOR UPDATE SKIP LOCKED without Redis.
Provides graceful shutdown, bounded retries, and stale-lock recovery.
"""
import time
import signal
import sys
import socket
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from apps.ai_processing.models import ProcessingJob, JobStatus
from services.agent_orchestrator import AgentOrchestrator

class Command(BaseCommand):
    help = 'Runs the PostgreSQL-backed CivicLens background AI pipeline worker'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.running = True
        self.worker_id = f"{socket.gethostname()}-{sys.argv[0]}-{time.time()}"
        self.orchestrator = AgentOrchestrator()

    def handle(self, *args, **options):
        # Graceful shutdown signals
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

        self.stdout.write(self.style.SUCCESS(
            f"[*] CivicLens AI Worker started [{self.worker_id}]. Listening for jobs..."
        ))

        while self.running:
            try:
                # 1. Recover stale locks (jobs stuck in PROCESSING for > 10 mins)
                self._recover_stale_locks()

                # 2. Claim next available queued job
                job = self._claim_next_job()
                if job:
                    self.stdout.write(f"[*] Processing job {job.id} for Report {job.report_id}...")
                    success = self.orchestrator.process_report_job(str(job.id))
                    if success:
                        self.stdout.write(self.style.SUCCESS(f"[+] Job {job.id} succeeded."))
                    else:
                        self.stdout.write(self.style.WARNING(f"[-] Job {job.id} failed or routed to review."))
                else:
                    # No jobs waiting, sleep briefly
                    time.sleep(2)

            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[!] Worker loop exception: {e}"))
                time.sleep(5)

        self.stdout.write(self.style.SUCCESS("[*] CivicLens Worker stopped gracefully."))

    def _handle_shutdown(self, signum, frame):
        self.stdout.write(self.style.WARNING("\n[*] Shutdown signal received. Finishing active cycle..."))
        self.running = False

    def _recover_stale_locks(self):
        stale_threshold = timezone.now() - timedelta(minutes=10)
        stale_jobs = ProcessingJob.objects.filter(
            status=JobStatus.PROCESSING,
            locked_at__lt=stale_threshold
        )
        count = stale_jobs.update(
            status=JobStatus.QUEUED,
            locked_at=None,
            locked_by=None
        )
        if count > 0:
            self.stdout.write(self.style.WARNING(f"[!] Recovered {count} stale locked job(s)."))

    def _claim_next_job(self):
        """
        Atomically claims a queued job using SELECT ... FOR UPDATE SKIP LOCKED.
        """
        with transaction.atomic():
            job = (
                ProcessingJob.objects
                .select_for_update(skip_locked=True)
                .filter(status=JobStatus.QUEUED, attempts__lt=3)
                .order_by('created_at')
                .first()
            )
            if job:
                job.status = JobStatus.PROCESSING
                job.locked_at = timezone.now()
                job.locked_by = self.worker_id
                job.save(update_fields=['status', 'locked_at', 'locked_by'])
                return job
            return None
