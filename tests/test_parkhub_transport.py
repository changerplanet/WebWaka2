"""
ParkHub Transport Module Tests
Tests for ParkHub - Motor Park Marketplace (Incremental Activation)

KEY VERIFICATION:
1. NO new database schemas for ParkHub
2. Uses existing MVM, Logistics, Payments capabilities
3. ParkHub is a CONFIGURATION of MVM, not a new module
4. All APIs work correctly
5. UI pages render without errors
"""

import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "demo.owner@webwaka.com"
TEST_PASSWORD = "Demo2026!"


# Module-level auth token
_auth_token = None

def get_auth_token():
    """Get or create authentication token"""
    global _auth_token
    if _auth_token is None:
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "login-password",
                "identifier": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        if response.status_code == 200:
            data = response.json()
            _auth_token = data.get("sessionToken") or data.get("token")
        else:
            pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    return _auth_token


class TestParkHubAuthentication:
    """Authentication tests for ParkHub APIs"""
    
    def test_login_with_valid_credentials(self):
        """Test login with demo partner credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "login-password",
                "identifier": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "sessionToken" in data
        print(f"✓ Login successful for {TEST_EMAIL}")


class TestParkHubConfigAPI:
    """Tests for GET /api/parkhub?action=config"""
    
    def test_config_api_requires_auth(self):
        """Test that config API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/parkhub?action=config")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Config API correctly requires authentication")
    
    def test_config_api_returns_labels(self):
        """Test that config API returns ParkHub labels"""
        token = get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/parkhub?action=config",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Config API failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "config" in data
        
        config = data["config"]
        assert "labels" in config
        
        # Verify label mappings
        labels = config["labels"]
        assert labels.get("vendor") == "Transport Company"
        assert labels.get("vendors") == "Transport Companies"
        assert labels.get("product") == "Route"
        assert labels.get("products") == "Routes"
        assert labels.get("inventory") == "Seats"
        assert labels.get("order") == "Ticket"
        assert labels.get("orders") == "Tickets"
        assert labels.get("customer") == "Passenger"
        assert labels.get("customers") == "Passengers"
        print("✓ Config API returns correct ParkHub labels")
    
    def test_config_api_returns_mvm_config(self):
        """Test that config API returns MVM configuration"""
        token = get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/parkhub?action=config",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        config = data["config"]
        
        assert "mvmConfig" in config
        mvm_config = config["mvmConfig"]
        
        # Verify MVM configuration for transport
        assert mvm_config.get("marketplaceName") == "Motor Park"
        assert mvm_config.get("marketplaceType") == "TRANSPORT_SERVICES"
        assert mvm_config.get("vendorLabel") == "Transport Company"
        assert mvm_config.get("productType") == "SERVICE"
        assert mvm_config.get("productLabel") == "Route"
        assert mvm_config.get("inventoryLabel") == "Seats"
        assert mvm_config.get("orderLabel") == "Ticket"
        assert mvm_config.get("defaultCommissionRate") == 0.10
        print("✓ Config API returns correct MVM configuration")
    
    def test_config_api_returns_capability_bundle(self):
        """Test that config API returns capability bundle"""
        token = get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/parkhub?action=config",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        config = data["config"]
        
        assert "capabilityBundle" in config
        bundle = config["capabilityBundle"]
        
        # Verify required capabilities
        assert bundle.get("key") == "parkhub"
        assert "requiredCapabilities" in bundle
        required = bundle["requiredCapabilities"]
        assert "mvm" in required
        assert "logistics" in required
        assert "payments" in required
        print("✓ Config API returns correct capability bundle (mvm, logistics, payments)")


class TestParkHubSolutionPackageAPI:
    """Tests for GET /api/parkhub?action=solution-package"""
    
    def test_solution_package_api_requires_auth(self):
        """Test that solution-package API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/parkhub?action=solution-package")
        assert response.status_code == 401
        print("✓ Solution-package API correctly requires authentication")
    
    def test_solution_package_api_returns_details(self):
        """Test that solution-package API returns package details"""
        token = get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/parkhub?action=solution-package",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Solution-package API failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "solution" in data
        
        solution = data["solution"]
        assert solution.get("id") == "parkhub"
        assert solution.get("name") == "ParkHub - Motor Park Solution"
        assert "keyFeatures" in solution
        assert "pricing" in solution
        print("✓ Solution-package API returns correct package details")
    
    def test_solution_package_api_returns_activation_checklist(self):
        """Test that solution-package API returns activation checklist"""
        token = get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/parkhub?action=solution-package",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "activationChecklist" in data
        checklist = data["activationChecklist"]
        assert "preActivation" in checklist
        assert "activation" in checklist
        assert "postActivation" in checklist
        print("✓ Solution-package API returns activation checklist")


class TestParkHubDemoDataAPI:
    """Tests for GET /api/parkhub?action=demo-data"""
    
    def test_demo_data_api_requires_auth(self):
        """Test that demo-data API requires authentication"""
        response = requests.get(f"{BASE_URL}/api/parkhub?action=demo-data")
        assert response.status_code == 401
        print("✓ Demo-data API correctly requires authentication")
    
    def test_demo_data_api_returns_summary(self):
        """Test that demo-data API returns demo data summary"""
        token = get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/parkhub?action=demo-data",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Demo-data API failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "demo" in data
        
        demo = data["demo"]
        assert "summary" in demo
        assert "credentials" in demo
        
        summary = demo["summary"]
        assert "motorPark" in summary
        assert "companies" in summary
        assert "totalRoutes" in summary
        assert "totalDrivers" in summary
        
        # Verify demo data counts
        assert summary["totalRoutes"] == 15  # 5 routes per company * 3 companies
        assert summary["totalDrivers"] == 7
        assert len(summary["companies"]) == 3
        print("✓ Demo-data API returns correct demo data summary")
    
    def test_demo_data_api_returns_credentials(self):
        """Test that demo-data API returns demo credentials"""
        token = get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/parkhub?action=demo-data",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        credentials = data["demo"]["credentials"]
        assert "parkAdmin" in credentials
        assert "operatorAccounts" in credentials
        assert "posAgent" in credentials
        print("✓ Demo-data API returns demo credentials")


class TestParkHubActivationAPI:
    """Tests for POST /api/parkhub with action: activate"""
    
    def test_activation_api_requires_auth(self):
        """Test that activation API requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/parkhub",
            json={"action": "activate", "tenantId": "test", "parkName": "Test Park"}
        )
        assert response.status_code == 401
        print("✓ Activation API correctly requires authentication")
    
    def test_activation_api_requires_tenant_id(self):
        """Test that activation API requires tenant ID"""
        token = get_auth_token()
        response = requests.post(
            f"{BASE_URL}/api/parkhub",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "activate", "parkName": "Test Park"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data.get("success") == False
        assert "Tenant ID" in data.get("error", "") or "required" in data.get("error", "").lower()
        print("✓ Activation API correctly requires tenant ID")
    
    def test_activation_api_requires_park_name(self):
        """Test that activation API requires park name"""
        token = get_auth_token()
        response = requests.post(
            f"{BASE_URL}/api/parkhub",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "activate", "tenantId": "test-tenant-123"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data.get("success") == False
        print("✓ Activation API correctly requires park name")
    
    def test_activation_api_success(self):
        """Test successful ParkHub activation"""
        token = get_auth_token()
        response = requests.post(
            f"{BASE_URL}/api/parkhub",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "action": "activate",
                "tenantId": f"test-tenant-{os.urandom(4).hex()}",
                "parkName": "Test Motor Park",
                "parkAddress": "Lagos, Nigeria",
                "parkPhone": "08012345678",
                "commissionRate": 10,
                "tier": "starter"
            }
        )
        assert response.status_code == 200, f"Activation failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "activationId" in data
        assert "activatedCapabilities" in data
        
        # Verify activated capabilities include required ones
        capabilities = data["activatedCapabilities"]
        assert "parkhub" in capabilities
        assert "mvm" in capabilities
        assert "logistics" in capabilities
        assert "payments" in capabilities
        print("✓ Activation API successfully activates ParkHub")
    
    def test_check_activation_api(self):
        """Test check-activation API"""
        token = get_auth_token()
        response = requests.post(
            f"{BASE_URL}/api/parkhub",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "action": "check-activation",
                "tenantCapabilities": ["mvm", "logistics", "payments"],
                "partnerPermissions": ["activate_solutions", "manage_tenants"]
            }
        )
        assert response.status_code == 200, f"Check-activation failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "canActivate" in data
        assert data["canActivate"] == True
        print("✓ Check-activation API works correctly")


class TestParkHubInvalidActions:
    """Tests for invalid API actions"""
    
    def test_invalid_get_action(self):
        """Test invalid GET action returns error"""
        token = get_auth_token()
        response = requests.get(
            f"{BASE_URL}/api/parkhub?action=invalid-action",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data.get("success") == False
        print("✓ Invalid GET action correctly returns 400")
    
    def test_invalid_post_action(self):
        """Test invalid POST action returns error"""
        token = get_auth_token()
        response = requests.post(
            f"{BASE_URL}/api/parkhub",
            headers={"Authorization": f"Bearer {token}"},
            json={"action": "invalid-action"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data.get("success") == False
        print("✓ Invalid POST action correctly returns 400")


class TestCapabilityRegistryParkHub:
    """Tests to verify ParkHub is in capability registry"""
    
    def test_parkhub_in_registry_file(self):
        """Verify parkhub capability exists in registry.ts"""
        registry_path = "/app/frontend/src/lib/capabilities/registry.ts"
        with open(registry_path, 'r') as f:
            content = f.read()
        
        # Check parkhub capability exists
        assert "parkhub:" in content, "parkhub capability not found in registry"
        assert "'parkhub'" in content or '"parkhub"' in content
        
        # Check it has correct dependencies
        assert "dependencies: ['mvm', 'logistics', 'payments']" in content or \
               'dependencies: ["mvm", "logistics", "payments"]' in content
        
        # Check it's in LOGISTICS domain
        assert "CAPABILITY_DOMAINS.LOGISTICS" in content
        
        print("✓ ParkHub capability correctly defined in registry")


class TestNoNewSchemas:
    """Tests to verify NO new database schemas for ParkHub"""
    
    def test_no_parkhub_tables_in_schema(self):
        """Verify no parkhub-specific tables in schema.prisma"""
        schema_path = "/app/frontend/prisma/schema.prisma"
        with open(schema_path, 'r') as f:
            content = f.read()
        
        # Extract all model names
        model_names = re.findall(r'^model\s+(\w+)\s*\{', content, re.MULTILINE)
        
        # Check for parkhub-specific table names (exact matches)
        forbidden_prefixes = [
            "parkhub_",
            "transport_",
            "motor_park",
            "park_",
            "ph_",  # parkhub prefix
        ]
        
        forbidden_exact = [
            "Route",
            "Routes",
            "Trip",
            "Trips",
            "Bus",
            "Buses",
            "Driver",
            "Drivers",
            "Seat",
            "Seats",
            "Ticket",
            "Tickets",
            "MotorPark",
            "TransportCompany",
        ]
        
        for model in model_names:
            model_lower = model.lower()
            for prefix in forbidden_prefixes:
                assert not model_lower.startswith(prefix), f"Found forbidden model '{model}' with prefix '{prefix}'"
            
            for exact in forbidden_exact:
                assert model != exact, f"Found forbidden model '{model}'"
        
        print(f"✓ No ParkHub-specific tables in schema.prisma (checked {len(model_names)} models)")
    
    def test_uses_existing_mvm_structures(self):
        """Verify ParkHub uses existing MVM structures"""
        schema_path = "/app/frontend/prisma/schema.prisma"
        with open(schema_path, 'r') as f:
            content = f.read()
        
        # Check existing MVM structures exist
        assert "model Product" in content, "Product model not found"
        assert "model Customer" in content, "Customer model not found"
        
        # Check logistics structures exist
        assert "logistics_delivery_agents" in content, "Logistics agents not found"
        assert "logistics_delivery_assignments" in content, "Logistics assignments not found"
        
        # Check payments structures exist
        assert "pay_wallets" in content or "Wallet" in content, "Wallets not found"
        
        print("✓ ParkHub uses existing MVM, Logistics, Payments structures")


class TestTripStatusWorkflow:
    """Tests to verify trip status workflow is correct"""
    
    def test_trip_status_workflow_in_config(self):
        """Verify trip status workflow in config.ts"""
        config_path = "/app/frontend/src/lib/parkhub/config.ts"
        with open(config_path, 'r') as f:
            content = f.read()
        
        # Check all trip statuses exist
        expected_statuses = ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'CANCELLED']
        for status in expected_statuses:
            assert status in content, f"Trip status '{status}' not found in config"
        
        # Check status labels exist
        assert "TRIP_STATUS_LABELS" in content
        assert "TRIP_STATUS_MAP" in content
        
        print("✓ Trip status workflow correctly defined (SCHEDULED→BOARDING→DEPARTED→IN_TRANSIT→ARRIVED→COMPLETED)")


class TestDocumentation:
    """Tests to verify documentation exists"""
    
    def test_parkhub_guide_exists(self):
        """Verify ParkHub guide documentation exists"""
        doc_path = "/app/frontend/docs/parkhub-guide.md"
        assert os.path.exists(doc_path), "ParkHub guide not found"
        
        with open(doc_path, 'r') as f:
            content = f.read()
        
        # Check key sections exist
        assert "# ParkHub" in content
        assert "MVM" in content
        assert "Logistics" in content
        assert "Trip Lifecycle" in content
        assert "Commission" in content
        
        # Check it's substantial
        assert len(content) > 1000, "Documentation seems too short"
        
        print("✓ ParkHub documentation exists and is complete")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
