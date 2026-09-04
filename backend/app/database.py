"""Document this first-party Python module."""
from pymongo import MongoClient
import os

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

client = MongoClient(MONGO_URL)
db = client["bragstack"]

entries_collection = db["entries"]
users_collection = db["users"]
impact_receipts_collection = db["impact_receipts"]
receipt_verification_requests_collection = db["receipt_verification_requests"]
packet_export_audit_collection = db["packet_export_audit"]
packet_shares_collection = db["packet_shares"]
beta_feedback_collection = db["beta_feedback"]
interview_careers_collection = db["interview_careers"]
resume_documents_collection = db["resume_documents"]
ops_audit_collection = db["ops_audit"]
ops_events_collection = db["ops_events"]
analytics_events_collection = db["analytics_events"]
executive_goals_collection = db["executive_goals"]
executive_export_audit_collection = db["executive_export_audit"]
stripe_webhook_events_collection = db["stripe_webhook_events"]
rate_limits_collection = db["rate_limits"]

# Team / organization foundation. Organization membership never grants access
# to a user's private proof by itself; review visibility is driven by explicit
# user-created review shares in ``review_shares_collection``.
organizations_collection = db["organizations"]
organization_memberships_collection = db["organization_memberships"]
organization_invitations_collection = db["organization_invitations"]
teams_collection = db["teams"]
team_memberships_collection = db["team_memberships"]
review_shares_collection = db["review_shares"]
review_templates_collection = db["review_templates"]
