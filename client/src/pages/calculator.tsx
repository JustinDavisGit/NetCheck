import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calculator as CalculatorIcon, DollarSign, Home, Wallet, Briefcase, Gift } from "lucide-react";
import { motion } from "framer-motion";

export default function Calculator() {
  const [salePrice, setSalePrice] = useState<string>("");
  const [mortgageBalance, setMortgageBalance] = useState<string>("");
  const [sellerConcession, setSellerConcession] = useState<string>("");
  const [brokerCompensation, setBrokerCompensation] = useState<number>(6);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCurrencyInput = (value: string, setter: (val: string) => void) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  const formatInputDisplay = (value: string) => {
    if (!value) return '';
    const num = parseInt(value, 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US');
  };

  const results = useMemo(() => {
    const price = parseFloat(salePrice) || 0;
    const mortgage = parseFloat(mortgageBalance) || 0;
    const concession = parseFloat(sellerConcession) || 0;

    if (price === 0) return null;

    const commissionAmount = price * (brokerCompensation / 100);
    const grossEquity = price - mortgage;
    const netProceeds = grossEquity - commissionAmount - concession;
    const netPercentage = price > 0 ? (netProceeds / price) * 100 : 0;

    return {
      grossEquity,
      commissionAmount,
      concession,
      netProceeds,
      netPercentage,
    };
  }, [salePrice, mortgageBalance, sellerConcession, brokerCompensation]);

  const sliderPercentage = ((brokerCompensation - 1) / 9) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CalculatorIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Net-Out Calculator</h1>
          <p className="text-slate-500 mt-1">Calculate your estimated proceeds</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="salePrice" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Home className="w-4 h-4 text-slate-400" />
                Projected Sale Price
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="salePrice"
                  type="text"
                  placeholder="0"
                  value={formatInputDisplay(salePrice)}
                  onChange={(e) => handleCurrencyInput(e.target.value, setSalePrice)}
                  className="pl-8 text-lg h-12 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgageBalance" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                Mortgage Balance
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="mortgageBalance"
                  type="text"
                  placeholder="0"
                  value={formatInputDisplay(mortgageBalance)}
                  onChange={(e) => handleCurrencyInput(e.target.value, setMortgageBalance)}
                  className="pl-8 text-lg h-12 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerConcession" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Gift className="w-4 h-4 text-slate-400" />
                Seller Concession / Credit to Buyer
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="sellerConcession"
                  type="text"
                  placeholder="0"
                  value={formatInputDisplay(sellerConcession)}
                  onChange={(e) => handleCurrencyInput(e.target.value, setSellerConcession)}
                  className="pl-8 text-lg h-12 font-medium"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Broker Compensation
                </Label>
                <span className="text-lg font-semibold text-green-600">{brokerCompensation.toFixed(1)}%</span>
              </div>
              
              <div className="relative pt-2">
                <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-150"
                    style={{ width: `${sliderPercentage}%` }}
                  />
                </div>
                
                <div 
                  className="absolute top-0 -translate-x-1/2 transition-all duration-150"
                  style={{ left: `${sliderPercentage}%` }}
                >
                  <div className="w-8 h-8 bg-white border-2 border-green-500 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                    <Briefcase className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={brokerCompensation}
                  onChange={(e) => setBrokerCompensation(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-8 opacity-0 cursor-grab active:cursor-grabbing"
                  style={{ top: '-2px' }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-slate-400">
                <span>1%</span>
                <span>10%</span>
              </div>

              <div className="text-center pt-2">
                <span className="text-xl font-semibold text-slate-700">
                  {formatCurrency((parseFloat(salePrice) || 0) * (brokerCompensation / 100))}
                </span>
              </div>
            </div>

            {results && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="pt-4 border-t border-slate-100"
              >
                <div className="text-center">
                  <p className="text-sm text-slate-500 mb-1">Estimated Net Proceeds</p>
                  <p className={`text-3xl font-bold ${results.netProceeds >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(results.netProceeds)}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {results.netPercentage.toFixed(1)}% of sale price
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          For New Mexico real estate professionals
        </p>
      </motion.div>
    </div>
  );
}
