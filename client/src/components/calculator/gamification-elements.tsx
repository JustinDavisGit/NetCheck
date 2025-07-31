import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Target, TrendingUp, Zap, Gift, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, type CalculationResults } from "@/lib/calculator";

interface GamificationElementsProps {
  results: CalculationResults | null;
  salePrice: number;
  progress: number;
}

export function GamificationElements({ results, salePrice, progress }: GamificationElementsProps) {
  if (!results) return null;

  // Calculate achievement level
  const getAchievementLevel = (netProceeds: number) => {
    if (netProceeds >= 200000) return { level: "Platinum Seller", icon: Trophy, color: "bg-purple-500", milestone: "200K+" };
    if (netProceeds >= 150000) return { level: "Gold Seller", icon: Star, color: "bg-yellow-500", milestone: "150K+" };
    if (netProceeds >= 100000) return { level: "Silver Seller", icon: Target, color: "bg-gray-400", milestone: "100K+" };
    if (netProceeds >= 50000) return { level: "Bronze Seller", icon: TrendingUp, color: "bg-amber-600", milestone: "50K+" };
    return { level: "Rising Star", icon: Zap, color: "bg-blue-500", milestone: "Getting Started" };
  };

  // Calculate milestones
  const getMilestones = (netProceeds: number) => {
    const milestones = [
      { amount: 50000, label: "First Major Milestone", achieved: netProceeds >= 50000 },
      { amount: 100000, label: "Six-Figure Proceeds", achieved: netProceeds >= 100000 },
      { amount: 150000, label: "Premium Property", achieved: netProceeds >= 150000 },
      { amount: 200000, label: "Luxury Market", achieved: netProceeds >= 200000 },
    ];
    return milestones;
  };

  // Fun facts based on the proceeds
  const getFunFacts = (netProceeds: number) => {
    const facts = [];
    
    if (netProceeds >= 100000) {
      facts.push("🏠 This could be a down payment on another property!");
    }
    
    if (results.netPercentage > 30) {
      facts.push("📈 Your equity position is exceptional!");
    }
    
    if (netProceeds >= 50000) {
      facts.push("✈️ That's enough for a luxury vacation around the world!");
    }
    
    if (results.netPercentage > 25) {
      facts.push("🎯 You're beating the Albuquerque average!");
    }

    return facts;
  };

  const achievement = getAchievementLevel(results.netProceeds);
  const milestones = getMilestones(results.netProceeds);
  const funFacts = getFunFacts(results.netProceeds);
  const AchievementIcon = achievement.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="space-y-4 no-print"
    >
      {/* Achievement Badge */}
      <Card className="border-2 border-dashed border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${achievement.color} text-white`}>
                <AchievementIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">{achievement.level}</h4>
                <p className="text-sm text-slate-600">{achievement.milestone} Club</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {formatCurrency(results.netProceeds)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Milestone */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-700 flex items-center">
            <Target className="h-4 w-4 mr-2 text-green-600" />
            Milestone Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className={milestone.achieved ? "text-green-600 font-medium" : "text-slate-500"}>
                  {milestone.label}
                </span>
                <div className="flex items-center space-x-2">
                  <span className={milestone.achieved ? "text-green-600" : "text-slate-400"}>
                    {formatCurrency(milestone.amount)}
                  </span>
                  {milestone.achieved && <span className="text-green-500">✓</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fun Facts */}
      {funFacts.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
              <Gift className="h-4 w-4 mr-2" />
              Did You Know?
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {funFacts.map((fact, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="text-xs text-blue-700"
                >
                  {fact}
                </motion.p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Comparison */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="text-center">
            <h4 className="font-semibold text-green-800 mb-2">Market Performance</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-green-600 font-medium">Your Net %</p>
                <p className="text-2xl font-bold text-green-700">{results.netPercentage.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-slate-600">Market Avg</p>
                <p className="text-2xl font-bold text-slate-700">24.0%</p>
              </div>
            </div>
            <div className="mt-3">
              <Progress 
                value={Math.min(100, (results.netPercentage / 35) * 100)} 
                className="h-2"
              />
              <p className="text-xs text-green-600 mt-1">
                {results.netPercentage > 24 ? "Above Average! 🎉" : "Building Equity 📈"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}