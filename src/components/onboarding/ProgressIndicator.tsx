import { cn } from "@/lib/utils";

interface ProgressIndicatorProps {
  currentStep: 1 | 2 | 3 | 4;
}

const steps = [
  { number: 1, label: "Welcome" },
  { number: 2, label: "Churn Risk" },
  { number: 3, label: "Calculator" },
  { number: 4, label: "How it works" },
];

export const ProgressIndicator = ({ currentStep }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                currentStep >= step.number
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {step.number}
            </div>
            <span
              className={cn(
                "text-xs sm:text-sm hidden md:inline transition-colors",
                currentStep >= step.number
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "w-4 sm:w-8 h-0.5 transition-colors",
                currentStep > step.number ? "bg-primary" : "bg-secondary"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};
