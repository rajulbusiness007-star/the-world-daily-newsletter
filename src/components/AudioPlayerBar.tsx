import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Headphones, 
  SlidersHorizontal, 
  X, 
  ChevronUp, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { PlaylistItem } from '../hooks/useTextToSpeech.js';

interface AudioPlayerBarProps {
  isPlaying: boolean;
  isPaused: boolean;
  currentTrack: PlaylistItem | null;
  currentIndex: number;
  playlistLength: number;
  playbackRate: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string;
  progress: number;
  onTogglePlayPause: () => void;
  onStop: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  onSetRate: (rate: number) => void;
  onSetVoice: (voiceURI: string) => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  isPlaying,
  isPaused,
  currentTrack,
  currentIndex,
  playlistLength,
  playbackRate,
  availableVoices,
  selectedVoiceURI,
  progress,
  onTogglePlayPause,
  onStop,
  onSkipNext,
  onSkipPrevious,
  onSetRate,
  onSetVoice
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // If nothing is playing or loaded, hide the player
  if (!currentTrack && !isPlaying && !isPaused) {
    return null;
  }

  const rates = [0.75, 1.0, 1.25, 1.5, 2.0];

  const cycleRate = () => {
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    onSetRate(rates[nextIdx]);
  };

  // Filter english voices or clean label
  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
  const voicesToDisplay = englishVoices.length > 0 ? englishVoices : availableVoices;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-xl z-40 transition-all duration-300">
      <div className="bg-stone-900/95 dark:bg-stone-950/95 backdrop-blur-md text-stone-100 border border-stone-700/80 dark:border-stone-800 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-white/10">
        
        {/* Progress Hairline */}
        <div className="w-full h-1 bg-stone-800 relative overflow-hidden">
          <div 
            className="h-full bg-amber-500 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(3, progress))}%` }}
          />
        </div>

        {/* Minimized Pill Bar */}
        {isMinimized ? (
          <div className="px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <Headphones className="w-4 h-4 shrink-0" />
              </span>
              <p className="text-xs font-serif truncate text-stone-200">
                {currentTrack?.title || 'Daily Audio Briefing'}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onTogglePlayPause}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-200 hover:text-white transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
                title="Expand audio player"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={onStop}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-rose-400 transition-colors"
                title="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Full Broadcast Bar */
          <div className="p-4 space-y-3">
            {/* Header: Track Status, Playlist Index & Minimize/Close */}
            <div className="flex items-center justify-between gap-2 text-xs font-sans">
              <div className="flex items-center gap-2">
                {/* Equalizer Soundwave Animation */}
                <div className="flex items-end gap-0.5 h-3.5 px-1 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                  <span className={`w-0.5 bg-amber-400 rounded-full ${isPlaying && !isPaused ? 'animate-pulse h-3' : 'h-1.5'}`} />
                  <span className={`w-0.5 bg-amber-400 rounded-full ${isPlaying && !isPaused ? 'animate-bounce h-3.5' : 'h-2'}`} />
                  <span className={`w-0.5 bg-amber-400 rounded-full ${isPlaying && !isPaused ? 'animate-pulse h-2.5' : 'h-1'}`} />
                </div>
                <span className="font-bold uppercase tracking-wider text-[11px] text-amber-400">
                  {isPlaying && !isPaused ? 'Now Speaking' : isPaused ? 'Audio Paused' : 'Daily Audio'}
                </span>
                {playlistLength > 1 && (
                  <>
                    <span className="text-stone-600">·</span>
                    <span className="text-stone-400 text-[11px]">
                      Story {currentIndex + 1} of {playlistLength}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 text-stone-400">
                <button
                  onClick={() => setShowSettings(prev => !prev)}
                  className={`p-1.5 rounded-md hover:bg-stone-800 hover:text-stone-200 transition-colors ${
                    showSettings ? 'text-amber-400 bg-stone-800' : ''
                  }`}
                  title="Voice & Speed Settings"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 rounded-md hover:bg-stone-800 hover:text-stone-200 transition-colors"
                  title="Minimize bar"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onStop}
                  className="p-1.5 rounded-md hover:bg-stone-800 hover:text-rose-400 transition-colors"
                  title="Stop and close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Track Info */}
            <div className="space-y-0.5">
              <h4 className="font-editorial text-sm sm:text-base font-bold text-stone-100 line-clamp-1">
                {currentTrack?.title}
              </h4>
              {currentTrack?.subtitle && (
                <p className="text-xs font-sans text-stone-400 truncate">
                  {currentTrack.subtitle}
                </p>
              )}
            </div>

            {/* Playback Controls & Speed */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={onSkipPrevious}
                  disabled={currentIndex <= 0 && playlistLength <= 1}
                  className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Previous Story"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={onTogglePlayPause}
                  className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                  title={isPaused ? 'Resume Playback' : 'Pause Playback'}
                >
                  {isPaused ? <Play className="w-5 h-5 fill-current ml-0.5" /> : <Pause className="w-5 h-5 fill-current" />}
                </button>

                <button
                  onClick={onSkipNext}
                  disabled={currentIndex >= playlistLength - 1 && playlistLength > 0}
                  className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Next Story"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                <button
                  onClick={onStop}
                  className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-rose-400 transition-colors"
                  title="Stop"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Speed Toggle Pill */}
                <button
                  onClick={cycleRate}
                  className="px-2.5 py-1 rounded-full text-xs font-bold font-sans bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors cursor-pointer"
                  title="Change playback speed"
                >
                  {playbackRate}x
                </button>
              </div>
            </div>

            {/* Expandable Settings: Voice Selection */}
            {showSettings && (
              <div className="pt-3 border-t border-stone-800 text-xs font-sans space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 flex items-center gap-1.5 font-medium">
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    Speech Voice:
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Offline Web Speech Engine
                  </span>
                </div>

                <select
                  value={selectedVoiceURI}
                  onChange={(e) => onSetVoice(e.target.value)}
                  className="w-full bg-stone-800 text-stone-200 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none truncate"
                >
                  {voicesToDisplay.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                  {voicesToDisplay.length === 0 && (
                    <option value="">Browser Default Voice</option>
                  )}
                </select>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-stone-400">Speech Rate:</span>
                  <div className="flex items-center gap-1">
                    {rates.map(r => (
                      <button
                        key={r}
                        onClick={() => onSetRate(r)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          playbackRate === r 
                            ? 'bg-amber-500 text-stone-950 font-bold' 
                            : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                        }`}
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
