import { useState, useRef, useEffect, useCallback } from 'react';
import { streamGemini } from '../services/gemini.js';
import { renderMarkdown } from '../utils/markdown.js';

const SYSTEM = `You are a world-class skills coach and curriculum designer. When a user wants to learn a practical skill:
1. Start with a brief overview of the skill and its real-world value.
2. Break the skill into 4–8 distinct sub-skills that must be mastered.
3. For each sub-skill, provide:
   - A clear explanation of what it is and why it matters
   - Difficulty level (Beginner / Intermediate / Advanced)
   - Specific resources: online courses, tutorials, books, tools/software
   - Practice exercises and mini-projects to build competency
   - Estimated time to reach proficiency
4. Create an overall recommended learning sequence showing the order to learn sub-skills.
5. Add a "Projects & Portfolio" section with 3–5 real projects that demonstrate mastery.
6. Add a "Community & Career" section with communities, job titles, certifications, and salary ranges.
Use rich markdown with headers, tables, and bullet points. Be specific with real resource names.`;

export default function SkillLearner() {
  const [query, setQuery]       = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus]     = useState('idle');
  const [history, setHistory]   = useState([]);
  const abortRef = useRef(false);
  const responseRef = useRef('');

  useEffect(() => {
    window.electronAPI?.getHistory('skill').then(h => setHistory(h || []));
  }, []);

  const run = useCallback(async (q = query) => {
    if (!q.trim() || status === 'loading') return;
    abortRef.current = false;
    setStatus('loading');
    setResponse('');
    responseRef.current = '';

    try {
      const prompt = `I want to learn the skill: ${q}\n\nPlease break this skill down into sub-skills and create a complete learning plan with resources for each sub-skill.`;
      const gen = streamGemini({ prompt, systemPrompt: SYSTEM, useSearch: true });
      for await (const chunk of gen) {
        if (abortRef.current) break;
        responseRef.current += chunk;
        setResponse(responseRef.current);
      }
      setStatus('done');
      const entry = { query: q, preview: responseRef.current.slice(0, 120) + '…' };
      await window.electronAPI?.saveHistory('skill', entry);
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
          <div className="page-icon-wrap" style={{ background: 'rgba(224,107,107,0.15)' }}>🛠️</div>
          <h1 className="page-title" style={{ color: 'var(--col-skill)' }}>Skill Learner</h1>
          <p className="page-subtitle">Enter any skill and receive a full sub-skill breakdown with personalised resources, practice projects, and learning sequence.</p>
        </div>

        <div className="input-wrap">
          <textarea
            className="input-box"
            rows={3}
            placeholder="e.g. Financial Modelling, Machine Learning, Photography, Web Development, Public Speaking…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); }}
          />
          <div className="input-row">
            {status === 'idle'    && <span className="status-idle">Press Ctrl+Enter or click Analyse</span>}
            {status === 'loading' && <span className="status-loading"><div className="spinner" /> Breaking down your skill…</span>}
            {status === 'done'    && <span className="status-done">✓ Skill plan ready</span>}
            {status === 'error'   && <span className="status-error">⚠ Error occurred</span>}
            {status === 'loading' && (
              <button className="btn btn-secondary btn-sm" onClick={() => { abortRef.current = true; setStatus('idle'); }}>Stop</button>
            )}
            <button
              className="btn btn-primary"
              style={{ background: 'var(--col-skill)', color: '#1a0000', boxShadow: '0 2px 12px rgba(224,107,107,0.3)' }}
              disabled={status === 'loading' || !query.trim()}
              onClick={() => run()}
            >
              🛠️ Analyse Skill
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
          <button className="btn btn-ghost btn-sm" onClick={async () => { await window.electronAPI?.clearHistory('skill'); setHistory([]); }}>Clear</button>
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
