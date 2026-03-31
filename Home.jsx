import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    to: '/model',
    icon: '🧮',
    title: 'Model Builder',
    desc: 'Describe any mathematical model and AI will teach it step-by-step, derive the equations, and build a ready-to-use Excel workbook.',
    accent: 'var(--col-model)',
    tag: 'Mathematics + Excel',
  },
  {
    to: '/subject',
    icon: '📚',
    title: 'Subject Learner',
    desc: 'Enter any academic field and receive a curated learning roadmap with textbooks, courses, lecture notes, and YouTube channels.',
    accent: 'var(--col-subject)',
    tag: 'Structured Curriculum',
  },
  {
    to: '/skill',
    icon: '🛠️',
    title: 'Skill Learner',
    desc: 'Break down any skill into sub-skills with a personalised learning path, practice projects, and hand-picked resources per sub-skill.',
    accent: 'var(--col-skill)',
    tag: 'Sub-skill Breakdown',
  },
  {
    to: '/research',
    icon: '🔬',
    title: 'Research Compiler',
    desc: 'Compile the latest and seminal research papers on any topic, discover key thought leaders, and surface open questions.',
    accent: 'var(--col-research)',
    tag: 'Academic Research',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page-main fade-up" style={{ justifyContent: 'center', maxWidth: 860, margin: '0 auto', width: '100%' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✦</div>
        <h1 className="page-title" style={{ fontSize: 36, fontFamily: "'Cinzel', serif", background: 'linear-gradient(135deg, #c9a84c, #e0c47a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Renaissance
        </h1>
        <p className="page-subtitle" style={{ textAlign: 'center', maxWidth: 480, margin: '10px auto 0', fontSize: 15 }}>
          Your AI-powered assistant for learning, research, and mathematical modelling.
          Select a module below to get started.
        </p>
      </div>

      <div className="home-grid">
        {FEATURES.map(f => (
          <div
            key={f.to}
            className="home-card fade-up"
            onClick={() => navigate(f.to)}
            style={{ borderTop: `3px solid ${f.accent}` }}
          >
            <div className="home-card-icon">{f.icon}</div>
            <div className="home-card-title">{f.title}</div>
            <div className="home-card-desc">{f.desc}</div>
            <div style={{ marginTop: 14 }}>
              <span className="tag tag-gold" style={{ fontSize: 10 }}>{f.tag}</span>
            </div>
          </div>
        ))}
      </div>

      <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: 32 }}>
        Powered by Gemini 2.0 Flash with Search Grounding
      </p>
    </div>
  );
}
