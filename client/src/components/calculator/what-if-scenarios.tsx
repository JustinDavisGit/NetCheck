import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sliders } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, generateWhatIfScenarios, type CalculationInputs, type CalculationResults } from "@/lib/calculator";

interface WhatIfScenariosProps {
  inputs: CalculationInputs;
  results: CalculationResults | null;
  onInputChange: (key: keyof CalculationInputs, value: number | string) => void;
}

export function WhatIfScenarios({ inputs, results, onInputChange }: WhatIfScenariosProps) {
  const scenarios = results ? generateWhatIfScenarios(inputs.salePrice, results, inputs) : [];

  const handlePriceChange = (values: number[]) => {
    onInputChange('salePrice', values[0]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="no-print"
    >
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Sliders className="h-6 w-6 text-amber-500" />
            What If Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-4 block">
                Adjust Sale Price
              </Label>
              <Slider
                value={[inputs.salePrice]}
                onValueChange={handlePriceChange}
                min={300000}
                max={600000}
                step={5000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>$300K</span>
                <span className="font-medium text-slate-700">
                  {formatCurrency(inputs.salePrice).replace('$', '$').replace(',000', 'K')}
                </span>
                <span>$600K</span>
              </div>
            </div>
            
            {scenarios.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-2">Price Comparison Impact:</div>
                <div className="text-sm space-y-1">
                  {scenarios.map((scenario, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{scenario.label}:</span>
                      <span className={`font-medium ${
                        scenario.difference > 0 ? 'text-green-600' :
                        scenario.difference < 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(scenario.netProceeds)}
                        {scenario.difference !== 0 && (
                          <span className="ml-1">
                            ({scenario.difference > 0 ? '+' : ''}{formatCurrency(scenario.difference)})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
