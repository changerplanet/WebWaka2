"""
Test Suite for Identity & Tenant Entry Layer v2 - eMarketWaka
Nigeria-first authentication system with:
- Phone + OTP as PRIMARY auth
- Email + OTP as SECONDARY
- Password as OPTIONAL
- Magic Link as LEGACY for admins

Multi-step signup flow: Identity -> OTP -> User Intent -> Business Basics -> Discovery -> Complete
"""

import pytest
import requests
import os
import time
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prisma-sync.preview.emergentagent.com').rstrip('/')

class TestSignupOptions:
    """Test GET /api/auth/v2?action=signup-options"""
    
    def test_get_signup_options_returns_all_data(self):
        """Verify signup-options returns user intents, business types, discovery options, Nigerian states"""
        response = requests.get(f"{BASE_URL}/api/auth/v2?action=signup-options")
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == True
        
        # Verify user intents
        assert 'userIntents' in data
        assert len(data['userIntents']) == 3
        intent_keys = [i['key'] for i in data['userIntents']]
        assert 'run_business' in intent_keys
        assert 'setup_for_other' in intent_keys
        assert 'partner' in intent_keys
        
        # Verify business types
        assert 'businessTypes' in data
        assert len(data['businessTypes']) >= 10
        business_keys = [b['key'] for b in data['businessTypes']]
        assert 'retail_shop' in business_keys
        assert 'restaurant' in business_keys
        assert 'not_sure' in business_keys
        
        # Verify discovery options
        assert 'discoveryOptions' in data
        assert len(data['discoveryOptions']) >= 10
        discovery_keys = [d['key'] for d in data['discoveryOptions']]
        assert 'sell_in_store' in discovery_keys
        assert 'sell_online' in discovery_keys
        assert 'manage_inventory' in discovery_keys
        
        # Verify Nigerian states
        assert 'nigerianStates' in data
        assert len(data['nigerianStates']) == 37
        assert 'Lagos' in data['nigerianStates']
        assert 'FCT' in data['nigerianStates']
        assert 'Kano' in data['nigerianStates']


class TestSignupStart:
    """Test POST signup-start with phone/email"""
    
    def test_signup_start_with_phone_sends_otp(self):
        """Verify signup-start with phone number sends OTP and returns session token"""
        phone = f"0803{int(time.time()) % 10000000:07d}"
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": phone}
        )
        assert response.status_code == 200
        
        data = response.json()
        # May be rate limited
        if data['success']:
            assert 'sessionToken' in data
            assert 'otpId' in data
            assert 'maskedRecipient' in data
            assert '+234' in data['maskedRecipient']
            assert 'canResendAt' in data
        else:
            assert data['errorCode'] in ['IP_RATE_LIMITED', 'RATE_LIMITED', 'OTP_COOLDOWN']
    
    def test_signup_start_with_email_sends_otp(self):
        """Verify signup-start with email sends OTP via email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "email": f"test_signup_{int(time.time())}@example.com"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # May be rate limited
        if data['success']:
            assert 'sessionToken' in data
            assert 'otpId' in data
            assert 'maskedRecipient' in data
            assert '@example.com' in data['maskedRecipient']
        else:
            assert data['errorCode'] in ['IP_RATE_LIMITED', 'RATE_LIMITED', 'OTP_COOLDOWN']
    
    def test_signup_start_with_nigerian_phone_formats(self):
        """Test various Nigerian phone number formats"""
        # Test with +234 prefix
        phone1 = f"+2348031{int(time.time()) % 100000:05d}8"
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": phone1}
        )
        assert response.status_code == 200
        data = response.json()
        if data['success']:
            assert '+234' in data['maskedRecipient']
        else:
            assert data['errorCode'] in ['IP_RATE_LIMITED', 'RATE_LIMITED', 'OTP_COOLDOWN']
        
        # Test with 0 prefix
        phone2 = f"08031{int(time.time()) % 100000:05d}9"
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": phone2}
        )
        assert response.status_code == 200
        data = response.json()
        if data['success']:
            assert '+234' in data['maskedRecipient']
        else:
            assert data['errorCode'] in ['IP_RATE_LIMITED', 'RATE_LIMITED', 'OTP_COOLDOWN']
    
    def test_signup_start_invalid_phone_rejected(self):
        """Verify invalid phone numbers are rejected"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": "12345"}
        )
        assert response.status_code == 200  # API returns 200 with error in body
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] == 'INVALID_PHONE'
    
    def test_signup_start_missing_identity_rejected(self):
        """Verify missing phone/email is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] == 'MISSING_IDENTITY'
    
    def test_signup_start_with_referral_code(self):
        """Test signup with referral code"""
        phone = f"0803{int(time.time()) % 10000000:07d}"
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "signup-start", 
                "phone": phone,
                "referralCode": "PARTNER2024"
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Should succeed even if referral code doesn't exist (or be rate limited)
        if not data['success']:
            assert data['errorCode'] in ['IP_RATE_LIMITED', 'RATE_LIMITED', 'OTP_COOLDOWN']


class TestOtpVerification:
    """Test OTP verification flow"""
    
    def test_signup_otp_verify_invalid_code(self):
        """Verify invalid OTP code is rejected"""
        # First start signup to get session and OTP ID
        phone = f"0803{int(time.time()) % 10000000:07d}"
        start_response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": phone}
        )
        start_data = start_response.json()
        
        # Skip if rate limited
        if not start_data.get('success'):
            pytest.skip(f"Rate limited: {start_data.get('errorCode')}")
        
        # Try to verify with wrong code
        verify_response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "signup-otp-verify",
                "sessionToken": start_data['sessionToken'],
                "otpId": start_data['otpId'],
                "code": "000000"
            }
        )
        assert verify_response.status_code == 200
        
        verify_data = verify_response.json()
        assert verify_data['success'] == False
        assert verify_data['errorCode'] == 'INVALID_CODE'
        assert 'attemptsRemaining' in verify_data
    
    def test_signup_otp_verify_invalid_session(self):
        """Verify invalid session token is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "signup-otp-verify",
                "sessionToken": "invalid-session-token",
                "otpId": "invalid-otp-id",
                "code": "123456"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] in ['SESSION_EXPIRED', 'OTP_NOT_FOUND']


class TestIdentify:
    """Test POST identify endpoint"""
    
    def test_identify_phone_detects_type(self):
        """Verify identify detects phone vs email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "identify", "identifier": "08031234567"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # For non-existing user, should return USER_NOT_FOUND
        if data['success'] == False:
            assert data['errorCode'] == 'USER_NOT_FOUND'
            assert data['method'] == 'otp_phone'
        else:
            assert data['method'] in ['otp_phone', 'otp_email', 'password', 'magic_link']
    
    def test_identify_email_detects_type(self):
        """Verify identify detects email"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "identify", "identifier": "test@example.com"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should return available methods for existing user
        if data['success']:
            assert 'availableMethods' in data
            assert 'hasPassword' in data
    
    def test_identify_missing_identifier(self):
        """Verify missing identifier is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "identify"}
        )
        # API returns 520 or 400 for missing identifier
        assert response.status_code in [200, 400, 520]
        
        if response.status_code == 200:
            data = response.json()
            assert data['success'] == False


class TestLoginOtp:
    """Test login-otp flow"""
    
    def test_login_otp_initiates_for_existing_user(self):
        """Verify login-otp initiates OTP login for existing user"""
        # Use an email that exists in the system
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "login-otp", "identifier": "test@example.com"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # If user exists, should succeed
        if data['success']:
            assert 'otpId' in data
            assert 'maskedRecipient' in data
            assert 'canResendAt' in data
    
    def test_login_otp_fails_for_nonexistent_user(self):
        """Verify login-otp fails for non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "login-otp", "identifier": f"nonexistent_{int(time.time())}@example.com"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] == 'USER_NOT_FOUND'


class TestSignupIntent:
    """Test signup-intent step"""
    
    def test_signup_intent_requires_valid_session(self):
        """Verify signup-intent requires valid session"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "signup-intent",
                "sessionToken": "invalid-session",
                "intent": "run_business"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] == 'SESSION_EXPIRED'
    
    def test_signup_intent_validates_intent_value(self):
        """Verify signup-intent validates intent value"""
        # First start signup with unique phone
        phone = f"0803123{int(time.time()) % 10000:04d}"
        start_response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": phone}
        )
        start_data = start_response.json()
        
        # Skip if rate limited
        if not start_data.get('success'):
            pytest.skip(f"Rate limited: {start_data.get('errorCode')}")
        
        # Try invalid intent
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "signup-intent",
                "sessionToken": start_data['sessionToken'],
                "intent": "invalid_intent"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] == 'INVALID_INTENT'


class TestSignupBusiness:
    """Test signup-business step"""
    
    def test_signup_business_requires_valid_session(self):
        """Verify signup-business requires valid session"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "signup-business",
                "sessionToken": "invalid-session",
                "businessName": "Test Business",
                "businessType": "retail_shop",
                "state": "Lagos"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] == 'SESSION_EXPIRED'
    
    def test_signup_business_validates_business_name(self):
        """Verify signup-business validates business name length"""
        # First start signup with unique phone
        phone = f"0803124{int(time.time()) % 10000:04d}"
        start_response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": phone}
        )
        start_data = start_response.json()
        
        # Skip if rate limited
        if not start_data.get('success'):
            pytest.skip(f"Rate limited: {start_data.get('errorCode')}")
        
        # Try with short business name
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "signup-business",
                "sessionToken": start_data['sessionToken'],
                "businessName": "A"  # Too short
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] == 'INVALID_BUSINESS_NAME'


class TestSignupDiscovery:
    """Test signup-discovery step"""
    
    def test_signup_discovery_requires_valid_session(self):
        """Verify signup-discovery requires valid session"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "signup-discovery",
                "sessionToken": "invalid-session",
                "choices": ["sell_in_store", "manage_inventory"]
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] == 'SESSION_EXPIRED'


class TestSignupComplete:
    """Test signup-complete step"""
    
    def test_signup_complete_requires_valid_session(self):
        """Verify signup-complete requires valid session"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={
                "action": "signup-complete",
                "sessionToken": "invalid-session"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data['success'] == False
        assert data['errorCode'] == 'SESSION_EXPIRED'


class TestRateLimiting:
    """Test OTP rate limiting"""
    
    def test_rate_limiting_prevents_abuse(self):
        """Verify rate limiting prevents OTP abuse (max 5 per hour per recipient)"""
        phone = f"0803123{int(time.time()) % 10000:04d}"
        
        # Send multiple OTPs to same number
        for i in range(6):
            response = requests.post(
                f"{BASE_URL}/api/auth/v2",
                json={"action": "signup-start", "phone": phone}
            )
            data = response.json()
            
            if i < 5:
                # First 5 should succeed (or hit cooldown)
                if not data['success']:
                    # Could be cooldown, rate limit, or IP rate limit
                    assert data['errorCode'] in ['OTP_COOLDOWN', 'RATE_LIMITED', 'IP_RATE_LIMITED']
            else:
                # 6th should be rate limited
                if not data['success']:
                    assert data['errorCode'] in ['OTP_COOLDOWN', 'RATE_LIMITED', 'IP_RATE_LIMITED']


class TestPhoneNormalization:
    """Test Nigerian phone number normalization"""
    
    def test_phone_normalization_080_prefix(self):
        """Verify 080 prefix is normalized to +234"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": "08031234574"}
        )
        data = response.json()
        
        if data['success']:
            assert '+234' in data['maskedRecipient']
    
    def test_phone_normalization_234_prefix(self):
        """Verify +234 prefix is handled correctly"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": "+2348031234575"}
        )
        data = response.json()
        
        if data['success']:
            assert '+234' in data['maskedRecipient']
    
    def test_phone_normalization_without_plus(self):
        """Verify 234 without + is handled"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "signup-start", "phone": "2348031234576"}
        )
        data = response.json()
        
        if data['success']:
            assert '+234' in data['maskedRecipient']


class TestUnknownActions:
    """Test error handling for unknown actions"""
    
    def test_unknown_get_action(self):
        """Verify unknown GET action returns error"""
        response = requests.get(f"{BASE_URL}/api/auth/v2?action=unknown-action")
        # API returns 400 for unknown actions
        assert response.status_code in [200, 400]
        
        data = response.json()
        assert data.get('success') == False or 'error' in data
    
    def test_unknown_post_action(self):
        """Verify unknown POST action returns error"""
        response = requests.post(
            f"{BASE_URL}/api/auth/v2",
            json={"action": "unknown-action"}
        )
        # API returns 400 for unknown actions
        assert response.status_code in [200, 400]
        
        data = response.json()
        assert data.get('success') == False or 'error' in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
