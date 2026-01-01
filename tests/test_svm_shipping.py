"""
SVM Shipping & Delivery Rules API Tests - Phase 4
Tests for shipping zone management and shipping calculation APIs

Features tested:
- POST /api/svm/shipping - Calculate shipping options for destination
- GET /api/svm/shipping?tenantId=xxx - List shipping zones
- POST /api/svm/shipping/zones - Create new zone
- PUT /api/svm/shipping/zones/:zoneId - Update zone and rates
- GET /api/svm/shipping/zones/:zoneId - Get zone details
- DELETE /api/svm/shipping/zones/:zoneId - Delete zone
- City-based zone matching
- Country-based zone matching (US, CA)
- Default zone fallback (International)
- Free shipping threshold ($50 for US, $75 for CA)
- Multiple shipping rates per zone
- Delivery time estimates
- Cheapest and fastest option identification
- Weight-based calculations
"""

import pytest
import requests
import os
import uuid

# Base URL from environment
BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://ecommerce-hub-320.preview.emergentagent.com').rstrip('/')


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def test_tenant_id():
    """Generate unique tenant ID for test isolation"""
    return f"TEST_tenant_{uuid.uuid4().hex[:8]}"


class TestShippingZonesListing:
    """Tests for GET /api/svm/shipping - List shipping zones"""
    
    def test_list_zones_success(self, api_client, test_tenant_id):
        """Test listing shipping zones returns default zones"""
        response = api_client.get(f"{BASE_URL}/api/svm/shipping", params={"tenantId": test_tenant_id})
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "zones" in data
        assert isinstance(data["zones"], list)
        assert len(data["zones"]) >= 3  # US Domestic, Canada, International
        
        # Verify default zones exist
        zone_names = [z["name"] for z in data["zones"]]
        assert "US Domestic" in zone_names
        assert "Canada" in zone_names
        assert "International" in zone_names
        
        # Verify zone structure
        us_zone = next(z for z in data["zones"] if z["name"] == "US Domestic")
        assert "id" in us_zone
        assert "countries" in us_zone
        assert "US" in us_zone["countries"]
        assert "rates" in us_zone
        assert len(us_zone["rates"]) >= 3  # Standard, Express, Overnight
        
    def test_list_zones_missing_tenant_id(self, api_client):
        """Test listing zones without tenantId returns 400"""
        response = api_client.get(f"{BASE_URL}/api/svm/shipping")
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "tenantId" in data["error"].lower()
        
    def test_list_zones_verify_us_rates(self, api_client, test_tenant_id):
        """Test US zone has correct shipping rates"""
        response = api_client.get(f"{BASE_URL}/api/svm/shipping", params={"tenantId": test_tenant_id})
        
        assert response.status_code == 200
        data = response.json()
        
        us_zone = next(z for z in data["zones"] if z["name"] == "US Domestic")
        rates = us_zone["rates"]
        
        # Verify Standard Shipping
        standard = next((r for r in rates if r["name"] == "Standard Shipping"), None)
        assert standard is not None
        assert standard["flatRate"] == 5.99
        assert standard["freeAbove"] == 50
        assert standard["estimatedDays"]["min"] == 5
        assert standard["estimatedDays"]["max"] == 7
        
        # Verify Express Shipping
        express = next((r for r in rates if r["name"] == "Express Shipping"), None)
        assert express is not None
        assert express["flatRate"] == 12.99
        assert express["freeAbove"] == 100
        
        # Verify Overnight
        overnight = next((r for r in rates if r["name"] == "Overnight"), None)
        assert overnight is not None
        assert overnight["flatRate"] == 24.99
        
    def test_list_zones_verify_canada_rates(self, api_client, test_tenant_id):
        """Test Canada zone has correct shipping rates"""
        response = api_client.get(f"{BASE_URL}/api/svm/shipping", params={"tenantId": test_tenant_id})
        
        assert response.status_code == 200
        data = response.json()
        
        ca_zone = next(z for z in data["zones"] if z["name"] == "Canada")
        rates = ca_zone["rates"]
        
        # Verify Standard Shipping
        standard = next((r for r in rates if r["name"] == "Standard Shipping"), None)
        assert standard is not None
        assert standard["flatRate"] == 9.99
        assert standard["freeAbove"] == 75
        
        # Verify Express Shipping
        express = next((r for r in rates if r["name"] == "Express Shipping"), None)
        assert express is not None
        assert express["flatRate"] == 19.99
        
    def test_list_zones_verify_international_rates(self, api_client, test_tenant_id):
        """Test International zone has correct shipping rates"""
        response = api_client.get(f"{BASE_URL}/api/svm/shipping", params={"tenantId": test_tenant_id})
        
        assert response.status_code == 200
        data = response.json()
        
        intl_zone = next(z for z in data["zones"] if z["name"] == "International")
        assert intl_zone["isDefault"] is True
        
        rates = intl_zone["rates"]
        
        # Verify International Standard
        standard = next((r for r in rates if r["name"] == "International Standard"), None)
        assert standard is not None
        assert standard["flatRate"] == 19.99
        
        # Verify International Express
        express = next((r for r in rates if r["name"] == "International Express"), None)
        assert express is not None
        assert express["flatRate"] == 39.99


class TestShippingCalculation:
    """Tests for POST /api/svm/shipping - Calculate shipping options"""
    
    def test_calculate_shipping_us_destination(self, api_client, test_tenant_id):
        """Test shipping calculation for US destination"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {
                "country": "US",
                "state": "CA",
                "city": "Los Angeles",
                "postalCode": "90001"
            },
            "items": [
                {"productId": "prod_1", "quantity": 2, "unitPrice": 15.00}
            ],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["matchedZone"]["name"] == "US Domestic"
        assert len(data["options"]) >= 3
        assert data["itemCount"] == 2
        assert data["subtotal"] == 30.00
        
        # Verify options have required fields
        for option in data["options"]:
            assert "rateId" in option
            assert "rateName" in option
            assert "fee" in option
            assert "isFree" in option
            
    def test_calculate_shipping_us_free_shipping_threshold(self, api_client, test_tenant_id):
        """Test free shipping applies when subtotal >= $50 for US"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 60.00}],
            "subtotal": 60.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Standard shipping should be free (threshold $50)
        standard = next((o for o in data["options"] if o["rateName"] == "Standard Shipping"), None)
        assert standard is not None
        assert standard["fee"] == 0
        assert standard["isFree"] is True
        assert standard["freeShippingApplied"] is True
        assert standard["originalFee"] == 5.99
        
    def test_calculate_shipping_us_below_free_threshold(self, api_client, test_tenant_id):
        """Test shipping fee applies when subtotal < $50 for US"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Standard shipping should NOT be free
        standard = next((o for o in data["options"] if o["rateName"] == "Standard Shipping"), None)
        assert standard is not None
        assert standard["fee"] == 5.99
        assert standard["isFree"] is False
        assert standard["freeShippingApplied"] is False
        assert standard["amountToFreeShipping"] == 20.00  # 50 - 30
        
    def test_calculate_shipping_canada_destination(self, api_client, test_tenant_id):
        """Test shipping calculation for Canada destination"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {
                "country": "CA",
                "state": "ON",
                "city": "Toronto"
            },
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 40.00}],
            "subtotal": 40.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["matchedZone"]["name"] == "Canada"
        assert len(data["options"]) >= 2
        
        # Standard should be $9.99 (below $75 threshold)
        standard = next((o for o in data["options"] if o["rateName"] == "Standard Shipping"), None)
        assert standard is not None
        assert standard["fee"] == 9.99
        
    def test_calculate_shipping_canada_free_shipping(self, api_client, test_tenant_id):
        """Test free shipping applies when subtotal >= $75 for Canada"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "CA"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 80.00}],
            "subtotal": 80.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Standard shipping should be free (threshold $75)
        standard = next((o for o in data["options"] if o["rateName"] == "Standard Shipping"), None)
        assert standard is not None
        assert standard["fee"] == 0
        assert standard["isFree"] is True
        assert standard["freeShippingApplied"] is True
        
    def test_calculate_shipping_international_fallback(self, api_client, test_tenant_id):
        """Test international zone is used for unknown countries"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {
                "country": "GB",  # UK - not US or CA
                "city": "London"
            },
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 50.00}],
            "subtotal": 50.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["matchedZone"]["name"] == "International"
        
        # Verify international rates
        standard = next((o for o in data["options"] if o["rateName"] == "International Standard"), None)
        assert standard is not None
        assert standard["fee"] == 19.99
        
        express = next((o for o in data["options"] if o["rateName"] == "International Express"), None)
        assert express is not None
        assert express["fee"] == 39.99
        
    def test_calculate_shipping_cheapest_option(self, api_client, test_tenant_id):
        """Test cheapest option is correctly identified"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "cheapestOption" in data
        cheapest = data["cheapestOption"]
        assert cheapest["rateName"] == "Standard Shipping"
        assert cheapest["fee"] == 5.99
        
    def test_calculate_shipping_fastest_option(self, api_client, test_tenant_id):
        """Test fastest option is correctly identified"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Fastest should be Overnight (1 day)
        assert "fastestOption" in data
        if data["fastestOption"]:  # May be null if same as cheapest
            fastest = data["fastestOption"]
            assert fastest["rateName"] == "Overnight"
            assert fastest["estimatedDays"]["max"] == 1
            
    def test_calculate_shipping_delivery_estimates(self, api_client, test_tenant_id):
        """Test delivery time estimates are included"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        for option in data["options"]:
            assert "estimatedDays" in option
            if option["estimatedDays"]:
                assert "min" in option["estimatedDays"]
                assert "max" in option["estimatedDays"]
                
    def test_calculate_shipping_with_weight(self, api_client, test_tenant_id):
        """Test weight is calculated from items"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [
                {"productId": "prod_1", "quantity": 2, "unitPrice": 15.00, "weight": 0.5},
                {"productId": "prod_2", "quantity": 1, "unitPrice": 20.00, "weight": 1.0}
            ],
            "subtotal": 50.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Total weight: 2*0.5 + 1*1.0 = 2.0
        assert data["totalWeight"] == 2.0
        assert data["itemCount"] == 3
        
    def test_calculate_shipping_missing_tenant_id(self, api_client):
        """Test calculation without tenantId returns 400"""
        payload = {
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "tenantId" in data["error"].lower()
        
    def test_calculate_shipping_missing_destination(self, api_client, test_tenant_id):
        """Test calculation without destination returns 400"""
        payload = {
            "tenantId": test_tenant_id,
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "destination" in data["error"].lower()
        
    def test_calculate_shipping_missing_items(self, api_client, test_tenant_id):
        """Test calculation without items returns 400"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "items" in data["error"].lower()
        
    def test_calculate_shipping_empty_items(self, api_client, test_tenant_id):
        """Test calculation with empty items array returns 400"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [],
            "subtotal": 0
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        
    def test_calculate_shipping_missing_subtotal(self, api_client, test_tenant_id):
        """Test calculation without subtotal returns 400"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}]
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "subtotal" in data["error"].lower()


class TestShippingZoneCreation:
    """Tests for POST /api/svm/shipping/zones - Create new zone"""
    
    def test_create_zone_success(self, api_client, test_tenant_id):
        """Test creating a new shipping zone"""
        payload = {
            "tenantId": test_tenant_id,
            "name": "TEST_West Coast",
            "description": "West Coast states",
            "countries": ["US"],
            "states": ["CA", "OR", "WA"],
            "isActive": True,
            "priority": 150,
            "rates": [
                {
                    "name": "Local Delivery",
                    "rateType": "FLAT",
                    "flatRate": 3.99,
                    "freeAbove": 25,
                    "minDays": 2,
                    "maxDays": 4,
                    "carrier": "Local"
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping/zones", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["success"] is True
        assert "zone" in data
        zone = data["zone"]
        
        assert zone["name"] == "TEST_West Coast"
        assert zone["countries"] == ["US"]
        assert zone["states"] == ["CA", "OR", "WA"]
        assert zone["priority"] == 150
        assert len(zone["rates"]) == 1
        assert zone["rates"][0]["name"] == "Local Delivery"
        assert zone["rates"][0]["flatRate"] == 3.99
        
    def test_create_zone_missing_tenant_id(self, api_client):
        """Test creating zone without tenantId returns 400"""
        payload = {
            "name": "TEST_Zone"
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping/zones", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        
    def test_create_zone_missing_name(self, api_client, test_tenant_id):
        """Test creating zone without name returns 400"""
        payload = {
            "tenantId": test_tenant_id
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping/zones", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        
    def test_create_zone_with_city_matching(self, api_client, test_tenant_id):
        """Test creating zone with city-based matching"""
        payload = {
            "tenantId": test_tenant_id,
            "name": "TEST_NYC Metro",
            "countries": ["US"],
            "states": ["NY"],
            "cities": ["New York", "Brooklyn", "Queens"],
            "priority": 200,
            "rates": [
                {
                    "name": "Same Day",
                    "rateType": "FLAT",
                    "flatRate": 9.99,
                    "minDays": 0,
                    "maxDays": 1
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping/zones", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        
        zone = data["zone"]
        assert zone["cities"] == ["New York", "Brooklyn", "Queens"]
        
    def test_create_zone_with_postal_codes(self, api_client, test_tenant_id):
        """Test creating zone with postal code matching"""
        payload = {
            "tenantId": test_tenant_id,
            "name": "TEST_Bay Area",
            "countries": ["US"],
            "postalCodes": ["94*", "95*"],  # Bay Area prefixes
            "priority": 180,
            "rates": [
                {
                    "name": "Express Local",
                    "rateType": "FLAT",
                    "flatRate": 4.99,
                    "minDays": 1,
                    "maxDays": 2
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping/zones", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        
        zone = data["zone"]
        assert zone["postalCodes"] == ["94*", "95*"]


class TestShippingZoneUpdate:
    """Tests for PUT /api/svm/shipping/zones/:zoneId - Update zone"""
    
    @pytest.fixture
    def created_zone(self, api_client, test_tenant_id):
        """Create a zone for update tests"""
        payload = {
            "tenantId": test_tenant_id,
            "name": "TEST_Update Zone",
            "countries": ["US"],
            "states": ["TX"],
            "priority": 120,
            "rates": [
                {
                    "name": "Standard",
                    "rateType": "FLAT",
                    "flatRate": 6.99,
                    "minDays": 3,
                    "maxDays": 5
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping/zones", json=payload)
        return response.json()["zone"]
        
    def test_update_zone_properties(self, api_client, test_tenant_id, created_zone):
        """Test updating zone properties"""
        zone_id = created_zone["id"]
        
        payload = {
            "tenantId": test_tenant_id,
            "action": "UPDATE_ZONE",
            "name": "TEST_Updated Zone Name",
            "description": "Updated description",
            "priority": 130
        }
        
        response = api_client.put(f"{BASE_URL}/api/svm/shipping/zones/{zone_id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["zone"]["name"] == "TEST_Updated Zone Name"
        assert data["zone"]["description"] == "Updated description"
        assert data["zone"]["priority"] == 130
        
    def test_add_rate_to_zone(self, api_client, test_tenant_id, created_zone):
        """Test adding a new rate to existing zone"""
        zone_id = created_zone["id"]
        
        payload = {
            "tenantId": test_tenant_id,
            "action": "ADD_RATE",
            "rate": {
                "name": "Express",
                "rateType": "FLAT",
                "flatRate": 14.99,
                "minDays": 1,
                "maxDays": 2,
                "carrier": "FedEx"
            }
        }
        
        response = api_client.put(f"{BASE_URL}/api/svm/shipping/zones/{zone_id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "rate" in data
        assert data["rate"]["name"] == "Express"
        assert data["rate"]["flatRate"] == 14.99
        
        # Verify zone now has 2 rates
        assert len(data["zone"]["rates"]) == 2
        
    def test_update_rate_in_zone(self, api_client, test_tenant_id, created_zone):
        """Test updating an existing rate"""
        zone_id = created_zone["id"]
        rate_id = created_zone["rates"][0]["id"]
        
        payload = {
            "tenantId": test_tenant_id,
            "action": "UPDATE_RATE",
            "rateId": rate_id,
            "rate": {
                "flatRate": 7.99,
                "freeAbove": 40
            }
        }
        
        response = api_client.put(f"{BASE_URL}/api/svm/shipping/zones/{zone_id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["rate"]["flatRate"] == 7.99
        assert data["rate"]["freeAbove"] == 40
        
    def test_delete_rate_from_zone(self, api_client, test_tenant_id, created_zone):
        """Test deleting a rate from zone"""
        zone_id = created_zone["id"]
        rate_id = created_zone["rates"][0]["id"]
        
        payload = {
            "tenantId": test_tenant_id,
            "action": "DELETE_RATE",
            "rateId": rate_id
        }
        
        response = api_client.put(f"{BASE_URL}/api/svm/shipping/zones/{zone_id}", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert len(data["zone"]["rates"]) == 0
        
    def test_update_zone_not_found(self, api_client, test_tenant_id):
        """Test updating non-existent zone returns 404"""
        payload = {
            "tenantId": test_tenant_id,
            "action": "UPDATE_ZONE",
            "name": "New Name"
        }
        
        response = api_client.put(f"{BASE_URL}/api/svm/shipping/zones/nonexistent_zone", json=payload)
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        
    def test_add_rate_missing_required_fields(self, api_client, test_tenant_id, created_zone):
        """Test adding rate without required fields returns 400"""
        zone_id = created_zone["id"]
        
        payload = {
            "tenantId": test_tenant_id,
            "action": "ADD_RATE",
            "rate": {
                "flatRate": 5.99  # Missing name and rateType
            }
        }
        
        response = api_client.put(f"{BASE_URL}/api/svm/shipping/zones/{zone_id}", json=payload)
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False


class TestShippingZoneGetAndDelete:
    """Tests for GET and DELETE /api/svm/shipping/zones/:zoneId"""
    
    @pytest.fixture
    def created_zone_for_crud(self, api_client, test_tenant_id):
        """Create a zone for CRUD tests"""
        payload = {
            "tenantId": test_tenant_id,
            "name": "TEST_CRUD Zone",
            "countries": ["MX"],
            "priority": 80,
            "rates": [
                {
                    "name": "Mexico Standard",
                    "rateType": "FLAT",
                    "flatRate": 12.99
                }
            ]
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping/zones", json=payload)
        return response.json()["zone"]
        
    def test_get_zone_by_id(self, api_client, test_tenant_id, created_zone_for_crud):
        """Test getting zone details by ID"""
        zone_id = created_zone_for_crud["id"]
        
        response = api_client.get(
            f"{BASE_URL}/api/svm/shipping/zones/{zone_id}",
            params={"tenantId": test_tenant_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["zone"]["id"] == zone_id
        assert data["zone"]["name"] == "TEST_CRUD Zone"
        
    def test_get_zone_not_found(self, api_client, test_tenant_id):
        """Test getting non-existent zone returns 404"""
        response = api_client.get(
            f"{BASE_URL}/api/svm/shipping/zones/nonexistent",
            params={"tenantId": test_tenant_id}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        
    def test_get_zone_missing_tenant_id(self, api_client, created_zone_for_crud):
        """Test getting zone without tenantId returns 400"""
        zone_id = created_zone_for_crud["id"]
        
        response = api_client.get(f"{BASE_URL}/api/svm/shipping/zones/{zone_id}")
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        
    def test_delete_zone(self, api_client, test_tenant_id, created_zone_for_crud):
        """Test deleting a zone"""
        zone_id = created_zone_for_crud["id"]
        
        response = api_client.delete(
            f"{BASE_URL}/api/svm/shipping/zones/{zone_id}",
            params={"tenantId": test_tenant_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["deletedZoneId"] == zone_id
        
        # Verify zone is deleted
        get_response = api_client.get(
            f"{BASE_URL}/api/svm/shipping/zones/{zone_id}",
            params={"tenantId": test_tenant_id}
        )
        assert get_response.status_code == 404
        
    def test_delete_zone_not_found(self, api_client, test_tenant_id):
        """Test deleting non-existent zone returns 404"""
        response = api_client.delete(
            f"{BASE_URL}/api/svm/shipping/zones/nonexistent",
            params={"tenantId": test_tenant_id}
        )
        
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False


class TestZoneMatchingPriority:
    """Tests for zone matching priority and fallback behavior"""
    
    def test_country_zone_priority_over_default(self, api_client, test_tenant_id):
        """Test country-specific zone is matched before default"""
        # US destination should match US Domestic, not International
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["matchedZone"]["name"] == "US Domestic"
        
    def test_default_zone_fallback(self, api_client, test_tenant_id):
        """Test default zone is used for unmatched countries"""
        # Australia should fall back to International
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "AU"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["matchedZone"]["name"] == "International"
        
    def test_case_insensitive_country_matching(self, api_client, test_tenant_id):
        """Test country matching is case-insensitive"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "us"},  # lowercase
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["matchedZone"]["name"] == "US Domestic"


class TestMultipleShippingRates:
    """Tests for multiple shipping rates per zone"""
    
    def test_us_zone_has_three_rates(self, api_client, test_tenant_id):
        """Test US zone returns Standard, Express, and Overnight options"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        rate_names = [o["rateName"] for o in data["options"]]
        assert "Standard Shipping" in rate_names
        assert "Express Shipping" in rate_names
        assert "Overnight" in rate_names
        
    def test_rates_sorted_by_priority(self, api_client, test_tenant_id):
        """Test rates are returned in priority order"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 30.00}],
            "subtotal": 30.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        # Standard should be first (priority 0), then Express (1), then Overnight (2)
        assert data["options"][0]["rateName"] == "Standard Shipping"
        assert data["options"][1]["rateName"] == "Express Shipping"
        assert data["options"][2]["rateName"] == "Overnight"


class TestFreeShippingThresholds:
    """Tests for free shipping threshold behavior"""
    
    def test_us_express_free_above_100(self, api_client, test_tenant_id):
        """Test US Express is free above $100"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 110.00}],
            "subtotal": 110.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        express = next((o for o in data["options"] if o["rateName"] == "Express Shipping"), None)
        assert express is not None
        assert express["fee"] == 0
        assert express["isFree"] is True
        assert express["freeShippingApplied"] is True
        
    def test_overnight_no_free_shipping(self, api_client, test_tenant_id):
        """Test Overnight never has free shipping"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 500.00}],
            "subtotal": 500.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        overnight = next((o for o in data["options"] if o["rateName"] == "Overnight"), None)
        assert overnight is not None
        assert overnight["fee"] == 24.99
        assert overnight["isFree"] is False
        assert overnight.get("freeShippingThreshold") is None
        
    def test_amount_to_free_shipping_calculation(self, api_client, test_tenant_id):
        """Test amountToFreeShipping is correctly calculated"""
        payload = {
            "tenantId": test_tenant_id,
            "destination": {"country": "US"},
            "items": [{"productId": "prod_1", "quantity": 1, "unitPrice": 35.00}],
            "subtotal": 35.00
        }
        
        response = api_client.post(f"{BASE_URL}/api/svm/shipping", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        
        standard = next((o for o in data["options"] if o["rateName"] == "Standard Shipping"), None)
        assert standard is not None
        assert standard["amountToFreeShipping"] == 15.00  # 50 - 35


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
