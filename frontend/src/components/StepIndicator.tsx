import { CheckCircle } from 'lucide-react';
import type { StepIndicatorProps } from '../types';

function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-8 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full hidden sm:block">
        <div 
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`step-circle transition-all duration-300 ${
                index < currentStep
                  ? 'completed'
                  : index === currentStep
                  ? 'active'
                  : ''
              }`}
            >
              {index < currentStep ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <span className="text-lg">{index + 1}</span>
              )}
            </div>
            <span
              className={`mt-3 text-xs sm:text-sm font-semibold text-center transition-colors max-w-[100px] ${
                index <= currentStep 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-400 dark:text-gray-600'
              }`}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StepIndicator;

