import { useState, useRef, useEffect, useCallback } from 'react';
import { streamGemini, callGemini } from '../services/gemini.js';
import { renderMarkdown } from '../utils/markdown.js';

const SYSTEM = `You are an expert mathematician and educator. When the user asks you to build a mathematical model:
1. Start with a clear introduction explaining what the model is and its real-world applications.
2. Define all variables, parameters, and assumptions precisely.
3. Derive the mathematical equations step by step with clear explanations.
4. Provide numerical examples with concrete numbers.
5. Explain how to implement this model in Microsoft Excel with exact formulas and cell references.
6. Use markdown headings, bullet points, and code blocks for formulas.
Use LaTeX-style notation (write equations in code blocks) for clarity.`;

const EXCEL_SYSTEM = `You are an Excel model architect. Given a mathematical model description, return ONLY valid JSON (no markdown) for an Excel workbook structure.
The JSON must follow this exact schema:
{
  "filename": "ModelName_Renaissance",
  "sheetData": [
    {
      "name": "SheetName",
      "columns": [{"width": 22}, {"width": 18}],
      "rows": [
        {
          "cells": [
            {"value": "Header", "header": true, "align": "center"},
            {"value": 0.05, "format": "0.00%"},
            {"formula": "B2*B3", "format": "#,##0.00"}
          ]
        }
      ]
    }
  ]
}
Include: an Inputs sheet with all parameters (labelled cells + editable values), a Model sheet with formulas referencing the Inputs sheet, and a Summary sheet.
Use real Excel formulas. Return ONLY JSON.`;

export default function ModelBuilder() {
  const [query, setQuery]       = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus]     = useState('idle');
  const [history, setHistory]   = useState([]);
  const [dlInfo, setDlInfo]     = useState(null);
  const responseRef = useRef('');
  const abortRef    = useRef(false);

  useEffect(() => {
    window.electronAPI?.getHistory('model').then(h => setHistory(h || []));
  }, []);

  const run = useCallback(async (q = query) => {
    if (!q.trim() || status === 'loading') return;
    abortRef.current = false;
    setStatus('loading');
    setResponse('');
    setDlInfo(null);
    responseRef.current = '';

    try {
      const gen = streamGemini({ prompt: q, systemPrompt: SYSTEM });
      for await (const chunk of gen) {
        if (abortRef.current) break;
        responseRef.current += chunk;
        setResponse(responseRef.current);
      }
      setStatus('done');

      // Save history
      const entry = { query: q, preview: responseRef.current.slice(0, 120) + '…' };
      await window.electronAPI?.saveHistory('model', entry);
      setHistory(prev => [{ ...entry, date: new Date().toISOString() }, ...prev].slice(0, 50));

      // Generate Excel in background
      generateExcel(q, responseRef.current);
    } catch (e) {
      setStatus('error');
      setResponse(`**Error:** ${e.message}`);
    }
  }, [query, status]);

  const generateExcel = async (q, fullResponse) => {
    try {
      const prompt = `Model description:\n${q}\n\nModel explanation:\n${fullResponse.slice(0, 3000)}\n\nGenerate an Excel workbook JSON for this model.`;
      const json   = await callGemini({ prompt, systemPrompt: EXCEL_SYSTEM, jsonMode: true });
      const result = await window.electronAPI?.generateExcel(json);
      if (result?.success) setDlInfo(result);
    } catch (e) {
      console.warn('Excel generation failed:', e);
    }
  };

  const loadFromHistory = (item) => {
    setQuery(item.query);
    run(item.query);
  };

  return (
    <div className="page">
      <div className="page-main">
        <div className="page-header">
          <div className="page-icon-wrap" style={{ background: 'rgba(74,144,217,0.15)' }}>🧮</div>
          <h1 className="page-title" style={{ color: 'var(--col-model)' }}>Model Builder</h1>
          <p className="page-subtitle">Describe any mathematical model and AI will teach it step-by-step and build an Excel workbook for you.</p>
        </div>

        <div className="input-wrap">
          <textarea
            className="input-box"
            rows={4}
            placeholder="e.g. Black-Scholes option pricing model, or DCF valuation model, or SIR epidemic model…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); }}
          />
          <div className="input-row">
            {status === 'idle'    && <span className="status-idle">Press Ctrl+Enter or click Build</span>}
            {status === 'loading' && <span className="status-loading"><div className="spinner" /> Building your model…</span>}
            {status === 'done'    && <span className="status-done">✓ Model complete · Excel file generating…</span>}
            {status === 'error'   && <span className="status-error">⚠ Error occurred</span>}
            {status === 'loading' && (
              <button className="btn btn-secondary btn-sm" onClick={() => { abortRef.current = true; setStatus('idle'); }}>Stop</button>
            )}
            <button className="btn btn-primary" disabled={status === 'loading' || !query.trim()} onClick={() => run()}>
              🧮 Build Model
            </button>
          </div>
        </div>

        {dlInfo && (
          <div className="dl-bar fade-up">
            <span>📊</span>
            <span className="dl-bar-text">Excel workbook saved to Downloads folder</span>
            <button className="btn btn-secondary btn-sm" onClick={() => window.electronAPI?.openFile(dlInfo.path)}>Open File</button>
          </div>
        )}

        {response && (
          <div className="response-area">
            <div className="response-box fade-up">
              <div
                className="response-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(response) }}
              />
              {status === 'loading' && <span className="cursor" />}
            </div>
          </div>
        )}
      </div>

      {/* History Panel */}
      <aside className="history-panel">
        <div className="history-header">
          <span className="history-title">History</span>
          <button className="btn btn-ghost btn-sm" onClick={async () => {
            await window.electronAPI?.clearHistory('model');
            setHistory([]);
          }}>Clear</button>
        </div>
        <div className="history-list">
          {history.length === 0
            ? <p className="history-empty">No history yet</p>
            : history.map((h, i) => (
              <div key={i} className="history-item" onClick={() => loadFromHistory(h)}>
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
