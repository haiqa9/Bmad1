const fs = require('fs');
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const seedData = JSON.parse(fs.readFileSync('/app/prisma/seed-data.json', 'utf-8'));

const tableMap = {
  'laptop-record': 'LaptopRecord',
  'servers-devices': 'ServerDevice',
  'iloidrac': 'IloIdrac',
  'cloud-vm-list': 'CloudVm',
  'lab-vm-list': 'LabVm',
  'public-fqdn': 'PublicFqdn',
  'gatepass': 'GatePass',
  'received-items': 'ReceivedItem',
  'ports-detail': 'PortDetail',
  'free-vms': 'FreeVm',
  'sheet38': 'Sheet38',
};

const fieldMap = {
  'laptop-record': ['sr','employeeName','department','status','date','serialNumber','laptop','model','cpu','ram','hdd','lcd','keyboard','mouse','laptopBag','headPhones','mousepad','comment'],
  'servers-devices': ['model','serialNumber','cpus','processor','ram','storage','ip','osVersion','status','noOfExistingVms','iloIps'],
  'iloidrac': ['servers','ip','iloIdracIp','switchPort','comments'],
  'cloud-vm-list': ['no','cloudVmUsageDescription','ipAddress','ownerUserTeam','fqdn','cloud','specifications','userDepartment','sslStatus','sslExpiry'],
  'lab-vm-list': ['col1','department','vmName','hostServer','memorySize','ipAddress','dnsName','col8','sslStatus','sslExpiry','publicIpMiddlewareProxy','userTeam'],
  'public-fqdn': ['formEtlExpertflowCom','publicIpMiddleware','pointsTo','usageUser','col5','mttHostDo'],
  'gatepass': ['gpId','particulars','serialNumber','quantity','issuedBy','recievedTo','timeOut','timeIn','remarks','charger'],
  'received-items': ['col1','col2','receivedFrom','particulars','quantity','receivedBy','receivedDate','remarks'],
  'ports-detail': ['srNo','deviceName','col3','switch1Cisco2960','switch2Cisco3750','col6','srNo2','deviceName2','col9','switch1Cisco2960_2','switch2Cisco3750_2'],
  'free-vms': ['vmName','serverIp','ram','vmIp','domainName','fqdn','deletedOn','department'],
  'sheet38': ['hostName','ipAddress','customer','backupTypoe','backupPolicy','backupStore','itPolicy','responsiblePerson'],
};

async function main() {
  // Clear existing data first
  for (const table of Object.values(tableMap)) {
    try {
      await pool.query('DELETE FROM "' + table + '"');
      console.log('Cleared ' + table);
    } catch (e) {
      console.error('Error clearing ' + table + ':', e.message);
    }
  }

  for (const [key, info] of Object.entries(seedData)) {
    const table = tableMap[key];
    const fields = fieldMap[key];
    if (!table || !fields) continue;

    console.log('Seeding ' + key + ' (' + info.rows.length + ' rows)');

    const now = new Date().toISOString();
    for (const row of info.rows) {
      const record = { id: randomUUID(), createdAt: now, updatedAt: now };
      fields.forEach((f, i) => {
        record[f] = row[i] || '';
      });
      const allFields = ['id', 'createdAt', 'updatedAt', ...fields];
      const cols = allFields.map(f => '"' + f + '"').join(',');
      const vals = allFields.map((_, i) => '$' + (i+1)).join(',');
      const query = 'INSERT INTO "' + table + '" (' + cols + ') VALUES (' + vals + ')';
      try {
        await pool.query(query, allFields.map(f => record[f]));
      } catch (e) {
        console.error('Error inserting into ' + table + ':', e.message);
      }
    }
  }
  await pool.end();
  console.log('Done seeding');
}

main().catch(e => { console.error(e); process.exit(1); });
