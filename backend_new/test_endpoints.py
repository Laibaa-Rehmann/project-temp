# test_endpoints.py
import requests
import json

# Test credentials
login_data = {
    "username": "anuj",  # or your freelancer email
    "password": "123456"
}

print("Testing backend endpoints...")

try:
    # 1. Test login
    print("1. Testing login...")
    response = requests.post("http://127.0.0.1:8000/token", data=login_data)
    
    if response.status_code == 200:
        token_data = response.json()
        token = token_data["access_token"]
        user = token_data["user"]
        print(f"   ✅ Login successful!")
        print(f"   User: {user['full_name']} ({user['user_type']})")
        print(f"   Token: {token[:50]}...")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # 2. Test dashboard stats
        print("\n2. Testing dashboard stats...")
        stats_response = requests.get("http://localhost:8000/api/dashboard/stats", headers=headers)
        
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print(f"   ✅ Stats endpoint working!")
            print(f"   Active Proposals: {stats['active_proposals']}")
            print(f"   Profile Completion: {stats['profile_completion']}%")
            print(f"   Total Earnings: ${stats['total_earnings']}")
        else:
            print(f"   ❌ Stats failed: {stats_response.status_code}")
            print(f"   Response: {stats_response.text}")
        
        # 3. Test recent activity
        print("\n3. Testing recent activity...")
        activity_response = requests.get("http://localhost:8000/api/dashboard/activity", headers=headers)
        
        if activity_response.status_code == 200:
            activities = activity_response.json()
            print(f"   ✅ Activity endpoint working!")
            print(f"   Activities found: {len(activities)}")
            if activities:
                for i, activity in enumerate(activities[:2], 1):
                    print(f"   {i}. {activity['title'][:50]}...")
        else:
            print(f"   ❌ Activity failed: {activity_response.status_code}")
        
        # 4. Test recommended jobs
        print("\n4. Testing recommended jobs...")
        jobs_response = requests.get("http://localhost:8000/api/dashboard/recommended-jobs", headers=headers)
        
        if jobs_response.status_code == 200:
            jobs = jobs_response.json()
            print(f"   ✅ Jobs endpoint working!")
            print(f"   Jobs recommended: {len(jobs)}")
            if jobs:
                for i, job in enumerate(jobs[:2], 1):
                    print(f"   {i}. {job['title'][:50]}...")
        else:
            print(f"   ❌ Jobs failed: {jobs_response.status_code}")
        
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")