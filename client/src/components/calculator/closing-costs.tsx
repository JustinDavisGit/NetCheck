import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { type CalculationInputs } from "@/lib/calculator";

interface ClosingCostsProps {
  inputs: CalculationInputs;
  onInputChange: (key: keyof CalculationInputs, value: number | string) => void;
}

export function ClosingCosts({ inputs, onInputChange }: ClosingCostsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <DollarSign className="h-6 w-6 text-red-600" />
            Closing Costs & Fees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mortgageBalance" className="text-sm font-medium text-slate-700">
                Outstanding Mortgage Balance
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="mortgageBalance"
                  type="number"
                  placeholder="285000"
                  value={inputs.mortgageBalance || ''}
                  onChange={(e) => onInputChange('mortgageBalance', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="escrowFee" className="text-sm font-medium text-slate-700">
                Escrow Fee
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="escrowFee"
                  type="number"
                  placeholder="800"
                  value={inputs.escrowFee || ''}
                  onChange={(e) => onInputChange('escrowFee', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="titlePolicy" className="text-sm font-medium text-slate-700">
                Owner's Title Policy
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="titlePolicy"
                  type="number"
                  placeholder="1200"
                  value={inputs.titlePolicy || ''}
                  onChange={(e) => onInputChange('titlePolicy', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="titleBinder" className="text-sm font-medium text-slate-700">
                NM Title Binder
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="titleBinder"
                  type="number"
                  placeholder="300"
                  value={inputs.titleBinder || ''}
                  onChange={(e) => onInputChange('titleBinder', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="waterBill" className="text-sm font-medium text-slate-700">
                Final Water Bill
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="waterBill"
                  type="number"
                  placeholder="150"
                  value={inputs.waterBill || ''}
                  onChange={(e) => onInputChange('waterBill', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="survey" className="text-sm font-medium text-slate-700">
                Survey
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="survey"
                  type="number"
                  placeholder="265"
                  value={inputs.survey || ''}
                  onChange={(e) => onInputChange('survey', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="hoaFees" className="text-sm font-medium text-slate-700">
                HOA Fees
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="hoaFees"
                  type="number"
                  placeholder="0"
                  value={inputs.hoaFees || ''}
                  onChange={(e) => onInputChange('hoaFees', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="repairs" className="text-sm font-medium text-slate-700">
                Repairs & Staging
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="repairs"
                  type="number"
                  placeholder="2500"
                  value={inputs.repairs || ''}
                  onChange={(e) => onInputChange('repairs', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <Label htmlFor="otherExpenses" className="text-sm font-medium text-slate-700">
                Other Seller Expenses
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="otherExpenses"
                  type="number"
                  placeholder="500"
                  value={inputs.otherExpenses || ''}
                  onChange={(e) => onInputChange('otherExpenses', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
