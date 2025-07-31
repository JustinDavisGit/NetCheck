import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { calculationInputSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
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
