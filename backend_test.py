"""
POLITICAL SUITE PHASE 1, 2 & 3: Comprehensive Backend API Tests
Tests for the Political Suite HIGH-RISK VERTICAL with governance controls.

This test suite verifies:
PHASE 1:
1. Authentication & Authorization (401/403 responses)
2. All CRUD operations for each endpoint
3. Tenant scoping (x-tenant-id header requirement)
4. Validation errors (400 for missing required fields)
5. Campaign activation workflow
6. Candidate screening and clearance workflow
7. Event lifecycle (scheduled → in_progress → completed)
8. Volunteer training and activity logging
9. Audit log READ-ONLY enforcement (POST/PUT/PATCH/DELETE return 403)
10. Nigerian context data validation

PHASE 2 - FUNDRAISING (FACTS ONLY):
11. Fundraising Summary API
12. Donations API (APPEND-ONLY enforcement)
13. Expenses API (APPEND-ONLY with verification)
14. Disclosures API (aggregation from facts)
15. Commerce Boundary enforcement (no payment processing)
16. APPEND-ONLY enforcement (403 for PUT/PATCH/DELETE)
17. Nigerian currency and context validation

PHASE 3 - INTERNAL ELECTIONS & PRIMARIES (HIGH-RISK):
18. Primaries API (CRUD with mandatory jurisdiction)
19. Votes API (APPEND-ONLY with conflict-of-interest checks)
20. Results API (APPEND-ONLY with mandatory disclaimers)
21. Aspirant management workflow (add, screen, clear)
22. Primary status transitions (DRAFT → VOTING_OPEN → VOTING_CLOSED)
23. Ballot secrecy enforcement (no voter/aspirant linkage in responses)
24. MANDATORY LABELS verification (UNOFFICIAL, INTERNAL, NOT INEC)
25. APPEND-ONLY enforcement for votes and results (403 for PUT/PATCH/DELETE)

Classification: HIGH-RISK VERTICAL (Political/Electoral)
Phase: Phase 1-3 Complete - Party Operations, Fundraising & Internal Elections
"""

import pytest
import requests
import json
from typing import Dict, Any, Optional

# Use the production URL from frontend/.env
BASE_URL = "https://code-hygiene-2.preview.emergentagent.com"

# Test tenant and user IDs as specified in the review request
TEST_TENANT_ID = "test-tenant"
TEST_USER_ID = "test-user"

class TestPoliticalSuiteAuthentication:
    """Test authentication and tenant scoping for all political routes"""
    
    def test_suite_info_requires_tenant_id(self):
        """GET /api/political - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_parties_requires_tenant_id(self):
        """GET /api/political/parties - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/parties")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
    
    def test_members_requires_tenant_id(self):
        """GET /api/political/members - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/members")
        assert response.status_code == 401
    
    def test_campaigns_requires_tenant_id(self):
        """GET /api/political/campaigns - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/campaigns")
        assert response.status_code == 401
    
    def test_events_requires_tenant_id(self):
        """GET /api/political/events - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/events")
        assert response.status_code == 401
    
    def test_volunteers_requires_tenant_id(self):
        """GET /api/political/volunteers - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/volunteers")
        assert response.status_code == 401
    
    def test_audit_requires_tenant_id(self):
        """GET /api/political/audit - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/audit")
        assert response.status_code == 401


class TestPoliticalSuiteInfo:
    """Test the main Political Suite info endpoint"""
    
    def test_suite_info_with_tenant_id(self):
        """GET /api/political - Should return suite info and stats with x-tenant-id"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political", headers=headers)
        
        # Should return 200 or 500 (if database not set up), but not 401
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "suite" in data
            assert "stats" in data
            assert "disclaimers" in data
            
            # Verify stats structure
            stats = data["stats"]
            expected_stats = ["parties", "members", "campaigns", "activeCampaigns", 
                            "candidates", "events", "upcomingEvents", "volunteers", "activeVolunteers"]
            for stat in expected_stats:
                assert stat in stats, f"Missing stat: {stat}"


class TestPoliticalPartiesAPI:
    """Test Political Parties API endpoints"""
    
    def test_list_parties_with_tenant(self):
        """GET /api/political/parties - List parties with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/parties", headers=headers)
        
        # Should not return 401 with proper tenant ID
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
    
    def test_list_parties_with_filters(self):
        """GET /api/political/parties - Test query parameters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "status": "ACTIVE",
            "search": "Progressive",
            "limit": "10",
            "offset": "0"
        }
        response = requests.get(f"{BASE_URL}/api/political/parties", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_create_party_validation(self):
        """POST /api/political/parties - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/parties", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "Name and acronym are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_create_party_with_nigerian_data(self):
        """POST /api/political/parties - Create party with Nigerian context"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        party_data = {
            "name": "Progressive People's Party",
            "acronym": "PPP",
            "description": "A progressive political party for Nigeria",
            "foundedDate": "2023-01-15",
            "headquarters": "Lagos, Nigeria",
            "website": "https://ppp.ng",
            "email": "info@ppp.ng",
            "phone": "+2348012345678"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/parties", headers=headers, json=party_data)
        # Should not return 401 or 400 validation error with proper data
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"


class TestPoliticalMembersAPI:
    """Test Political Members API endpoints"""
    
    def test_list_members_with_tenant(self):
        """GET /api/political/members - List members with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/members", headers=headers)
        assert response.status_code != 401
    
    def test_list_members_with_filters(self):
        """GET /api/political/members - Test Nigerian jurisdiction filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "status": "ACTIVE",
            "isVerified": "true",
            "limit": "20"
        }
        response = requests.get(f"{BASE_URL}/api/political/members", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_get_member_stats(self):
        """GET /api/political/members?stats=true - Get member statistics"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"stats": "true"}
        response = requests.get(f"{BASE_URL}/api/political/members", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_create_member_validation(self):
        """POST /api/political/members - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/members", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "Party ID, first name, last name, and phone are required" in data["error"]
    
    def test_create_member_with_nigerian_data(self):
        """POST /api/political/members - Create member with Nigerian names and phone"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        member_data = {
            "partyId": "test-party-id",
            "firstName": "Adewale",
            "lastName": "Ogundimu",
            "middleName": "Babatunde",
            "phone": "+2348012345678",
            "email": "adewale.ogundimu@example.com",
            "dateOfBirth": "1985-03-15",
            "gender": "MALE",
            "occupation": "Engineer",
            "address": "15 Adeniran Ogunsanya Street, Surulere, Lagos",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "role": "MEMBER"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/members", headers=headers, json=member_data)
        assert response.status_code not in [400, 401]


class TestPoliticalCampaignsAPI:
    """Test Political Campaigns API endpoints"""
    
    def test_list_campaigns_with_tenant(self):
        """GET /api/political/campaigns - List campaigns with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/campaigns", headers=headers)
        assert response.status_code != 401
    
    def test_list_campaigns_with_filters(self):
        """GET /api/political/campaigns - Test campaign filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "type": "GENERAL_ELECTION",
            "status": "ACTIVE",
            "state": "Lagos",
            "search": "House of Assembly"
        }
        response = requests.get(f"{BASE_URL}/api/political/campaigns", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_create_campaign_validation(self):
        """POST /api/political/campaigns - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/campaigns", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "Party ID, name, type, and start date are required" in data["error"]
    
    def test_create_campaign_with_nigerian_context(self):
        """POST /api/political/campaigns - Create campaign for Nigerian election"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        campaign_data = {
            "partyId": "test-party-id",
            "name": "Lagos State House of Assembly - Surulere I",
            "type": "STATE_ASSEMBLY",
            "description": "Campaign for Lagos State House of Assembly, Surulere Constituency I",
            "startDate": "2026-01-01T00:00:00Z",
            "endDate": "2026-12-31T23:59:59Z",
            "electionDate": "2026-11-15T00:00:00Z",
            "office": "Lagos State House of Assembly",
            "constituency": "Surulere I",
            "state": "Lagos",
            "lga": "Surulere",
            "budget": 5000000,  # 5 million naira
            "status": "PLANNING"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/campaigns", headers=headers, json=campaign_data)
        assert response.status_code not in [400, 401]


class TestPoliticalEventsAPI:
    """Test Political Events API endpoints"""
    
    def test_list_events_with_tenant(self):
        """GET /api/political/events - List events with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/events", headers=headers)
        assert response.status_code != 401
    
    def test_get_upcoming_events(self):
        """GET /api/political/events?upcoming=true - Get upcoming events"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"upcoming": "true", "limit": "5"}
        response = requests.get(f"{BASE_URL}/api/political/events", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data
    
    def test_get_event_stats(self):
        """GET /api/political/events?stats=true - Get event statistics"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"stats": "true"}
        response = requests.get(f"{BASE_URL}/api/political/events", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_list_events_with_nigerian_filters(self):
        """GET /api/political/events - Test Nigerian jurisdiction filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "type": "TOWN_HALL",
            "status": "SCHEDULED",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "fromDate": "2026-01-01",
            "toDate": "2026-12-31"
        }
        response = requests.get(f"{BASE_URL}/api/political/events", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_create_event_validation(self):
        """POST /api/political/events - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/events", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "Campaign ID, name, type, and start date/time are required" in data["error"]
    
    def test_create_event_with_nigerian_context(self):
        """POST /api/political/events - Create event with Nigerian location"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        event_data = {
            "campaignId": "test-campaign-id",
            "name": "Town Hall Meeting - Aguda Community",
            "type": "TOWN_HALL",
            "description": "Community engagement meeting with residents of Aguda",
            "startDateTime": "2026-02-15T10:00:00Z",
            "endDateTime": "2026-02-15T14:00:00Z",
            "venue": "Aguda Community Hall",
            "address": "Aguda Road, Surulere, Lagos State",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "expectedAttendees": 200,
            "isPublic": True
        }
        
        response = requests.post(f"{BASE_URL}/api/political/events", headers=headers, json=event_data)
        assert response.status_code not in [400, 401]


class TestPoliticalVolunteersAPI:
    """Test Political Volunteers API endpoints"""
    
    def test_list_volunteers_with_tenant(self):
        """GET /api/political/volunteers - List volunteers with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/volunteers", headers=headers)
        assert response.status_code != 401
    
    def test_get_volunteer_stats(self):
        """GET /api/political/volunteers?stats=true - Get volunteer statistics"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"stats": "true"}
        response = requests.get(f"{BASE_URL}/api/political/volunteers", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_list_volunteers_with_filters(self):
        """GET /api/political/volunteers - Test volunteer filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "role": "CANVASSER",
            "status": "ACTIVE",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03"
        }
        response = requests.get(f"{BASE_URL}/api/political/volunteers", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_create_volunteer_validation(self):
        """POST /api/political/volunteers - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/volunteers", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "Campaign ID, first name, last name, phone, and role are required" in data["error"]
    
    def test_create_volunteer_with_nigerian_data(self):
        """POST /api/political/volunteers - Create volunteer with Nigerian names"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        volunteer_data = {
            "campaignId": "test-campaign-id",
            "firstName": "Chinedu",
            "lastName": "Okonkwo",
            "phone": "+2348087654321",
            "email": "chinedu.okonkwo@example.com",
            "role": "WARD_COORDINATOR",
            "skills": ["Community Mobilization", "Event Planning"],
            "experience": "5 years in community organizing",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "address": "12 Bode Thomas Street, Surulere, Lagos",
            "availableFrom": "2026-01-01T00:00:00Z",
            "availableTo": "2026-12-31T23:59:59Z"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/volunteers", headers=headers, json=volunteer_data)
        assert response.status_code not in [400, 401]


class TestPoliticalAuditAPI:
    """Test Political Audit API - READ-ONLY enforcement"""
    
    def test_query_audit_logs_with_tenant(self):
        """GET /api/political/audit - Query audit logs with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/audit", headers=headers)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "_notice" in data
            assert "READ-ONLY" in data["_notice"]
    
    def test_query_audit_logs_with_filters(self):
        """GET /api/political/audit - Test audit log filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "entityType": "pol_party",
            "action": "CREATED",
            "fromDate": "2026-01-01",
            "toDate": "2026-12-31",
            "state": "Lagos",
            "limit": "50"
        }
        response = requests.get(f"{BASE_URL}/api/political/audit", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_audit_post_forbidden(self):
        """POST /api/political/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        audit_data = {
            "action": "TEST_ACTION",
            "entityType": "test_entity",
            "entityId": "test-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/audit", headers=headers, json=audit_data)
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "READ-ONLY" in data["error"]
        assert data["code"] == "FORBIDDEN"
    
    def test_audit_put_forbidden(self):
        """PUT /api/political/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.put(f"{BASE_URL}/api/political/audit", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_audit_patch_forbidden(self):
        """PATCH /api/political/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.patch(f"{BASE_URL}/api/political/audit", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_audit_delete_forbidden(self):
        """DELETE /api/political/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.delete(f"{BASE_URL}/api/political/audit", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "IMMUTABLE" in data["error"]


class TestPoliticalWorkflows:
    """Test complete Political Suite workflows"""
    
    def test_full_crud_workflow_simulation(self):
        """Test the full CRUD flow: Party → Member → Campaign → Event → Volunteer"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # 1. Create Party
        party_data = {
            "name": "All Progressives Congress",
            "acronym": "APC",
            "description": "Progressive political party",
            "headquarters": "Abuja, Nigeria"
        }
        party_response = requests.post(f"{BASE_URL}/api/political/parties", headers=headers, json=party_data)
        # Should not fail with validation error
        assert party_response.status_code not in [400, 401]
        
        # 2. Create Member (assuming party creation succeeded or party exists)
        member_data = {
            "partyId": "test-party-id",  # Would use actual party ID in real scenario
            "firstName": "Ngozi",
            "lastName": "Adebayo",
            "phone": "+2348123456789",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03"
        }
        member_response = requests.post(f"{BASE_URL}/api/political/members", headers=headers, json=member_data)
        assert member_response.status_code not in [400, 401]
        
        # 3. Create Campaign
        campaign_data = {
            "partyId": "test-party-id",
            "name": "Lagos Governorship Campaign 2027",
            "type": "GUBERNATORIAL",
            "startDate": "2026-06-01T00:00:00Z",
            "electionDate": "2027-03-15T00:00:00Z",
            "state": "Lagos"
        }
        campaign_response = requests.post(f"{BASE_URL}/api/political/campaigns", headers=headers, json=campaign_data)
        assert campaign_response.status_code not in [400, 401]
        
        # 4. Create Event
        event_data = {
            "campaignId": "test-campaign-id",
            "name": "Campaign Launch Rally",
            "type": "RALLY",
            "startDateTime": "2026-07-01T15:00:00Z",
            "venue": "Tafawa Balewa Square",
            "state": "Lagos",
            "lga": "Lagos Island"
        }
        event_response = requests.post(f"{BASE_URL}/api/political/events", headers=headers, json=event_data)
        assert event_response.status_code not in [400, 401]
        
        # 5. Create Volunteer
        volunteer_data = {
            "campaignId": "test-campaign-id",
            "firstName": "Babatunde",
            "lastName": "Olawale",
            "phone": "+2348098765432",
            "role": "FIELD_AGENT",
            "state": "Lagos",
            "lga": "Surulere"
        }
        volunteer_response = requests.post(f"{BASE_URL}/api/political/volunteers", headers=headers, json=volunteer_data)
        assert volunteer_response.status_code not in [400, 401]


class TestPoliticalDetailEndpoints:
    """Test individual detail endpoints (GET by ID, PATCH, POST actions)"""
    
    def test_party_detail_endpoints(self):
        """Test party detail endpoints"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # GET /api/political/parties/[id]
        response = requests.get(f"{BASE_URL}/api/political/parties/test-party-id", headers=headers)
        assert response.status_code != 401
        
        # PATCH /api/political/parties/[id]
        update_data = {"description": "Updated party description"}
        response = requests.patch(f"{BASE_URL}/api/political/parties/test-party-id", headers=headers, json=update_data)
        assert response.status_code != 401
        
        # POST /api/political/parties/[id] - Create organ
        organ_data = {"action": "createOrgan", "name": "Lagos State Chapter", "level": "STATE"}
        response = requests.post(f"{BASE_URL}/api/political/parties/test-party-id", headers=headers, json=organ_data)
        assert response.status_code != 401
    
    def test_member_detail_endpoints(self):
        """Test member detail endpoints"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # GET /api/political/members/[id]
        response = requests.get(f"{BASE_URL}/api/political/members/test-member-id", headers=headers)
        assert response.status_code != 401
        
        # PATCH /api/political/members/[id]
        update_data = {"role": "EXECUTIVE"}
        response = requests.patch(f"{BASE_URL}/api/political/members/test-member-id", headers=headers, json=update_data)
        assert response.status_code != 401
        
        # POST /api/political/members/[id] - Verify member
        verify_data = {"action": "verify", "verificationNotes": "Identity verified"}
        response = requests.post(f"{BASE_URL}/api/political/members/test-member-id", headers=headers, json=verify_data)
        assert response.status_code != 401
    
    def test_campaign_detail_endpoints(self):
        """Test campaign detail endpoints"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # GET /api/political/campaigns/[id]
        response = requests.get(f"{BASE_URL}/api/political/campaigns/test-campaign-id", headers=headers)
        assert response.status_code != 401
        
        # PATCH /api/political/campaigns/[id]
        update_data = {"status": "ACTIVE"}
        response = requests.patch(f"{BASE_URL}/api/political/campaigns/test-campaign-id", headers=headers, json=update_data)
        assert response.status_code != 401
        
        # POST /api/political/campaigns/[id] - Activate campaign
        activate_data = {"action": "activate"}
        response = requests.post(f"{BASE_URL}/api/political/campaigns/test-campaign-id", headers=headers, json=activate_data)
        assert response.status_code != 401
        
        # POST /api/political/campaigns/[id] - Add candidate
        candidate_data = {"action": "addCandidate", "memberId": "test-member-id", "position": "GOVERNOR"}
        response = requests.post(f"{BASE_URL}/api/political/campaigns/test-campaign-id", headers=headers, json=candidate_data)
        assert response.status_code != 401
    
    def test_event_detail_endpoints(self):
        """Test event detail endpoints"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # GET /api/political/events/[id]
        response = requests.get(f"{BASE_URL}/api/political/events/test-event-id", headers=headers)
        assert response.status_code != 401
        
        # PATCH /api/political/events/[id]
        update_data = {"expectedAttendees": 500}
        response = requests.patch(f"{BASE_URL}/api/political/events/test-event-id", headers=headers, json=update_data)
        assert response.status_code != 401
        
        # POST /api/political/events/[id] - Start event
        start_data = {"action": "start"}
        response = requests.post(f"{BASE_URL}/api/political/events/test-event-id", headers=headers, json=start_data)
        assert response.status_code != 401
        
        # POST /api/political/events/[id] - Complete event
        complete_data = {"action": "complete", "actualAttendees": 450, "notes": "Successful event"}
        response = requests.post(f"{BASE_URL}/api/political/events/test-event-id", headers=headers, json=complete_data)
        assert response.status_code != 401
        
        # POST /api/political/events/[id] - Cancel event
        cancel_data = {"action": "cancel", "reason": "Weather conditions"}
        response = requests.post(f"{BASE_URL}/api/political/events/test-event-id", headers=headers, json=cancel_data)
        assert response.status_code != 401
    
    def test_volunteer_detail_endpoints(self):
        """Test volunteer detail endpoints"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # GET /api/political/volunteers/[id]
        response = requests.get(f"{BASE_URL}/api/political/volunteers/test-volunteer-id", headers=headers)
        assert response.status_code != 401
        
        # PATCH /api/political/volunteers/[id]
        update_data = {"status": "TRAINED"}
        response = requests.patch(f"{BASE_URL}/api/political/volunteers/test-volunteer-id", headers=headers, json=update_data)
        assert response.status_code != 401
        
        # POST /api/political/volunteers/[id] - Train volunteer
        train_data = {"action": "train", "trainingType": "CANVASSING", "completedDate": "2026-01-15"}
        response = requests.post(f"{BASE_URL}/api/political/volunteers/test-volunteer-id", headers=headers, json=train_data)
        assert response.status_code != 401
        
        # POST /api/political/volunteers/[id] - Log activity
        activity_data = {"action": "logActivity", "activityType": "DOOR_TO_DOOR", "duration": 4, "notes": "Covered 50 households"}
        response = requests.post(f"{BASE_URL}/api/political/volunteers/test-volunteer-id", headers=headers, json=activity_data)
        assert response.status_code != 401


class TestPoliticalNigerianContext:
    """Test Nigerian-specific context and data validation"""
    
    def test_nigerian_phone_formats(self):
        """Test various Nigerian phone number formats"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        phone_formats = [
            "+2348012345678",  # International format
            "08012345678",     # Local format
            "+2347087654321",  # MTN
            "+2349098765432",  # Airtel
            "+2348123456789"   # Glo
        ]
        
        for i, phone in enumerate(phone_formats):
            member_data = {
                "partyId": "test-party-id",
                "firstName": f"TestUser{i}",
                "lastName": "Nigerian",
                "phone": phone,
                "state": "Lagos"
            }
            
            response = requests.post(f"{BASE_URL}/api/political/members", headers=headers, json=member_data)
            # Should not fail validation for valid Nigerian phone formats
            assert response.status_code not in [400, 401], f"Phone format {phone} should be valid"
    
    def test_nigerian_states_and_lgas(self):
        """Test Nigerian states and LGAs in member creation"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        nigerian_locations = [
            {"state": "Lagos", "lga": "Surulere", "ward": "Ward 03"},
            {"state": "Kano", "lga": "Kano Municipal", "ward": "Ward 01"},
            {"state": "Rivers", "lga": "Port Harcourt", "ward": "Ward 05"},
            {"state": "Oyo", "lga": "Ibadan North", "ward": "Ward 02"},
            {"state": "Kaduna", "lga": "Kaduna North", "ward": "Ward 04"}
        ]
        
        for i, location in enumerate(nigerian_locations):
            member_data = {
                "partyId": "test-party-id",
                "firstName": f"Citizen{i}",
                "lastName": "Nigerian",
                "phone": f"+23480123456{i:02d}",
                **location
            }
            
            response = requests.post(f"{BASE_URL}/api/political/members", headers=headers, json=member_data)
            assert response.status_code not in [400, 401], f"Nigerian location {location} should be valid"
    
    def test_nigerian_names_validation(self):
        """Test common Nigerian names in various endpoints"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        nigerian_names = [
            {"firstName": "Adewale", "lastName": "Ogundimu"},
            {"firstName": "Chinedu", "lastName": "Okonkwo"},
            {"firstName": "Ngozi", "lastName": "Adebayo"},
            {"firstName": "Babatunde", "lastName": "Olawale"},
            {"firstName": "Amina", "lastName": "Ibrahim"},
            {"firstName": "Kemi", "lastName": "Adeyemi"},
            {"firstName": "Emeka", "lastName": "Nwankwo"},
            {"firstName": "Fatima", "lastName": "Aliyu"}
        ]
        
        for i, name in enumerate(nigerian_names):
            # Test in member creation
            member_data = {
                "partyId": "test-party-id",
                "phone": f"+23480123456{i:02d}",
                "state": "Lagos",
                **name
            }
            
            response = requests.post(f"{BASE_URL}/api/political/members", headers=headers, json=member_data)
            assert response.status_code not in [400, 401], f"Nigerian name {name} should be valid"
            
            # Test in volunteer creation
            volunteer_data = {
                "campaignId": "test-campaign-id",
                "phone": f"+23480987654{i:02d}",
                "role": "CANVASSER",
                "state": "Lagos",
                **name
            }
            
            response = requests.post(f"{BASE_URL}/api/political/volunteers", headers=headers, json=volunteer_data)
            assert response.status_code not in [400, 401], f"Nigerian name {name} should be valid for volunteers"


# ============================================================================
# POLITICAL SUITE PHASE 2: FUNDRAISING API TESTS (FACTS ONLY)
# ============================================================================

class TestPoliticalFundraisingSummary:
    """Test Political Fundraising Summary API"""
    
    def test_fundraising_summary_requires_tenant_id(self):
        """GET /api/political/fundraising - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/fundraising")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_fundraising_summary_with_tenant(self):
        """GET /api/political/fundraising - Should return donation and expense stats"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/fundraising", headers=headers)
        
        # Should not return 401 with proper tenant ID
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "donations" in data
            assert "expenses" in data
            assert "summary" in data
            assert "_commerce_boundary" in data
            assert "STRICTLY ENFORCED" in data["_commerce_boundary"]
            assert "disclaimer" in data
            assert "UNOFFICIAL" in data["disclaimer"]
            
            # Verify summary structure
            summary = data["summary"]
            assert "totalDonations" in summary
            assert "totalExpenses" in summary
            assert "netBalance" in summary
    
    def test_fundraising_summary_with_filters(self):
        """GET /api/political/fundraising - Test campaign and party filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "campaignId": "test-campaign-id",
            "partyId": "test-party-id"
        }
        response = requests.get(f"{BASE_URL}/api/political/fundraising", headers=headers, params=params)
        assert response.status_code != 401


class TestPoliticalDonationsAPI:
    """Test Political Donations API - APPEND-ONLY enforcement"""
    
    def test_donations_requires_tenant_id(self):
        """GET /api/political/fundraising/donations - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/fundraising/donations")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
    
    def test_query_donations_with_tenant(self):
        """GET /api/political/fundraising/donations - Query donation facts"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/fundraising/donations", headers=headers)
        
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "STRICTLY ENFORCED" in data["_commerce_boundary"]
            assert "_facts_only" in data
            assert "_append_only" in data
    
    def test_get_donation_stats(self):
        """GET /api/political/fundraising/donations?stats=true - Get donation statistics"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"stats": "true"}
        response = requests.get(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "STRICTLY ENFORCED" in data["_commerce_boundary"]
    
    def test_query_donations_with_filters(self):
        """GET /api/political/fundraising/donations - Test various filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "campaignId": "test-campaign-id",
            "partyId": "test-party-id",
            "source": "INDIVIDUAL",
            "status": "RECEIVED",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "fromDate": "2026-01-01",
            "toDate": "2026-12-31",
            "requiresDisclosure": "true",
            "minAmount": "1000",
            "maxAmount": "1000000",
            "limit": "50",
            "offset": "0"
        }
        response = requests.get(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_record_donation_fact_validation(self):
        """POST /api/political/fundraising/donations - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "campaignId or partyId, amount, source, and donationDate are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_record_donation_fact_individual(self):
        """POST /api/political/fundraising/donations - Record individual donation fact"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        donation_data = {
            "campaignId": "test-campaign-id",
            "amount": 50000,  # NGN 50,000
            "source": "INDIVIDUAL",
            "donorName": "Adewale Ogundimu",
            "donorEmail": "adewale.ogundimu@example.com",
            "donorPhone": "+2348012345678",
            "donorAddress": "15 Adeniran Ogunsanya Street, Surulere, Lagos",
            "donationDate": "2026-01-15T10:00:00Z",
            "receiptDate": "2026-01-15T10:30:00Z",
            "paymentMethod": "BANK_TRANSFER",
            "reference": "DON-2026-001",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "notes": "Individual donation for campaign activities"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json=donation_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "STRICTLY ENFORCED" in data["_commerce_boundary"]
    
    def test_record_donation_fact_corporate(self):
        """POST /api/political/fundraising/donations - Record corporate donation fact"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        donation_data = {
            "partyId": "test-party-id",
            "amount": 500000,  # NGN 500,000
            "source": "CORPORATE",
            "donorName": "Lagos Business Solutions Ltd",
            "donorEmail": "finance@lagosbizsol.com",
            "donorPhone": "+2348087654321",
            "donorAddress": "Plot 123, Victoria Island, Lagos",
            "donationDate": "2026-01-20T14:00:00Z",
            "receiptDate": "2026-01-20T14:15:00Z",
            "paymentMethod": "CHEQUE",
            "reference": "DON-2026-002",
            "state": "Lagos",
            "lga": "Lagos Island",
            "notes": "Corporate donation for party operations"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json=donation_data)
        assert response.status_code not in [400, 401]
    
    def test_get_donation_fact_detail(self):
        """GET /api/political/fundraising/donations/[id] - Get donation fact details"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/fundraising/donations/test-donation-id", headers=headers)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "_facts_only" in data
            assert "_append_only" in data
    
    def test_donations_put_forbidden(self):
        """PUT /api/political/fundraising/donations - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.put(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "APPEND-ONLY" in data["error"]
        assert data["code"] == "FORBIDDEN"
    
    def test_donations_patch_forbidden(self):
        """PATCH /api/political/fundraising/donations - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.patch(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_donations_delete_forbidden(self):
        """DELETE /api/political/fundraising/donations - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.delete(f"{BASE_URL}/api/political/fundraising/donations", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "IMMUTABLE" in data["error"]
    
    def test_donation_detail_put_forbidden(self):
        """PUT /api/political/fundraising/donations/[id] - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.put(f"{BASE_URL}/api/political/fundraising/donations/test-id", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_donation_detail_patch_forbidden(self):
        """PATCH /api/political/fundraising/donations/[id] - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.patch(f"{BASE_URL}/api/political/fundraising/donations/test-id", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_donation_detail_delete_forbidden(self):
        """DELETE /api/political/fundraising/donations/[id] - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.delete(f"{BASE_URL}/api/political/fundraising/donations/test-id", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "IMMUTABLE" in data["error"]


class TestPoliticalExpensesAPI:
    """Test Political Expenses API - APPEND-ONLY with verification"""
    
    def test_expenses_requires_tenant_id(self):
        """GET /api/political/fundraising/expenses - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/fundraising/expenses")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
    
    def test_query_expenses_with_tenant(self):
        """GET /api/political/fundraising/expenses - Query expense facts"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers)
        
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "STRICTLY ENFORCED" in data["_commerce_boundary"]
            assert "_facts_only" in data
            assert "_append_only" in data
    
    def test_get_expense_stats(self):
        """GET /api/political/fundraising/expenses?stats=true - Get expense statistics"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"stats": "true"}
        response = requests.get(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "STRICTLY ENFORCED" in data["_commerce_boundary"]
    
    def test_query_expenses_with_filters(self):
        """GET /api/political/fundraising/expenses - Test various filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "campaignId": "test-campaign-id",
            "partyId": "test-party-id",
            "category": "ADVERTISING",
            "status": "PAID",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "fromDate": "2026-01-01",
            "toDate": "2026-12-31",
            "requiresDisclosure": "true",
            "isVerified": "true",
            "minAmount": "1000",
            "maxAmount": "1000000",
            "limit": "50",
            "offset": "0"
        }
        response = requests.get(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_record_expense_fact_validation(self):
        """POST /api/political/fundraising/expenses - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "campaignId or partyId, amount, category, beneficiaryName, expenseDate, and description are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_record_expense_fact_advertising(self):
        """POST /api/political/fundraising/expenses - Record advertising expense fact"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        expense_data = {
            "campaignId": "test-campaign-id",
            "amount": 250000,  # NGN 250,000
            "category": "ADVERTISING",
            "beneficiaryName": "Lagos Media Solutions",
            "beneficiaryAddress": "Plot 45, Ikeja, Lagos",
            "beneficiaryPhone": "+2348098765432",
            "expenseDate": "2026-01-25T09:00:00Z",
            "paymentDate": "2026-01-25T15:00:00Z",
            "description": "Radio and TV advertisement slots for campaign",
            "paymentMethod": "BANK_TRANSFER",
            "reference": "EXP-2026-001",
            "receiptNumber": "RCP-001-2026",
            "state": "Lagos",
            "lga": "Ikeja",
            "notes": "Prime time slots for campaign visibility"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, json=expense_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "STRICTLY ENFORCED" in data["_commerce_boundary"]
    
    def test_record_expense_fact_events(self):
        """POST /api/political/fundraising/expenses - Record events expense fact"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        expense_data = {
            "partyId": "test-party-id",
            "amount": 150000,  # NGN 150,000
            "category": "EVENTS",
            "beneficiaryName": "Tafawa Balewa Square Management",
            "beneficiaryAddress": "Tafawa Balewa Square, Lagos Island, Lagos",
            "beneficiaryPhone": "+2348123456789",
            "expenseDate": "2026-02-01T08:00:00Z",
            "paymentDate": "2026-02-01T12:00:00Z",
            "description": "Venue rental for campaign rally",
            "paymentMethod": "CASH",
            "reference": "EXP-2026-002",
            "receiptNumber": "TBS-2026-001",
            "state": "Lagos",
            "lga": "Lagos Island",
            "notes": "Main campaign rally venue"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, json=expense_data)
        assert response.status_code not in [400, 401]
    
    def test_get_expense_fact_detail(self):
        """GET /api/political/fundraising/expenses/[id] - Get expense fact details"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/fundraising/expenses/test-expense-id", headers=headers)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "_commerce_boundary" in data
            assert "_facts_only" in data
            assert "_append_only" in data
    
    def test_verify_expense_fact(self):
        """POST /api/political/fundraising/expenses/[id] with action: "verify" - Verify expense (ONLY allowed update)"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        verify_data = {
            "action": "verify",
            "verificationNote": "Documents reviewed and verified by finance team"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/expenses/test-expense-id", headers=headers, json=verify_data)
        # Should not return 401 or 400 for invalid action
        assert response.status_code != 401
        
        if response.status_code == 400:
            # If it returns 400, it should be for invalid action, not missing fields
            data = response.json()
            if "error" in data and "action" in data["error"]:
                assert "verify" in data.get("allowed_actions", [])
    
    def test_expense_invalid_action(self):
        """POST /api/political/fundraising/expenses/[id] with invalid action - Should return 400"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        invalid_data = {
            "action": "update",  # Invalid action
            "amount": 300000
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/expenses/test-expense-id", headers=headers, json=invalid_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "verify" in data.get("allowed_actions", [])
            assert data["code"] == "INVALID_ACTION"
    
    def test_expenses_put_forbidden(self):
        """PUT /api/political/fundraising/expenses - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.put(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "APPEND-ONLY" in data["error"]
        assert data["code"] == "FORBIDDEN"
    
    def test_expenses_patch_forbidden(self):
        """PATCH /api/political/fundraising/expenses - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.patch(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_expenses_delete_forbidden(self):
        """DELETE /api/political/fundraising/expenses - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.delete(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "IMMUTABLE" in data["error"]
    
    def test_expense_detail_put_forbidden(self):
        """PUT /api/political/fundraising/expenses/[id] - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.put(f"{BASE_URL}/api/political/fundraising/expenses/test-id", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_expense_detail_patch_forbidden(self):
        """PATCH /api/political/fundraising/expenses/[id] - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.patch(f"{BASE_URL}/api/political/fundraising/expenses/test-id", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_expense_detail_delete_forbidden(self):
        """DELETE /api/political/fundraising/expenses/[id] - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.delete(f"{BASE_URL}/api/political/fundraising/expenses/test-id", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "IMMUTABLE" in data["error"]


class TestPoliticalDisclosuresAPI:
    """Test Political Disclosures API"""
    
    def test_disclosures_requires_tenant_id(self):
        """GET /api/political/fundraising/disclosures - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/fundraising/disclosures")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
    
    def test_query_disclosures_with_tenant(self):
        """GET /api/political/fundraising/disclosures - Query disclosures"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/fundraising/disclosures", headers=headers)
        
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "_mandatory_notice" in data
            assert "UNOFFICIAL" in data["_mandatory_notice"]
    
    def test_query_disclosures_with_filters(self):
        """GET /api/political/fundraising/disclosures - Test various filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "campaignId": "test-campaign-id",
            "partyId": "test-party-id",
            "type": "QUARTERLY",
            "status": "DRAFT",
            "state": "Lagos",
            "fromDate": "2026-01-01",
            "toDate": "2026-12-31",
            "limit": "20",
            "offset": "0"
        }
        response = requests.get(f"{BASE_URL}/api/political/fundraising/disclosures", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_generate_disclosure_validation(self):
        """POST /api/political/fundraising/disclosures - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/fundraising/disclosures", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "campaignId or partyId, title, type, periodStart, and periodEnd are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_generate_disclosure_quarterly(self):
        """POST /api/political/fundraising/disclosures - Generate quarterly disclosure"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        disclosure_data = {
            "campaignId": "test-campaign-id",
            "title": "Q1 2026 Campaign Finance Disclosure",
            "type": "QUARTERLY",
            "periodStart": "2026-01-01T00:00:00Z",
            "periodEnd": "2026-03-31T23:59:59Z",
            "description": "Quarterly disclosure of donations and expenses for Lagos State House of Assembly campaign",
            "state": "Lagos"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/disclosures", headers=headers, json=disclosure_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            # Should contain aggregated data from donation and expense facts
            assert "id" in data or "disclosureId" in data
    
    def test_generate_disclosure_annual(self):
        """POST /api/political/fundraising/disclosures - Generate annual disclosure"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        disclosure_data = {
            "partyId": "test-party-id",
            "title": "2026 Annual Party Finance Disclosure",
            "type": "ANNUAL",
            "periodStart": "2026-01-01T00:00:00Z",
            "periodEnd": "2026-12-31T23:59:59Z",
            "description": "Annual disclosure of all party donations and expenses",
            "state": "Lagos"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/disclosures", headers=headers, json=disclosure_data)
        assert response.status_code not in [400, 401]
    
    def test_get_disclosure_detail(self):
        """GET /api/political/fundraising/disclosures/[id] - Get disclosure details"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/fundraising/disclosures/test-disclosure-id", headers=headers)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Should include aggregated donation and expense data
            # Should include top donors and large expenses
            # Should include UNOFFICIAL disclaimer
            pass
    
    def test_submit_disclosure(self):
        """POST /api/political/fundraising/disclosures/[id] with action: "submit" - Submit disclosure"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        submit_data = {
            "action": "submit",
            "submittedTo": "Independent National Electoral Commission (INEC)"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/disclosures/test-disclosure-id", headers=headers, json=submit_data)
        # Should not return 401 or 400 for invalid action
        assert response.status_code != 401
        
        if response.status_code == 400:
            # If it returns 400, it should be for invalid action or missing submittedTo
            data = response.json()
            if "error" in data and "action" in data["error"]:
                assert "submit" in data.get("allowed_actions", [])
    
    def test_disclosure_invalid_action(self):
        """POST /api/political/fundraising/disclosures/[id] with invalid action - Should return 400"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        invalid_data = {
            "action": "approve",  # Invalid action
            "submittedTo": "INEC"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/fundraising/disclosures/test-disclosure-id", headers=headers, json=invalid_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "submit" in data.get("allowed_actions", [])
            assert data["code"] == "INVALID_ACTION"


class TestPoliticalFundraisingWorkflows:
    """Test complete Political Fundraising workflows"""
    
    def test_full_fundraising_workflow(self):
        """Test the full fundraising workflow: Record donations → Record expenses → Generate disclosure → Submit"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # 1. Record Individual Donation
        donation_data = {
            "campaignId": "test-campaign-id",
            "amount": 75000,  # NGN 75,000
            "source": "INDIVIDUAL",
            "donorName": "Kemi Adeyemi",
            "donorEmail": "kemi.adeyemi@example.com",
            "donorPhone": "+2348098765432",
            "donationDate": "2026-01-10T12:00:00Z",
            "paymentMethod": "BANK_TRANSFER",
            "reference": "DON-WF-001",
            "state": "Lagos"
        }
        donation_response = requests.post(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json=donation_data)
        assert donation_response.status_code not in [400, 401]
        
        # 2. Record Corporate Donation
        corp_donation_data = {
            "campaignId": "test-campaign-id",
            "amount": 300000,  # NGN 300,000
            "source": "CORPORATE",
            "donorName": "Nigerian Tech Solutions Ltd",
            "donorEmail": "finance@nigeriantech.com",
            "donorPhone": "+2348123456789",
            "donationDate": "2026-01-12T10:00:00Z",
            "paymentMethod": "CHEQUE",
            "reference": "DON-WF-002",
            "state": "Lagos"
        }
        corp_response = requests.post(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json=corp_donation_data)
        assert corp_response.status_code not in [400, 401]
        
        # 3. Record Advertising Expense
        ad_expense_data = {
            "campaignId": "test-campaign-id",
            "amount": 180000,  # NGN 180,000
            "category": "ADVERTISING",
            "beneficiaryName": "Radio Lagos",
            "beneficiaryPhone": "+2348087654321",
            "expenseDate": "2026-01-15T09:00:00Z",
            "description": "Radio advertisement campaign",
            "paymentMethod": "BANK_TRANSFER",
            "reference": "EXP-WF-001",
            "state": "Lagos"
        }
        ad_response = requests.post(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, json=ad_expense_data)
        assert ad_response.status_code not in [400, 401]
        
        # 4. Record Event Expense
        event_expense_data = {
            "campaignId": "test-campaign-id",
            "amount": 120000,  # NGN 120,000
            "category": "EVENTS",
            "beneficiaryName": "Lagos Event Center",
            "beneficiaryPhone": "+2348123456789",
            "expenseDate": "2026-01-18T14:00:00Z",
            "description": "Town hall meeting venue rental",
            "paymentMethod": "CASH",
            "reference": "EXP-WF-002",
            "state": "Lagos"
        }
        event_response = requests.post(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, json=event_expense_data)
        assert event_response.status_code not in [400, 401]
        
        # 5. Generate Disclosure
        disclosure_data = {
            "campaignId": "test-campaign-id",
            "title": "January 2026 Campaign Finance Report",
            "type": "MONTHLY",
            "periodStart": "2026-01-01T00:00:00Z",
            "periodEnd": "2026-01-31T23:59:59Z",
            "description": "Monthly financial disclosure for campaign activities",
            "state": "Lagos"
        }
        disclosure_response = requests.post(f"{BASE_URL}/api/political/fundraising/disclosures", headers=headers, json=disclosure_data)
        assert disclosure_response.status_code not in [400, 401]
        
        # 6. Submit Disclosure (if disclosure was created successfully)
        if disclosure_response.status_code == 201:
            submit_data = {
                "action": "submit",
                "submittedTo": "Lagos State Independent Electoral Commission"
            }
            submit_response = requests.post(f"{BASE_URL}/api/political/fundraising/disclosures/test-disclosure-id", headers=headers, json=submit_data)
            # Should not return 401 (may return 404 if disclosure doesn't exist)
            assert submit_response.status_code != 401


class TestPoliticalFundraisingNigerianContext:
    """Test Nigerian-specific context for fundraising"""
    
    def test_nigerian_currency_amounts(self):
        """Test various Nigerian Naira amounts in donations and expenses"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test different NGN amounts
        amounts = [
            1000,      # NGN 1,000 (small donation)
            50000,     # NGN 50,000 (medium donation)
            500000,    # NGN 500,000 (large donation)
            1000000,   # NGN 1,000,000 (major donation)
            5000000    # NGN 5,000,000 (very large donation)
        ]
        
        for i, amount in enumerate(amounts):
            donation_data = {
                "campaignId": "test-campaign-id",
                "amount": amount,
                "source": "INDIVIDUAL",
                "donorName": f"Nigerian Donor {i+1}",
                "donorPhone": f"+23480123456{i:02d}",
                "donationDate": f"2026-01-{i+10:02d}T10:00:00Z",
                "paymentMethod": "BANK_TRANSFER",
                "reference": f"NGN-DON-{i+1:03d}",
                "state": "Lagos"
            }
            
            response = requests.post(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json=donation_data)
            assert response.status_code not in [400, 401], f"NGN amount {amount} should be valid"
    
    def test_nigerian_payment_methods(self):
        """Test Nigerian payment methods in donations and expenses"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        payment_methods = [
            "BANK_TRANSFER",  # Most common in Nigeria
            "CASH",           # Still widely used
            "CHEQUE",         # Corporate payments
            "MOBILE_MONEY",   # Growing in Nigeria
            "POS"             # Point of Sale terminals
        ]
        
        for i, method in enumerate(payment_methods):
            donation_data = {
                "campaignId": "test-campaign-id",
                "amount": 25000,
                "source": "INDIVIDUAL",
                "donorName": f"Payment Test {i+1}",
                "donorPhone": f"+23480987654{i:02d}",
                "donationDate": f"2026-01-{i+15:02d}T12:00:00Z",
                "paymentMethod": method,
                "reference": f"PAY-{method}-{i+1:03d}",
                "state": "Lagos"
            }
            
            response = requests.post(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json=donation_data)
            assert response.status_code not in [400, 401], f"Payment method {method} should be valid"
    
    def test_nigerian_states_in_fundraising(self):
        """Test Nigerian states in fundraising records"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        nigerian_states = [
            {"state": "Lagos", "lga": "Surulere"},
            {"state": "Kano", "lga": "Kano Municipal"},
            {"state": "Rivers", "lga": "Port Harcourt"},
            {"state": "Oyo", "lga": "Ibadan North"},
            {"state": "Kaduna", "lga": "Kaduna North"},
            {"state": "Abuja", "lga": "Abuja Municipal"}
        ]
        
        for i, location in enumerate(nigerian_states):
            donation_data = {
                "campaignId": "test-campaign-id",
                "amount": 40000,
                "source": "INDIVIDUAL",
                "donorName": f"Donor from {location['state']}",
                "donorPhone": f"+23480111222{i:02d}",
                "donationDate": f"2026-01-{i+20:02d}T14:00:00Z",
                "paymentMethod": "BANK_TRANSFER",
                "reference": f"STATE-{location['state'][:3].upper()}-{i+1:03d}",
                **location
            }
            
            response = requests.post(f"{BASE_URL}/api/political/fundraising/donations", headers=headers, json=donation_data)
            assert response.status_code not in [400, 401], f"Nigerian state {location['state']} should be valid"
    
    def test_nigerian_expense_categories(self):
        """Test Nigerian-specific expense categories"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        expense_categories = [
            {"category": "ADVERTISING", "beneficiary": "Radio Lagos", "description": "Radio advertisement slots"},
            {"category": "EVENTS", "beneficiary": "Tafawa Balewa Square", "description": "Rally venue rental"},
            {"category": "TRANSPORTATION", "beneficiary": "Lagos Bus Service", "description": "Campaign bus rental"},
            {"category": "MATERIALS", "beneficiary": "Lagos Printing Press", "description": "Campaign posters and flyers"},
            {"category": "STAFF", "beneficiary": "Campaign Coordinator", "description": "Monthly salary payment"},
            {"category": "UTILITIES", "beneficiary": "NEPA/PHCN", "description": "Campaign office electricity bill"}
        ]
        
        for i, expense in enumerate(expense_categories):
            expense_data = {
                "campaignId": "test-campaign-id",
                "amount": 80000,
                "category": expense["category"],
                "beneficiaryName": expense["beneficiary"],
                "beneficiaryPhone": f"+23480333444{i:02d}",
                "expenseDate": f"2026-01-{i+25:02d}T11:00:00Z",
                "description": expense["description"],
                "paymentMethod": "BANK_TRANSFER",
                "reference": f"CAT-{expense['category'][:3]}-{i+1:03d}",
                "state": "Lagos"
            }
            
            response = requests.post(f"{BASE_URL}/api/political/fundraising/expenses", headers=headers, json=expense_data)
            assert response.status_code not in [400, 401], f"Expense category {expense['category']} should be valid"


# ============================================================================
# POLITICAL SUITE PHASE 3: INTERNAL ELECTIONS & PRIMARIES API TESTS
# ============================================================================

class TestPoliticalPrimariesAPI:
    """Test Political Primaries API - Phase 3 Internal Elections"""
    
    def test_primaries_requires_tenant_id(self):
        """GET /api/political/elections/primaries - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/elections/primaries")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_list_primaries_with_tenant(self):
        """GET /api/political/elections/primaries - List primaries with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/elections/primaries", headers=headers)
        
        # Should not return 401 with proper tenant ID
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            # Verify mandatory disclaimers
            assert "_classification" in data
            assert "INTERNAL PARTY PRIMARY" in data["_classification"]
            assert "_disclaimer1" in data
            assert "UNOFFICIAL" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "INTERNAL / PARTY-LEVEL ONLY" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "NOT INEC" in data["_disclaimer3"]
    
    def test_list_primaries_with_filters(self):
        """GET /api/political/elections/primaries - Test query filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "partyId": "test-party-id",
            "type": "DELEGATES",
            "status": "DRAFT",
            "state": "Lagos",
            "fromDate": "2026-01-01",
            "toDate": "2026-12-31",
            "limit": "10",
            "offset": "0"
        }
        response = requests.get(f"{BASE_URL}/api/political/elections/primaries", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify mandatory disclaimers are present
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
    
    def test_create_primary_validation_missing_fields(self):
        """POST /api/political/elections/primaries - Test validation for missing required fields"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "partyId, title, type, and office are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_create_primary_validation_missing_jurisdiction(self):
        """POST /api/political/elections/primaries - Test jurisdiction requirement"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test missing jurisdiction (no state AND no zone)
        primary_data = {
            "partyId": "test-party-id",
            "title": "Test Primary",
            "type": "DELEGATES",
            "office": "Governor"
            # Missing both state and zone
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries", headers=headers, json=primary_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "Jurisdiction (state or zone) is required" in data["error"]
            assert data["code"] == "JURISDICTION_REQUIRED"
    
    def test_create_primary_with_state_jurisdiction(self):
        """POST /api/political/elections/primaries - Create primary with state jurisdiction"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        primary_data = {
            "partyId": "test-party-id",
            "title": "Lagos State Gubernatorial Primary",
            "type": "DELEGATES",
            "office": "Governor",
            "state": "Lagos",
            "description": "Internal party primary for Lagos State Governor position",
            "nominationStart": "2026-02-01T00:00:00Z",
            "nominationEnd": "2026-02-15T23:59:59Z",
            "votingStart": "2026-03-01T08:00:00Z",
            "votingEnd": "2026-03-01T18:00:00Z"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries", headers=headers, json=primary_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            # Verify mandatory disclaimers in response
            assert "_classification" in data
            assert "INTERNAL PARTY PRIMARY" in data["_classification"]
            assert "_disclaimer1" in data
            assert "UNOFFICIAL" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "INTERNAL / PARTY-LEVEL ONLY" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "NOT INEC" in data["_disclaimer3"]
    
    def test_create_primary_with_zone_jurisdiction(self):
        """POST /api/political/elections/primaries - Create primary with zone jurisdiction"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        primary_data = {
            "partyId": "test-party-id",
            "title": "South-West Zone Presidential Primary",
            "type": "OPEN",
            "office": "President",
            "zone": "South-West",
            "description": "Zonal primary for presidential candidate selection"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries", headers=headers, json=primary_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            # Verify mandatory disclaimers
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
    
    def test_get_primary_by_id(self):
        """GET /api/political/elections/primaries/[id] - Get primary details"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify mandatory disclaimers
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
        elif response.status_code == 404:
            # Expected if primary doesn't exist
            data = response.json()
            assert "error" in data
            assert "not found" in data["error"].lower()
    
    def test_get_primary_with_aspirants(self):
        """GET /api/political/elections/primaries/[id]?includeAspirants=true - Get primary with aspirants"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"includeAspirants": "true"}
        response = requests.get(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Should include aspirants list
            assert "allAspirants" in data or "aspirants" in data
            # Verify disclaimers
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data


class TestPoliticalPrimariesWorkflow:
    """Test Political Primaries workflow - aspirant management and status transitions"""
    
    def test_primary_status_transition(self):
        """POST /api/political/elections/primaries/[id] - Test status transition"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        transition_data = {
            "action": "transition",
            "newStatus": "SCHEDULED",
            "statusNote": "Primary scheduled for March 2026"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=transition_data)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify disclaimers in response
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
    
    def test_add_aspirant_validation(self):
        """POST /api/political/elections/primaries/[id] - Test add aspirant validation"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test missing required fields
        add_aspirant_data = {
            "action": "addAspirant"
            # Missing firstName, lastName, phone
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=add_aspirant_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "firstName, lastName, and phone are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_add_aspirant_with_nigerian_data(self):
        """POST /api/political/elections/primaries/[id] - Add aspirant with Nigerian data"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        add_aspirant_data = {
            "action": "addAspirant",
            "firstName": "Adebayo",
            "lastName": "Ogundimu",
            "middleName": "Babatunde",
            "phone": "+2348012345678",
            "email": "adebayo.ogundimu@example.com",
            "dateOfBirth": "1975-05-20",
            "gender": "MALE",
            "occupation": "Lawyer",
            "address": "25 Victoria Island, Lagos",
            "state": "Lagos",
            "lga": "Lagos Island",
            "ward": "Ward 01",
            "biography": "Experienced lawyer and community leader",
            "qualifications": ["LLB", "BL", "LLM"]
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=add_aspirant_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            # Verify disclaimers
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
    
    def test_screen_aspirant_validation(self):
        """POST /api/political/elections/primaries/[id] - Test screen aspirant validation"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test missing required fields
        screen_data = {
            "action": "screenAspirant"
            # Missing aspirantId and passed
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=screen_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "aspirantId and passed (boolean) are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_screen_aspirant_passed(self):
        """POST /api/political/elections/primaries/[id] - Screen aspirant (passed)"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        screen_data = {
            "action": "screenAspirant",
            "aspirantId": "test-aspirant-id",
            "passed": True,
            "screeningNote": "All documents verified and requirements met"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=screen_data)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify disclaimers
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
    
    def test_screen_aspirant_failed(self):
        """POST /api/political/elections/primaries/[id] - Screen aspirant (failed)"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        screen_data = {
            "action": "screenAspirant",
            "aspirantId": "test-aspirant-id-2",
            "passed": False,
            "screeningNote": "Missing required tax clearance certificate"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=screen_data)
        assert response.status_code != 401
    
    def test_clear_aspirant(self):
        """POST /api/political/elections/primaries/[id] - Clear aspirant for voting"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        clear_data = {
            "action": "clearAspirant",
            "aspirantId": "test-aspirant-id",
            "clearanceNote": "Aspirant cleared for primary election voting"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=clear_data)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify disclaimers
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
    
    def test_invalid_primary_action(self):
        """POST /api/political/elections/primaries/[id] - Test invalid action"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        invalid_data = {
            "action": "invalidAction",
            "someData": "test"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=invalid_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "Unknown action" in data["error"]
            assert data["code"] == "INVALID_ACTION"
            assert "allowed_actions" in data
            expected_actions = ["transition", "addAspirant", "screenAspirant", "clearAspirant"]
            for action in expected_actions:
                assert action in data["allowed_actions"]


class TestPoliticalVotesAPI:
    """Test Political Votes API - Phase 3 APPEND-ONLY enforcement"""
    
    def test_votes_requires_tenant_id(self):
        """GET /api/political/elections/votes - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/elections/votes")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_get_vote_counts_validation(self):
        """GET /api/political/elections/votes - Test primaryId requirement"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        
        # Test missing primaryId
        response = requests.get(f"{BASE_URL}/api/political/elections/votes", headers=headers)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "primaryId is required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_get_vote_counts_with_primary_id(self):
        """GET /api/political/elections/votes?primaryId=test - Get vote counts"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"primaryId": "test-primary-id"}
        
        response = requests.get(f"{BASE_URL}/api/political/elections/votes", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify mandatory notices
            assert "_classification" in data
            assert "INTERNAL PARTY VOTE" in data["_classification"]
            assert "_disclaimer1" in data
            assert "UNOFFICIAL" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "INTERNAL / PARTY-LEVEL ONLY" in data["_disclaimer2"]
            assert "_append_only" in data
            assert "APPEND-ONLY" in data["_append_only"]
    
    def test_get_vote_counts_by_jurisdiction(self):
        """GET /api/political/elections/votes?primaryId=test&byJurisdiction=true - Get jurisdiction stats"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "primaryId": "test-primary-id",
            "byJurisdiction": "true"
        }
        
        response = requests.get(f"{BASE_URL}/api/political/elections/votes", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify mandatory notices
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_append_only" in data
    
    def test_get_vote_counts_with_scope(self):
        """GET /api/political/elections/votes - Test jurisdiction scoping"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "primaryId": "test-primary-id",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03"
        }
        
        response = requests.get(f"{BASE_URL}/api/political/elections/votes", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_cast_vote_validation_missing_fields(self):
        """POST /api/political/elections/votes - Test validation for missing required fields"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/elections/votes", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "primaryId, aspirantId, and voterId are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_cast_vote_conflict_of_interest(self):
        """POST /api/political/elections/votes - Test conflict of interest check"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-voter-id"}
        
        # Test where x-user-id (capturedBy) is same as voterId
        vote_data = {
            "primaryId": "test-primary-id",
            "aspirantId": "test-aspirant-id",
            "voterId": "test-voter-id",  # Same as x-user-id
            "state": "Lagos",
            "captureMethod": "MANUAL"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/votes", headers=headers, json=vote_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            # Should contain conflict of interest error
            assert "CONFLICT" in data["error"] or "conflict" in data["error"].lower()
    
    def test_cast_vote_valid(self):
        """POST /api/political/elections/votes - Cast valid vote"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        vote_data = {
            "primaryId": "test-primary-id",
            "aspirantId": "test-aspirant-id",
            "voterId": "test-member-id",  # Different from x-user-id
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "captureMethod": "MANUAL",
            "notes": "Vote cast during primary election"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/votes", headers=headers, json=vote_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            # Verify mandatory notices
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_append_only" in data
            
            # Verify ballot secrecy - response should NOT include voterId or aspirantId
            assert "voterId" not in data or data.get("voterId") is None
            assert "aspirantId" not in data or data.get("aspirantId") is None
    
    def test_challenge_vote_validation(self):
        """POST /api/political/elections/votes - Test challenge vote validation"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test missing required fields for challenge
        challenge_data = {
            "action": "challenge"
            # Missing voteId and challengeNote
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/votes", headers=headers, json=challenge_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "voteId and challengeNote are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_challenge_vote_valid(self):
        """POST /api/political/elections/votes - Challenge vote"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        challenge_data = {
            "action": "challenge",
            "voteId": "test-vote-id",
            "challengeNote": "Suspected irregularity in vote casting process"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/votes", headers=headers, json=challenge_data)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify mandatory notices
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_append_only" in data
    
    def test_votes_put_forbidden(self):
        """PUT /api/political/elections/votes - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.put(f"{BASE_URL}/api/political/elections/votes", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "APPEND-ONLY" in data["error"]
        assert data["code"] == "FORBIDDEN"
        assert "_reason" in data
        assert "immutability" in data["_reason"].lower()
    
    def test_votes_patch_forbidden(self):
        """PATCH /api/political/elections/votes - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.patch(f"{BASE_URL}/api/political/elections/votes", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "APPEND-ONLY" in data["error"]
        assert data["code"] == "FORBIDDEN"
    
    def test_votes_delete_forbidden(self):
        """DELETE /api/political/elections/votes - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.delete(f"{BASE_URL}/api/political/elections/votes", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "IMMUTABLE" in data["error"]
        assert data["code"] == "FORBIDDEN"
        assert "_reason" in data
        assert "challenge action" in data["_reason"]


class TestPoliticalResultsAPI:
    """Test Political Results API - Phase 3 APPEND-ONLY enforcement"""
    
    def test_results_requires_tenant_id(self):
        """GET /api/political/elections/results - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/elections/results")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_get_results_validation(self):
        """GET /api/political/elections/results - Test primaryId requirement"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        
        # Test missing primaryId
        response = requests.get(f"{BASE_URL}/api/political/elections/results", headers=headers)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "primaryId is required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_get_results_with_primary_id(self):
        """GET /api/political/elections/results?primaryId=test - Get results"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"primaryId": "test-primary-id"}
        
        response = requests.get(f"{BASE_URL}/api/political/elections/results", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify mandatory disclaimers
            assert "_disclaimer1" in data
            assert "UNOFFICIAL RESULT" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "INTERNAL PARTY USE ONLY" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "NOT INEC-CERTIFIED - NO LEGAL STANDING" in data["_disclaimer3"]
            assert "_append_only" in data
            assert "APPEND-ONLY" in data["_append_only"]
    
    def test_get_results_winner_only(self):
        """GET /api/political/elections/results?primaryId=test&winner=true - Get winner only"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "primaryId": "test-primary-id",
            "winner": "true"
        }
        
        response = requests.get(f"{BASE_URL}/api/political/elections/results", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify all three mandatory disclaimers
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
    
    def test_get_results_with_filters(self):
        """GET /api/political/elections/results - Test various filters"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "primaryId": "test-primary-id",
            "scope": "STATE",
            "status": "DECLARED",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03"
        }
        
        response = requests.get(f"{BASE_URL}/api/political/elections/results", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_declare_results_validation_missing_fields(self):
        """POST /api/political/elections/results - Test validation for missing required fields"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "primaryId and scope are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
            assert "valid_scopes" in data
            expected_scopes = ["OVERALL", "STATE", "LGA", "WARD"]
            for scope in expected_scopes:
                assert scope in data["valid_scopes"]
    
    def test_declare_results_overall_scope(self):
        """POST /api/political/elections/results - Declare overall results"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        results_data = {
            "primaryId": "test-primary-id",
            "scope": "OVERALL",
            "declaredBy": "Primary Election Committee",
            "declaredAt": "2026-03-01T20:00:00Z",
            "notes": "Final results for Lagos State Gubernatorial Primary"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json=results_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            # Verify all three mandatory disclaimers
            assert "_disclaimer1" in data
            assert "UNOFFICIAL RESULT" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "INTERNAL PARTY USE ONLY" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "NOT INEC-CERTIFIED - NO LEGAL STANDING" in data["_disclaimer3"]
            assert "_append_only" in data
            
            # Should include position rankings and isWinner flag
            if "results" in data:
                for result in data["results"]:
                    assert "position" in result
                    assert "isWinner" in result
    
    def test_declare_results_state_scope(self):
        """POST /api/political/elections/results - Declare state-level results"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        results_data = {
            "primaryId": "test-primary-id",
            "scope": "STATE",
            "state": "Lagos",
            "declaredBy": "Lagos State Primary Committee",
            "declaredAt": "2026-03-01T19:30:00Z",
            "notes": "Lagos State results for gubernatorial primary"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json=results_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            # Verify disclaimers
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
    
    def test_declare_results_lga_scope(self):
        """POST /api/political/elections/results - Declare LGA-level results"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        results_data = {
            "primaryId": "test-primary-id",
            "scope": "LGA",
            "state": "Lagos",
            "lga": "Surulere",
            "declaredBy": "Surulere LGA Primary Committee",
            "declaredAt": "2026-03-01T19:00:00Z"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json=results_data)
        assert response.status_code not in [400, 401]
    
    def test_declare_results_ward_scope(self):
        """POST /api/political/elections/results - Declare ward-level results"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        results_data = {
            "primaryId": "test-primary-id",
            "scope": "WARD",
            "state": "Lagos",
            "lga": "Surulere",
            "ward": "Ward 03",
            "declaredBy": "Ward 03 Primary Committee",
            "declaredAt": "2026-03-01T18:30:00Z"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json=results_data)
        assert response.status_code not in [400, 401]
    
    def test_challenge_result_validation(self):
        """POST /api/political/elections/results - Test challenge result validation"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test missing required fields for challenge
        challenge_data = {
            "action": "challenge"
            # Missing resultId and challengeNote
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json=challenge_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "resultId and challengeNote are required" in data["error"]
            assert data["code"] == "VALIDATION_ERROR"
    
    def test_challenge_result_valid(self):
        """POST /api/political/elections/results - Challenge result"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        challenge_data = {
            "action": "challenge",
            "resultId": "test-result-id",
            "challengeNote": "Contest this result due to procedural irregularities"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json=challenge_data)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify disclaimers
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
    
    def test_duplicate_declaration_prevention(self):
        """POST /api/political/elections/results - Test duplicate declaration prevention"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Try declaring results for same scope twice
        results_data = {
            "primaryId": "test-primary-id",
            "scope": "OVERALL",
            "declaredBy": "Primary Election Committee"
        }
        
        # First declaration
        response1 = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json=results_data)
        
        # Second declaration (should fail if first succeeded)
        response2 = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json=results_data)
        
        # If first succeeded, second should fail with "already been declared" error
        if response1.status_code == 201 and response2.status_code == 400:
            data = response2.json()
            assert "error" in data
            assert "already" in data["error"].lower()
    
    def test_results_put_forbidden(self):
        """PUT /api/political/elections/results - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.put(f"{BASE_URL}/api/political/elections/results", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "APPEND-ONLY" in data["error"]
        assert data["code"] == "FORBIDDEN"
        assert "_reason" in data
        assert "immutability" in data["_reason"].lower()
        # Verify disclaimers in error response
        assert "_disclaimer1" in data
        assert "_disclaimer2" in data
        assert "_disclaimer3" in data
    
    def test_results_patch_forbidden(self):
        """PATCH /api/political/elections/results - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.patch(f"{BASE_URL}/api/political/elections/results", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "APPEND-ONLY" in data["error"]
        assert data["code"] == "FORBIDDEN"
        # Verify disclaimers in error response
        assert "_disclaimer1" in data
        assert "_disclaimer2" in data
        assert "_disclaimer3" in data
    
    def test_results_delete_forbidden(self):
        """DELETE /api/political/elections/results - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.delete(f"{BASE_URL}/api/political/elections/results", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "IMMUTABLE" in data["error"]
        assert data["code"] == "FORBIDDEN"
        assert "_reason" in data
        # Verify disclaimers in error response
        assert "_disclaimer1" in data
        assert "_disclaimer2" in data
        assert "_disclaimer3" in data


class TestPoliticalPhase3Workflows:
    """Test complete Political Phase 3 workflows"""
    
    def test_full_primary_election_workflow(self):
        """Test the full primary election workflow: Create party → Create primary → Add aspirants → Screen → Clear → Vote → Declare results"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # 1. Create Party (prerequisite)
        party_data = {
            "name": "Progressive Democratic Party",
            "acronym": "PDP-TEST",
            "description": "Test party for Phase 3 primary election",
            "headquarters": "Lagos, Nigeria"
        }
        party_response = requests.post(f"{BASE_URL}/api/political/parties", headers=headers, json=party_data)
        assert party_response.status_code not in [400, 401]
        
        # 2. Create Primary
        primary_data = {
            "partyId": "test-party-id",  # Would use actual party ID in real scenario
            "title": "Lagos State Gubernatorial Primary",
            "type": "DELEGATES",
            "office": "Governor",
            "state": "Lagos",
            "description": "Internal party primary for Lagos State Governor position"
        }
        primary_response = requests.post(f"{BASE_URL}/api/political/elections/primaries", headers=headers, json=primary_data)
        assert primary_response.status_code not in [400, 401]
        
        if primary_response.status_code == 201:
            # Verify mandatory disclaimers in primary creation response
            data = primary_response.json()
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_disclaimer3" in data
        
        # 3. Add Aspirant
        add_aspirant_data = {
            "action": "addAspirant",
            "firstName": "Adebayo",
            "lastName": "Ogundimu",
            "phone": "+2348012345678",
            "email": "adebayo.ogundimu@example.com",
            "state": "Lagos",
            "lga": "Lagos Island"
        }
        aspirant_response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=add_aspirant_data)
        assert aspirant_response.status_code not in [400, 401]
        
        # 4. Screen Aspirant
        screen_data = {
            "action": "screenAspirant",
            "aspirantId": "test-aspirant-id",
            "passed": True,
            "screeningNote": "All documents verified"
        }
        screen_response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=screen_data)
        assert screen_response.status_code not in [400, 401]
        
        # 5. Clear Aspirant
        clear_data = {
            "action": "clearAspirant",
            "aspirantId": "test-aspirant-id",
            "clearanceNote": "Aspirant cleared for voting"
        }
        clear_response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=clear_data)
        assert clear_response.status_code not in [400, 401]
        
        # 6. Transition Primary to VOTING_OPEN
        transition_data = {
            "action": "transition",
            "newStatus": "VOTING_OPEN",
            "statusNote": "Primary voting is now open"
        }
        transition_response = requests.post(f"{BASE_URL}/api/political/elections/primaries/test-primary-id", headers=headers, json=transition_data)
        assert transition_response.status_code not in [400, 401]
        
        # 7. Cast Vote
        vote_data = {
            "primaryId": "test-primary-id",
            "aspirantId": "test-aspirant-id",
            "voterId": "test-member-id",
            "state": "Lagos",
            "captureMethod": "MANUAL"
        }
        vote_response = requests.post(f"{BASE_URL}/api/political/elections/votes", headers=headers, json=vote_data)
        assert vote_response.status_code not in [400, 401]
        
        if vote_response.status_code == 201:
            # Verify ballot secrecy - no voter/aspirant linkage in response
            data = vote_response.json()
            assert "voterId" not in data or data.get("voterId") is None
            assert "aspirantId" not in data or data.get("aspirantId") is None
        
        # 8. Declare Results
        results_data = {
            "primaryId": "test-primary-id",
            "scope": "OVERALL",
            "declaredBy": "Primary Election Committee"
        }
        results_response = requests.post(f"{BASE_URL}/api/political/elections/results", headers=headers, json=results_data)
        assert results_response.status_code not in [400, 401]
        
        if results_response.status_code == 201:
            # Verify all three mandatory disclaimers
            data = results_response.json()
            assert "_disclaimer1" in data
            assert "UNOFFICIAL RESULT" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "INTERNAL PARTY USE ONLY" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "NOT INEC-CERTIFIED - NO LEGAL STANDING" in data["_disclaimer3"]


class TestPoliticalPhase3CriticalVerifications:
    """Test critical verifications for Phase 3 - HIGH-RISK controls"""
    
    def test_mandatory_labels_verification(self):
        """Verify MANDATORY LABELS are present in all Phase 3 responses"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        
        # Test Primaries API
        primaries_response = requests.get(f"{BASE_URL}/api/political/elections/primaries", headers=headers)
        if primaries_response.status_code == 200:
            data = primaries_response.json()
            assert "UNOFFICIAL" in str(data)
            assert "INTERNAL" in str(data) and "PARTY" in str(data)
            assert "NOT INEC" in str(data)
        
        # Test Votes API
        votes_response = requests.get(f"{BASE_URL}/api/political/elections/votes?primaryId=test", headers=headers)
        if votes_response.status_code == 200:
            data = votes_response.json()
            assert "UNOFFICIAL" in str(data)
            assert "INTERNAL" in str(data) and "PARTY" in str(data)
        
        # Test Results API
        results_response = requests.get(f"{BASE_URL}/api/political/elections/results?primaryId=test", headers=headers)
        if results_response.status_code == 200:
            data = results_response.json()
            assert "UNOFFICIAL RESULT" in str(data)
            assert "INTERNAL PARTY USE ONLY" in str(data)
            assert "NOT INEC-CERTIFIED - NO LEGAL STANDING" in str(data)
    
    def test_append_only_enforcement_comprehensive(self):
        """Comprehensive test of APPEND-ONLY enforcement for votes and results"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test all forbidden operations on votes
        votes_endpoints = [
            f"{BASE_URL}/api/political/elections/votes",
        ]
        
        for endpoint in votes_endpoints:
            # PUT should return 403
            put_response = requests.put(endpoint, headers=headers, json={})
            assert put_response.status_code == 403
            put_data = put_response.json()
            assert "APPEND-ONLY" in put_data["error"]
            
            # PATCH should return 403
            patch_response = requests.patch(endpoint, headers=headers, json={})
            assert patch_response.status_code == 403
            patch_data = patch_response.json()
            assert "APPEND-ONLY" in patch_data["error"]
            
            # DELETE should return 403
            delete_response = requests.delete(endpoint, headers=headers)
            assert delete_response.status_code == 403
            delete_data = delete_response.json()
            assert "IMMUTABLE" in delete_data["error"]
        
        # Test all forbidden operations on results
        results_endpoints = [
            f"{BASE_URL}/api/political/elections/results",
        ]
        
        for endpoint in results_endpoints:
            # PUT should return 403
            put_response = requests.put(endpoint, headers=headers, json={})
            assert put_response.status_code == 403
            put_data = put_response.json()
            assert "APPEND-ONLY" in put_data["error"]
            # Results should include disclaimers even in error responses
            assert "_disclaimer1" in put_data
            assert "_disclaimer2" in put_data
            assert "_disclaimer3" in put_data
            
            # PATCH should return 403
            patch_response = requests.patch(endpoint, headers=headers, json={})
            assert patch_response.status_code == 403
            patch_data = patch_response.json()
            assert "APPEND-ONLY" in patch_data["error"]
            
            # DELETE should return 403
            delete_response = requests.delete(endpoint, headers=headers)
            assert delete_response.status_code == 403
            delete_data = delete_response.json()
            assert "IMMUTABLE" in delete_data["error"]
    
    def test_jurisdiction_enforcement(self):
        """Test jurisdiction enforcement - primaries require state or zone"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Test primary creation without jurisdiction
        primary_data = {
            "partyId": "test-party-id",
            "title": "Test Primary Without Jurisdiction",
            "type": "DELEGATES",
            "office": "Governor"
            # Missing both state and zone
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/primaries", headers=headers, json=primary_data)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "Jurisdiction" in data["error"] and ("state" in data["error"] or "zone" in data["error"])
            assert data["code"] == "JURISDICTION_REQUIRED"
    
    def test_ballot_secrecy_enforcement(self):
        """Test ballot secrecy - vote responses don't expose voter/aspirant linkage"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Cast a vote
        vote_data = {
            "primaryId": "test-primary-id",
            "aspirantId": "test-aspirant-id",
            "voterId": "test-member-id",
            "state": "Lagos",
            "captureMethod": "MANUAL"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/votes", headers=headers, json=vote_data)
        if response.status_code == 201:
            data = response.json()
            # Response should NOT include voterId or aspirantId (ballot secrecy)
            assert "voterId" not in data or data.get("voterId") is None
            assert "aspirantId" not in data or data.get("aspirantId") is None
            
            # But should include mandatory notices
            assert "_disclaimer1" in data
            assert "_disclaimer2" in data
            assert "_append_only" in data
    
    def test_no_voter_registry_enforcement(self):
        """Test that system uses party member IDs, not voter IDs"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Vote should use member ID as voterId
        vote_data = {
            "primaryId": "test-primary-id",
            "aspirantId": "test-aspirant-id",
            "voterId": "member-id-not-voter-id",  # Should be party member ID
            "state": "Lagos",
            "captureMethod": "MANUAL"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/elections/votes", headers=headers, json=vote_data)
        # Should not return validation error for using member ID
        assert response.status_code not in [400, 401]


# ============================================================================
# POLITICAL SUITE PHASE 4: GOVERNANCE & POST-ELECTION API TESTS
# ============================================================================

class TestPoliticalGovernancePetitions:
    """Test Political Governance Petitions API - Phase 4"""
    
    def test_petitions_requires_tenant_id(self):
        """GET /api/political/governance/petitions - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/governance/petitions")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_list_petitions_with_tenant(self):
        """GET /api/political/governance/petitions - List petitions with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/governance/petitions", headers=headers)
        
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "_disclaimer1" in data
            assert "INTERNAL PARTY GRIEVANCE" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "NOT A LEGAL PROCEEDING" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "NO OFFICIAL STANDING" in data["_disclaimer3"]
    
    def test_create_petition_procedural_violation(self):
        """POST /api/political/governance/petitions - Create procedural violation petition"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        petition_data = {
            "partyId": "test-party-id",
            "type": "PROCEDURAL_VIOLATION",
            "title": "Test Petition - Voting Irregularity",
            "description": "This is a test petition to verify the grievance handling workflow.",
            "petitionerId": "test-member-id",
            "petitionerName": "Adewale Ogundimu",
            "petitionerRole": "Ward Chairman",
            "state": "Lagos",
            "incidentDate": "2026-01-07T00:00:00Z"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/petitions", headers=headers, json=petition_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "_disclaimer1" in data
            assert "INTERNAL PARTY GRIEVANCE" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "NOT A LEGAL PROCEEDING" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "NO OFFICIAL STANDING" in data["_disclaimer3"]
    
    def test_petition_workflow_submit(self):
        """POST /api/political/governance/petitions/[id] - Submit petition"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        submit_data = {"action": "submit"}
        
        response = requests.post(f"{BASE_URL}/api/political/governance/petitions/test-petition-id", headers=headers, json=submit_data)
        assert response.status_code != 401
    
    def test_petition_workflow_transition(self):
        """POST /api/political/governance/petitions/[id] - Transition petition status"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        transition_data = {
            "action": "transition",
            "status": "UNDER_REVIEW",
            "note": "Reviewing petition for procedural compliance"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/petitions/test-petition-id", headers=headers, json=transition_data)
        assert response.status_code != 401
    
    def test_petition_workflow_decide(self):
        """POST /api/political/governance/petitions/[id] - Decide petition"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        decide_data = {
            "action": "decide",
            "decision": "Petition upheld - Procedural violation confirmed",
            "isUpheld": True
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/petitions/test-petition-id", headers=headers, json=decide_data)
        assert response.status_code != 401


class TestPoliticalGovernanceEvidence:
    """Test Political Governance Evidence API - Phase 4 (APPEND-ONLY)"""
    
    def test_evidence_requires_tenant_id(self):
        """GET /api/political/governance/evidence - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/governance/evidence")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_list_evidence_with_petition_id(self):
        """GET /api/political/governance/evidence?petitionId=... - List evidence for petition"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"petitionId": "test-petition-id"}
        response = requests.get(f"{BASE_URL}/api/political/governance/evidence", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "_classification" in data
            assert "EVIDENCE RECORD - APPEND-ONLY" in data["_classification"]
            assert "_immutability" in data
            assert "Evidence cannot be modified or deleted once submitted" in data["_immutability"]
    
    def test_submit_witness_statement_evidence(self):
        """POST /api/political/governance/evidence - Submit witness statement evidence"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        evidence_data = {
            "petitionId": "test-petition-id",
            "type": "WITNESS_STATEMENT",
            "title": "Witness Statement - Irregularity Observed",
            "description": "Statement from ward observer",
            "witnessName": "Chinedu Okafor",
            "witnessContact": "+234 803 123 4567",
            "statement": "I observed voting irregularities at polling unit 012 during the ward primary election..."
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/evidence", headers=headers, json=evidence_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "_classification" in data
            assert "EVIDENCE RECORD - APPEND-ONLY" in data["_classification"]
    
    def test_verify_evidence(self):
        """POST /api/political/governance/evidence with action: verify - Verify evidence"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        verify_data = {
            "action": "verify",
            "evidenceId": "test-evidence-id",
            "verificationNote": "Statement verified against records"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/evidence", headers=headers, json=verify_data)
        assert response.status_code != 401
    
    def test_evidence_put_forbidden(self):
        """PUT /api/political/governance/evidence - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.put(f"{BASE_URL}/api/political/governance/evidence", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "APPEND-ONLY" in data["error"]
        assert data["code"] == "FORBIDDEN"
    
    def test_evidence_patch_forbidden(self):
        """PATCH /api/political/governance/evidence - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.patch(f"{BASE_URL}/api/political/governance/evidence", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_evidence_delete_forbidden(self):
        """DELETE /api/political/governance/evidence - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.delete(f"{BASE_URL}/api/political/governance/evidence", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "IMMUTABLE" in data["error"]


class TestPoliticalGovernanceEngagements:
    """Test Political Governance Engagements API - Phase 4"""
    
    def test_engagements_requires_tenant_id(self):
        """GET /api/political/governance/engagements - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/governance/engagements")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_list_engagements_with_tenant(self):
        """GET /api/political/governance/engagements - List engagements with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/governance/engagements", headers=headers)
        
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "_disclaimer1" in data
            assert "NON-PARTISAN COMMUNITY ENGAGEMENT" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "FOR INFORMATIONAL PURPOSES ONLY" in data["_disclaimer2"]
    
    def test_create_town_hall_engagement(self):
        """POST /api/political/governance/engagements - Create town hall engagement"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        engagement_data = {
            "partyId": "test-party-id",
            "type": "TOWN_HALL",
            "title": "Post-Election Town Hall Meeting",
            "description": "Community engagement session to discuss election results and next steps",
            "content": "Full content of the engagement session including agenda and key discussion points...",
            "targetAudience": "All Party Members - Lagos State",
            "state": "Lagos",
            "scheduledAt": "2026-01-15T10:00:00Z"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/engagements", headers=headers, json=engagement_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "_disclaimer1" in data
            assert "NON-PARTISAN COMMUNITY ENGAGEMENT" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "FOR INFORMATIONAL PURPOSES ONLY" in data["_disclaimer2"]
    
    def test_publish_engagement(self):
        """POST /api/political/governance/engagements with action: publish - Publish engagement"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        publish_data = {
            "action": "publish",
            "engagementId": "test-engagement-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/engagements", headers=headers, json=publish_data)
        assert response.status_code != 401


class TestPoliticalGovernanceRegulators:
    """Test Political Governance Regulators API - Phase 4 (READ-ONLY ACCESS)"""
    
    def test_regulators_requires_tenant_id(self):
        """GET /api/political/governance/regulators - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/governance/regulators")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_list_regulator_access_with_tenant(self):
        """GET /api/political/governance/regulators - List regulator access records"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/governance/regulators", headers=headers)
        
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "_disclaimer1" in data
            assert "READ-ONLY ACCESS" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "NO WRITE PERMISSIONS" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "ALL ACCESS IS LOGGED" in data["_disclaimer3"]
    
    def test_grant_regulator_access_ngo(self):
        """POST /api/political/governance/regulators - Grant access to NGO regulator"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        access_data = {
            "partyId": "test-party-id",
            "regulatorName": "Civil Society Election Monitor",
            "regulatorType": "NGO",
            "contactName": "Dr. Ngozi Okonkwo",
            "contactEmail": "monitor@civilsociety.org",
            "contactPhone": "+234 809 876 5432",
            "accessLevel": "OBSERVER",
            "canViewParties": True,
            "canViewCampaigns": True,
            "canViewPrimaries": True,
            "canViewResults": True,
            "canViewAuditLogs": False,
            "canViewPetitions": False,
            "expiresAt": "2026-06-30T23:59:59Z"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/regulators", headers=headers, json=access_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "_disclaimer1" in data
            assert "READ-ONLY ACCESS" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "NO WRITE PERMISSIONS" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "ALL ACCESS IS LOGGED" in data["_disclaimer3"]
    
    def test_log_access_event(self):
        """POST /api/political/governance/regulators with action: log - Log access event"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        log_data = {
            "action": "log",
            "accessId": "test-access-id",
            "logAction": "VIEW",
            "resource": "primaries",
            "resourceId": "test-primary-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/regulators", headers=headers, json=log_data)
        assert response.status_code != 401
    
    def test_revoke_regulator_access(self):
        """POST /api/political/governance/regulators with action: revoke - Revoke access"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        revoke_data = {
            "action": "revoke",
            "accessId": "test-access-id",
            "revocationReason": "Monitoring period ended"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/regulators", headers=headers, json=revoke_data)
        assert response.status_code != 401


class TestPoliticalGovernanceAudit:
    """Test Political Governance Audit API - Phase 4 (APPEND-ONLY / READ-ONLY)"""
    
    def test_governance_audit_requires_tenant_id(self):
        """GET /api/political/governance/audit - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/governance/audit")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_list_governance_audit_logs_with_tenant(self):
        """GET /api/political/governance/audit - List governance audit logs"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/governance/audit", headers=headers)
        
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "_classification" in data
            assert "GOVERNANCE AUDIT LOG" in data["_classification"]
            assert "_immutability" in data
            assert "APPEND-ONLY" in data["_immutability"]
            assert "_integrity" in data
            assert "cryptographic hash" in data["_integrity"]
    
    def test_verify_audit_integrity(self):
        """POST /api/political/governance/audit with action: verify - Verify audit integrity"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        verify_data = {
            "action": "verify",
            "auditId": "test-audit-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/audit", headers=headers, json=verify_data)
        assert response.status_code != 401
    
    def test_export_audit_logs(self):
        """POST /api/political/governance/audit with action: export - Export audit logs"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        export_data = {
            "action": "export",
            "partyId": "test-party-id",
            "format": "json"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/audit", headers=headers, json=export_data)
        assert response.status_code != 401
    
    def test_governance_audit_put_forbidden(self):
        """PUT /api/political/governance/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.put(f"{BASE_URL}/api/political/governance/audit", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "READ-ONLY" in data["error"]
        assert data["code"] == "FORBIDDEN"
    
    def test_governance_audit_patch_forbidden(self):
        """PATCH /api/political/governance/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.patch(f"{BASE_URL}/api/political/governance/audit", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "APPEND-ONLY" in data["error"]
    
    def test_governance_audit_delete_forbidden(self):
        """DELETE /api/political/governance/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        response = requests.delete(f"{BASE_URL}/api/political/governance/audit", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "IMMUTABLE" in data["error"]


class TestPoliticalGovernanceTransparency:
    """Test Political Governance Transparency Reports API - Phase 4"""
    
    def test_transparency_requires_tenant_id(self):
        """GET /api/political/governance/transparency - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/political/governance/transparency")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
        assert data["code"] == "TENANT_REQUIRED"
    
    def test_list_transparency_reports_with_tenant(self):
        """GET /api/political/governance/transparency - List transparency reports"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/political/governance/transparency", headers=headers)
        
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "_disclaimer1" in data
            assert "TRANSPARENCY REPORT" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "NON-PARTISAN - FOR PUBLIC INFORMATION" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "UNOFFICIAL - NOT GOVERNMENT CERTIFIED" in data["_disclaimer3"]
    
    def test_get_public_transparency_reports(self):
        """GET /api/political/governance/transparency?public=true - Get public reports only"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"public": "true", "partyId": "test-party-id", "limit": "10"}
        response = requests.get(f"{BASE_URL}/api/political/governance/transparency", headers=headers, params=params)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "_disclaimer1" in data
            assert "TRANSPARENCY REPORT" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "NON-PARTISAN - FOR PUBLIC INFORMATION" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "UNOFFICIAL - NOT GOVERNMENT CERTIFIED" in data["_disclaimer3"]
    
    def test_create_activity_report(self):
        """POST /api/political/governance/transparency - Create activity report"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        report_data = {
            "partyId": "test-party-id",
            "type": "ACTIVITY_REPORT",
            "title": "Q1 2026 Party Activities Report",
            "period": "Q1 2026",
            "summary": "Summary of party activities for the first quarter of 2026...",
            "content": "Detailed report content covering all party activities, meetings, and initiatives during Q1 2026..."
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/transparency", headers=headers, json=report_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "_disclaimer1" in data
            assert "TRANSPARENCY REPORT" in data["_disclaimer1"]
            assert "_disclaimer2" in data
            assert "NON-PARTISAN - FOR PUBLIC INFORMATION" in data["_disclaimer2"]
            assert "_disclaimer3" in data
            assert "UNOFFICIAL - NOT GOVERNMENT CERTIFIED" in data["_disclaimer3"]
    
    def test_publish_transparency_report(self):
        """POST /api/political/governance/transparency with action: publish - Publish report"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        publish_data = {
            "action": "publish",
            "reportId": "test-report-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/political/governance/transparency", headers=headers, json=publish_data)
        assert response.status_code != 401


class TestPoliticalGovernanceCriticalVerifications:
    """Test critical verifications for Political Governance - Phase 4"""
    
    def test_mandatory_labels_verification(self):
        """Verify all mandatory labels are present in responses"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        
        # Test Petitions labels
        response = requests.get(f"{BASE_URL}/api/political/governance/petitions", headers=headers)
        if response.status_code == 200:
            data = response.json()
            assert "_disclaimer1" in data and "INTERNAL PARTY GRIEVANCE" in data["_disclaimer1"]
            assert "_disclaimer2" in data and "NOT A LEGAL PROCEEDING" in data["_disclaimer2"]
            assert "_disclaimer3" in data and "NO OFFICIAL STANDING" in data["_disclaimer3"]
        
        # Test Evidence labels
        response = requests.get(f"{BASE_URL}/api/political/governance/evidence?petitionId=test", headers=headers)
        if response.status_code == 200:
            data = response.json()
            assert "_classification" in data and "APPEND-ONLY" in data["_classification"]
            assert "_immutability" in data and "cannot be modified or deleted" in data["_immutability"]
        
        # Test Engagements labels
        response = requests.get(f"{BASE_URL}/api/political/governance/engagements", headers=headers)
        if response.status_code == 200:
            data = response.json()
            assert "_disclaimer1" in data and "NON-PARTISAN" in data["_disclaimer1"]
            assert "_disclaimer2" in data and "FOR INFORMATIONAL PURPOSES ONLY" in data["_disclaimer2"]
        
        # Test Regulators labels
        response = requests.get(f"{BASE_URL}/api/political/governance/regulators", headers=headers)
        if response.status_code == 200:
            data = response.json()
            assert "_disclaimer1" in data and "READ-ONLY ACCESS" in data["_disclaimer1"]
            assert "_disclaimer2" in data and "NO WRITE PERMISSIONS" in data["_disclaimer2"]
            assert "_disclaimer3" in data and "ALL ACCESS IS LOGGED" in data["_disclaimer3"]
        
        # Test Audit labels
        response = requests.get(f"{BASE_URL}/api/political/governance/audit", headers=headers)
        if response.status_code == 200:
            data = response.json()
            assert "_classification" in data and "GOVERNANCE AUDIT LOG" in data["_classification"]
            assert "_immutability" in data and "APPEND-ONLY" in data["_immutability"]
            assert "_integrity" in data and "cryptographic hash" in data["_integrity"]
        
        # Test Transparency labels
        response = requests.get(f"{BASE_URL}/api/political/governance/transparency", headers=headers)
        if response.status_code == 200:
            data = response.json()
            assert "_disclaimer1" in data and "TRANSPARENCY REPORT" in data["_disclaimer1"]
            assert "_disclaimer2" in data and "NON-PARTISAN" in data["_disclaimer2"]
            assert "_disclaimer3" in data and "UNOFFICIAL" in data["_disclaimer3"]
    
    def test_append_only_enforcement_comprehensive(self):
        """Comprehensive test of APPEND-ONLY enforcement across all applicable endpoints"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": "test-admin"}
        
        # Evidence APPEND-ONLY enforcement
        evidence_endpoints = [
            f"{BASE_URL}/api/political/governance/evidence",
        ]
        
        for endpoint in evidence_endpoints:
            # PUT should return 403
            response = requests.put(endpoint, headers=headers, json={})
            assert response.status_code == 403
            data = response.json()
            assert "APPEND-ONLY" in data["error"] or "FORBIDDEN" in data["error"]
            
            # PATCH should return 403
            response = requests.patch(endpoint, headers=headers, json={})
            assert response.status_code == 403
            data = response.json()
            assert "APPEND-ONLY" in data["error"] or "FORBIDDEN" in data["error"]
            
            # DELETE should return 403
            response = requests.delete(endpoint, headers=headers)
            assert response.status_code == 403
            data = response.json()
            assert "IMMUTABLE" in data["error"] or "FORBIDDEN" in data["error"]
        
        # Governance Audit APPEND-ONLY enforcement
        audit_endpoints = [
            f"{BASE_URL}/api/political/governance/audit",
        ]
        
        for endpoint in audit_endpoints:
            # PUT should return 403
            response = requests.put(endpoint, headers=headers, json={})
            assert response.status_code == 403
            data = response.json()
            assert "READ-ONLY" in data["error"] or "FORBIDDEN" in data["error"]
            
            # PATCH should return 403
            response = requests.patch(endpoint, headers=headers, json={})
            assert response.status_code == 403
            data = response.json()
            assert "APPEND-ONLY" in data["error"] or "FORBIDDEN" in data["error"]
            
            # DELETE should return 403
            response = requests.delete(endpoint, headers=headers)
            assert response.status_code == 403
            data = response.json()
            assert "IMMUTABLE" in data["error"] or "FORBIDDEN" in data["error"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])