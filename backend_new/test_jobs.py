# test_jobs.py
import requests
import json

def test_jobs_endpoint():
    print("🧪 Testing jobs endpoint...")
    
    # First, login
    login_url = "http://localhost:8000/token"
    login_data = {
        "username": "anuj",  # Change this
        "password": "123456"   # Change this
    }
    
    try:
        # Login
        print("1. Logging in...")
        login_response = requests.post(login_url, data=login_data)
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(login_response.text)
            return
        
        token_data = login_response.json()
        token = token_data['access_token']
        print(f"✅ Login successful, token: {token[:20]}...")
        
        # Test jobs endpoint
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        jobs_url = "http://localhost:8000/api/jobs"
        print(f"2. Testing {jobs_url}...")
        
        response = requests.get(jobs_url, headers=headers)
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Found {len(data.get('jobs', []))} jobs")
            print(f"Total jobs: {data.get('total', 0)}")
            
            if data.get('jobs'):
                for i, job in enumerate(data['jobs'][:3]):
                    print(f"Job {i+1}: {job.get('title', 'No title')}")
                    print(f"  Budget: {job.get('budget_display', 'No budget')}")
                    print(f"  Client: {job.get('client', {}).get('full_name', 'No client')}")
            else:
                print("⚠️ No jobs returned")
        else:
            print("❌ Failed to get jobs")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_jobs_endpoint()