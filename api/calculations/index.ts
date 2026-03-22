import type { VercelRequest, VercelResponse } from "@vercel/node";
import { saveCalculation, getUserCalculations } from "../_storage.js";
import { validateCalculationInput } from "../_validation.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    return handlePost(req, res);
  }
  if (req.method === "GET") {
    return handleGet(req, res);
  }
  return res.status(405).json({ success: false, error: "Method not allowed" });
}

function handlePost(req: VercelRequest, res: VercelResponse) {
  try {
    const validated = validateCalculationInput(req.body);
    const calculation = saveCalculation({
      ...validated,
      calculationResults: req.body.calculationResults || {},
      userId: req.body.userId || null,
    });
    return res.json({ success: true, id: calculation.id });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: error.message || "Invalid calculation data",
    });
  }
}

function handleGet(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = req.query.userId as string | undefined;
    const calculations = getUserCalculations(userId);
    return res.json({ success: true, calculations });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve calculations",
    });
  }
}
