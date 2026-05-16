'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, LoaderCircle, Sparkles } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

// ─── Speech Recognition Setup ──────────────────────────────────────

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

// ─── Component ─────────────────────────────────────────────────────

export function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  const isSupported = SpeechRecognitionAPI != null;

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionAPI || disabled) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        setInterimText((prev) => prev + final);
      }
      if (interim) {
        // Show live interim text by replacing the previous interim
        setInterimText((prev) => {
          // Remove the last interim segment (anything after the last sentence end)
          const lastPeriod = prev.lastIndexOf('.');
          const base = lastPeriod >= 0 ? prev.slice(0, lastPeriod + 1) + ' ' : '';
          return base + interim;
        });
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setState('idle');
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setState((s) => (s === 'transcribing' ? 'idle' : 'idle'));
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setInterimText('');
    setState('recording');
    recognition.start();
  }, [disabled]);

  const handleToggle = useCallback(() => {
    if (state === 'recording') {
      setState('transcribing');
      stopRecording();
      // Wait a moment for final results then submit
      setTimeout(() => {
        if (interimText.trim()) {
          onTranscript(interimText.trim());
        }
        setInterimText('');
        setState('idle');
      }, 500);
    } else if (state === 'idle') {
      startRecording();
    }
  }, [state, interimText, onTranscript, startRecording, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={disabled || state === 'transcribing'}
        className={`
          relative w-9 h-9 rounded-xl flex items-center justify-center
          transition-all duration-200
          ${state === 'recording'
            ? 'bg-red-500/15 text-red-500 shadow-sm shadow-red-500/20 scale-110'
            : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-accent'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        title={
          state === 'recording'
            ? 'Stop recording'
            : state === 'transcribing'
              ? 'Transcribing...'
              : 'Start voice recording'
        }
      >
        {state === 'transcribing' ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}

        {/* Recording pulse rings */}
        <AnimatePresence>
          {state === 'recording' && (
            <motion.span
              initial={{ opacity: 0.6, scale: 1 }}
              animate={{ opacity: 0, scale: 2.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-xl bg-red-500/20"
            />
          )}
        </AnimatePresence>
      </button>

      {/* Live transcription preview */}
      <AnimatePresence>
        {state !== 'idle' && interimText && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="flex-1 min-w-0"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/50 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 shrink-0 text-primary" />
              <span className="truncate italic">
                {interimText}
                {state === 'recording' && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="ml-0.5 inline-block w-[2px] h-3.5 bg-primary/60 align-middle"
                  />
                )}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TTS Button ────────────────────────────────────────────────────

export function SpeakButton({ text, className }: { text: string; className?: string }) {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = useCallback(() => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
    );
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [text, speaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <button
      onClick={handleSpeak}
      className={`p-1.5 rounded-lg transition-all duration-200 ${
        speaking
          ? 'bg-primary/15 text-primary'
          : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent/50'
      } ${className || ''}`}
      title={speaking ? 'Stop' : 'Listen'}
    >
      {speaking ? (
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </motion.div>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}
