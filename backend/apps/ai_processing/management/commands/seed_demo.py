"""
Management command to seed realistic demo data for CivicLens.
Creates Admin Officer and Citizen accounts, along with real consolidated
issues, clustered reports, and review queue entries.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.reports.models import Report, ReportStatus, CivicCategory
from apps.issues.models import ConsolidatedIssue, IssueStatus, PriorityTier, IssueActivity, IssueComment
from apps.ai_processing.models import ReviewQueueItem
from apps.notifications.models import Notification, NotificationType

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds CivicLens with demo accounts and realistic municipal issue data'

    def handle(self, *args, **options):
        self.stdout.write("[*] Seeding CivicLens demo environment...")

        # 1. Create Admin Officer
        admin_user, created = User.objects.get_or_create(
            username='admin.dispatch@civiclens.gov',
            defaults={
                'email': 'admin.dispatch@civiclens.gov',
                'first_name': 'Marcus',
                'last_name': 'Vance',
                'role': 'ADMIN',
                'ward': 'Ward 1 (Civic Center & Government District)',
                'department': 'Public Works Dispatch',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('director2026')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS("[+] Created Admin: admin.dispatch@civiclens.gov / director2026"))

        # 2. Create Citizen
        citizen_user, c_created = User.objects.get_or_create(
            username='goelvandita777@gmail.com',
            defaults={
                'email': 'goelvandita777@gmail.com',
                'first_name': 'Vandita',
                'last_name': 'Goel',
                'role': 'CITIZEN',
                'ward': 'Ward 4 (Central Hospital & Metro Corridor)',
            }
        )
        if c_created:
            citizen_user.set_password('citizen2026')
            citizen_user.save()
            self.stdout.write(self.style.SUCCESS("[+] Created Citizen: goelvandita777@gmail.com / citizen2026"))

        # 3. Seed Primary Consolidated Issue 1: High Pressure Water Main Rupture
        issue1, _ = ConsolidatedIssue.objects.update_or_create(
            id='ISSUE-401',
            defaults={
                'title': 'High-Pressure Water Main Rupture Flooding Metro Substation',
                'category': 'Water & Drainage',
                'description': 'Major water main breach submerged pedestrian underpass and encroaching on electrical conduit substation.',
                'summary': 'Emergency water main rupture endangering Ward 4 hospital transit metro corridor.',
                'address': '842 Metro Boulevard at St. Jude Hospital Avenue',
                'ward': 'Ward 4 (Central Hospital & Metro Corridor)',
                'latitude': 37.7749,
                'longitude': -122.4194,
                'status': IssueStatus.ASSIGNED,
                'priority_tier': PriorityTier.P1_CRITICAL,
                'priority_score': 94,
                'severity_score': 92,
                'severity_level': 'CRITICAL',
                'assigned_department': 'Water & Sewerage Authority',
                'reports_count': 5,
                'estimated_resolution_days': 1,
                'agent_outputs': {
                    'listener': {'confidenceScore': 0.98, 'sentiment': 'urgent'},
                    'severityAssessment': {
                        'publicSafetyRisk': 9,
                        'infrastructureDamageRisk': 9,
                        'vulnerablePopulationImpact': True,
                        'justification': 'Direct hazard to emergency ambulance routing and regional hospital power.'
                    },
                    'priorityAssessment': {
                        'priorityTier': 'P1_CRITICAL',
                        'dispatchUrgency': 'IMMEDIATE',
                        'recommendedAction': 'Dispatch emergency utility excavation crew with de-watering pumper.'
                    }
                },
                'score_breakdown': {
                    'final_score': 94,
                    'priority_tier': 'P1_CRITICAL',
                    'formula': 'clamp(0.45*Severity + 0.25*Recurrence + 0.15*Ward + 0.15*Aging)'
                }
            }
        )

        # Reports linked to Issue 1
        Report.objects.update_or_create(
            id='REP-101',
            defaults={
                'citizen': citizen_user,
                'citizen_name': 'Vandita Goel',
                'citizen_email': citizen_user.email,
                'title': 'Severe water main burst near Hospital Station',
                'description': 'Water rushing across 842 Metro Blvd. Ambulances forced onto sidewalk.',
                'category': 'Water & Drainage',
                'address': '842 Metro Boulevard at St. Jude Hospital Avenue',
                'ward': 'Ward 4 (Central Hospital & Metro Corridor)',
                'status': ReportStatus.ASSOCIATED,
                'consolidated_issue': issue1,
                'citizen_urgency': 'CRITICAL',
            }
        )

        Report.objects.update_or_create(
            id='REP-102',
            defaults={
                'citizen': citizen_user,
                'citizen_name': 'Elena Rostova',
                'citizen_email': 'elena.rostova@gmail.com',
                'title': 'Substation flooded by broken water line',
                'description': 'Underpass transformer vault has over 2 feet of standing water.',
                'category': 'Water & Drainage',
                'address': '840 Metro Boulevard Underpass',
                'ward': 'Ward 4 (Central Hospital & Metro Corridor)',
                'status': ReportStatus.ASSOCIATED,
                'consolidated_issue': issue1,
                'citizen_urgency': 'HIGH',
            }
        )

        IssueActivity.objects.get_or_create(
            issue=issue1,
            action="Status updated to ASSIGNED",
            actor="Director Marcus Vance",
            defaults={'details': 'Dispatched crew unit 4B with vacuum extraction truck.'}
        )

        # 4. Seed Review Queue Item (Ambiguous reports needing triage)
        rep_review, _ = Report.objects.update_or_create(
            id='REP-305',
            defaults={
                'citizen': citizen_user,
                'citizen_name': 'David Chen',
                'citizen_email': 'd.chen@transit.org',
                'title': 'Water pooling near North Hospital Parking Gate',
                'description': 'Slow trickle pooling near north curb. Could be runoff or secondary seepage from metro pipe.',
                'category': 'Water & Drainage',
                'address': '910 Hospital Service Road',
                'ward': 'Ward 4 (Central Hospital & Metro Corridor)',
                'status': ReportStatus.UNDER_REVIEW,
                'citizen_urgency': 'MEDIUM',
            }
        )

        ReviewQueueItem.objects.update_or_create(
            id='REV-501',
            defaults={
                'report': rep_review,
                'suggested_issue': issue1,
                'suggested_action': 'MERGE',
                'confidence_score': 0.62,
                'similarity_score': 0.65,
                'reasoning': 'Notice is 300 meters from primary rupture on Metro Blvd. Might be secondary seepage or unrelated irrigation leak.',
                'status': 'PENDING'
            }
        )

        self.stdout.write(self.style.SUCCESS("[+] Seeding complete! All demo records created."))
