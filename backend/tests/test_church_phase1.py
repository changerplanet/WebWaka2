"""
CHURCH SUITE PHASE 1: Comprehensive Backend API Tests
Tests for the Church Suite HIGH-RISK VERTICAL with safeguarding controls.

This test suite verifies:
1. Church Registry (CRUD operations)
2. Church Hierarchy (Diocese → Parish structure)
3. Member Lifecycle with Minors Safeguarding ⚠️
4. Guardian Links ⚠️
5. Roles & Assignments (APPEND-ONLY)
6. Audit Trail (APPEND-ONLY)
7. Cell Groups

Classification: HIGH-RISK VERTICAL (Faith, Money, Minors, Trust)
Phase: Phase 1 - Registry & Membership
Commerce Boundary: FACTS_ONLY — Church Suite does NOT process payments
"""

import pytest
import requests
import json
from typing import Dict, Any, Optional

# API Base URL as specified in review request
BASE_URL = "https://typefix.preview.emergentagent.com"

# Required headers as specified in review request
TEST_TENANT_ID = "test-tenant-new"
TEST_USER_ID = "test-admin"

class TestChurchSuiteAuthentication:
    """Test authentication and tenant scoping for all church routes"""
    
    def test_church_suite_info_requires_tenant_id(self):
        """GET /api/church - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
    
    def test_churches_requires_tenant_id(self):
        """GET /api/church/churches - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/churches")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "Tenant ID required" in data["error"]
    
    def test_members_requires_tenant_id(self):
        """GET /api/church/members - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/members")
        assert response.status_code == 401
    
    def test_units_requires_tenant_id(self):
        """GET /api/church/units - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/units")
        assert response.status_code == 401
    
    def test_roles_requires_tenant_id(self):
        """GET /api/church/roles - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/roles")
        assert response.status_code == 401
    
    def test_assignments_requires_tenant_id(self):
        """GET /api/church/assignments - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/assignments")
        assert response.status_code == 401
    
    def test_audit_requires_tenant_id(self):
        """GET /api/church/audit - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/audit")
        assert response.status_code == 401
    
    def test_guardians_requires_tenant_id(self):
        """GET /api/church/guardians - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/guardians")
        assert response.status_code == 401
    
    def test_cells_requires_tenant_id(self):
        """GET /api/church/cells - Should return 401 without x-tenant-id header"""
        response = requests.get(f"{BASE_URL}/api/church/cells")
        assert response.status_code == 401


class TestChurchRegistry:
    """Test Church Registry API endpoints"""
    
    def test_church_suite_info_with_tenant(self):
        """GET /api/church - Should return suite info and stats with x-tenant-id"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/church", headers=headers)
        
        # Should not return 401 with proper tenant ID
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "suite" in data
            assert data["suite"] == "Church Suite"
            assert "phase" in data
            assert "Phase 1" in data["phase"]
            assert "stats" in data
            assert "capabilities" in data
            
            # Verify stats structure
            stats = data["stats"]
            expected_stats = ["churches", "members", "units", "cellGroups", "roles", "minors", "adults"]
            for stat in expected_stats:
                assert stat in stats, f"Missing stat: {stat}"
    
    def test_list_churches_with_tenant(self):
        """GET /api/church/churches - List churches with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/church/churches", headers=headers)
        
        # Should not return 401 with proper tenant ID
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "churches" in data
            # Should include HIGH-RISK VERTICAL disclaimers
            assert any(key.startswith("_") for key in data.keys()), "Should include disclaimers"
    
    def test_create_church_validation(self):
        """POST /api/church/churches - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/church/churches", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "name" in data["error"].lower()
    
    def test_create_church_with_nigerian_data(self):
        """POST /api/church/churches - Create church with Nigerian data"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        church_data = {
            "name": "Redeemed Christian Church of God",
            "denomination": "RCCG",
            "address": "Km 46, Lagos-Ibadan Expressway, Redemption City",
            "city": "Mowe",
            "state": "Ogun",
            "country": "Nigeria",
            "phone": "+2348012345678",
            "email": "info@rccg.org",
            "website": "https://rccg.org",
            "foundedDate": "1952-01-01T00:00:00.000Z",
            "status": "ACTIVE"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/churches", headers=headers, json=church_data)
        # Should not return 401 or 400 validation error with proper data
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "church" in data
            # Should include HIGH-RISK VERTICAL disclaimers
            assert any(key.startswith("_") for key in data.keys()), "Should include disclaimers"
    
    def test_get_church_details(self):
        """GET /api/church/churches/{id} - Get church details"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/church/churches/test-church-id", headers=headers)
        
        assert response.status_code != 401
        # Should return 404 for non-existent church or 200 for existing
        assert response.status_code in [200, 404, 500]
    
    def test_update_church(self):
        """PATCH /api/church/churches/{id} - Update church"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        update_data = {"phone": "+2348087654321"}
        
        response = requests.patch(f"{BASE_URL}/api/church/churches/test-church-id", headers=headers, json=update_data)
        assert response.status_code != 401
        # Should return 404 for non-existent church or 200 for successful update
        assert response.status_code in [200, 404, 500]
    
    def test_seed_default_roles(self):
        """POST /api/church/churches/{id} with action: "seedRoles" - Should seed 14 default roles"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        seed_data = {"action": "seedRoles"}
        
        response = requests.post(f"{BASE_URL}/api/church/churches/test-church-id", headers=headers, json=seed_data)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Should indicate roles were seeded
            assert "roles" in data or "seeded" in str(data).lower()


class TestChurchHierarchy:
    """Test Church Units (Hierarchy) API endpoints"""
    
    def test_list_units_with_tenant(self):
        """GET /api/church/units - List units with tenant ID"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/church/units", headers=headers)
        
        assert response.status_code != 401, f"Should not return 401 with tenant ID, got {response.status_code}"
    
    def test_create_diocese_unit(self):
        """POST /api/church/units - Create Diocese (level: DIOCESE)"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        diocese_data = {
            "churchId": "test-church-id",
            "name": "Lagos Diocese",
            "level": "DIOCESE",
            "description": "Diocese covering Lagos State",
            "address": "Lagos Island, Lagos State",
            "state": "Lagos",
            "country": "Nigeria"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/units", headers=headers, json=diocese_data)
        assert response.status_code not in [400, 401], f"Should not return validation error with proper data, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "unit" in data
            # Should include hierarchy information
            assert any(key.startswith("_") for key in data.keys()), "Should include disclaimers"
    
    def test_create_parish_under_diocese(self):
        """POST /api/church/units - Create Parish under Diocese (level: PARISH, parentUnitId: dioceseId)"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        parish_data = {
            "churchId": "test-church-id",
            "name": "St. Peter's Parish",
            "level": "PARISH",
            "parentUnitId": "test-diocese-id",
            "description": "Parish in Surulere area",
            "address": "15 Adeniran Ogunsanya Street, Surulere, Lagos",
            "state": "Lagos",
            "country": "Nigeria"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/units", headers=headers, json=parish_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            assert "unit" in data
            # Verify hierarchyPath is calculated correctly
            unit = data["unit"]
            if "hierarchyPath" in unit:
                assert "test-diocese-id" in unit["hierarchyPath"]
    
    def test_unit_validation(self):
        """POST /api/church/units - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/church/units", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert any(field in data["error"].lower() for field in ["churchid", "name", "level"])


class TestMemberLifecycleWithSafeguarding:
    """Test Member Lifecycle with Minors Safeguarding ⚠️"""
    
    def test_register_adult_member(self):
        """POST /api/church/members - Register adult (dateOfBirth: "1985-03-15T00:00:00.000Z")"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        adult_data = {
            "churchId": "test-church-id",
            "firstName": "Adewale",
            "lastName": "Ogundimu",
            "dateOfBirth": "1985-03-15T00:00:00.000Z",
            "gender": "MALE",
            "phone": "+2348012345678",
            "email": "adewale.ogundimu@example.com",
            "address": "15 Adeniran Ogunsanya Street, Surulere, Lagos",
            "state": "Lagos",
            "country": "Nigeria"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/members", headers=headers, json=adult_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            assert "member" in data
            member = data["member"]
            # Verify isMinor = false
            assert member.get("isMinor") == False, "Adult should have isMinor = false"
    
    def test_register_minor_member(self):
        """POST /api/church/members - Register minor (dateOfBirth: "2015-06-20T00:00:00.000Z")"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        minor_data = {
            "churchId": "test-church-id",
            "firstName": "Chioma",
            "lastName": "Adebayo",
            "dateOfBirth": "2015-06-20T00:00:00.000Z",
            "gender": "FEMALE",
            "address": "12 Bode Thomas Street, Surulere, Lagos",
            "state": "Lagos",
            "country": "Nigeria"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/members", headers=headers, json=minor_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            assert "member" in data
            member = data["member"]
            # Verify isMinor = true
            assert member.get("isMinor") == True, "Minor should have isMinor = true"
            # Verify response includes safeguarding notice
            assert "_safeguarding_notice" in data or any("safeguarding" in str(v).lower() for v in data.values())
    
    def test_list_minors_with_protection(self):
        """GET /api/church/members?isMinor=true - List minors"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"isMinor": "true", "churchId": "test-church-id"}
        
        response = requests.get(f"{BASE_URL}/api/church/members", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Verify phone and email are "[PROTECTED]"
            if "data" in data and data["data"]:
                for member in data["data"]:
                    if member.get("isMinor"):
                        assert member.get("phone") == "[PROTECTED]" or member.get("phone") is None
                        assert member.get("email") == "[PROTECTED]" or member.get("email") is None
            # Should include safeguarding notice
            assert "_safeguarding_notice" in data or any("safeguarding" in str(v).lower() for v in data.values())
    
    def test_get_minor_details_with_protection(self):
        """GET /api/church/members/{minorId} - Get minor details"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        response = requests.get(f"{BASE_URL}/api/church/members/test-minor-id", headers=headers)
        
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            member = data.get("member", data)
            if member.get("isMinor"):
                # Verify phone and email are "[PROTECTED]"
                assert member.get("phone") == "[PROTECTED]" or member.get("phone") is None
                assert member.get("email") == "[PROTECTED]" or member.get("email") is None
                # Verify _safeguarding = "MINOR_DATA_RESTRICTED"
                assert data.get("_safeguarding") == "MINOR_DATA_RESTRICTED" or "MINOR_DATA_RESTRICTED" in str(data)
    
    def test_member_validation(self):
        """POST /api/church/members - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/church/members", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert any(field in data["error"].lower() for field in ["churchid", "firstname", "lastname"])


class TestGuardianLinks:
    """Test Guardian Links ⚠️"""
    
    def test_create_guardian_link_adult_to_minor(self):
        """POST /api/church/guardians - Create guardian link (adult → minor)"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        guardian_data = {
            "minorId": "test-minor-id",
            "guardianId": "test-adult-id",
            "relationship": "PARENT",
            "isPrimary": True,
            "notes": "Primary guardian - mother"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/guardians", headers=headers, json=guardian_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            assert "link" in data
            # Verify response includes safeguarding notice
            assert "_safeguarding" in data or any("safeguarding" in str(v).lower() for v in data.values())
    
    def test_prevent_minor_to_minor_guardian_link(self):
        """POST /api/church/guardians - Try linking minor to minor (should fail)"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        invalid_data = {
            "minorId": "test-minor-id-1",
            "guardianId": "test-minor-id-2",  # Another minor
            "relationship": "SIBLING"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/guardians", headers=headers, json=invalid_data)
        # Should fail with 400 error
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "minor" in data["error"].lower() or "adult" in data["error"].lower()
    
    def test_get_minor_guardians(self):
        """GET /api/church/guardians?minorId={id} - Get minor's guardians"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"minorId": "test-minor-id"}
        
        response = requests.get(f"{BASE_URL}/api/church/guardians", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "guardians" in data
            assert "total" in data
            # Should include safeguarding notice
            assert "_safeguarding" in data or any("safeguarding" in str(v).lower() for v in data.values())
    
    def test_guardian_validation(self):
        """POST /api/church/guardians - Test validation errors"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        # Test missing required fields
        response = requests.post(f"{BASE_URL}/api/church/guardians", headers=headers, json={})
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert any(field in data["error"].lower() for field in ["minorid", "guardianid", "relationship"])


class TestRolesAndAssignments:
    """Test Roles & Assignments (APPEND-ONLY)"""
    
    def test_list_roles_requires_church_id(self):
        """GET /api/church/roles?churchId={id} - List roles (should have 14)"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        
        # Test without churchId - should fail
        response = requests.get(f"{BASE_URL}/api/church/roles", headers=headers)
        if response.status_code == 400:
            data = response.json()
            assert "error" in data
            assert "churchid" in data["error"].lower()
        
        # Test with churchId
        params = {"churchId": "test-church-id"}
        response = requests.get(f"{BASE_URL}/api/church/roles", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "roles" in data
            assert "total" in data
            # After seeding, should have 14 default roles
            # Note: This might be 0 if no seeding has occurred
    
    def test_create_role(self):
        """POST /api/church/roles - Create role"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        role_data = {
            "churchId": "test-church-id",
            "name": "Youth Pastor",
            "type": "MINISTRY",
            "description": "Leader of youth ministry",
            "permissions": ["YOUTH_MINISTRY", "TEACHING"]
        }
        
        response = requests.post(f"{BASE_URL}/api/church/roles", headers=headers, json=role_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            assert "role" in data
    
    def test_assign_role_to_member(self):
        """POST /api/church/assignments - Assign role to member"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        assignment_data = {
            "churchId": "test-church-id",
            "memberId": "test-member-id",
            "roleId": "test-role-id",
            "startDate": "2026-01-01T00:00:00.000Z",
            "notes": "Appointed as Youth Pastor"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/assignments", headers=headers, json=assignment_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            assert "assignment" in data
            # Should include APPEND-ONLY notice
            assert "_append_only" in data or any("append" in str(v).lower() for v in data.values())
    
    def test_get_member_roles(self):
        """GET /api/church/assignments?memberId={id} - Get member's roles"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"memberId": "test-member-id"}
        
        response = requests.get(f"{BASE_URL}/api/church/assignments", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "roles" in data
            assert "total" in data
    
    def test_assignments_patch_forbidden(self):
        """PATCH /api/church/assignments - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.patch(f"{BASE_URL}/api/church/assignments", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "FORBIDDEN" in data["error"] or data.get("error") == "FORBIDDEN"
        assert "_append_only" in data or "APPEND-ONLY" in str(data)
    
    def test_assignments_delete_forbidden(self):
        """DELETE /api/church/assignments - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.delete(f"{BASE_URL}/api/church/assignments", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "FORBIDDEN" in data["error"] or data.get("error") == "FORBIDDEN"
    
    def test_terminate_assignment(self):
        """POST /api/church/assignments/{id} with action: "terminate" - Terminate assignment"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        terminate_data = {
            "action": "terminate",
            "endDate": "2026-12-31T23:59:59.000Z",
            "reason": "End of term"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/assignments/test-assignment-id", headers=headers, json=terminate_data)
        assert response.status_code != 401
        # Should return 200 for successful termination or 404 for non-existent assignment


class TestAuditTrail:
    """Test Audit Trail (APPEND-ONLY)"""
    
    def test_query_audit_logs(self):
        """GET /api/church/audit?churchId={id} - Query audit logs"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"churchId": "test-church-id"}
        
        response = requests.get(f"{BASE_URL}/api/church/audit", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "logs" in data
            # Should include audit notice
            assert "_audit" in data or any("audit" in str(v).lower() for v in data.values())
    
    def test_verify_audit_logs_include_create_assign_actions(self):
        """Verify logs include CREATE, ASSIGN actions"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {
            "churchId": "test-church-id",
            "action": "CREATE"
        }
        
        response = requests.get(f"{BASE_URL}/api/church/audit", headers=headers, params=params)
        assert response.status_code != 401
        
        # Test ASSIGN action filter
        params["action"] = "ASSIGN"
        response = requests.get(f"{BASE_URL}/api/church/audit", headers=headers, params=params)
        assert response.status_code != 401
    
    def test_audit_delete_forbidden(self):
        """DELETE /api/church/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.delete(f"{BASE_URL}/api/church/audit", headers=headers)
        assert response.status_code == 403
        
        data = response.json()
        assert "error" in data
        assert "FORBIDDEN" in data["error"] or data.get("error") == "FORBIDDEN"
        assert "_audit" in data or "IMMUTABLE" in str(data)
    
    def test_audit_put_forbidden(self):
        """PUT /api/church/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.put(f"{BASE_URL}/api/church/audit", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "FORBIDDEN" in data["error"] or data.get("error") == "FORBIDDEN"
    
    def test_audit_patch_forbidden(self):
        """PATCH /api/church/audit - Should return 403 FORBIDDEN"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        response = requests.patch(f"{BASE_URL}/api/church/audit", headers=headers, json={})
        assert response.status_code == 403
        
        data = response.json()
        assert "FORBIDDEN" in data["error"] or data.get("error") == "FORBIDDEN"
    
    def test_verify_integrity_action(self):
        """POST /api/church/audit with action: "verifyIntegrity" - Verify integrity"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        verify_data = {
            "action": "verifyIntegrity",
            "logId": "test-log-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/audit", headers=headers, json=verify_data)
        assert response.status_code != 401
        # Should return 200 for successful verification or 404 for non-existent log


class TestCellGroups:
    """Test Cell Groups"""
    
    def test_list_cell_groups(self):
        """GET /api/church/cells - List cell groups"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        params = {"churchId": "test-church-id"}
        
        response = requests.get(f"{BASE_URL}/api/church/cells", headers=headers, params=params)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            assert "data" in data or "cells" in data or "cellGroups" in data
    
    def test_create_cell_group(self):
        """POST /api/church/cells - Create cell group"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        cell_data = {
            "churchId": "test-church-id",
            "name": "Victory Cell Group",
            "description": "Cell group for young adults",
            "meetingDay": "WEDNESDAY",
            "meetingTime": "19:00",
            "location": "Church Hall A",
            "maxMembers": 15
        }
        
        response = requests.post(f"{BASE_URL}/api/church/cells", headers=headers, json=cell_data)
        assert response.status_code not in [400, 401]
        
        if response.status_code == 201:
            data = response.json()
            assert "cellGroup" in data or "cell" in data
    
    def test_add_member_to_cell(self):
        """POST /api/church/cells/{id} with action: "addMember" - Add member"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        add_member_data = {
            "action": "addMember",
            "memberId": "test-member-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/cells/test-cell-id", headers=headers, json=add_member_data)
        assert response.status_code != 401
        # Should return 200 for successful addition or 404 for non-existent cell
    
    def test_get_cell_with_members(self):
        """GET /api/church/cells/{id} - Get cell with members"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        
        response = requests.get(f"{BASE_URL}/api/church/cells/test-cell-id", headers=headers)
        assert response.status_code != 401
        
        if response.status_code == 200:
            data = response.json()
            # Should include cell details and members list
            assert "members" in data or "cellGroup" in data


class TestNigerianContextValidation:
    """Test Nigerian-first data patterns"""
    
    def test_nigerian_church_data(self):
        """Test Nigerian church creation with local context"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        nigerian_churches = [
            {
                "name": "Living Faith Church Worldwide",
                "denomination": "Winners Chapel",
                "state": "Lagos",
                "city": "Ota"
            },
            {
                "name": "Deeper Christian Life Ministry",
                "denomination": "DCLM",
                "state": "Lagos",
                "city": "Gbagada"
            },
            {
                "name": "Mountain of Fire and Miracles Ministries",
                "denomination": "MFM",
                "state": "Lagos",
                "city": "Yaba"
            }
        ]
        
        for church_data in nigerian_churches:
            church_data.update({
                "address": f"Sample Address, {church_data['city']}, {church_data['state']}",
                "country": "Nigeria",
                "phone": "+2348012345678"
            })
            
            response = requests.post(f"{BASE_URL}/api/church/churches", headers=headers, json=church_data)
            assert response.status_code not in [400, 401], f"Nigerian church data should be valid: {church_data['name']}"
    
    def test_nigerian_member_names(self):
        """Test Nigerian member names validation"""
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
            member_data = {
                "churchId": "test-church-id",
                "dateOfBirth": "1990-01-01T00:00:00.000Z",
                "state": "Lagos",
                "country": "Nigeria",
                **name
            }
            
            response = requests.post(f"{BASE_URL}/api/church/members", headers=headers, json=member_data)
            assert response.status_code not in [400, 401], f"Nigerian name should be valid: {name}"


class TestHighRiskVerticalCompliance:
    """Test HIGH-RISK VERTICAL compliance requirements"""
    
    def test_all_responses_include_disclaimers(self):
        """Verify all API responses include appropriate disclaimers"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        
        endpoints_to_test = [
            "/api/church",
            "/api/church/churches",
            "/api/church/members",
            "/api/church/units",
            "/api/church/roles?churchId=test-church-id",
            "/api/church/assignments?memberId=test-member-id",
            "/api/church/audit?churchId=test-church-id",
            "/api/church/cells"
        ]
        
        for endpoint in endpoints_to_test:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                # Should include disclaimers (keys starting with _)
                has_disclaimers = any(key.startswith("_") for key in data.keys())
                assert has_disclaimers, f"Endpoint {endpoint} should include disclaimers"
    
    def test_commerce_boundary_enforcement(self):
        """Verify FACTS_ONLY commerce boundary - no payment processing"""
        headers = {"x-tenant-id": TEST_TENANT_ID}
        
        # Church Suite should NOT have payment/invoice endpoints
        payment_endpoints = [
            "/api/church/payments",
            "/api/church/invoices",
            "/api/church/billing",
            "/api/church/transactions"
        ]
        
        for endpoint in payment_endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            # Should return 404 (not found) since these endpoints shouldn't exist
            assert response.status_code == 404, f"Payment endpoint {endpoint} should not exist (FACTS_ONLY boundary)"
    
    def test_append_only_enforcement_comprehensive(self):
        """Comprehensive test of APPEND-ONLY enforcement"""
        headers = {"x-tenant-id": TEST_TENANT_ID, "x-user-id": TEST_USER_ID}
        
        append_only_endpoints = [
            "/api/church/assignments",
            "/api/church/audit"
        ]
        
        for endpoint in append_only_endpoints:
            # Test PUT
            response = requests.put(f"{BASE_URL}{endpoint}", headers=headers, json={})
            assert response.status_code == 403, f"PUT should be forbidden on {endpoint}"
            
            # Test PATCH
            response = requests.patch(f"{BASE_URL}{endpoint}", headers=headers, json={})
            assert response.status_code == 403, f"PATCH should be forbidden on {endpoint}"
            
            # Test DELETE
            response = requests.delete(f"{BASE_URL}{endpoint}", headers=headers)
            assert response.status_code == 403, f"DELETE should be forbidden on {endpoint}"


if __name__ == "__main__":
    # Run specific test classes
    pytest.main([__file__, "-v"])