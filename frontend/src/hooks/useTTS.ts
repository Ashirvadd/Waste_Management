import { useState, useRef, useEffect } from 'react';

interface TTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  autoPlay?: boolean;
}

interface TranslationResponse {
  translated: string;
  translatedText: string;
  success: boolean;
}

export const useTTS = (options: TTSOptions = {}) => {
  const {
    lang = 'en-IN',
    rate = 0.9,
    pitch = 1.0,
    volume = 1.0,
    autoPlay = false
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [lastTranslated, setLastTranslated] = useState<{ text: string; lang: string } | null>(null);
  const [isStopped, setIsStopped] = useState(false);

  const LANG_MAP: Record<string, string> = {
    'en-IN': 'en',
    'hi-IN': 'hi',
    'kn-IN': 'kn',
    'ta-IN': 'ta',
    'te-IN': 'te',
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Monitor speech synthesis state
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const checkSpeechState = () => {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentUtterance(null);
        }
      };
      
      const interval = setInterval(checkSpeechState, 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.cancel();
      }
      if (window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
      
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
      setIsStopped(true);
    }
  };

  const pauseTTS = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeTTS = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const translateText = async (text: string, targetLang: string): Promise<string> => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });

      if (response.ok) {
        const data: TranslationResponse = await response.json();
        return data.translated || data.translatedText || text;
      } else {
        console.error('Translation failed:', await response.text());
        return text;
      }
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const selectVoice = (voices: SpeechSynthesisVoice[], targetLang: string) => {
    const langCode = LANG_MAP[targetLang] || targetLang.split('-')[0];
    
    // Try exact match first
    let selectedVoice = voices.find(v => v.lang === targetLang);
    
    // Try base language match
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang === langCode);
    }
    
    // Try partial match
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang && v.lang.startsWith(langCode));
    }

    // Language-specific strategies
    if (langCode === 'hi' && !selectedVoice) {
      selectedVoice = voices.find(v =>
        v.lang === 'hi-IN' || v.lang === 'hi' || v.name.toLowerCase().includes('hindi')
      );
      
      if (!selectedVoice) {
        selectedVoice = voices.find(v => 
          v.lang.includes('in') || v.name.toLowerCase().includes('indian')
        );
      }
    } else if (langCode === 'kn' && !selectedVoice) {
      selectedVoice = voices.find(v => 
        v.lang.includes('kn') || v.name.toLowerCase().includes('kannada')
      );
      
      if (!selectedVoice) {
        selectedVoice = voices.find(v => 
          v.name.toLowerCase().includes('indian') || v.lang.includes('in')
        );
      }
    }

    return selectedVoice;
  };

  const speak = async (text: string, targetLang: string = lang, isManual = true) => {
    // Don't start if TTS was stopped by user, but allow manual TTS
    if (!isManual && isStopped) {
      console.log('TTS was stopped by user, not starting automatic utterance');
      return;
    }

    // Reset stopped flag for manual TTS
    if (isManual) {
      setIsStopped(false);
    }

    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.cancel();
      }
      if (window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
      }
    }

    setIsLoading(true);
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentUtterance(null);

    let toSpeak = text;
    const langCode = LANG_MAP[targetLang] || targetLang.split('-')[0];

    try {
      // Translate if needed
      if (langCode !== 'en') {
        toSpeak = await translateText(text, langCode);
        setLastTranslated({ text: toSpeak, lang: targetLang });
      } else {
        setLastTranslated(null);
      }

      if ('speechSynthesis' in window) {
        const utter = new window.SpeechSynthesisUtterance(toSpeak);
        utter.lang = targetLang;
        utter.rate = rate;
        utter.pitch = pitch;
        utter.volume = volume;

        // Wait for voices to load
        let voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          await new Promise<void>((resolve) => {
            window.speechSynthesis.onvoiceschanged = () => {
              voices = window.speechSynthesis.getVoices();
              resolve();
            };
          });
        }

        // Select appropriate voice
        const selectedVoice = selectVoice(voices, targetLang);
        if (selectedVoice) {
          utter.voice = selectedVoice;
        }

        // Event handlers
        utter.onend = () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentUtterance(null);
        };

        utter.onerror = (event) => {
          console.error('TTS Error:', event);
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentUtterance(null);
          
          // Try fallback for Indian languages
          if (langCode === 'hi' && !isStopped) {
            try {
              const fallbackUtter = new window.SpeechSynthesisUtterance(toSpeak);
              fallbackUtter.lang = 'hi-IN';
              fallbackUtter.rate = 0.8;
              window.speechSynthesis.speak(fallbackUtter);
            } catch (fallbackError) {
              console.error('Fallback TTS failed:', fallbackError);
            }
          }
        };

        utter.onpause = () => setIsPaused(true);
        utter.onresume = () => setIsPaused(false);
        utter.onstart = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };

        setCurrentUtterance(utter);
        window.speechSynthesis.speak(utter);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentUtterance(null);
    } finally {
      setIsLoading(false);
    }
  };

  const debugVoices = () => {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const voiceReport = voices.map(v => `${v.name} (${v.lang})${v.default ? ' [DEFAULT]' : ''}`).join('\n');
      
      const indianVoices = voices.filter(v => 
        v.lang.includes('hi') || v.lang.includes('kn') || v.lang.includes('ta') || v.lang.includes('te') ||
        v.lang.includes('in') || v.name.toLowerCase().includes('indian')
      );
      
      const hasHindi = voices.some(v => v.lang.includes('hi'));
      const hasKannada = voices.some(v => v.lang.includes('kn'));
      const hasTamil = voices.some(v => v.lang.includes('ta'));
      const hasTelugu = voices.some(v => v.lang.includes('te'));
      
      let message = `Found ${voices.length} voices total.\n\n`;
      message += `Indian Language Support:\n`;
      message += `- Hindi: ${hasHindi ? '✅ Available' : '❌ Not available'}\n`;
      message += `- Kannada: ${hasKannada ? '✅ Available' : '❌ Not available'}\n`;
      message += `- Tamil: ${hasTamil ? '✅ Available' : '❌ Not available'}\n`;
      message += `- Telugu: ${hasTelugu ? '✅ Available' : '❌ Not available'}\n\n`;
      
      if (indianVoices.length > 0) {
        message += `Indian voices found:\n${indianVoices.map(v => `- ${v.name} (${v.lang})`).join('\n')}\n\n`;
      }
      
      if (!hasKannada || !hasTamil || !hasTelugu) {
        message += `To install missing language voices:\n`;
        message += `1. Windows: Settings > Time & Language > Language > Add language\n`;
        message += `2. macOS: System Preferences > Language & Region > Add language\n`;
        message += `3. Linux: Install language packs via package manager\n`;
      }
      
      message += `\nAll available voices:\n${voiceReport}`;
      
      alert(message);
    } else {
      alert('Speech synthesis not supported in this browser.');
    }
  };

  return {
    speak,
    stopTTS,
    pauseTTS,
    resumeTTS,
    isPlaying,
    isPaused,
    isLoading,
    currentUtterance,
    lastTranslated,
    debugVoices,
    translateText
  };
}; 