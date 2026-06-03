import pandas as pd
import uuid

df = pd.read_excel(r'D:\Bmad\server.xlsx')

sql_lines = ['DELETE FROM "ServerDevice";']
for idx, row in df.iterrows():
    uid = str(uuid.uuid4())
    model = str(row['MODEL']).strip() if pd.notna(row['MODEL']) else ''
    serialNumber = str(row['Serial Number']).strip() if pd.notna(row['Serial Number']) else ''
    cpus = str(row['CPUs']).strip() if pd.notna(row['CPUs']) else ''
    processor = str(row['PROCESSOR ']).strip() if pd.notna(row['PROCESSOR ']) else ''
    ram = str(row['RAM']).strip() if pd.notna(row['RAM']) else ''
    storage = str(row['STORAGE']).strip() if pd.notna(row['STORAGE']) else ''
    ip = str(row['I.P']).strip() if pd.notna(row['I.P']) else ''
    osVersion = str(row['OS version']).strip() if pd.notna(row['OS version']) else ''
    status = str(row['STATUS']).strip() if pd.notna(row['STATUS']) else ''
    noOfExistingVms = str(int(row['No of Existing VMs'])) if pd.notna(row['No of Existing VMs']) else ''
    iloIps = str(row['ILO IPs']).strip() if pd.notna(row['ILO IPs']) else ''

    def esc(v):
        return v.replace("'", "''") if v else ''

    cols = ['"id"', '"model"', '"serialNumber"', '"cpus"', '"processor"', '"ram"', '"storage"', '"ip"', '"osVersion"', '"status"', '"noOfExistingVms"', '"iloIps"', '"createdAt"', '"updatedAt"']
    vals = [
        f"'{uid}'",
        f"'{esc(model)}'" if model else 'NULL',
        f"'{esc(serialNumber)}'" if serialNumber else 'NULL',
        f"'{esc(cpus)}'" if cpus else 'NULL',
        f"'{esc(processor)}'" if processor else 'NULL',
        f"'{esc(ram)}'" if ram else 'NULL',
        f"'{esc(storage)}'" if storage else 'NULL',
        f"'{esc(ip)}'" if ip else 'NULL',
        f"'{esc(osVersion)}'" if osVersion else 'NULL',
        f"'{esc(status)}'" if status else 'NULL',
        f"'{esc(noOfExistingVms)}'" if noOfExistingVms else 'NULL',
        f"'{esc(iloIps)}'" if iloIps else 'NULL',
        'CURRENT_TIMESTAMP',
        'CURRENT_TIMESTAMP',
    ]
    sql = 'INSERT INTO "ServerDevice" (' + ', '.join(cols) + ') VALUES (' + ', '.join(vals) + ');'
    sql_lines.append(sql)

with open(r'D:\Bmad\import_servers.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f'Generated {len(df)} INSERT statements')
