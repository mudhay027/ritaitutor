import requests

try:
    response = requests.post("http://localhost:8001/rebuild")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
