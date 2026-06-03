// This file is used by Prisma 7 CLI in both development and production.
const { defineConfig } = require("prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://itam:itam_dev@localhost:5432/itam?schema=public",
  },
});
