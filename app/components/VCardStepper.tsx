"use client";

import { Progress } from "@/components/ui/progress";

interface VCardStepperProps {
  currentStep: number;
  totalSteps: number;
}

export default function VCardStepper({ currentStep, totalSteps }: VCardStepperProps) {
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full py-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-300">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-xs text-slate-400">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}

