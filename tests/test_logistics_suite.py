"""
LOGISTICS SUITE: Backend API Tests
Tests for /api/logistics-suite/* endpoints

Demo company: Swift Dispatch Co. (Lagos, Nigeria)
Demo data: 10 vehicles, 6 drivers, 8 jobs
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('NEXT_PUBLIC_APP_URL', 'https://prisma-enum-bridge.preview.emergentagent.com')


class TestLogisticsSuiteMain:
    """Tests for main /api/logistics-suite endpoint"""
    
    def test_get_suite_config_and_stats(self):
        """GET /api/logistics-suite - Returns suite configuration and stats"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["companyName"] == "Swift Dispatch Co."
        assert data["companyLocation"] == "Lagos, Nigeria"
        
        # Verify config structure
        assert "config" in data
        assert "labels" in data["config"]
        assert "vehicleTypes" in data["config"]
        assert "driverStatus" in data["config"]
        assert "jobStatus" in data["config"]
        
        # Verify stats structure
        assert "stats" in data
        assert "fleet" in data["stats"]
        assert "drivers" in data["stats"]
        assert "jobs" in data["stats"]
        
        # Verify tracking board
        assert "trackingBoard" in data
        assert isinstance(data["trackingBoard"], list)
    
    def test_get_demo_data_action(self):
        """POST /api/logistics-suite - get-demo-data action"""
        response = requests.post(
            f"{BASE_URL}/api/logistics-suite",
            json={"action": "get-demo-data"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["companyName"] == "Swift Dispatch Co."
        assert "stats" in data


class TestFleetAPI:
    """Tests for /api/logistics-suite/fleet endpoint"""
    
    def test_get_all_vehicles(self):
        """GET /api/logistics-suite/fleet - Returns all 10 demo vehicles"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/fleet")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["total"] == 10
        assert len(data["vehicles"]) == 10
        
        # Verify stats
        assert "stats" in data
        assert data["stats"]["totalVehicles"] == 10
        assert data["stats"]["activeVehicles"] == 9
    
    def test_get_available_vehicles(self):
        """GET /api/logistics-suite/fleet?query=available - Returns available vehicles"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/fleet?query=available")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "vehicles" in data
        assert "count" in data
        
        # All returned vehicles should be available
        for vehicle in data["vehicles"]:
            assert vehicle["status"] == "AVAILABLE"
            assert vehicle["isActive"] is True
    
    def test_filter_vehicles_by_type(self):
        """GET /api/logistics-suite/fleet?vehicleType=MOTORCYCLE - Filter by type"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/fleet?vehicleType=MOTORCYCLE")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # All returned vehicles should be motorcycles
        for vehicle in data["vehicles"]:
            assert vehicle["vehicleType"] == "MOTORCYCLE"
    
    def test_filter_vehicles_by_status(self):
        """GET /api/logistics-suite/fleet?status=IN_USE - Filter by status"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/fleet?status=IN_USE")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # All returned vehicles should be in use
        for vehicle in data["vehicles"]:
            assert vehicle["status"] == "IN_USE"
    
    def test_get_fleet_stats(self):
        """GET /api/logistics-suite/fleet?query=stats - Returns fleet stats"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/fleet?query=stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "stats" in data
        assert "totalVehicles" in data["stats"]
        assert "available" in data["stats"]
        assert "inUse" in data["stats"]
        assert "utilizationRate" in data["stats"]


class TestDriversAPI:
    """Tests for /api/logistics-suite/drivers endpoint"""
    
    def test_get_all_drivers(self):
        """GET /api/logistics-suite/drivers - Returns all 6 demo drivers"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/drivers")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["total"] == 6
        assert len(data["drivers"]) == 6
        
        # Verify stats
        assert "stats" in data
        assert data["stats"]["totalDrivers"] == 6
        assert data["stats"]["activeDrivers"] == 5
        assert data["stats"]["suspended"] == 1
    
    def test_get_available_drivers(self):
        """GET /api/logistics-suite/drivers?query=available - Returns available drivers"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/drivers?query=available")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "drivers" in data
        assert "count" in data
        
        # All returned drivers should be available
        for driver in data["drivers"]:
            assert driver["status"] == "AVAILABLE"
            assert driver["isActive"] is True
    
    def test_filter_drivers_by_status(self):
        """GET /api/logistics-suite/drivers?status=ON_TRIP - Filter by status"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/drivers?status=ON_TRIP")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # All returned drivers should be on trip
        for driver in data["drivers"]:
            assert driver["status"] == "ON_TRIP"
    
    def test_search_drivers(self):
        """GET /api/logistics-suite/drivers?search=Ngozi - Search by name"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/drivers?search=Ngozi")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert len(data["drivers"]) >= 1
        
        # Verify search result contains Ngozi
        found = any("Ngozi" in d["firstName"] for d in data["drivers"])
        assert found is True
    
    def test_get_driver_stats(self):
        """GET /api/logistics-suite/drivers?query=stats - Returns driver stats"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/drivers?query=stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "stats" in data
        assert "totalDrivers" in data["stats"]
        assert "available" in data["stats"]
        assert "onTrip" in data["stats"]
        assert "averageRating" in data["stats"]


class TestJobsAPI:
    """Tests for /api/logistics-suite/jobs endpoint"""
    
    def test_get_all_jobs(self):
        """GET /api/logistics-suite/jobs - Returns all 8 demo jobs"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/jobs")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert data["total"] == 8
        assert len(data["jobs"]) == 8
        
        # Verify stats
        assert "stats" in data
        assert data["stats"]["totalJobs"] == 8
    
    def test_get_pending_jobs(self):
        """GET /api/logistics-suite/jobs?query=pending - Returns pending jobs"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/jobs?query=pending")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "jobs" in data
        assert "count" in data
        
        # All returned jobs should be pending or created
        for job in data["jobs"]:
            assert job["status"] in ["PENDING", "CREATED"]
    
    def test_get_active_jobs(self):
        """GET /api/logistics-suite/jobs?query=active - Returns active jobs"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/jobs?query=active")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "jobs" in data
        assert "count" in data
        
        # Active jobs should not be completed, cancelled, or failed
        for job in data["jobs"]:
            assert job["status"] not in ["COMPLETED", "CANCELLED", "FAILED"]
    
    def test_filter_jobs_by_status(self):
        """GET /api/logistics-suite/jobs?status=IN_TRANSIT - Filter by status"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/jobs?status=IN_TRANSIT")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # All returned jobs should be in transit
        for job in data["jobs"]:
            assert job["status"] == "IN_TRANSIT"
    
    def test_filter_jobs_by_priority(self):
        """GET /api/logistics-suite/jobs?priority=HIGH - Filter by priority"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/jobs?priority=HIGH")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        
        # All returned jobs should be high priority
        for job in data["jobs"]:
            assert job["priority"] == "HIGH"
    
    def test_get_job_stats(self):
        """GET /api/logistics-suite/jobs?query=stats - Returns job stats"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/jobs?query=stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "stats" in data
        assert "totalJobs" in data["stats"]
        assert "activeJobs" in data["stats"]
        assert "pendingJobs" in data["stats"]
        assert "completedJobs" in data["stats"]


class TestTrackingAPI:
    """Tests for /api/logistics-suite/tracking endpoint"""
    
    def test_get_tracking_board(self):
        """GET /api/logistics-suite/tracking - Returns tracking board"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/tracking")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "board" in data
        assert isinstance(data["board"], list)
        
        # Verify board item structure
        if len(data["board"]) > 0:
            item = data["board"][0]
            assert "jobId" in item
            assert "jobNumber" in item
            assert "status" in item
            assert "priority" in item
            assert "deliveryAddress" in item
    
    def test_get_tracking_board_query(self):
        """GET /api/logistics-suite/tracking?query=board - Returns tracking board"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/tracking?query=board")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "board" in data


class TestJobStatusUpdate:
    """Tests for job status update functionality"""
    
    def test_update_job_status(self):
        """POST /api/logistics-suite/jobs - update-status action"""
        # First get an active job
        response = requests.get(f"{BASE_URL}/api/logistics-suite/jobs?query=active")
        data = response.json()
        
        if len(data["jobs"]) > 0:
            # Find a job that can be updated (IN_TRANSIT -> AT_DELIVERY)
            in_transit_jobs = [j for j in data["jobs"] if j["status"] == "IN_TRANSIT"]
            
            if len(in_transit_jobs) > 0:
                job = in_transit_jobs[0]
                
                # Update status
                update_response = requests.post(
                    f"{BASE_URL}/api/logistics-suite/jobs",
                    json={
                        "action": "update-status",
                        "jobId": job["id"],
                        "status": "AT_DELIVERY",
                        "updatedBy": "test"
                    }
                )
                
                assert update_response.status_code == 200
                update_data = update_response.json()
                assert update_data["success"] is True
                assert "job" in update_data
    
    def test_invalid_action_returns_error(self):
        """POST /api/logistics-suite/jobs - Invalid action returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/logistics-suite/jobs",
            json={"action": "invalid-action", "jobId": "job_001"}
        )
        
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False


class TestDataIntegrity:
    """Tests for data integrity and relationships"""
    
    def test_vehicle_driver_relationship(self):
        """Verify vehicles with drivers have correct driver info"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/fleet?status=IN_USE")
        data = response.json()
        
        for vehicle in data["vehicles"]:
            if vehicle["status"] == "IN_USE":
                assert vehicle.get("currentDriverId") is not None
                assert vehicle.get("currentDriverName") is not None
    
    def test_driver_vehicle_relationship(self):
        """Verify drivers on trip have correct vehicle info"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/drivers?status=ON_TRIP")
        data = response.json()
        
        for driver in data["drivers"]:
            if driver["status"] == "ON_TRIP":
                assert driver.get("currentVehicleId") is not None
                assert driver.get("currentVehicleNumber") is not None
    
    def test_job_assignment_data(self):
        """Verify assigned jobs have driver and vehicle info"""
        response = requests.get(f"{BASE_URL}/api/logistics-suite/jobs?query=active")
        data = response.json()
        
        for job in data["jobs"]:
            if job["status"] not in ["CREATED", "PENDING"]:
                # Assigned jobs should have driver info
                assert job.get("driverName") is not None or job["status"] in ["CREATED", "PENDING"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
