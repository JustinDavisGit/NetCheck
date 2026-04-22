import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculationInputSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Email report capture + delivery
  app.post("/api/email-report", async (req, res) => {
    try {
      const { email, shareUrl, summary } = req.body ?? {};

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ success: false, error: "Valid email is required" });
      }

      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.RESEND_FROM_EMAIL || "NetCheck <hello@getnetcheck.com>";

      if (!apiKey) {
        return res.status(500).json({ success: false, error: "Email provider not configured" });
      }

      const safeNet = typeof summary?.netProceeds === "number"
        ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(summary.netProceeds))
        : null;

      const html = `
        <div style="font-family: Inter, Arial, sans-serif; background:#f8fafc; padding:32px; color:#0f172a;">
          <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:20px; overflow:hidden;">
            <div style="padding:24px 24px 12px; background:linear-gradient(135deg,#ecfdf5 0%,#f8fafc 100%); border-bottom:1px solid #e2e8f0;">
              <div style="display:inline-block; background:#34d399; color:white; padding:10px 16px; border-radius:16px; font-size:24px; font-weight:800;">Net<span style="font-weight:300;">Check</span></div>
              <h1 style="margin:20px 0 8px; font-size:28px; line-height:1.1;">Your NetCheck report</h1>
              <p style="margin:0; color:#475569; font-size:16px;">Here’s the scenario you wanted to keep handy.</p>
            </div>
            <div style="padding:24px;">
              ${safeNet ? `<div style="padding:16px; border-radius:16px; background:#f8fafc; border:1px solid #e2e8f0; margin-bottom:20px;"><div style="font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#64748b; margin-bottom:6px;">Estimated ${summary?.netProceeds >= 0 ? "net proceeds" : "bring to closing"}</div><div style="font-size:32px; font-weight:800; color:${summary?.netProceeds >= 0 ? "#10b981" : "#ef4444"};">${safeNet}</div></div>` : ""}
              <p style="margin:0 0 18px; color:#334155; line-height:1.6;">Open your scenario below to review the numbers, make edits, or share it with someone you trust.</p>
              <a href="${shareUrl}" style="display:inline-block; background:#34d399; color:white; text-decoration:none; padding:14px 18px; border-radius:14px; font-weight:700;">Open my NetCheck scenario</a>
              <p style="margin:18px 0 0; font-size:12px; color:#94a3b8; line-height:1.5;">NetCheck provides estimates only — not legal, tax, or financial advice. Actual results may vary.</p>
            </div>
          </div>
        </div>`;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Your NetCheck report",
          html,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(502).json({ success: false, error: text || "Failed to send email" });
      }

      const data = await response.json();
      return res.json({ success: true, id: data.id });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message || "Failed to send email" });
    }
  });

  // Save calculation
  app.post("/api/calculations", async (req, res) => {
    try {
      const validatedInput = calculationInputSchema.parse(req.body);
      
      const calculation = await storage.saveCalculation({
        ...validatedInput,
        calculationResults: req.body.calculationResults || {},
        userId: req.body.userId || null,
      });

      res.json({ success: true, id: calculation.id });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        error: error.message || "Invalid calculation data" 
      });
    }
  });

  // Get calculation by ID
  app.get("/api/calculations/:id", async (req, res) => {
    try {
      const calculation = await storage.getCalculation(req.params.id);
      
      if (!calculation) {
        return res.status(404).json({ 
          success: false, 
          error: "Calculation not found" 
        });
      }

      res.json({ success: true, calculation });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: "Failed to retrieve calculation" 
      });
    }
  });

  // Get user calculations
  app.get("/api/calculations", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const calculations = await storage.getUserCalculations(userId);
      
      res.json({ success: true, calculations });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: "Failed to retrieve calculations" 
      });
    }
  });

  // Get GRT rates by address/location
  app.get("/api/grt-rates", async (req, res) => {
    const { address, city } = req.query;
    
    // Mock GRT rate lookup based on address/city
    // In production, this would integrate with NM Tax API or geocoding service
    const grtRates: Record<string, number> = {
      'albuquerque': 7.8125,
      'santa fe': 8.4375,
      'hobbs': 6.8125,
      'las cruces': 7.5625,
      'roswell': 7.3125,
      'farmington': 7.1875,
      'clovis': 6.9375,
      'alamogordo': 6.8125,
      'carlsbad': 7.0625,
      'gallup': 7.4375,
      'default': 5.375, // Rural/unincorporated areas
    };

    let rate = grtRates.default;
    
    if (city) {
      const cityKey = city.toString().toLowerCase().replace(/\s+/g, '');
      rate = grtRates[cityKey] || grtRates.default;
    } else if (address) {
      const addressLower = address.toString().toLowerCase();
      for (const [cityName, cityRate] of Object.entries(grtRates)) {
        if (cityName !== 'default' && addressLower.includes(cityName)) {
          rate = cityRate;
          break;
        }
      }
    }

    res.json({ 
      success: true, 
      grtRate: rate,
      locationCode: `NM-${rate.toString().replace('.', '')}`,
      description: `New Mexico GRT rate: ${rate}%`
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
