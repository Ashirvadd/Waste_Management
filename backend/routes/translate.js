const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Validation schema for translation
const translationSchema = Joi.object({
  text: Joi.string().required(),
  sourceLanguage: Joi.string().required(),
  targetLanguage: Joi.string().required()
});

// Simple translation mapping for demo purposes
// In production, integrate with Google Translate API, DeepL, or Groq
const translationMap = {
  // Kannada to English
  'kn-en': {
    'ನಮಸ್ಕಾರ': 'Hello',
    'ಧನ್ಯವಾದ': 'Thank you',
    'ಮನೆ': 'House',
    'ಕಸ': 'Garbage',
    'ಸಂಗ್ರಹಣೆ': 'Collection',
    'ಮನೆ ಲಾಕ್ ಆಗಿತ್ತು': 'House was locked',
    'ಪ್ರತಿಕ್ರಿಯೆ ಇಲ್ಲ': 'No response',
    'ಇಂದು ಸಂಗ್ರಹಣೆ ಇಲ್ಲ': 'No collection today',
    'ನಾಳೆ ಬನ್ನಿ': 'Come tomorrow',
    'ಮನೆ ಖಾಲಿ': 'House is empty'
  },
  // Hindi to English
  'hi-en': {
    'नमस्ते': 'Hello',
    'धन्यवाद': 'Thank you',
    'घर': 'House',
    'कचरा': 'Garbage',
    'संग्रहण': 'Collection',
    'घर बंद था': 'House was locked',
    'कोई जवाब नहीं': 'No response',
    'आज संग्रहण नहीं': 'No collection today',
    'कल आइए': 'Come tomorrow',
    'घर खाली है': 'House is empty'
  },
  // Tamil to English
  'ta-en': {
    'வணக்கம்': 'Hello',
    'நன்றி': 'Thank you',
    'வீடு': 'House',
    'குப்பை': 'Garbage',
    'சேகரிப்பு': 'Collection',
    'வீடு பூட்டப்பட்டிருந்தது': 'House was locked',
    'பதில் இல்லை': 'No response',
    'இன்று சேகரிப்பு இல்லை': 'No collection today',
    'நாளை வாருங்கள்': 'Come tomorrow',
    'வீடு காலியாக உள்ளது': 'House is empty'
  },
  // Telugu to English
  'te-en': {
    'నమస్కారం': 'Hello',
    'ధన్యవాదాలు': 'Thank you',
    'ఇల్లు': 'House',
    'చెత్త': 'Garbage',
    'సేకరణ': 'Collection',
    'ఇల్లు లాక్ చేయబడింది': 'House was locked',
    'ప్రతిస్పందన లేదు': 'No response',
    'ఈరోజు సేకరణ లేదు': 'No collection today',
    'రేపు రండి': 'Come tomorrow',
    'ఇల్లు ఖాళీగా ఉంది': 'House is empty'
  }
};

// Translate text
router.post('/', async (req, res) => {
  try {
    const { error, value } = translationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { text, sourceLanguage, targetLanguage } = value;

    // If same language, return original text
    if (sourceLanguage === targetLanguage) {
      return res.json({
        success: true,
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        originalText: text
      });
    }

    // For demo purposes, use simple mapping
    // In production, integrate with actual translation API
    let translatedText = text;

    // Check if we have a mapping for this language pair
    const languagePair = `${sourceLanguage}-${targetLanguage}`;
    if (translationMap[languagePair]) {
      // Simple word-by-word translation
      let result = text;
      for (const [source, target] of Object.entries(translationMap[languagePair])) {
        result = result.replace(new RegExp(source, 'gi'), target);
      }
      translatedText = result;
    } else {
      // For unsupported language pairs, try to use a translation service
      // This is where you would integrate with Google Translate API, DeepL, etc.
      
      // For now, return a placeholder response
      translatedText = `[Translated from ${sourceLanguage} to ${targetLanguage}]: ${text}`;
    }

    res.json({
      success: true,
      translatedText,
      sourceLanguage,
      targetLanguage,
      originalText: text
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Get supported languages
router.get('/languages', async (req, res) => {
  try {
    const supportedLanguages = [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
    ];

    res.json({
      success: true,
      languages: supportedLanguages
    });

  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

// Detect language
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Simple language detection based on character sets
    // In production, use a proper language detection service
    let detectedLanguage = 'en';

    // Check for Kannada characters
    if (/[\u0C80-\u0CFF]/.test(text)) {
      detectedLanguage = 'kn';
    }
    // Check for Hindi characters
    else if (/[\u0900-\u097F]/.test(text)) {
      detectedLanguage = 'hi';
    }
    // Check for Tamil characters
    else if (/[\u0B80-\u0BFF]/.test(text)) {
      detectedLanguage = 'ta';
    }
    // Check for Telugu characters
    else if (/[\u0C00-\u0C7F]/.test(text)) {
      detectedLanguage = 'te';
    }
    // Check for Malayalam characters
    else if (/[\u0D00-\u0D7F]/.test(text)) {
      detectedLanguage = 'ml';
    }
    // Check for Bengali characters
    else if (/[\u0980-\u09FF]/.test(text)) {
      detectedLanguage = 'bn';
    }
    // Check for Marathi characters
    else if (/[\u0900-\u097F]/.test(text)) {
      detectedLanguage = 'mr';
    }
    // Check for Gujarati characters
    else if (/[\u0A80-\u0AFF]/.test(text)) {
      detectedLanguage = 'gu';
    }
    // Check for Punjabi characters
    else if (/[\u0A00-\u0A7F]/.test(text)) {
      detectedLanguage = 'pa';
    }

    res.json({
      success: true,
      detectedLanguage,
      confidence: 0.8 // Placeholder confidence score
    });

  } catch (error) {
    console.error('Language detection error:', error);
    res.status(500).json({ error: 'Language detection failed' });
  }
});

module.exports = router; 