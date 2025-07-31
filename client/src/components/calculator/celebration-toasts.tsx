import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, type CalculationResults } from "@/lib/calculator";

interface CelebrationToastsProps {
  results: CalculationResults | null;
  prevResults: CalculationResults | null;
}

export function CelebrationToasts({ results, prevResults }: CelebrationToastsProps) {
  const { toast } = useToast();

  useEffect(() => {
    if (!results || !prevResults) return;

    const current = results.netProceeds;
    const previous = prevResults.netProceeds;
    const improvement = current - previous;

    // Milestone celebrations
    const milestones = [50000, 100000, 150000, 200000, 250000];
    
    milestones.forEach(milestone => {
      if (previous < milestone && current >= milestone) {
        let title = "";
        let description = "";
        
        switch (milestone) {
          case 50000:
            title = "🎉 Major Milestone Reached!";
            description = `You've hit the $50K mark! That's a solid foundation for your next investment.`;
            break;
          case 100000:
            title = "💎 Six-Figure Success!";
            description = `Congratulations on reaching $100K+ in net proceeds! You're in the premium market now.`;
            break;
          case 150000:
            title = "🏆 Exceptional Performance!";
            description = `Wow! $150K+ in proceeds puts you in the top tier of sellers in Albuquerque.`;
            break;
          case 200000:
            title = "👑 Luxury Market Leader!";
            description = `Outstanding! $200K+ proceeds - you're playing in the luxury real estate league!`;
            break;
          case 250000:
            title = "🚀 Stratospheric Success!";
            description = `Incredible! $250K+ - you've achieved what most only dream of!`;
            break;
        }
        
        toast({
          title,
          description,
          duration: 5000,
        });
      }
    });

    // Percentage-based celebrations
    if (previous && results.netPercentage > 30 && prevResults.netPercentage <= 30) {
      toast({
        title: "📈 Equity Superstar!",
        description: `Your net percentage is now ${results.netPercentage.toFixed(1)}% - that's exceptional equity!`,
        duration: 4000,
      });
    }

    // Big improvements
    if (improvement > 25000) {
      toast({
        title: "🎯 Smart Adjustments!",
        description: `Great job! Your changes just improved your proceeds by ${formatCurrency(improvement)}.`,
        duration: 3000,
      });
    }

    // Beat the market average
    if (prevResults.netPercentage < 24 && results.netPercentage >= 24) {
      toast({
        title: "🥇 Above Market Average!",
        description: "You're now beating the Albuquerque market average of 24%!",
        duration: 4000,
      });
    }

  }, [results, prevResults, toast]);

  return null; // This component only handles side effects
}