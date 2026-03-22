/**
 * Lightweight validation that mirrors shared/schema.ts calculationInputSchema
 * without pulling in drizzle-orm (which needs pg at import time).
 */

export interface CalculationInput {
  propertyAddress: string;
  salePrice: number;
  propertyTax: number;
  closingDate: string;
  grtRate: number;
  listingCommission: number;
  buyerCommission: number;
  mortgageBalance: number;
  closingCosts: {
    escrowFee: number;
    titlePolicy: number;
    titleBinder: number;
    waterBill: number;
    survey: number;
    hoaFees: number;
    repairs: number;
    otherExpenses: number;
  };
}

export function validateCalculationInput(body: any): CalculationInput {
  const errors: string[] = [];

  if (!body.propertyAddress || typeof body.propertyAddress !== "string" || body.propertyAddress.length < 1) {
    errors.push("Property address is required");
  }
  if (typeof body.salePrice !== "number" || body.salePrice < 1000) {
    errors.push("Sale price must be at least $1,000");
  }
  if (typeof body.propertyTax !== "number" || body.propertyTax < 0) {
    errors.push("Property tax cannot be negative");
  }
  if (typeof body.closingDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.closingDate)) {
    errors.push("Invalid date format");
  }
  if (typeof body.grtRate !== "number" || body.grtRate < 5 || body.grtRate > 10) {
    errors.push("GRT rate must be between 5% and 10%");
  }
  if (typeof body.listingCommission !== "number" || body.listingCommission < 0 || body.listingCommission > 10) {
    errors.push("Listing commission must be between 0% and 10%");
  }
  if (typeof body.buyerCommission !== "number" || body.buyerCommission < 0 || body.buyerCommission > 10) {
    errors.push("Buyer commission must be between 0% and 10%");
  }
  if (typeof body.mortgageBalance !== "number" || body.mortgageBalance < 0) {
    errors.push("Mortgage balance cannot be negative");
  }

  const cc = body.closingCosts;
  if (!cc || typeof cc !== "object") {
    errors.push("Closing costs object is required");
  } else {
    for (const key of ["escrowFee", "titlePolicy", "titleBinder", "waterBill", "survey", "hoaFees", "repairs", "otherExpenses"]) {
      if (typeof cc[key] !== "number" || cc[key] < 0) {
        errors.push(`closingCosts.${key} must be a non-negative number`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }

  return body as CalculationInput;
}
