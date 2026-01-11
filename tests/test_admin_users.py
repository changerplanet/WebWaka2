"""
Admin Users API Tests
=====================
Tests for Global User Management feature (Super Admin only)

Features tested:
- GET /api/admin/users - List all users with filtering and pagination
- GET /api/admin/users/[userId] - Get user details including sessions, memberships
- PATCH /api/admin/users/[userId] - Change user role (promote/demote)
- Security: Only SUPER_ADMIN can access
- Security: Cannot demote yourself
"""

import pytest
import requests

# Base URL from environment
BASE_URL = "https://buildfix-api.preview.emergentagent.com"

# Test credentials - Super Admin
SUPER_ADMIN_SESSION = "ddaec89b-cb0c-4a8b-ab73-498b877c0aba-e1a18773-6bcf-40b4-9a04-db0608f9adb3"
SUPER_ADMIN_ID = "58cf3be1-878e-4813-9854-e9a98d8546d2"

# Test user IDs
TEST_USER_ID = "77a5f438-46fa-4b76-8faf-0032eb3fd0d5"  # test2@example.com
USER_WITH_TENANT_ID = "2c663a01-f612-4e9f-afa3-a2b542156395"  # admin@acme.com
INVALID_USER_ID = "00000000-0000-0000-0000-000000000000"
INVALID_SESSION = "invalid-token-12345"


class TestListUsers:
    """Tests for GET /api/admin/users"""
    
    def test_list_users_success(self):
        """Test listing all users with valid authentication"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            cookies={"session_token": SUPER_ADMIN_SESSION}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] is True
        assert "users" in data
        assert "total" in data
        assert "limit" in data
        assert "offset" in data
        assert "stats" in data
        
        # Verify stats structure
        stats = data["stats"]
        assert "totalUsers" in stats
        assert "superAdmins" in stats
        assert "usersWithTenants" in stats
        assert "usersWithPartners" in stats
        
        # Verify user structure
        if data["users"]:
            user = data["users"][0]
            assert "id" in user
            assert "email" in user
            assert "globalRole" in user
            assert "memberships" in user
            assert "activeSessions" in user
        
        print(f"✓ List users returned {len(data['users'])} users, total: {data['total']}")
        print(f"  Stats: {stats}")
    
    def test_list_users_filter_by_role(self):
        """Test filtering users by role"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?role=SUPER_ADMIN",
            cookies={"session_token": SUPER_ADMIN_SESSION}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned users should be SUPER_ADMIN
        for user in data["users"]:
            assert user["globalRole"] == "SUPER_ADMIN"
        
        print(f"✓ Role filter works - returned {len(data['users'])} SUPER_ADMIN users")
    
    def test_list_users_search(self):
        """Test searching users by email/name"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?search=acme",
            cookies={"session_token": SUPER_ADMIN_SESSION}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should find admin@acme.com
        assert data["total"] >= 1
        found = any("acme" in user["email"].lower() for user in data["users"])
        assert found, "Search should find user with 'acme' in email"
        
        print(f"✓ Search filter works - found {data['total']} users matching 'acme'")
    
    def test_list_users_pagination(self):
        """Test pagination parameters"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users?limit=2&offset=0",
            cookies={"session_token": SUPER_ADMIN_SESSION}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["limit"] == 2
        assert data["offset"] == 0
        assert len(data["users"]) <= 2
        
        print(f"✓ Pagination works - limit={data['limit']}, offset={data['offset']}")
    
    def test_list_users_requires_auth(self):
        """Test that listing users requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        
        assert response.status_code == 401
        data = response.json()
        assert data["success"] is False
        assert "Authentication required" in data["error"]
        
        print("✓ List users correctly requires authentication")
    
    def test_list_users_invalid_session(self):
        """Test that invalid session is rejected"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            cookies={"session_token": INVALID_SESSION}
        )
        
        assert response.status_code == 401
        print("✓ Invalid session correctly rejected")


class TestGetUserDetail:
    """Tests for GET /api/admin/users/[userId]"""
    
    def test_get_user_detail_success(self):
        """Test getting user details with valid authentication"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/{USER_WITH_TENANT_ID}",
            cookies={"session_token": SUPER_ADMIN_SESSION}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] is True
        assert "user" in data
        
        user = data["user"]
        assert user["id"] == USER_WITH_TENANT_ID
        assert "email" in user
        assert "globalRole" in user
        assert "memberships" in user
        assert "partnerMembership" in user
        assert "recentSessions" in user
        assert "totalSessions" in user
        
        print(f"✓ User detail returned for {user['email']}")
        print(f"  Memberships: {len(user['memberships'])}, Sessions: {user['totalSessions']}")
    
    def test_get_user_detail_with_memberships(self):
        """Test user detail includes tenant and partner memberships"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/{USER_WITH_TENANT_ID}",
            cookies={"session_token": SUPER_ADMIN_SESSION}
        )
        
        assert response.status_code == 200
        data = response.json()
        user = data["user"]
        
        # This user should have tenant membership
        assert len(user["memberships"]) > 0
        membership = user["memberships"][0]
        assert "tenantId" in membership
        assert "tenantName" in membership
        assert "role" in membership
        
        # This user should have partner membership
        assert user["partnerMembership"] is not None
        assert "partnerId" in user["partnerMembership"]
        assert "partnerName" in user["partnerMembership"]
        
        print(f"✓ User memberships verified - tenant: {membership['tenantName']}, partner: {user['partnerMembership']['partnerName']}")
    
    def test_get_user_detail_not_found(self):
        """Test getting non-existent user returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/{INVALID_USER_ID}",
            cookies={"session_token": SUPER_ADMIN_SESSION}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert "not found" in data["error"].lower()
        
        print("✓ Non-existent user correctly returns 404")
    
    def test_get_user_detail_requires_auth(self):
        """Test that getting user detail requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/users/{USER_WITH_TENANT_ID}")
        
        assert response.status_code == 401
        print("✓ Get user detail correctly requires authentication")


class TestUpdateUserRole:
    """Tests for PATCH /api/admin/users/[userId]"""
    
    def test_promote_user_to_super_admin(self):
        """Test promoting a user to SUPER_ADMIN"""
        response = requests.patch(
            f"{BASE_URL}/api/admin/users/{TEST_USER_ID}",
            cookies={"session_token": SUPER_ADMIN_SESSION},
            json={"globalRole": "SUPER_ADMIN"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] is True
        assert data["user"]["globalRole"] == "SUPER_ADMIN"
        assert "SUPER_ADMIN" in data["message"]
        
        print(f"✓ User promoted to SUPER_ADMIN: {data['user']['email']}")
    
    def test_demote_user_to_user(self):
        """Test demoting a user back to USER"""
        response = requests.patch(
            f"{BASE_URL}/api/admin/users/{TEST_USER_ID}",
            cookies={"session_token": SUPER_ADMIN_SESSION},
            json={"globalRole": "USER"}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["user"]["globalRole"] == "USER"
        
        print(f"✓ User demoted to USER: {data['user']['email']}")
    
    def test_cannot_demote_yourself(self):
        """Test that super admin cannot demote themselves"""
        response = requests.patch(
            f"{BASE_URL}/api/admin/users/{SUPER_ADMIN_ID}",
            cookies={"session_token": SUPER_ADMIN_SESSION},
            json={"globalRole": "USER"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "Cannot demote yourself" in data["error"]
        
        print("✓ Self-demotion correctly prevented")
    
    def test_invalid_role_rejected(self):
        """Test that invalid role is rejected"""
        response = requests.patch(
            f"{BASE_URL}/api/admin/users/{TEST_USER_ID}",
            cookies={"session_token": SUPER_ADMIN_SESSION},
            json={"globalRole": "INVALID_ROLE"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "Invalid role" in data["error"]
        
        print("✓ Invalid role correctly rejected")
    
    def test_update_nonexistent_user(self):
        """Test updating non-existent user returns 404"""
        response = requests.patch(
            f"{BASE_URL}/api/admin/users/{INVALID_USER_ID}",
            cookies={"session_token": SUPER_ADMIN_SESSION},
            json={"globalRole": "SUPER_ADMIN"}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert "not found" in data["error"].lower()
        
        print("✓ Non-existent user correctly returns 404")
    
    def test_update_requires_auth(self):
        """Test that updating user requires authentication"""
        response = requests.patch(
            f"{BASE_URL}/api/admin/users/{TEST_USER_ID}",
            json={"globalRole": "SUPER_ADMIN"}
        )
        
        assert response.status_code == 401
        print("✓ Update user correctly requires authentication")


class TestSecurityEdgeCases:
    """Additional security tests"""
    
    def test_wrong_cookie_name_rejected(self):
        """Test that using wrong cookie name is rejected"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users",
            cookies={"session": SUPER_ADMIN_SESSION}  # Wrong cookie name
        )
        
        assert response.status_code == 401
        print("✓ Wrong cookie name correctly rejected")
    
    def test_malformed_user_id(self):
        """Test malformed user ID handling"""
        response = requests.get(
            f"{BASE_URL}/api/admin/users/not-a-uuid",
            cookies={"session_token": SUPER_ADMIN_SESSION}
        )
        
        # Should return 400 (bad request) or 404 (not found)
        assert response.status_code in [400, 404], f"Expected 400/404, got {response.status_code}"
        print("✓ Malformed user ID handled correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
