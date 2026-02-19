import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import nmBg from "@assets/NM.jpg";
import nyBg from "@assets/NY.jpg";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DollarSign, Home, FileText, Copy, Check, Briefcase, Handshake, Info, Wrench, Plus, X, FileDown, ChevronDown, Minus, MapPin } from "lucide-react";
import jsPDF from 'jspdf';
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
const SAMPLE_MONTH = (new Date().getMonth() + 1) % 12 + 1;

function buildSampleResults() {
  const commissionAmount = SAMPLE_PRICE * (SAMPLE_BROKER / 100);
  const grtAmount = commissionAmount * (SAMPLE_GRT / 100);
  const titleEscrowAmount = getEstimatedTitleEscrowFee(SAMPLE_PRICE);
  const taxProration = (SAMPLE_MONTH / 12) * SAMPLE_ANNUAL_TAX;
  const totalDeductions = commissionAmount + grtAmount + titleEscrowAmount + taxProration + SAMPLE_SURVEY + 100;
  const netProceeds = SAMPLE_PRICE - SAMPLE_MORTGAGE - totalDeductions;
  return {
    price: SAMPLE_PRICE,
    mortgage: SAMPLE_MORTGAGE,
    commissionAmount,
    grtAmount,
    titleEscrowAmount,
    taxProration,
    hoaAmount: 0,
    septicAmount: 0,
    wellAmount: 0,
    waterBillAmount: 100,
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

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }, { value: 'DC', label: 'District of Columbia' },
];

const STATE_BACKGROUNDS: Record<string, string> = {
  NM: nmBg,
  NY: nyBg,
};

export default function Calculator() {
  const [salePrice, setSalePrice] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("NM");
  const [mortgageBalance, setMortgageBalance] = useState<string>("");
  const [listingAgentPct, setListingAgentPct] = useState<number>(3);
  const [buyerAgentPct, setBuyerAgentPct] = useState<number>(3);
  const [totalCommissionInput, setTotalCommissionInput] = useState<string>("6.00");
  const [commissionExpanded, setCommissionExpanded] = useState(false);
  const [grtRate, setGrtRate] = useState<number>(7.625);
  const [grtInput, setGrtInput] = useState<string>("7.6250");
  const isNM = selectedState === 'NM';
  const totalCommissionPct = listingAgentPct + buyerAgentPct;
  const [isEditingTotalCommission, setIsEditingTotalCommission] = useState(false);
  useEffect(() => {
    if (!isEditingTotalCommission) {
      setTotalCommissionInput(totalCommissionPct.toFixed(2));
    }
  }, [totalCommissionPct, isEditingTotalCommission]);
  const [hasAdditionalLiens, setHasAdditionalLiens] = useState(false);
  const [secondMortgage, setSecondMortgage] = useState<string>("");
  const [heloc, setHeloc] = useState<string>("");
  const [solarLoan, setSolarLoan] = useState<string>("");
  const [annualPropertyTax, setAnnualPropertyTax] = useState<string>("");
  const [closingMonth, setClosingMonth] = useState<number>((new Date().getMonth() + 1) % 12 + 1);
  const [hasHoa, setHasHoa] = useState(false);
  const [hoaFee, setHoaFee] = useState<string>("350");
  const [hasSeptic, setHasSeptic] = useState(false);
  const [septicFee, setSepticFee] = useState<string>("550");
  const [hasWell, setHasWell] = useState(false);
  const [wellFee, setWellFee] = useState<string>("550");
  const [waterBill, setWaterBill] = useState<string>("0");
  const [sellerConcessions, setSellerConcessions] = useState<string>("");
  const [repairCosts, setRepairCosts] = useState<string>("");
  const [customFields, setCustomFields] = useState<{ name: string; amount: string }[]>([]);
  const [surveyFee, setSurveyFee] = useState<string>("0");
  const defaultCostsApplied = useRef(false);
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
      if (cleaned) {
        setMortgageBalance(cleaned);
        defaultCostsApplied.current = true;
        setSurveyFee("275");
        setWaterBill("100");
      }
    }
    if (bc) {
      const parsed = parseFloat(bc);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
        setListingAgentPct(parsed / 2);
        setBuyerAgentPct(parsed / 2);
        setTotalCommissionInput(parsed.toFixed(2));
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

  useEffect(() => {
    const detectState = async () => {
      try {
        const res = await fetch('https://ip-api.com/json/?fields=regionName');
        const data = await res.json();
        if (data.regionName) {
          const match = US_STATES.find(s => s.label === data.regionName);
          if (match) setSelectedState(match.value);
        }
      } catch {
      }
    };
    detectState();
  }, []);

  const generateShareUrl = () => {
    const params = new URLSearchParams();
    if (salePrice) params.set('sp', salePrice);
    if (mortgageBalance) params.set('mb', mortgageBalance);
    if (totalCommissionPct !== 6) params.set('bc', totalCommissionPct.toString());
    if (isNM && grtRate !== 7.625) params.set('grt', grtRate.toString());
    if (hasAdditionalLiens) {
      params.set('liens', '1');
      if (secondMortgage) params.set('sm', secondMortgage);
      if (heloc) params.set('hel', heloc);
      if (solarLoan) params.set('sol', solarLoan);
    }
    if (annualPropertyTax) params.set('apt', annualPropertyTax);
    if (closingMonth !== (new Date().getMonth() + 1) % 12 + 1) params.set('cm', closingMonth.toString());
    if (surveyFee !== '275' && surveyFee !== '0') params.set('sf', surveyFee);
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
    try {

    const fmt = (value: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 0;

    const pillW = 140;
    const pillH = 32;
    const pillX = margin;
    const pillY = 28;
    const pillR = 10;
    doc.setFillColor(52, 211, 153);
    doc.roundedRect(pillX, pillY, pillW, pillH, pillR, pillR, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    const netText = 'Net';
    const checkText = 'Check';
    doc.setFont('helvetica', 'bold');
    const netW = doc.getTextWidth(netText);
    doc.setFont('helvetica', 'normal');
    const checkW = doc.getTextWidth(checkText);
    const brandTotalW = netW + checkW;
    const brandStartX = pillX + (pillW - brandTotalW) / 2;
    const brandTextY = pillY + pillH / 2 + 6;
    doc.setFont('helvetica', 'bold');
    doc.text(netText, brandStartX, brandTextY);
    doc.setFont('helvetica', 'normal');
    doc.text(checkText, brandStartX + netW, brandTextY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text((displayResults.netProceeds >= 0 ? 'Net Proceeds Estimate' : 'Bring to Closing Estimate') + '  •  ' + (US_STATES.find(s => s.value === selectedState)?.label || selectedState), pageW - margin, pillY + pillH / 2 + 3, { align: 'right' });

    y = 80;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);

    y += 28;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    if (displayResults.netProceeds >= 0) {
      doc.setTextColor(52, 211, 153);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(fmt(Math.abs(displayResults.netProceeds)), margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(displayResults.netProceeds >= 0 ? 'Estimated Net Proceeds' : 'Estimated Amount to Bring to Closing', margin, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85);
    doc.text(fmt(displayResults.price), pageW - margin, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Sale Price', pageW - margin, y + 16, { align: 'right' });

    y += 40;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);

    y += 16;

    const brokerPct = isSample ? SAMPLE_BROKER : totalCommissionPct;
    const grtPct = isSample ? SAMPLE_GRT : grtRate;

    const deductions: { label: string; amount: number; color: string }[] = [];
    if (displayResults.mortgage > 0) deductions.push({ label: 'Mortgage Payoff', amount: displayResults.mortgage, color: '#94a3b8' });
    if (displayResults.secondMtg > 0) deductions.push({ label: 'Second Mortgage', amount: displayResults.secondMtg, color: '#a1a1aa' });
    if (displayResults.helocAmt > 0) deductions.push({ label: 'HELOC', amount: displayResults.helocAmt, color: '#b4b4bb' });
    if (displayResults.solarAmt > 0) deductions.push({ label: 'Solar Loan', amount: displayResults.solarAmt, color: '#c4c4cc' });
    if (displayResults.commissionAmount > 0) deductions.push({ label: `Commission (${brokerPct}%)`, amount: displayResults.commissionAmount, color: '#60a5fa' });
    if (isNM && displayResults.grtAmount > 0) deductions.push({ label: `NM GRT on Commission (${grtPct}%)`, amount: displayResults.grtAmount, color: '#fbbf24' });
    if (displayResults.titleEscrowAmount > 0) deductions.push({ label: 'Est. Title & Escrow', amount: displayResults.titleEscrowAmount, color: '#f97316' });
    if (displayResults.taxProration > 0) deductions.push({ label: 'Tax Proration', amount: displayResults.taxProration, color: '#a78bfa' });
    if (displayResults.surveyAmount > 0) deductions.push({ label: 'Survey / ILR', amount: displayResults.surveyAmount, color: '#f472b6' });
    if (displayResults.hoaAmount > 0) deductions.push({ label: 'HOA Transfer Fee', amount: displayResults.hoaAmount, color: '#d4c5a0' });
    if (displayResults.septicAmount > 0) deductions.push({ label: 'Septic Inspection', amount: displayResults.septicAmount, color: '#92400e' });
    if (displayResults.wellAmount > 0) deductions.push({ label: 'Well Inspection', amount: displayResults.wellAmount, color: '#3b82f6' });
    if (displayResults.waterBillAmount > 0) deductions.push({ label: 'Final Water Bill', amount: displayResults.waterBillAmount, color: '#06b6d4' });
    if (displayResults.concessionsAmt > 0) deductions.push({ label: 'Seller Concessions', amount: displayResults.concessionsAmt, color: '#fb923c' });
    if (displayResults.repairAmt > 0) deductions.push({ label: 'Repairs', amount: displayResults.repairAmt, color: '#e879f9' });
    const customColors = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'];
    displayResults.customFields.forEach((f, i) => {
      if (f.amount > 0) deductions.push({ label: f.name, amount: f.amount, color: customColors[i % 5] });
    });

    const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);

    const leftColW = (pageW - margin * 2) * 0.52;
    const rightColX = margin + leftColW + 20;
    const rightColW = pageW - margin - rightColX;
    const tableStartY = y;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('CLOSING COSTS', margin, y + 2);
    doc.text('AMOUNT', margin + leftColW, y + 2, { align: 'right' });
    y += 14;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + leftColW, y);
    y += 12;

    const hexToRgb = (hex: string) => ({
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Sale Price', margin, y);
    doc.text(fmt(displayResults.price), margin + leftColW, y, { align: 'right' });
    y += 16;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + leftColW, y);
    y += 12;

    const maxTableH = 340;
    const rowH = Math.min(18, Math.max(13, Math.floor((maxTableH - 80) / Math.max(deductions.length, 1))));
    const fontSize = rowH >= 16 ? 9.5 : 8.5;
    deductions.forEach((item) => {
      const rgb = hexToRgb(item.color);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.circle(margin + 4, y - 3, 3, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(71, 85, 105);
      doc.text(item.label, margin + 14, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(51, 65, 85);
      doc.text(`-${fmt(item.amount)}`, margin + leftColW, y, { align: 'right' });

      y += rowH;
    });

    y += 4;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + leftColW, y);
    y += 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Total Closing Costs', margin, y);
    doc.setTextColor(100, 116, 139);
    doc.text(`-${fmt(totalDeductions)}`, margin + leftColW, y, { align: 'right' });

    y += 20;
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(margin, y - 2, leftColW, 24, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(displayResults.netProceeds >= 0 ? 'Estimated Net Proceeds' : 'Est. Amount to Bring to Closing', margin + 8, y + 14);
    if (displayResults.netProceeds >= 0) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(239, 68, 68);
    }
    doc.text(fmt(Math.abs(displayResults.netProceeds)), margin + leftColW - 8, y + 14, { align: 'right' });

    const sliceLabelMap: Record<string, string> = {
      'Mortgage Payoff': 'Mortgage', 'Second Mortgage': '2nd Mortgage', 'HELOC': 'HELOC', 'Solar Loan': 'Solar Loan',
      [`Commission (${brokerPct}%)`]: 'Commission', [`NM GRT on Commission (${grtPct}%)`]: 'NM GRT',
      'Est. Title & Escrow': 'Title/Escrow', 'Tax Proration': 'Tax Proration', 'Survey / ILR': 'Survey / ILR',
      'HOA Transfer Fee': 'HOA Transfer', 'Septic Inspection': 'Septic Inspection', 'Well Inspection': 'Well Inspection',
      'Final Water Bill': 'Final Water Bill', 'Seller Concessions': 'Concessions', 'Repairs': 'Repairs',
    };
    const donutSlices: { name: string; value: number; color: string }[] = [
      { name: displayResults.netProceeds >= 0 ? 'Net Proceeds' : 'Bring to Closing', value: Math.max(displayResults.netProceeds, 0), color: '#34d399' },
      ...deductions.map(d => ({ name: sliceLabelMap[d.label] || d.label, value: d.amount, color: d.color })),
    ].filter(d => d.value > 0);

    const donutTotal = donutSlices.reduce((s, d) => s + d.value, 0);

    const canvasSize = 400;
    const canvasPad = 20;
    const cCanvas = document.createElement('canvas');
    cCanvas.width = canvasSize;
    cCanvas.height = canvasSize;
    const ctx = cCanvas.getContext('2d')!;
    const cx = canvasSize / 2;
    const cy = canvasSize / 2;
    const outerR = (canvasSize - canvasPad * 2) / 2;
    const innerR = outerR * 0.6;
    const netOuterR = outerR + 4;

    let angleCursor = -Math.PI / 2;
    if (donutTotal <= 0) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = outerR - innerR;
      ctx.beginPath();
      ctx.arc(cx, cy, (outerR + innerR) / 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    donutSlices.forEach((slice) => {
      if (donutTotal <= 0) return;
      const sliceAngle = (slice.value / donutTotal) * Math.PI * 2;
      const startAngle = angleCursor;
      const endAngle = angleCursor + sliceAngle;
      angleCursor = endAngle;

      const isNet = slice.name === 'Net Proceeds' || slice.name === 'Bring to Closing';
      const r = isNet ? netOuterR : outerR;

      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();

      if (isNet) {
        const midAngle = (startAngle + endAngle) / 2;
        const gx0 = cx + Math.cos(midAngle) * innerR;
        const gy0 = cy + Math.sin(midAngle) * innerR;
        const gx1 = cx + Math.cos(midAngle) * r;
        const gy1 = cy + Math.sin(midAngle) * r;
        const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
        grad.addColorStop(0, '#6ee7b7');
        grad.addColorStop(1, '#34d399');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(16, 185, 129, 0.35)';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = slice.color;
        ctx.fill();
      }
    });

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 32px Helvetica, Arial, sans-serif';
    ctx.fillStyle = displayResults.netProceeds >= 0 ? '#10b981' : '#ef4444';
    ctx.fillText(fmt(Math.abs(displayResults.netProceeds)), cx, cy - 8);
    ctx.font = '500 14px Helvetica, Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(displayResults.netProceeds >= 0 ? 'Net Proceeds' : 'Bring to Closing', cx, cy + 18);

    const chartImgData = cCanvas.toDataURL('image/png');
    const chartPdfSize = 180;
    const chartX = rightColX + (rightColW - chartPdfSize) / 2;
    const chartY = tableStartY + 4;
    doc.addImage(chartImgData, 'PNG', chartX, chartY, chartPdfSize, chartPdfSize);

    let legendY = chartY + chartPdfSize + 6;
    const footerLimit = doc.internal.pageSize.getHeight() - 50;
    const legendRowH = donutSlices.length > 12 ? 9 : 11;
    const legendFontSize = donutSlices.length > 12 ? 6 : 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(legendFontSize);
    const legendColW = rightColW / 2;
    donutSlices.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ly = legendY + row * legendRowH;
      if (ly > footerLimit) return;
      const lx = rightColX + col * legendColW;
      const rgb = hexToRgb(item.color);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.circle(lx + 4, ly - 2, 2.5, 'F');
      doc.setTextColor(100, 116, 139);
      doc.text(item.name, lx + 10, ly);
    });

    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 12, pageW - margin, footerY - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('This is an estimate only. Actual figures may vary at closing.', margin, footerY);
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, footerY, { align: 'right' });

    doc.save('NetCheck-Estimate.pdf');
    } catch {
      toast({ title: 'Could not generate PDF', description: 'Please try again.', variant: 'destructive' });
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

    const commissionAmount = price * (totalCommissionPct / 100);
    const grtAmount = isNM ? commissionAmount * (grtRate / 100) : 0;
    const titleEscrowAmount = getEstimatedTitleEscrowFee(price);
    const annualTax = parseCurrency(annualPropertyTax);
    const taxProration = annualTax > 0 ? (closingMonth / 12) * annualTax : 0;
    const hoaAmount = hasHoa ? parseCurrency(hoaFee) : 0;
    const septicAmount = hasSeptic ? parseCurrency(septicFee) : 0;
    const wellAmount = hasWell ? parseCurrency(wellFee) : 0;
    const waterBillAmount = hasWell ? 0 : parseCurrency(waterBill);
    const surveyAmount = parseCurrency(surveyFee);
    const concessionsAmt = parseCurrency(sellerConcessions);
    const repairAmt = parseCurrency(repairCosts);
    const customFieldsTotal = customFields.reduce((sum, f) => sum + parseCurrency(f.amount), 0);
    const totalDeductions = commissionAmount + grtAmount + titleEscrowAmount + taxProration + hoaAmount + septicAmount + wellAmount + waterBillAmount + surveyAmount + concessionsAmt + repairAmt + customFieldsTotal;
    const netProceeds = price - totalLiens - totalDeductions;

    return {
      price,
      mortgage,
      commissionAmount,
      grtAmount,
      titleEscrowAmount,
      taxProration,
      hoaAmount,
      septicAmount,
      wellAmount,
      waterBillAmount,
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
  }, [salePrice, mortgageBalance, listingAgentPct, buyerAgentPct, grtRate, hasAdditionalLiens, secondMortgage, heloc, solarLoan, annualPropertyTax, closingMonth, hasHoa, hoaFee, hasSeptic, septicFee, hasWell, wellFee, waterBill, surveyFee, sellerConcessions, repairCosts, customFields, selectedState]);

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
      { name: displayResults.netProceeds >= 0 ? 'Net Proceeds' : 'Bring to Closing', value: Math.max(displayResults.netProceeds, 0), color: '#34d399' },
      ...(displayResults.mortgage > 0 ? [{ name: 'Mortgage', value: displayResults.mortgage, color: '#94a3b8' }] : []),
      ...(displayResults.secondMtg > 0 ? [{ name: '2nd Mortgage', value: displayResults.secondMtg, color: '#a1a1aa' }] : []),
      ...(displayResults.helocAmt > 0 ? [{ name: 'HELOC', value: displayResults.helocAmt, color: '#b4b4bb' }] : []),
      ...(displayResults.solarAmt > 0 ? [{ name: 'Solar Loan', value: displayResults.solarAmt, color: '#c4c4cc' }] : []),
      { name: 'Commission', value: displayResults.commissionAmount, color: '#60a5fa' },
      ...(isNM && displayResults.grtAmount > 0 ? [{ name: 'NM GRT', value: displayResults.grtAmount, color: '#fbbf24' }] : []),
      { name: 'Title/Escrow', value: displayResults.titleEscrowAmount, color: '#f97316' },
      ...(displayResults.taxProration > 0 ? [{ name: 'Tax Proration', value: displayResults.taxProration, color: '#a78bfa' }] : []),
      ...(displayResults.surveyAmount > 0 ? [{ name: 'Survey / ILR', value: displayResults.surveyAmount, color: '#f472b6' }] : []),
      ...(displayResults.hoaAmount > 0 ? [{ name: 'HOA Transfer', value: displayResults.hoaAmount, color: '#d4c5a0' }] : []),
      ...(displayResults.septicAmount > 0 ? [{ name: 'Septic Inspection', value: displayResults.septicAmount, color: '#92400e' }] : []),
      ...(displayResults.wellAmount > 0 ? [{ name: 'Well Inspection', value: displayResults.wellAmount, color: '#3b82f6' }] : []),
      ...(displayResults.waterBillAmount > 0 ? [{ name: 'Final Water Bill', value: displayResults.waterBillAmount, color: '#06b6d4' }] : []),
      ...(displayResults.concessionsAmt > 0 ? [{ name: 'Concessions', value: displayResults.concessionsAmt, color: '#fb923c' }] : []),
      ...(displayResults.repairAmt > 0 ? [{ name: 'Repairs', value: displayResults.repairAmt, color: '#e879f9' }] : []),
      ...displayResults.customFields.filter(f => f.amount > 0).map((f, i) => ({ name: f.name, value: f.amount, color: ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1'][i % 5] })),
    ].filter(d => d.value > 0);
  }, [displayResults]);

  const netProceedsIndex = useMemo(() => chartData.findIndex(d => d.name === 'Net Proceeds' || d.name === 'Bring to Closing'), [chartData]);

  const renderActiveShape = useCallback((props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
    const isNetProceeds = payload && (payload.name === 'Net Proceeds' || payload.name === 'Bring to Closing');
    const isUserHovering = activeSlice !== null;
    const isDefaultEmphasis = isNetProceeds && !isUserHovering;
    const isNetHovered = isNetProceeds && isUserHovering;
    const glowFilter = isNetHovered
      ? 'drop-shadow(0 4px 16px rgba(16,185,129,0.5)) drop-shadow(0 0 8px rgba(52,211,153,0.3))'
      : isDefaultEmphasis
        ? 'drop-shadow(0 3px 10px rgba(16,185,129,0.35))'
        : isNetProceeds
          ? 'drop-shadow(0 3px 10px rgba(16,185,129,0.35))'
          : 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))';
    return (
      <g className={isNetHovered ? 'net-proceeds-pulse' : ''}>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={isDefaultEmphasis ? innerRadius : innerRadius - 2}
          outerRadius={isDefaultEmphasis ? outerRadius + 4 : outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={isNetProceeds ? 'url(#netProceedsGradient)' : fill}
          style={{ filter: glowFilter, transition: 'filter 0.2s ease-out' }}
        />
      </g>
    );
  }, [activeSlice]);

  const stateBgImage = STATE_BACKGROUNDS[selectedState] || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 relative overflow-hidden">
      <AnimatePresence mode="wait">
        {stateBgImage && (
          <motion.div
            key={selectedState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <img
              src={stateBgImage}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-900/60 to-slate-900/85" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="relative z-10">
      <div className="text-center pt-6 pb-4 px-4">
        <div className="inline-flex items-center justify-center px-8 py-3 rounded-2xl bg-emerald-400 mb-3 shadow-lg">
          <span className="text-3xl font-extrabold text-white tracking-tight font-display">
            Net<span className="font-light">Check</span>
          </span>
        </div>
        <p className={`text-sm ${stateBgImage ? 'text-white/70' : 'text-slate-500'}`}>Estimate what you'll take home at closing.</p>
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
              <CardContent className="p-6 space-y-4">
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
                  <AnimatePresence>
                    {salePrice.replace(/[^0-9]/g, '').length >= 5 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-sm font-medium text-slate-700">Where is the property located?</span>
                          </div>
                          <select
                            value={selectedState}
                            onChange={(e) => {
                              setSelectedState(e.target.value);
                              if (isSample) setIsSample(false);
                              if (showCallout) setShowCallout(false);
                            }}
                            className="w-full text-sm h-9 rounded-lg border border-gray-300 bg-white px-2 py-1 text-slate-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all"
                          >
                            {US_STATES.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                      onChange={(e) => {
                        handleCurrencyInput(e.target.value, setMortgageBalance);
                        if (!defaultCostsApplied.current && e.target.value.replace(/[^0-9]/g, '').length > 0) {
                          defaultCostsApplied.current = true;
                          setSurveyFee("275");
                          setWaterBill("100");
                        }
                      }}
                      onBlur={() => formatCurrencyOnBlur(mortgageBalance, setMortgageBalance)}
                      className="pl-8 text-lg h-12 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    Any second mortgage, HELOC, or solar loan balance?
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

                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-400" />
                      Real Estate Commissions
                    </Label>
                    <div className="flex items-center h-8 rounded-lg border border-slate-200 overflow-hidden shadow-sm focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                      <button
                        type="button"
                        onClick={() => {
                          const newTotal = Math.max(totalCommissionPct - 0.25, 0);
                          setListingAgentPct(newTotal / 2);
                          setBuyerAgentPct(newTotal / 2);
                          setTotalCommissionInput(newTotal.toFixed(2));
                          if (isSample) setIsSample(false);
                          if (showCallout) setShowCallout(false);
                        }}
                        className="w-7 h-full flex items-center justify-center bg-slate-50 hover:bg-emerald-50 border-r border-slate-200 transition-colors"
                      >
                        <Minus className="w-3 h-3 text-slate-400" />
                      </button>
                      <div className="relative w-14">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={totalCommissionInput}
                          onFocus={() => setIsEditingTotalCommission(true)}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                            const parts = cleaned.split('.');
                            const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
                            setTotalCommissionInput(sanitized);
                            const parsed = parseFloat(sanitized);
                            if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                              setListingAgentPct(parsed / 2);
                              setBuyerAgentPct(parsed / 2);
                            }
                            if (isSample) setIsSample(false);
                            if (showCallout) setShowCallout(false);
                          }}
                          onBlur={() => {
                            setIsEditingTotalCommission(false);
                            let parsed = parseFloat(totalCommissionInput);
                            if (isNaN(parsed)) parsed = 6;
                            parsed = Math.min(Math.max(parsed, 0), 10);
                            setListingAgentPct(parsed / 2);
                            setBuyerAgentPct(parsed / 2);
                            setTotalCommissionInput(parsed.toFixed(2));
                          }}
                          className="w-full h-full text-center text-sm font-semibold text-slate-700 bg-transparent outline-none border-none"
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium pr-0.5">%</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newTotal = Math.min(totalCommissionPct + 0.25, 10);
                          setListingAgentPct(newTotal / 2);
                          setBuyerAgentPct(newTotal / 2);
                          setTotalCommissionInput(newTotal.toFixed(2));
                          if (isSample) setIsSample(false);
                          if (showCallout) setShowCallout(false);
                        }}
                        className="w-7 h-full flex items-center justify-center bg-slate-50 hover:bg-emerald-50 border-l border-slate-200 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-center -mb-2">
                    <button
                      type="button"
                      title="View commission breakdown"
                      onClick={() => setCommissionExpanded(!commissionExpanded)}
                      className="p-0.5 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${commissionExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {commissionExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-slate-50/80 border border-slate-100 rounded-lg px-4 py-3 space-y-2.5">
                        {isNM && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Label className="text-xs font-medium text-slate-500">NM GRT Rate</Label>
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
                        )}

                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-slate-500">Listing Agent</Label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal = Math.max(listingAgentPct - 0.25, 0);
                                  setListingAgentPct(newVal);
                                  setTotalCommissionInput((newVal + buyerAgentPct).toFixed(2));
                                  if (isSample) setIsSample(false);
                                  if (showCallout) setShowCallout(false);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                              >
                                <Minus className="w-3 h-3 text-slate-500" />
                              </button>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={listingAgentPct.toFixed(2)}
                                onChange={(e) => {
                                  const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                                  const parsed = parseFloat(cleaned);
                                  if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                                    setListingAgentPct(parsed);
                                    setTotalCommissionInput((parsed + buyerAgentPct).toFixed(2));
                                  }
                                  if (isSample) setIsSample(false);
                                  if (showCallout) setShowCallout(false);
                                }}
                                onBlur={() => {
                                  const clamped = Math.min(Math.max(listingAgentPct, 0), 10);
                                  setListingAgentPct(clamped);
                                  setTotalCommissionInput((clamped + buyerAgentPct).toFixed(2));
                                }}
                                className={`w-[56px] ${INLINE_INPUT_CLASS}`}
                              />
                              <span className="text-xs text-slate-400">%</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal = Math.min(listingAgentPct + 0.25, 10);
                                  setListingAgentPct(newVal);
                                  setTotalCommissionInput((newVal + buyerAgentPct).toFixed(2));
                                  if (isSample) setIsSample(false);
                                  if (showCallout) setShowCallout(false);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                              >
                                <Plus className="w-3 h-3 text-slate-500" />
                              </button>
                              <span className="text-xs text-slate-500 font-medium ml-1 whitespace-nowrap">
                                {formatCurrency(parseCurrency(salePrice) * listingAgentPct / 100)}
                                {isNM && (<><span className="text-slate-400"> + {formatCurrency(parseCurrency(salePrice) * listingAgentPct / 100 * grtRate / 100)}</span><span className="text-[10px] text-slate-400"> GRT</span></>)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-slate-500">Buyer's Agent</Label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal = Math.max(buyerAgentPct - 0.25, 0);
                                  setBuyerAgentPct(newVal);
                                  setTotalCommissionInput((listingAgentPct + newVal).toFixed(2));
                                  if (isSample) setIsSample(false);
                                  if (showCallout) setShowCallout(false);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                              >
                                <Minus className="w-3 h-3 text-slate-500" />
                              </button>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={buyerAgentPct.toFixed(2)}
                                onChange={(e) => {
                                  const cleaned = e.target.value.replace(/[^0-9.]/g, '');
                                  const parsed = parseFloat(cleaned);
                                  if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                                    setBuyerAgentPct(parsed);
                                    setTotalCommissionInput((listingAgentPct + parsed).toFixed(2));
                                  }
                                  if (isSample) setIsSample(false);
                                  if (showCallout) setShowCallout(false);
                                }}
                                onBlur={() => {
                                  const clamped = Math.min(Math.max(buyerAgentPct, 0), 10);
                                  setBuyerAgentPct(clamped);
                                  setTotalCommissionInput((listingAgentPct + clamped).toFixed(2));
                                }}
                                className={`w-[56px] ${INLINE_INPUT_CLASS}`}
                              />
                              <span className="text-xs text-slate-400">%</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal = Math.min(buyerAgentPct + 0.25, 10);
                                  setBuyerAgentPct(newVal);
                                  setTotalCommissionInput((listingAgentPct + newVal).toFixed(2));
                                  if (isSample) setIsSample(false);
                                  if (showCallout) setShowCallout(false);
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                              >
                                <Plus className="w-3 h-3 text-slate-500" />
                              </button>
                              <span className="text-xs text-slate-500 font-medium ml-1 whitespace-nowrap">
                                {formatCurrency(parseCurrency(salePrice) * buyerAgentPct / 100)}
                                {isNM && (<><span className="text-slate-400"> + {formatCurrency(parseCurrency(salePrice) * buyerAgentPct / 100 * grtRate / 100)}</span><span className="text-[10px] text-slate-400"> GRT</span></>)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-2 mt-1 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-600">{isNM ? 'Total Commission + GRT' : 'Total Commission'}</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {formatCurrency(parseCurrency(salePrice) * totalCommissionPct / 100 + (isNM ? parseCurrency(salePrice) * totalCommissionPct / 100 * grtRate / 100 : 0))}
                          </span>
                        </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-slate-50/80 border border-slate-100 rounded-lg px-4 py-3 space-y-2.5">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Property-Specific Costs</p>

                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-500">
                        Homeowners Association (HOA)?
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

                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-500">
                        Septic System?
                      </Label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHasSeptic(true)}
                          className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${hasSeptic ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setHasSeptic(false)}
                          className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${!hasSeptic ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {hasSeptic && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center justify-between pt-1">
                            <Label className="text-xs text-slate-400">
                              Septic Inspection
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                              <input
                                type="text"
                                inputMode="decimal"
                                value={septicFee}
                                onChange={(e) => handleCurrencyInput(e.target.value, setSepticFee)}
                                onBlur={() => formatCurrencyOnBlur(septicFee, setSepticFee)}
                                className={`w-[80px] ${INLINE_CURRENCY_CLASS}`}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-500">
                        Well?
                      </Label>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setHasWell(true);
                            setWaterBill("0");
                          }}
                          className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${hasWell ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHasWell(false);
                            setWaterBill("100");
                          }}
                          className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${!hasWell ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {hasWell && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center justify-between pt-1">
                            <Label className="text-xs text-slate-400">
                              Well Inspection & Water Test
                            </Label>
                            <div className="relative">
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                              <input
                                type="text"
                                inputMode="decimal"
                                value={wellFee}
                                onChange={(e) => handleCurrencyInput(e.target.value, setWellFee)}
                                onBlur={() => formatCurrencyOnBlur(wellFee, setWellFee)}
                                className={`w-[80px] ${INLINE_CURRENCY_CLASS}`}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-500">
                      Final Water Bill
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={waterBill}
                        onChange={(e) => handleCurrencyInput(e.target.value, setWaterBill)}
                        onBlur={() => formatCurrencyOnBlur(waterBill, setWaterBill)}
                        className={`w-[80px] ${INLINE_CURRENCY_CLASS}`}
                        disabled={hasWell}
                      />
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
                </div>

                <div className="bg-slate-50/80 border border-slate-100 rounded-lg px-4 py-3 space-y-2.5">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Tax Proration</p>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-500">
                      Annual Property Tax
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input
                        type="text"
                        inputMode="decimal"
                        value={annualPropertyTax}
                        onChange={(e) => handleCurrencyInput(e.target.value, setAnnualPropertyTax)}
                        onBlur={() => formatCurrencyOnBlur(annualPropertyTax, setAnnualPropertyTax)}
                        className={`w-[100px] ${INLINE_CURRENCY_CLASS}`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-500">
                      Estimated Month of Closing
                    </Label>
                    <select
                      value={closingMonth}
                      onChange={(e) => setClosingMonth(parseInt(e.target.value))}
                      className="text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-lg px-2 py-1.5 shadow-sm transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:shadow-md"
                    >
                      <option value={1}>January</option>
                      <option value={2}>February</option>
                      <option value={3}>March</option>
                      <option value={4}>April</option>
                      <option value={5}>May</option>
                      <option value={6}>June</option>
                      <option value={7}>July</option>
                      <option value={8}>August</option>
                      <option value={9}>September</option>
                      <option value={10}>October</option>
                      <option value={11}>November</option>
                      <option value={12}>December</option>
                    </select>
                  </div>

                  {parseCurrency(annualPropertyTax) > 0 && (
                    <p className="text-[11px] text-slate-400">
                      Seller's share: {closingMonth} of 12 months = {formatCurrency((closingMonth / 12) * parseCurrency(annualPropertyTax))}
                    </p>
                  )}
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
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{displayResults && displayResults.netProceeds < 0 ? 'Estimated Amount to Bring to Closing' : 'Estimated Net Proceeds'}</h3>
                <p className={`text-4xl font-bold transition-all duration-300 ease-out ${!displayResults ? 'text-gray-300' : displayResults.netProceeds >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                  {formatCurrency(Math.abs(displayedNet))}
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
                        <span className="font-semibold">Sample scenario:</span> $400k Albuquerque home — enter your sale price <span className="lg:hidden">above </span>to see your own estimate
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
                        <span className="text-slate-500">Commission ({(isSample ? SAMPLE_BROKER : totalCommissionPct).toFixed(1)}%)</span>
                        <span className="font-medium text-slate-600">-{formatCurrency(displayResults.commissionAmount)}</span>
                      </div>
                      {isNM && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">NM GRT ({(isSample ? SAMPLE_GRT : grtRate).toFixed(4)}%)</span>
                        <span className="font-medium text-slate-600">-{formatCurrency(displayResults.grtAmount)}</span>
                      </div>
                      )}
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
                          <span className="text-slate-500">HOA Transfer</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.hoaAmount)}</span>
                        </div>
                      )}
                      {displayResults.septicAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Septic Inspection</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.septicAmount)}</span>
                        </div>
                      )}
                      {displayResults.wellAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Well Inspection & Water Test</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.wellAmount)}</span>
                        </div>
                      )}
                      {displayResults.waterBillAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Final Water Bill</span>
                          <span className="font-medium text-slate-600">-{formatCurrency(displayResults.waterBillAmount)}</span>
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
                        <span className="font-bold text-slate-800">{displayResults.netProceeds >= 0 ? 'Estimated Net' : 'Bring to Closing'}</span>
                        <span className={`font-bold ${displayResults.netProceeds >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatCurrency(Math.abs(displayResults.netProceeds))}
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
                                const isNet = entry.name === 'Net Proceeds' || entry.name === 'Bring to Closing';
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
                            
                            <text
                              x="50%"
                              y="47%"
                              textAnchor="middle"
                              dominantBaseline="central"
                              className={activeSlice !== null && (chartData[activeSlice]?.name === 'Net Proceeds' || chartData[activeSlice]?.name === 'Bring to Closing') ? 'net-center-text-pulse' : ''}
                              style={{
                                fontSize: activeSlice !== null && chartData[activeSlice]
                                  ? ((chartData[activeSlice].name === 'Net Proceeds' || chartData[activeSlice].name === 'Bring to Closing') ? '28px' : '20px')
                                  : '24px',
                                fontWeight: 700,
                                fill: activeSlice !== null && chartData[activeSlice]
                                  ? ((chartData[activeSlice].name === 'Net Proceeds' || chartData[activeSlice].name === 'Bring to Closing')
                                    ? (displayResults.netProceeds >= 0 ? '#34d399' : '#ef4444')
                                    : chartData[activeSlice].color)
                                  : displayResults.netProceeds >= 0 ? '#34d399' : '#ef4444',
                                transition: 'font-size 0.2s ease-out, fill 0.15s ease-out',
                              }}
                            >
                              {activeSlice !== null && chartData[activeSlice]
                                ? ((chartData[activeSlice].name === 'Net Proceeds' || chartData[activeSlice].name === 'Bring to Closing') ? formatCurrency(Math.abs(displayResults.netProceeds)) : formatCurrency(chartData[activeSlice].value))
                                : formatCurrency(Math.abs(displayResults.netProceeds))}
                            </text>
                            <text
                              x="50%"
                              y="55%"
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{
                                fontSize: '11px',
                                fontWeight: activeSlice !== null && (chartData[activeSlice]?.name === 'Net Proceeds' || chartData[activeSlice]?.name === 'Bring to Closing') ? 600 : 500,
                                fill: '#94a3b8',
                                transition: 'all 0.15s ease-out',
                              }}
                            >
                              {activeSlice !== null && chartData[activeSlice]
                                ? ((chartData[activeSlice].name === 'Net Proceeds' || chartData[activeSlice].name === 'Bring to Closing') ? (displayResults.netProceeds >= 0 ? 'In Your Pocket' : 'Bring to Closing') : chartData[activeSlice].name)
                                : (displayResults.netProceeds >= 0 ? 'Net Proceeds' : 'Bring to Closing')}
                            </text>
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
                <span className="text-xs font-medium text-slate-500">{isSample ? 'Sample Net' : displayResults.netProceeds >= 0 ? 'Est. Net' : 'Bring to Closing'}</span>
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
                  {formatCurrency(Math.abs(displayedNet))}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className={`text-center py-6 text-sm ${stateBgImage ? 'text-white/50' : 'text-slate-400'}`}>
        NetCheck © 2026
      </footer>
      </div>
    </div>
  );
}
