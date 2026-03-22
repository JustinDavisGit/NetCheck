import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getCalculation } from "../_storage.js";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const calculation = getCalculation(id as string);

    if (!calculation) {
      return res.status(404).json({
        success: false,
        error: "Calculation not found",
      });
    }

    return res.json({ success: true, calculation });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve calculation",
    });
  }
}
