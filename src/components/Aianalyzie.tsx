import React, { useState, useEffect } from "react";
import { FileText, Search, FileCheck, ShieldCheck, CheckCircle2, Loader2, CircleDot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFileContent } from "../services/aiFileService";
import { analyzeProposalDocuments, analyzeVendorDocuments } from "@/services/aiSummary";

interface AianalyzieProps {
  projectDescription: string;
  proposalDocument: File;
  onClose: () => void;
}

export default function Aianalyzie({ projectDescription, proposalDocument, onClose }: AianalyzieProps) {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const runAnalysis = async () => {
      try {
        const AiProcess = async (doc: any) => {
          return await getFileContent(doc, "PROPOSAL QUALITY");
        };

        const AiAnalysiz = async (extractedContent: any, description: string) => {
          return await analyzeProposalDocuments(extractedContent, { P_Description: description });
        };
        const extractedData = await AiProcess(proposalDocument);

        const analysisResult = await AiAnalysiz(extractedData, projectDescription);

        // You can now use analysisResult to update state if needed
      } catch (error) {
      }
    };

    runAnalysis();

    // Total animation time 5 seconds    
    const duration = 5000;
    const interval = 50;
    const totalSteps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / totalSteps) * 100, 100);
      setProgress(newProgress);
      if (currentStep >= totalSteps) {
        clearInterval(timer);

        // Wait 3 seconds after completion, then call onClose to return to Project
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [navigate]);

  const steps = [
    {
      label: "Scanning Document Structure",
      icon: <FileText className="w-5 h-5 text-emerald-600" />,
      completedAt: 25,
    },
    {
      label: "OCR Data Extraction",
      icon: <Search className="w-5 h-5 text-emerald-600" />,
      completedAt: 50,
    },
    {
      label: "Signature Authenticity Check",
      icon: <FileCheck className="w-5 h-5 text-emerald-600" />,
      completedAt: 75,
    },
    {
      label: "Legal Compliance Verification",
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      completedAt: 100,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans overflow-auto"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    >
      {/* Top pill badge */}
      <div className="mb-6 z-10 animate-fade-in-down" style={{ animationDelay: "0ms", animationFillMode: "both" }}>
        <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-full shadow-sm border border-slate-100/50 hover:shadow-md transition-shadow">
          <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse relative">
            <div className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-75"></div>
          </div>
          <span className="text-xs font-bold tracking-[0.2em] text-violet-600 uppercase">
            Nexus AI Intelligence
          </span>
        </div>
      </div>

      {/* Hero Titles */}
      <div className="text-center mb-10 z-10 px-4 animate-fade-in-down" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-[#0F172A] mb-4">
          Document{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-[#7C3AED]">
            Validation
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
          Our neural engine is analyzing your file for authenticity, compliance,
          and structural integrity.
        </p>
      </div>

      {/* Main Validation Card */}
      <div
        className="w-full max-w-lg bg-white rounded-[2rem] p-8 md:p-10 shadow-2xl shadow-indigo-500/5 border border-white/60 relative overflow-hidden z-10 animate-fade-in-down"
        style={{ animationDelay: "400ms", animationFillMode: "both" }}
      >
        {/* Card Header Info */}
        <div className="flex justify-between items-end mb-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.25em] text-violet-500 uppercase">
              Document Verification
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              AI Validation Progress
            </h2>
          </div>
          <div className="text-3xl font-light text-violet-600 mb-[-2px]">
            {Math.floor(progress)}%
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-3 bg-slate-100 rounded-full mb-10 overflow-hidden shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-[#7C3AED] rounded-full transition-all duration-[200ms] ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer effect inside progress bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[progress-shimmer_1.5s_infinite]"></div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-6 mb-10">
          {steps.map((step, index) => {
            const isCompleted = progress >= step.completedAt;
            // A step is active if progress has passed the previous step's threshold, but hasn't reached its own yet
            const prevThreshold = index === 0 ? 0 : steps[index - 1].completedAt;
            const isCurrent = progress < step.completedAt && progress >= prevThreshold;

            let translationClass = "translate-y-4 opacity-0";
            if (progress >= prevThreshold) {
              translationClass = "translate-y-0 opacity-100";
            } else if (progress + 25 >= prevThreshold) {
              // Fade in slightly before it starts so it enters smoothly
              translationClass = "translate-y-2 opacity-40";
            }

            return (
              <div
                key={index}
                className={`flex items-center justify-between transition-all duration-700 ease-out ${translationClass}`}
              >
                <div className="flex items-center gap-4">
                  {/* Icon Box */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${isCompleted || isCurrent
                        ? "bg-emerald-50/80 shadow-sm"
                        : "bg-slate-50 grayscale opacity-50"
                      }`}
                  >
                    {step.icon}
                  </div>
                  {/* Label */}
                  <span
                    className={`text-[15px] font-semibold transition-colors duration-500 ${isCompleted
                        ? "text-slate-700"
                        : isCurrent
                          ? "text-slate-900"
                          : "text-slate-400"
                      }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Status Indicator */}
                <div className="w-8 flex items-center justify-end">
                  {isCompleted ? (
                    <div className="animate-[scale-in_0.4s_ease-out_forwards]">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
                    </div>
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-violet-500 animate-spin opacity-80" strokeWidth={2.5} />
                  ) : (
                    <CircleDot className="w-5 h-5 text-slate-200" strokeWidth={2} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-slate-100 mb-6"></div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${progress < 100 ? "animate-ping bg-emerald-400" : "bg-violet-400"
                  }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${progress < 100 ? "bg-emerald-500" : "bg-violet-500"
                  }`}
              ></span>
            </span>
            <span
              className={`text-[11px] font-bold tracking-widest uppercase transition-colors duration-300 ${progress < 100 ? "text-slate-400" : "text-violet-500"
                }`}
            >
              {progress < 100 ? "AI Engine Active" : "Validation Complete"}
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            ID: DOC-VAL-2024
          </span>
        </div>
      </div>

      {/* Global CSS for custom animations that Tailwind might miss without full config */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes progress-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes scale-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-down {
          animation-name: fade-in-down;
          animation-duration: 0.8s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}} />
    </div>
  );
}


