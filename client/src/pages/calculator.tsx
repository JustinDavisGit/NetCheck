import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { DollarSign, Home, Wallet, Briefcase, Share2, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Calculator() {
  const [salePrice, setSalePrice] = useState<string>("");
  const [mortgageBalance, setMortgageBalance] = useState<string>("");
  const [brokerCompensation, setBrokerCompensation] = useState<number>(6);
  const [hasSecondaryLoans, setHasSecondaryLoans] = useState<boolean | null>(null);
  const [secondMortgage, setSecondMortgage] = useState<string>("");
  const [heloc, setHeloc] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcPhase, setCalcPhase] = useState<'idle' | 'calculating' | 'applying' | 'done'>('idle');
  const { toast } = useToast();

  // Load state from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sp')) setSalePrice(params.get('sp') || '');
    if (params.get('mb')) setMortgageBalance(params.get('mb') || '');
    if (params.get('bc')) setBrokerCompensation(parseFloat(params.get('bc') || '6'));
  }, []);

  const generateShareUrl = () => {
    const params = new URLSearchParams();
    if (salePrice) params.set('sp', salePrice);
    if (mortgageBalance) params.set('mb', mortgageBalance);
    if (brokerCompensation !== 6) params.set('bc', brokerCompensation.toString());
    
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
    const secondMort = parseFloat(secondMortgage) || 0;
    const helocAmount = parseFloat(heloc) || 0;
    const totalMortgages = mortgage + secondMort + helocAmount;

    if (price === 0) return null;

    const commissionAmount = price * (brokerCompensation / 100);
    const grossEquity = price - totalMortgages;
    const netProceeds = grossEquity - commissionAmount;
    const netPercentage = price > 0 ? (netProceeds / price) * 100 : 0;

    return {
      grossEquity,
      commissionAmount,
      netProceeds,
      netPercentage,
    };
  }, [salePrice, mortgageBalance, secondMortgage, heloc, brokerCompensation]);

  const handleRunNetCheck = () => {
    if (!results) return;
    setShowResults(false);
    setIsCalculating(true);
    setCalcPhase('calculating');
    setDisplayedNet(0);

    setTimeout(() => {
      setCalcPhase('applying');
    }, 550);

    setTimeout(() => {
      setCalcPhase('done');
      setShowResults(true);
      setIsCalculating(false);
    }, 1200);
  };

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

  const sliderPercentage = (brokerCompensation / 8) * 100;

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
          <p className="text-slate-500 mt-1">See what you'll actually net at closing.</p>
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
                <Wallet className="w-4 h-4 text-blue-400" />
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
              {salePrice && mortgageBalance && parseFloat(salePrice) > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-slate-500 mt-2"
                >
                  You have approximately{' '}
                  <span className="font-semibold text-emerald-500">
                    {(((parseFloat(salePrice) - parseFloat(mortgageBalance)) / parseFloat(salePrice)) * 100).toFixed(1)}%
                  </span>{' '}
                  equity in your home
                </motion.p>
              )}

              {mortgageBalance && parseFloat(mortgageBalance) > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 space-y-3"
                >
                  <p className="text-sm font-medium text-slate-700">
                    Any second mortgage or HELOC (home equity line of credit) to be paid at closing?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setHasSecondaryLoans(true)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        hasSecondaryLoans === true
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasSecondaryLoans(false);
                        setSecondMortgage("");
                        setHeloc("");
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        hasSecondaryLoans === false
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      No
                    </button>
                  </div>

                  {hasSecondaryLoans === false && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-emerald-50 border border-emerald-200 rounded-lg p-3"
                    >
                      <p className="text-emerald-600 text-sm font-medium text-center">
                        Sweet! That means more dinero in your pocket! 💰
                      </p>
                    </motion.div>
                  )}

                  {hasSecondaryLoans === true && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 pt-2"
                    >
                      <div className="space-y-1">
                        <Label htmlFor="secondMortgage" className="text-xs font-medium text-slate-600">
                          Second Mortgage
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <Input
                            id="secondMortgage"
                            type="text"
                            placeholder="0"
                            value={formatInputDisplay(secondMortgage)}
                            onChange={(e) => handleCurrencyInput(e.target.value, setSecondMortgage)}
                            className="pl-6 text-sm h-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="heloc" className="text-xs font-medium text-slate-600">
                          HELOC
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <Input
                            id="heloc"
                            type="text"
                            placeholder="0"
                            value={formatInputDisplay(heloc)}
                            onChange={(e) => handleCurrencyInput(e.target.value, setHeloc)}
                            className="pl-6 text-sm h-10"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  Real Estate Brokerage Compensation
                </Label>
                <span className="text-lg font-semibold text-blue-500">{brokerCompensation.toFixed(1)}%</span>
              </div>
              
              <div className="relative pt-2">
                <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-emerald-300 to-emerald-400 rounded-full transition-all duration-150"
                    style={{ width: `${sliderPercentage}%` }}
                  />
                </div>
                
                <div 
                  className="absolute top-0 -translate-x-1/2 transition-all duration-150"
                  style={{ left: `${sliderPercentage}%` }}
                >
                  <div className="w-8 h-8 bg-white border-2 border-emerald-400 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                    <Briefcase className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="0.5"
                  value={brokerCompensation}
                  onChange={(e) => setBrokerCompensation(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-8 opacity-0 cursor-grab active:cursor-grabbing"
                  style={{ top: '-2px' }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-slate-400">
                <span>0%</span>
                <span>8%</span>
              </div>

              <div className="text-center pt-2">
                <span className="text-xl font-semibold text-slate-700">
                  {formatCurrency((parseFloat(salePrice) || 0) * (brokerCompensation / 100))}
                </span>
              </div>

            </div>

            <div className="pt-4 space-y-4">
              <Button
                onClick={handleRunNetCheck}
                disabled={!results || isCalculating || showResults}
                className="w-full h-12 text-lg font-semibold bg-emerald-400 hover:bg-emerald-500 text-white disabled:opacity-50"
              >
                {isCalculating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span style={{letterSpacing: '-0.02em'}}>{"Run "}<span className="font-extrabold">Net</span><span className="font-light">Check</span></span>
                )}
              </Button>

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
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="pt-4 border-t border-slate-100"
                >
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Here's your estimated net</p>
                    <p className={`text-3xl font-bold ${results.netProceeds >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatCurrency(displayedNet)}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      {results.netPercentage.toFixed(1)}% of sale price
                    </p>
                    <Button
                      onClick={() => {
                        setShowResults(false);
                        setCalcPhase('idle');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      variant="outline"
                      className="mt-4 w-full"
                    >
                      Try another scenario
                    </Button>
                    <p className="text-xs text-slate-400 mt-1">
                      Change sale price, mortgage balance, commission, etc...
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6">
              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share This Estimated Net
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-400 text-center mt-2">
                Recipients can view and adjust the numbers
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
