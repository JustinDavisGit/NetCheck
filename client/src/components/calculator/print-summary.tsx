import { formatCurrency, formatPercentage, type CalculationInputs, type CalculationResults } from "@/lib/calculator";

interface PrintSummaryProps {
  inputs: CalculationInputs;
  results: CalculationResults | null;
  propertyAddress: string;
  grtRateLabel: string;
}

export function PrintSummary({ inputs, results, propertyAddress, grtRateLabel }: PrintSummaryProps) {
  if (!results) return null;

  const reportDate = new Date().toLocaleDateString();

  return (
    <div className="print-only mt-8 break-page">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Net-Out Analysis</h1>
        <p className="text-slate-600">Professional Real Estate Calculation Report</p>
        <p className="text-sm text-slate-500 mt-2">Generated on {reportDate}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="font-bold mb-4 border-b border-slate-300 pb-2">Property Details</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Address:</strong> {propertyAddress || "Not specified"}</div>
            <div><strong>Sale Price:</strong> {formatCurrency(inputs.salePrice)}</div>
            <div><strong>Closing Date:</strong> {new Date(inputs.closingDate).toLocaleDateString()}</div>
            <div><strong>GRT Rate:</strong> {grtRateLabel}</div>
          </div>
        </div>
        
        <div>
          <h3 className="font-bold mb-4 border-b border-slate-300 pb-2">Commission Structure</h3>
          <div className="space-y-2 text-sm">
            <div><strong>Listing Commission:</strong> {formatPercentage(inputs.listingCommission)}</div>
            <div><strong>Buyer Commission:</strong> {formatPercentage(inputs.buyerCommission)}</div>
            <div><strong>Total Commission:</strong> {formatPercentage(inputs.listingCommission + inputs.buyerCommission)}</div>
            <div><strong>GRT on Commissions:</strong> {formatPercentage(inputs.grtRate)}</div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="font-bold mb-4 border-b border-slate-300 pb-2">Financial Summary</h3>
        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(results.netProceeds)}
            </div>
            <div className="text-slate-600">
              Estimated Net Proceeds ({formatPercentage(results.netPercentage)} of sale price)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold mb-4 border-b border-slate-300 pb-2">Cost Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Listing Commission:</span>
              <span>{formatCurrency(results.listingCommissionAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Buyer Commission:</span>
              <span>{formatCurrency(results.buyerCommissionAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total GRT:</span>
              <span>{formatCurrency(results.totalGRT)}</span>
            </div>
            <div className="flex justify-between">
              <span>Mortgage Balance:</span>
              <span>{formatCurrency(inputs.mortgageBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span>Closing Costs:</span>
              <span>{formatCurrency(results.titleAndEscrowCosts + results.utilitiesAndSurvey + results.repairsAndOther)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-4 border-b border-slate-300 pb-2">Market Position</h3>
          <div className="space-y-2 text-sm">
            <div>Net proceeds represent {formatPercentage(results.netPercentage)} of the sale price</div>
            <div className="text-green-600">
              {results.netPercentage > 25 ? "Above average equity position" : "Building equity position"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
