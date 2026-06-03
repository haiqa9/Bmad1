import urllib.request
import json
import re

url = "http://192.168.1.38:3000/api/auth/callback/credentials"
payload = json.dumps({"email": "admin@expertflow.com", "password": "wrong"}).encode("utf-8")
headers = {"Content-Type": "application/json"}

for i in range(1, 8):
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")

    has_limit = "Too many login attempts" in body
    has_error = "error" in body.lower()
    snippet = ""
    if "error" in body.lower():
        idx = body.lower().find("error")
        snippet = repr(body[max(0, idx-30):idx+100])
    print(f"Attempt {i}: too_many={has_limit}, has_error={has_error}, snippet={snippet}")
