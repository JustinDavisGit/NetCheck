import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const calculations = pgTable("calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  propertyAddress: text("property_address").notNull(),
  salePrice: real("sale_price").notNull(),
  propertyTax: real("property_tax").notNull(),
  closingDate: text("closing_date").notNull(),
  grtRate: real("grt_rate").notNull(),
  listingCommission: real("listing_commission").notNull(),
  buyerCommission: real("buyer_commission").notNull(),
  mortgageBalance: real("mortgage_balance").notNull(),
  closingCosts: json("closing_costs").notNull(),
  calculationResults: json("calculation_results").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCalculationSchema = createInsertSchema(calculations).omit({
  id: true,
  createdAt: true,
});

export const calculationInputSchema = z.object({
  propertyAddress: z.string().min(1, "Property address is required"),
  salePrice: z.number().min(1000, "Sale price must be at least $1,000"),
  propertyTax: z.number().min(0, "Property tax cannot be negative"),
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  grtRate: z.number().min(5).max(10, "GRT rate must be between 5% and 10%"),
  listingCommission: z.number().min(0).max(10, "Commission must be between 0% and 10%"),
  buyerCommission: z.number().min(0).max(10, "Commission must be between 0% and 10%"),
  mortgageBalance: z.number().min(0, "Mortgage balance cannot be negative"),
  closingCosts: z.object({
    escrowFee: z.number().min(0),
    titlePolicy: z.number().min(0),
    titleBinder: z.number().min(0),
    waterBill: z.number().min(0),
    survey: z.number().min(0),
    hoaFees: z.number().min(0),
    repairs: z.number().min(0),
    otherExpenses: z.number().min(0),
  }),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCalculation = z.infer<typeof insertCalculationSchema>;
export type Calculation = typeof calculations.$inferSelect;
export type CalculationInput = z.infer<typeof calculationInputSchema>;
