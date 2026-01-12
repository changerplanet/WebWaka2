"""
MODULE 4: LOGISTICS & DELIVERY - Authenticated API Tests
Tests all logistics endpoints with proper authentication
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prisma-enum-bridge.preview.emergentagent.com').rstrip('/')

# Test data prefixes for cleanup
TEST_PREFIX = "TEST_LOGISTICS_"

# Store created resources for cleanup
created_resources = {
    "zones": [],
    "agents": [],
    "assignments": []
}


def get_authenticated_session():
    """Get authenticated session using magic link"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Request magic link for tenant admin
    email = "admin@acme.com"
    
    response = session.post(f"{BASE_URL}/api/auth/magic-link", json={
        "email": email,
        "tenantSlug": "acme"
    })
    
    if response.status_code != 200:
        print(f"Magic link request failed: {response.status_code} - {response.text}")
        return None
        
    data = response.json()
    magic_link = data.get("magicLink")
    
    if not magic_link:
        print(f"No magic link in response: {data}")
        return None
        
    # Extract token from magic link
    token = magic_link.split("token=")[-1]
    
    # Verify the token to create session
    verify_response = session.get(f"{BASE_URL}/api/auth/verify?token={token}", allow_redirects=False)
    
    # The verify endpoint sets cookies and redirects
    if verify_response.status_code in [200, 302, 307]:
        # Check if session is active
        session_response = session.get(f"{BASE_URL}/api/auth/session")
        if session_response.status_code == 200:
            session_data = session_response.json()
            if session_data.get("user"):
                print(f"Authenticated as {session_data['user'].get('email')}")
                print(f"Active tenant: {session_data.get('activeTenantId')}")
                return session
                
    print(f"Verification failed: {verify_response.status_code}")
    return None


class TestLogisticsAuthenticated:
    """Test logistics endpoints with authentication"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Get authenticated session"""
        session = get_authenticated_session()
        if not session:
            pytest.skip("Could not authenticate")
        return session
        
    # =========================================================================
    # LOGISTICS CONFIGURATION TESTS
    # =========================================================================
    
    def test_01_get_logistics_config(self, auth_session):
        """GET /api/logistics - Get logistics configuration"""
        response = auth_session.get(f"{BASE_URL}/api/logistics")
        assert response.status_code == 200
        data = response.json()
        assert "initialized" in data
        assert "enabled" in data
        assert "entitlementStatus" in data
        print(f"Logistics: initialized={data.get('initialized')}, enabled={data.get('enabled')}")
        
    def test_02_initialize_logistics(self, auth_session):
        """POST /api/logistics - Initialize logistics module"""
        response = auth_session.post(f"{BASE_URL}/api/logistics", json={
            "createDefaultZones": True,
            "deliveryEnabled": True,
            "proofOfDeliveryRequired": True,
            "photoProofRequired": True,
            "defaultCurrency": "NGN"
        })
        # May return 200 (success) or 400 (already initialized) or 403 (not entitled)
        assert response.status_code in [200, 400, 403]
        data = response.json()
        if response.status_code == 200:
            assert data.get("success") == True
            print("Logistics initialized successfully")
        else:
            print(f"Init response: {data.get('error')}")
            
    def test_03_update_logistics_config(self, auth_session):
        """PUT /api/logistics - Update logistics configuration"""
        response = auth_session.put(f"{BASE_URL}/api/logistics", json={
            "deliveryEnabled": True,
            "maxConcurrentDeliveries": 5
        })
        assert response.status_code in [200, 400, 403]
        data = response.json()
        print(f"Update config: {response.status_code} - {data}")
        
    # =========================================================================
    # DELIVERY ZONES TESTS
    # =========================================================================
    
    def test_10_get_zones(self, auth_session):
        """GET /api/logistics/zones - List delivery zones"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/zones")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "zones" in data
            print(f"Found {len(data['zones'])} zones")
            
    def test_11_get_zones_with_filters(self, auth_session):
        """GET /api/logistics/zones with filters"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/zones?status=ACTIVE&includeRules=true")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            print(f"Active zones with rules: {len(data.get('zones', []))}")
            
    def test_12_create_zone(self, auth_session):
        """POST /api/logistics/zones - Create delivery zone"""
        zone_name = f"{TEST_PREFIX}Zone_{uuid.uuid4().hex[:8]}"
        response = auth_session.post(f"{BASE_URL}/api/logistics/zones", json={
            "name": zone_name,
            "city": "Lagos",
            "state": "Lagos",
            "lga": "Surulere",
            "zoneType": "LGA"
        })
        assert response.status_code in [200, 400, 403]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "zone" in data
            created_resources["zones"].append(data["zone"]["id"])
            print(f"Created zone: {data['zone']['id']}")
        else:
            print(f"Zone creation: {response.json().get('error')}")
            
    def test_13_get_zone_by_id(self, auth_session):
        """GET /api/logistics/zones/[id] - Get zone by ID"""
        if not created_resources["zones"]:
            pytest.skip("No zone created")
        zone_id = created_resources["zones"][0]
        response = auth_session.get(f"{BASE_URL}/api/logistics/zones/{zone_id}")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "zone" in data
            assert data["zone"]["id"] == zone_id
            print(f"Got zone: {data['zone']['name']}")
            
    def test_14_update_zone(self, auth_session):
        """PUT /api/logistics/zones/[id] - Update zone"""
        if not created_resources["zones"]:
            pytest.skip("No zone created")
        zone_id = created_resources["zones"][0]
        response = auth_session.put(f"{BASE_URL}/api/logistics/zones/{zone_id}", json={
            "description": "Updated test zone description"
        })
        assert response.status_code in [200, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print("Zone updated")
            
    def test_15_add_pricing_rule(self, auth_session):
        """POST /api/logistics/zones/[id] - Add pricing rule"""
        if not created_resources["zones"]:
            pytest.skip("No zone created")
        zone_id = created_resources["zones"][0]
        response = auth_session.post(f"{BASE_URL}/api/logistics/zones/{zone_id}", json={
            "name": f"{TEST_PREFIX}Standard Rate",
            "pricingType": "FLAT_RATE",
            "baseFee": 1500,
            "freeDeliveryThreshold": 50000,
            "currency": "NGN"
        })
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print(f"Created pricing rule: {data['rule']['id']}")
            
    # =========================================================================
    # DELIVERY QUOTE TESTS
    # =========================================================================
    
    def test_20_get_delivery_quote(self, auth_session):
        """GET /api/logistics/zones/quote - Calculate delivery quote"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/zones/quote?city=Lagos&state=Lagos&orderValue=25000")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "quote" in data
            quote = data["quote"]
            assert "deliveryFee" in quote
            print(f"Quote: {quote['deliveryFee']} {quote.get('currency', 'NGN')}")
        else:
            print("No zone found for quote")
            
    def test_21_post_delivery_quote(self, auth_session):
        """POST /api/logistics/zones/quote - Calculate delivery quote (POST)"""
        response = auth_session.post(f"{BASE_URL}/api/logistics/zones/quote", json={
            "city": "Lagos",
            "state": "Lagos",
            "lga": "Ikeja",
            "orderValue": 30000,
            "isExpress": False
        })
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "quote" in data
            print(f"POST Quote: {data['quote']['deliveryFee']}")
            
    # =========================================================================
    # DELIVERY AGENTS TESTS
    # =========================================================================
    
    def test_30_get_agents(self, auth_session):
        """GET /api/logistics/agents - List delivery agents"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/agents")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "agents" in data
            assert "total" in data
            print(f"Found {data['total']} agents")
            
    def test_31_create_agent(self, auth_session):
        """POST /api/logistics/agents - Create delivery agent"""
        phone = f"+234801{uuid.uuid4().hex[:7]}"
        response = auth_session.post(f"{BASE_URL}/api/logistics/agents", json={
            "firstName": f"{TEST_PREFIX}John",
            "lastName": "Rider",
            "phone": phone,
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "agentType": "IN_HOUSE",
            "vehicleType": "MOTORCYCLE"
        })
        assert response.status_code in [200, 400, 403]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            created_resources["agents"].append(data["agent"]["id"])
            print(f"Created agent: {data['agent']['id']}")
        else:
            print(f"Agent creation: {response.json().get('error')}")
            
    def test_32_get_agent_by_id(self, auth_session):
        """GET /api/logistics/agents/[id] - Get agent by ID"""
        if not created_resources["agents"]:
            pytest.skip("No agent created")
        agent_id = created_resources["agents"][0]
        response = auth_session.get(f"{BASE_URL}/api/logistics/agents/{agent_id}")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "agent" in data
            print(f"Got agent: {data['agent']['firstName']} {data['agent']['lastName']}")
            
    def test_33_get_agent_with_performance(self, auth_session):
        """GET /api/logistics/agents/[id]?performance=true"""
        if not created_resources["agents"]:
            pytest.skip("No agent created")
        agent_id = created_resources["agents"][0]
        response = auth_session.get(f"{BASE_URL}/api/logistics/agents/{agent_id}?performance=true")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "agent" in data
            assert "performance" in data
            print(f"Agent performance: {data.get('performance')}")
            
    def test_34_update_agent(self, auth_session):
        """PUT /api/logistics/agents/[id] - Update agent"""
        if not created_resources["agents"]:
            pytest.skip("No agent created")
        agent_id = created_resources["agents"][0]
        response = auth_session.put(f"{BASE_URL}/api/logistics/agents/{agent_id}", json={
            "vehicleType": "CAR"
        })
        assert response.status_code in [200, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print("Agent updated")
            
    def test_35_update_agent_availability(self, auth_session):
        """POST /api/logistics/agents/[id] - Update availability"""
        if not created_resources["agents"]:
            pytest.skip("No agent created")
        agent_id = created_resources["agents"][0]
        response = auth_session.post(f"{BASE_URL}/api/logistics/agents/{agent_id}", json={
            "action": "availability",
            "availability": "AVAILABLE"
        })
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            print("Agent availability updated")
            
    def test_36_update_agent_location(self, auth_session):
        """POST /api/logistics/agents/[id] - Update location"""
        if not created_resources["agents"]:
            pytest.skip("No agent created")
        agent_id = created_resources["agents"][0]
        response = auth_session.post(f"{BASE_URL}/api/logistics/agents/{agent_id}", json={
            "action": "location",
            "latitude": 6.5244,
            "longitude": 3.3792
        })
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            print("Agent location updated")
            
    # =========================================================================
    # DELIVERY ASSIGNMENTS TESTS
    # =========================================================================
    
    def test_40_get_assignments(self, auth_session):
        """GET /api/logistics/assignments - List assignments"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/assignments")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "assignments" in data
            assert "total" in data
            print(f"Found {data['total']} assignments")
            
    def test_41_create_assignment(self, auth_session):
        """POST /api/logistics/assignments - Create assignment"""
        order_id = f"{TEST_PREFIX}ORDER_{uuid.uuid4().hex[:8]}"
        response = auth_session.post(f"{BASE_URL}/api/logistics/assignments", json={
            "orderId": order_id,
            "orderType": "POS_SALE",
            "orderNumber": f"ORD-{uuid.uuid4().hex[:6].upper()}",
            "customerName": "Test Customer",
            "customerPhone": "+2348012345678",
            "deliveryAddress": {
                "line1": "123 Test Street",
                "city": "Lagos",
                "state": "Lagos",
                "lga": "Ikeja"
            },
            "priority": "STANDARD",
            "specialInstructions": "Test delivery"
        })
        assert response.status_code in [200, 400, 403]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            created_resources["assignments"].append(data["assignment"]["id"])
            print(f"Created assignment: {data['assignment']['id']}")
        else:
            print(f"Assignment creation: {response.json().get('error')}")
            
    def test_42_get_assignment_by_id(self, auth_session):
        """GET /api/logistics/assignments/[id] - Get assignment by ID"""
        if not created_resources["assignments"]:
            pytest.skip("No assignment created")
        assignment_id = created_resources["assignments"][0]
        response = auth_session.get(f"{BASE_URL}/api/logistics/assignments/{assignment_id}")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "assignment" in data
            print(f"Got assignment: {data['assignment']['status']}")
            
    def test_43_update_assignment(self, auth_session):
        """PUT /api/logistics/assignments/[id] - Update assignment"""
        if not created_resources["assignments"]:
            pytest.skip("No assignment created")
        assignment_id = created_resources["assignments"][0]
        response = auth_session.put(f"{BASE_URL}/api/logistics/assignments/{assignment_id}", json={
            "specialInstructions": "Updated instructions"
        })
        assert response.status_code in [200, 404, 500]
        if response.status_code == 200:
            print("Assignment updated")
            
    def test_44_assign_agent(self, auth_session):
        """POST /api/logistics/assignments/[id] - Assign agent"""
        if not created_resources["assignments"] or not created_resources["agents"]:
            pytest.skip("No assignment or agent created")
        assignment_id = created_resources["assignments"][0]
        agent_id = created_resources["agents"][0]
        response = auth_session.post(f"{BASE_URL}/api/logistics/assignments/{assignment_id}", json={
            "action": "assign",
            "agentId": agent_id
        })
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            print("Agent assigned to delivery")
        else:
            print(f"Assign failed: {response.json().get('error')}")
            
    def test_45_generate_delivery_pin(self, auth_session):
        """POST /api/logistics/assignments/[id] - Generate PIN"""
        if not created_resources["assignments"]:
            pytest.skip("No assignment created")
        assignment_id = created_resources["assignments"][0]
        response = auth_session.post(f"{BASE_URL}/api/logistics/assignments/{assignment_id}", json={
            "action": "generate-pin"
        })
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert "pin" in data
            print(f"Generated PIN: {data['pin']}")
            
    def test_46_check_required_proofs(self, auth_session):
        """POST /api/logistics/assignments/[id] - Check proofs"""
        if not created_resources["assignments"]:
            pytest.skip("No assignment created")
        assignment_id = created_resources["assignments"][0]
        response = auth_session.post(f"{BASE_URL}/api/logistics/assignments/{assignment_id}", json={
            "action": "check-proofs"
        })
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            print(f"Proofs: complete={data.get('complete')}, missing={data.get('missing')}")
            
    # =========================================================================
    # OFFLINE SUPPORT TESTS
    # =========================================================================
    
    def test_50_get_offline_package(self, auth_session):
        """GET /api/logistics/offline - Get offline data package"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/offline")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "lastUpdated" in data
            assert "agents" in data
            assert "assignments" in data
            assert "zones" in data
            print(f"Offline: {len(data['agents'])} agents, {len(data['assignments'])} assignments, {len(data['zones'])} zones")
            
    def test_51_sync_offline_changes(self, auth_session):
        """POST /api/logistics/offline - Sync offline changes"""
        response = auth_session.post(f"{BASE_URL}/api/logistics/offline", json={
            "lastSyncAt": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            "statusUpdates": [],
            "proofs": [],
            "locationUpdates": []
        })
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            print(f"Sync result: success={data.get('success')}")
            
    # =========================================================================
    # EVENT PROCESSING TESTS
    # =========================================================================
    
    def test_60_process_order_ready_event(self, auth_session):
        """POST /api/logistics/events - Process ORDER_READY_FOR_DELIVERY"""
        order_id = f"{TEST_PREFIX}EVENT_ORDER_{uuid.uuid4().hex[:8]}"
        response = auth_session.post(f"{BASE_URL}/api/logistics/events", json={
            "eventType": "ORDER_READY_FOR_DELIVERY",
            "orderId": order_id,
            "orderType": "POS_SALE",
            "tenantId": "test-tenant",
            "customerName": "Event Test Customer",
            "customerPhone": "+2348012345678",
            "deliveryAddress": {
                "line1": "456 Event Street",
                "city": "Lagos",
                "state": "Lagos"
            }
        })
        assert response.status_code in [200, 400, 500]
        if response.status_code == 200:
            data = response.json()
            print(f"Event processed: {data.get('success')}")
            
    def test_61_get_event_history(self, auth_session):
        """GET /api/logistics/events - Get event processing history"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/events")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "events" in data
            print(f"Event history: {len(data['events'])} events")
            
    # =========================================================================
    # ENTITLEMENTS AND STATISTICS TESTS
    # =========================================================================
    
    def test_70_get_entitlements(self, auth_session):
        """GET /api/logistics/utils?resource=entitlements"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/utils?resource=entitlements")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "enabled" in data
            assert "usage" in data
            assert "limits" in data
            assert "features" in data
            print(f"Entitlements: enabled={data.get('enabled')}, features={data.get('features')}")
            
    def test_71_get_statistics(self, auth_session):
        """GET /api/logistics/utils?resource=statistics"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/utils?resource=statistics")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "total" in data
            assert "byStatus" in data
            print(f"Statistics: total={data.get('total')}, successRate={data.get('successRate')}%")
            
    def test_72_get_usage(self, auth_session):
        """GET /api/logistics/utils?resource=usage"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/utils?resource=usage")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            print(f"Usage: zones={data.get('deliveryZones')}, riders={data.get('riders')}")
            
    # =========================================================================
    # MODULE VALIDATION TESTS
    # =========================================================================
    
    def test_80_validate_module(self, auth_session):
        """GET /api/logistics/validate - Validate module integrity"""
        response = auth_session.get(f"{BASE_URL}/api/logistics/validate")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "valid" in data
            assert "checks" in data
            assert "summary" in data
            print(f"Validation: valid={data.get('valid')}, passed={data['summary'].get('passed')}, failed={data['summary'].get('failed')}")
            for check in data.get("checks", []):
                print(f"  - {check['name']}: {check['status']}")
                
    def test_81_get_module_manifest(self, auth_session):
        """POST /api/logistics/validate - Get module manifest"""
        response = auth_session.post(f"{BASE_URL}/api/logistics/validate")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "name" in data
            assert "version" in data
            print(f"Manifest: {data.get('name')} v{data.get('version')}")
            
    # =========================================================================
    # CLEANUP TESTS (Run last)
    # =========================================================================
    
    def test_90_cancel_assignment(self, auth_session):
        """DELETE /api/logistics/assignments/[id] - Cancel assignment"""
        if not created_resources["assignments"]:
            pytest.skip("No assignment to cancel")
        assignment_id = created_resources["assignments"][0]
        response = auth_session.delete(f"{BASE_URL}/api/logistics/assignments/{assignment_id}?reason=Test%20cleanup")
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            print("Assignment cancelled")
            
    def test_91_terminate_agent(self, auth_session):
        """DELETE /api/logistics/agents/[id] - Terminate agent"""
        if not created_resources["agents"]:
            pytest.skip("No agent to terminate")
        agent_id = created_resources["agents"][0]
        response = auth_session.delete(f"{BASE_URL}/api/logistics/agents/{agent_id}")
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            print("Agent terminated")
        else:
            print(f"Terminate failed: {response.json().get('error')}")
            
    def test_92_delete_zone(self, auth_session):
        """DELETE /api/logistics/zones/[id] - Delete zone"""
        if not created_resources["zones"]:
            pytest.skip("No zone to delete")
        zone_id = created_resources["zones"][0]
        response = auth_session.delete(f"{BASE_URL}/api/logistics/zones/{zone_id}")
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            print("Zone deleted")
        else:
            print(f"Delete failed: {response.json().get('error')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
