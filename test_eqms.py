import requests
import json

url = 'http://127.0.0.1:5000/assess_deviation'

# חריגת ייצור לדוגמה
payload = {
    "submitter_id": "QA_Emp_042",
    "deviation_text": "During the aseptic filling process in the ISO 5 cleanroom, the HEPA filter pressure differential dropped below the validated limit of 10 Pa for 15 minutes. The operation was immediately halted and maintenance was called to inspect the HVAC system."
}

print("Sending deviation to the eQMS server...\n")
response = requests.post(url, json=payload)

print(f"Status Code: {response.status_code}")
print("Response from server:")
print(json.dumps(response.json(), indent=4))