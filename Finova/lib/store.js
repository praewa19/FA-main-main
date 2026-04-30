import { randomUUID } from "node:crypto";

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
