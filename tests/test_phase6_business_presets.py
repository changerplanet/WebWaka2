"""
Phase 6 Business Presets API Tests
Tests for 17 Nigeria-first business verticals configuration API
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://typefix.preview.emergentagent.com').rstrip('/')


class TestBusinessPresetsAPI:
    """Tests for GET /api/business-presets endpoint"""
    
    def test_get_all_presets_returns_17_verticals(self):
        """GET /api/business-presets returns all 17 business presets"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['count'] == 17
        assert len(data['presets']) == 17
    
    def test_get_all_presets_returns_summary_counts(self):
        """GET /api/business-presets returns correct summary counts"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        assert response.status_code == 200
        
        data = response.json()
        summary = data['summary']
        assert summary['total'] == 17
        assert summary['commerce'] == 6  # Phase 6.1
        assert summary['services'] == 6  # Phase 6.2
        assert summary['community'] == 5  # Phase 6.3
    
    def test_get_all_presets_returns_grouped_by_phase(self):
        """GET /api/business-presets returns presets grouped by phase"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        assert response.status_code == 200
        
        data = response.json()
        grouped = data['grouped']
        assert len(grouped['6.1']) == 6
        assert len(grouped['6.2']) == 6
        assert len(grouped['6.3']) == 5


class TestPhase61CommercePresets:
    """Tests for Phase 6.1 - MSME Commerce (6 presets)"""
    
    def test_phase_61_returns_6_commerce_presets(self):
        """GET /api/business-presets?phase=6.1 returns 6 commerce presets"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.1")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['count'] == 6
        assert data['phase'] == '6.1'
    
    def test_phase_61_contains_retail_store(self):
        """Phase 6.1 contains Retail Store preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.1")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Retail Store' in preset_names
    
    def test_phase_61_contains_supermarket(self):
        """Phase 6.1 contains Supermarket preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.1")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Supermarket' in preset_names
    
    def test_phase_61_contains_market_trade(self):
        """Phase 6.1 contains Market / Trade Association preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.1")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Market / Trade Association' in preset_names
    
    def test_phase_61_contains_online_store(self):
        """Phase 6.1 contains Online Store preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.1")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Online Store' in preset_names
    
    def test_phase_61_contains_restaurant(self):
        """Phase 6.1 contains Restaurant / Food Vendor preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.1")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Restaurant / Food Vendor' in preset_names
    
    def test_phase_61_contains_event_ticketing(self):
        """Phase 6.1 contains Event & Ticketing preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.1")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Event & Ticketing' in preset_names


class TestPhase62ServicesPresets:
    """Tests for Phase 6.2 - Services & Lifestyle (6 presets)"""
    
    def test_phase_62_returns_6_services_presets(self):
        """GET /api/business-presets?phase=6.2 returns 6 services presets"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.2")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['count'] == 6
        assert data['phase'] == '6.2'
    
    def test_phase_62_contains_beauty_salon(self):
        """Phase 6.2 contains Beauty Salon & Spa preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.2")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Beauty Salon & Spa' in preset_names
    
    def test_phase_62_contains_laundry(self):
        """Phase 6.2 contains Laundry & Dry Cleaning preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.2")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Laundry & Dry Cleaning' in preset_names
    
    def test_phase_62_contains_cleaning(self):
        """Phase 6.2 contains Cleaning Services preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.2")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Cleaning Services' in preset_names
    
    def test_phase_62_contains_repair(self):
        """Phase 6.2 contains Repair Services preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.2")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Repair Services' in preset_names
    
    def test_phase_62_contains_auto_workshop(self):
        """Phase 6.2 contains Auto Workshop / Mechanic preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.2")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Auto Workshop / Mechanic' in preset_names
    
    def test_phase_62_contains_courier(self):
        """Phase 6.2 contains Courier & Delivery preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.2")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Courier & Delivery' in preset_names


class TestPhase63CommunityPresets:
    """Tests for Phase 6.3 - Community & Access (5 presets)"""
    
    def test_phase_63_returns_5_community_presets(self):
        """GET /api/business-presets?phase=6.3 returns 5 community presets"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.3")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['count'] == 5
        assert data['phase'] == '6.3'
    
    def test_phase_63_contains_ngo(self):
        """Phase 6.3 contains NGO / Nonprofit preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.3")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'NGO / Nonprofit' in preset_names
    
    def test_phase_63_contains_alumni(self):
        """Phase 6.3 contains Alumni Association preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.3")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Alumni Association' in preset_names
    
    def test_phase_63_contains_sales_agent(self):
        """Phase 6.3 contains Sales Agents / Field Sales preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.3")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Sales Agents / Field Sales' in preset_names
    
    def test_phase_63_contains_gate_pass(self):
        """Phase 6.3 contains Gate Pass & Visitors preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.3")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Gate Pass & Visitors' in preset_names
    
    def test_phase_63_contains_parking(self):
        """Phase 6.3 contains Parking Management preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?phase=6.3")
        data = response.json()
        
        preset_names = [p['name'] for p in data['presets']]
        assert 'Parking Management' in preset_names


class TestSinglePresetByType:
    """Tests for GET /api/business-presets?type={type}"""
    
    def test_get_restaurant_preset(self):
        """GET /api/business-presets?type=restaurant returns single preset"""
        response = requests.get(f"{BASE_URL}/api/business-presets?type=restaurant")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['preset']['type'] == 'restaurant'
        assert data['preset']['name'] == 'Restaurant / Food Vendor'
    
    def test_preset_has_ngn_pricing(self):
        """Preset has NGN currency pricing"""
        response = requests.get(f"{BASE_URL}/api/business-presets?type=restaurant")
        data = response.json()
        
        pricing = data['preset']['pricing']
        assert pricing['currency'] == 'NGN'
        assert pricing['setupFee'] > 0
        assert pricing['monthlyBase'] > 0
    
    def test_preset_has_nigeria_context(self):
        """Preset has Nigerian context with payment methods"""
        response = requests.get(f"{BASE_URL}/api/business-presets?type=restaurant")
        data = response.json()
        
        nigeria_context = data['preset']['nigeriaContext']
        assert 'taxRate' in nigeria_context
        assert 'commonPaymentMethods' in nigeria_context
        assert len(nigeria_context['commonPaymentMethods']) > 0
    
    def test_invalid_type_returns_404(self):
        """GET /api/business-presets?type=invalid returns 404"""
        response = requests.get(f"{BASE_URL}/api/business-presets?type=invalid_type")
        assert response.status_code == 404
        
        data = response.json()
        assert data['success'] is False


class TestDemoDataAction:
    """Tests for POST /api/business-presets with action=get-demo-data"""
    
    def test_get_demo_data_for_restaurant(self):
        """POST action=get-demo-data returns Nigerian demo data for restaurant"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "get-demo-data", "type": "restaurant"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['businessType'] == 'restaurant'
        assert 'demoData' in data
    
    def test_restaurant_demo_data_has_nigerian_menu(self):
        """Restaurant demo data includes Nigerian menu items"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "get-demo-data", "type": "restaurant"}
        )
        data = response.json()
        
        menu = data['demoData']['menu']
        menu_names = [item['name'] for item in menu]
        
        # Check for Nigerian dishes
        assert any('Jollof' in name for name in menu_names)
        assert any('Egusi' in name or 'Pepper Soup' in name for name in menu_names)
    
    def test_demo_data_has_nigerian_phone_format(self):
        """Demo data includes Nigerian phone numbers (080/081/090/070/091)"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "get-demo-data", "type": "restaurant"}
        )
        data = response.json()
        
        staff = data['demoData']['staff']
        for person in staff:
            phone = person['phone']
            # Nigerian phone numbers start with 080, 081, 090, 070, 091
            assert phone[:3] in ['080', '081', '090', '070', '091']
    
    def test_get_demo_data_for_courier(self):
        """POST action=get-demo-data returns demo data for courier"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "get-demo-data", "type": "courier"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'demoData' in data
        
        # Check for Lagos areas in courier data
        demo_data = data['demoData']
        assert 'rates' in demo_data
        assert 'riders' in demo_data
    
    def test_get_demo_data_for_ngo(self):
        """POST action=get-demo-data returns demo data for NGO"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "get-demo-data", "type": "ngo"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert 'demoData' in data
        
        demo_data = data['demoData']
        assert 'organization' in demo_data
        assert 'programs' in demo_data
        assert 'donors' in demo_data
    
    def test_invalid_type_returns_400(self):
        """POST action=get-demo-data with invalid type returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "get-demo-data", "type": "invalid_type"}
        )
        assert response.status_code == 400


class TestSetupConfigAction:
    """Tests for POST /api/business-presets with action=get-setup-config"""
    
    def test_get_setup_config_for_retail(self):
        """POST action=get-setup-config returns setup configuration"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "get-setup-config", "type": "retail_pos"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] is True
        assert data['businessType'] == 'retail_pos'
        assert 'setupConfig' in data
    
    def test_setup_config_has_required_fields(self):
        """Setup config includes all required fields"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "get-setup-config", "type": "retail_pos"}
        )
        data = response.json()
        
        config = data['setupConfig']
        assert 'name' in config
        assert 'description' in config
        assert 'baseSuites' in config
        assert 'features' in config
        assert 'labels' in config
        assert 'kpis' in config
        assert 'pricing' in config
        assert 'nigeriaContext' in config
    
    def test_setup_config_has_ngn_pricing(self):
        """Setup config has NGN pricing"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "get-setup-config", "type": "supermarket"}
        )
        data = response.json()
        
        pricing = data['setupConfig']['pricing']
        assert pricing['currency'] == 'NGN'
        assert pricing['setupFee'] == 100000  # Supermarket setup fee
        assert pricing['monthlyBase'] == 35000  # Supermarket monthly
    
    def test_invalid_action_returns_400(self):
        """POST with invalid action returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/business-presets",
            json={"action": "invalid_action", "type": "retail_pos"}
        )
        assert response.status_code == 400


class TestNigerianContextValidation:
    """Tests to verify Nigerian-specific data across all presets"""
    
    def test_all_presets_have_ngn_currency(self):
        """All presets use NGN currency"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        data = response.json()
        
        for preset in data['presets']:
            assert preset['pricing']['currency'] == 'NGN', f"{preset['name']} should use NGN"
    
    def test_all_presets_have_setup_fee(self):
        """All presets have setup fee in NGN"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        data = response.json()
        
        for preset in data['presets']:
            assert preset['pricing']['setupFee'] > 0, f"{preset['name']} should have setup fee"
    
    def test_all_presets_have_monthly_base(self):
        """All presets have monthly base fee in NGN"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        data = response.json()
        
        for preset in data['presets']:
            assert preset['pricing']['monthlyBase'] > 0, f"{preset['name']} should have monthly fee"
    
    def test_all_presets_have_nigeria_context(self):
        """All presets have nigeriaContext with tax rate and payment methods"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        data = response.json()
        
        for preset in data['presets']:
            assert 'nigeriaContext' in preset, f"{preset['name']} should have nigeriaContext"
            assert 'taxRate' in preset['nigeriaContext']
            assert 'commonPaymentMethods' in preset['nigeriaContext']


class TestPresetStructureValidation:
    """Tests to verify preset structure is correct"""
    
    def test_all_presets_have_base_suites(self):
        """All presets reference existing base suites"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        data = response.json()
        
        valid_suites = ['commerce', 'logistics', 'hospitality', 'civic', 'education', 'sites_funnels']
        
        for preset in data['presets']:
            assert len(preset['baseSuites']) > 0, f"{preset['name']} should have base suites"
            for suite in preset['baseSuites']:
                assert suite in valid_suites, f"{preset['name']} has invalid suite: {suite}"
    
    def test_all_presets_have_features(self):
        """All presets have feature flags"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        data = response.json()
        
        required_features = ['pos', 'inventory', 'booking', 'dispatch', 'membership', 'marketplace', 'commissions']
        
        for preset in data['presets']:
            for feature in required_features:
                assert feature in preset['features'], f"{preset['name']} missing feature: {feature}"
    
    def test_all_presets_have_kpis(self):
        """All presets have KPIs defined"""
        response = requests.get(f"{BASE_URL}/api/business-presets")
        data = response.json()
        
        for preset in data['presets']:
            assert len(preset['kpis']) > 0, f"{preset['name']} should have KPIs"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
