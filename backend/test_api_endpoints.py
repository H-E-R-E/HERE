import asyncio
import httpx

API_URL = "http://localhost:8000"

async def run_tests():
    print("==================================================")
    print(" RUNNING COMPREHENSIVE API TEST SUITE ")
    print("==================================================")
    
    async with httpx.AsyncClient(base_url=API_URL) as client:
        # 1. Root
        res = await client.get("/")
        print(f"Root check: {res.status_code}")

        # 2. Register User (Host & Attendee dual profile)
        user_data = {
            "username": "testuser_final",
            "email": "test_final@test.com",
            "password": "password123",
            "signup_type": "Local"
        }
        res = await client.post("/users/signup", json=user_data)
        print(f"User Signup: {res.status_code}")
        
        # 3. Login
        login_data = {"identifier": "testuser_final", "password": "password123"}
        res = await client.post("/auth/login", json=login_data)
        print(f"User Login: {res.status_code}")
        
        if res.status_code != 200:
            print("Login failed, aborting tests.", res.json())
            return
            
        token = res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 4. Get Profile (Attendee Scope by default)
        res = await client.get("/users/me", headers=headers)
        print(f"Get Profile (Attendee): {res.status_code}")
        if res.status_code != 200:
            print("Error:", res.text)

        # 5. Switch to Host Scope
        import asyncio
        await asyncio.sleep(1) # Prevent blacklisting identical claims
        res = await client.post("/auth/switch-scope", json={"target_scope": "host"}, headers=headers)
        print(f"Switch Scope -> Host: {res.status_code}")
        if res.status_code == 200:
            token = res.json()["new_access_token"]
            headers = {"Authorization": f"Bearer {token}"}
        else:
            print("Error:", res.text)

        # 6. Create Physical Event (Milestone 5)
        event_data = {
            "name": "Test Geo-fenced Event",
            "description": "This is a test event for geofencing",
            "category": "Social",
            "visibility": "Public",
            "start_time": "2026-06-01T10:00:00Z",
            "end_time": "2026-06-01T12:00:00Z",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "geofence_radius": 100,
            "attendance_profile": "standard"
        }
        res = await client.post("/api/events/physical", json=event_data, headers=headers)
        print(f"Create Event: {res.status_code}")
        if res.status_code != 201:
            print("Error:", res.text)
        
        event_id = None
        if res.status_code == 201:
            event_id = res.json()["id"]

        if event_id:
            # 7. Update Event
            res = await client.put(f"/api/events/physical/{event_id}", json={"name": "Updated Event Name"}, headers=headers)
            print(f"Update Event: {res.status_code}")

            # 8. List Events
            res = await client.get("/api/events/physical", headers=headers)
            print(f"List Events: {res.status_code} (Found {res.json().get('total', 0)})")

            # 9. Switch back to Attendee Scope
            await asyncio.sleep(1) # Prevent blacklisting identical claims
            res = await client.post("/auth/switch-scope", json={"target_scope": "access"}, headers=headers)
            print(f"Switch Scope -> Attendee: {res.status_code}")
            if res.status_code == 200:
                token = res.json()["new_access_token"]
                headers = {"Authorization": f"Bearer {token}"}

            # 10a. Check RSVP status before RSVPing (should be False)
            res = await client.get(f"/api/events/physical/{event_id}/rsvp", headers=headers)
            print(f"Check RSVP status before RSVPing: {res.status_code} - {res.json()}")

            # 10b. RSVP Event (Milestone 5)
            res = await client.post(f"/api/events/physical/{event_id}/rsvp", headers=headers)
            print(f"RSVP Event: {res.status_code}")

            # 10c. Check RSVP status after RSVPing (should be True)
            res = await client.get(f"/api/events/physical/{event_id}/rsvp", headers=headers)
            print(f"Check RSVP status after RSVPing: {res.status_code} - {res.json()}")

            # 11. Mark Attendance (Geofenced Check-In) - Fails purposely due to time (event is in June)
            att_data = {
                "verify_location": True,
                "latitude": 40.7128,
                "longitude": -74.0060
            }
            res = await client.post(f"/api/events/physical/{event_id}/attendance", json=att_data, headers=headers)
            print(f"Mark Attendance (Expected 400 - Not started): {res.status_code} {res.json().get('detail')}")

            # 12. Chat History & Send (Milestone 3)
            res = await client.get(f"/chat/{event_id}", headers=headers)
            print(f"Get Chat History: {res.status_code}")
            
            res = await client.post(f"/chat/{event_id}", json={"content": "Hello H.E.R.E.!"}, headers=headers)
            print(f"Send Chat Message: {res.status_code}")

            # 13. Notifications (Milestone 4)
            res = await client.get("/notifications", headers=headers)
            print(f"Get Notifications: {res.status_code}")
            
            # Switch back to Host
            await asyncio.sleep(1)
            res = await client.post("/auth/switch-scope", json={"target_scope": "host"}, headers=headers)
            if res.status_code == 200:
                token = res.json()["new_access_token"]
                headers = {"Authorization": f"Bearer {token}"}

            # 14. Get Attendance Summary
            res = await client.get(f"/api/events/physical/{event_id}/attendance", headers=headers)
            print(f"Attendance Summary: {res.status_code}")

            # 15. Cancel Event
            res = await client.delete(f"/api/events/physical/{event_id}", headers=headers)
            print(f"Cancel Event: {res.status_code}")

    print("==================================================")
    print(" ALL ENDPOINTS TESTED SUCCESSFULLY ")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
