import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Home, Info } from "lucide-react";
import { motion } from "framer-motion";
import { type CalculationInputs } from "@/lib/calculator";

interface PropertyInfoProps {
  inputs: CalculationInputs;
  propertyAddress: string;
  onInputChange: (key: keyof CalculationInputs, value: number | string) => void;
  onAddressChange: (address: string) => void;
}

export function PropertyInfo({ inputs, propertyAddress, onInputChange, onAddressChange }: PropertyInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Home className="h-6 w-6 text-green-600" />
            Property Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="propertyAddress" className="text-sm font-medium text-slate-700">
                Property Address
              </Label>
              <Input
                id="propertyAddress"
                placeholder="123 Main St, Albuquerque, NM"
                value={propertyAddress}
                onChange={(e) => onAddressChange(e.target.value)}
                className="mt-2"
              />
              <p className="text-xs text-slate-500 mt-1">Address determines GRT location code</p>
            </div>
            
            <div>
              <Label htmlFor="salePrice" className="text-sm font-medium text-slate-700">
                Sale Price
              </Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="salePrice"
                  type="number"
                  placeholder="425000"
                  value={inputs.salePrice || ''}
                  onChange={(e) => onInputChange('salePrice', parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="closingDate" className="text-sm font-medium text-slate-700">
                Closing Date
              </Label>
              <Input
                id="closingDate"
                type="date"
                value={inputs.closingDate}
                onChange={(e) => onInputChange('closingDate', e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="propertyTax" className="text-sm font-medium text-slate-700 flex items-center gap-1">
                      Annual Property Tax
                      <Info className="h-4 w-4 text-slate-400" />
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Will be prorated based on closing date</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="relative mt-2">
                <span className="absolute left-3 top-3 text-slate-500">$</span>
                <Input
                  id="propertyTax"
                  type="number"
                  placeholder="4500"
                  value={inputs.propertyTax || ''}
                  onChange={(e) => onInputChange('propertyTax', parseFloat(e.target.value) || 0)}
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
