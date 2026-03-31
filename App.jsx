import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home        from './pages/Home.jsx';
import ModelBuilder from './pages/ModelBuilder.jsx';
import SubjectLearner from './pages/SubjectLearner.jsx';
import SkillLearner  from './pages/SkillLearner.jsx';
import Researcher    from './pages/Researcher.jsx';

const NAV = [
  { to: '/',         icon: '🏠', label: 'Home' },
  { to: '/model',    icon: '🧮', label: 'Model Builder' },
  { to: '/subject',  icon: '📚', label: 'Subject Learner' },
  { to: '/skill',    icon: '🛠️', label: 'Skill Learner' },
  { to: '/research', icon: '🔬', label: 'Research' },
];

function TitleBar() {
  return (
    <div className="titlebar">
      <div className="titlebar-controls">
        <button className="tb-btn" onClick={() => window.electronAPI?.minimize()}>─</button>
        <button className="tb-btn" onClick={() => window.electronAPI?.maximize()}>□</button>
        <button className="tb-btn tb-close" onClick={() => window.electronAPI?.close()}>✕</button>
      </div>
    </div>
  );
}

function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">✦</div>
        <div>
          <div className="logo-text">Renaissance</div>
          <div className="logo-sub">AI Learning Suite</div>
        </div>
      </div>
      <nav className="nav">
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-divider" />
      <div className="sidebar-bottom">
        <div className="nav-item" style={{ cursor: 'default' }}>
          <span className="nav-icon">✦</span>
          <span className="nav-label" style={{ fontSize: 11, color: 'var(--text3)' }}>Powered by Gemini 2.0</span>
        </div>
      </div>
    </aside>
  );
}

export default function App() {
  return (
    <HashRouter>
      <TitleBar />
      <div className="app">
        <Sidebar />
        <div className="content">
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/model"   element={<ModelBuilder />} />
            <Route path="/subject" element={<SubjectLearner />} />
            <Route path="/skill"   element={<SkillLearner />} />
            <Route path="/research" element={<Researcher />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}
