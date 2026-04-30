import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");

const initialDb = {
  users: [],
  profiles: [],
  incomes: [],
  budgetPlans: [],
  categories: [],
  transactions: [],
  habits: [],
  recommendations: [],
  metalSnapshots: [],
};

async function ensureDb() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dbPath, "utf8");
  } catch {
    await writeFile(dbPath, JSON.stringify(initialDb, null, 2));
  }
}

export async function readDb() {
  await ensureDb();
  const content = await readFile(dbPath, "utf8");
  return { ...initialDb, ...JSON.parse(content) };
}

export async function writeDb(db) {
  await ensureDb();
  await writeFile(dbPath, JSON.stringify(db, null, 2));
}

export async function updateDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

export function nowIso() {
  return new Date().toISOString();
}

export function id(prefix) {
  return `${prefix}_${randomUUID()}`;
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    onboardingComplete: user.onboardingComplete,
    createdAt: user.createdAt,
  };
}
