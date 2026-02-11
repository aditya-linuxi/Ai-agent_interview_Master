import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, ChatMessage } from '../types';
import { MODEL_NAME, SYSTEM_INSTRUCTION, VOICE_NAME } from '../constants';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';

export const useLiveSession = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio handling to avoid re-renders
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null); // Using any because LiveSession type is internal

  const disconnect = useCallback(() => {
    // Stop Microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current && inputAudioContextRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Stop Playback
    sourcesRef.current.forEach(src => src.stop());
    sourcesRef.current.clear();
    
    // Close Audio Contexts
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close().catch(console.error);
        inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
    }
    
    // Attempt to close session
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then((session: any) => {
            if(session.close) session.close();
        }).catch(console.error);
        sessionPromiseRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    setVolume(0);
  }, []);

  const connect = useCallback(async () => {
    // Ensure clean state before connecting
    disconnect();
    
    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API_KEY not found in environment variables.");
      }

      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Ensure contexts are running (vital for browsers requiring user gesture)
      if (inputCtx.state === 'suspended') {
        await inputCtx.resume();
      }
      if (outputCtx.state === 'suspended') {
        await outputCtx.resume();
      }

      inputAudioContextRef.current = inputCtx;
      audioContextRef.current = outputCtx;
      
      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onopen: () => {
            console.log("Session Opened");
            setConnectionState(ConnectionState.CONNECTED);
            
            // Start Audio Streaming
            if (inputAudioContextRef.current && streamRef.current) {
              const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
              // Use ScriptProcessor for raw PCM access (bufferSize, inputChannels, outputChannels)
              const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Calculate volume for visualizer
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) {
                  sum += inputData[i] * inputData[i];
                }
                const rms = Math.sqrt(sum / inputData.length);
                setVolume(rms);

                const pcmBlob = createBlob(inputData);
                sessionPromise.then((session: any) => {
                   session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(processor);
              processor.connect(inputAudioContextRef.current.destination);
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBytes = decode(base64Audio);
              const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(src => src.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: (e) => {
            console.log("Session Closed", e);
            setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err: any) => {
            console.error("Session Error", err);
            setConnectionState(ConnectionState.ERROR);
            setError(err.message || "An unexpected error occurred.");
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (error: any) {
      console.error("Connection failed", error);
      setConnectionState(ConnectionState.ERROR);
      setError(error.message || "Failed to establish connection.");
      // Clean up if initial connection fails
      disconnect();
    }
  }, [disconnect]);

  // Send a text message (e.g., to set the role initially)
  const sendTextMessage = useCallback((text: string) => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then((session: any) => {
            session.sendRealtimeInput({
                content: {
                    parts: [{ text }]
                }
            });
            // Add to local transcript for UI
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                text: text,
                timestamp: Date.now()
            }]);
        });
    }
  }, []);

  return {
    connectionState,
    connect,
    disconnect,
    sendTextMessage,
    messages,
    volume,
    error,
  };
};