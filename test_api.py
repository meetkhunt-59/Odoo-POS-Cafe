import requests

BASE_URL = "http://localhost:8000"

def test_routes():
    # Test auth login (will fail without creds, but we check 401/405)
    print("Testing GET /backend/products...")
    r = requests.get(f"{BASE_URL}/backend/products")
    print(f"Status: {r.status_code}")
    print(f"Content: {r.text[:100]}")

    print("\nTesting GET /backend/product-categories...")
    r = requests.get(f"{BASE_URL}/backend/product-categories")
    print(f"Status: {r.status_code}")

if __name__ == "__main__":
    try:
        test_routes()
    except Exception as e:
        print(f"Error: {e}")
