import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, type CalculationResults } from "@/lib/calculator";

interface CostBreakdownProps {
  results: CalculationResults | null;
}

export function CostBreakdown({ results }: CostBreakdownProps) {
  if (!results) {
    return (
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="h-5 w-5 text-amber-500" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 py-8">
            Enter details to see breakdown
          </div>
        </CardContent>
      </Card>
    );
  }

  const breakdown = [
    {
      label: "Net Proceeds",
      amount: results.netProceeds,
      color: "bg-green-600",
      percentage: results.netPercentage,
    },
    {
      label: "Mortgage Payoff",
      amount: results.grossPrice - results.netProceeds - results.totalCommissions - results.totalGRT - (results.totalCosts - results.grossPrice + results.netProceeds),
      color: "bg-blue-500",
      percentage: ((results.grossPrice - results.netProceeds - results.totalCommissions - results.totalGRT - (results.totalCosts - results.grossPrice + results.netProceeds)) / results.grossPrice) * 100,
    },
    {
      label: "Commissions",
      amount: results.totalCommissions,
      color: "bg-amber-500",
      percentage: (results.totalCommissions / results.grossPrice) * 100,
    },
    {
      label: "Other Costs",
      amount: results.totalCosts - results.grossPrice + results.netProceeds - results.totalCommissions,
      color: "bg-red-600",
      percentage: ((results.totalCosts - results.grossPrice + results.netProceeds - results.totalCommissions) / results.grossPrice) * 100,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChart className="h-5 w-5 text-amber-500" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className={`w-3 h-3 ${item.color} rounded-full mr-2`}></div>
                  <span>{item.label}</span>
                </div>
                <span className="font-medium">{formatCurrency(item.amount)}</span>
              </div>
            ))}
          </div>
          
          {/* Visual Progress Bar */}
          <div className="mt-4 bg-slate-200 rounded-full h-4 overflow-hidden">
            <div className="h-full flex">
              {breakdown.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, item.percentage)}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={item.color}
                  style={{ minWidth: item.percentage > 2 ? 'auto' : '2px' }}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            {breakdown.map((item, index) => (
              <span key={index}>{item.percentage.toFixed(1)}%</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
