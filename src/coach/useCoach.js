import { useEffect, useRef, useState } from 'react';
import { analyze } from '../engine/analyze.js';

export function useCoach(position, level, mentor) {
  const [messages, setMessages] = useState([]);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');
  const active = useRef(null);
  const revision = position.positionRevision;
  const current = result?.revision === revision ? result : null;
  useEffect(() => {
    setPhase('');
    setError('');
    return () => { active.current?.abort(); active.current = null; };
  }, [position.gameId, revision]);

  useEffect(() => {
    active.current?.abort();
    active.current = null;
    setPhase('');
    setError('');
    setMessages([]);
  }, [mentor]);

  async function request({ question, candidate = null, comparison = null, local = false }) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    const { signal } = controller;
    const recent = messages.filter(message => message.gameId === position.gameId && message.revision === revision).slice(-6);
    setError('');
    setPhase('Analizando posición…');
    if (!local) setMessages(previous => [...previous, { role: 'user', text: question, revision, gameId: position.gameId }].slice(-40));
    try {
      const analysis = await analyze(position, candidate, signal);
      const second = comparison ? (await analyze(position, comparison, signal)).candidateLine : null;
      const comparisonLine = second ? { ...second, id: 'comparison' } : null;
      signal.throwIfAborted();
      setResult({ revision, analysis: { ...analysis, comparisonLine } });
      if (local) return;
      setPhase('Preparando explicación…');
      const response = await fetch('/api/coach/ask', { method: 'POST', signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...position, question, candidateUci: candidate, comparisonUci: comparison,
          level, mentor, analysis: { ...analysis, comparisonLine }, recentMessages: recent.map(({ role, text }) => ({ role, text })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (!signal.aborted && data.positionRevision === revision) {
        setMessages(previous => [...previous, { role: 'assistant', text: data.explanation, data, lines: [...analysis.bestLines, analysis.candidateLine, comparisonLine].filter(Boolean), revision, gameId: position.gameId }].slice(-40));
      }
    } catch (cause) {
      if (!signal.aborted) setError(cause.message === 'Failed to fetch' ? 'No se pudo conectar con el profesor.' : cause.message);
    } finally {
      if (active.current === controller) { active.current = null; setPhase(''); }
    }
  }

  return { messages: messages.filter(message => message.gameId === position.gameId), current, phase, error, request,
    cancel: () => { active.current?.abort(); active.current = null; setPhase(''); } };
}
