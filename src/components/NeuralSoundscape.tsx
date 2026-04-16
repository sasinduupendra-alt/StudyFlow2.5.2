import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Music, Waves, Coffee, Wind, Headphones } from 'lucide-react';
import { cn } from '../lib/utils';

export default function NeuralSoundscape() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<number>(0);
  const [volume, setVolume] = useState(0.4);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tracks = [
    { name: 'Neural White', icon: Waves, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }, // Placeholder URLs
    { name: 'Cafe Flow', icon: Coffee, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { name: 'Ether Drift', icon: Wind, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { name: 'Deep Focus', icon: Headphones, url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  ];
  
  // Real ambient URLs for masking
  const moodTracks = [
    { name: 'White Noise', icon: Waves, url: 'https://actions.google.com/sounds/v1/water/rain_heavy.ogg' },
    { name: 'Cafe Ambience', icon: Coffee, url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg' },
    { name: 'Deep Space', icon: Wind, url: 'https://actions.google.com/sounds/v1/science_fiction/spaceship_engine_internal.ogg' },
    { name: 'Forest Rain', icon: Music, url: 'https://actions.google.com/sounds/v1/water/rain_on_roof.ogg' },
  ];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log("Audio play error:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const changeTrack = (index: number) => {
    setActiveTrack(index);
    if (audioRef.current) {
      audioRef.current.src = moodTracks[index].url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play error:", e));
      }
    }
  };

  return (
    <div className="bg-[#1C1C1E] border border-white/5 rounded-[32px] p-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
        <Volume2 className="w-24 h-24" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand/10 border border-brand/20 rounded-lg flex items-center justify-center text-brand">
              <Headphones className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Neural Soundscapes</h3>
          </div>
          <button 
            onClick={togglePlay}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              isPlaying ? "bg-brand text-black shadow-[0_0_15px_var(--color-brand-glow)]" : "bg-white/5 text-white/50"
            )}
          >
            {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {moodTracks.map((track, i) => (
            <button
              key={track.name}
              onClick={() => changeTrack(i)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all text-left group/track",
                activeTrack === i 
                  ? "bg-brand/10 border-brand/30" 
                  : "bg-white/5 border-transparent hover:border-white/10"
              )}
            >
              <track.icon className={cn(
                "w-4 h-4 transition-colors",
                activeTrack === i ? "text-brand" : "text-[#8E8E93] group-hover/track:text-white"
              )} />
              <span className={cn(
                "text-xs font-bold whitespace-nowrap",
                activeTrack === i ? "text-white" : "text-[#8E8E93] group-hover/track:text-white"
              )}>{track.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 px-2">
          <VolumeX className="w-3 h-3 text-[#8E8E93]" />
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand"
          />
          <Volume2 className="w-3 h-3 text-[#8E8E93]" />
        </div>

        <audio 
          ref={audioRef}
          src={moodTracks[activeTrack].url}
          loop
        />
      </div>
    </div>
  );
}
