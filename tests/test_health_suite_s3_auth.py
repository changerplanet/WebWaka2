"""
Health Suite S3 API Layer - Authentication Tests

Tests that all Health API endpoints return 401 Unauthorized when called without authentication.
This verifies the capability-guarded endpoints are properly protected.

Endpoints tested:
- /api/health - Main config endpoint
- /api/health/patients - Patients CRUD
- /api/health/guardians - Patient guardians CRUD
- /api/health/providers - Healthcare providers CRUD
- /api/health/facilities - Facilities CRUD
- /api/health/appointments - Appointments CRUD
- /api/health/visits - Visits CRUD
- /api/health/encounters - Clinical encounters (append-only)
- /api/health/prescriptions - Prescriptions CRUD
- /api/health/lab-orders - Lab orders and results
- /api/health/billing-facts - Billing facts (commerce boundary)

@module tests/test_health_suite_s3_auth
@phase S3
@standard Platform Standardisation v2
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://prisma-next-fix.preview.emergentagent.com')


class TestHealthMainEndpoint:
    """Tests for /api/health main endpoint"""
    
    def test_health_get_returns_401_unauthenticated(self):
        """GET /api/health should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_health_post_returns_401_unauthenticated(self):
        """POST /api/health should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health", json={"action": "initialize"})
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestPatientsEndpoint:
    """Tests for /api/health/patients endpoint"""
    
    def test_patients_get_returns_401_unauthenticated(self):
        """GET /api/health/patients should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/patients")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_patients_post_returns_401_unauthenticated(self):
        """POST /api/health/patients should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/patients", json={
            "firstName": "Test",
            "lastName": "Patient"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_patients_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/patients should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/patients", json={
            "id": "test-id",
            "firstName": "Updated"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestGuardiansEndpoint:
    """Tests for /api/health/guardians endpoint (newly created)"""
    
    def test_guardians_get_returns_401_unauthenticated(self):
        """GET /api/health/guardians should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/guardians")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_guardians_post_returns_401_unauthenticated(self):
        """POST /api/health/guardians should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/guardians", json={
            "patientId": "test-patient",
            "fullName": "Test Guardian",
            "relationship": "Parent",
            "phone": "1234567890"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_guardians_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/guardians should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/guardians", json={
            "id": "test-id",
            "fullName": "Updated Guardian"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_guardians_delete_returns_401_unauthenticated(self):
        """DELETE /api/health/guardians should return 401 without auth"""
        response = requests.delete(f"{BASE_URL}/api/health/guardians?id=test-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestProvidersEndpoint:
    """Tests for /api/health/providers endpoint"""
    
    def test_providers_get_returns_401_unauthenticated(self):
        """GET /api/health/providers should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/providers")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_providers_post_returns_401_unauthenticated(self):
        """POST /api/health/providers should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/providers", json={
            "firstName": "Dr. Test",
            "lastName": "Provider",
            "role": "DOCTOR"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_providers_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/providers should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/providers", json={
            "id": "test-id",
            "firstName": "Updated"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestFacilitiesEndpoint:
    """Tests for /api/health/facilities endpoint"""
    
    def test_facilities_get_returns_401_unauthenticated(self):
        """GET /api/health/facilities should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/facilities")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_facilities_post_returns_401_unauthenticated(self):
        """POST /api/health/facilities should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/facilities", json={
            "name": "Test Facility",
            "type": "CLINIC"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_facilities_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/facilities should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/facilities", json={
            "id": "test-id",
            "name": "Updated Facility"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestAppointmentsEndpoint:
    """Tests for /api/health/appointments endpoint"""
    
    def test_appointments_get_returns_401_unauthenticated(self):
        """GET /api/health/appointments should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/appointments")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_appointments_post_returns_401_unauthenticated(self):
        """POST /api/health/appointments should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/appointments", json={
            "patientId": "test-patient",
            "appointmentDate": "2025-01-15"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_appointments_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/appointments should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/appointments", json={
            "id": "test-id",
            "status": "CONFIRMED"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestVisitsEndpoint:
    """Tests for /api/health/visits endpoint"""
    
    def test_visits_get_returns_401_unauthenticated(self):
        """GET /api/health/visits should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/visits")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_visits_post_returns_401_unauthenticated(self):
        """POST /api/health/visits should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/visits", json={
            "patientId": "test-patient"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_visits_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/visits should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/visits", json={
            "id": "test-id",
            "status": "IN_CONSULTATION"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestEncountersEndpoint:
    """Tests for /api/health/encounters endpoint (append-only)"""
    
    def test_encounters_get_returns_401_unauthenticated(self):
        """GET /api/health/encounters should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/encounters")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_encounters_post_returns_401_unauthenticated(self):
        """POST /api/health/encounters should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/encounters", json={
            "visitId": "test-visit",
            "patientId": "test-patient",
            "providerId": "test-provider"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_encounters_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/encounters should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/encounters", json={
            "id": "test-id",
            "action": "complete"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestPrescriptionsEndpoint:
    """Tests for /api/health/prescriptions endpoint"""
    
    def test_prescriptions_get_returns_401_unauthenticated(self):
        """GET /api/health/prescriptions should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/prescriptions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_prescriptions_post_returns_401_unauthenticated(self):
        """POST /api/health/prescriptions should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/prescriptions", json={
            "patientId": "test-patient",
            "encounterId": "test-encounter",
            "prescriberId": "test-prescriber",
            "medication": "Test Med",
            "dosage": "10mg",
            "frequency": "Daily",
            "duration": "7 days"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_prescriptions_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/prescriptions should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/prescriptions", json={
            "id": "test-id",
            "action": "dispense"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestLabOrdersEndpoint:
    """Tests for /api/health/lab-orders endpoint"""
    
    def test_lab_orders_get_returns_401_unauthenticated(self):
        """GET /api/health/lab-orders should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/lab-orders")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_lab_orders_post_returns_401_unauthenticated(self):
        """POST /api/health/lab-orders should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/lab-orders", json={
            "patientId": "test-patient",
            "encounterId": "test-encounter",
            "orderedById": "test-provider",
            "testName": "Blood Test"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_lab_orders_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/lab-orders should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/lab-orders", json={
            "id": "test-id",
            "action": "update_status",
            "status": "SAMPLE_COLLECTED"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


class TestBillingFactsEndpoint:
    """Tests for /api/health/billing-facts endpoint (commerce boundary)"""
    
    def test_billing_facts_get_returns_401_unauthenticated(self):
        """GET /api/health/billing-facts should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/health/billing-facts")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_billing_facts_post_returns_401_unauthenticated(self):
        """POST /api/health/billing-facts should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/health/billing-facts", json={
            "patientId": "test-patient",
            "factType": "CONSULTATION",
            "description": "Test consultation",
            "amount": 5000
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"
    
    def test_billing_facts_patch_returns_401_unauthenticated(self):
        """PATCH /api/health/billing-facts should return 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/health/billing-facts", json={
            "id": "test-id",
            "action": "mark_billed",
            "billingInvoiceId": "test-invoice"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get('error') == 'Unauthorized', f"Expected 'Unauthorized' error, got: {data}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
