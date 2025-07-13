'use client';

import { useState, useRef, useEffect } from 'react';
import Navigation from '../../components/Navigation';

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'mr', name: 'Marathi' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'pa', name: 'Punjabi' }
];

export default function VoiceLoggingPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState([]);
  const [houseId, setHouseId] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat: number | undefined; lng: number | undefined }>({ lat: undefined, lng: undefined });
  const [user, setUser] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);

  useEffect(() => {
    // Get user info from localStorage
    const userInfo = localStorage.getItem('user');
    if (userInfo) {
      try {
        setUser(JSON.parse(userInfo));
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }

    // Initialize speech recognition
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = sourceLanguage;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        alert('Speech recognition error');
      };
    }

    // Load speech synthesis voices
    if ('speechSynthesis' in window) {
      // Load voices when they become available
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      };
      
      // Try to load voices immediately
      loadVoices();
      
      // Also listen for voiceschanged event
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('GPS error:', error);
        }
      );
    }

    // Load existing logs
    loadLogs();
  }, [sourceLanguage]);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const loadLogs = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log('No auth token found, skipping log load');
        return;
      }

      const response = await fetch('/api/voice-logs', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        console.log('Unauthorized, redirecting to login');
        window.location.href = '/login';
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      setTranslatedText('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const translateText = async () => {
    if (!transcript.trim()) {
      alert('No text to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: transcript,
          targetLang: targetLanguage // Use targetLang to match the TTS code
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Translation response:', data);
        setTranslatedText(data.translated || data.translatedText);
        alert('Translation completed');
      } else {
        const errorData = await response.json();
        console.error('Translation error response:', errorData);
        throw new Error(errorData.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      alert('Translation failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsTranslating(false);
    }
  };

  const playText = (text: string, language: string) => {
    if (!text.trim()) {
      alert('No text to play');
      return;
    }

    if ('speechSynthesis' in window) {
      if (synthesisRef.current) {
        window.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Map language codes to proper speech synthesis language codes
      const languageMap: Record<string, string> = {
        'en': 'en-US',
        'hi': 'hi-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'bn': 'bn-IN',
        'mr': 'mr-IN',
        'gu': 'gu-IN',
        'pa': 'pa-IN'
      };
      
      utterance.lang = languageMap[language] || language;
      utterance.rate = 0.8; // Slightly slower for better pronunciation
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to find a voice that matches the language
      const voices = window.speechSynthesis.getVoices();
      const targetLang = languageMap[language] || language;
      
      // Find a voice that matches the target language
      const matchingVoice = voices.find(voice => 
        voice.lang === targetLang || 
        voice.lang.startsWith(language) ||
        voice.name.toLowerCase().includes(language)
      );
      
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopPlayback = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const saveLog = async () => {
    if (!transcript.trim() && !translatedText.trim()) {
      alert('No content to save');
      return;
    }

    if (!user) {
      alert('Please log in to save logs');
      window.location.href = '/login';
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        alert('Please log in to save logs');
        window.location.href = '/login';
        return;
      }

      // Map frontend fields to backend expected fields
      const logData = {
        houseId: houseId || '',
        recordedLang: sourceLanguage, // Backend expects recordedLang
        nativeText: transcript,
        translatedText: translatedText || '',
        remarks: `GPS: ${gpsLocation.lat}, ${gpsLocation.lng}`,
        userRole: user.role || 'USER',
        userName: user.name || user.email || 'Unknown User'
      };

      const response = await fetch('/api/voice-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(logData),
      });

      if (response.status === 401) {
        alert('Session expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      if (response.ok) {
        alert('Log saved successfully');
        setTranscript('');
        setTranslatedText('');
        setHouseId('');
        loadLogs();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save log');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save log: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const clearAll = () => {
    setTranscript('');
    setTranslatedText('');
    setHouseId('');
    stopPlayback();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50">
      <Navigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Logging</h1>
          <p className="text-gray-700">Record voice, translate, and save logs</p>
        </div>

        <div className="grid gap-6">
          {/* Language Selection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Language Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Source Language</label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Target Language</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* House ID */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">House Information</h2>
            <input
              type="text"
              placeholder="Enter House ID"
              value={houseId}
              onChange={(e) => setHouseId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Recording Controls */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Voice Recording</h2>
            <div className="flex gap-4 mb-4">
              <button
                onClick={toggleRecording}
                className={`px-6 py-3 rounded-lg font-medium transition ${
                  isRecording 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </button>
              
              <button
                onClick={clearAll}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition text-gray-900"
              >
                Clear All
              </button>
            </div>

            {isRecording && (
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-red-600">Recording...</span>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Original Text</h2>
              {transcript && (
                <button
                  onClick={() => playText(transcript, sourceLanguage)}
                  disabled={isPlaying}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 bg-white text-gray-900"
                >
                  Play
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your speech will appear here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Translation */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Translation</h2>
              <div className="flex gap-2">
                <button
                  onClick={translateText}
                  disabled={!transcript.trim() || isTranslating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isTranslating ? 'Translating...' : 'Translate'}
                </button>
                {translatedText && (
                  <button
                    onClick={() => playText(translatedText, targetLanguage)}
                    disabled={isPlaying}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 bg-white text-gray-900"
                  >
                    Play
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              placeholder="Translation will appear here..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Save Button */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg border p-6">
            <button
              onClick={saveLog}
              disabled={(!transcript.trim() && !translatedText.trim())}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              Save Log
            </button>
          </div>

          {/* Recent Logs */}
          {logs.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Logs</h2>
              <div className="space-y-4">
                {logs.slice(0, 5).map((log: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">House: {log.houseId}</span>
                      <span className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.nativeText && (
                      <p className="text-sm mb-2 text-gray-900">
                        <strong className="text-gray-900">Original:</strong> {log.nativeText}
                      </p>
                    )}
                    {log.translatedText && (
                      <p className="text-sm text-gray-900">
                        <strong className="text-gray-900">Translated:</strong> {log.translatedText}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 