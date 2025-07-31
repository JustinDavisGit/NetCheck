import { useState, useCallback, useEffect } from 'react';
import { calculateNetOut, type CalculationInputs, type CalculationResults } from '@/lib/calculator';

const DEFAULT_INPUTS: CalculationInputs = {
  salePrice: 425000,
  propertyTax: 4500,
  closingDate: '2025-06-15',
  grtRate: 7.8125,
  listingCommission: 3,
  listingCommissionType: 'percentage',
  buyerCommission: 3,
  buyerCommissionType: 'percentage',
  mortgageBalance: 285000,
  escrowFee: 800,
  titlePolicy: 1200,
  titleBinder: 300,
  waterBill: 150,
  survey: 265,
  hoaFees: 0,
  repairs: 2500,
  otherExpenses: 500,
};

export function useCalculation() {
  const [inputs, setInputs] = useState<CalculationInputs>(DEFAULT_INPUTS);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const updateInput = useCallback((key: keyof CalculationInputs, value: number | string) => {
    setInputs(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const updateInputs = useCallback((newInputs: Partial<CalculationInputs>) => {
    setInputs(prev => ({
      ...prev,
      ...newInputs,
    }));
  }, []);

  const calculate = useCallback(() => {
    setIsCalculating(true);
    
    // Simulate calculation delay for UX
    setTimeout(() => {
      const calculationResults = calculateNetOut(inputs);
      setResults(calculationResults);
      setIsCalculating(false);
    }, 100);
  }, [inputs]);

  const resetToDefaults = useCallback(() => {
    setInputs(DEFAULT_INPUTS);
  }, []);

  const loadFromData = useCallback((data: Partial<CalculationInputs>) => {
    setInputs(prev => ({
      ...prev,
      ...data,
    }));
  }, []);

  // Auto-calculate when inputs change
  useEffect(() => {
    calculate();
  }, [calculate]);

  // Auto-save to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem('netOutCalculator_inputs', JSON.stringify(inputs));
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [inputs]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('netOutCalculator_inputs');
    if (saved) {
      try {
        const parsedInputs = JSON.parse(saved);
        setInputs(prev => ({ ...prev, ...parsedInputs }));
      } catch (error) {
        console.warn('Failed to load saved inputs:', error);
      }
    }
  }, []);

  return {
    inputs,
    results,
    isCalculating,
    updateInput,
    updateInputs,
    calculate,
    resetToDefaults,
    loadFromData,
  };
}
