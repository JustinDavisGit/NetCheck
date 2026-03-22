import type { VercelRequest, VercelResponse } from "@vercel/node";

const grtRates: Record<string, number> = {
  albuquerque: 7.8125,
  "santa fe": 8.4375,
  hobbs: 6.8125,
  "las cruces": 7.5625,
  roswell: 7.3125,
  farmington: 7.1875,
  clovis: 6.9375,
  alamogordo: 6.8125,
  carlsbad: 7.0625,
  gallup: 7.4375,
  default: 5.375,
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const { address, city } = req.query;
  let rate = grtRates.default;

  if (city) {
    const cityKey = city.toString().toLowerCase().replace(/\s+/g, " ");
    rate = grtRates[cityKey] || grtRates.default;
  } else if (address) {
    const addressLower = address.toString().toLowerCase();
    for (const [cityName, cityRate] of Object.entries(grtRates)) {
      if (cityName !== "default" && addressLower.includes(cityName)) {
        rate = cityRate;
        break;
      }
    }
  }

  return res.json({
    success: true,
    grtRate: rate,
    locationCode: `NM-${rate.toString().replace(".", "")}`,
    description: `New Mexico GRT rate: ${rate}%`,
  });
}
