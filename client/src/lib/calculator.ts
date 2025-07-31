export interface CalculationInputs {
  salePrice: number;
  propertyTax: number;
  closingDate: string;
  grtRate: number;
  listingCommission: number;
  buyerCommission: number;
  mortgageBalance: number;
  escrowFee: number;
  titlePolicy: number;
  titleBinder: number;
  waterBill: number;
  survey: number;
  hoaFees: number;
  repairs: number;
  otherExpenses: number;
}

export interface CalculationResults {
  grossPrice: number;
  listingCommissionAmount: number;
  buyerCommissionAmount: number;
  listingGRT: number;
  buyerGRT: number;
  totalCommissions: number;
  totalGRT: number;
  proratedPropertyTax: number;
  titleAndEscrowCosts: number;
  utilitiesAndSurvey: number;
  repairsAndOther: number;
  totalCosts: number;
  netProceeds: number;
  netPercentage: number;
}

export function calculateNetOut(inputs: CalculationInputs): CalculationResults {
  const {
    salePrice,
    propertyTax,
    closingDate,
    grtRate,
    listingCommission,
    buyerCommission,
    mortgageBalance,
    escrowFee,
    titlePolicy,
    titleBinder,
    waterBill,
    survey,
    hoaFees,
    repairs,
    otherExpenses,
  } = inputs;

  // Commission calculations
  const listingCommissionAmount = salePrice * (listingCommission / 100);
  const buyerCommissionAmount = salePrice * (buyerCommission / 100);
  const listingGRT = listingCommissionAmount * (grtRate / 100);
  const buyerGRT = buyerCommissionAmount * (grtRate / 100);
  const totalCommissions = listingCommissionAmount + buyerCommissionAmount;
  const totalGRT = listingGRT + buyerGRT;

  // Property tax proration calculation
  const closingDateObj = new Date(closingDate);
  const yearStart = new Date(closingDateObj.getFullYear(), 0, 1);
  const daysPassed = Math.floor((closingDateObj.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  const proratedPropertyTax = (propertyTax / 365) * daysPassed;

  // Cost groupings
  const titleAndEscrowCosts = escrowFee + titlePolicy + titleBinder;
  const utilitiesAndSurvey = waterBill + survey;
  const repairsAndOther = repairs + otherExpenses + hoaFees;

  // Total costs calculation
  const totalCosts = 
    listingCommissionAmount +
    buyerCommissionAmount +
    listingGRT +
    buyerGRT +
    mortgageBalance +
    proratedPropertyTax +
    titleAndEscrowCosts +
    utilitiesAndSurvey +
    repairsAndOther;

  const netProceeds = salePrice - totalCosts;
  const netPercentage = (netProceeds / salePrice) * 100;

  return {
    grossPrice: salePrice,
    listingCommissionAmount,
    buyerCommissionAmount,
    listingGRT,
    buyerGRT,
    totalCommissions,
    totalGRT,
    proratedPropertyTax,
    titleAndEscrowCosts,
    utilitiesAndSurvey,
    repairsAndOther,
    totalCosts,
    netProceeds,
    netPercentage,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function getAchievementBadge(netPercentage: number): { text: string; icon: string; color: string } {
  if (netPercentage > 35) {
    return { text: 'Exceptional Equity!', icon: 'trophy', color: 'bg-amber-400 text-amber-900' };
  } else if (netPercentage > 25) {
    return { text: 'Great Equity Position!', icon: 'star', color: 'bg-green-400 text-green-900' };
  } else if (netPercentage > 15) {
    return { text: 'Good Equity!', icon: 'thumbs-up', color: 'bg-blue-400 text-blue-900' };
  } else {
    return { text: 'Building Equity', icon: 'info-circle', color: 'bg-orange-400 text-orange-900' };
  }
}

export function generateWhatIfScenarios(basePrice: number, results: CalculationResults, inputs: CalculationInputs) {
  const scenarios = [
    { price: basePrice - 25000, label: 'If -$25K' },
    { price: basePrice, label: 'Current' },
    { price: basePrice + 25000, label: 'If +$25K' },
  ];

  return scenarios.map(scenario => {
    const scenarioInputs = { ...inputs, salePrice: scenario.price };
    const scenarioResults = calculateNetOut(scenarioInputs);
    const difference = scenarioResults.netProceeds - results.netProceeds;
    
    return {
      ...scenario,
      netProceeds: scenarioResults.netProceeds,
      difference,
      percentage: scenarioResults.netPercentage,
    };
  });
}
