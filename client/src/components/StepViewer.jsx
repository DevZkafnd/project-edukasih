import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
import VoiceButton from './VoiceButton';

const StepViewer = ({ steps }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const restart = () => {
    setCurrentStep(0);
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-6 border-4 border-brand-yellow">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
        <div 
          className="bg-brand-green h-4 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="text-center mb-2">
        <span className="text-gray-500 font-bold text-lg">Langkah {currentStep + 1} dari {steps.length}</span>
      </div>

      {/* Step Content */}
      <div className="min-h-[200px] flex flex-col items-center justify-center bg-blue-50 rounded-2xl p-6 md:p-8 mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-4 leading-relaxed">
          {steps[currentStep]}
        </h2>
        <VoiceButton 
            text="Dengarkan" 
            audioScript={steps[currentStep]} 
            className="mt-4"
        />
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center gap-4">
        {currentStep === 0 ? (
           <div className="w-1/3"></div> // Spacer
        ) : (
          <button 
            onClick={prevStep}
            className="flex-1 bg-brand-blue text-white rounded-2xl py-3 md:py-4 flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors shadow-lg active:scale-95"
          >
            <ChevronLeft size={24} className="md:w-8 md:h-8" />
            <span className="text-lg md:text-xl font-bold">Kembali</span>
          </button>
        )}

        {currentStep === steps.length - 1 ? (
          <button 
            onClick={restart}
            className="flex-1 bg-brand-green text-white rounded-2xl py-3 md:py-4 flex items-center justify-center gap-2 hover:bg-green-600 transition-colors shadow-lg active:scale-95"
          >
            <Repeat size={24} className="md:w-8 md:h-8" />
            <span className="text-lg md:text-xl font-bold">Ulangi</span>
          </button>
        ) : (
          <button 
            onClick={nextStep}
            className="flex-1 bg-brand-yellow text-black rounded-2xl py-3 md:py-4 flex items-center justify-center gap-2 hover:bg-yellow-500 transition-colors shadow-lg active:scale-95"
          >
            <span className="text-lg md:text-xl font-bold">Lanjut</span>
            <ChevronRight size={24} className="md:w-8 md:h-8" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StepViewer;
