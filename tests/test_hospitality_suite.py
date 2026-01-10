"""
HOSPITALITY SUITE: Backend API Tests
Tests for rooms, reservations, guests, housekeeping, and folio APIs.
All APIs use in-memory demo data - no database persistence.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prisma-next-fix.preview.emergentagent.com').rstrip('/')


class TestHospitalityMainAPI:
    """Tests for main hospitality suite API endpoint"""
    
    def test_get_hospitality_config_and_stats(self):
        """GET /api/hospitality - Returns config and stats"""
        response = requests.get(f"{BASE_URL}/api/hospitality")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["hotelName"] == "PalmView Suites, Lekki"
        
        # Verify config structure
        assert "config" in data
        config = data["config"]
        assert "labels" in config
        assert "roomTypes" in config
        assert "occupancyStatus" in config
        assert "cleaningStatus" in config
        assert "reservationStatus" in config
        assert "bookingSources" in config
        assert "housekeepingTaskTypes" in config
        assert "chargeTypes" in config
        assert "paymentMethods" in config
        assert "guestTypes" in config
        
        # Verify stats structure
        assert "stats" in data
        stats = data["stats"]
        assert "rooms" in stats
        assert "reservations" in stats
        assert "guests" in stats
        assert "housekeeping" in stats
        assert "folios" in stats
    
    def test_post_get_demo_data(self):
        """POST /api/hospitality - get-demo-data action"""
        response = requests.post(
            f"{BASE_URL}/api/hospitality",
            json={"action": "get-demo-data"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["hotelName"] == "PalmView Suites, Lekki"
        assert "stats" in data


class TestRoomsAPI:
    """Tests for rooms API endpoint"""
    
    def test_get_all_rooms(self):
        """GET /api/hospitality/rooms - Returns 12 demo rooms"""
        response = requests.get(f"{BASE_URL}/api/hospitality/rooms")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "rooms" in data
        assert len(data["rooms"]) == 12
        
        # Verify room structure
        room = data["rooms"][0]
        assert "id" in room
        assert "roomNumber" in room
        assert "roomType" in room
        assert "occupancyStatus" in room
        assert "cleaningStatus" in room
        assert "baseRate" in room
        
        # Verify stats
        assert "stats" in data
        stats = data["stats"]
        assert stats["totalRooms"] == 12
    
    def test_filter_rooms_by_type(self):
        """GET /api/hospitality/rooms?roomType=STANDARD - Filter by room type"""
        response = requests.get(f"{BASE_URL}/api/hospitality/rooms?roomType=STANDARD")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # All returned rooms should be STANDARD type
        for room in data["rooms"]:
            assert room["roomType"] == "STANDARD"
    
    def test_filter_rooms_by_occupancy_status(self):
        """GET /api/hospitality/rooms?occupancyStatus=OCCUPIED - Filter by occupancy"""
        response = requests.get(f"{BASE_URL}/api/hospitality/rooms?occupancyStatus=OCCUPIED")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        for room in data["rooms"]:
            assert room["occupancyStatus"] == "OCCUPIED"
    
    def test_filter_rooms_by_cleaning_status(self):
        """GET /api/hospitality/rooms?cleaningStatus=DIRTY - Filter by cleaning status"""
        response = requests.get(f"{BASE_URL}/api/hospitality/rooms?cleaningStatus=DIRTY")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        for room in data["rooms"]:
            assert room["cleaningStatus"] == "DIRTY"
    
    def test_check_room_availability(self):
        """GET /api/hospitality/rooms?checkIn=2025-01-10&checkOut=2025-01-12 - Check availability"""
        response = requests.get(
            f"{BASE_URL}/api/hospitality/rooms?checkIn=2025-01-10&checkOut=2025-01-12"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "availableRooms" in data
        assert "count" in data


class TestReservationsAPI:
    """Tests for reservations API endpoint"""
    
    def test_get_all_reservations(self):
        """GET /api/hospitality/reservations - Returns 6 demo reservations"""
        response = requests.get(f"{BASE_URL}/api/hospitality/reservations")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "reservations" in data
        assert len(data["reservations"]) == 6
        
        # Verify reservation structure
        res = data["reservations"][0]
        assert "id" in res
        assert "reservationNumber" in res
        assert "guestName" in res
        assert "roomNumber" in res
        assert "checkInDate" in res
        assert "checkOutDate" in res
        assert "status" in res
        assert "totalAmount" in res
        
        # Verify stats
        assert "stats" in data
    
    def test_filter_reservations_by_status(self):
        """GET /api/hospitality/reservations?status=CHECKED_IN - Filter by status"""
        response = requests.get(f"{BASE_URL}/api/hospitality/reservations?status=CHECKED_IN")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        for res in data["reservations"]:
            assert res["status"] == "CHECKED_IN"
    
    def test_get_reservation_stats(self):
        """GET /api/hospitality/reservations?query=stats - Get reservation stats"""
        response = requests.get(f"{BASE_URL}/api/hospitality/reservations?query=stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "stats" in data
        
        stats = data["stats"]
        assert "total" in stats
        assert "checkedIn" in stats
        assert "totalRevenue" in stats
    
    def test_get_in_house_guests(self):
        """GET /api/hospitality/reservations?query=in-house - Get in-house guests"""
        response = requests.get(f"{BASE_URL}/api/hospitality/reservations?query=in-house")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "inHouse" in data
        assert "count" in data


class TestGuestsAPI:
    """Tests for guests API endpoint"""
    
    def test_get_all_guests(self):
        """GET /api/hospitality/guests - Returns 8 demo guests"""
        response = requests.get(f"{BASE_URL}/api/hospitality/guests")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "guests" in data
        assert len(data["guests"]) == 8
        
        # Verify guest structure
        guest = data["guests"][0]
        assert "id" in guest
        assert "guestNumber" in guest
        assert "firstName" in guest
        assert "lastName" in guest
        assert "phone" in guest
        assert "guestType" in guest
        assert "loyaltyPoints" in guest
        assert "totalStays" in guest
        assert "totalSpent" in guest
        
        # Verify stats
        assert "stats" in data
        stats = data["stats"]
        assert stats["totalGuests"] == 8
    
    def test_search_guests(self):
        """GET /api/hospitality/guests?search=Adebayo - Search by name"""
        response = requests.get(f"{BASE_URL}/api/hospitality/guests?search=Adebayo")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "guests" in data
        assert len(data["guests"]) >= 1
        
        # Verify search result contains the name
        found = any("Adebayo" in g["firstName"] or "Adebayo" in g["lastName"] for g in data["guests"])
        assert found
    
    def test_filter_guests_by_type(self):
        """GET /api/hospitality/guests?guestType=VIP - Filter by guest type"""
        response = requests.get(f"{BASE_URL}/api/hospitality/guests?guestType=VIP")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        for guest in data["guests"]:
            assert guest["guestType"] == "VIP"
    
    def test_get_vip_guests(self):
        """GET /api/hospitality/guests?query=vip - Get VIP guests"""
        response = requests.get(f"{BASE_URL}/api/hospitality/guests?query=vip")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "guests" in data
        assert "count" in data
    
    def test_get_guest_stats(self):
        """GET /api/hospitality/guests?query=stats - Get guest stats"""
        response = requests.get(f"{BASE_URL}/api/hospitality/guests?query=stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "stats" in data
        
        stats = data["stats"]
        assert "totalGuests" in stats
        assert "vipGuests" in stats
        assert "blacklistedGuests" in stats


class TestHousekeepingAPI:
    """Tests for housekeeping API endpoint"""
    
    def test_get_all_tasks(self):
        """GET /api/hospitality/housekeeping - Returns 6 demo tasks"""
        response = requests.get(f"{BASE_URL}/api/hospitality/housekeeping")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "tasks" in data
        assert len(data["tasks"]) == 6
        
        # Verify task structure
        task = data["tasks"][0]
        assert "id" in task
        assert "roomNumber" in task
        assert "taskType" in task
        assert "priority" in task
        assert "status" in task
        
        # Verify stats
        assert "stats" in data
        stats = data["stats"]
        assert stats["totalTasks"] == 6
    
    def test_filter_tasks_by_status(self):
        """GET /api/hospitality/housekeeping?status=PENDING - Filter by status"""
        response = requests.get(f"{BASE_URL}/api/hospitality/housekeeping?status=PENDING")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        for task in data["tasks"]:
            assert task["status"] == "PENDING"
    
    def test_filter_tasks_by_priority(self):
        """GET /api/hospitality/housekeeping?priority=HIGH - Filter by priority"""
        response = requests.get(f"{BASE_URL}/api/hospitality/housekeeping?priority=HIGH")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        for task in data["tasks"]:
            assert task["priority"] == "HIGH"
    
    def test_get_pending_tasks(self):
        """GET /api/hospitality/housekeeping?query=pending - Get pending tasks"""
        response = requests.get(f"{BASE_URL}/api/hospitality/housekeeping?query=pending")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "tasks" in data
        assert "count" in data
    
    def test_get_room_status_board(self):
        """GET /api/hospitality/housekeeping?query=board - Get room status board"""
        response = requests.get(f"{BASE_URL}/api/hospitality/housekeeping?query=board")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "board" in data
    
    def test_get_housekeeping_stats(self):
        """GET /api/hospitality/housekeeping?query=stats - Get housekeeping stats"""
        response = requests.get(f"{BASE_URL}/api/hospitality/housekeeping?query=stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "stats" in data
        
        stats = data["stats"]
        assert "totalTasks" in stats
        assert "pendingTasks" in stats
        assert "completedTasks" in stats


class TestFolioAPI:
    """Tests for folio API endpoint"""
    
    def test_get_all_folios(self):
        """GET /api/hospitality/folio - Returns 3 demo folios"""
        response = requests.get(f"{BASE_URL}/api/hospitality/folio")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "folios" in data
        assert len(data["folios"]) == 3
        
        # Verify folio structure
        folio = data["folios"][0]
        assert "id" in folio
        assert "guestName" in folio
        assert "roomNumber" in folio
        assert "charges" in folio
        assert "totalCharges" in folio
        assert "totalPayments" in folio
        assert "balance" in folio
        assert "status" in folio
        
        # Verify stats
        assert "stats" in data
        stats = data["stats"]
        assert stats["totalFolios"] == 3
    
    def test_filter_folios_by_status(self):
        """GET /api/hospitality/folio?status=OPEN - Filter by status"""
        response = requests.get(f"{BASE_URL}/api/hospitality/folio?status=OPEN")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        for folio in data["folios"]:
            assert folio["status"] == "OPEN"
    
    def test_get_folio_stats(self):
        """GET /api/hospitality/folio?query=stats - Get folio stats"""
        response = requests.get(f"{BASE_URL}/api/hospitality/folio?query=stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "stats" in data
        
        stats = data["stats"]
        assert "totalFolios" in stats
        assert "openFolios" in stats
        assert "totalRevenue" in stats
        assert "outstandingBalance" in stats


class TestReservationActions:
    """Tests for reservation check-in/check-out actions"""
    
    def test_check_in_confirmed_reservation(self):
        """POST /api/hospitality/reservations - Check-in action on confirmed reservation"""
        # First get a confirmed reservation
        response = requests.get(f"{BASE_URL}/api/hospitality/reservations?status=CONFIRMED")
        data = response.json()
        
        if data["success"] and len(data["reservations"]) > 0:
            res_id = data["reservations"][0]["id"]
            
            # Perform check-in
            response = requests.post(
                f"{BASE_URL}/api/hospitality/reservations",
                json={
                    "action": "check-in",
                    "reservationId": res_id
                }
            )
            assert response.status_code == 200
            
            result = response.json()
            assert result["success"] is True
            assert "reservation" in result
            assert result["reservation"]["status"] == "CHECKED_IN"
        else:
            pytest.skip("No confirmed reservations available for check-in test")


class TestHousekeepingActions:
    """Tests for housekeeping task actions"""
    
    def test_start_pending_task(self):
        """POST /api/hospitality/housekeeping - Start a pending task"""
        # First get a pending task
        response = requests.get(f"{BASE_URL}/api/hospitality/housekeeping?status=PENDING")
        data = response.json()
        
        if data["success"] and len(data["tasks"]) > 0:
            task_id = data["tasks"][0]["id"]
            
            # Start the task
            response = requests.post(
                f"{BASE_URL}/api/hospitality/housekeeping",
                json={
                    "action": "start",
                    "taskId": task_id
                }
            )
            assert response.status_code == 200
            
            result = response.json()
            assert result["success"] is True
            assert "task" in result
            assert result["task"]["status"] == "IN_PROGRESS"
        else:
            pytest.skip("No pending tasks available for start test")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
