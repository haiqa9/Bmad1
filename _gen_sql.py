import json
import uuid

with open(r'D:\Bmad\laptop_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

sql_lines = [
    'DELETE FROM "LaptopRecord";',
]

for row in data:
    uid = str(uuid.uuid4())
    cols = ['"id"', '"sr"', '"employeeName"', '"department"', '"status"', '"date"', '"serialNumber"', '"laptop"', '"model"', '"cpu"', '"ram"', '"hdd"', '"lcd"', '"keyboard"', '"mouse"', '"laptopBag"', '"headPhones"', '"mousepad"', '"comment"', '"isIssued"', '"createdAt"', '"updatedAt"']
    vals = [
        f"'{uid}'",
        f"'{row['sr'].replace(chr(39), chr(39)+chr(39))}'" if row['sr'] else 'NULL',
        f"'{row['employeeName'].replace(chr(39), chr(39)+chr(39))}'" if row['employeeName'] else 'NULL',
        f"'{row['department'].replace(chr(39), chr(39)+chr(39))}'" if row['department'] else 'NULL',
        f"'{row['status'].replace(chr(39), chr(39)+chr(39))}'" if row['status'] else 'NULL',
        f"'{row['date'].replace(chr(39), chr(39)+chr(39))}'" if row['date'] else 'NULL',
        f"'{row['serialNumber'].replace(chr(39), chr(39)+chr(39))}'" if row['serialNumber'] else 'NULL',
        f"'{row['laptop'].replace(chr(39), chr(39)+chr(39))}'" if row['laptop'] else 'NULL',
        f"'{row['model'].replace(chr(39), chr(39)+chr(39))}'" if row['model'] else 'NULL',
        f"'{row['cpu'].replace(chr(39), chr(39)+chr(39))}'" if row['cpu'] else 'NULL',
        f"'{row['ram'].replace(chr(39), chr(39)+chr(39))}'" if row['ram'] else 'NULL',
        f"'{row['hdd'].replace(chr(39), chr(39)+chr(39))}'" if row['hdd'] else 'NULL',
        f"'{row['lcd'].replace(chr(39), chr(39)+chr(39))}'" if row['lcd'] else 'NULL',
        f"'{row['keyboard'].replace(chr(39), chr(39)+chr(39))}'" if row['keyboard'] else 'NULL',
        f"'{row['mouse'].replace(chr(39), chr(39)+chr(39))}'" if row['mouse'] else 'NULL',
        f"'{row['laptopBag'].replace(chr(39), chr(39)+chr(39))}'" if row['laptopBag'] else 'NULL',
        f"'{row['headPhones'].replace(chr(39), chr(39)+chr(39))}'" if row['headPhones'] else 'NULL',
        f"'{row['mousepad'].replace(chr(39), chr(39)+chr(39))}'" if row['mousepad'] else 'NULL',
        f"'{row['comment'].replace(chr(39), chr(39)+chr(39))}'" if row['comment'] else 'NULL',
        'TRUE' if row['isIssued'] else 'FALSE',
        'CURRENT_TIMESTAMP',
        'CURRENT_TIMESTAMP',
    ]
    sql = f"INSERT INTO \"LaptopRecord\" ({', '.join(cols)}) VALUES ({', '.join(vals)});"
    sql_lines.append(sql)

with open(r'D:\Bmad\import_laptops.sql', 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f'Generated {len(data)} INSERT statements')
