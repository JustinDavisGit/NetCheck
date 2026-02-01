import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calculator as CalculatorIcon, DollarSign, Home, Wallet, Briefcase, Gift, Calendar, Receipt, Scale, Building2, PartyPopper } from "lucide-react";
import { motion } from "framer-motion";

export default function Calculator() {
  const [salePrice, setSalePrice] = useState<string>("");
  const [mortgageBalance, setMortgageBalance] = useState<string>("");
  const [sellerConcession, setSellerConcession] = useState<string>("");
  const [brokerCompensation, setBrokerCompensation] = useState<number>(6);
  const [closingDate, setClosingDate] = useState<string>("");
  const [annualPropertyTax, setAnnualPropertyTax] = useState<string>("");
  const [titleEscrowFees, setTitleEscrowFees] = useState<number>(1);
  const [hasHoa, setHasHoa] = useState<boolean | null>(null);
  const [hoaTransferFees, setHoaTransferFees] = useState<number>(500);

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

  const calculateTaxProration = useMemo(() => {
    if (!closingDate || !annualPropertyTax) return { proration: 0, daysOwned: 0, isDebit: true };
    
    const taxAmount = parseFloat(annualPropertyTax) || 0;
    const closing = new Date(closingDate);
    const yearStart = new Date(closing.getFullYear(), 0, 1);
    const yearEnd = new Date(closing.getFullYear(), 11, 31);
    
    const totalDaysInYear = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysOwned = Math.ceil((closing.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const proration = (taxAmount / totalDaysInYear) * daysOwned;
    
    return { proration, daysOwned, totalDaysInYear, isDebit: true };
  }, [closingDate, annualPropertyTax]);

  const results = useMemo(() => {
    const price = parseFloat(salePrice) || 0;
    const mortgage = parseFloat(mortgageBalance) || 0;
    const concession = parseFloat(sellerConcession) || 0;
    const taxProration = calculateTaxProration.proration;
    const titleFees = price * (titleEscrowFees / 100);
    const hoaFees = hasHoa ? hoaTransferFees : 0;

    if (price === 0) return null;

    const commissionAmount = price * (brokerCompensation / 100);
    const grossEquity = price - mortgage;
    const netProceeds = grossEquity - commissionAmount - concession - taxProration - titleFees - hoaFees;
    const netPercentage = price > 0 ? (netProceeds / price) * 100 : 0;

    return {
      grossEquity,
      commissionAmount,
      concession,
      taxProration,
      titleFees,
      hoaFees,
      netProceeds,
      netPercentage,
    };
  }, [salePrice, mortgageBalance, sellerConcession, brokerCompensation, titleEscrowFees, hasHoa, hoaTransferFees, calculateTaxProration]);

  const sliderPercentage = ((brokerCompensation - 1) / 9) * 100;
  const titleSliderPercentage = ((titleEscrowFees - 0.5) / 1.5) * 100;
  const hoaSliderPercentage = ((hoaTransferFees - 250) / 750) * 100;

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

            <div className="space-y-2">
              <Label htmlFor="closingDate" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                Estimated Closing Date
              </Label>
              <Input
                id="closingDate"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="text-lg h-12 font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualPropertyTax" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-slate-400" />
                Annual Property Taxes
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="annualPropertyTax"
                  type="text"
                  placeholder="0"
                  value={formatInputDisplay(annualPropertyTax)}
                  onChange={(e) => handleCurrencyInput(e.target.value, setAnnualPropertyTax)}
                  className="pl-8 text-lg h-12 font-medium"
                />
              </div>
              <p className="text-xs text-slate-400">Paid in arrears - seller owes from Jan 1 to closing</p>
              
              {calculateTaxProration.proration > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-800">
                      Tax Proration ({calculateTaxProration.daysOwned} days)
                    </span>
                    <span className="text-sm font-semibold text-amber-700">
                      -{formatCurrency(calculateTaxProration.proration)}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">Debit to seller at closing</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-400" />
                  Title / Escrow / Attorney Fees
                </Label>
                <span className="text-lg font-semibold text-blue-600">{titleEscrowFees.toFixed(1)}%</span>
              </div>
              
              <div className="relative pt-2">
                <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-150"
                    style={{ width: `${titleSliderPercentage}%` }}
                  />
                </div>
                
                <div 
                  className="absolute top-0 -translate-x-1/2 transition-all duration-150"
                  style={{ left: `${titleSliderPercentage}%` }}
                >
                  <div className="w-8 h-8 bg-white border-2 border-blue-500 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                    <Scale className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={titleEscrowFees}
                  onChange={(e) => setTitleEscrowFees(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-8 opacity-0 cursor-grab active:cursor-grabbing"
                  style={{ top: '-2px' }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-slate-400">
                <span>0.5%</span>
                <span>2%</span>
              </div>

              <div className="text-center pt-2">
                <span className="text-xl font-semibold text-slate-700">
                  {formatCurrency((parseFloat(salePrice) || 0) * (titleEscrowFees / 100))}
                </span>
              </div>

              <p className="text-xs text-slate-400 text-center">
                Whether a state uses attorneys or escrow officers, non-commission closing costs usually fall around 1% of the sale price, give or take.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  HOA?
                </Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setHasHoa(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      hasHoa === true
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasHoa(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      hasHoa === false
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {hasHoa === true && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-700">
                      HOA Transfer Fees
                    </Label>
                    <span className="text-lg font-semibold text-purple-600">{formatCurrency(hoaTransferFees)}</span>
                  </div>
                  
                  <div className="relative pt-2">
                    <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-150"
                        style={{ width: `${hoaSliderPercentage}%` }}
                      />
                    </div>
                    
                    <div 
                      className="absolute top-0 -translate-x-1/2 transition-all duration-150"
                      style={{ left: `${hoaSliderPercentage}%` }}
                    >
                      <div className="w-8 h-8 bg-white border-2 border-purple-500 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                        <Building2 className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    
                    <input
                      type="range"
                      min="250"
                      max="1000"
                      step="25"
                      value={hoaTransferFees}
                      onChange={(e) => setHoaTransferFees(parseFloat(e.target.value))}
                      className="absolute inset-0 w-full h-8 opacity-0 cursor-grab active:cursor-grabbing"
                      style={{ top: '-2px' }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>$250</span>
                    <span>$1,000</span>
                  </div>
                </motion.div>
              )}

              {hasHoa === false && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"
                >
                  <PartyPopper className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">You lucky goose!</p>
                  <p className="text-green-600 text-sm">No HOA fees to worry about</p>
                </motion.div>
              )}
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
