/**
 * NetCheck — 50-State Closing Cost Intelligence
 *
 * Sources: State statutes, Federation of Tax Administrators, ALTA rate filings,
 * NAR 2024-2025 member surveys, state bar association requirements.
 *
 * Last verified: March 2026
 *
 * IMPORTANT: Transfer tax rates are STATE-level only. Many counties/cities levy
 * additional transfer taxes (e.g., NYC, Chicago, Pittsburgh, DC, San Francisco).
 * County-level data should be layered on top in a future update.
 *
 * Customary payer fields reflect the MOST COMMON practice in that state.
 * Everything is negotiable — customs vary by region within a state.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ClosingEntity = 'title' | 'attorney' | 'both';

export type CustomaryPayer = 'seller' | 'buyer' | 'split' | 'negotiable';

export interface TransferTax {
  /** State-level rate as a decimal (e.g., 0.01 = 1%). 0 = no state transfer tax */
  rate: number;
  /** How the rate is applied */
  rateType: 'percent_of_sale' | 'per_hundred' | 'per_thousand' | 'flat' | 'tiered' | 'none';
  /** Who customarily pays the state transfer tax */
  customaryPayer: CustomaryPayer;
  /** Notes about the rate or special tiers */
  notes?: string;
  /** True when tiers are graduated/marginal (rate applies to the slice, not the whole amount) */
  graduated?: boolean;
  /** Tiered rates for states with progressive transfer taxes */
  tiers?: { threshold: number; rate: number }[];
}

export interface ServiceTax {
  /** Name of the tax (e.g., "GRT", "GET") */
  name: string;
  /** Full name */
  fullName: string;
  /** Whether it applies to real estate commissions */
  appliesToCommissions: boolean;
  /** Default/common rate as a decimal */
  defaultRate: number;
  /** Whether rate varies by location within the state */
  variesByLocation: boolean;
  /** Notes */
  notes?: string;
}

export interface StateData {
  /** State abbreviation */
  code: string;
  /** Full state name */
  name: string;
  /** Whether closings are handled by title companies, attorneys, or both */
  closingEntity: ClosingEntity;
  /** Transfer tax details */
  transferTax: TransferTax;
  /** Service taxes that apply to real estate transactions (like NM GRT, HI GET) */
  serviceTaxes: ServiceTax[];
  /** Estimated title/escrow fee as a function of sale price */
  estimatedTitleEscrowRate: number;
  /** Typical total seller closing costs as % of sale price (excluding commission) */
  typicalSellerClosingCostPct: number;
  /** Average total commission rate */
  avgCommissionPct: number;
  /** Who customarily pays for owner's title insurance */
  titleInsurancePayer: CustomaryPayer;
  /** Who customarily pays escrow/closing fees */
  escrowFeePayer: CustomaryPayer;
  /** Are attorneys required or customary at closing? */
  attorneyRequired: boolean;
  /** Estimated attorney fee if applicable */
  estimatedAttorneyFee?: number;
  /** Who customarily pays attorney fees (if applicable) */
  attorneyFeePayer?: CustomaryPayer;
  /** Additional seller-specific fees/costs unique to this state */
  additionalSellerCosts: { name: string; estimatedAmount: number | null; estimatedRate?: number; notes: string }[];
  /** Property tax proration method */
  taxProrationMethod: 'calendar_year' | 'fiscal_year' | 'varies';
  /** Fiscal year start month (1-12) if fiscal_year */
  fiscalYearStartMonth?: number;
  /** Helpful note displayed to users */
  userNote?: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Estimate title & escrow fees based on sale price and state rate.
 * This produces a reasonable approximation — actual fees vary by provider.
 */
export function estimateTitleEscrowFee(salePrice: number, state: StateData): number {
  const base = Math.round(salePrice * state.estimatedTitleEscrowRate);
  // Floor/ceiling to keep estimates reasonable
  const min = state.attorneyRequired ? 1200 : 800;
  const max = salePrice * 0.025; // cap at 2.5%
  return Math.max(min, Math.min(base, max));
}

/**
 * Calculate state transfer tax for a given sale price.
 * Does NOT include county/city transfer taxes.
 */
export function calculateTransferTax(salePrice: number, state: StateData): number {
  const { transferTax } = state;

  if (transferTax.rateType === 'none') return 0;

  if (transferTax.rateType === 'tiered' && transferTax.tiers) {
    const tiers = transferTax.tiers;

    if (state.transferTax.graduated) {
      // Graduated / marginal: each tier's rate applies only to the portion
      // of the sale price within that bracket (WA REET, NJ, HI, etc.)
      let tax = 0;
      for (let i = 0; i < tiers.length; i++) {
        const floor = tiers[i].threshold;
        const ceiling = i + 1 < tiers.length ? tiers[i + 1].threshold : Infinity;
        if (salePrice <= floor) break;
        const taxable = Math.min(salePrice, ceiling) - floor;
        tax += taxable * tiers[i].rate;
      }
      return Math.round(tax);
    }

    // Non-graduated: the highest matching tier rate applies to the full amount
    // (CT conveyance tax, NY state transfer tax, etc.)
    let tax = 0;
    for (const tier of tiers) {
      if (salePrice >= tier.threshold) {
        tax = salePrice * tier.rate;
      }
    }
    return Math.round(tax);
  }

  if (transferTax.rateType === 'per_hundred') {
    return Math.round((salePrice / 100) * transferTax.rate);
  }

  if (transferTax.rateType === 'per_thousand') {
    return Math.round((salePrice / 1000) * transferTax.rate);
  }

  // Default: percent of sale
  return Math.round(salePrice * transferTax.rate);
}

/**
 * Get the customary payer label for display
 */
export function payerLabel(payer: CustomaryPayer): string {
  switch (payer) {
    case 'seller': return 'Seller Pays';
    case 'buyer': return 'Buyer Pays';
    case 'split': return 'Split';
    case 'negotiable': return 'Negotiable';
  }
}

// ─── State Data ──────────────────────────────────────────────────────────────

export const STATE_DATA: Record<string, StateData> = {

  AL: {
    code: 'AL',
    name: 'Alabama',
    closingEntity: 'attorney',
    transferTax: { rate: 0.001, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$0.50 per $500 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.0085,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 800,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Alabama is an attorney-close state. An attorney must supervise the closing.',
  },

  AK: {
    code: 'AK',
    name: 'Alaska',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.009,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.3,
    titleInsurancePayer: 'split',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Alaska has no state transfer tax.',
  },

  AZ: {
    code: 'AZ',
    name: 'Arizona',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller', notes: 'Arizona has a flat $2 Affidavit of Value fee' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.0075,
    typicalSellerClosingCostPct: 1.6,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [
      { name: 'Affidavit of Value', estimatedAmount: 2, notes: 'Flat $2 recording fee' },
    ],
    taxProrationMethod: 'calendar_year',
  },

  AR: {
    code: 'AR',
    name: 'Arkansas',
    closingEntity: 'both',
    transferTax: { rate: 3.30, rateType: 'per_thousand', customaryPayer: 'seller', notes: '$3.30 per $1,000 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.009,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  CA: {
    code: 'CA',
    name: 'California',
    closingEntity: 'title',
    transferTax: { rate: 0.0011, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$1.10 per $1,000. Many cities add their own (LA, SF, Oakland, San Jose, etc.)' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.006,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.0,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [
      { name: 'County Transfer Tax', estimatedAmount: null, estimatedRate: 0.0011, notes: 'State rate. Cities like SF add 0.68% and LA adds additional transfer taxes.' },
      { name: 'Natural Hazard Disclosure', estimatedAmount: 125, notes: 'Required seller disclosure report' },
    ],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
    userNote: 'California prorates property tax on a July-June fiscal year. Many cities levy additional transfer taxes above the state rate.',
  },

  CO: {
    code: 'CO',
    name: 'Colorado',
    closingEntity: 'title',
    transferTax: { rate: 0.01, rateType: 'per_hundred', customaryPayer: 'seller', notes: '$0.01 per $100 — one of the lowest in the US' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'seller',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Colorado has a very low transfer tax. In the Denver metro, sellers customarily pay title insurance and closing fees.',
  },

  CT: {
    code: 'CT',
    name: 'Connecticut',
    closingEntity: 'attorney',
    transferTax: {
      rate: 0.0075,
      rateType: 'tiered',
      customaryPayer: 'seller',
      notes: '0.75% base rate; 1.25% on sales over $800K; 2.25% on sales over $2.5M',
      tiers: [
        { threshold: 0, rate: 0.0075 },
        { threshold: 800000, rate: 0.0125 },
        { threshold: 2500000, rate: 0.0225 },
      ],
    },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 2.5,
    avgCommissionPct: 5.2,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 1500,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
    userNote: 'Connecticut requires attorneys at closing. Transfer tax is tiered — higher rates apply to sales above $800K and $2.5M.',
  },

  DE: {
    code: 'DE',
    name: 'Delaware',
    closingEntity: 'attorney',
    transferTax: { rate: 0.035, rateType: 'percent_of_sale', customaryPayer: 'split', notes: '2% state + ~1.5% county typical. Customarily split equally between buyer and seller.' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 3.0,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 1200,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Delaware has one of the highest combined transfer tax rates in the US, typically split between buyer and seller.',
  },

  DC: {
    code: 'DC',
    name: 'District of Columbia',
    closingEntity: 'title',
    transferTax: {
      rate: 0.011,
      rateType: 'tiered',
      customaryPayer: 'split',
      notes: '1.1% on sales under $400K; 1.45% on sales $400K+',
      tiers: [
        { threshold: 0, rate: 0.011 },
        { threshold: 400000, rate: 0.0145 },
      ],
    },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 2.5,
    avgCommissionPct: 5.0,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [
      { name: 'Recordation Tax', estimatedAmount: null, estimatedRate: 0.0115, notes: 'Separate from transfer tax — 1.1% under $400K, 1.45% at $400K+' },
    ],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 10,
    userNote: 'DC has both a transfer tax and a recordation tax — combined can be ~2.9% of sale price. Customarily split.',
  },

  FL: {
    code: 'FL',
    name: 'Florida',
    closingEntity: 'title',
    transferTax: { rate: 0.007, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '70¢ per $100. Miami-Dade has a separate rate.' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.006,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.4,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'seller',
    attorneyRequired: false,
    additionalSellerCosts: [
      { name: 'Documentary Stamp Tax', estimatedAmount: null, estimatedRate: 0.007, notes: 'This IS the transfer tax — $0.70 per $100. Seller pays in most FL counties.' },
    ],
    taxProrationMethod: 'calendar_year',
    userNote: 'In most of Florida, the seller pays for documentary stamps (transfer tax) and owner\'s title insurance. Miami-Dade County has different customs.',
  },

  GA: {
    code: 'GA',
    name: 'Georgia',
    closingEntity: 'attorney',
    transferTax: { rate: 1.00, rateType: 'per_thousand', customaryPayer: 'seller', notes: '$1.00 per $1,000 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.6,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'buyer',
    attorneyRequired: true,
    estimatedAttorneyFee: 1000,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Georgia requires an attorney to close. Transfer tax is relatively low at $1 per $1,000.',
  },

  HI: {
    code: 'HI',
    name: 'Hawaii',
    closingEntity: 'title',
    transferTax: {
      rate: 0.001,
      rateType: 'tiered',
      customaryPayer: 'seller',
      notes: 'Conveyance tax ranges from $0.10/$100 (under $600K) up to $1.25/$100 (over $10M)',
      graduated: true,
      tiers: [
        { threshold: 0, rate: 0.001 },
        { threshold: 600000, rate: 0.002 },
        { threshold: 1000000, rate: 0.003 },
        { threshold: 2000000, rate: 0.005 },
        { threshold: 4000000, rate: 0.007 },
        { threshold: 6000000, rate: 0.009 },
        { threshold: 10000000, rate: 0.0125 },
      ],
    },
    serviceTaxes: [
      {
        name: 'GET',
        fullName: 'General Excise Tax',
        appliesToCommissions: true,
        defaultRate: 0.04712,
        variesByLocation: true,
        notes: 'Hawaii\'s GET applies to real estate commissions. Rate is 4% + 0.5% county surcharge (Oahu). Similar to NM\'s GRT.',
      },
    ],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.0,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [
      { name: 'HARPTA Withholding', estimatedAmount: null, estimatedRate: 0.0725, notes: 'Hawaii withholding tax on non-resident sellers — 7.25% of sale price, refundable after filing' },
    ],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
    userNote: 'Hawaii\'s GET (General Excise Tax) applies to agent commissions — similar to NM\'s GRT. Conveyance tax is tiered based on sale price.',
  },

  ID: {
    code: 'ID',
    name: 'Idaho',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.4,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Idaho has no state transfer tax.',
  },

  IL: {
    code: 'IL',
    name: 'Illinois',
    closingEntity: 'both',
    transferTax: { rate: 0.001, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$0.50 per $500. Chicago adds $5.25 per $500 and Cook County adds $0.25 per $500.' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.2,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    estimatedAttorneyFee: 1000,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [
      { name: 'Chicago Transfer Tax', estimatedAmount: null, estimatedRate: 0.0105, notes: 'City of Chicago levies $10.50 per $1,000 in addition to state and county taxes' },
    ],
    taxProrationMethod: 'calendar_year',
    userNote: 'Attorneys are customary (not required) in Illinois. Chicago has very high combined transfer taxes.',
  },

  IN: {
    code: 'IN',
    name: 'Indiana',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.6,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Indiana has no state transfer tax.',
  },

  IA: {
    code: 'IA',
    name: 'Iowa',
    closingEntity: 'both',
    transferTax: { rate: 0.0016, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$0.80 per $500 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.6,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
  },

  KS: {
    code: 'KS',
    name: 'Kansas',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.6,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  KY: {
    code: 'KY',
    name: 'Kentucky',
    closingEntity: 'attorney',
    transferTax: { rate: 0.001, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$0.50 per $500 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 800,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  LA: {
    code: 'LA',
    name: 'Louisiana',
    closingEntity: 'attorney',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.009,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'seller',
    attorneyRequired: true,
    estimatedAttorneyFee: 1000,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Louisiana is an attorney-close state with no transfer tax. Uses civil law system (not common law).',
  },

  ME: {
    code: 'ME',
    name: 'Maine',
    closingEntity: 'attorney',
    transferTax: { rate: 0.0044, rateType: 'percent_of_sale', customaryPayer: 'split', notes: '$2.20 per $500 — split between buyer and seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 1000,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
  },

  MD: {
    code: 'MD',
    name: 'Maryland',
    closingEntity: 'both',
    transferTax: { rate: 0.005, rateType: 'percent_of_sale', customaryPayer: 'split', notes: '0.5% state transfer tax + county transfer taxes (typically 0.5-1.5% additional). Split is customary.' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.5,
    avgCommissionPct: 5.2,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [
      { name: 'County Transfer Tax', estimatedAmount: null, estimatedRate: 0.01, notes: 'Varies by county — typically 0.5% to 1.5% additional' },
    ],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
  },

  MA: {
    code: 'MA',
    name: 'Massachusetts',
    closingEntity: 'attorney',
    transferTax: { rate: 0.00456, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$2.28 per $500 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.0,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 1500,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
  },

  MI: {
    code: 'MI',
    name: 'Michigan',
    closingEntity: 'title',
    transferTax: { rate: 0.0086, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: 'State ($3.75/$500) + County ($0.55/$500) = $8.60 per $1,000' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.2,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  MN: {
    code: 'MN',
    name: 'Minnesota',
    closingEntity: 'title',
    transferTax: { rate: 0.0033, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: 'Deed tax: $1.65 per $500 of net consideration' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.4,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  MS: {
    code: 'MS',
    name: 'Mississippi',
    closingEntity: 'attorney',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.009,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.6,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 800,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  MO: {
    code: 'MO',
    name: 'Missouri',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  MT: {
    code: 'MT',
    name: 'Montana',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.009,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  NE: {
    code: 'NE',
    name: 'Nebraska',
    closingEntity: 'title',
    transferTax: { rate: 2.25, rateType: 'per_thousand', customaryPayer: 'seller', notes: '$2.25 per $1,000 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  NV: {
    code: 'NV',
    name: 'Nevada',
    closingEntity: 'title',
    transferTax: { rate: 0.00390, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$1.95 per $500 of value. Clark County (Las Vegas) adds $0.60 per $500.' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.2,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
  },

  NH: {
    code: 'NH',
    name: 'New Hampshire',
    closingEntity: 'attorney',
    transferTax: { rate: 0.015, rateType: 'percent_of_sale', customaryPayer: 'split', notes: '$7.50 per $1,000 paid by each side (buyer and seller each pay 0.75%)' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.3,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 1200,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 4,
    userNote: 'NH transfer tax is split equally — seller pays 0.75% and buyer pays 0.75%.',
  },

  NJ: {
    code: 'NJ',
    name: 'New Jersey',
    closingEntity: 'attorney',
    transferTax: {
      rate: 0.004,
      rateType: 'tiered',
      customaryPayer: 'seller',
      notes: 'Realty Transfer Fee varies by sale price. Additional 1% "mansion tax" on sales over $1M.',
      graduated: true,
      tiers: [
        { threshold: 0, rate: 0.002 },
        { threshold: 150000, rate: 0.00325 },
        { threshold: 200000, rate: 0.00425 },
        { threshold: 350000, rate: 0.00575 },
        { threshold: 550000, rate: 0.006 },
        { threshold: 850000, rate: 0.007 },
        { threshold: 1000000, rate: 0.0085 },
      ],
    },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.5,
    avgCommissionPct: 5.2,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 1500,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [
      { name: 'Mansion Tax (if >$1M)', estimatedAmount: null, estimatedRate: 0.01, notes: '1% additional fee on sales over $1 million' },
    ],
    taxProrationMethod: 'calendar_year',
    userNote: 'New Jersey transfer taxes are tiered and seller-paid. Sales over $1M trigger an additional 1% mansion tax.',
  },

  NM: {
    code: 'NM',
    name: 'New Mexico',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [
      {
        name: 'GRT',
        fullName: 'Gross Receipts Tax',
        appliesToCommissions: true,
        defaultRate: 0.07625,
        variesByLocation: true,
        notes: 'NM\'s GRT applies to agent commissions. Rate varies by location (5.375% rural to 8.6875% Santa Fe).',
      },
    ],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 6.0,
    titleInsurancePayer: 'split',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [
      { name: 'Survey / ILR', estimatedAmount: 275, notes: 'Improvement Location Report — customary in NM' },
      { name: 'Final Water Bill', estimatedAmount: 100, notes: 'Seller responsible for final water bill at closing' },
    ],
    taxProrationMethod: 'calendar_year',
    userNote: 'New Mexico has no transfer tax, but GRT (Gross Receipts Tax) applies to agent commissions. Rate varies by city.',
  },

  NY: {
    code: 'NY',
    name: 'New York',
    closingEntity: 'attorney',
    transferTax: {
      rate: 0.004,
      rateType: 'tiered',
      customaryPayer: 'seller',
      notes: 'State transfer tax: 0.4% (0.65% for $3M+ in NYC). NYC also has its own transfer tax of ~1-1.425%.',
      tiers: [
        { threshold: 0, rate: 0.004 },
        { threshold: 3000000, rate: 0.0065 },
      ],
    },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.5,
    avgCommissionPct: 5.0,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 2500,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [
      { name: 'NYC Transfer Tax (if NYC)', estimatedAmount: null, estimatedRate: 0.01425, notes: '1% under $500K, 1.425% at $500K+. Only in NYC.' },
      { name: 'Mansion Tax (if >$1M)', estimatedAmount: null, estimatedRate: 0.01, notes: '1% on sales at or above $1M. Buyer pays but affects negotiation.' },
    ],
    taxProrationMethod: 'calendar_year',
    userNote: 'New York has high closing costs. NYC sellers face combined transfer taxes of ~2%+. Attorney representation is mandatory.',
  },

  NC: {
    code: 'NC',
    name: 'North Carolina',
    closingEntity: 'attorney',
    transferTax: { rate: 0.002, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$1 per $500 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.4,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 800,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  ND: {
    code: 'ND',
    name: 'North Dakota',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.009,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  OH: {
    code: 'OH',
    name: 'Ohio',
    closingEntity: 'title',
    transferTax: { rate: 0.004, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: 'State: $1 per $1,000. Counties add $1-3 per $1,000 (total typically ~$4 per $1,000).' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.6,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  OK: {
    code: 'OK',
    name: 'Oklahoma',
    closingEntity: 'title',
    transferTax: { rate: 0.00075, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$0.75 per $1,000 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.6,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  OR: {
    code: 'OR',
    name: 'Oregon',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller', notes: 'No state transfer tax. Some counties (Washington County) levy local transfer taxes.' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 1.6,
    avgCommissionPct: 5.2,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
    userNote: 'Most Oregon counties have no transfer tax. Portland area may have additional local taxes.',
  },

  PA: {
    code: 'PA',
    name: 'Pennsylvania',
    closingEntity: 'both',
    transferTax: { rate: 0.02, rateType: 'percent_of_sale', customaryPayer: 'split', notes: '1% state + 1% local = 2% total. Customarily split between buyer and seller. Pittsburgh is 2% state + 2% local = 4%.' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.5,
    avgCommissionPct: 5.4,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
    userNote: 'Pennsylvania transfer tax is typically 2% (1% state + 1% local), split between buyer and seller. Pittsburgh is 4% total.',
  },

  RI: {
    code: 'RI',
    name: 'Rhode Island',
    closingEntity: 'attorney',
    transferTax: { rate: 0.0046, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$2.30 per $500 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.2,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 1200,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
  },

  SC: {
    code: 'SC',
    name: 'South Carolina',
    closingEntity: 'attorney',
    transferTax: { rate: 0.00370, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: 'Deed recording fee: $1.85 per $500 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'buyer',
    attorneyRequired: true,
    estimatedAttorneyFee: 1000,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  SD: {
    code: 'SD',
    name: 'South Dakota',
    closingEntity: 'title',
    transferTax: { rate: 0.001, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$0.50 per $500 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.009,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  TN: {
    code: 'TN',
    name: 'Tennessee',
    closingEntity: 'both',
    transferTax: { rate: 0.0037, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$0.37 per $100 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.4,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  TX: {
    code: 'TX',
    name: 'Texas',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.009,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [
      { name: 'Survey', estimatedAmount: 400, notes: 'Surveys are customary in Texas and typically seller-paid' },
    ],
    taxProrationMethod: 'calendar_year',
    userNote: 'Texas has no state income tax and no transfer tax. Title insurance rates are set by the state (TLTA rates). Seller typically pays for owner\'s title policy.',
  },

  UT: {
    code: 'UT',
    name: 'Utah',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.3,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Utah has no transfer tax.',
  },

  VT: {
    code: 'VT',
    name: 'Vermont',
    closingEntity: 'attorney',
    transferTax: { rate: 0.0125, rateType: 'percent_of_sale', customaryPayer: 'split', notes: '1.25% total — split 0.5% seller / 0.75% buyer by custom' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.4,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 1200,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
  },

  VA: {
    code: 'VA',
    name: 'Virginia',
    closingEntity: 'both',
    transferTax: { rate: 0.0025, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: 'State grantor tax: $1 per $1,000. Counties may add additional taxes (typically $0.33-$1.50 per $1,000).' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.2,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [
      { name: 'Congestion Relief Fee (NoVA)', estimatedAmount: null, estimatedRate: 0.0015, notes: 'Additional $0.15 per $100 in Northern Virginia (Hampton Roads, NoVA regions)' },
    ],
    taxProrationMethod: 'calendar_year',
  },

  WA: {
    code: 'WA',
    name: 'Washington',
    closingEntity: 'title',
    transferTax: {
      rate: 0.011,
      rateType: 'tiered',
      customaryPayer: 'seller',
      notes: 'Real Estate Excise Tax (REET) is tiered. 1.1% on first $525K, increasing above that.',
      graduated: true,
      tiers: [
        { threshold: 0, rate: 0.011 },
        { threshold: 525000, rate: 0.0128 },
        { threshold: 1525000, rate: 0.0275 },
        { threshold: 3025000, rate: 0.03 },
      ],
    },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.006,
    typicalSellerClosingCostPct: 2.5,
    avgCommissionPct: 5.2,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Washington\'s Real Estate Excise Tax (REET) is one of the highest in the US — tiered from 1.1% to 3% based on sale price.',
  },

  WV: {
    code: 'WV',
    name: 'West Virginia',
    closingEntity: 'attorney',
    transferTax: { rate: 0.0033, rateType: 'percent_of_sale', customaryPayer: 'split', notes: '$1.10 state + $0.55 county per $500 — typically split' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.008,
    typicalSellerClosingCostPct: 2.0,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'buyer',
    escrowFeePayer: 'split',
    attorneyRequired: true,
    estimatedAttorneyFee: 800,
    attorneyFeePayer: 'buyer',
    additionalSellerCosts: [],
    taxProrationMethod: 'fiscal_year',
    fiscalYearStartMonth: 7,
  },

  WI: {
    code: 'WI',
    name: 'Wisconsin',
    closingEntity: 'title',
    transferTax: { rate: 0.003, rateType: 'percent_of_sale', customaryPayer: 'seller', notes: '$3 per $1,000 of value' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.007,
    typicalSellerClosingCostPct: 1.8,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
  },

  WY: {
    code: 'WY',
    name: 'Wyoming',
    closingEntity: 'title',
    transferTax: { rate: 0, rateType: 'none', customaryPayer: 'seller' },
    serviceTaxes: [],
    estimatedTitleEscrowRate: 0.009,
    typicalSellerClosingCostPct: 1.5,
    avgCommissionPct: 5.5,
    titleInsurancePayer: 'seller',
    escrowFeePayer: 'split',
    attorneyRequired: false,
    additionalSellerCosts: [],
    taxProrationMethod: 'calendar_year',
    userNote: 'Wyoming has no state transfer tax and no state income tax.',
  },

};

// ─── Lookup Helpers ──────────────────────────────────────────────────────────

/** Get state data by abbreviation */
export function getStateData(stateCode: string): StateData | undefined {
  return STATE_DATA[stateCode.toUpperCase()];
}

/** Get all states as sorted array */
export function getAllStates(): StateData[] {
  return Object.values(STATE_DATA).sort((a, b) => a.name.localeCompare(b.name));
}

/** States with no transfer tax */
export function getNoTransferTaxStates(): string[] {
  return Object.values(STATE_DATA)
    .filter(s => s.transferTax.rateType === 'none')
    .map(s => s.code);
}

/** States requiring attorney at closing */
export function getAttorneyStates(): string[] {
  return Object.values(STATE_DATA)
    .filter(s => s.attorneyRequired)
    .map(s => s.code);
}

/** States with service taxes on commissions (like NM GRT, HI GET) */
export function getServiceTaxStates(): string[] {
  return Object.values(STATE_DATA)
    .filter(s => s.serviceTaxes.some(t => t.appliesToCommissions))
    .map(s => s.code);
}

/**
 * Calculate total estimated seller closing costs for a state.
 * Returns an itemized breakdown.
 */
export function estimateSellerClosingCosts(
  salePrice: number,
  stateCode: string,
  options?: {
    commissionPct?: number;
    mortgageBalance?: number;
  }
): {
  transferTax: number;
  titleEscrow: number;
  commission: number;
  serviceTax: number;
  attorneyFee: number;
  additionalCosts: { name: string; amount: number }[];
  totalClosingCosts: number;
  netProceeds: number;
} {
  const state = getStateData(stateCode);
  if (!state) throw new Error(`Unknown state: ${stateCode}`);

  const commPct = options?.commissionPct ?? state.avgCommissionPct;
  const mortgage = options?.mortgageBalance ?? 0;

  const transferTax = calculateTransferTax(salePrice, state);
  const titleEscrow = estimateTitleEscrowFee(salePrice, state);
  const commission = Math.round(salePrice * (commPct / 100));

  let serviceTax = 0;
  for (const st of state.serviceTaxes) {
    if (st.appliesToCommissions) {
      serviceTax += Math.round(commission * st.defaultRate);
    }
  }

  const attorneyFee = state.attorneyRequired ? (state.estimatedAttorneyFee ?? 1000) : 0;

  const additionalCosts = state.additionalSellerCosts
    .filter(c => c.estimatedAmount !== null)
    .map(c => ({ name: c.name, amount: c.estimatedAmount! }));

  const additionalTotal = additionalCosts.reduce((sum, c) => sum + c.amount, 0);

  const totalClosingCosts = transferTax + titleEscrow + commission + serviceTax + attorneyFee + additionalTotal;
  const netProceeds = salePrice - mortgage - totalClosingCosts;

  return {
    transferTax,
    titleEscrow,
    commission,
    serviceTax,
    attorneyFee,
    additionalCosts,
    totalClosingCosts,
    netProceeds,
  };
}
