import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const connectionString = process.env.DATABASE_URL || "postgresql://itam:itam_dev@localhost:5432/itam?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const seedDataPath = path.join(__dirname, "seed-data.json");
const seedData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const password = await bcrypt.hash("password123", 10);

  const users = [
    {
      email: "employee@expertflow.com",
      name: "Alice Employee",
      role: "EMPLOYEE" as const,
      department: "Engineering",
      password,
    },
    {
      email: "depthead@expertflow.com",
      name: "Bob Dept Head",
      role: "DEPT_HEAD" as const,
      department: "Engineering",
      password,
    },
    {
      email: "itops@expertflow.com",
      name: "Charlie IT Ops",
      role: "IT_OPS" as const,
      department: "IT",
      password,
    },
    {
      email: "assetmgr@expertflow.com",
      name: "Dana Asset Manager",
      role: "IT_ASSET_MANAGER" as const,
      department: "IT",
      password,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }
  console.log("Seeded 4 sample users");

  // Seed Excel sheets
  const sheetMappings: Record<string, { model: any; fieldMap: string[] }> = {
    "laptop-record": {
      model: prisma.laptopRecord,
      fieldMap: ["sr", "employeeName", "department", "status", "date", "serialNumber", "laptop", "model", "cpu", "ram", "hdd", "lcd", "keyboard", "mouse", "laptopBag", "headPhones", "mousepad", "comment"],
    },
    "servers-devices": {
      model: prisma.serverDevice,
      fieldMap: ["model", "serialNumber", "cpus", "processor", "ram", "storage", "ip", "osVersion", "status", "noOfExistingVms", "iloIps"],
    },
    "iloidrac": {
      model: prisma.iloIdrac,
      fieldMap: ["servers", "ip", "iloIdracIp", "switchPort", "comments"],
    },
    "cloud-vm-list": {
      model: prisma.cloudVm,
      fieldMap: ["no", "cloudVmUsageDescription", "ipAddress", "ownerUserTeam", "fqdn", "cloud", "specifications", "userDepartment", "sslStatus", "sslExpiry"],
    },
    "lab-vm-list": {
      model: prisma.labVm,
      fieldMap: ["sr", "department", "vmName", "hostServer", "memorySize", "ipAddress", "dnsName", "sslStatus", "sslExpiry", "publicIpMiddlewareProxy", "userTeam"],
    },
    "public-fqdn": {
      model: prisma.publicFqdn,
      fieldMap: ["formEtlExpertflowCom", "publicIpMiddleware", "pointsTo", "usageUser", "mttHostDo"],
    },
    "gatepass": {
      model: prisma.gatePass,
      fieldMap: ["gpId", "particulars", "serialNumber", "quantity", "issuedBy", "recievedTo", "timeOut", "timeIn", "remarks", "charger"],
    },
    "received-items": {
      model: prisma.receivedItem,
      fieldMap: ["col1", "col2", "receivedFrom", "particulars", "quantity", "receivedBy", "receivedDate", "remarks"],
    },
    "ports-detail": {
      model: prisma.portDetail,
      fieldMap: ["srNo", "deviceName", "col3", "switch1Cisco2960", "switch2Cisco3750", "col6", "srNo2", "deviceName2", "col9", "switch1Cisco2960_2", "switch2Cisco3750_2"],
    },
    "free-vms": {
      model: prisma.freeVm,
      fieldMap: ["vmName", "serverIp", "ram", "vmIp", "domainName", "fqdn", "deletedOn", "department"],
    },
    "sheet38": {
      model: prisma.sheet38,
      fieldMap: ["hostName", "ipAddress", "customer", "backupTypoe", "backupPolicy", "backupStore", "itPolicy", "responsiblePerson"],
    },
  };

  for (const [key, sheetData] of Object.entries(seedData)) {
    const mapping = sheetMappings[key];
    if (!mapping) {
      console.warn(`No mapping for sheet: ${key}`);
      continue;
    }

    // Clear existing data
    await (mapping.model as any).deleteMany({});

    const rows = (sheetData as any).rows as string[][];
    const fieldMap = mapping.fieldMap;

    const records = rows.map((row) => {
      const record: Record<string, any> = {};
      fieldMap.forEach((field, idx) => {
        record[field] = row[idx] || "";
      });
      return record;
    });

    const chunks = chunkArray(records, 500);
    for (const chunk of chunks) {
      await (mapping.model as any).createMany({ data: chunk });
    }

    console.log(`Seeded ${rows.length} rows into ${key}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
