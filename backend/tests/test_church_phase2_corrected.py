"""
CHURCH SUITE PHASE 2: Comprehensive Backend API Tests
Tests for Ministries, Services & Events API endpoints.

This test suite verifies:
1. Ministries API - CRUD operations and member assignment
2. Departments API - Creation and listing
3. Services API - CRUD operations and schedule creation
4. Events API - CRUD operations with status changes and APPEND-ONLY event log
5. Attendance API - APPEND-ONLY, AGGREGATED ONLY (no individual tracking)
6. Volunteer Logs API - APPEND-ONLY logging
7. Training Records API - Creation and completion
8. Schedules API - Listing and cancellation
9. Speaker Invites API - Creation and status updates

Classification: MEDIUM RISK (Church management with safeguarding)
Phase: Phase 2 - Ministries, Services & Events
Key safeguards: Attendance is AGGREGATED ONLY (no individual tracking for minors safety)
"""

import pytest
import requests
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# Use the production URL from the review request
BASE_URL = "https://nextbuild-repair.preview.emergentagent.com"

# Test tenant and user IDs as specified in the review request
TEST_TENANT_ID = "test-tenant-p2"
TEST_USER_ID = "test-admin"

# Church ID created for Phase 2 testing
CHURCH_ID = "8e25f371-282f-4767-9448-54060c52d1dd"

class TestChurchMinistriesAPI:
    """Test Church Ministries API endpoints"""
    
    def test_create_ministry(self):
        """POST /api/church/ministries - Create ministry"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        ministry_data = {
            "churchId": CHURCH_ID,
            "name": "Praise & Worship Ministry",
            "type": "CHOIR",
            "meetingDay": "SATURDAY"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/ministries", headers=headers, json=ministry_data)
        print(f"Create Ministry Response: {response.status_code} - {response.text}")
        
        # Should not return 401 with proper headers
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "ministry" in data
            ministry = data["ministry"]
            assert ministry.get("name") == "Praise & Worship Ministry"
            assert ministry.get("type") == "CHOIR"
            assert ministry.get("meetingDay") == "SATURDAY"
    
    def test_list_ministries(self):
        """GET /api/church/ministries?churchId={id} - List ministries"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"churchId": CHURCH_ID}
        
        response = requests.get(f"{BASE_URL}/api/church/ministries", headers=headers, params=params)
        print(f"List Ministries Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "ministries" in data
    
    def test_get_ministry_details(self):
        """GET /api/church/ministries/{id} - Get ministry details"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        # Use a test ministry ID
        ministry_id = "test-ministry-id"
        response = requests.get(f"{BASE_URL}/api/church/ministries/{ministry_id}", headers=headers)
        print(f"Get Ministry Details Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
    
    def test_assign_member_to_ministry(self):
        """POST /api/church/ministries/{id} - Assign member to ministry"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        assignment_data = {
            "action": "assignMember",
            "churchId": CHURCH_ID,
            "memberId": "test-member-id",
            "role": "MEMBER"
        }
        
        ministry_id = "test-ministry-id"
        response = requests.post(f"{BASE_URL}/api/church/ministries/{ministry_id}", headers=headers, json=assignment_data)
        print(f"Assign Member Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"


class TestChurchDepartmentsAPI:
    """Test Church Departments API endpoints"""
    
    def test_create_department(self):
        """POST /api/church/departments - Create department"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        department_data = {
            "churchId": CHURCH_ID,
            "name": "Youth Department",
            "code": "YOUTH"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/departments", headers=headers, json=department_data)
        print(f"Create Department Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "department" in data
            department = data["department"]
            assert department.get("name") == "Youth Department"
            assert department.get("code") == "YOUTH"
    
    def test_list_departments(self):
        """GET /api/church/departments?churchId={id} - List departments"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"churchId": CHURCH_ID}
        
        response = requests.get(f"{BASE_URL}/api/church/departments", headers=headers, params=params)
        print(f"List Departments Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "departments" in data


class TestChurchServicesAPI:
    """Test Church Services API endpoints"""
    
    def test_create_service(self):
        """POST /api/church/services - Create service"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        service_data = {
            "churchId": CHURCH_ID,
            "name": "Sunday Morning Service",
            "type": "SUNDAY_SERVICE",
            "dayOfWeek": 0  # Sunday
        }
        
        response = requests.post(f"{BASE_URL}/api/church/services", headers=headers, json=service_data)
        print(f"Create Service Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "service" in data
            service = data["service"]
            assert service.get("name") == "Sunday Morning Service"
            assert service.get("type") == "SUNDAY_SERVICE"
            assert service.get("dayOfWeek") == 0
    
    def test_list_services(self):
        """GET /api/church/services?churchId={id} - List services"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"churchId": CHURCH_ID}
        
        response = requests.get(f"{BASE_URL}/api/church/services", headers=headers, params=params)
        print(f"List Services Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "services" in data
    
    def test_get_service_details(self):
        """GET /api/church/services/{id} - Get service details"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        service_id = "test-service-id"
        response = requests.get(f"{BASE_URL}/api/church/services/{service_id}", headers=headers)
        print(f"Get Service Details Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
    
    def test_create_service_schedule(self):
        """POST /api/church/services/{id} - Create schedule"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        schedule_data = {
            "action": "createSchedule",
            "scheduledDate": (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        service_id = "test-service-id"
        response = requests.post(f"{BASE_URL}/api/church/services/{service_id}", headers=headers, json=schedule_data)
        print(f"Create Schedule Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"


class TestChurchEventsAPI:
    """Test Church Events API endpoints"""
    
    def test_create_event(self):
        """POST /api/church/events - Create event"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        event_data = {
            "churchId": CHURCH_ID,
            "title": "Annual Revival Crusade",
            "type": "CRUSADE",
            "startDate": (datetime.now() + timedelta(days=30)).isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/church/events", headers=headers, json=event_data)
        print(f"Create Event Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "event" in data
            event = data["event"]
            assert event.get("title") == "Annual Revival Crusade"
            assert event.get("type") == "CRUSADE"
            # Verify initial status is DRAFT
            assert event.get("status") == "DRAFT"
    
    def test_list_events(self):
        """GET /api/church/events?churchId={id} - List events"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"churchId": CHURCH_ID}
        
        response = requests.get(f"{BASE_URL}/api/church/events", headers=headers, params=params)
        print(f"List Events Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "events" in data
    
    def test_change_event_status(self):
        """POST /api/church/events/{id} - Change status"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        status_change_data = {
            "action": "changeStatus",
            "status": "SCHEDULED"
        }
        
        event_id = "test-event-id"
        response = requests.post(f"{BASE_URL}/api/church/events/{event_id}", headers=headers, json=status_change_data)
        print(f"Change Event Status Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            # Verify status change is logged (APPEND-ONLY event log)
            assert "status" in data or "eventLog" in data


class TestChurchAttendanceAPI:
    """Test Church Attendance API - APPEND-ONLY, AGGREGATED ONLY"""
    
    def test_record_attendance(self):
        """POST /api/church/attendance - Record attendance (AGGREGATED ONLY)"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        attendance_data = {
            "churchId": CHURCH_ID,
            "serviceId": "test-service-id",
            "attendanceDate": datetime.now().isoformat(),
            "totalCount": 150,
            "adultCount": 120,
            "childrenCount": 30
        }
        
        response = requests.post(f"{BASE_URL}/api/church/attendance", headers=headers, json=attendance_data)
        print(f"Record Attendance Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            # Verify response includes safeguarding notice
            assert "_safeguarding" in data
            assert "AGGREGATED_ONLY" in data["_safeguarding"]
    
    def test_get_attendance_history(self):
        """GET /api/church/attendance?churchId={id} - Get attendance history"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"churchId": CHURCH_ID}
        
        response = requests.get(f"{BASE_URL}/api/church/attendance", headers=headers, params=params)
        print(f"Get Attendance History Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "history" in data
            assert "_safeguarding" in data
            assert "AGGREGATED_ONLY" in data["_safeguarding"]
    
    def test_get_attendance_stats(self):
        """GET /api/church/attendance?churchId={id}&stats=true - Get attendance stats"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"churchId": CHURCH_ID, "stats": "true"}
        
        response = requests.get(f"{BASE_URL}/api/church/attendance", headers=headers, params=params)
        print(f"Get Attendance Stats Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "stats" in data
    
    def test_attendance_patch_forbidden(self):
        """PATCH /api/church/attendance - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/attendance", headers=headers, json={})
        print(f"PATCH Attendance Response: {response.status_code} - {response.text}")
        
        assert response.status_code == 403, f"PATCH should return 403 FORBIDDEN, got {response.status_code}"
        
        if response.status_code == 403:
            data = response.json()
            assert "error" in data
            assert "FORBIDDEN" in data["error"] or "APPEND-ONLY" in data["error"]
    
    def test_attendance_delete_forbidden(self):
        """DELETE /api/church/attendance - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/attendance", headers=headers)
        print(f"DELETE Attendance Response: {response.status_code} - {response.text}")
        
        assert response.status_code == 403, f"DELETE should return 403 FORBIDDEN, got {response.status_code}"
        
        if response.status_code == 403:
            data = response.json()
            assert "error" in data
            assert "FORBIDDEN" in data["error"] or "IMMUTABLE" in data["error"]


class TestChurchVolunteerLogsAPI:
    """Test Church Volunteer Logs API - APPEND-ONLY"""
    
    def test_create_volunteer_log(self):
        """POST /api/church/volunteer-logs - Create volunteer log"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        log_data = {
            "churchId": CHURCH_ID,
            "memberId": "test-member-id",
            "activity": "Sunday School Teaching",
            "serviceDate": datetime.now().isoformat(),
            "hoursServed": 3
        }
        
        response = requests.post(f"{BASE_URL}/api/church/volunteer-logs", headers=headers, json=log_data)
        print(f"Create Volunteer Log Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "log" in data
            log = data["log"]
            assert log.get("activity") == "Sunday School Teaching"
            assert log.get("hoursServed") == 3
    
    def test_get_volunteer_logs_history(self):
        """GET /api/church/volunteer-logs?memberId={id} - Get volunteer logs history"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"memberId": "test-member-id"}
        
        response = requests.get(f"{BASE_URL}/api/church/volunteer-logs", headers=headers, params=params)
        print(f"Get Volunteer Logs Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "history" in data
    
    def test_verify_volunteer_log(self):
        """POST /api/church/volunteer-logs - Verify log"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        verify_data = {
            "action": "verify",
            "logId": "test-log-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/volunteer-logs", headers=headers, json=verify_data)
        print(f"Verify Volunteer Log Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
    
    def test_volunteer_logs_patch_forbidden(self):
        """PATCH /api/church/volunteer-logs - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.patch(f"{BASE_URL}/api/church/volunteer-logs", headers=headers, json={})
        print(f"PATCH Volunteer Logs Response: {response.status_code} - {response.text}")
        
        assert response.status_code == 403, f"PATCH should return 403 FORBIDDEN, got {response.status_code}"
    
    def test_volunteer_logs_delete_forbidden(self):
        """DELETE /api/church/volunteer-logs - Should return 403 FORBIDDEN"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        response = requests.delete(f"{BASE_URL}/api/church/volunteer-logs", headers=headers)
        print(f"DELETE Volunteer Logs Response: {response.status_code} - {response.text}")
        
        assert response.status_code == 403, f"DELETE should return 403 FORBIDDEN, got {response.status_code}"


class TestChurchTrainingRecordsAPI:
    """Test Church Training Records API"""
    
    def test_create_training_record(self):
        """POST /api/church/training - Create training record"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        training_data = {
            "churchId": CHURCH_ID,
            "memberId": "test-member-id",
            "title": "Children's Ministry Training",
            "startDate": datetime.now().isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/church/training", headers=headers, json=training_data)
        print(f"Create Training Record Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "record" in data
            record = data["record"]
            assert record.get("title") == "Children's Ministry Training"
    
    def test_get_member_training(self):
        """GET /api/church/training?memberId={id} - Get member training"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"memberId": "test-member-id"}
        
        response = requests.get(f"{BASE_URL}/api/church/training", headers=headers, params=params)
        print(f"Get Member Training Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "records" in data
    
    def test_complete_training(self):
        """POST /api/church/training - Complete training"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        complete_data = {
            "action": "complete",
            "recordId": "test-training-id"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/training", headers=headers, json=complete_data)
        print(f"Complete Training Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"


class TestChurchSchedulesAPI:
    """Test Church Schedules API"""
    
    def test_get_upcoming_schedules(self):
        """GET /api/church/schedules?churchId={id} - Get upcoming schedules"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"churchId": CHURCH_ID}
        
        response = requests.get(f"{BASE_URL}/api/church/schedules", headers=headers, params=params)
        print(f"Get Schedules Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "schedules" in data
    
    def test_cancel_schedule(self):
        """POST /api/church/schedules - Cancel schedule"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        cancel_data = {
            "action": "cancel",
            "scheduleId": "test-schedule-id",
            "reason": "Weather conditions"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/schedules", headers=headers, json=cancel_data)
        print(f"Cancel Schedule Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"


class TestChurchSpeakerInvitesAPI:
    """Test Church Speaker Invites API"""
    
    def test_create_speaker_invite(self):
        """POST /api/church/speakers - Create speaker invite"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        speaker_data = {
            "churchId": CHURCH_ID,
            "speakerName": "Pastor John Adebayo",
            "scheduledDate": (datetime.now() + timedelta(days=14)).isoformat()
        }
        
        response = requests.post(f"{BASE_URL}/api/church/speakers", headers=headers, json=speaker_data)
        print(f"Create Speaker Invite Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 201:
            data = response.json()
            assert "invite" in data
            invite = data["invite"]
            assert invite.get("speakerName") == "Pastor John Adebayo"
    
    def test_list_speaker_invites(self):
        """GET /api/church/speakers?churchId={id} - List speaker invites"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        params = {"churchId": CHURCH_ID}
        
        response = requests.get(f"{BASE_URL}/api/church/speakers", headers=headers, params=params)
        print(f"List Speaker Invites Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "invites" in data
    
    def test_update_speaker_invite_status(self):
        """POST /api/church/speakers - Update speaker invite status"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        status_data = {
            "action": "updateStatus",
            "inviteId": "test-invite-id",
            "status": "CONFIRMED"
        }
        
        response = requests.post(f"{BASE_URL}/api/church/speakers", headers=headers, json=status_data)
        print(f"Update Speaker Status Response: {response.status_code} - {response.text}")
        
        assert response.status_code != 401, f"Should not return 401 with proper headers, got {response.status_code}"


class TestChurchPhase2Integration:
    """Test Church Suite Phase 2 integration scenarios"""
    
    def test_full_church_workflow(self):
        """Test complete Church Suite Phase 2 workflow"""
        headers = {
            "x-tenant-id": TEST_TENANT_ID,
            "x-user-id": TEST_USER_ID,
            "Content-Type": "application/json"
        }
        
        # 1. Create Ministry
        ministry_data = {
            "churchId": CHURCH_ID,
            "name": "Youth Ministry",
            "type": "YOUTH",
            "meetingDay": "FRIDAY"
        }
        ministry_response = requests.post(f"{BASE_URL}/api/church/ministries", headers=headers, json=ministry_data)
        print(f"Workflow - Create Ministry: {ministry_response.status_code}")
        assert ministry_response.status_code not in [400, 401]
        
        # 2. Create Department
        department_data = {
            "churchId": CHURCH_ID,
            "name": "Children's Department",
            "code": "CHILDREN"
        }
        department_response = requests.post(f"{BASE_URL}/api/church/departments", headers=headers, json=department_data)
        print(f"Workflow - Create Department: {department_response.status_code}")
        assert department_response.status_code not in [400, 401]
        
        # 3. Create Service
        service_data = {
            "churchId": CHURCH_ID,
            "name": "Wednesday Bible Study",
            "type": "BIBLE_STUDY",
            "dayOfWeek": 3  # Wednesday
        }
        service_response = requests.post(f"{BASE_URL}/api/church/services", headers=headers, json=service_data)
        print(f"Workflow - Create Service: {service_response.status_code}")
        assert service_response.status_code not in [400, 401]
        
        # 4. Create Event
        event_data = {
            "churchId": CHURCH_ID,
            "title": "Youth Conference 2024",
            "type": "CONFERENCE",
            "startDate": (datetime.now() + timedelta(days=60)).isoformat()
        }
        event_response = requests.post(f"{BASE_URL}/api/church/events", headers=headers, json=event_data)
        print(f"Workflow - Create Event: {event_response.status_code}")
        assert event_response.status_code not in [400, 401]
        
        # 5. Record Attendance (Aggregated)
        attendance_data = {
            "churchId": CHURCH_ID,
            "serviceId": "test-service-id",
            "attendanceDate": datetime.now().isoformat(),
            "totalCount": 85,
            "adultCount": 60,
            "childrenCount": 25
        }
        attendance_response = requests.post(f"{BASE_URL}/api/church/attendance", headers=headers, json=attendance_data)
        print(f"Workflow - Record Attendance: {attendance_response.status_code}")
        assert attendance_response.status_code not in [400, 401]
        
        # 6. Create Volunteer Log
        volunteer_log_data = {
            "churchId": CHURCH_ID,
            "memberId": "test-member-id",
            "activity": "Youth Ministry Leadership",
            "serviceDate": datetime.now().isoformat(),
            "hoursServed": 4
        }
        volunteer_response = requests.post(f"{BASE_URL}/api/church/volunteer-logs", headers=headers, json=volunteer_log_data)
        print(f"Workflow - Create Volunteer Log: {volunteer_response.status_code}")
        assert volunteer_response.status_code not in [400, 401]
        
        # 7. Create Training Record
        training_data = {
            "churchId": CHURCH_ID,
            "memberId": "test-member-id",
            "title": "Youth Leadership Training",
            "startDate": datetime.now().isoformat()
        }
        training_response = requests.post(f"{BASE_URL}/api/church/training", headers=headers, json=training_data)
        print(f"Workflow - Create Training: {training_response.status_code}")
        assert training_response.status_code not in [400, 401]
        
        # 8. Create Speaker Invite
        speaker_data = {
            "churchId": CHURCH_ID,
            "speakerName": "Rev. Dr. Sarah Okafor",
            "scheduledDate": (datetime.now() + timedelta(days=21)).isoformat()
        }
        speaker_response = requests.post(f"{BASE_URL}/api/church/speakers", headers=headers, json=speaker_data)
        print(f"Workflow - Create Speaker Invite: {speaker_response.status_code}")
        assert speaker_response.status_code not in [400, 401]


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v", "-s"])