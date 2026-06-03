import pandas as pd
import uuid

df = pd.read_excel(r'D:\Bmad\ITAM\Devices.xlsx')

# Create table SQL
create_sql = '''CREATE TABLE IF NOT EXISTS "Device" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "device" TEXT,
  "model" TEXT,
  "modelNumber" TEXT,
  "serialNumber" TEXT,
  "ip" TEXT,
  "battery" TEXT,
  "status" TEXT,
  "bw" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
'''

sql_lines = [create_sql, 'DELETE FROM "Device";']

for idx, row in df.iterrows():
    uid = str(uuid.uuid4())
    device = str(row['Device']).strip() if pd.notna(row['Device']) else ''
    model = str(row['MODEL']).strip() if pd.notna(row['MODEL']) else ''
    modelNumber = str(row['Model Number']).strip() if pd.notna(row['Model Number']) else ''
    serialNumber = str(row['Serial Number']).strip() if pd.notna(row['Serial Number']) else ''
    ip = str(row['I.P']).strip() if pd.notna(row['I.P']) else ''
    battery = str(row['Battery']).strip() if pd.notna(row['Battery']) else ''
    status = str(row['STATUS']).strip() if pd.notna(row['STATUS']) else ''
    bw = str(row['BW']).strip() if pd.notna(row['BW']) else ''

    def esc(v):
        return v.replace("'", "''") if v else ''

    cols = ['"id"', '"device"', '"model"', '"modelNumber"', '"serialNumber"', '"ip"', '"battery"', '"status"', '"bw"', '"createdAt"', '"updatedAt"']
    vals = [
        f"'{uid}'",
        f"'{esc(device)}'" if device else 'NULL',
        f"'{esc(model)}'" if model else 'NULL',
        f"'{esc(modelNumber)}'" if modelNumber else 'NULL',
        f"'{esc(serialNumber)}'" if serialNumber else 'NULL',
        f"'{esc(ip)}'" if ip else 'NULL',
        f"'{esc(battery)}'" if battery else 'NULL',
        f"'{esc(status)}'" if status else 'NULL',
        f"'{esc(bw)}'" if bw else 'NULL',
        'CURRENT_TIMESTAMP',
        'CURRENT_TIMESTAMP',
    ]
    sql = 'INSERT INTO "Device" (' + ', '.join(cols) + ') VALUES (' + ', '.join(vals) + ');'
    sql_lines.append(sql)

with open(r'D:\Bmad\import_devices.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f'Generated {len(df)} INSERT statements')
