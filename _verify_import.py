import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    req = urllib.request.Request('https://itsm.expertflow.com/api/sheets/laptop-record?page=1&limit=5', method='GET')
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        data = json.loads(resp.read().decode('utf-8', errors='replace'))
        print('Total:', data['meta']['total'])
        print('First 3 rows:')
        for row in data['data'][:3]:
            print(f"  sr={row.get('sr')}, name={row.get('employeeName')}, dept={row.get('department')}, serial={row.get('serialNumber')}")
except Exception as e:
    print('Error:', e)
