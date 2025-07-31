import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calculator as CalculatorIcon, Save, Printer, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useCalculation } from "@/hooks/use-calculation";
import { PropertyInfo } from "@/components/calculator/property-info";
import { CommissionStructure } from "@/components/calculator/commission-structure";
import { ClosingCosts } from "@/components/calculator/closing-costs";
import { WhatIfScenarios } from "@/components/calculator/what-if-scenarios";
import { ResultsSummary } from "@/components/calculator/results-summary";
import { CostBreakdown } from "@/components/calculator/cost-breakdown";
import { DetailedBreakdown } from "@/components/calculator/detailed-breakdown";
import { PrintSummary } from "@/components/calculator/print-summary";
import { GamificationElements } from "@/components/calculator/gamification-elements";
import { CelebrationToasts } from "@/components/calculator/celebration-toasts";
import { AddressAutocomplete } from "@/components/calculator/address-autocomplete";
import { NM_GRT_RATES } from "@/lib/grt-rates";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Calculator() {
  const { inputs, results, updateInput } = useCalculation();
  const [propertyAddress, setPropertyAddress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [prevResults, setPrevResults] = useState<typeof results>(null);
  const { toast } = useToast();

  // Track previous results for celebration toasts
  useEffect(() => {
    if (results && JSON.stringify(results) !== JSON.stringify(prevResults)) {
      setPrevResults(results);
    }
  }, [results, prevResults]);

  // Calculate progress based on filled inputs
  const totalFields = Object.keys(inputs).length + 1; // +1 for address
  const filledFields = Object.values(inputs).filter(val => val && val !== 0).length + 
    (propertyAddress ? 1 : 0);
  const progress = Math.min(100, Math.max(15, (filledFields / totalFields) * 100));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const calculationData = {
        propertyAddress,
        ...inputs,
        closingCosts: {
          escrowFee: inputs.escrowFee,
          titlePolicy: inputs.titlePolicy,
          titleBinder: inputs.titleBinder,
          waterBill: inputs.waterBill,
          survey: inputs.survey,
          hoaFees: inputs.hoaFees,
          repairs: inputs.repairs,
          otherExpenses: inputs.otherExpenses,
        },
        calculationResults: results,
      };

      await apiRequest('POST', '/api/calculations', calculationData);
      
      toast({
        title: "Calculation Saved",
        description: "Your net-out calculation has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Unable to save calculation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const grtRateLabel = NM_GRT_RATES.find(rate => 
    Math.abs(rate.value - inputs.grtRate) < 0.001
  )?.label || `${inputs.grtRate}%`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 z-50 no-print">
        <Progress value={progress} className="h-full" />
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 pt-2">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <CalculatorIcon className="text-green-600" />
                Net-Out Calculator
              </h1>
              <p className="text-slate-600 mt-1">Professional real estate closing calculator for New Mexico</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="no-print flex gap-3"
            >
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-slate-600 text-white hover:bg-slate-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Input Forms */}
          <div className="lg:col-span-2 space-y-6">
            <PropertyInfo
              inputs={inputs}
              propertyAddress={propertyAddress}
              onInputChange={updateInput}
              onAddressChange={setPropertyAddress}
            />
            
            <CommissionStructure
              inputs={inputs}
              onInputChange={updateInput}
            />
            
            <ClosingCosts
              inputs={inputs}
              onInputChange={updateInput}
            />
            
            <WhatIfScenarios
              inputs={inputs}
              results={results}
              onInputChange={updateInput}
            />

            {/* Market Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 no-print"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                Market Insights
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-green-800 font-medium mb-1">
                    {results && results.netPercentage > 24 ? "Above Average Equity" : "Building Equity"}
                  </div>
                  <div className="text-green-600">
                    {results ? (
                      results.netPercentage > 24 ? 
                        `Your ${results.netPercentage.toFixed(1)}% net proceeds is above the Albuquerque average of 24%` :
                        `Your ${results.netPercentage.toFixed(1)}% net proceeds is building toward the Albuquerque average of 24%`
                    ) : (
                      "Enter property details to see market comparison"
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-blue-800 font-medium mb-1">Market Positioning</div>
                  <div className="text-blue-600">
                    Properties in this price range typically net $95K - $135K in Albuquerque
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <ResultsSummary results={results} salePrice={inputs.salePrice} />
            <CostBreakdown results={results} />
            <DetailedBreakdown results={results} />
            <GamificationElements 
              results={results} 
              salePrice={inputs.salePrice} 
              progress={progress} 
            />
          </div>
        </div>

        {/* Print Summary */}
        <PrintSummary
          inputs={inputs}
          results={results}
          propertyAddress={propertyAddress}
          grtRateLabel={grtRateLabel}
        />

        {/* Celebration Toasts */}
        <CelebrationToasts 
          results={results} 
          prevResults={prevResults} 
        />
      </main>
    </div>
  );
}
