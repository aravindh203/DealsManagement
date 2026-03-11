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
        console.error("Speech recognition error", event.error);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      console.error("Microphone access denied:", err);
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
      console.error("Failed to generate project", error);
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
    <div className="w-full mx-auto p-8 bg-white rounded-2xl shadow-xl border border-slate-200 relative overflow-hidden group">
      {/* Background glow effects - softer for light theme */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#5a3dd4] rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-10 pointer-events-none" />
      
      {isListening && (
        <div className="absolute inset-0 bg-[#5a3dd4]/5 mix-blend-multiply pointer-events-none transition-opacity duration-500" />
      )}

      <div className="relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-2.5 bg-[#f8f6ff] rounded-xl border border-[#e8e2fa] mb-2 shadow-[0_4px_15px_rgba(90,61,212,0.1)]">
            <Sparkles className="w-6 h-6 text-[#5a3dd4]" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
            AI Project Assistant
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Describe your project naturally. Our AI will translate your voice into structured project details.
          </p>
        </div>

        {/* Central Mic/Wave Arena */}
        <div className="flex flex-col items-center justify-center py-6 min-h-[160px] relative">
          
          {/* Waveform Visualization */}
          <div 
            className={`absolute inset-0 flex items-center justify-center gap-[3px] transition-all duration-500 ease-out ${isListening ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            style={{ height: '80px', top: '50%', transform: 'translateY(-50%)' }}
          >
            {renderWaveBars()}
          </div>

          {/* Glowing Microphone Button */}
          <button
            onClick={toggleListening}
            className={`
              relative z-20 flex items-center justify-center rounded-full transition-all duration-300 shadow-[0_4px_20px_rgba(90,61,212,0.25)]
              ${isListening 
                ? 'w-16 h-16 bg-white border-2 border-[#5a3dd4]' 
                : 'w-20 h-20 bg-gradient-to-tr from-[#5a3dd4] to-indigo-500 hover:shadow-[0_8px_30px_rgba(90,61,212,0.35)] hover:-translate-y-1'
              }
            `}
          >
            {isListening ? (
              <Square className="w-6 h-6 text-[#5a3dd4] fill-[#5a3dd4] transition-all" />
            ) : (
              <Mic className="w-8 h-8 text-white transition-all" />
            )}
            
            {/* Pulsing ring when listening */}
            {isListening && (
              <span className="absolute inset-0 rounded-full border border-[#5a3dd4] animate-ping opacity-50" style={{ animationDuration: '2s' }} />
            )}
          </button>

          {/* Status Text */}
          <div className="mt-8 h-6 flex items-center justify-center">
            {isListening && (
              <div className="flex items-center gap-2 text-[#5a3dd4] font-medium text-sm bg-white/70 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-[#5a3dd4]/20 animate-in fade-in zoom-in duration-300">
                <Activity className="w-4 h-4 animate-pulse" />
                Listening to you...
              </div>
            )}
          </div>
        </div>

        {/* Missing Fields Alert */}
        {missingFields.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 animate-in slide-in-from-top-2 shadow-sm">
            <div className="text-amber-500 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-800">Almost there! Missing information:</h4>
              <p className="text-sm text-amber-600 mt-1 leading-relaxed">
                To create a complete project, please provide details for: 
                <span className="font-semibold text-amber-700"> {missingFields.map(f => f.replace(/([A-Z])/g, " $1").trim()).join(', ').toLowerCase()}</span>.
              </p>
              <p className="text-xs text-amber-500/80 mt-1.5 font-medium">
                Tap the microphone or type below to continue adding these details.
              </p>
            </div>
          </div>
        )}

        {/* Text Input Area */}
        <div className="relative group/input mt-4">
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-[#5a3dd4]/40 to-indigo-500/40 rounded-xl blur transition duration-500 ${isListening ? 'opacity-30' : 'opacity-0 group-hover/input:opacity-10'}`} />
          <div className="relative bg-white rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-[#5a3dd4]/40 overflow-hidden transition-all duration-300">
             <Textarea
              value={displayDescription}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Or type your project details here..."
              className="w-full min-h-[140px] bg-transparent border-0 text-slate-700 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-0 resize-none rounded-none p-5 text-[15px] leading-relaxed"
              disabled={isLoading || isListening}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-2">
          <div className="text-[13px] font-medium text-slate-400 flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-[#5a3dd4] animate-pulse shadow-[0_0_8px_rgba(90,61,212,0.6)]' : 'bg-slate-300'}`} />
            {isListening ? 'Speech recognition active' : 'Ready'}
          </div>
          
          <Button 
            onClick={handleAiCall} 
            disabled={!description.trim() || isLoading || isListening}
            className="bg-gradient-to-r from-[#5a3dd4] to-indigo-600 hover:from-[#4a30b5] hover:to-indigo-700 text-white rounded-xl px-8 h-12 shadow-[0_6px_20px_rgba(90,61,212,0.3)] hover:shadow-[0_8px_25px_rgba(90,61,212,0.4)] transition-all flex items-center gap-2 font-semibold text-sm hover:-translate-y-0.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Generate Project
                <Send className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
