import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Trophy, Star, ThumbsUp, Info, Sparkles, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { formatCurrency, formatPercentage, getAchievementBadge, type CalculationResults } from "@/lib/calculator";

interface ResultsSummaryProps {
  results: CalculationResults | null;
  salePrice: number;
}

const iconMap = {
  trophy: Trophy,
  star: Star,
  'thumbs-up': ThumbsUp,
  'info-circle': Info,
};

export function ResultsSummary({ results, salePrice }: ResultsSummaryProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Create audio context for sound effects
  const playSuccessSound = () => {
    // Create a pleasant chime sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a pleasant chord progression
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    frequencies.forEach((freq, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.setValueAtTime(freq, audioContext.currentTime);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0, audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      osc.start(audioContext.currentTime + index * 0.1);
      osc.stop(audioContext.currentTime + 0.8 + index * 0.1);
    });
  };

  // Intersection Observer for scroll detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            if (results?.netProceeds) {
              playSuccessSound();
              setShowCelebration(true);
              setTimeout(() => setShowCelebration(false), 3000);
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible, results?.netProceeds]);

  useEffect(() => {
    if (results?.netProceeds && isVisible) {
      setShouldAnimate(true);
      // Animate number counting
      const targetValue = results.netProceeds;
      const duration = 1500;
      const steps = 75;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        // Use easing function for smoother animation
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        current = targetValue * eased;
        
        if (step >= steps) {
          current = targetValue;
          clearInterval(timer);
        }
        
        setDisplayValue(Math.round(current));
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [results?.netProceeds, isVisible]);

  if (!results) {
    return (
      <Card className="bg-gradient-to-br from-slate-100 to-slate-200 shadow-lg sticky top-8">
        <CardContent className="p-6">
          <div className="text-center text-slate-500">
            <Coins className="h-12 w-12 mx-auto mb-4" />
            <p>Enter property details to see results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const achievement = getAchievementBadge(results.netPercentage);
  const IconComponent = iconMap[achievement.icon as keyof typeof iconMap];

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="sticky top-8"
    >
      <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-lg relative overflow-hidden">
        {/* Celebration Effects */}
        <AnimatePresence>
          {showCelebration && (
            <>
              {/* Sparkle effects */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0, 1, 0],
                    x: [0, (Math.random() - 0.5) * 200],
                    y: [0, (Math.random() - 0.5) * 200]
                  }}
                  transition={{ duration: 2, delay: i * 0.1 }}
                  className="absolute top-1/2 left-1/2 pointer-events-none"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                </motion.div>
              ))}
              {/* Money rain effect */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={`money-${i}`}
                  initial={{ opacity: 0, y: -50, x: Math.random() * 300 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    y: 400,
                    rotate: 360
                  }}
                  transition={{ duration: 2.5, delay: i * 0.2 }}
                  className="absolute top-0 pointer-events-none"
                >
                  <DollarSign className="h-6 w-6 text-yellow-400" />
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>

        <CardContent className="p-6">
          <div className="text-center">
            <motion.div
              className="mb-4"
              animate={shouldAnimate ? { 
                y: [0, -10, 0],
                rotate: showCelebration ? [0, 5, -5, 0] : 0
              } : {}}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <Coins className={`h-12 w-12 mx-auto mb-2 ${showCelebration ? 'animate-bounce' : ''}`} />
              <h3 className="text-lg font-medium opacity-90">Estimated Net Proceeds</h3>
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={displayValue}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="text-5xl font-bold mb-2 font-mono"
              >
                {formatCurrency(displayValue)}
              </motion.div>
            </AnimatePresence>
            
            <div className="text-sm opacity-75 mb-4">
              From sale price of {formatCurrency(salePrice)}
            </div>
            
            <div className="bg-white/20 rounded-lg p-3 text-sm mb-4">
              <div className="flex justify-between items-center">
                <span>Net Percentage:</span>
                <span className="font-bold">{formatPercentage(results.netPercentage)}</span>
              </div>
            </div>
            
            <Badge className={`${achievement.color} text-xs font-medium`}>
              <IconComponent className="h-4 w-4 mr-1" />
              {achievement.text}
            </Badge>

            {/* Trigger confetti for exceptional results */}
            {results.netProceeds > 150000 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4"
              >
                <div className="text-xs opacity-75">🎉 Exceptional proceeds!</div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
