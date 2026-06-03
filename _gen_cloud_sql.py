import pandas as pd
import uuid

df = pd.read_excel(r'D:\Bmad\ITAM\cloud.xlsx')

def fmt_date(val):
    if pd.isna(val):
        return ''
    if isinstance(val, pd.Timestamp):
        return val.strftime('%Y-%m-%d')
    return str(val).strip()

def esc(v):
    return v.replace("'", "''") if v else ''

sql_lines = ['DELETE FROM "CloudVm";']

for idx, row in df.iterrows():
    uid = str(uuid.uuid4())
    no = str(idx + 1)  # Sequential starting from 1
    cloudVmUsageDescription = str(row['Cloud VM - usage - description']).strip() if pd.notna(row['Cloud VM - usage - description']) else ''
    ipAddress = str(row['IP Address']).strip() if pd.notna(row['IP Address']) else ''
    fqdn = str(row['FQDN ( if any)']).strip() if pd.notna(row['FQDN ( if any)']) else ''
    cloud = str(row['Cloud']).strip() if pd.notna(row['Cloud']) else ''
    specifications = str(row['Specifications']).strip() if pd.notna(row['Specifications']) else ''
    userDepartment = str(row['User / Department']).strip() if pd.notna(row['User / Department']) else ''
    sslStatus = str(row['SSL Status']).strip() if pd.notna(row['SSL Status']) else ''
    sslExpiry = fmt_date(row['SSL Expiry'])

    cols = ['"id"', '"no"', '"cloudVmUsageDescription"', '"ipAddress"', '"fqdn"', '"cloud"', '"specifications"', '"userDepartment"', '"sslStatus"', '"sslExpiry"', '"createdAt"', '"updatedAt"']
    vals = [
        f"'{uid}'",
        f"'{esc(no)}'" if no else 'NULL',
        f"'{esc(cloudVmUsageDescription)}'" if cloudVmUsageDescription else 'NULL',
        f"'{esc(ipAddress)}'" if ipAddress else 'NULL',
        f"'{esc(fqdn)}'" if fqdn else 'NULL',
        f"'{esc(cloud)}'" if cloud else 'NULL',
        f"'{esc(specifications)}'" if specifications else 'NULL',
        f"'{esc(userDepartment)}'" if userDepartment else 'NULL',
        f"'{esc(sslStatus)}'" if sslStatus else 'NULL',
        f"'{esc(sslExpiry)}'" if sslExpiry else 'NULL',
        'CURRENT_TIMESTAMP',
        'CURRENT_TIMESTAMP',
    ]
    sql = 'INSERT INTO "CloudVm" (' + ', '.join(cols) + ') VALUES (' + ', '.join(vals) + ');'
    sql_lines.append(sql)

with open(r'D:\Bmad\import_cloud.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f'Generated {len(df)} INSERT statements with sr 1-{len(df)}')
