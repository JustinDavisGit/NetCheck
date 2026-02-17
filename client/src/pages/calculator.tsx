import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Home, FileText, Copy, Check, Handshake, Info, Wrench, Plus, X, FileDown } from "lucide-react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
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

const SAMPLE_PRICE = 400000;
const SAMPLE_MORTGAGE = 250000;
const SAMPLE_ANNUAL_TAX = 3000;
const SAMPLE_BROKER = 6;
const SAMPLE_GRT = 7.625;
const SAMPLE_SURVEY = 275;
const SAMPLE_MONTH = new Date().getMonth() + 1;

function buildSampleResults() {
  const commissionAmount = SAMPLE_PRICE * (SAMPLE_BROKER / 100);
  const grtAmount = commissionAmount * (SAMPLE_GRT / 100);
  const titleEscrowAmount = getEstimatedTitleEscrowFee(SAMPLE_PRICE);
  const taxProration = (SAMPLE_MONTH / 12) * SAMPLE_ANNUAL_TAX;
  const totalDeductions = commissionAmount + grtAmount + titleEscrowAmount + taxProration + SAMPLE_SURVEY;
  const netProceeds = SAMPLE_PRICE - SAMPLE_MORTGAGE - totalDeductions;
  return {
    price: SAMPLE_PRICE,
    mortgage: SAMPLE_MORTGAGE,
    commissionAmount,
    grtAmount,
    titleEscrowAmount,
    taxProration,
    hoaAmount: 0,
    surveyAmount: SAMPLE_SURVEY,
    concessionsAmt: 0,
    repairAmt: 0,
    customFields: [] as { name: string; amount: number }[],
    customFieldsTotal: 0,
    secondMtg: 0,
    helocAmt: 0,
    solarAmt: 0,
    netProceeds,
  };
}

const SAMPLE_RESULTS = buildSampleResults();

const INLINE_INPUT_CLASS = "text-right text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg px-2 py-0.5 shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:shadow-md";
const INLINE_CURRENCY_CLASS = "text-right text-sm font-semibold text-gray-900 bg-white border border-gray-300 rounded-lg pl-6 pr-2 py-0.5 shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:shadow-md";

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
  const [isSample, setIsSample] = useState(true);
  const [showCallout, setShowCallout] = useState(true);
  const [displayedNet, setDisplayedNet] = useState(0);
  const [activeSlice, setActiveSlice] = useState<number | null>(null);
  const { toast } = useToast();

  const [resultsInView, setResultsInView] = useState(false);

  const salePriceRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const displayedNetRef = useRef(0);
  const pieChartRef = useRef<HTMLDivElement>(null);

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
    const liens = params.get('liens');
    if (liens === '1') {
      setHasAdditionalLiens(true);
      const sm = params.get('sm');
      if (sm) setSecondMortgage(sm.replace(/[^0-9]/g, ''));
      const hel = params.get('hel');
      if (hel) setHeloc(hel.replace(/[^0-9]/g, ''));
      const sol = params.get('sol');
      if (sol) setSolarLoan(sol.replace(/[^0-9]/g, ''));
    }
    const apt = params.get('apt');
    if (apt) setAnnualPropertyTax(apt.replace(/[^0-9]/g, ''));
    const cm = params.get('cm');
    if (cm) {
      const parsed = parseInt(cm, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) setClosingMonth(parsed);
    }
    const sf = params.get('sf');
    if (sf) setSurveyFee(sf);
    const hoa = params.get('hoa');
    if (hoa === '1') {
      setHasHoa(true);
      const hoaf = params.get('hoaf');
      if (hoaf) setHoaFee(hoaf);
    }
    const sc = params.get('sc');
    if (sc) setSellerConcessions(sc.replace(/[^0-9]/g, ''));
    const rc = params.get('rc');
    if (rc) setRepairCosts(rc.replace(/[^0-9]/g, ''));
    const cf = params.get('cf');
    if (cf) {
      const fields = cf.split(';;').map(entry => {
        const [name, amount] = entry.split('|');
        return { name: name || '', amount: amount || '' };
      });
      if (fields.length > 0) setCustomFields(fields);
    }
    if (sp || mb || bc || grt || liens || apt || cm || sf || hoa || sc || rc || cf) {
      setIsSample(false);
      setShowCallout(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (salePriceRef.current) {
        salePriceRef.current.focus();
      }
    }, 300);
    const calloutTimer = setTimeout(() => setShowCallout(false), 8000);
    return () => {
      clearTimeout(timer);
      clearTimeout(calloutTimer);
    };
  }, []);

  const generateShareUrl = () => {
    const params = new URLSearchParams();
    if (salePrice) params.set('sp', salePrice);
    if (mortgageBalance) params.set('mb', mortgageBalance);
    if (brokerCompensation !== 6) params.set('bc', brokerCompensation.toString());
    if (grtRate !== 7.625) params.set('grt', grtRate.toString());
    if (hasAdditionalLiens) {
      params.set('liens', '1');
      if (secondMortgage) params.set('sm', secondMortgage);
      if (heloc) params.set('hel', heloc);
      if (solarLoan) params.set('sol', solarLoan);
    }
    if (annualPropertyTax) params.set('apt', annualPropertyTax);
    if (closingMonth !== new Date().getMonth() + 1) params.set('cm', closingMonth.toString());
    if (surveyFee !== '275') params.set('sf', surveyFee);
    if (hasHoa) {
      params.set('hoa', '1');
      if (hoaFee !== '350') params.set('hoaf', hoaFee);
    }
    if (sellerConcessions) params.set('sc', sellerConcessions);
    if (repairCosts) params.set('rc', repairCosts);
    if (customFields.length > 0) {
      const cf = customFields.map(f => `${f.name}|${f.amount}`).join(';;');
      params.set('cf', cf);
    }

    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?${params.toString()}`;
  };

  const handleShare = async () => {
    const shareUrl = generateShareUrl();
    await copyToClipboard(shareUrl);
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

  const handleGeneratePDF = async () => {
    if (!displayResults) return;

    const fmt = (value: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 40;
    const bottomMargin = 40;
    let y = 0;

    const checkPage = (needed: number) => {
      if (y + needed > pageH - bottomMargin) {
        doc.addPage();
        y = margin;
      }
    };

    const pillW = 180;
    const pillH = 44;
    const pillX = (pageW - pillW) / 2;
    const pillY = 14;
    const pillR = 14;
    doc.setFillColor(52, 211, 153);
    doc.roundedRect(pillX, pillY, pillW, pillH, pillR, pillR, 'F');

    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    const netText = 'Net';
    const checkText = 'Check';
    doc.setFont('helvetica', 'bold');
    const netW = doc.getTextWidth(netText);
    doc.setFont('helvetica', 'normal');
    const checkW = doc.getTextWidth(checkText);
    const totalW = netW + checkW;
    const startX = (pageW - totalW) / 2;
    const textY = pillY + pillH / 2 + 9;
    doc.setFont('helvetica', 'bold');
    doc.text(netText, startX, textY);
    doc.setFont('helvetica', 'normal');
    doc.text(checkText, startX + netW, textY);

    y = 85;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(100, 116, 139);
    doc.text('Net Proceeds Estimate', pageW / 2, y, { align: 'center' });

    y += 35;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    if (displayResults.netProceeds >= 0) {
      doc.setTextColor(52, 211, 153);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(fmt(displayResults.netProceeds), pageW / 2, y, { align: 'center' });

    y += 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text(`Sale Price: ${fmt(displayResults.price)}`, pageW / 2, y, { align: 'center' });

    y += 30;

    const brokerPct = isSample ? SAMPLE_BROKER : brokerCompensation;
    const grtPct = isSample ? SAMPLE_GRT : grtRate;

    const items: { label: string; amount: number }[] = [];
    items.push({ label: 'Sale Price', amount: displayResults.price });
    if (displayResults.mortgage > 0) items.push({ label: 'Mortgage Payoff', amount: -displayResults.mortgage });
    if (displayResults.secondMtg > 0) items.push({ label: 'Second Mortgage', amount: -displayResults.secondMtg });
    if (displayResults.helocAmt > 0) items.push({ label: 'HELOC', amount: -displayResults.helocAmt });
    if (displayResults.solarAmt > 0) items.push({ label: 'Solar Loan', amount: -displayResults.solarAmt });
    if (displayResults.commissionAmount > 0) items.push({ label: `Commission (${brokerPct}%)`, amount: -displayResults.commissionAmount });
    if (displayResults.grtAmount > 0) items.push({ label: `NM GRT (${grtPct}%)`, amount: -displayResults.grtAmount });
    if (displayResults.titleEscrowAmount > 0) items.push({ label: 'Est. Title/Escrow Fees', amount: -displayResults.titleEscrowAmount });
    if (displayResults.taxProration > 0) items.push({ label: 'Tax Proration', amount: -displayResults.taxProration });
    if (displayResults.surveyAmount > 0) items.push({ label: 'Survey / ILR', amount: -displayResults.surveyAmount });
    if (displayResults.hoaAmount > 0) items.push({ label: 'HOA Fee', amount: -displayResults.hoaAmount });
    if (displayResults.concessionsAmt > 0) items.push({ label: 'Seller Concessions', amount: -displayResults.concessionsAmt });
    if (displayResults.repairAmt > 0) items.push({ label: 'Repairs', amount: -displayResults.repairAmt });
    displayResults.customFields.forEach((f) => {
      if (f.amount > 0) items.push({ label: f.name, amount: -f.amount });
    });

    const rowH = 24;
    const tableH = items.length * rowH + 40;
    checkPage(tableH + 30);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, pageW - margin * 2, tableH, 6, 6, 'F');

    let ty = y + 20;
    items.forEach((item) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, margin + 16, ty);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      const amtStr = item.amount >= 0 ? fmt(item.amount) : `-${fmt(Math.abs(item.amount))}`;
      doc.text(amtStr, pageW - margin - 16, ty, { align: 'right' });

      ty += rowH;
    });

    ty += 4;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(margin + 16, ty - 14, pageW - margin - 16, ty - 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.text('Estimated Net', margin + 16, ty);
    if (displayResults.netProceeds >= 0) {
      doc.setTextColor(52, 211, 153);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(fmt(displayResults.netProceeds), pageW - margin - 16, ty, { align: 'right' });

    y = ty + 20;

    if (pieChartRef.current) {
      try {
        const canvas = await html2canvas(pieChartRef.current, { backgroundColor: '#ffffff', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgW = pageW - margin * 2 - 40;
        const imgH = (canvas.height / canvas.width) * imgW;
        checkPage(imgH + 20);
        const imgX = (pageW - imgW) / 2;
        doc.addImage(imgData, 'PNG', imgX, y, imgW, imgH);
        y += imgH + 15;
      } catch (e) {
        y += 10;
      }
    }

    checkPage(40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('This is an estimate only. Actual figures may vary.', pageW / 2, y, { align: 'center' });
    y += 14;
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, y, { align: 'center' });

    window.open(doc.output('bloburl') as unknown as string, '_blank');
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
    if (isSample) setIsSample(false);
    if (showCallout) setShowCallout(false);
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

  const displayResults = results || (isSample ? SAMPLE_RESULTS : null);

  useEffect(() => {
    const el = resultsRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setResultsInView(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [displayResults]);

  const animateNumber = useCallback((target: number, duration: number = 400) => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    const start = performance.now();
    const startVal = displayedNetRef.current;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * eased;
      displayedNetRef.current = current;
      setDisplayedNet(current);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };

    animationRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const target = displayResults ? displayResults.netProceeds : 0;
    animateNumber(target);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [displayResults, animateNumber]);

  const handlePercentInput = (
    value: string,
    setInput: (v: string) => void,
    setValue: (v: number) => void,
    max: number,
  ) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    setInput(sanitized);
    const parsed = parseFloat(sanitized);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= max) {
      setValue(parsed);
    }
    if (isSample) setIsSample(false);
    if (showCallout) setShowCallout(false);
  };

  const handlePercentBlur = (
    rawInput: string,
    setInput: (v: string) => void,
    setValue: (v: number) => void,
    fallback: number,
    max: number,
    decimals: number,
  ) => {
    let parsed = parseFloat(rawInput);
    if (isNaN(parsed)) parsed = fallback;
    if (parsed < 0) parsed = 0;
    if (parsed > max) parsed = max;
    setValue(parsed);
    setInput(parsed.toFixed(decimals));
  };

  const updateCustomField = (index: number, key: 'name' | 'amount', value: string) => {
    const updated = [...customFields];
    if (key === 'amount') {
      const raw = value.replace(/[^0-9.]/g, '');
      const parts = raw.split('.');
      const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
      const intPart = sanitized.split('.')[0];
      const decPart = sanitized.includes('.') ? '.' + sanitized.split('.')[1] : '';
      const formattedInt = intPart ? parseInt(intPart, 10).toLocaleString('en-US') : '';
      updated[index].amount = formattedInt + decPart;
    } else {
      updated[index].name = value;
    }
    setCustomFields(updated);
    if (isSample) setIsSample(false);
    if (showCallout) setShowCallout(false);
  };

  const blurCustomField = (index: number) => {
    const parsed = parseFloat(customFields[index].amount.replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      const updated = [...customFields];
      updated[index].amount = parsed.toLocaleString('en-US', { minimumFractionDigits: parsed % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 });
      setCustomFields(updated);
    }
  };

  const chartData = useMemo(() => {
    if (!displayResults) return [];
    return [
      { name: 'Net Proceeds', value: Math.max(displayResults.netProceeds, 0), color: '#34d399' },
      ...(displayResults.mortgage > 0 ? [{ name: 'Mortgage', value: displayResults.mortgage, color: '#94a3b8' }] : []),
      ...(displayResults.secondMtg > 0 ? [{ name: '2nd Mortgage', value: displayResults.secondMtg, color: '#a1a1aa' }] : []),
      ...(displayResults.helocAmt > 0 ? [{ name: 'HELOC', value: displayResults.helocAmt, color: '#b4b4bb' }] : []),
      ...(displayResults.solarAmt > 0 ? [{ name: 'Solar Loan', value: displayResults.solarAmt, color: '#c4c4cc' }] : []),
      { name: 'Commission', value: displayResults.commissionAmount, color: '#60a5fa' },
      { name: 'NM GRT', value: displayResults.grtAmount, color: '#fbbf24' },
      { name: 'Title/Escrow', value: displayResults.titleEscrowAmount, color: '#f97316' },
      ...(displayResults.taxProration > 0 ? [{ name: 'Tax Proration', value: displayResults.taxProration, color: '#a78bfa' }] : []),
      ...(displayResults.surveyAmount > 0 ? [{ name: 'Survey / ILR', value: displayResults.surveyAmount, color: '#f472b6' }] : []),
      ...(displayResults.hoaAmount > 0 ? [{ name: 'HOA Fee', value: displayResults.hoaAmount, color: '#2dd4bf' }] : []),
      ...(displayResults.concessionsAmt > 0 ? [{ name: 'Concessions', value: displayResults.concessionsAmt, color: '#fb923c' }] : []),
      ...(displayResults.repairAmt > 0 ? [{ name: 'Repairs', value: displayResults.repairAmt, color: '#e879f9' }] : []),
      ...displayResults.customFields.filter(f => f.amount > 0).map((f, i) => ({ name: f.name, value: f.amount, color: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'][i % 5] })),
    ].filter(d => d.value > 0);
  }, [displayResults]);

  const netProceedsIndex = useMemo(() => chartData.findIndex(d => d.name === 'Net Proceeds'), [chartData]);

  const renderActiveShape = useCallback((props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const isNetProceeds = payload && payload.name === 'Net Proceeds';
    const isUserHovering = activeSlice !== null;
    const isDefaultEmphasis = isNetProceeds && !isUserHovering;
    const isNetHovered = isNetProceeds && isUserHovering;
    const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
    const pulseOffset = isNetHovered ? 3 : 0;
    const offsetX = Math.cos(midAngle) * pulseOffset;
    const offsetY = -Math.sin(midAngle) * pulseOffset;
    return (
      <g>
        {isNetHovered && (
          <Sector
            cx={cx + offsetX}
            cy={cy + offsetY}
            innerRadius={innerRadius - 4}
            outerRadius={outerRadius + 14}
            startAngle={startAngle}
            endAngle={endAngle}
            fill="none"
            stroke="none"
            style={{ filter: 'drop-shadow(0 0 18px rgba(16,185,129,0.45))' }}
          />
        )}
        <Sector
          cx={cx + offsetX}
          cy={cy + offsetY}
          innerRadius={isDefaultEmphasis ? innerRadius : innerRadius - 2}
          outerRadius={isDefaultEmphasis ? outerRadius + 4 : outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={isNetHovered ? 'url(#netProceedsGradientBright)' : isNetProceeds ? 'url(#netProceedsGradient)' : fill}
          style={{
            filter: isNetHovered
              ? 'drop-shadow(0 4px 16px rgba(16,185,129,0.5))'
              : isNetProceeds
                ? 'drop-shadow(0 3px 10px rgba(16,185,129,0.35))'
                : 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        {isNetHovered && (
          <Sector
            cx={cx + offsetX}
            cy={cy + offsetY}
            innerRadius={outerRadius + 11}
            outerRadius={outerRadius + 13}
            startAngle={startAngle}
            endAngle={endAngle}
            fill="rgba(52,211,153,0.3)"
            stroke="none"
          />
        )}
      </g>
    );
  }, [activeSlice]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      <div className="text-center pt-6 pb-4 px-4">
        <div className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-emerald-400 mb-3 shadow-lg">
          <span className="text-3xl font-extrabold text-white tracking-tight font-display">
            Net<span className="font-light">Check</span>
          </span>
        </div>
        <p className="text-slate-500 text-sm">Estimate what you'll take home at closing.</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-24 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full lg:w-[420px] lg:shrink-0"
          >
            <Card className="shadow-lg border-0">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="salePrice" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-400" />
                    Sale Price
                  </Label>
                  <div className="relative overflow-visible">
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
                      className={`pl-8 text-lg h-12 font-medium ${isSample ? 'animate-pulse-glow' : ''}`}
                    />
                    <AnimatePresence>
                      {showCallout && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                          className="flex justify-center w-full absolute top-full mt-2.5 z-10"
                        >
                          <div className="relative bg-emerald-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                            Start here — enter your projected sale price
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-emerald-400" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                        onChange={(e) => handlePercentInput(e.target.value, setBrokerInput, setBrokerCompensation, 10)}
                        onBlur={() => handlePercentBlur(brokerInput, setBrokerInput, setBrokerCompensation, 6, 10, 1)}
                        className={`w-[56px] ${INLINE_INPUT_CLASS}`}
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
                        onChange={(e) => handlePercentInput(e.target.value, setGrtInput, setGrtRate, 15)}
                        onBlur={() => handlePercentBlur(grtInput, setGrtInput, setGrtRate, 7.625, 15, 4)}
                        className={`w-[72px] ${INLINE_INPUT_CLASS}`}
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-500">
                      Survey / ILR (Improvement Location Report)
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={surveyFee}
                        onChange={(e) => handleCurrencyInput(e.target.value, setSurveyFee)}
                        onBlur={() => formatCurrencyOnBlur(surveyFee, setSurveyFee)}
                        className={`w-[80px] ${INLINE_CURRENCY_CLASS}`}
                      />
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
                        className="w-full pl-7 pr-2 py-1 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:shadow-md"
                      />
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">closing</span>
                    <select
                      value={closingMonth}
                      onChange={(e) => setClosingMonth(parseInt(e.target.value))}
                      className="text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-2 py-1 shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:shadow-md"
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

                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-500">
                        HOA?
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
                                className={`w-[80px] ${INLINE_CURRENCY_CLASS}`}
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
                        onChange={(e) => updateCustomField(index, 'name', e.target.value)}
                        className="text-sm font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-emerald-400 focus:outline-none pb-0.5 w-[60%] transition-all duration-200 ease-in-out"
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
                        onChange={(e) => updateCustomField(index, 'amount', e.target.value)}
                        onBlur={() => blurCustomField(index)}
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
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full lg:flex-1 lg:sticky lg:top-6"
          >
            <div ref={resultsRef} className="p-5 bg-gray-50 rounded-lg shadow-sm border border-gray-100">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Estimated Net Proceeds</h3>
                <p className={`text-4xl font-bold transition-all duration-300 ease-out ${!displayResults ? 'text-gray-300' : displayResults.netProceeds >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                  {formatCurrency(displayedNet)}
                </p>
                {!displayResults && (
                  <p className="text-sm text-slate-400 mt-3">Enter a sale price to get started</p>
                )}
                <AnimatePresence>
                  {isSample && displayResults && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-3 bg-emerald-50 border-l-4 border-emerald-400 px-3 py-2 rounded text-left"
                    >
                      <p className="text-xs text-emerald-800">
                        <span className="font-semibold">Sample scenario:</span> $400k Albuquerque home — enter your sale price above to see your own estimate
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {displayResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200 text-left space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Sale Price</span>
                        <span className="font-medium text-slate-700">{formatCurrency(displayResults.price)}</span>
                      </div>
                      {displayResults.mortgage > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Mortgage Balance</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.mortgage)}</span>
                        </div>
                      )}
                      {displayResults.secondMtg > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Second Mortgage</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.secondMtg)}</span>
                        </div>
                      )}
                      {displayResults.helocAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">HELOC</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.helocAmt)}</span>
                        </div>
                      )}
                      {displayResults.solarAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Solar Loan Balance</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.solarAmt)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Commission ({(isSample ? SAMPLE_BROKER : brokerCompensation).toFixed(1)}%)</span>
                        <span className="font-medium text-slate-600">-{formatCurrency(displayResults.commissionAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">NM GRT ({(isSample ? SAMPLE_GRT : grtRate).toFixed(4)}%)</span>
                        <span className="font-medium text-slate-600">-{formatCurrency(displayResults.grtAmount)}</span>
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
                        <span className="font-medium text-slate-600">-{formatCurrency(displayResults.titleEscrowAmount)}</span>
                      </div>
                      {displayResults.taxProration > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Tax Proration ({closingMonth}/12 mo)</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.taxProration)}</span>
                        </div>
                      )}
                      {displayResults.surveyAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Survey / ILR</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.surveyAmount)}</span>
                        </div>
                      )}
                      {displayResults.hoaAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">HOA Fee</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.hoaAmount)}</span>
                        </div>
                      )}
                      {displayResults.concessionsAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Seller Concessions</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.concessionsAmt)}</span>
                        </div>
                      )}
                      {displayResults.repairAmt > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Repairs</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.repairAmt)}</span>
                        </div>
                      )}
                      {displayResults.customFields.map((f, i) => f.amount > 0 && (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-500">{f.name}</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(f.amount)}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-300 pt-3 mt-1 flex justify-between text-sm">
                        <span className="font-bold text-slate-800">Estimated Net</span>
                        <span className={`font-bold ${displayResults.netProceeds >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatCurrency(displayResults.netProceeds)}
                        </span>
                      </div>
                    </div>

                    <div ref={pieChartRef} className="mt-4 rounded-lg bg-white p-3 border border-gray-200">
                      <div style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.06))' }}>
                        <ResponsiveContainer width="100%" height={360}>
                          <PieChart>
                            <defs>
                              <linearGradient id="netProceedsGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#34d399" />
                                <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                              <linearGradient id="netProceedsGradientBright" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#6ee7b7" />
                                <stop offset="50%" stopColor="#34d399" />
                                <stop offset="100%" stopColor="#10b981" />
                              </linearGradient>
                            </defs>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={90}
                              outerRadius={145}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                              activeIndex={activeSlice !== null ? activeSlice : (netProceedsIndex >= 0 ? netProceedsIndex : undefined)}
                              activeShape={renderActiveShape}
                              onMouseEnter={(_, index) => setActiveSlice(index)}
                              onMouseLeave={() => setActiveSlice(null)}
                              labelLine={false}
                            >
                              {chartData.map((entry, index) => {
                                const isNet = entry.name === 'Net Proceeds';
                                return (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={isNet ? 'url(#netProceedsGradient)' : entry.color}
                                    style={{
                                      opacity: activeSlice !== null && activeSlice !== index ? 0.45 : 1,
                                      transition: 'opacity 0.15s ease-out',
                                      cursor: 'pointer',
                                    }}
                                  />
                                );
                              })}
                            </Pie>
                            
                            {(() => {
                              const isNetHovered = activeSlice !== null && chartData[activeSlice]?.name === 'Net Proceeds';
                              const hoveredSlice = activeSlice !== null ? chartData[activeSlice] : null;
                              const amountColor = isNetHovered
                                ? '#059669'
                                : hoveredSlice
                                  ? hoveredSlice.color
                                  : displayResults.netProceeds >= 0 ? '#34d399' : '#ef4444';
                              const amount = hoveredSlice
                                ? formatCurrency(hoveredSlice.value)
                                : formatCurrency(displayResults.netProceeds);
                              const label = isNetHovered
                                ? 'You Keep'
                                : hoveredSlice
                                  ? hoveredSlice.name
                                  : 'Net Proceeds';
                              const labelColor = isNetHovered ? '#10b981' : '#94a3b8';
                              return (
                                <g style={{ transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                                  <text
                                    x="50%"
                                    y={isNetHovered ? '44%' : '47%'}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    style={{
                                      fontSize: isNetHovered ? '26px' : activeSlice !== null ? '20px' : '24px',
                                      fontWeight: 800,
                                      fill: amountColor,
                                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}
                                  >
                                    {amount}
                                  </text>
                                  <text
                                    x="50%"
                                    y={isNetHovered ? '53%' : '55%'}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    style={{
                                      fontSize: isNetHovered ? '13px' : '11px',
                                      fontWeight: isNetHovered ? 600 : 500,
                                      fill: labelColor,
                                      letterSpacing: isNetHovered ? '0.5px' : '0px',
                                      textTransform: isNetHovered ? 'uppercase' as const : 'none' as const,
                                      transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    }}
                                  >
                                    {label}
                                  </text>
                                </g>
                              );
                            })()}
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mt-1 pb-1">
                        {chartData.map((entry, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 cursor-pointer transition-opacity duration-150"
                            style={{ opacity: activeSlice !== null && activeSlice !== index ? 0.4 : 1 }}
                            onMouseEnter={() => setActiveSlice(index)}
                            onMouseLeave={() => setActiveSlice(null)}
                          >
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-[11px] text-slate-500 font-medium">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 min-w-0">
                        <Button
                          onClick={handleShare}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Link
                            </>
                          )}
                        </Button>
                        <p className="text-[11px] text-slate-400 text-center mt-1.5">
                          Recipients can view &amp; adjust
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Button
                          onClick={handleGeneratePDF}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                        >
                          <FileDown className="w-4 h-4" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {displayResults && !resultsInView && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 lg:hidden z-50"
          >
            <div className="bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-2.5">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <span className="text-xs font-medium text-slate-500">{isSample ? 'Sample Net' : 'Est. Net'}</span>
                <div className="w-10 h-10 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={12}
                        outerRadius={19}
                        paddingAngle={1}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`mini-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <span className={`text-xl font-bold ${displayResults.netProceeds >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                  {formatCurrency(displayedNet)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
