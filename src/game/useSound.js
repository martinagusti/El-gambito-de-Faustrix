import { useCallback, useEffect, useRef, useState } from 'react';

const preference = 'fausto.sound-enabled';
const sounds = {
  move: ['/sounds/move.mp3', 0.55], capture: ['/sounds/drop_001.wav', 0.5],
  select: ['/sounds/click_001.wav', 0.2], click: ['/sounds/click_001.wav', 0.25],
  send: ['/sounds/glass_001.wav', 0.35], reply: ['/sounds/confirmation_001.wav', 0.4],
  analysis: ['/sounds/confirmation_003.wav', 0.35], check: ['/sounds/bong_001.wav', 0.35],
  win: ['/sounds/confirmation_003.wav', 0.55], loss: ['/sounds/bong_001.wav', 0.4], draw: ['/sounds/confirmation_001.wav', 0.35],
};

export function useSound() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(preference) !== 'false'; } catch { return true; }
  });
  const enabledRef = useRef(enabled);
  const playing = useRef(new Set());
  const timers = useRef(new Set());
  const setSoundEnabled = useCallback(value => {
    enabledRef.current = value;
    setEnabled(value);
    try { localStorage.setItem(preference, String(value)); } catch { /* Preference still applies this session. */ }
    if (!value) {
      for (const timer of timers.current) clearTimeout(timer);
      timers.current.clear();
      for (const audio of playing.current) { audio.pause(); audio.currentTime = 0; }
      playing.current.clear();
    }
  }, []);
  const play = useCallback((name, delay = 0) => {
    if (!enabledRef.current || !sounds[name]) return;
    const run = () => {
      if (!enabledRef.current) return;
      const [path, volume] = sounds[name];
      const audio = new Audio(path);
      audio.volume = volume;
      playing.current.add(audio);
      const dispose = () => playing.current.delete(audio);
      audio.addEventListener('ended', dispose, { once: true });
      audio.addEventListener('error', dispose, { once: true });
      audio.play().catch(dispose);
    };
    if (!delay) return run();
    const timer = setTimeout(() => { timers.current.delete(timer); run(); }, delay);
    timers.current.add(timer);
  }, []);
  useEffect(() => {
    const pending = timers.current;
    const active = playing.current;
    return () => { for (const timer of pending) clearTimeout(timer); for (const audio of active) audio.pause(); };
  }, []);
  return { enabled, setEnabled: setSoundEnabled, play };
}
