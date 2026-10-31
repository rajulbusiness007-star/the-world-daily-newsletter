import { useState, useEffect, useRef, useCallback } from 'react';
import { Article, DailyEdition } from '../types.js';

export interface PlaylistItem {
  id: string;
  title: string;
  subtitle?: string;
  text: string;
  articleId?: string;
}

export interface UseTextToSpeechReturn {
  isSupported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  currentTrack: PlaylistItem | null;
  currentIndex: number;
  playlist: PlaylistItem[];
  playbackRate: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  currentSentenceProgress: number;
  playArticle: (article: Article) => void;
  playEdition: (edition: DailyEdition) => void;
  playSection: (title: string, subtitle: string, text: string, id: string) => void;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  skipNext: () => void;
  skipPrevious: () => void;
  setRate: (rate: number) => void;
  setVoice: (voiceURI: string) => void;
}

// Split large text blocks into comfortable spoken phrases/sentences to avoid browser SpeechSynthesis cutoffs
function splitTextIntoSentences(text: string): string[] {
  if (!text) return [];
  // Clean markdown or unwanted formatting
  const cleaned = text
    .replace(/\[\d+\]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Split by sentence terminators
  const rawSentences = cleaned.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [cleaned];
  const results: string[] = [];

  for (const s of rawSentences) {
    const trimmed = s.trim();
    if (trimmed.length > 0) {
      if (trimmed.length > 200) {
        // Subdivide unusually long run-on sentences at commas or semicolons
        const sub = trimmed.split(/([,;:]\s+)/);
        let curr = '';
        for (const part of sub) {
          if ((curr + part).length > 150) {
            if (curr.trim()) results.push(curr.trim());
            curr = part;
          } else {
            curr += part;
          }
        }
        if (curr.trim()) results.push(curr.trim());
      } else {
        results.push(trimmed);
      }
    }
  }

  return results.length > 0 ? results : [cleaned];
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    const saved = localStorage.getItem('twd_tts_rate');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    return localStorage.getItem('twd_tts_voice') || '';
  });
  const [currentSentenceProgress, setCurrentSentenceProgress] = useState(0);

  // Queue of sentence chunks for the current track
  const sentenceQueueRef = useRef<string[]>([]);
  const sentenceIndexRef = useRef<number>(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);

  // Sync refs for event handlers
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Initialize SpeechSynthesis and populate available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setIsSupported(true);
      synthRef.current = window.speechSynthesis;

      const updateVoices = () => {
        if (!synthRef.current) return;
        const voices = synthRef.current.getVoices();
        if (voices && voices.length > 0) {
          setAvailableVoices(voices);

          // If no voice is stored, pick an Indian English, UK English, or US English natural voice
          if (!localStorage.getItem('twd_tts_voice')) {
            const preferred = voices.find(v => 
              v.lang.startsWith('en-IN') || 
              (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))) ||
              v.lang === 'en-GB' || 
              v.lang === 'en-US'
            ) || voices[0];

            if (preferred) {
              setSelectedVoiceURI(preferred.voiceURI);
            }
          }
        }
      };

      updateVoices();
      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = updateVoices;
      }
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Speak the next sentence in the current track queue
  const speakNextSentence = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) return;

    if (sentenceIndexRef.current >= sentenceQueueRef.current.length) {
      // Completed all sentences in this track: advance to next track in playlist if available
      setCurrentIndex(prev => {
        const nextIdx = prev + 1;
        return nextIdx;
      });
      return;
    }

    const textToSpeak = sentenceQueueRef.current[sentenceIndexRef.current];
    const totalSentences = sentenceQueueRef.current.length;
    setCurrentSentenceProgress(Math.round(((sentenceIndexRef.current + 1) / totalSentences) * 100));

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;

    // Apply voice
    if (selectedVoiceURI && availableVoices.length > 0) {
      const chosen = availableVoices.find(v => v.voiceURI === selectedVoiceURI);
      if (chosen) utterance.voice = chosen;
    }
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      if (!isPlayingRef.current || isPausedRef.current) return;
      sentenceIndexRef.current += 1;
      speakNextSentence();
    };

    utterance.onerror = (e) => {
      // If manually canceled (e.g. user hit stop or skipped), ignore
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      console.warn('Speech synthesis utterance error:', e.error);
      sentenceIndexRef.current += 1;
      if (isPlayingRef.current && !isPausedRef.current) {
        speakNextSentence();
      }
    };

    try {
      synth.speak(utterance);
    } catch (err) {
      console.error('Failed to speak utterance:', err);
    }
  }, [availableVoices, selectedVoiceURI, playbackRate]);

  // When currentIndex changes, start speaking that track
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < playlist.length) {
      const track = playlist[currentIndex];
      const sentences = splitTextIntoSentences(track.text);
      sentenceQueueRef.current = sentences;
      sentenceIndexRef.current = 0;
      setCurrentSentenceProgress(0);

      if (synthRef.current) {
        synthRef.current.cancel();
      }

      setIsPlaying(true);
      setIsPaused(false);
      speakNextSentence();
    } else if (currentIndex >= playlist.length && playlist.length > 0) {
      // Reached end of playlist
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentIndex(-1);
      setCurrentSentenceProgress(100);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    }
  }, [currentIndex, playlist, speakNextSentence]);

  // Play a single article
  const playArticle = useCallback((article: Article) => {
    if (!synthRef.current) return;

    let text = `${article.headline}. `;
    text += `Reported by ${article.publisher} in ${article.location || article.country}. `;
    text += `${article.summary}. `;
    if (article.whyItMatters) {
      text += `Why this matters: ${article.whyItMatters}. `;
    }
    if (article.facts && article.facts.length > 0) {
      text += `Key confirmed facts: ${article.facts.join('. ')}. `;
    }

    const item: PlaylistItem = {
      id: `art-${article.id}`,
      articleId: article.id,
      title: article.headline,
      subtitle: `${article.publisher} · ${article.category}`,
      text
    };

    synthRef.current.cancel();
    setPlaylist([item]);
    setCurrentIndex(0);
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  // Play a custom section (Section H or Section G)
  const playSection = useCallback((title: string, subtitle: string, text: string, id: string) => {
    if (!synthRef.current) return;

    const item: PlaylistItem = {
      id,
      title,
      subtitle,
      text
    };

    synthRef.current.cancel();
    setPlaylist([item]);
    setCurrentIndex(0);
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  // Play entire daily edition
  const playEdition = useCallback((edition: DailyEdition) => {
    if (!synthRef.current) return;

    const items: PlaylistItem[] = [];

    // 1. Intro & Five Things to Remember
    const fiveThingsText = edition.sectionH_FiveThingsToRemember
      .map((item, idx) => `Point ${idx + 1}: ${item}`)
      .join('. ');

    items.push({
      id: 'section-h',
      title: "Five Things to Remember Today",
      subtitle: `${edition.formattedDate} · Executive Morning Briefing`,
      text: `Good day. Here is The World Daily Morning Briefing for ${edition.formattedDate}, Edition number ${edition.editionNumber}. We begin with Five Things to Remember Today. ${fiveThingsText}.`
    });

    // 2. The Bigger Picture
    const biggerPicture = edition.sectionG_TheBiggerPicture;
    const confirmedText = biggerPicture.whatIsConfirmed.join('. ');
    const bpText = `Daily Editorial Explainer: The Bigger Picture. ${biggerPicture.headline}. What happened: ${biggerPicture.whatHappened}. Why it happened: ${biggerPicture.whyDidItHappen}. What is confirmed: ${confirmedText}. Why should readers care: ${biggerPicture.whyIndianReadersCare}. Next steps: ${biggerPicture.whatCouldHappenNext}.`;

    items.push({
      id: 'section-g',
      title: biggerPicture.headline,
      subtitle: "The Bigger Picture · Editorial Explainer",
      text: bpText
    });

    // 3. Section A Top 10 Indian Stories
    edition.sectionA_IndiaTop10.forEach((art, idx) => {
      let speech = `Top Story number ${idx + 1} from ${art.publisher}. ${art.headline}. `;
      speech += `${art.summary}. `;
      if (art.whyItMatters) {
        speech += `Why it matters: ${art.whyItMatters}. `;
      }
      items.push({
        id: `section-a-${art.id}`,
        articleId: art.id,
        title: art.headline,
        subtitle: `Section A: India Top Story #${idx + 1} · ${art.publisher}`,
        text: speech
      });
    });

    // 4. Section C World Highlights
    const worldPicks = [
      ...edition.sectionC_WorldTop.unitedStates.slice(0, 1),
      ...edition.sectionC_WorldTop.unitedKingdom.slice(0, 1),
      ...edition.sectionC_WorldTop.europe.slice(0, 1),
      ...edition.sectionC_WorldTop.china.slice(0, 1)
    ];

    worldPicks.forEach((art, idx) => {
      items.push({
        id: `section-c-${art.id}`,
        articleId: art.id,
        title: art.headline,
        subtitle: `Section C: World Briefing · ${art.country} (${art.publisher})`,
        text: `From international coverage in ${art.country}: ${art.headline}. ${art.summary}.`
      });
    });

    synthRef.current.cancel();
    setPlaylist(items);
    setCurrentIndex(0);
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (synthRef.current && isPlaying) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  }, [isPlaying]);

  const resume = useCallback(() => {
    if (synthRef.current && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const togglePlayPause = useCallback(() => {
    if (isPaused) {
      resume();
    } else if (isPlaying) {
      pause();
    }
  }, [isPaused, isPlaying, pause, resume]);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(-1);
    setPlaylist([]);
    setCurrentSentenceProgress(0);
  }, []);

  const skipNext = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      stop();
    }
  }, [currentIndex, playlist.length, stop]);

  const skipPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (currentIndex === 0) {
      // Restart current track
      sentenceIndexRef.current = 0;
      if (synthRef.current) synthRef.current.cancel();
      speakNextSentence();
    }
  }, [currentIndex, speakNextSentence]);

  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    localStorage.setItem('twd_tts_rate', rate.toString());
    // If currently speaking, restart current sentence with the updated speed
    if (isPlaying && !isPaused && synthRef.current) {
      synthRef.current.cancel();
      speakNextSentence();
    }
  }, [isPlaying, isPaused, speakNextSentence]);

  const setVoice = useCallback((voiceURI: string) => {
    setSelectedVoiceURI(voiceURI);
    localStorage.setItem('twd_tts_voice', voiceURI);
    // If currently speaking, apply to upcoming sentences
    if (isPlaying && !isPaused && synthRef.current) {
      synthRef.current.cancel();
      speakNextSentence();
    }
  }, [isPlaying, isPaused, speakNextSentence]);

  const currentTrack = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;

  return {
    isSupported,
    isPlaying,
    isPaused,
    currentTrack,
    currentIndex,
    playlist,
    playbackRate,
    availableVoices,
    selectedVoiceURI,
    currentSentenceProgress,
    playArticle,
    playEdition,
    playSection,
    togglePlayPause,
    pause,
    resume,
    stop,
    skipNext,
    skipPrevious,
    setRate,
    setVoice
  };
}
