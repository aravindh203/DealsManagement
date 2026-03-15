import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mic, Sparkles, Square, Send, Activity, AlertCircle } from 'lucide-react';
import { Project } from '@/pages/projectsData';
import { CreateProjectbyDescription } from '@/services/aiSummary';

interface AiProjectCreationFormProps {
  onGenerated: (project: Project) => void;
}

export const AiProjectCreationForm: React.FC<AiProjectCreationFormProps> = ({ onGenerated }) => {
  const [description, setDescription] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const descriptionRef = useRef(description);
  useEffect(() => {
    descriptionRef.current = description;
  }, [description]);

  const isListeningRef = useRef(isListening);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const stopListening = () => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    
    setIsListening(false);
    setAudioLevel(0);
    setInterimTranscript('');
  };

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            currentInterim += event.results[i][0].transcript;
          }
        }
        
        if (currentFinal) {
          const currentText = descriptionRef.current;
          setDescription(currentText + (currentText && !currentText.endsWith(' ') ? ' ' : '') + currentFinal);
        }
        
        setInterimTranscript(currentInterim);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
           stopListening();
        }
      };

      recognitionRef.current.onend = () => {
         // Auto-stop if recording ended via silence timeout
         if (isListeningRef.current) {
           stopListening();
         }
      };
    }

    return () => {
      stopListening();
    };
     
  }, []);

  const analyzeAudioLevel = () => {
    if (!analyzerRef.current) return;
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume level (0-255)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    // Normalize to 0-1 range with a slight boost
    setAudioLevel(Math.min(1, (average / 128) * 1.5));
    
    animationFrameRef.current = requestAnimationFrame(analyzeAudioLevel);
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      alert("Your browser doesn't support speech recognition.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 256;
      analyzerRef.current = analyzer;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyzer);
      
      analyzeAudioLevel();
      
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      alert("Could not access microphone.");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleAiCall = async () => {
    const finalDescription = description + (interimTranscript ? ' ' + interimTranscript : '');
    if (!finalDescription.trim()) return;
    setIsLoading(true);
    if (isListening) stopListening();
    
    try {
      const AiAnalysis = await CreateProjectbyDescription({ P_Description: finalDescription });
      
      if (AiAnalysis.missingFields && AiAnalysis.missingFields.length > 0) {
        setMissingFields(AiAnalysis.missingFields);
        setIsLoading(false);
        return; // Stop here and ask for more details
      }
      
      setMissingFields([]);

      const projectData: Project = {
        P_Name: AiAnalysis.projectName || "AI Generated Project",
        P_Description: AiAnalysis.projectBrief || finalDescription.trim(),
        P_Type: AiAnalysis.projectType || "Technology",
        P_Status: "Open",
        P_Budget: AiAnalysis.budget ? String(AiAnalysis.budget) : undefined,
        P_StartDate: AiAnalysis.startDate ? new Date(AiAnalysis.startDate).toISOString() : undefined,
        P_EndDate: AiAnalysis.endDate ? new Date(AiAnalysis.endDate).toISOString() : undefined,
        P_BidStartDate: AiAnalysis.bidStartDate ? new Date(AiAnalysis.bidStartDate).toISOString() : undefined,
        P_BidEndDate: AiAnalysis.bidEndDate ? new Date(AiAnalysis.bidEndDate).toISOString() : undefined,
        P_Company: "Admin",
      };

      onGenerated(projectData);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };


  // Generate dynamic wave bars based on audio level
  const numBars = 15;
  const renderWaveBars = () => {
    return Array.from({ length: numBars }).map((_, i) => {
      // Create a curve effect where middle bars respond more to volume
      const distanceFromCenter = Math.abs(i - Math.floor(numBars / 2));
      const maxDist = Math.floor(numBars / 2);
      const intensity = 1 - (distanceFromCenter / maxDist) * 0.5;
      
      // Base height + dynamic height bounded
      const baseHeight = 15; // 15%
      const dynamicHeight = Math.max(0, audioLevel * intensity * 85); 
      const height = baseHeight + dynamicHeight;

      return (
        <div 
          key={i}
          className="w-1.5 bg-[#5a3dd4] rounded-full mx-px transition-all duration-75"
          style={{ 
            height: `${height}%`,
            opacity: 0.6 + (audioLevel * intensity * 0.4),
            boxShadow: `0 0 ${audioLevel * 10}px #5a3dd4`
          }}
        />
      );
    });
  };

  const displayDescription = isListening && interimTranscript
    ? description + (description && !description.endsWith(' ') ? ' ' : '') + interimTranscript
    : description;

  return (
    <div className="w-full mx-auto p-5 sm:p-6 bg-white rounded-2xl shadow-xl border border-slate-200/80 relative overflow-hidden group">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#faf9ff] via-white to-[#f8f6ff] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5a3dd4] rounded-full filter blur-[80px] opacity-[0.07] pointer-events-none" />
      {isListening && (
        <div className="absolute inset-0 bg-[#5a3dd4]/[0.03] pointer-events-none transition-opacity duration-300" />
      )}

      <div className="relative z-10 space-y-4">
        {/* Header - compact */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center p-2 bg-[#f0ecff] rounded-lg border border-[#e5deff]">
            <Sparkles className="w-5 h-5 text-[#5a3dd4]" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 tracking-tight">
            AI Project Assistant
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-snug">
            Describe your project naturally. Voice or type—AI will structure the details.
          </p>
        </div>

        {/* Mic + status - compact */}
        <div className="flex flex-col items-center justify-center py-3 min-h-[100px] relative">
          <div
            className={`absolute inset-0 flex items-center justify-center gap-[3px] transition-all duration-300 ease-out ${isListening ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{ height: '56px', top: '50%', transform: 'translateY(-50%)' }}
          >
            {renderWaveBars()}
          </div>
          <button
            onClick={toggleListening}
            className={`
              relative z-20 flex items-center justify-center rounded-full transition-all duration-200 shadow-[0_4px_16px_rgba(90,61,212,0.22)]
              ${isListening
                ? 'w-14 h-14 bg-white border-2 border-[#5a3dd4]'
                : 'w-16 h-16 bg-gradient-to-br from-[#5a3dd4] to-indigo-500 hover:shadow-[0_6px_24px_rgba(90,61,212,0.35)] hover:scale-[1.02]'
              }
            `}
          >
            {isListening ? (
              <Square className="w-5 h-5 text-[#5a3dd4] fill-[#5a3dd4]" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
            {isListening && (
              <span className="absolute inset-0 rounded-full border border-[#5a3dd4] animate-ping opacity-40" style={{ animationDuration: '2s' }} />
            )}
          </button>
          {isListening && (
            <div className="mt-3 flex items-center gap-2 text-[#5a3dd4] font-medium text-xs bg-[#f0ecff] px-3 py-1 rounded-full border border-[#5a3dd4]/20">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              Listening...
            </div>
          )}
        </div>

        {/* Missing Fields - compact */}
        {missingFields.length > 0 && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-3 flex gap-2.5 animate-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-amber-800">Missing: {missingFields.map(f => f.replace(/([A-Z])/g, " $1").trim()).join(', ').toLowerCase()}</h4>
              <p className="text-xs text-amber-600 mt-0.5 leading-snug">
                Add more details via mic or type below.
              </p>
            </div>
          </div>
        )}

        {/* Textarea - compact */}
        <div className="relative group/input">
          <div className={`absolute -inset-px bg-gradient-to-r from-[#5a3dd4]/30 to-indigo-500/30 rounded-lg blur transition duration-300 ${isListening ? 'opacity-20' : 'opacity-0 group-hover/input:opacity-[0.08]'}`} />
          <div className="relative bg-white rounded-lg ring-1 ring-slate-200/80 focus-within:ring-2 focus-within:ring-[#5a3dd4]/40 transition-all duration-200">
            <Textarea
              value={displayDescription}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Or type your project details here..."
              className="w-full min-h-[100px] bg-transparent border-0 text-slate-700 placeholder:text-slate-400 focus-visible:ring-0 resize-none rounded-lg p-3.5 text-sm leading-snug"
              disabled={isLoading || isListening}
            />
          </div>
        </div>

        {/* Footer - compact */}
        <div className="flex justify-between items-center gap-3 pt-1">
          <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 bg-slate-50/80 px-2.5 py-1 rounded-full border border-slate-100">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-[#5a3dd4] animate-pulse' : 'bg-slate-300'}`} />
            {isListening ? 'Active' : 'Ready'}
          </div>
          <Button
            onClick={handleAiCall}
            disabled={!description.trim() || isLoading || isListening}
            className="bg-gradient-to-r from-[#5a3dd4] to-indigo-600 hover:from-[#4f36c4] hover:to-indigo-700 text-white rounded-lg px-5 py-2.5 h-9 text-sm font-medium shadow-[0_4px_14px_rgba(90,61,212,0.25)] hover:shadow-[0_6px_18px_rgba(90,61,212,0.35)] transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Generate Project
                <Send className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

