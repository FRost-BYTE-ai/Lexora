import { LanguageMode } from '../types';

export interface SpeechRecognitionHookOptions {
  onResult: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  language?: LanguageMode;
}

// Check if browser supports Web Speech API
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

// Convert Tamil script into phonetic English Latin script (Tanglish)
export function transliterateTamilToTanglish(text: string): string {
  if (!text) return '';

  const vowels: Record<string, string> = {
    '\u0B85': 'a',
    '\u0B86': 'aa',
    '\u0B87': 'i',
    '\u0B88': 'ee',
    '\u0B89': 'u',
    '\u0B8A': 'oo',
    '\u0B8E': 'e',
    '\u0B8F': 'ae',
    '\u0B90': 'ai',
    '\u0B92': 'o',
    '\u0B93': 'oa',
    '\u0B94': 'au',
    '\u0B83': 'h'
  };

  const consonants: Record<string, string> = {
    '\u0B95': 'k',
    '\u0B99': 'ng',
    '\u0B9A': 'ch',
    '\u0B9C': 'j',
    '\u0B9E': 'nj',
    '\u0B9F': 't',
    '\u0BA3': 'n',
    '\u0BA4': 'th',
    '\u0BA8': 'n',
    '\u0BA9': 'n',
    '\u0BAA': 'p',
    '\u0BAE': 'm',
    '\u0BAF': 'y',
    '\u0BB0': 'r',
    '\u0BB1': 'r',
    '\u0BB2': 'l',
    '\u0BB3': 'l',
    '\u0BB4': 'zh',
    '\u0BB5': 'v',
    '\u0BB6': 'sh',
    '\u0BB7': 'sh',
    '\u0BB8': 's',
    '\u0BB9': 'h'
  };

  const vowelSigns: Record<string, string> = {
    '\u0BBE': 'aa',
    '\u0BBF': 'i',
    '\u0BC0': 'ee',
    '\u0BC1': 'u',
    '\u0BC2': 'oo',
    '\u0BC6': 'e',
    '\u0BC7': 'ae',
    '\u0BC8': 'ai',
    '\u0BCA': 'o',
    '\u0BCB': 'oa',
    '\u0BCC': 'au'
  };

  const virama = '\u0BCD'; // ் (pulli)

  let result = '';
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (vowels[char]) {
      result += vowels[char];
      i++;
    } else if (consonants[char]) {
      const baseConsonant = consonants[char];
      if (nextChar === virama) {
        // Pure consonant with pulli
        result += baseConsonant;
        i += 2;
      } else if (nextChar && vowelSigns[nextChar]) {
        // Consonant + vowel sign
        result += baseConsonant + vowelSigns[nextChar];
        i += 2;
      } else {
        // Inherent 'a' vowel
        result += baseConsonant + 'a';
        i++;
      }
    } else {
      // Numbers, punctuation, Latin English text
      result += char;
      i++;
    }
  }

  // Soften double 'a' at end and common English fixes
  return result
    .replace(/thth/g, 'tth')
    .replace(/kk/g, 'kk')
    .replace(/pp/g, 'pp');
}

export async function startSpeechRecognition(options: SpeechRecognitionHookOptions) {
  if (!isSpeechRecognitionSupported()) {
    options.onError?.('Speech recognition is not supported in this browser environment.');
    return null;
  }

  try {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    }
  } catch (err: any) {
    console.warn('Microphone permission denied or unavailable:', err);
    options.onError?.('Microphone permission denied. Please allow microphone access in browser settings.');
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognition) {
    options.onError?.('Speech recognition API unavailable.');
    return null;
  }

  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  
  // Set speech recognition language
  if (options.language === 'ta') {
    recognition.lang = 'ta-IN'; // Tamil (India)
  } else if (options.language === 'hi') {
    recognition.lang = 'hi-IN'; // Hindi (India)
  } else if (options.language === 'tanglish') {
    recognition.lang = 'ta-IN'; // Robust acoustic model for Indian Tamil spoken words
  } else {
    recognition.lang = 'en-IN'; // Indian English
  }

  let accumulatedFinal = '';
  let lastEmitted = '';

  recognition.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      if (res.isFinal) {
        accumulatedFinal += res[0].transcript + ' ';
      } else {
        interim += res[0].transcript;
      }
    }

    const currentText = (accumulatedFinal + interim).trim();
    if (currentText && currentText !== lastEmitted) {
      lastEmitted = currentText;
      const processed = options.language === 'tanglish' ? transliterateTamilToTanglish(currentText) : currentText;
      options.onResult(processed);
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    if (event.error === 'no-speech') {
      return;
    }
    options.onError?.(event.error === 'not-allowed' ? 'Microphone permission denied.' : `Speech error: ${event.error}`);
  };

  recognition.onend = () => {
    if (accumulatedFinal) {
      const processed = options.language === 'tanglish' ? transliterateTamilToTanglish(accumulatedFinal) : accumulatedFinal;
      options.onResult(processed.trim());
    }
    options.onEnd?.();
  };

  try {
    recognition.start();
    return recognition;
  } catch (err: any) {
    console.warn('Failed to start speech recognition', err);
    options.onError?.(err?.message || 'Could not access microphone');
    return null;
  }
}

export function speakLegalText(text: string, language: LanguageMode = 'ta', onFinish?: () => void, rate: number = 0.95): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    onFinish?.();
    return () => {};
  }

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  // Strip Markdown characters for clean vocalization
  const cleanedText = text
    .replace(/[#*`_>~-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .slice(0, 800); // Speak first 800 chars comfortably

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.rate = rate; // Measured pace for elder comprehension and accessibility

  const voices = window.speechSynthesis.getVoices();
  if (language === 'ta') {
    const tamilVoice = voices.find(v => v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil'));
    if (tamilVoice) {
      utterance.voice = tamilVoice;
    }
    utterance.lang = 'ta-IN';
  } else if (language === 'hi') {
    const hindiVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    utterance.lang = 'hi-IN';
  } else {
    // Tanglish and English use en-IN for natural voice vocalization of English/Tanglish text
    const indianEnglishVoice = voices.find(v => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
    if (indianEnglishVoice) {
      utterance.voice = indianEnglishVoice;
    }
    utterance.lang = 'en-IN';
  }

  utterance.onend = () => {
    onFinish?.();
  };

  utterance.onerror = () => {
    onFinish?.();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

