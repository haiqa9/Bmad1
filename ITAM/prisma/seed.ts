import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL || "postgresql://itam:itam_dev@localhost:5432/itam?schema=public";
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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

  console.log("Seeded 4 sample users:");
  users.forEach((u) => console.log(`  - ${u.email} (${u.role})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
