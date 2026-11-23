import { useEffect, useRef, useState } from 'react';
import { analyze } from '../engine/analyze.js';

export function useCoach(position, level, mentor, playSound = () => {}, automatic = false, waitForRival = false, finished = false) {
  const [messages, setMessages] = useState([]);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');
  const [magicLimit, setMagicLimit] = useState(null);
  const active = useRef(null);
  const activeMode = useRef(null);
  const automaticAttempt = useRef(null);
  const revision = position.positionRevision;
  const current = result?.revision === revision ? result : null;
  useEffect(() => {
    setPhase('');
    setError('');
    setMagicLimit(null);
    return () => { active.current?.abort(); active.current = null; activeMode.current = null; };
  }, [position.gameId, revision]);

  useEffect(() => {
    active.current?.abort();
    active.current = null;
    activeMode.current = null;
    setPhase('');
    setError('');
    setMessages([]);
  }, [mentor]);

  async function request({ question, candidate = null, comparison = null, local = false, kind = null, auto = false }) {
    if (active.current) {
      if (!auto && activeMode.current === 'auto') { active.current.abort(); active.current = null; activeMode.current = null; }
      else return;
    }
    if (!local) playSound('send');
    const controller = new AbortController();
    active.current = controller;
    activeMode.current = auto ? 'auto' : local ? 'local' : 'coach';
    const { signal } = controller;
    const recent = messages.filter(message => message.gameId === position.gameId && message.revision === revision && message.level === level).slice(-6);
    setError('');
    setPhase(local ? 'local' : 'Analizando posición…');
    if (!local) setMessages(previous => [...previous, { role: 'user', text: question, revision, level, gameId: position.gameId }].slice(-40));
    try {
      const analysis = await analyze(position, candidate, signal);
      const second = comparison ? (await analyze(position, comparison, signal)).candidateLine : null;
      const comparisonLine = second ? { ...second, id: 'comparison' } : null;
      signal.throwIfAborted();
      setResult({ revision, analysis: { ...analysis, comparisonLine } });
      if (local) { if (!auto) playSound('analysis'); return; }
      setPhase('Preparando explicación…');
      const response = await fetch('/api/coach/ask', { method: 'POST', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...position, question, candidateUci: candidate, comparisonUci: comparison,
          level, mentor, analysis: { ...analysis, comparisonLine }, recentMessages: recent.map(({ role, text, data, kind }) => ({ role, text: kind === 'hint' ? (data?.hint || text) : text })) }) });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'MAGIC_LIMIT') setMagicLimit(data.period || 'day');
        throw new Error(data.error);
      }
      if (!signal.aborted && data.positionRevision === revision) {
        playSound('reply');
        setMessages(previous => [...previous, { role: 'assistant', text: data.explanation, data, kind, level, lines: [...analysis.bestLines, analysis.candidateLine, comparisonLine].filter(Boolean), revision, gameId: position.gameId }].slice(-40));
      }
    } catch (cause) {
      if (!signal.aborted) setError(cause.message === 'Failed to fetch' ? 'No se pudo conectar con el profesor.' : cause.message);
    } finally {
      if (active.current === controller) { active.current = null; activeMode.current = null; setPhase(''); }
    }
  }

  useEffect(() => {
    if (!automatic) {
      automaticAttempt.current = null;
      if (activeMode.current === 'auto') { active.current?.abort(); active.current = null; activeMode.current = null; setPhase(''); }
      return;
    }
    if (finished || waitForRival || active.current || current || phase) return;
    const key = position.gameId + ':' + revision;
    if (automaticAttempt.current === key) return;
    automaticAttempt.current = key;
    request({ local: true, auto: true });
  }, [automatic, waitForRival, finished, position.gameId, revision, current, phase]);

  return { messages: messages.filter(message => message.gameId === position.gameId), current, phase, error, magicLimit, request,
    cancel: () => { active.current?.abort(); active.current = null; activeMode.current = null; setPhase(''); } };
}
