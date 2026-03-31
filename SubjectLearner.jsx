import { useState, useRef, useEffect, useCallback } from 'react';
import { streamGemini } from '../services/gemini.js';
import { renderMarkdown } from '../utils/markdown.js';

const SYSTEM = `You are a world-class educator and curriculum designer. When a user wants to learn a subject or academic field:
1. Begin with a compelling overview of the field and why it matters.
2. Identify prerequisites (if any) the learner should have first.
3. Create a structured, phased learning roadmap (Phase 1: Foundations → Phase 2: Core Concepts → Phase 3: Advanced Topics → Phase 4: Mastery/Research).
4. For each phase, provide:
   - Key topics to master
   - Estimated time commitment
   - Best textbooks with author names and ISBNs where possible
   - Top online courses (Coursera, edX, MIT OCW, Stanford Online, etc.) with direct course names
   - YouTube channels or playlists
   - Free lecture notes or PDFs if available
5. End with a "Beyond the Curriculum" section: competitions, journals, conferences, communities.
Use rich markdown with headers, bullet points, and tables. Be specific with real resource names and URLs where known.`;

export default function SubjectLearner() {
  const [query, setQuery]       = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus]     = useState('idle');
  const [history, setHistory]   = useState([]);
  const abortRef = useRef(false);
  const responseRef = useRef('');

  useEffect(() => {
    window.electronAPI?.getHistory('subject').then(h => setHistory(h || []));
  }, []);

  const run = useCallback(async (q = query) => {
    if (!q.trim() || status === 'loading') return;
    abortRef.current = false;
    setStatus('loading');
    setResponse('');
    responseRef.current = '';

    try {
      const prompt = `I want to learn: ${q}\n\nPlease create a complete structured learning path and resource guide for me.`;
      const gen = streamGemini({ prompt, systemPrompt: SYSTEM, useSearch: true });
      for await (const chunk of gen) {
        if (abortRef.current) break;
        responseRef.current += chunk;
        setResponse(responseRef.current);
      }
      setStatus('done');
      const entry = { query: q, preview: responseRef.current.slice(0, 120) + '…' };
      await window.electronAPI?.saveHistory('subject', entry);
      setHistory(prev => [{ ...entry, date: new Date().toISOString() }, ...prev].slice(0, 50));
    } catch (e) {
      setStatus('error');
      setResponse(`**Error:** ${e.message}`);
    }
  }, [query, status]);

  return (
    <div className="page">
      <div className="page-main">
        <div className="page-header">
          <div className="page-icon-wrap" style={{ background: 'rgba(80,200,122,0.15)' }}>📚</div>
          <h1 className="page-title" style={{ color: 'var(--col-subject)' }}>Subject Learner</h1>
          <p className="page-subtitle">Enter any academic subject or field and receive a complete structured learning roadmap with curated resources.</p>
        </div>

        <div className="input-wrap">
          <textarea
            className="input-box"
            rows={3}
            placeholder="e.g. Quantum Mechanics, Behavioral Economics, Molecular Biology, Machine Learning Theory…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); }}
          />
          <div className="input-row">
            {status === 'idle'    && <span className="status-idle">Press Ctrl+Enter or click Generate</span>}
            {status === 'loading' && <span className="status-loading"><div className="spinner" /> Crafting your learning path…</span>}
            {status === 'done'    && <span className="status-done">✓ Learning path ready</span>}
            {status === 'error'   && <span className="status-error">⚠ Error occurred</span>}
            {status === 'loading' && (
              <button className="btn btn-secondary btn-sm" onClick={() => { abortRef.current = true; setStatus('idle'); }}>Stop</button>
            )}
            <button
              className="btn btn-primary"
              style={{ background: 'var(--col-subject)', color: '#001a08', boxShadow: '0 2px 12px rgba(80,200,122,0.3)' }}
              disabled={status === 'loading' || !query.trim()}
              onClick={() => run()}
            >
              📚 Generate Path
            </button>
          </div>
        </div>

        {response && (
          <div className="response-area">
            <div className="response-box fade-up">
              <div className="response-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(response) }} />
              {status === 'loading' && <span className="cursor" />}
            </div>
          </div>
        )}
      </div>

      <aside className="history-panel">
        <div className="history-header">
          <span className="history-title">History</span>
          <button className="btn btn-ghost btn-sm" onClick={async () => { await window.electronAPI?.clearHistory('subject'); setHistory([]); }}>Clear</button>
        </div>
        <div className="history-list">
          {history.length === 0
            ? <p className="history-empty">No history yet</p>
            : history.map((h, i) => (
              <div key={i} className="history-item" onClick={() => { setQuery(h.query); run(h.query); }}>
                <div className="history-item-q">{h.query}</div>
                <div className="history-item-d">{h.date ? new Date(h.date).toLocaleDateString() : ''}</div>
              </div>
            ))
          }
        </div>
      </aside>
    </div>
  );
}
