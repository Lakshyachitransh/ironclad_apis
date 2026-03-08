import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.production.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
});
