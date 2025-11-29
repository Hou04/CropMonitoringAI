import requests
import sys

BASE_URL = 'http://127.0.0.1:8000/api'

def test_flow():
    print("1. Logging in...")
    try:
        resp = requests.post(f'{BASE_URL}/login/', json={'username': 'admin', 'password': 'admin123'})
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Is it running on port 8000?")
        return

    if resp.status_code != 200:
        print(f"❌ Login failed: {resp.status_code} - {resp.text}")
        return

    data = resp.json()
    access_token = data.get('access')
    print(f"✅ Login successful. Token: {access_token[:20]}...")

    headers = {'Authorization': f'Bearer {access_token}'}

    print("\n2. Creating Farm...")
    farm_data = {
        'name': 'Test Farm',
        'location': 'Test Location',
        'crop_type': 'Wheat'
    }
    resp = requests.post(f'{BASE_URL}/farms/', json=farm_data, headers=headers)
    if resp.status_code == 201:
        farm = resp.json()
        print(f"✅ Farm created: ID {farm['id']}")
        farm_id = farm['id']
    else:
        print(f"❌ Farm creation failed: {resp.status_code} - {resp.text}")
        # Try to get existing farm
        print("   Attempting to fetch existing farms...")
        resp = requests.get(f'{BASE_URL}/farms/', headers=headers)
        if resp.status_code == 200 and len(resp.json()) > 0:
            farm = resp.json()[0]
            farm_id = farm['id']
            print(f"   Using existing farm: ID {farm_id}")
        else:
            return

    print("\n3. Creating Plot...")
    plot_data = {
        'name': 'Test Plot',
        'farm_id': farm_id,
        'crop_variety': 'Winter Wheat',
        'area_hectares': 10.5
    }
    resp = requests.post(f'{BASE_URL}/plots/', json=plot_data, headers=headers)
    if resp.status_code == 201:
        print(f"✅ Plot created: {resp.json()}")
    else:
        print(f"❌ Plot creation failed: {resp.status_code} - {resp.text}")

if __name__ == '__main__':
    test_flow()
