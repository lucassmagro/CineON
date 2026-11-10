import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// um único client (e pool de conexões) pra aplicação toda; só os repositories usam
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.DB_POOL_MAX ?? 10),
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS ?? 5_000),
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? 300_000),
});

export const prisma = new PrismaClient({ adapter });
