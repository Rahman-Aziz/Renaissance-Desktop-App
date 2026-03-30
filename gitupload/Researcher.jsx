import { useState, useRef, useEffect, useCallback } from 'react';
import { streamGemini } from '../services/gemini.js';
import { renderMarkdown } from '../utils/markdown.js';

const SYSTEM = `You are a research librarian and academic expert. When a user asks for research on a topic:
1. Start with a field overview: background, significance, and current state.
2. List KEY RESEARCH PAPERS (10–20 papers) in two categories:
   - Seminal / Foundational Works (older, seminal papers that shaped the field)
   - Recent Research (last 5 years; latest advances and breakthroughs)
   For each paper: Title, Author(s), Year, Journal/Conference, DOI or arXiv link if known, and a 1-2 sentence summary.
3. List KEY RESEARCHERS & THOUGHT LEADERS (8–12 people) with:
   - Name, affiliation, primary research area, notable contributions, and where to follow their work (Google Scholar, lab website, Twitter/X)
4. List KEY JOURNALS, CONFERENCES, AND DATABASES relevant to the field.
5. Summarise CURRENT TRENDS & OPEN QUESTIONS — what are the biggest unsolved problems?
6. Add RESOURCES FOR NON-EXPERTS: books, review articles, and accessible summaries.
Use rich markdown with headers, tables, and bullet points. Be as specific as possible with real paper titles and author names.`;

export default function Researcher() {
  const [query, setQuery]       = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus]     = useState('idle');
  const [history, setHistory]   = useState([]);
  const abortRef = useRef(false);
  const responseRef = useRef('');

  useEffect(() => {
    window.electronAPI?.getHistory('research').then(h => setHistory(h || []));
  }, []);

  const run = useCallback(async (q = query) => {
    if (!q.trim() || status === 'loading') return;
    abortRef.current = false;
    setStatus('loading');
    setResponse('');
    responseRef.current = '';

    try {
      const prompt = `Compile comprehensive research on the following topic: ${q}\n\nInclude seminal papers, recent research, key researchers, journals, and open questions.`;
      const gen = streamGemini({ prompt, systemPrompt: SYSTEM, useSearch: true });
      for await (const chunk of gen) {
        if (abortRef.current) break;
        responseRef.current += chunk;
        setResponse(responseRef.current);
      }
      setStatus('done');
      const entry = { query: q, preview: responseRef.current.slice(0, 120) + '…' };
      await window.electronAPI?.saveHistory('research', entry);
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
          <div className="page-icon-wrap" style={{ background: 'rgba(155,112,224,0.15)' }}>🔬</div>
          <h1 className="page-title" style={{ color: 'var(--col-research)' }}>Research Compiler</h1>
          <p className="page-subtitle">Enter any research topic — broad or specific — and receive a comprehensive literature review with key papers, researchers, and open questions.</p>
        </div>

        <div className="input-wrap">
          <textarea
            className="input-box"
            rows={3}
            placeholder="e.g. Transformer architectures in NLP, the gut-brain axis, climate tipping points, dark matter detection…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); }}
          />
          <div className="input-row">
            {status === 'idle'    && <span className="status-idle">Press Ctrl+Enter or click Compile</span>}
            {status === 'loading' && <span className="status-loading"><div className="spinner" /> Compiling research…</span>}
            {status === 'done'    && <span className="status-done">✓ Research compiled</span>}
            {status === 'error'   && <span className="status-error">⚠ Error occurred</span>}
            {status === 'loading' && (
              <button className="btn btn-secondary btn-sm" onClick={() => { abortRef.current = true; setStatus('idle'); }}>Stop</button>
            )}
            <button
              className="btn btn-primary"
              style={{ background: 'var(--col-research)', color: '#0e001a', boxShadow: '0 2px 12px rgba(155,112,224,0.35)' }}
              disabled={status === 'loading' || !query.trim()}
              onClick={() => run()}
            >
              🔬 Compile Research
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
          <button className="btn btn-ghost btn-sm" onClick={async () => { await window.electronAPI?.clearHistory('research'); setHistory([]); }}>Clear</button>
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
