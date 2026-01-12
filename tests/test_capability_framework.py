"""
Test Suite: Module Activation & Capability Framework
Tests the SaaS Core capability system including:
- Public capabilities list API
- Authenticated tenant capabilities API
- Super admin capabilities API
- Capability activation/deactivation
- Dependency handling
- Core capability protection
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prisma-enum-bridge.preview.emergentagent.com').rstrip('/')


class TestPublicCapabilitiesAPI:
    """Test GET /api/capabilities - Public endpoint"""
    
    def test_get_capabilities_returns_200(self):
        """Public capabilities endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_get_capabilities_returns_json(self):
        """Response should be JSON"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        assert response.headers.get('content-type', '').startswith('application/json')
        
    def test_get_capabilities_has_required_fields(self):
        """Response should have capabilities, byDomain, and totalCount"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        assert 'capabilities' in data, "Missing 'capabilities' field"
        assert 'byDomain' in data, "Missing 'byDomain' field"
        assert 'totalCount' in data, "Missing 'totalCount' field"
        
    def test_get_capabilities_returns_26_capabilities(self):
        """Should return all 26 registered capabilities"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        assert data['totalCount'] == 26, f"Expected 26 capabilities, got {data['totalCount']}"
        assert len(data['capabilities']) == 26
        
    def test_capabilities_have_required_structure(self):
        """Each capability should have key, displayName, domain, isCore"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        for cap in data['capabilities']:
            assert 'key' in cap, f"Capability missing 'key'"
            assert 'displayName' in cap, f"Capability {cap.get('key')} missing 'displayName'"
            assert 'domain' in cap, f"Capability {cap.get('key')} missing 'domain'"
            assert 'isCore' in cap, f"Capability {cap.get('key')} missing 'isCore'"
            
    def test_core_capabilities_exist(self):
        """tenant_management and user_management should be core capabilities"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        core_caps = [c for c in data['capabilities'] if c['isCore']]
        core_keys = [c['key'] for c in core_caps]
        
        assert 'tenant_management' in core_keys, "Missing core capability: tenant_management"
        assert 'user_management' in core_keys, "Missing core capability: user_management"
        assert len(core_caps) == 2, f"Expected 2 core capabilities, got {len(core_caps)}"
        
    def test_commerce_capabilities_exist(self):
        """Commerce domain should have POS, SVM, MVM, Inventory"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        commerce_caps = [c for c in data['capabilities'] if c['domain'] == 'commerce']
        commerce_keys = [c['key'] for c in commerce_caps]
        
        assert 'pos' in commerce_keys, "Missing commerce capability: pos"
        assert 'svm' in commerce_keys, "Missing commerce capability: svm"
        assert 'mvm' in commerce_keys, "Missing commerce capability: mvm"
        assert 'inventory' in commerce_keys, "Missing commerce capability: inventory"
        
    def test_education_capabilities_exist(self):
        """Education domain should have school_attendance, school_grading"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        edu_caps = [c for c in data['capabilities'] if c['domain'] == 'education']
        edu_keys = [c['key'] for c in edu_caps]
        
        assert 'school_attendance' in edu_keys, "Missing education capability: school_attendance"
        assert 'school_grading' in edu_keys, "Missing education capability: school_grading"
        
    def test_hospitality_capabilities_exist(self):
        """Hospitality domain should have hotel_rooms, hotel_reservations"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        hosp_caps = [c for c in data['capabilities'] if c['domain'] == 'hospitality']
        hosp_keys = [c['key'] for c in hosp_caps]
        
        assert 'hotel_rooms' in hosp_keys, "Missing hospitality capability: hotel_rooms"
        assert 'hotel_reservations' in hosp_keys, "Missing hospitality capability: hotel_reservations"
        
    def test_healthcare_capabilities_exist(self):
        """Healthcare domain should have patient_records, appointment_scheduling"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        health_caps = [c for c in data['capabilities'] if c['domain'] == 'healthcare']
        health_keys = [c['key'] for c in health_caps]
        
        assert 'patient_records' in health_keys, "Missing healthcare capability: patient_records"
        assert 'appointment_scheduling' in health_keys, "Missing healthcare capability: appointment_scheduling"
        
    def test_domain_filter_works(self):
        """Filtering by domain should return only that domain's capabilities"""
        response = requests.get(f"{BASE_URL}/api/capabilities?domain=commerce")
        data = response.json()
        
        assert response.status_code == 200
        for cap in data['capabilities']:
            assert cap['domain'] == 'commerce', f"Expected commerce domain, got {cap['domain']}"
            
    def test_by_domain_grouping(self):
        """byDomain should group capabilities correctly"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        domains_in_response = [g['domain'] for g in data['byDomain']]
        
        # Should have multiple domains
        assert len(domains_in_response) >= 5, f"Expected at least 5 domains, got {len(domains_in_response)}"
        assert 'core' in domains_in_response
        assert 'commerce' in domains_in_response
        
    def test_dependencies_are_arrays(self):
        """Dependencies field should be an array"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        for cap in data['capabilities']:
            assert isinstance(cap['dependencies'], list), f"Dependencies for {cap['key']} should be a list"
            
    def test_mvm_depends_on_svm(self):
        """MVM capability should depend on SVM"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        mvm = next((c for c in data['capabilities'] if c['key'] == 'mvm'), None)
        assert mvm is not None, "MVM capability not found"
        assert 'svm' in mvm['dependencies'], "MVM should depend on SVM"
        
    def test_hotel_reservations_depends_on_hotel_rooms(self):
        """hotel_reservations should depend on hotel_rooms"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        reservations = next((c for c in data['capabilities'] if c['key'] == 'hotel_reservations'), None)
        assert reservations is not None, "hotel_reservations capability not found"
        assert 'hotel_rooms' in reservations['dependencies'], "hotel_reservations should depend on hotel_rooms"


class TestAuthenticatedEndpoints:
    """Test endpoints that require authentication"""
    
    def test_tenant_capabilities_requires_auth(self):
        """GET /api/capabilities/tenant should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/capabilities/tenant")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data
        assert 'Authentication required' in data['error']
        
    def test_admin_capabilities_requires_auth(self):
        """GET /api/admin/capabilities should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/capabilities")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data
        assert 'Authentication required' in data['error']
        
    def test_seed_capabilities_requires_auth(self):
        """POST /api/capabilities/seed should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/capabilities/seed")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data
        assert 'Authentication required' in data['error']
        
    def test_activate_capability_requires_auth(self):
        """POST /api/capabilities/tenant/[key]/activate should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/capabilities/tenant/pos/activate")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data
        assert 'Authentication required' in data['error']
        
    def test_deactivate_capability_requires_auth(self):
        """POST /api/capabilities/tenant/[key]/deactivate should return 401 without auth"""
        response = requests.post(f"{BASE_URL}/api/capabilities/tenant/pos/deactivate")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        
        data = response.json()
        assert 'error' in data
        assert 'Authentication required' in data['error']


class TestCapabilityDomains:
    """Test all 10 capability domains are present"""
    
    def test_all_domains_present(self):
        """All 10 domains should be represented"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        domains = set(c['domain'] for c in data['capabilities'])
        
        expected_domains = {
            'core', 'commerce', 'education', 'hospitality', 
            'healthcare', 'finance', 'logistics', 'hr', 'crm', 'general'
        }
        
        assert domains == expected_domains, f"Missing domains: {expected_domains - domains}"
        
    def test_core_domain_has_2_capabilities(self):
        """Core domain should have exactly 2 capabilities"""
        response = requests.get(f"{BASE_URL}/api/capabilities?domain=core")
        data = response.json()
        
        assert len(data['capabilities']) == 2
        
    def test_commerce_domain_has_8_capabilities(self):
        """Commerce domain should have 8 capabilities"""
        response = requests.get(f"{BASE_URL}/api/capabilities?domain=commerce")
        data = response.json()
        
        assert len(data['capabilities']) == 8, f"Expected 8 commerce capabilities, got {len(data['capabilities'])}"
        
    def test_finance_domain_has_3_capabilities(self):
        """Finance domain should have 3 capabilities"""
        response = requests.get(f"{BASE_URL}/api/capabilities?domain=finance")
        data = response.json()
        
        assert len(data['capabilities']) == 3
        
    def test_general_domain_has_3_capabilities(self):
        """General domain should have 3 capabilities"""
        response = requests.get(f"{BASE_URL}/api/capabilities?domain=general")
        data = response.json()
        
        assert len(data['capabilities']) == 3


class TestCapabilityMetadata:
    """Test capability metadata and structure"""
    
    def test_capabilities_have_icons(self):
        """All capabilities should have icon field"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        for cap in data['capabilities']:
            assert 'icon' in cap, f"Capability {cap['key']} missing icon"
            
    def test_capabilities_have_sort_order(self):
        """All capabilities should have sortOrder field"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        for cap in data['capabilities']:
            assert 'sortOrder' in cap, f"Capability {cap['key']} missing sortOrder"
            
    def test_capabilities_have_descriptions(self):
        """All capabilities should have description field"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        for cap in data['capabilities']:
            assert 'description' in cap, f"Capability {cap['key']} missing description"
            assert cap['description'] is not None and len(cap['description']) > 0
            
    def test_include_metadata_param(self):
        """includeMetadata=true should include metadata field"""
        response = requests.get(f"{BASE_URL}/api/capabilities?includeMetadata=true")
        data = response.json()
        
        assert response.status_code == 200
        # At least some capabilities should have metadata
        caps_with_metadata = [c for c in data['capabilities'] if c.get('metadata')]
        assert len(caps_with_metadata) > 0, "Expected some capabilities to have metadata"


class TestEndpointExistence:
    """Verify all capability endpoints exist and respond"""
    
    def test_capabilities_endpoint_exists(self):
        """GET /api/capabilities should not return 404"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        assert response.status_code != 404
        
    def test_tenant_capabilities_endpoint_exists(self):
        """GET /api/capabilities/tenant should not return 404"""
        response = requests.get(f"{BASE_URL}/api/capabilities/tenant")
        assert response.status_code != 404
        
    def test_admin_capabilities_endpoint_exists(self):
        """GET /api/admin/capabilities should not return 404"""
        response = requests.get(f"{BASE_URL}/api/admin/capabilities")
        assert response.status_code != 404
        
    def test_seed_endpoint_exists(self):
        """POST /api/capabilities/seed should not return 404"""
        response = requests.post(f"{BASE_URL}/api/capabilities/seed")
        assert response.status_code != 404
        
    def test_activate_endpoint_exists(self):
        """POST /api/capabilities/tenant/[key]/activate should not return 404"""
        response = requests.post(f"{BASE_URL}/api/capabilities/tenant/pos/activate")
        assert response.status_code != 404
        
    def test_deactivate_endpoint_exists(self):
        """POST /api/capabilities/tenant/[key]/deactivate should not return 404"""
        response = requests.post(f"{BASE_URL}/api/capabilities/tenant/pos/deactivate")
        assert response.status_code != 404


class TestCapabilityKeys:
    """Test all 26 capability keys are present"""
    
    def test_all_capability_keys_present(self):
        """All 26 capability keys should be present"""
        response = requests.get(f"{BASE_URL}/api/capabilities")
        data = response.json()
        
        keys = [c['key'] for c in data['capabilities']]
        
        expected_keys = [
            # Core
            'tenant_management', 'user_management',
            # Commerce
            'pos', 'svm', 'mvm', 'inventory', 'accounting', 'procurement', 'b2b_wholesale', 'partner_reseller',
            # Education
            'school_attendance', 'school_grading',
            # Hospitality
            'hotel_rooms', 'hotel_reservations',
            # Healthcare
            'patient_records', 'appointment_scheduling',
            # Finance
            'payments_wallets', 'subscriptions_billing', 'compliance_tax',
            # Logistics
            'logistics',
            # HR
            'hr_payroll',
            # CRM
            'crm', 'marketing',
            # General
            'analytics', 'ai_automation', 'integrations_hub'
        ]
        
        for key in expected_keys:
            assert key in keys, f"Missing capability key: {key}"
            
        assert len(keys) == 26, f"Expected 26 capabilities, got {len(keys)}"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
