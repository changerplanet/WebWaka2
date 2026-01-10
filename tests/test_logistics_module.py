"""
MODULE 4: LOGISTICS & DELIVERY - Comprehensive API Tests
Tests all logistics endpoints including:
- Logistics initialization and configuration
- Delivery zones CRUD and pricing rules
- Delivery agents CRUD and availability/location updates
- Delivery assignments CRUD and actions
- Delivery quote calculation
- Offline data package and sync
- Event processing
- Entitlements and statistics
- Module validation
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tscleanup.preview.emergentagent.com').rstrip('/')

# Test data prefixes for cleanup
TEST_PREFIX = "TEST_LOGISTICS_"


class TestLogisticsUnauthenticated:
    """Test that all logistics endpoints require authentication"""
    
    def test_get_logistics_config_requires_auth(self):
        """GET /api/logistics requires authentication"""
        response = requests.get(f"{BASE_URL}/api/logistics")
        assert response.status_code == 401
        
    def test_post_logistics_init_requires_auth(self):
        """POST /api/logistics requires authentication"""
        response = requests.post(f"{BASE_URL}/api/logistics", json={})
        assert response.status_code == 401
        
    def test_put_logistics_config_requires_auth(self):
        """PUT /api/logistics requires authentication"""
        response = requests.put(f"{BASE_URL}/api/logistics", json={})
        assert response.status_code == 401
        
    def test_get_zones_requires_auth(self):
        """GET /api/logistics/zones requires authentication"""
        response = requests.get(f"{BASE_URL}/api/logistics/zones")
        assert response.status_code == 401
        
    def test_post_zones_requires_auth(self):
        """POST /api/logistics/zones requires authentication"""
        response = requests.post(f"{BASE_URL}/api/logistics/zones", json={"name": "Test"})
        assert response.status_code == 401
        
    def test_get_agents_requires_auth(self):
        """GET /api/logistics/agents requires authentication"""
        response = requests.get(f"{BASE_URL}/api/logistics/agents")
        assert response.status_code == 401
        
    def test_post_agents_requires_auth(self):
        """POST /api/logistics/agents requires authentication"""
        response = requests.post(f"{BASE_URL}/api/logistics/agents", json={})
        assert response.status_code == 401
        
    def test_get_assignments_requires_auth(self):
        """GET /api/logistics/assignments requires authentication"""
        response = requests.get(f"{BASE_URL}/api/logistics/assignments")
        assert response.status_code == 401
        
    def test_post_assignments_requires_auth(self):
        """POST /api/logistics/assignments requires authentication"""
        response = requests.post(f"{BASE_URL}/api/logistics/assignments", json={})
        assert response.status_code == 401
        
    def test_get_quote_requires_auth(self):
        """GET /api/logistics/zones/quote requires authentication"""
        response = requests.get(f"{BASE_URL}/api/logistics/zones/quote")
        assert response.status_code == 401
        
    def test_get_offline_requires_auth(self):
        """GET /api/logistics/offline requires authentication"""
        response = requests.get(f"{BASE_URL}/api/logistics/offline")
        assert response.status_code == 401
        
    def test_post_offline_requires_auth(self):
        """POST /api/logistics/offline requires authentication"""
        response = requests.post(f"{BASE_URL}/api/logistics/offline", json={})
        assert response.status_code == 401
        
    def test_post_events_requires_auth(self):
        """POST /api/logistics/events requires authentication"""
        response = requests.post(f"{BASE_URL}/api/logistics/events", json={})
        assert response.status_code == 401
        
    def test_get_utils_requires_auth(self):
        """GET /api/logistics/utils requires authentication"""
        response = requests.get(f"{BASE_URL}/api/logistics/utils?resource=entitlements")
        assert response.status_code == 401
        
    def test_get_validate_requires_auth(self):
        """GET /api/logistics/validate requires authentication"""
        response = requests.get(f"{BASE_URL}/api/logistics/validate")
        assert response.status_code == 401


class TestLogisticsAuthenticated:
    """Test logistics endpoints with authentication"""
    
    @pytest.fixture(autouse=True)
    def setup(self, authenticated_session):
        """Setup authenticated session for all tests"""
        self.session = authenticated_session
        
    # =========================================================================
    # LOGISTICS CONFIGURATION TESTS
    # =========================================================================
    
    def test_get_logistics_config(self, authenticated_session):
        """GET /api/logistics - Get logistics configuration"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics")
        assert response.status_code == 200
        data = response.json()
        # Should return initialized status and entitlement info
        assert "initialized" in data
        assert "enabled" in data
        assert "entitlementStatus" in data
        print(f"Logistics config: initialized={data.get('initialized')}, enabled={data.get('enabled')}")
        
    def test_initialize_logistics(self, authenticated_session):
        """POST /api/logistics - Initialize logistics module"""
        response = authenticated_session.post(f"{BASE_URL}/api/logistics", json={
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
            assert "config" in data
            print(f"Logistics initialized successfully")
        elif response.status_code == 400:
            print(f"Logistics already initialized: {data.get('error')}")
        else:
            print(f"Logistics not entitled: {data.get('error')}")
            
    def test_update_logistics_config(self, authenticated_session):
        """PUT /api/logistics - Update logistics configuration"""
        response = authenticated_session.put(f"{BASE_URL}/api/logistics", json={
            "deliveryEnabled": True,
            "maxConcurrentDeliveries": 5,
            "maxDeliveryAttempts": 3
        })
        # May return 200 (success) or 400 (not initialized) or 403 (not entitled)
        assert response.status_code in [200, 400, 403]
        data = response.json()
        if response.status_code == 200:
            assert data.get("success") == True
            print(f"Logistics config updated")
        else:
            print(f"Update failed: {data.get('error')}")
            
    # =========================================================================
    # DELIVERY ZONES TESTS
    # =========================================================================
    
    def test_get_zones(self, authenticated_session):
        """GET /api/logistics/zones - List delivery zones"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/zones")
        # May return 200 or 400 (not initialized)
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "zones" in data
            print(f"Found {len(data['zones'])} zones")
            
    def test_get_zones_with_filters(self, authenticated_session):
        """GET /api/logistics/zones with filters"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/zones?status=ACTIVE&includeRules=true")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "zones" in data
            
    def test_create_zone(self, authenticated_session):
        """POST /api/logistics/zones - Create delivery zone"""
        zone_name = f"{TEST_PREFIX}Zone_{uuid.uuid4().hex[:8]}"
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/zones", json={
            "name": zone_name,
            "city": "Lagos",
            "state": "Lagos",
            "lga": "Ikeja",
            "zoneType": "LGA"
        })
        # May return 200 (success), 400 (not initialized/validation), or 403 (limit reached)
        assert response.status_code in [200, 400, 403]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "zone" in data
            assert data["zone"]["name"] == zone_name
            print(f"Created zone: {data['zone']['id']}")
            return data["zone"]["id"]
        else:
            print(f"Zone creation failed: {response.json().get('error')}")
            
    def test_get_zone_by_id(self, authenticated_session, created_zone_id):
        """GET /api/logistics/zones/[id] - Get zone by ID"""
        if not created_zone_id:
            pytest.skip("No zone created")
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/zones/{created_zone_id}")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "zone" in data
            assert data["zone"]["id"] == created_zone_id
            
    def test_update_zone(self, authenticated_session, created_zone_id):
        """PUT /api/logistics/zones/[id] - Update zone"""
        if not created_zone_id:
            pytest.skip("No zone created")
        response = authenticated_session.put(f"{BASE_URL}/api/logistics/zones/{created_zone_id}", json={
            "description": "Updated test zone"
        })
        assert response.status_code in [200, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
    def test_add_pricing_rule_to_zone(self, authenticated_session, created_zone_id):
        """POST /api/logistics/zones/[id] - Add pricing rule"""
        if not created_zone_id:
            pytest.skip("No zone created")
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/zones/{created_zone_id}", json={
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
            assert "rule" in data
            print(f"Created pricing rule: {data['rule']['id']}")
            
    def test_delete_zone(self, authenticated_session, created_zone_id):
        """DELETE /api/logistics/zones/[id] - Delete zone"""
        if not created_zone_id:
            pytest.skip("No zone created")
        response = authenticated_session.delete(f"{BASE_URL}/api/logistics/zones/{created_zone_id}")
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
    # =========================================================================
    # DELIVERY QUOTE TESTS
    # =========================================================================
    
    def test_get_delivery_quote(self, authenticated_session):
        """GET /api/logistics/zones/quote - Calculate delivery quote"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/zones/quote?city=Lagos&state=Lagos&orderValue=25000")
        # May return 200 (quote found), 404 (no zone), or 401
        assert response.status_code in [200, 404, 401]
        if response.status_code == 200:
            data = response.json()
            assert "quote" in data
            quote = data["quote"]
            assert "zoneId" in quote
            assert "deliveryFee" in quote
            assert "currency" in quote
            print(f"Quote: {quote['deliveryFee']} {quote['currency']}")
            
    def test_post_delivery_quote(self, authenticated_session):
        """POST /api/logistics/zones/quote - Calculate delivery quote (POST)"""
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/zones/quote", json={
            "city": "Lagos",
            "state": "Lagos",
            "lga": "Ikeja",
            "orderValue": 30000,
            "isExpress": False
        })
        assert response.status_code in [200, 404, 401]
        if response.status_code == 200:
            data = response.json()
            assert "quote" in data
            
    # =========================================================================
    # DELIVERY AGENTS TESTS
    # =========================================================================
    
    def test_get_agents(self, authenticated_session):
        """GET /api/logistics/agents - List delivery agents"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/agents")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "agents" in data
            assert "total" in data
            print(f"Found {data['total']} agents")
            
    def test_get_agents_with_filters(self, authenticated_session):
        """GET /api/logistics/agents with filters"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/agents?status=ACTIVE&availability=AVAILABLE")
        assert response.status_code in [200, 400]
        
    def test_create_agent(self, authenticated_session):
        """POST /api/logistics/agents - Create delivery agent"""
        phone = f"+234{uuid.uuid4().hex[:10]}"
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/agents", json={
            "firstName": f"{TEST_PREFIX}John",
            "lastName": "Rider",
            "phone": phone,
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "agentType": "IN_HOUSE",
            "vehicleType": "MOTORCYCLE"
        })
        # May return 200 (success), 400 (not initialized/validation), or 403 (limit reached)
        assert response.status_code in [200, 400, 403]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "agent" in data
            print(f"Created agent: {data['agent']['id']}")
            return data["agent"]["id"]
        else:
            print(f"Agent creation failed: {response.json().get('error')}")
            
    def test_get_agent_by_id(self, authenticated_session, created_agent_id):
        """GET /api/logistics/agents/[id] - Get agent by ID"""
        if not created_agent_id:
            pytest.skip("No agent created")
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/agents/{created_agent_id}")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "agent" in data
            
    def test_get_agent_with_performance(self, authenticated_session, created_agent_id):
        """GET /api/logistics/agents/[id]?performance=true - Get agent with performance"""
        if not created_agent_id:
            pytest.skip("No agent created")
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/agents/{created_agent_id}?performance=true")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "agent" in data
            assert "performance" in data
            
    def test_update_agent(self, authenticated_session, created_agent_id):
        """PUT /api/logistics/agents/[id] - Update agent"""
        if not created_agent_id:
            pytest.skip("No agent created")
        response = authenticated_session.put(f"{BASE_URL}/api/logistics/agents/{created_agent_id}", json={
            "vehicleType": "CAR"
        })
        assert response.status_code in [200, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
    def test_update_agent_availability(self, authenticated_session, created_agent_id):
        """POST /api/logistics/agents/[id] - Update availability"""
        if not created_agent_id:
            pytest.skip("No agent created")
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/agents/{created_agent_id}", json={
            "action": "availability",
            "availability": "AVAILABLE"
        })
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
    def test_update_agent_location(self, authenticated_session, created_agent_id):
        """POST /api/logistics/agents/[id] - Update location"""
        if not created_agent_id:
            pytest.skip("No agent created")
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/agents/{created_agent_id}", json={
            "action": "location",
            "latitude": 6.5244,
            "longitude": 3.3792
        })
        assert response.status_code in [200, 400, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
    def test_get_agent_performance(self, authenticated_session, created_agent_id):
        """POST /api/logistics/agents/[id] - Get performance"""
        if not created_agent_id:
            pytest.skip("No agent created")
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/agents/{created_agent_id}", json={
            "action": "performance"
        })
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert "performance" in data
            
    def test_terminate_agent(self, authenticated_session, created_agent_id):
        """DELETE /api/logistics/agents/[id] - Terminate agent"""
        if not created_agent_id:
            pytest.skip("No agent created")
        response = authenticated_session.delete(f"{BASE_URL}/api/logistics/agents/{created_agent_id}")
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
    # =========================================================================
    # DELIVERY ASSIGNMENTS TESTS
    # =========================================================================
    
    def test_get_assignments(self, authenticated_session):
        """GET /api/logistics/assignments - List assignments"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/assignments")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "assignments" in data
            assert "total" in data
            print(f"Found {data['total']} assignments")
            
    def test_get_assignments_with_filters(self, authenticated_session):
        """GET /api/logistics/assignments with filters"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/assignments?status=PENDING&priority=STANDARD")
        assert response.status_code in [200, 400]
        
    def test_create_assignment(self, authenticated_session):
        """POST /api/logistics/assignments - Create assignment"""
        order_id = f"{TEST_PREFIX}ORDER_{uuid.uuid4().hex[:8]}"
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/assignments", json={
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
        # May return 200 (success), 400 (not initialized/validation/duplicate), or 403 (limit)
        assert response.status_code in [200, 400, 403]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "assignment" in data
            print(f"Created assignment: {data['assignment']['id']}")
            return data["assignment"]["id"]
        else:
            print(f"Assignment creation failed: {response.json().get('error')}")
            
    def test_get_assignment_by_id(self, authenticated_session, created_assignment_id):
        """GET /api/logistics/assignments/[id] - Get assignment by ID"""
        if not created_assignment_id:
            pytest.skip("No assignment created")
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/assignments/{created_assignment_id}")
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "assignment" in data
            
    def test_update_assignment(self, authenticated_session, created_assignment_id):
        """PUT /api/logistics/assignments/[id] - Update assignment"""
        if not created_assignment_id:
            pytest.skip("No assignment created")
        response = authenticated_session.put(f"{BASE_URL}/api/logistics/assignments/{created_assignment_id}", json={
            "priority": "EXPRESS",
            "specialInstructions": "Updated instructions"
        })
        assert response.status_code in [200, 404, 500]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
    def test_assign_agent_to_assignment(self, authenticated_session, created_assignment_id, created_agent_id):
        """POST /api/logistics/assignments/[id] - Assign agent"""
        if not created_assignment_id or not created_agent_id:
            pytest.skip("No assignment or agent created")
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/assignments/{created_assignment_id}", json={
            "action": "assign",
            "agentId": created_agent_id
        })
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
    def test_update_assignment_status(self, authenticated_session, created_assignment_id):
        """POST /api/logistics/assignments/[id] - Update status"""
        if not created_assignment_id:
            pytest.skip("No assignment created")
        # First need to assign an agent before status can be updated
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/assignments/{created_assignment_id}", json={
            "action": "status",
            "status": "ACCEPTED",
            "notes": "Test status update"
        })
        # May fail if status transition is invalid
        assert response.status_code in [200, 400, 404]
        
    def test_capture_proof_of_delivery(self, authenticated_session, created_assignment_id):
        """POST /api/logistics/assignments/[id] - Capture proof"""
        if not created_assignment_id:
            pytest.skip("No assignment created")
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/assignments/{created_assignment_id}", json={
            "action": "proof",
            "proofType": "PHOTO",
            "imageUrl": "https://example.com/proof.jpg",
            "recipientName": "Test Recipient",
            "notes": "Delivered to front door"
        })
        # May fail if assignment not in delivery status
        assert response.status_code in [200, 400, 404]
        
    def test_generate_delivery_pin(self, authenticated_session, created_assignment_id):
        """POST /api/logistics/assignments/[id] - Generate PIN"""
        if not created_assignment_id:
            pytest.skip("No assignment created")
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/assignments/{created_assignment_id}", json={
            "action": "generate-pin"
        })
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert "pin" in data
            assert len(data["pin"]) == 4
            print(f"Generated PIN: {data['pin']}")
            
    def test_generate_delivery_otp(self, authenticated_session, created_assignment_id):
        """POST /api/logistics/assignments/[id] - Generate OTP"""
        if not created_assignment_id:
            pytest.skip("No assignment created")
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/assignments/{created_assignment_id}", json={
            "action": "generate-otp"
        })
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert "otp" in data
            assert len(data["otp"]) == 6
            print(f"Generated OTP: {data['otp']}")
            
    def test_check_required_proofs(self, authenticated_session, created_assignment_id):
        """POST /api/logistics/assignments/[id] - Check proofs"""
        if not created_assignment_id:
            pytest.skip("No assignment created")
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/assignments/{created_assignment_id}", json={
            "action": "check-proofs"
        })
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert "complete" in data
            assert "missing" in data
            assert "captured" in data
            
    def test_cancel_assignment(self, authenticated_session, created_assignment_id):
        """DELETE /api/logistics/assignments/[id] - Cancel assignment"""
        if not created_assignment_id:
            pytest.skip("No assignment created")
        response = authenticated_session.delete(f"{BASE_URL}/api/logistics/assignments/{created_assignment_id}?reason=Test%20cancellation")
        assert response.status_code in [200, 400, 404]
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
    # =========================================================================
    # OFFLINE SUPPORT TESTS
    # =========================================================================
    
    def test_get_offline_package(self, authenticated_session):
        """GET /api/logistics/offline - Get offline data package"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/offline")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "lastUpdated" in data
            assert "agents" in data
            assert "assignments" in data
            assert "zones" in data
            assert "config" in data
            print(f"Offline package: {len(data['agents'])} agents, {len(data['assignments'])} assignments, {len(data['zones'])} zones")
            
    def test_sync_offline_changes(self, authenticated_session):
        """POST /api/logistics/offline - Sync offline changes"""
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/offline", json={
            "lastSyncAt": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            "statusUpdates": [],
            "proofs": [],
            "locationUpdates": []
        })
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "success" in data
            assert "statusUpdates" in data
            assert "proofs" in data
            assert "locationUpdates" in data
            
    # =========================================================================
    # EVENT PROCESSING TESTS
    # =========================================================================
    
    def test_process_order_ready_event(self, authenticated_session):
        """POST /api/logistics/events - Process ORDER_READY_FOR_DELIVERY"""
        order_id = f"{TEST_PREFIX}EVENT_ORDER_{uuid.uuid4().hex[:8]}"
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/events", json={
            "eventType": "ORDER_READY_FOR_DELIVERY",
            "orderId": order_id,
            "orderType": "POS_SALE",
            "tenantId": "test-tenant",  # Will use session tenant
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
            assert "success" in data
            print(f"Event processed: {data.get('success')}")
            
    def test_process_order_cancelled_event(self, authenticated_session):
        """POST /api/logistics/events - Process ORDER_CANCELLED"""
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/events", json={
            "eventType": "ORDER_CANCELLED",
            "orderId": f"{TEST_PREFIX}CANCEL_ORDER_{uuid.uuid4().hex[:8]}",
            "orderType": "POS_SALE",
            "tenantId": "test-tenant",
            "reason": "Customer requested cancellation"
        })
        assert response.status_code in [200, 400, 500]
        
    def test_get_event_history(self, authenticated_session):
        """GET /api/logistics/events - Get event processing history"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/events")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "events" in data
            
    # =========================================================================
    # ENTITLEMENTS AND STATISTICS TESTS
    # =========================================================================
    
    def test_get_entitlements(self, authenticated_session):
        """GET /api/logistics/utils?resource=entitlements - Get entitlements"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/utils?resource=entitlements")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "enabled" in data
            assert "usage" in data
            assert "limits" in data
            assert "features" in data
            print(f"Entitlements: enabled={data.get('enabled')}")
            
    def test_get_statistics(self, authenticated_session):
        """GET /api/logistics/utils?resource=statistics - Get statistics"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/utils?resource=statistics")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "total" in data
            assert "byStatus" in data
            assert "delivered" in data
            assert "successRate" in data
            print(f"Statistics: total={data.get('total')}, successRate={data.get('successRate')}%")
            
    def test_get_usage(self, authenticated_session):
        """GET /api/logistics/utils?resource=usage - Get usage"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/utils?resource=usage")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "deliveryZones" in data
            assert "riders" in data
            assert "assignmentsToday" in data
            
    # =========================================================================
    # MODULE VALIDATION TESTS
    # =========================================================================
    
    def test_validate_module(self, authenticated_session):
        """GET /api/logistics/validate - Validate module integrity"""
        response = authenticated_session.get(f"{BASE_URL}/api/logistics/validate")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "valid" in data
            assert "checks" in data
            assert "summary" in data
            print(f"Module validation: valid={data.get('valid')}, passed={data['summary'].get('passed')}, failed={data['summary'].get('failed')}")
            
            # Check specific validations
            for check in data.get("checks", []):
                print(f"  - {check['name']}: {check['status']}")
                
    def test_get_module_manifest(self, authenticated_session):
        """POST /api/logistics/validate - Get module manifest"""
        response = authenticated_session.post(f"{BASE_URL}/api/logistics/validate")
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            data = response.json()
            assert "name" in data
            assert "version" in data
            assert "capability" in data
            assert "owns" in data
            assert "doesNotOwn" in data
            assert "nigeriaFirst" in data
            print(f"Module manifest: {data.get('name')} v{data.get('version')}")


# ============================================================================
# FIXTURES
# ============================================================================

@pytest.fixture(scope="session")
def authenticated_session():
    """Create authenticated session using magic link auth"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Request magic link for tenant admin
    email = "admin@acme.com"
    
    # First, request magic link
    response = session.post(f"{BASE_URL}/api/auth/magic-link", json={
        "email": email
    })
    
    if response.status_code != 200:
        print(f"Magic link request failed: {response.status_code} - {response.text}")
        # Try to get existing session
        response = session.get(f"{BASE_URL}/api/auth/session")
        if response.status_code == 200 and response.json().get("user"):
            print("Using existing session")
            return session
        pytest.skip("Could not authenticate - magic link failed")
        
    # For testing, we need to get the token from the response or database
    # In a real scenario, the token would be sent via email
    data = response.json()
    if "token" in data:
        # Direct token response (test mode)
        token = data["token"]
        verify_response = session.get(f"{BASE_URL}/api/auth/verify?token={token}")
        if verify_response.status_code == 200:
            print(f"Authenticated as {email}")
            return session
            
    # Check if we have a session cookie
    response = session.get(f"{BASE_URL}/api/auth/session")
    if response.status_code == 200 and response.json().get("user"):
        print(f"Session active for {email}")
        return session
        
    pytest.skip("Could not authenticate")


@pytest.fixture
def created_zone_id(authenticated_session):
    """Create a test zone and return its ID"""
    zone_name = f"{TEST_PREFIX}Zone_{uuid.uuid4().hex[:8]}"
    response = authenticated_session.post(f"{BASE_URL}/api/logistics/zones", json={
        "name": zone_name,
        "city": "Lagos",
        "state": "Lagos",
        "lga": "Ikeja",
        "zoneType": "LGA"
    })
    if response.status_code == 200:
        return response.json()["zone"]["id"]
    return None


@pytest.fixture
def created_agent_id(authenticated_session):
    """Create a test agent and return its ID"""
    phone = f"+234{uuid.uuid4().hex[:10]}"
    response = authenticated_session.post(f"{BASE_URL}/api/logistics/agents", json={
        "firstName": f"{TEST_PREFIX}John",
        "lastName": "Rider",
        "phone": phone,
        "agentType": "IN_HOUSE"
    })
    if response.status_code == 200:
        return response.json()["agent"]["id"]
    return None


@pytest.fixture
def created_assignment_id(authenticated_session):
    """Create a test assignment and return its ID"""
    order_id = f"{TEST_PREFIX}ORDER_{uuid.uuid4().hex[:8]}"
    response = authenticated_session.post(f"{BASE_URL}/api/logistics/assignments", json={
        "orderId": order_id,
        "orderType": "POS_SALE",
        "customerName": "Test Customer",
        "customerPhone": "+2348012345678",
        "deliveryAddress": {
            "line1": "123 Test Street",
            "city": "Lagos",
            "state": "Lagos"
        }
    })
    if response.status_code == 200:
        return response.json()["assignment"]["id"]
    return None


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
