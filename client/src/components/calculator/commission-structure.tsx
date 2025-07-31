import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Handshake, Info, Percent, DollarSign } from "lucide-react";
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
          <div className="grid md:grid-cols-2 gap-6">
            {/* Listing Agent Commission */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Listing Agent Commission
              </Label>
              
              {/* Toggle buttons for commission type */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <Button
                  type="button"
                  variant={inputs.listingCommissionType === 'percentage' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onInputChange('listingCommissionType', 'percentage')}
                  className="flex-1 h-8"
                >
                  <Percent className="h-3 w-3 mr-1" />
                  %
                </Button>
                <Button
                  type="button"
                  variant={inputs.listingCommissionType === 'flat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onInputChange('listingCommissionType', 'flat')}
                  className="flex-1 h-8"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Flat
                </Button>
              </div>
              
              <div className="relative">
                {inputs.listingCommissionType === 'percentage' ? (
                  <Input
                    id="listingCommission"
                    type="number"
                    placeholder="3"
                    value={inputs.listingCommission || ''}
                    onChange={(e) => onInputChange('listingCommission', parseFloat(e.target.value) || 0)}
                    step="0.25"
                    max="10"
                    className="pr-8"
                  />
                ) : (
                  <>
                    <span className="absolute left-3 top-3 text-slate-500">$</span>
                    <Input
                      id="listingCommission"
                      type="number"
                      placeholder="12750"
                      value={inputs.listingCommission || ''}
                      onChange={(e) => onInputChange('listingCommission', parseFloat(e.target.value) || 0)}
                      step="100"
                      className="pl-8"
                    />
                  </>
                )}
                {inputs.listingCommissionType === 'percentage' && (
                  <span className="absolute right-3 top-3 text-slate-500">%</span>
                )}
              </div>
            </div>
            
            {/* Buyer's Agent Commission */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-slate-700">
                Buyer's Agent Commission
              </Label>
              
              {/* Toggle buttons for commission type */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                <Button
                  type="button"
                  variant={inputs.buyerCommissionType === 'percentage' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onInputChange('buyerCommissionType', 'percentage')}
                  className="flex-1 h-8"
                >
                  <Percent className="h-3 w-3 mr-1" />
                  %
                </Button>
                <Button
                  type="button"
                  variant={inputs.buyerCommissionType === 'flat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onInputChange('buyerCommissionType', 'flat')}
                  className="flex-1 h-8"
                >
                  <DollarSign className="h-3 w-3 mr-1" />
                  Flat
                </Button>
              </div>
              
              <div className="relative">
                {inputs.buyerCommissionType === 'percentage' ? (
                  <Input
                    id="buyerCommission"
                    type="number"
                    placeholder="3"
                    value={inputs.buyerCommission || ''}
                    onChange={(e) => onInputChange('buyerCommission', parseFloat(e.target.value) || 0)}
                    step="0.25"
                    max="10"
                    className="pr-8"
                  />
                ) : (
                  <>
                    <span className="absolute left-3 top-3 text-slate-500">$</span>
                    <Input
                      id="buyerCommission"
                      type="number"
                      placeholder="12750"
                      value={inputs.buyerCommission || ''}
                      onChange={(e) => onInputChange('buyerCommission', parseFloat(e.target.value) || 0)}
                      step="100"
                      className="pl-8"
                    />
                  </>
                )}
                {inputs.buyerCommissionType === 'percentage' && (
                  <span className="absolute right-3 top-3 text-slate-500">%</span>
                )}
              </div>
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
