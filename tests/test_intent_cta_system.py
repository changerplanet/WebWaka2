"""
Test CTA → Intent → Capability Onboarding System
Tests the intent-based signup flow for eMarketWaka
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://site-funnels.preview.emergentagent.com')


class TestIntentDefinitionsAPI:
    """Test intent definitions retrieval"""
    
    def test_get_all_intent_definitions(self):
        """Test fetching all intent definitions"""
        response = requests.get(f"{BASE_URL}/api/intent?action=definitions")
        assert response.status_code == 200
        
        data = response.json()
        assert "intents" in data
        assert "domains" in data
        assert len(data["intents"]) > 0
        
        # Verify expected domains
        expected_domains = ["COMMERCE", "EDUCATION", "HEALTHCARE", "HOSPITALITY", "GENERAL"]
        for domain in expected_domains:
            assert domain in data["domains"]
    
    def test_commerce_intents_present(self):
        """Test that commerce intents are present"""
        response = requests.get(f"{BASE_URL}/api/intent?action=definitions")
        assert response.status_code == 200
        
        data = response.json()
        intent_keys = [i["key"] for i in data["intents"]]
        
        # Verify key commerce intents
        assert "sell_in_store" in intent_keys
        assert "sell_online" in intent_keys
        assert "run_marketplace" in intent_keys
    
    def test_intent_structure(self):
        """Test that intents have correct structure"""
        response = requests.get(f"{BASE_URL}/api/intent?action=definitions")
        assert response.status_code == 200
        
        data = response.json()
        for intent in data["intents"]:
            assert "key" in intent
            assert "domain" in intent
            assert "label" in intent
            assert "description" in intent
            assert "suggestedCapabilities" in intent
            assert isinstance(intent["suggestedCapabilities"], list)


class TestIntentSuggestionsAPI:
    """Test intent suggestions retrieval"""
    
    def test_get_suggestions_sell_in_store(self):
        """Test suggestions for sell_in_store intent"""
        response = requests.get(f"{BASE_URL}/api/intent?action=suggestions&key=sell_in_store")
        assert response.status_code == 200
        
        data = response.json()
        assert data["intentKey"] == "sell_in_store"
        assert "suggestions" in data
        assert "pos" in data["suggestions"]
        assert "inventory" in data["suggestions"]
        assert "accounting" in data["suggestions"]
        assert data["intentLabel"] == "Sell In-Store"
    
    def test_get_suggestions_sell_online(self):
        """Test suggestions for sell_online intent"""
        response = requests.get(f"{BASE_URL}/api/intent?action=suggestions&key=sell_online")
        assert response.status_code == 200
        
        data = response.json()
        assert data["intentKey"] == "sell_online"
        assert "svm" in data["suggestions"]
        assert "inventory" in data["suggestions"]
        assert "crm" in data["suggestions"]
    
    def test_get_suggestions_run_marketplace(self):
        """Test suggestions for run_marketplace intent"""
        response = requests.get(f"{BASE_URL}/api/intent?action=suggestions&key=run_marketplace")
        assert response.status_code == 200
        
        data = response.json()
        assert data["intentKey"] == "run_marketplace"
        assert "mvm" in data["suggestions"]
        assert "payments_wallets" in data["suggestions"]
        assert "analytics" in data["suggestions"]
    
    def test_get_suggestions_missing_key(self):
        """Test suggestions API returns error when key is missing"""
        response = requests.get(f"{BASE_URL}/api/intent?action=suggestions")
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data


class TestIntentCaptureAPI:
    """Test intent capture functionality"""
    
    def test_capture_intent_sell_in_store(self):
        """Test capturing sell_in_store intent"""
        response = requests.post(
            f"{BASE_URL}/api/intent",
            json={
                "action": "capture",
                "intentKey": "sell_in_store",
                "sourceUrl": "https://test.com/home",
                "source": "MARKETING_PAGE",
                "metadata": {"email": "TEST_capture@example.com"}
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "intent" in data
        assert data["intent"]["intentKey"] == "sell_in_store"
        assert data["intent"]["intentDomain"] == "COMMERCE"
        assert data["intent"]["intentSource"] == "MARKETING_PAGE"
        assert "suggestions" in data
        assert "pos" in data["suggestions"]
    
    def test_capture_intent_with_campaign(self):
        """Test capturing intent with campaign tracking"""
        response = requests.post(
            f"{BASE_URL}/api/intent",
            json={
                "action": "capture",
                "intentKey": "sell_online",
                "sourceUrl": "https://test.com/home?utm_campaign=test_campaign",
                "source": "MARKETING_PAGE",
                "campaignId": "test_campaign_123",
                "referralCode": "REF123",
                "metadata": {"email": "TEST_campaign@example.com"}
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["intent"]["campaignId"] == "test_campaign_123"
        assert data["intent"]["referralCode"] == "REF123"
    
    def test_capture_intent_invalid_key(self):
        """Test capturing intent with invalid key returns error"""
        response = requests.post(
            f"{BASE_URL}/api/intent",
            json={
                "action": "capture",
                "intentKey": "invalid_intent_key",
                "sourceUrl": "https://test.com/home"
            }
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        assert "availableIntents" in data
    
    def test_capture_intent_missing_key(self):
        """Test capturing intent without key returns error"""
        response = requests.post(
            f"{BASE_URL}/api/intent",
            json={
                "action": "capture",
                "sourceUrl": "https://test.com/home"
            }
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data


class TestCTARoutesAPI:
    """Test CTA routes retrieval"""
    
    def test_get_cta_routes(self):
        """Test fetching standard CTA routes"""
        response = requests.get(f"{BASE_URL}/api/intent?action=cta-routes")
        assert response.status_code == 200
        
        data = response.json()
        assert "routes" in data
        
        routes = data["routes"]
        # Verify key routes
        assert routes["SELL_IN_STORE"] == "/signup?intent=sell_in_store"
        assert routes["SELL_ONLINE"] == "/signup?intent=sell_online"
        assert routes["RUN_MARKETPLACE"] == "/signup?intent=run_marketplace"
        assert routes["BECOME_PARTNER"] == "/signup?intent=become_partner&source=PARTNER_LINK"
        assert routes["GET_STARTED"] == "/signup?intent=explore_platform"
        assert routes["LOGIN"] == "/login"


class TestIntentDefinitionAPI:
    """Test single intent definition retrieval"""
    
    def test_get_single_intent_definition(self):
        """Test fetching single intent definition"""
        response = requests.get(f"{BASE_URL}/api/intent?action=definition&key=sell_in_store")
        assert response.status_code == 200
        
        data = response.json()
        assert data["key"] == "sell_in_store"
        assert data["domain"] == "COMMERCE"
        assert data["label"] == "Sell In-Store"
        assert "pos" in data["suggestedCapabilities"]
    
    def test_get_single_intent_not_found(self):
        """Test fetching non-existent intent returns 404"""
        response = requests.get(f"{BASE_URL}/api/intent?action=definition&key=nonexistent_intent")
        assert response.status_code == 404
        
        data = response.json()
        assert "error" in data
    
    def test_get_single_intent_missing_key(self):
        """Test fetching intent without key returns 400"""
        response = requests.get(f"{BASE_URL}/api/intent?action=definition")
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data


class TestIntentParseAPI:
    """Test URL parsing for intent parameters"""
    
    def test_parse_intent_from_url(self):
        """Test parsing intent from URL"""
        import urllib.parse
        test_url = "https://example.com/signup?intent=sell_in_store&utm_campaign=test&ref=ABC123"
        encoded_url = urllib.parse.quote(test_url, safe='')
        response = requests.get(f"{BASE_URL}/api/intent?action=parse&url={encoded_url}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["intentKey"] == "sell_in_store"
        assert data["campaignId"] == "test"
        assert data["referralCode"] == "ABC123"
    
    def test_parse_url_missing(self):
        """Test parsing without URL returns error"""
        response = requests.get(f"{BASE_URL}/api/intent?action=parse")
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data


class TestBuildCTAUrlAPI:
    """Test CTA URL building"""
    
    def test_build_cta_url(self):
        """Test building CTA URL with parameters"""
        response = requests.post(
            f"{BASE_URL}/api/intent",
            json={
                "action": "build-cta-url",
                "basePath": "/signup",
                "intentKey": "sell_in_store",
                "source": "MARKETING_PAGE",
                "campaignId": "summer_sale",
                "referralCode": "REF123"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "url" in data
        assert "intent=sell_in_store" in data["url"]
        assert "utm_campaign=summer_sale" in data["url"]
        assert "ref=REF123" in data["url"]
    
    def test_build_cta_url_missing_fields(self):
        """Test building CTA URL without required fields returns error"""
        response = requests.post(
            f"{BASE_URL}/api/intent",
            json={
                "action": "build-cta-url",
                "basePath": "/signup"
            }
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data


class TestErrorHandling:
    """Test API error handling"""
    
    def test_unknown_get_action(self):
        """Test unknown GET action returns error"""
        response = requests.get(f"{BASE_URL}/api/intent?action=unknown_action")
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
    
    def test_unknown_post_action(self):
        """Test unknown POST action returns error"""
        response = requests.post(
            f"{BASE_URL}/api/intent",
            json={"action": "unknown_action"}
        )
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
