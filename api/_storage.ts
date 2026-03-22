/**
 * Shared in-memory storage for Vercel serverless functions.
 *
 * NOTE: Vercel functions are stateless — each invocation may get a fresh
 * process.  This MemStorage implementation mirrors the original server/storage.ts
 * so existing behaviour is unchanged.  When you're ready for persistence,
 * swap this for Neon/Drizzle (the schema already exists in shared/schema.ts).
 */

import { randomUUID } from "crypto";

export interface Calculation {
  id: string;
  userId: string | null;
  propertyAddress: string;
  salePrice: number;
  propertyTax: number;
  closingDate: string;
  grtRate: number;
  listingCommission: number;
  buyerCommission: number;
  mortgageBalance: number;
  closingCosts: Record<string, number>;
  calculationResults: Record<string, any>;
  createdAt: Date;
}

const calculations = new Map<string, Calculation>();

export function saveCalculation(input: Omit<Calculation, "id" | "createdAt">): Calculation {
  const id = randomUUID();
  const calc: Calculation = { ...input, id, createdAt: new Date() };
  calculations.set(id, calc);
  return calc;
}

export function getCalculation(id: string): Calculation | undefined {
  return calculations.get(id);
}

export function getUserCalculations(userId?: string): Calculation[] {
  if (!userId) {
    return Array.from(calculations.values()).slice(-10);
  }
  return Array.from(calculations.values())
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
