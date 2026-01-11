"""
PROJECT MANAGEMENT SUITE — API Tests
Phase 7C.2, S6 Verification

Tests all 6 API endpoints:
- /api/project-management/dashboard
- /api/project-management/projects
- /api/project-management/milestones
- /api/project-management/tasks
- /api/project-management/team
- /api/project-management/budget
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://buildfix-api.preview.emergentagent.com')
TENANT_ID = "demo-pm-tenant"

class TestProjectManagementDashboard:
    """Dashboard API tests"""
    
    def test_dashboard_requires_tenant_id(self):
        """GET /api/project-management/dashboard without x-tenant-id returns 401"""
        response = requests.get(f"{BASE_URL}/api/project-management/dashboard")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        print(f"✅ Dashboard returns 401 without tenant: {data['error']}")
    
    def test_dashboard_with_tenant_id(self):
        """GET /api/project-management/dashboard with x-tenant-id returns stats"""
        response = requests.get(
            f"{BASE_URL}/api/project-management/dashboard",
            headers={"x-tenant-id": TENANT_ID}
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "projects" in data
        assert "tasks" in data
        print(f"✅ Dashboard returns stats: {data['summary']}")


class TestProjectManagementProjects:
    """Projects API tests"""
    
    def test_projects_requires_tenant_id(self):
        """GET /api/project-management/projects without x-tenant-id returns 401"""
        response = requests.get(f"{BASE_URL}/api/project-management/projects")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        print(f"✅ Projects returns 401 without tenant: {data['error']}")
    
    def test_projects_list(self):
        """GET /api/project-management/projects returns project list"""
        response = requests.get(
            f"{BASE_URL}/api/project-management/projects",
            headers={"x-tenant-id": TENANT_ID}
        )
        assert response.status_code == 200
        data = response.json()
        assert "projects" in data or isinstance(data, list)
        print(f"✅ Projects list returned")
    
    def test_projects_stats(self):
        """GET /api/project-management/projects?stats=true returns statistics"""
        response = requests.get(
            f"{BASE_URL}/api/project-management/projects?stats=true",
            headers={"x-tenant-id": TENANT_ID}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Projects stats returned: {data}")


class TestProjectManagementMilestones:
    """Milestones API tests"""
    
    def test_milestones_requires_tenant_id(self):
        """GET /api/project-management/milestones without x-tenant-id returns 401"""
        response = requests.get(f"{BASE_URL}/api/project-management/milestones?projectId=test")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        print(f"✅ Milestones returns 401 without tenant: {data['error']}")
    
    def test_milestones_requires_project_id(self):
        """GET /api/project-management/milestones without projectId returns 400"""
        response = requests.get(
            f"{BASE_URL}/api/project-management/milestones",
            headers={"x-tenant-id": TENANT_ID}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        print(f"✅ Milestones returns 400 without projectId: {data['error']}")


class TestProjectManagementTasks:
    """Tasks API tests"""
    
    def test_tasks_requires_tenant_id(self):
        """GET /api/project-management/tasks without x-tenant-id returns 401"""
        response = requests.get(f"{BASE_URL}/api/project-management/tasks")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        print(f"✅ Tasks returns 401 without tenant: {data['error']}")
    
    def test_tasks_list(self):
        """GET /api/project-management/tasks returns task list"""
        response = requests.get(
            f"{BASE_URL}/api/project-management/tasks",
            headers={"x-tenant-id": TENANT_ID}
        )
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data or isinstance(data, list)
        print(f"✅ Tasks list returned")
    
    def test_tasks_stats(self):
        """GET /api/project-management/tasks?stats=true returns statistics"""
        response = requests.get(
            f"{BASE_URL}/api/project-management/tasks?stats=true",
            headers={"x-tenant-id": TENANT_ID}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Tasks stats returned: {data}")


class TestProjectManagementTeam:
    """Team API tests"""
    
    def test_team_requires_tenant_id(self):
        """GET /api/project-management/team without x-tenant-id returns 401"""
        response = requests.get(f"{BASE_URL}/api/project-management/team?projectId=test")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        print(f"✅ Team returns 401 without tenant: {data['error']}")
    
    def test_team_requires_project_or_member_id(self):
        """GET /api/project-management/team without projectId or memberId returns 400"""
        response = requests.get(
            f"{BASE_URL}/api/project-management/team",
            headers={"x-tenant-id": TENANT_ID}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        print(f"✅ Team returns 400 without projectId/memberId: {data['error']}")


class TestProjectManagementBudget:
    """Budget API tests"""
    
    def test_budget_requires_tenant_id(self):
        """GET /api/project-management/budget without x-tenant-id returns 401"""
        response = requests.get(f"{BASE_URL}/api/project-management/budget?projectId=test")
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        print(f"✅ Budget returns 401 without tenant: {data['error']}")
    
    def test_budget_requires_project_id(self):
        """GET /api/project-management/budget without projectId returns 400"""
        response = requests.get(
            f"{BASE_URL}/api/project-management/budget",
            headers={"x-tenant-id": TENANT_ID}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        print(f"✅ Budget returns 400 without projectId: {data['error']}")
    
    def test_budget_stats(self):
        """GET /api/project-management/budget?stats=true returns overall stats"""
        response = requests.get(
            f"{BASE_URL}/api/project-management/budget?stats=true",
            headers={"x-tenant-id": TENANT_ID}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Budget stats returned: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
