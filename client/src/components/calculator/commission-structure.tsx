import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Handshake, Info } from "lucide-react";
import { motion } from "framer-motion";
import { NM_GRT_RATES } from "@/lib/grt-rates";
import { type CalculationInputs } from "@/lib/calculator";

interface CommissionStructureProps {
  inputs: CalculationInputs;
  onInputChange: (key: keyof CalculationInputs, value: number | string) => void;
}

export function CommissionStructure({ inputs, onInputChange }: CommissionStructureProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Handshake className="h-6 w-6 text-amber-500" />
            Commission Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="listingCommission" className="text-sm font-medium text-slate-700">
                Listing Agent Commission (%)
              </Label>
              <Input
                id="listingCommission"
                type="number"
                placeholder="3"
                value={inputs.listingCommission || ''}
                onChange={(e) => onInputChange('listingCommission', parseFloat(e.target.value) || 0)}
                step="0.25"
                max="10"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="buyerCommission" className="text-sm font-medium text-slate-700">
                Buyer's Agent Commission (%)
              </Label>
              <Input
                id="buyerCommission"
                type="number"
                placeholder="3"
                value={inputs.buyerCommission || ''}
                onChange={(e) => onInputChange('buyerCommission', parseFloat(e.target.value) || 0)}
                step="0.25"
                max="10"
                className="mt-2"
              />
            </div>
            
            <div className="md:col-span-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="grtRate" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      GRT Location Code
                      <Info className="h-4 w-4 text-slate-400" />
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Auto-detected from property address. NM rates: 5.375% - 8.6875%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Select 
                value={inputs.grtRate.toString()}
                onValueChange={(value) => onInputChange('grtRate', parseFloat(value))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select GRT rate" />
                </SelectTrigger>
                <SelectContent>
                  {NM_GRT_RATES.map((rate) => (
                    <SelectItem key={rate.value} value={rate.value.toString()}>
                      {rate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
