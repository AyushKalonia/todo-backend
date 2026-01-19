import Fastify from "fastify";
import jwt from "@fastify/jwt";
import cors from "@fastify/cors";
import "dotenv/config";

import authenticate from "./plugins/authenticate.js";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

export const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET || "_SUPER_SECRET_JWT_KEY_",
});

await app.register(authenticate);

app.get("/health", async () => {
  return { status: "ok" };
});

// Graceful shutdown
app.addHook('onClose', async (instance) => {
  await prisma.$disconnect();
});