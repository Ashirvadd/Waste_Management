import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, sourceLanguage, targetLanguage, targetLang } = body;
    
    // Handle both parameter names for compatibility
    const finalTargetLang = targetLanguage || targetLang;
    
    if (!text || !finalTargetLang) {
      return NextResponse.json({ 
        error: 'Missing text or targetLanguage/targetLang' 
      }, { status: 400 });
    }

    // Clean and validate the target language
    const cleanTargetLang = finalTargetLang.toLowerCase().trim();
    
    // Map language codes to Google Translate format
    const langMap: Record<string, string> = {
      'hi': 'hi',
      'hi-in': 'hi',
      'kn': 'kn',
      'kn-in': 'kn',
      'ta': 'ta',
      'ta-in': 'ta',
      'te': 'te',
      'te-in': 'te',
      'en': 'en',
      'en-in': 'en'
    };

    const googleLang = langMap[cleanTargetLang] || cleanTargetLang;

    // Use Google Translate web API (unofficial, for demo/dev use)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(googleLang)}&dt=t&q=${encodeURIComponent(text)}`;
    
    console.log('Translation request:', { text: text.substring(0, 50), targetLang: googleLang });
    
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!res.ok) {
      console.error('Translation API error:', res.status, res.statusText);
      return NextResponse.json({ 
        error: `Translation API error: ${res.status} ${res.statusText}` 
      }, { status: 500 });
    }

    const data = await res.json();
    
    // Extract translated text from the response
    let translated = '';
    if (Array.isArray(data) && data[0] && Array.isArray(data[0])) {
      translated = data[0].map((seg: any) => seg[0]).join('');
    } else if (data[0] && data[0][0] && data[0][0][0]) {
      translated = data[0][0][0];
    } else {
      console.error('Unexpected translation response format:', data);
      return NextResponse.json({ error: 'Invalid translation response' }, { status: 500 });
    }

    // If translation failed or returned empty, return original text
    if (!translated || translated.trim() === '') {
      console.warn('Translation returned empty result, returning original text');
      translated = text;
    }

    console.log('Translation successful:', { 
      original: text.substring(0, 50), 
      translated: translated.substring(0, 50) 
    });

    return NextResponse.json({ 
      translated: translated, // Use 'translated' to match the TTS code expectation
      translatedText: translated, // Keep both for compatibility
      originalText: text,
      targetLanguage: googleLang,
      detectedLanguage: data[2] || 'auto',
      success: true
    });
  } catch (e: any) {
    console.error('Translation error:', e);
    return NextResponse.json({ 
      error: e.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
} 