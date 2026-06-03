const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('/app/laptop_data.json', 'utf-8'));

  console.log(`Deleting existing laptop records...`);
  const deleted = await prisma.laptopRecord.deleteMany({});
  console.log(`Deleted ${deleted.count} records`);

  console.log(`Inserting ${data.length} new records...`);
  let count = 0;
  for (const row of data) {
    await prisma.laptopRecord.create({ data: row });
    count++;
    if (count % 10 === 0) {
      console.log(`  ...${count} done`);
    }
  }

  console.log(`Done! Inserted ${count} records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
