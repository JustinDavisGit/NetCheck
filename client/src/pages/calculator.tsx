import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calculator as CalculatorIcon, DollarSign, Home, Wallet, Briefcase, Gift, Calendar, Receipt, Scale, Building2, PartyPopper, Palmtree, Share2, Check } from "lucide-react";
import { GiCactus } from "react-icons/gi";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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
  const [livesInSpecialState, setLivesInSpecialState] = useState<boolean | null>(null);
  const [selectedState, setSelectedState] = useState<'nm' | 'hi' | null>(null);
  const [grtRate, setGrtRate] = useState<number>(7);
  const [getRate, setGetRate] = useState<number>(4.25);
  const [hasSecondaryLoans, setHasSecondaryLoans] = useState<boolean | null>(null);
  const [secondMortgage, setSecondMortgage] = useState<string>("");
  const [heloc, setHeloc] = useState<string>("");
  const [solarLoan, setSolarLoan] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Load state from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sp')) setSalePrice(params.get('sp') || '');
    if (params.get('mb')) setMortgageBalance(params.get('mb') || '');
    if (params.get('sc')) setSellerConcession(params.get('sc') || '');
    if (params.get('bc')) setBrokerCompensation(parseFloat(params.get('bc') || '6'));
    if (params.get('cd')) setClosingDate(params.get('cd') || '');
    if (params.get('apt')) setAnnualPropertyTax(params.get('apt') || '');
    if (params.get('tef')) setTitleEscrowFees(parseFloat(params.get('tef') || '1'));
    if (params.get('hoa') === 'true') setHasHoa(true);
    if (params.get('hoa') === 'false') setHasHoa(false);
    if (params.get('htf')) setHoaTransferFees(parseFloat(params.get('htf') || '500'));
    if (params.get('state') === 'nm' || params.get('state') === 'hi') {
      setLivesInSpecialState(true);
      setSelectedState(params.get('state') as 'nm' | 'hi');
    }
    if (params.get('grt')) setGrtRate(parseFloat(params.get('grt') || '7'));
    if (params.get('get')) setGetRate(parseFloat(params.get('get') || '4.25'));
  }, []);

  const generateShareUrl = () => {
    const params = new URLSearchParams();
    if (salePrice) params.set('sp', salePrice);
    if (mortgageBalance) params.set('mb', mortgageBalance);
    if (sellerConcession) params.set('sc', sellerConcession);
    if (brokerCompensation !== 6) params.set('bc', brokerCompensation.toString());
    if (closingDate) params.set('cd', closingDate);
    if (annualPropertyTax) params.set('apt', annualPropertyTax);
    if (titleEscrowFees !== 1) params.set('tef', titleEscrowFees.toString());
    if (hasHoa !== null) params.set('hoa', hasHoa.toString());
    if (hasHoa && hoaTransferFees !== 500) params.set('htf', hoaTransferFees.toString());
    if (selectedState) params.set('state', selectedState);
    if (selectedState === 'nm' && grtRate !== 7) params.set('grt', grtRate.toString());
    if (selectedState === 'hi' && getRate !== 4.25) params.set('get', getRate.toString());
    
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
    const secondMort = parseFloat(secondMortgage) || 0;
    const helocAmount = parseFloat(heloc) || 0;
    const solarAmount = parseFloat(solarLoan) || 0;
    const totalMortgages = mortgage + secondMort + helocAmount + solarAmount;
    const concession = parseFloat(sellerConcession) || 0;
    const taxProration = calculateTaxProration.proration;
    const titleFees = price * (titleEscrowFees / 100);
    const hoaFees = hasHoa ? hoaTransferFees : 0;

    if (price === 0) return null;

    const commissionAmount = price * (brokerCompensation / 100);
    const grtAmount = selectedState === 'nm' ? commissionAmount * (grtRate / 100) : 0;
    const getAmount = selectedState === 'hi' ? commissionAmount * (getRate / 100) : 0;
    const grossEquity = price - totalMortgages;
    const netProceeds = grossEquity - commissionAmount - grtAmount - getAmount - concession - taxProration - titleFees - hoaFees;
    const netPercentage = price > 0 ? (netProceeds / price) * 100 : 0;

    return {
      grossEquity,
      commissionAmount,
      grtAmount,
      getAmount,
      concession,
      taxProration,
      titleFees,
      hoaFees,
      netProceeds,
      netPercentage,
    };
  }, [salePrice, mortgageBalance, secondMortgage, heloc, solarLoan, sellerConcession, brokerCompensation, titleEscrowFees, hasHoa, hoaTransferFees, selectedState, grtRate, getRate, calculateTaxProration]);

  const sliderPercentage = ((brokerCompensation - 1) / 9) * 100;
  const titleSliderPercentage = ((titleEscrowFees - 0.5) / 1.5) * 100;
  const hoaSliderPercentage = ((hoaTransferFees - 250) / 750) * 100;
  const grtSliderPercentage = ((grtRate - 5) / 4) * 100;
  const getSliderPercentage = ((getRate - 4) / 1) * 100;

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
              {salePrice && mortgageBalance && parseFloat(salePrice) > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-slate-500 mt-2"
                >
                  You have approximately{' '}
                  <span className="font-semibold text-green-600">
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
                    Any Second Mortgage, HELOC, or Solar Balance to be paid at Closing?
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setHasSecondaryLoans(true)}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        hasSecondaryLoans === true
                          ? 'bg-slate-800 text-white'
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
                        setSolarLoan("");
                      }}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                        hasSecondaryLoans === false
                          ? 'bg-slate-800 text-white'
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
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <p className="text-green-700 text-sm font-medium text-center">
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
                      <div className="space-y-1">
                        <Label htmlFor="solarLoan" className="text-xs font-medium text-slate-600">
                          Solar Loan Balance
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                          <Input
                            id="solarLoan"
                            type="text"
                            placeholder="0"
                            value={formatInputDisplay(solarLoan)}
                            onChange={(e) => handleCurrencyInput(e.target.value, setSolarLoan)}
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
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Real Estate Brokerage Compensation (Listing Agent + Buyer's Broker)
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

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">
                    Do you live in New Mexico or Hawaii?
                  </Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLivesInSpecialState(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        livesInSpecialState === true
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLivesInSpecialState(false); setSelectedState(null); }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        livesInSpecialState === false
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {livesInSpecialState === true && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-3 pt-2"
                  >
                    <span className="text-sm text-slate-600 font-medium">Which one?</span>
                    <button
                      type="button"
                      onClick={() => setSelectedState('nm')}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                        selectedState === 'nm'
                          ? 'bg-amber-500 text-white shadow-lg scale-105'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <GiCactus className="w-5 h-5" />
                      New Mexico
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedState('hi')}
                      className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                        selectedState === 'hi'
                          ? 'bg-teal-500 text-white shadow-lg scale-105'
                          : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                      }`}
                    >
                      <Palmtree className="w-5 h-5" />
                      Hawaii
                    </button>
                  </motion.div>
                )}

                {selectedState === 'nm' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <GiCactus className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-800 font-medium">Howdy, partner!</p>
                          <p className="text-amber-700 text-sm mt-1">
                            NM charges Gross Receipts Tax (GRT) on real estate commissions. GRT ranges from 5-9% of the total commission. Think of this as a sales tax on the service provided by the real estate professional.
                          </p>
                          <a 
                            href="https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/856bdcf9-8451-40df-b807-c03fa32f9941/January%201,%202026%20-%20June%2030%202026%20GRT_CMP%20Rate%20Schedule%20Update.pdf"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 text-sm mt-2 underline"
                          >
                            View GRT rates by location (PDF)
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-slate-700">
                          GRT Rate
                        </Label>
                        <span className="text-lg font-semibold text-amber-600">{grtRate.toFixed(1)}%</span>
                      </div>
                      
                      <div className="relative pt-2">
                        <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-150"
                            style={{ width: `${grtSliderPercentage}%` }}
                          />
                        </div>
                        
                        <div 
                          className="absolute top-0 -translate-x-1/2 transition-all duration-150"
                          style={{ left: `${grtSliderPercentage}%` }}
                        >
                          <div className="w-8 h-8 bg-white border-2 border-amber-500 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                            <GiCactus className="w-4 h-4 text-amber-600" />
                          </div>
                        </div>
                        
                        <input
                          type="range"
                          min="5"
                          max="9"
                          step="0.1"
                          value={grtRate}
                          onChange={(e) => setGrtRate(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full h-8 opacity-0 cursor-grab active:cursor-grabbing"
                          style={{ top: '-2px' }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>5%</span>
                        <span>9%</span>
                      </div>

                      <div className="text-center pt-2">
                        <span className="text-xl font-semibold text-amber-700">
                          {formatCurrency((parseFloat(salePrice) || 0) * (brokerCompensation / 100) * (grtRate / 100))}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">GRT on commission</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {selectedState === 'hi' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Palmtree className="w-6 h-6 text-teal-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-teal-800 font-medium">Aloha!</p>
                          <p className="text-teal-700 text-sm mt-1">
                            Hawaii charges General Excise Tax (GET) on real estate commissions. GET ranges from 4-5% of the total commission. Think of this as a sales tax on the service provided by the real estate professional.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-slate-700">
                          GET Rate
                        </Label>
                        <span className="text-lg font-semibold text-teal-600">{getRate.toFixed(2)}%</span>
                      </div>
                      
                      <div className="relative pt-2">
                        <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-150"
                            style={{ width: `${getSliderPercentage}%` }}
                          />
                        </div>
                        
                        <div 
                          className="absolute top-0 -translate-x-1/2 transition-all duration-150"
                          style={{ left: `${getSliderPercentage}%` }}
                        >
                          <div className="w-8 h-8 bg-white border-2 border-teal-500 rounded-full shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform">
                            <Palmtree className="w-4 h-4 text-teal-600" />
                          </div>
                        </div>
                        
                        <input
                          type="range"
                          min="4"
                          max="5"
                          step="0.05"
                          value={getRate}
                          onChange={(e) => setGetRate(parseFloat(e.target.value))}
                          className="absolute inset-0 w-full h-8 opacity-0 cursor-grab active:cursor-grabbing"
                          style={{ top: '-2px' }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>4%</span>
                        <span>5%</span>
                      </div>

                      <div className="text-center pt-2">
                        <span className="text-xl font-semibold text-teal-700">
                          {formatCurrency((parseFloat(salePrice) || 0) * (brokerCompensation / 100) * (getRate / 100))}
                        </span>
                        <p className="text-xs text-slate-400 mt-1">GET on commission</p>
                      </div>
                    </div>
                  </motion.div>
                )}
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

            <div className="pt-6 border-t border-slate-100 mt-6">
              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
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
