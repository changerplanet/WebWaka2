"""
CIVIC SUITE: API Tests
Tests for all Civic Suite endpoints - constituents, dues, service requests, certificates, events, voting
All services use MOCKED in-memory demo data
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://tscleanup.preview.emergentagent.com').rstrip('/')


class TestCivicMainAPI:
    """Tests for main /api/civic endpoint - config and stats"""
    
    def test_civic_main_endpoint_returns_config_and_stats(self):
        """GET /api/civic - Returns civic suite configuration and stats"""
        response = requests.get(f"{BASE_URL}/api/civic")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, f"Expected success=True, got {data}"
        
        # Verify config structure
        assert 'config' in data, "Missing config in response"
        config = data['config']
        assert 'labels' in config, "Missing labels in config"
        assert 'organizationTypes' in config, "Missing organizationTypes in config"
        assert 'membershipTypes' in config, "Missing membershipTypes in config"
        assert 'duesTypes' in config, "Missing duesTypes in config"
        assert 'certificateTypes' in config, "Missing certificateTypes in config"
        assert 'eventTypes' in config, "Missing eventTypes in config"
        assert 'pollTypes' in config, "Missing pollTypes in config"
        
        # Verify stats structure
        assert 'stats' in data, "Missing stats in response"
        stats = data['stats']
        assert 'constituents' in stats, "Missing constituents stats"
        assert 'dues' in stats, "Missing dues stats"
        assert 'serviceRequests' in stats, "Missing serviceRequests stats"
        assert 'certificates' in stats, "Missing certificates stats"
        assert 'events' in stats, "Missing events stats"
        assert 'polls' in stats, "Missing polls stats"
        
        print(f"✓ Civic main API returns config and stats successfully")
        print(f"  - Total constituents: {stats['constituents'].get('totalConstituents', 'N/A')}")
        print(f"  - Active constituents: {stats['constituents'].get('activeConstituents', 'N/A')}")
    
    def test_civic_post_get_demo_data(self):
        """POST /api/civic with action=get-demo-data"""
        response = requests.post(
            f"{BASE_URL}/api/civic",
            json={"action": "get-demo-data"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True
        assert 'stats' in data
        print(f"✓ POST /api/civic get-demo-data works")


class TestConstituentsAPI:
    """Tests for /api/civic/constituents endpoint - 6 demo members expected"""
    
    def test_get_constituents_list(self):
        """GET /api/civic/constituents - Returns list of members"""
        response = requests.get(f"{BASE_URL}/api/civic/constituents")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, f"Expected success=True, got {data}"
        assert 'constituents' in data, "Missing constituents in response"
        
        constituents = data['constituents']
        assert isinstance(constituents, list), "constituents should be a list"
        assert len(constituents) == 6, f"Expected 6 demo members, got {len(constituents)}"
        
        # Verify constituent structure
        if len(constituents) > 0:
            member = constituents[0]
            assert 'id' in member, "Missing id in constituent"
            assert 'memberNumber' in member, "Missing memberNumber in constituent"
            assert 'firstName' in member, "Missing firstName in constituent"
            assert 'lastName' in member, "Missing lastName in constituent"
            assert 'phone' in member, "Missing phone in constituent"
            assert 'membershipType' in member, "Missing membershipType in constituent"
            assert 'membershipStatus' in member, "Missing membershipStatus in constituent"
        
        print(f"✓ Constituents API returns {len(constituents)} members")
        for c in constituents[:3]:
            print(f"  - {c.get('firstName')} {c.get('lastName')} ({c.get('membershipStatus')})")
    
    def test_get_constituents_with_status_filter(self):
        """GET /api/civic/constituents?status=ACTIVE - Filter by status"""
        response = requests.get(f"{BASE_URL}/api/civic/constituents?status=ACTIVE")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        
        constituents = data.get('constituents', [])
        for c in constituents:
            assert c.get('membershipStatus') == 'ACTIVE', f"Expected ACTIVE status, got {c.get('membershipStatus')}"
        
        print(f"✓ Status filter works - {len(constituents)} active members")
    
    def test_get_constituents_with_type_filter(self):
        """GET /api/civic/constituents?type=LANDLORD - Filter by type"""
        response = requests.get(f"{BASE_URL}/api/civic/constituents?type=LANDLORD")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        
        constituents = data.get('constituents', [])
        for c in constituents:
            assert c.get('membershipType') == 'LANDLORD', f"Expected LANDLORD type, got {c.get('membershipType')}"
        
        print(f"✓ Type filter works - {len(constituents)} landlords")
    
    def test_get_wards_list(self):
        """GET /api/civic/constituents?list=wards - Get wards"""
        response = requests.get(f"{BASE_URL}/api/civic/constituents?list=wards")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'wards' in data
        print(f"✓ Wards list: {data.get('wards')}")


class TestDuesAPI:
    """Tests for /api/civic/dues endpoint - 7 demo dues records expected"""
    
    def test_get_dues_list(self):
        """GET /api/civic/dues - Returns list of dues records"""
        response = requests.get(f"{BASE_URL}/api/civic/dues")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, f"Expected success=True, got {data}"
        assert 'dues' in data, "Missing dues in response"
        
        dues = data['dues']
        assert isinstance(dues, list), "dues should be a list"
        assert len(dues) == 7, f"Expected 7 demo dues records, got {len(dues)}"
        
        # Verify dues structure
        if len(dues) > 0:
            record = dues[0]
            assert 'id' in record, "Missing id in dues"
            assert 'constituentId' in record, "Missing constituentId in dues"
            assert 'constituentName' in record, "Missing constituentName in dues"
            assert 'duesType' in record, "Missing duesType in dues"
            assert 'amount' in record, "Missing amount in dues"
            assert 'status' in record, "Missing status in dues"
        
        print(f"✓ Dues API returns {len(dues)} records")
        for d in dues[:3]:
            print(f"  - {d.get('constituentName')}: {d.get('duesType')} - {d.get('status')}")
    
    def test_get_dues_stats(self):
        """GET /api/civic/dues?statsOnly=true - Get dues statistics"""
        response = requests.get(f"{BASE_URL}/api/civic/dues?statsOnly=true")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'stats' in data
        
        stats = data['stats']
        assert 'totalBilled' in stats
        assert 'totalCollected' in stats
        assert 'collectionRate' in stats
        
        print(f"✓ Dues stats: Billed={stats.get('totalBilled')}, Collected={stats.get('totalCollected')}, Rate={stats.get('collectionRate'):.1f}%")
    
    def test_get_overdue_list(self):
        """GET /api/civic/dues?list=overdue - Get overdue constituents"""
        response = requests.get(f"{BASE_URL}/api/civic/dues?list=overdue")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'overdue' in data
        
        print(f"✓ Overdue list: {len(data.get('overdue', []))} constituents with overdue dues")


class TestServiceRequestsAPI:
    """Tests for /api/civic/service-requests endpoint - 5 demo requests expected"""
    
    def test_get_service_requests_list(self):
        """GET /api/civic/service-requests - Returns list of service requests"""
        response = requests.get(f"{BASE_URL}/api/civic/service-requests")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, f"Expected success=True, got {data}"
        assert 'requests' in data, "Missing requests in response"
        
        requests_list = data['requests']
        assert isinstance(requests_list, list), "requests should be a list"
        assert len(requests_list) == 5, f"Expected 5 demo service requests, got {len(requests_list)}"
        
        # Verify request structure
        if len(requests_list) > 0:
            req = requests_list[0]
            assert 'id' in req, "Missing id in request"
            assert 'ticketNumber' in req, "Missing ticketNumber in request"
            assert 'category' in req, "Missing category in request"
            assert 'priority' in req, "Missing priority in request"
            assert 'status' in req, "Missing status in request"
            assert 'subject' in req, "Missing subject in request"
        
        print(f"✓ Service Requests API returns {len(requests_list)} requests")
        for r in requests_list[:3]:
            print(f"  - {r.get('ticketNumber')}: {r.get('subject')[:40]}... ({r.get('status')})")
    
    def test_get_service_requests_stats(self):
        """GET /api/civic/service-requests?statsOnly=true - Get request statistics"""
        response = requests.get(f"{BASE_URL}/api/civic/service-requests?statsOnly=true")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'stats' in data
        
        stats = data['stats']
        assert 'total' in stats
        assert 'open' in stats
        assert 'resolved' in stats
        
        print(f"✓ Service Request stats: Total={stats.get('total')}, Open={stats.get('open')}, Resolved={stats.get('resolved')}")


class TestCertificatesAPI:
    """Tests for /api/civic/certificates endpoint - 4 demo certificates expected"""
    
    def test_get_certificates_list(self):
        """GET /api/civic/certificates - Returns list of certificates"""
        response = requests.get(f"{BASE_URL}/api/civic/certificates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, f"Expected success=True, got {data}"
        assert 'certificates' in data, "Missing certificates in response"
        
        certificates = data['certificates']
        assert isinstance(certificates, list), "certificates should be a list"
        assert len(certificates) == 4, f"Expected 4 demo certificates, got {len(certificates)}"
        
        # Verify certificate structure
        if len(certificates) > 0:
            cert = certificates[0]
            assert 'id' in cert, "Missing id in certificate"
            assert 'certificateNumber' in cert, "Missing certificateNumber in certificate"
            assert 'certificateType' in cert, "Missing certificateType in certificate"
            assert 'status' in cert, "Missing status in certificate"
            assert 'verificationCode' in cert, "Missing verificationCode in certificate"
        
        print(f"✓ Certificates API returns {len(certificates)} certificates")
        for c in certificates[:3]:
            print(f"  - {c.get('certificateNumber')}: {c.get('certificateType')} ({c.get('status')})")
    
    def test_get_certificates_stats(self):
        """GET /api/civic/certificates?statsOnly=true - Get certificate statistics"""
        response = requests.get(f"{BASE_URL}/api/civic/certificates?statsOnly=true")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'stats' in data
        
        stats = data['stats']
        assert 'total' in stats
        assert 'issued' in stats
        assert 'pending' in stats
        
        print(f"✓ Certificate stats: Total={stats.get('total')}, Issued={stats.get('issued')}, Pending={stats.get('pending')}")


class TestEventsAPI:
    """Tests for /api/civic/events endpoint - 4 demo events expected"""
    
    def test_get_events_list(self):
        """GET /api/civic/events - Returns list of events"""
        response = requests.get(f"{BASE_URL}/api/civic/events")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, f"Expected success=True, got {data}"
        assert 'events' in data, "Missing events in response"
        
        events = data['events']
        assert isinstance(events, list), "events should be a list"
        assert len(events) == 4, f"Expected 4 demo events, got {len(events)}"
        
        # Verify event structure
        if len(events) > 0:
            event = events[0]
            assert 'id' in event, "Missing id in event"
            assert 'eventType' in event, "Missing eventType in event"
            assert 'title' in event, "Missing title in event"
            assert 'venue' in event, "Missing venue in event"
            assert 'eventDate' in event, "Missing eventDate in event"
            assert 'status' in event, "Missing status in event"
        
        print(f"✓ Events API returns {len(events)} events")
        for e in events[:3]:
            print(f"  - {e.get('title')[:40]}... ({e.get('status')})")
    
    def test_get_upcoming_events(self):
        """GET /api/civic/events?list=upcoming - Get upcoming events"""
        response = requests.get(f"{BASE_URL}/api/civic/events?list=upcoming")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'events' in data
        
        print(f"✓ Upcoming events: {len(data.get('events', []))} events")
    
    def test_get_events_stats(self):
        """GET /api/civic/events?statsOnly=true - Get event statistics"""
        response = requests.get(f"{BASE_URL}/api/civic/events?statsOnly=true")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'stats' in data
        
        stats = data['stats']
        assert 'upcoming' in stats
        assert 'completed' in stats
        
        print(f"✓ Event stats: Upcoming={stats.get('upcoming')}, Completed={stats.get('completed')}")


class TestVotingAPI:
    """Tests for /api/civic/voting endpoint - 3 demo polls expected"""
    
    def test_get_polls_list(self):
        """GET /api/civic/voting - Returns list of polls"""
        response = requests.get(f"{BASE_URL}/api/civic/voting")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get('success') == True, f"Expected success=True, got {data}"
        assert 'polls' in data, "Missing polls in response"
        
        polls = data['polls']
        assert isinstance(polls, list), "polls should be a list"
        assert len(polls) == 3, f"Expected 3 demo polls, got {len(polls)}"
        
        # Verify poll structure
        if len(polls) > 0:
            poll = polls[0]
            assert 'id' in poll, "Missing id in poll"
            assert 'pollType' in poll, "Missing pollType in poll"
            assert 'title' in poll, "Missing title in poll"
            assert 'status' in poll, "Missing status in poll"
            assert 'votingStart' in poll, "Missing votingStart in poll"
            assert 'votingEnd' in poll, "Missing votingEnd in poll"
        
        print(f"✓ Voting API returns {len(polls)} polls")
        for p in polls:
            print(f"  - {p.get('title')[:40]}... ({p.get('pollType')}, {p.get('status')})")
    
    def test_get_active_polls(self):
        """GET /api/civic/voting?list=active - Get active polls"""
        response = requests.get(f"{BASE_URL}/api/civic/voting?list=active")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'polls' in data
        
        print(f"✓ Active polls: {len(data.get('polls', []))} polls")
    
    def test_get_voting_stats(self):
        """GET /api/civic/voting?statsOnly=true - Get voting statistics"""
        response = requests.get(f"{BASE_URL}/api/civic/voting?statsOnly=true")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'stats' in data
        
        stats = data['stats']
        assert 'active' in stats
        assert 'scheduled' in stats
        
        print(f"✓ Voting stats: Active={stats.get('active')}, Scheduled={stats.get('scheduled')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
