import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, FileText, Users, Zap, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { createVerificationSession } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';
import type { VerificationScenario, VerificationScenarioConfig } from '../types';

function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<VerificationScenario | null>(null);

  const scenarios: VerificationScenarioConfig[] = [
    {
      id: 'full',
      name: 'Full Verification',
      description: 'Complete identity verification with document check, face matching, and liveness detection',
      features: [
        'Document authenticity check',
        'Face matching with document photo',
        'Liveness detection',
      ],
      icon: '🛡️',
      color: 'blue',
    },
    {
      id: 'standard',
      name: 'Standard Verification',
      description: 'Document verification and face matching without liveness check',
      features: [
        'Document authenticity check',
        'Face matching with document photo',
      ],
      icon: '✅',
      color: 'green',
    },
    {
      id: 'liveness-first',
      name: 'Liveness-First Verification',
      description: 'Liveness check first, then document verification with captured portrait (skips face match)',
      features: [
        'Liveness detection',
        'Document authenticity check',
        'Portrait from liveness used for face matching',
      ],
      icon: '🎯',
      color: 'purple',
    },
  ];

  const handleStartVerification = async (scenario: VerificationScenario) => {
    try {
      setLoading(true);
      setError(null);

      // Create a new verification session
      const session = await createVerificationSession();

      // Navigate to verification flow with scenario in state
      navigate(`/verify/${session.id}`, { 
        state: { scenario } 
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Sticky and Fixed */}
      <header className="glass-effect fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <ShieldCheck className="relative w-10 h-10 text-white bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">
                  KYC Verification
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Cyantech</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-6 animate-slide-down">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Identity Verification
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 animate-slide-up">
              <span className="text-gray-900 dark:text-white">Secure Identity</span>
              <br />
              <span className="gradient-text">Verification Made Simple</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-up animation-delay-100">
              Experience seamless KYC verification with advanced document scanning, 
              face matching, and liveness detection. Fast, secure, and accurate.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-16 animate-fade-in">
            <div className="group card hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Document Verification</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Validate authenticity of government-issued IDs with advanced OCR
                and security checks
              </p>
            </div>

            <div className="group card hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Liveness Detection</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Ensure the person is physically present with AI-powered liveness
                checks
              </p>
            </div>

            <div className="group card hover:scale-105 transition-all duration-300 cursor-pointer sm:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Face Matching</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Match the live selfie with the photo on the document with high
                accuracy
              </p>
            </div>
          </div>

          {/* Verification Scenario Selection */}
          <div className="card max-w-5xl mx-auto animate-scale-in">
            <div className="text-center mb-8">
              <h3 className="text-2xl lg:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                Choose Verification Scenario
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Select the verification flow that best fits your needs
            </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl mb-6 animate-slide-down">
                <p className="font-semibold">⚠️ Error</p>
                <p>{error}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {scenarios.map((scenario) => {
                const isSelected = selectedScenario === scenario.id;
                const colorClasses = {
                  blue: {
                    border: 'border-blue-500',
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    text: 'text-blue-600 dark:text-blue-400',
                    button: 'bg-blue-600 hover:bg-blue-700',
                  },
                  green: {
                    border: 'border-green-500',
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    text: 'text-green-600 dark:text-green-400',
                    button: 'bg-green-600 hover:bg-green-700',
                  },
                  purple: {
                    border: 'border-purple-500',
                    bg: 'bg-purple-50 dark:bg-purple-900/20',
                    text: 'text-purple-600 dark:text-purple-400',
                    button: 'bg-purple-600 hover:bg-purple-700',
                  },
                }[scenario.color] || {
                  border: 'border-gray-500',
                  bg: 'bg-gray-50 dark:bg-gray-900/20',
                  text: 'text-gray-600 dark:text-gray-400',
                  button: 'bg-gray-600 hover:bg-gray-700',
                };

                return (
                  <div
                    key={scenario.id}
                    onClick={() => setSelectedScenario(scenario.id)}
                    className={`card cursor-pointer transition-all duration-300 hover:scale-105 ${
                      isSelected
                        ? `${colorClasses.border} border-4 ${colorClasses.bg}`
                        : 'border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start mb-4">
                      <div className={`text-4xl mr-4 ${isSelected ? colorClasses.text : ''}`}>
                        {scenario.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                          {scenario.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          {scenario.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className={`w-6 h-6 ${colorClasses.text}`} />
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {scenario.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isSelected ? colorClasses.text.replace('text-', 'bg-') : 'bg-gray-400'}`}></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center">
            <button
                onClick={() => selectedScenario && handleStartVerification(selectedScenario)}
                disabled={loading || !selectedScenario}
                className={`${selectedScenario ? scenarios.find(s => s.id === selectedScenario)?.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700' : scenarios.find(s => s.id === selectedScenario)?.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white text-lg px-10 py-4 rounded-lg inline-flex items-center justify-center space-x-2 group transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Creating Session...</span>
                </>
              ) : (
                <>
                    <span>{selectedScenario ? 'Start Verification' : 'Select a Scenario'}</span>
                    {selectedScenario && (
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    )}
                </>
              )}
            </button>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Fast & Secure</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-100"></div>
                  <span>AI-Powered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-200"></div>
                  <span>Bank-Grade Security</span>
                </div>
              </div>
            </div>
          </div>

          {/* Process Steps */}
          <div className="mt-20">
            <h3 className="text-2xl lg:text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">How It Works</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="relative flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-xl">
                    1
                  </div>
                </div>
                <div className="card w-full">
                  <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Upload Document</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    Take a photo of your government-issued ID or passport
                  </p>
                </div>
              </div>

              <div className="relative flex flex-col items-center text-center group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-xl">
                    2
                  </div>
                </div>
                <div className="card w-full">
                  <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Liveness Check</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    Take a live selfie to verify you're physically present
                  </p>
                </div>
              </div>

              <div className="relative flex flex-col items-center text-center group sm:col-span-2 lg:col-span-1">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition"></div>
                  <div className="relative w-16 h-16 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-xl">
                    3
                  </div>
                </div>
                <div className="card w-full">
                  <h4 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Get Results</h4>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    Receive instant verification results with detailed report
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-20 card max-w-4xl mx-auto bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50">
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Why Choose Our Solution?</h4>
              <p className="text-gray-600 dark:text-gray-400">Industry-leading verification technology</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">99.9% Accuracy</p>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Bank-Grade Security</p>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Real-Time Processing</p>
              </div>
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Global Coverage</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-effect border-t border-gray-200/50 dark:border-gray-700/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
              © 2025 KYC Demo Application
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              Powered by{' '}
              <a
                href="https://cyantech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Cyantech
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;

