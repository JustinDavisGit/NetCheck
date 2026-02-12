import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Home, FileText, Share2, Check, Loader2, Pencil, Handshake, Info, Wrench, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";

function getEstimatedTitleEscrowFee(salePrice: number): number {
  let rate: number;
  if (salePrice < 150000) rate = 0.0130;
  else if (salePrice < 250000) rate = 0.0105;
  else if (salePrice < 350000) rate = 0.00925;
  else if (salePrice < 500000) rate = 0.0080;
  else if (salePrice < 650000) rate = 0.00725;
  else if (salePrice < 900000) rate = 0.00675;
  else if (salePrice < 1200000) rate = 0.00575;
  else rate = 0.0045;
  return Math.round((salePrice * rate) / 5) * 5;
}

export default function Calculator() {
  const [salePrice, setSalePrice] = useState<string>("");
  const [mortgageBalance, setMortgageBalance] = useState<string>("");
  const [brokerCompensation, setBrokerCompensation] = useState<number>(6);
  const [brokerInput, setBrokerInput] = useState<string>("6.0");
  const [grtRate, setGrtRate] = useState<number>(7.625);
  const [grtInput, setGrtInput] = useState<string>("7.6250");
  const [hasAdditionalLiens, setHasAdditionalLiens] = useState(false);
  const [secondMortgage, setSecondMortgage] = useState<string>("");
  const [heloc, setHeloc] = useState<string>("");
  const [solarLoan, setSolarLoan] = useState<string>("");
  const [annualPropertyTax, setAnnualPropertyTax] = useState<string>("");
  const [closingMonth, setClosingMonth] = useState<number>(new Date().getMonth() + 1);
  const [hasHoa, setHasHoa] = useState(false);
  const [hoaFee, setHoaFee] = useState<string>("350");
  const [sellerConcessions, setSellerConcessions] = useState<string>("");
  const [repairCosts, setRepairCosts] = useState<string>("");
  const [customFields, setCustomFields] = useState<{ name: string; amount: string }[]>([]);
  const [surveyFee, setSurveyFee] = useState<string>("275");
  const [copied, setCopied] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcPhase, setCalcPhase] = useState<'idle' | 'calculating' | 'applying' | 'done'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);
  const calcTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const { toast } = useToast();

  // Load state from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sp = params.get('sp');
    const mb = params.get('mb');
    const bc = params.get('bc');
    if (sp) {
      const cleaned = sp.replace(/[^0-9]/g, '');
      if (cleaned) setSalePrice(cleaned);
    }
    if (mb) {
      const cleaned = mb.replace(/[^0-9]/g, '');
      if (cleaned) setMortgageBalance(cleaned);
    }
    if (bc) {
      const parsed = parseFloat(bc);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
        setBrokerCompensation(parsed);
        setBrokerInput(parsed.toFixed(1));
      }
    }
    const grt = params.get('grt');
    if (grt) {
      const parsed = parseFloat(grt);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 15) {
        setGrtRate(parsed);
        setGrtInput(parsed.toFixed(4));
      }
    }
  }, []);

  const generateShareUrl = () => {
    const params = new URLSearchParams();
    if (salePrice) params.set('sp', salePrice);
    if (mortgageBalance) params.set('mb', mortgageBalance);
    if (brokerCompensation !== 6) params.set('bc', brokerCompensation.toString());
    if (grtRate !== 7.625) params.set('grt', grtRate.toString());
    
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?${params.toString()}`;
  };

  const handleShare = async () => {
    const shareUrl = generateShareUrl();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Net-Out Calculator Estimate',
          text: 'Check out this estimated net proceeds calculation',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error - fall back to copy
        await copyToClipboard(shareUrl);
      }
    } else {
      await copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link so others can view and adjust the estimate.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Couldn't copy link",
        description: "Please copy the URL from your browser's address bar.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    if (!isFinite(value) || isNaN(value)) value = 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleCurrencyInput = (value: string, setter: (val: string) => void) => {
    const raw = value.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
    const intPart = sanitized.split('.')[0];
    const decPart = sanitized.includes('.') ? '.' + sanitized.split('.')[1] : '';
    const formattedInt = intPart ? parseInt(intPart, 10).toLocaleString('en-US') : '';
    setter(formattedInt + decPart);
    if (validationError) setValidationError(null);
  };

  const formatCurrencyOnBlur = (value: string, setter: (val: string) => void) => {
    const parsed = parseFloat(value.replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      setter(parsed.toLocaleString('en-US', { minimumFractionDigits: parsed % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 }));
    } else {
      setter('');
    }
  };

  const parseCurrency = (value: string) => parseFloat(value.replace(/,/g, '')) || 0;

  const results = useMemo(() => {
    const price = parseCurrency(salePrice);
    const mortgage = parseCurrency(mortgageBalance);
    const secondMtg = hasAdditionalLiens ? parseCurrency(secondMortgage) : 0;
    const helocAmt = hasAdditionalLiens ? parseCurrency(heloc) : 0;
    const solarAmt = hasAdditionalLiens ? parseCurrency(solarLoan) : 0;
    const totalLiens = mortgage + secondMtg + helocAmt + solarAmt;

    if (price === 0) return null;

    const commissionAmount = price * (brokerCompensation / 100);
    const grtAmount = commissionAmount * (grtRate / 100);
    const titleEscrowAmount = getEstimatedTitleEscrowFee(price);
    const annualTax = parseCurrency(annualPropertyTax);
    const taxProration = annualTax > 0 ? (closingMonth / 12) * annualTax : 0;
    const hoaAmount = hasHoa ? parseCurrency(hoaFee) : 0;
    const surveyAmount = parseCurrency(surveyFee);
    const concessionsAmt = parseCurrency(sellerConcessions);
    const repairAmt = parseCurrency(repairCosts);
    const customFieldsTotal = customFields.reduce((sum, f) => sum + parseCurrency(f.amount), 0);
    const totalDeductions = commissionAmount + grtAmount + titleEscrowAmount + taxProration + hoaAmount + surveyAmount + concessionsAmt + repairAmt + customFieldsTotal;
    const netProceeds = price - totalLiens - totalDeductions;

    return {
      price,
      mortgage,
      commissionAmount,
      grtAmount,
      titleEscrowAmount,
      taxProration,
      hoaAmount,
      surveyAmount,
      concessionsAmt,
      repairAmt,
      customFields: customFields.map(f => ({ name: f.name || 'Custom Fee', amount: parseCurrency(f.amount) })),
      customFieldsTotal,
      secondMtg,
      helocAmt,
      solarAmt,
      netProceeds,
    };
  }, [salePrice, mortgageBalance, brokerCompensation, grtRate, hasAdditionalLiens, secondMortgage, heloc, solarLoan, annualPropertyTax, closingMonth, hasHoa, hoaFee, surveyFee, sellerConcessions, repairCosts, customFields]);

  const handleRunNetCheck = () => {
    if (!results) {
      setValidationError("Enter a sale price to run your estimate.");
      return;
    }
    setValidationError(null);
    setShowResults(false);
    setIsCalculating(true);
    setCalcPhase('calculating');
    setDisplayedNet(0);

    calcTimeoutsRef.current.forEach(clearTimeout);
    calcTimeoutsRef.current = [];

    calcTimeoutsRef.current.push(setTimeout(() => {
      setCalcPhase('applying');
    }, 550));

    calcTimeoutsRef.current.push(setTimeout(() => {
      setCalcPhase('done');
      setShowResults(true);
      setIsCalculating(false);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 1200));
  };

  useEffect(() => {
    return () => {
      calcTimeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const salePriceRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const animateNumber = useCallback((target: number, duration: number = 800) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const start = performance.now();
    const startVal = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedNet(startVal + (target - startVal) * eased);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  }, []);

  const [displayedNet, setDisplayedNet] = useState(0);

  useEffect(() => {
    if (showResults && results) {
      animateNumber(results.netProceeds);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [showResults, results, animateNumber]);

  const handleBrokerInputChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setBrokerInput(sanitized);
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
      setBrokerCompensation(parsed);
    }
  };

  const handleBrokerBlur = () => {
    let parsed = parseFloat(brokerInput);
    if (isNaN(parsed)) parsed = 6;
    if (parsed < 0) parsed = 0;
    if (parsed > 10) parsed = 10;
    setBrokerCompensation(parsed);
    setBrokerInput(parsed.toFixed(1));
  };

  const handleGrtInputChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setGrtInput(sanitized);
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 15) {
      setGrtRate(parsed);
    }
  };

  const handleGrtBlur = () => {
    let parsed = parseFloat(grtInput);
    if (isNaN(parsed)) parsed = 7.625;
    if (parsed < 0) parsed = 0;
    if (parsed > 15) parsed = 15;
    setGrtRate(parsed);
    setGrtInput(parsed.toFixed(4));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-emerald-400 mb-4 shadow-lg">
            <span className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>
              Net<span className="font-light">Check</span>
            </span>
          </div>
          <p className="text-slate-500 mt-1">Estimate what you'll take home at closing.</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="salePrice" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-400" />
                Sale Price
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="salePrice"
                  ref={salePriceRef}
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={salePrice}
                  onChange={(e) => handleCurrencyInput(e.target.value, setSalePrice)}
                  onBlur={() => formatCurrencyOnBlur(salePrice, setSalePrice)}
                  className="pl-8 text-lg h-12 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgageBalance" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Mortgage Balance
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="mortgageBalance"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={mortgageBalance}
                  onChange={(e) => handleCurrencyInput(e.target.value, setMortgageBalance)}
                  onBlur={() => formatCurrencyOnBlur(mortgageBalance, setMortgageBalance)}
                  className="pl-8 text-lg h-12 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500">
                Any second mortgage, HELOC, or solar loan balance to be paid at closing?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHasAdditionalLiens(true)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${hasAdditionalLiens ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setHasAdditionalLiens(false)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${!hasAdditionalLiens ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                >
                  No
                </button>
              </div>

              <AnimatePresence>
                {hasAdditionalLiens && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-3 pt-1"
                  >
                    <div>
                      <Label htmlFor="secondMortgage" className="text-xs font-medium text-slate-500">Second Mortgage</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          id="secondMortgage"
                          type="text"
                          placeholder="0"
                          value={secondMortgage}
                          onChange={(e) => handleCurrencyInput(e.target.value, setSecondMortgage)}
                          onBlur={() => formatCurrencyOnBlur(secondMortgage, setSecondMortgage)}
                          className="pl-7 text-sm h-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="heloc" className="text-xs font-medium text-slate-500">HELOC</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          id="heloc"
                          type="text"
                          placeholder="0"
                          value={heloc}
                          onChange={(e) => handleCurrencyInput(e.target.value, setHeloc)}
                          onBlur={() => formatCurrencyOnBlur(heloc, setHeloc)}
                          className="pl-7 text-sm h-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="solarLoan" className="text-xs font-medium text-slate-500">Solar Loan Balance</Label>
                      <div className="relative mt-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          id="solarLoan"
                          type="text"
                          placeholder="0"
                          value={solarLoan}
                          onChange={(e) => handleCurrencyInput(e.target.value, setSolarLoan)}
                          onBlur={() => formatCurrencyOnBlur(solarLoan, setSolarLoan)}
                          className="pl-7 text-sm h-10"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-slate-50/80 border border-slate-100 rounded-lg px-4 py-3 space-y-2.5">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Closing Costs & Fees</p>

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-500">
                  Real Estate Brokerage Compensation
                </Label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={brokerInput}
                    onChange={(e) => handleBrokerInputChange(e.target.value)}
                    onBlur={handleBrokerBlur}
                    className="w-[56px] text-right text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs font-medium text-slate-500">
                    NM GRT on Commission
                  </Label>
                  <a
                    href="https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/856bdcf9-8451-40df-b807-c03fa32f9941/January%201,%202026%20-%20June%2030%202026%20GRT_CMP%20Rate%20Schedule%20Update.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-500 hover:underline transition-colors"
                  >
                    (Location Codes)
                  </a>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={grtInput}
                    onChange={(e) => handleGrtInputChange(e.target.value)}
                    onBlur={handleGrtBlur}
                    className="w-[72px] text-right text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
              </div>


              <div className="flex items-center justify-between pt-1">
                <Label className="text-xs font-medium text-slate-500">
                  Property Tax Proration
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Annual taxes"
                    value={annualPropertyTax}
                    onChange={(e) => handleCurrencyInput(e.target.value, setAnnualPropertyTax)}
                    onBlur={() => formatCurrencyOnBlur(annualPropertyTax, setAnnualPropertyTax)}
                    className="w-full pl-7 pr-2 py-1 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                  />
                </div>
                <span className="text-xs text-slate-400 shrink-0">closing</span>
                <select
                  value={closingMonth}
                  onChange={(e) => setClosingMonth(parseInt(e.target.value))}
                  className="text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                >
                  <option value={1}>Jan</option>
                  <option value={2}>Feb</option>
                  <option value={3}>Mar</option>
                  <option value={4}>Apr</option>
                  <option value={5}>May</option>
                  <option value={6}>Jun</option>
                  <option value={7}>Jul</option>
                  <option value={8}>Aug</option>
                  <option value={9}>Sep</option>
                  <option value={10}>Oct</option>
                  <option value={11}>Nov</option>
                  <option value={12}>Dec</option>
                </select>
              </div>

              {parseCurrency(annualPropertyTax) > 0 && (
                <p className="text-[11px] text-slate-400">
                  Seller's share: {closingMonth} of 12 months = {formatCurrency((closingMonth / 12) * parseCurrency(annualPropertyTax))}
                </p>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-slate-500">
                  Survey
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={surveyFee}
                    onChange={(e) => handleCurrencyInput(e.target.value, setSurveyFee)}
                    onBlur={() => formatCurrencyOnBlur(surveyFee, setSurveyFee)}
                    className="w-[80px] pl-6 pr-2 py-0.5 text-right text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-500">
                    Is this home in an HOA?
                  </Label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setHasHoa(true)}
                      className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${hasHoa ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setHasHoa(false)}
                      className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${!hasHoa ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {hasHoa && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between pt-1">
                        <Label className="text-xs text-slate-400">
                          HOA Transfer/Disclosure Fee
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <input
                            type="text"
                            inputMode="decimal"
                            value={hoaFee}
                            onChange={(e) => handleCurrencyInput(e.target.value, setHoaFee)}
                            onBlur={() => formatCurrencyOnBlur(hoaFee, setHoaFee)}
                            className="w-[80px] pl-6 pr-2 py-0.5 text-right text-sm font-semibold text-slate-500 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-colors"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Handshake className="w-4 h-4 text-blue-400" />
                Seller Concessions
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={sellerConcessions}
                  onChange={(e) => handleCurrencyInput(e.target.value, setSellerConcessions)}
                  onBlur={() => formatCurrencyOnBlur(sellerConcessions, setSellerConcessions)}
                  className="pl-8 text-lg h-12 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                Repairs
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={repairCosts}
                  onChange={(e) => handleCurrencyInput(e.target.value, setRepairCosts)}
                  onBlur={() => formatCurrencyOnBlur(repairCosts, setRepairCosts)}
                  className="pl-8 text-lg h-12 font-medium"
                />
              </div>
            </div>

            {customFields.map((field, index) => (
              <div key={index} className="space-y-2 bg-slate-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => {
                      const updated = [...customFields];
                      updated[index].name = e.target.value;
                      setCustomFields(updated);
                    }}
                    className="text-sm font-medium text-slate-700 bg-transparent border-b border-slate-300 focus:border-blue-400 focus:outline-none pb-0.5 w-[60%]"
                  />
                  <button
                    onClick={() => setCustomFields(customFields.filter((_, i) => i !== index))}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={field.amount}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = raw.split('.');
                      const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
                      const intPart = sanitized.split('.')[0];
                      const decPart = sanitized.includes('.') ? '.' + sanitized.split('.')[1] : '';
                      const formattedInt = intPart ? parseInt(intPart, 10).toLocaleString('en-US') : '';
                      const updated = [...customFields];
                      updated[index].amount = formattedInt + decPart;
                      setCustomFields(updated);
                      if (validationError) setValidationError(null);
                    }}
                    onBlur={() => {
                      const parsed = parseFloat(field.amount.replace(/,/g, ''));
                      if (!isNaN(parsed) && parsed > 0) {
                        const updated = [...customFields];
                        updated[index].amount = parsed.toLocaleString('en-US', { minimumFractionDigits: parsed % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 });
                        setCustomFields(updated);
                      }
                    }}
                    className="pl-8 text-lg h-12 font-medium"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={() => setCustomFields([...customFields, { name: '', amount: '' }])}
              className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors pt-1"
            >
              <Plus className="w-4 h-4" />
              Add Custom Field
            </button>

            <div className="pt-4 space-y-4">
              <Button
                onClick={handleRunNetCheck}
                disabled={isCalculating || showResults}
                className="w-full h-12 text-lg font-semibold bg-emerald-400 hover:bg-emerald-500 text-white disabled:opacity-50"
              >
                {isCalculating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span style={{letterSpacing: '-0.02em'}}>{"Run "}<span className="font-extrabold">Net</span><span className="font-light">Check</span></span>
                )}
              </Button>

              {validationError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 text-center"
                >
                  {validationError}
                </motion.p>
              )}

              <AnimatePresence mode="wait">
                {isCalculating && calcPhase === 'calculating' && (
                  <motion.p
                    key="calculating"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-slate-500 text-center"
                  >
                    Calculating your estimated net...
                  </motion.p>
                )}
                {isCalculating && calcPhase === 'applying' && (
                  <motion.p
                    key="applying"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm text-slate-500 text-center"
                  >
                    Applying typical closing costs...
                  </motion.p>
                )}
              </AnimatePresence>

              {showResults && results && (
                <motion.div
                  ref={resultsRef}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="pt-6 mt-2"
                >
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Here's your estimated net</p>
                    <p className={`text-3xl font-bold ${results.netProceeds >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatCurrency(displayedNet)}
                    </p>
                    <div className="mt-4 bg-slate-50 rounded-lg p-4 text-left space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Sale Price</span>
                        <span className="font-medium text-slate-700">{formatCurrency(results.price)}</span>
                      </div>
                      {results.mortgage > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Mortgage Balance</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(results.mortgage)}</span>
                        </div>
                      )}
                      {results.secondMtg > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Second Mortgage</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(results.secondMtg)}</span>
                        </div>
                      )}
                      {results.helocAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">HELOC</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(results.helocAmt)}</span>
                        </div>
                      )}
                      {results.solarAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Solar Loan Balance</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(results.solarAmt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Commission ({brokerCompensation.toFixed(1)}%)</span>
                        <span className="font-medium text-slate-600">-{formatCurrency(results.commissionAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">NM GRT ({grtRate.toFixed(4)}%)</span>
                        <span className="font-medium text-slate-600">-{formatCurrency(results.grtAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 flex items-center gap-1">
                          Est. Title/Escrow Fees
                          <span className="relative group">
                            <Info className="w-3 h-3 text-slate-400 cursor-help" />
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 p-2 text-[10px] leading-tight text-white bg-slate-800 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-10">
                              Actual title/escrow fees may vary by title company and transaction.
                            </span>
                          </span>
                        </span>
                        <span className="font-medium text-slate-600">-{formatCurrency(results.titleEscrowAmount)}</span>
                      </div>
                      {results.taxProration > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tax Proration ({closingMonth}/12 mo)</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(results.taxProration)}</span>
                        </div>
                      )}
                      {results.surveyAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Survey</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(results.surveyAmount)}</span>
                        </div>
                      )}
                      {results.hoaAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">HOA Fee</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(results.hoaAmount)}</span>
                        </div>
                      )}
                      {results.concessionsAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Seller Concessions</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(results.concessionsAmt)}</span>
                        </div>
                      )}
                      {results.repairAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Repairs</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(results.repairAmt)}</span>
                        </div>
                      )}
                      {results.customFields.map((f, i) => f.amount > 0 && (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-500">{f.name}</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(f.amount)}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-300 pt-3 mt-1 flex justify-between text-sm">
                        <span className="font-bold text-slate-800">Estimated Net</span>
                        <span className={`font-bold ${results.netProceeds >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatCurrency(results.netProceeds)}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const chartData = [
                        { name: 'Net Proceeds', value: Math.max(results.netProceeds, 0), color: '#34d399' },
                        ...(results.mortgage > 0 ? [{ name: 'Mortgage', value: results.mortgage, color: '#94a3b8' }] : []),
                        ...(results.secondMtg > 0 ? [{ name: '2nd Mortgage', value: results.secondMtg, color: '#a1a1aa' }] : []),
                        ...(results.helocAmt > 0 ? [{ name: 'HELOC', value: results.helocAmt, color: '#b4b4bb' }] : []),
                        ...(results.solarAmt > 0 ? [{ name: 'Solar Loan', value: results.solarAmt, color: '#c4c4cc' }] : []),
                        { name: 'Commission', value: results.commissionAmount, color: '#60a5fa' },
                        { name: 'NM GRT', value: results.grtAmount, color: '#fbbf24' },
                        { name: 'Title/Escrow', value: results.titleEscrowAmount, color: '#f97316' },
                        ...(results.taxProration > 0 ? [{ name: 'Tax Proration', value: results.taxProration, color: '#a78bfa' }] : []),
                        ...(results.surveyAmount > 0 ? [{ name: 'Survey', value: results.surveyAmount, color: '#f472b6' }] : []),
                        ...(results.hoaAmount > 0 ? [{ name: 'HOA Fee', value: results.hoaAmount, color: '#2dd4bf' }] : []),
                        ...(results.concessionsAmt > 0 ? [{ name: 'Concessions', value: results.concessionsAmt, color: '#fb923c' }] : []),
                        ...(results.repairAmt > 0 ? [{ name: 'Repairs', value: results.repairAmt, color: '#e879f9' }] : []),
                        ...results.customFields.filter(f => f.amount > 0).map((f, i) => ({ name: f.name, value: f.amount, color: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'][i % 5] })),
                      ].filter(d => d.value > 0);

                      return (
                        <div className="mt-5">
                          <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={110}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                  fontSize: '12px',
                                  padding: '6px 10px',
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                            {chartData.map((entry, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                                <span className="text-[10px] text-slate-500">{entry.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    <Button
                      onClick={() => {
                        setShowResults(false);
                        setCalcPhase('idle');
                        salePriceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        setTimeout(() => salePriceRef.current?.focus(), 400);
                      }}
                      variant="outline"
                      className="mt-4 w-full"
                    >
                      <Pencil className="w-4 h-4 -mr-0.5" />
                      Adjust your numbers
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      className="mt-2 w-full flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          Link Copied!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4" />
                          Share this estimated net
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-slate-400 text-center mt-2">
                      Recipients can view and adjust the numbers
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
