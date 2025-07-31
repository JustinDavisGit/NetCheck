import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { formatCurrency, type CalculationResults } from "@/lib/calculator";

interface DetailedBreakdownProps {
  results: CalculationResults | null;
  inputs?: {
    listingCommission: number;
    listingCommissionType: 'percentage' | 'flat';
    buyerCommission: number;
    buyerCommissionType: 'percentage' | 'flat';
    salePrice: number;
  };
}

export function DetailedBreakdown({ results, inputs }: DetailedBreakdownProps) {
  if (!results) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Detailed Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 py-8">
            Enter details to see calculations
          </div>
        </CardContent>
      </Card>
    );
  }

  const mortgageBalance = results.totalCosts - results.totalCommissions - results.totalGRT - results.proratedPropertyTax - results.titleAndEscrowCosts - results.utilitiesAndSurvey - results.repairsAndOther;

  // Format commission labels to show type
  const formatCommissionLabel = (baseLabel: string, amount: number, commissionType: 'percentage' | 'flat', commissionValue: number, salePrice: number) => {
    if (commissionType === 'flat') {
      return `${baseLabel} (${formatCurrency(commissionValue)} flat fee)`;
    } else {
      return `${baseLabel} (${commissionValue}% of sale price)`;
    }
  };

  const listingLabel = inputs ? formatCommissionLabel(
    "Listing Broker Commission", 
    results.listingCommissionAmount, 
    inputs.listingCommissionType, 
    inputs.listingCommission, 
    inputs.salePrice
  ) : "Listing Broker Commission";

  const buyerLabel = inputs ? formatCommissionLabel(
    "Buyer's Broker Commission", 
    results.buyerCommissionAmount, 
    inputs.buyerCommissionType, 
    inputs.buyerCommission, 
    inputs.salePrice
  ) : "Buyer's Broker Commission";

  const lineItems = [
    { label: listingLabel, amount: -results.listingCommissionAmount, color: "text-red-600", category: "commission" },
    { label: "GRT on Listing Commission", amount: -results.listingGRT, color: "text-orange-600", category: "tax" },
    { label: buyerLabel, amount: -results.buyerCommissionAmount, color: "text-red-600", category: "commission" },
    { label: "GRT on Buyer's Commission", amount: -results.buyerGRT, color: "text-orange-600", category: "tax" },
    { label: "Outstanding Mortgage Balance", amount: -mortgageBalance, color: "text-blue-600", category: "mortgage" },
    { label: "Prorated Property Tax", amount: -results.proratedPropertyTax, color: "text-purple-600", category: "tax" },
    { label: "Escrow Fee", amount: -(results.titleAndEscrowCosts * 0.4), color: "text-slate-600", category: "closing" },
    { label: "Owner's Title Policy", amount: -(results.titleAndEscrowCosts * 0.5), color: "text-slate-600", category: "closing" },
    { label: "NM Title Binder", amount: -(results.titleAndEscrowCosts * 0.1), color: "text-slate-600", category: "closing" },
    { label: "Final Water Bill", amount: -(results.utilitiesAndSurvey * 0.57), color: "text-cyan-600", category: "utilities" },
    { label: "Survey", amount: -(results.utilitiesAndSurvey * 0.43), color: "text-cyan-600", category: "utilities" },
    { label: "Repairs & Other Expenses", amount: -results.repairsAndOther, color: "text-yellow-600", category: "other" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <Card className="shadow-sm border-slate-200 print-section">
        <CardHeader>
          <CardTitle className="text-lg">Detailed Calculations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-medium">Gross Sale Price</span>
              <span className="text-green-600 font-bold">{formatCurrency(results.grossPrice)}</span>
            </div>
            
            <div className="space-y-2 text-slate-600">
              {lineItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex justify-between"
                >
                  <span className="pl-4">{item.label}</span>
                  <span className={item.color}>{formatCurrency(item.amount)}</span>
                </motion.div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center py-3 border-t-2 border-slate-200 font-bold text-lg">
              <span>Net Proceeds</span>
              <span className="text-green-600">{formatCurrency(results.netProceeds)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
