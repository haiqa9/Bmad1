import urllib.request
import json
import time

url = "http://192.168.1.38:3000/api/auth/callback/credentials"
payload = json.dumps({"email": "admin@expertflow.com", "password": "wrong"}).encode("utf-8")
headers = {"Content-Type": "application/json"}

for i in range(1, 8):
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Attempt {i}: HTTP {resp.status}, body={resp.read(200)!r}")
    except urllib.error.HTTPError as e:
        print(f"Attempt {i}: HTTP {e.code}, body={e.read(200)!r}")
    time.sleep(0.5)
