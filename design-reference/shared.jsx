// shared.jsx — common data + theme palettes + small primitives for AFPT mocks

// ─────────────────────────────────────────────────────────────
// Seed data (all mocks share these so layouts compare cleanly)
// ─────────────────────────────────────────────────────────────
const AFPT_DATA = {
  user: { sex: 'M', age: '25–29', standard: 'AFFT 2.0' },
  composite: 94.0,
  status: 'EXCELLENT',
  passDelta: 19.0, // points above pass
  maxDelta: 6.0,   // points to max
  components: {
    push: { kind: 'reps', name: 'HAND-RELEASE PUSH-UPS', short: 'PUSH', value: 28, min: 10, max: 28, score: 20, scoreMax: 20, status: 'MAX', alt: ['Hand-Release Push-Ups', '1-Min Push-Ups'] },
    core: { kind: 'reps', name: 'SIT-UPS (1 MIN)', short: 'SIT', value: 53, min: 31, max: 57, score: 18, scoreMax: 20, status: 'EXC', alt: ['Sit-Ups', 'Cross-Leg Rev. Crunch', 'Forearm Plank'] },
    plank: { kind: 'time', name: 'FOREARM PLANK', short: 'PLK', valueSec: 230, min: 95, max: 230, score: 20, scoreMax: 20, status: 'MAX', alt: ['Forearm Plank'] },
    run: { kind: 'time', name: '2-MILE RUN', short: 'RUN', valueSec: 810, min: 552, max: 990, score: 56, scoreMax: 60, status: 'ACT', alt: ['2-Mile Run', '1.5-Mile Run', '20m HAMR'] },
  },
  // 8x400m splits to total 13:30
  laps: [
    { n: 1, paceSec: 98,  splitSec: 98 },
    { n: 2, paceSec: 100, splitSec: 198 },
    { n: 3, paceSec: 101, splitSec: 299 },
    { n: 4, paceSec: 102, splitSec: 401 },
    { n: 5, paceSec: 103, splitSec: 504 },
    { n: 6, paceSec: 103, splitSec: 607 },
    { n: 7, paceSec: 102, splitSec: 709 },
    { n: 8, paceSec: 101, splitSec: 810 },
  ],
  altitude: 'Sea Level',
};

// helpers
const fmtMS = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const fmtMSColon = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

// ─────────────────────────────────────────────────────────────
// Theme palettes — applied as CSS vars on each mock's root.
// Layout/aesthetic details (scanlines, stencil fonts, etc.) stay
// per-mock; themes shift the color story.
// ─────────────────────────────────────────────────────────────
const THEMES = {
  tactical: {
    label: 'TACTICAL',
    swatch: '#1de9ff',
    vars: {
      '--bg': '#040b12',
      '--panel': '#08141d',
      '--panel-2': '#0d1c27',
      '--border': 'rgba(29,233,255,0.22)',
      '--border-strong': 'rgba(29,233,255,0.55)',
      '--ink': '#dff7ff',
      '--ink-dim': '#7ba9b8',
      '--accent': '#1de9ff',
      '--accent-2': '#37ff8b',
      '--warn': '#ffb547',
      '--bad': '#ff4d6d',
      '--font': '"JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace',
      '--font-display': '"JetBrains Mono", ui-monospace, monospace',
    },
  },
  stencil: {
    label: 'STENCIL',
    swatch: '#7a8b3a',
    vars: {
      '--bg': '#1a1d12',
      '--panel': '#252916',
      '--panel-2': '#2f3319',
      '--border': 'rgba(170,182,118,0.25)',
      '--border-strong': 'rgba(213,196,128,0.6)',
      '--ink': '#e9e1c2',
      '--ink-dim': '#a59c75',
      '--accent': '#d5c480',
      '--accent-2': '#b8c46a',
      '--warn': '#e6a740',
      '--bad': '#c8513f',
      '--font': '"Special Elite", "Courier Prime", "Courier New", monospace',
      '--font-display': '"Stardos Stencil", "Black Ops One", "Special Elite", monospace',
    },
  },
  blues: {
    label: 'AF BLUES',
    swatch: '#1f3a6b',
    vars: {
      '--bg': '#0d1726',
      '--panel': '#15233a',
      '--panel-2': '#1c2c47',
      '--border': 'rgba(199,206,221,0.18)',
      '--border-strong': 'rgba(199,206,221,0.4)',
      '--ink': '#eef1f7',
      '--ink-dim': '#9aa5bd',
      '--accent': '#c0c8d8', // silver
      '--accent-2': '#e2c275', // brass
      '--warn': '#e2c275',
      '--bad': '#c95a5a',
      '--font': '"Inter Tight", "Inter", system-ui, sans-serif',
      '--font-display': '"Bebas Neue", "Oswald", "Inter Tight", sans-serif',
    },
  },
  light: {
    label: 'CONNECT',
    swatch: '#2a6fdb',
    vars: {
      '--bg': '#f5f6fa',
      '--panel': '#ffffff',
      '--panel-2': '#f0f3f8',
      '--border': 'rgba(20,30,55,0.08)',
      '--border-strong': 'rgba(20,30,55,0.18)',
      '--ink': '#0e1726',
      '--ink-dim': '#5d6577',
      '--accent': '#2a6fdb',
      '--accent-2': '#1f8a5b',
      '--warn': '#d97706',
      '--bad': '#c0392b',
      '--font': '"Inter", system-ui, sans-serif',
      '--font-display': '"Inter", system-ui, sans-serif',
    },
  },
  fitness: {
    label: 'FITNESS',
    swatch: '#ff5dab',
    vars: {
      '--bg': '#1b0d2a',
      '--panel': 'rgba(255,255,255,0.07)',
      '--panel-2': 'rgba(255,255,255,0.04)',
      '--border': 'rgba(255,255,255,0.10)',
      '--border-strong': 'rgba(255,255,255,0.22)',
      '--ink': '#ffffff',
      '--ink-dim': 'rgba(255,255,255,0.65)',
      '--accent': '#ff5dab',
      '--accent-2': '#ffb547',
      '--warn': '#ffb547',
      '--bad': '#ff5d7c',
      '--font': '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
      '--font-display': '"Plus Jakarta Sans", "Inter", sans-serif',
    },
  },
};

// Apply theme vars to an element
function applyTheme(el, themeKey) {
  const t = THEMES[themeKey];
  if (!t || !el) return;
  Object.entries(t.vars).forEach(([k, v]) => el.style.setProperty(k, v));
  el.dataset.theme = themeKey;
}

// Theme switcher chip row — small, fits in any header
function ThemeSwitcher({ value, onChange, compact = false }) {
  return (
    <div style={{
      display: 'flex', gap: 4, alignItems: 'center',
      padding: compact ? 0 : '2px 4px',
    }}>
      {Object.entries(THEMES).map(([k, t]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          title={t.label}
          aria-label={`Theme: ${t.label}`}
          style={{
            width: compact ? 14 : 18, height: compact ? 14 : 18, borderRadius: '50%',
            background: t.swatch,
            border: value === k
              ? '2px solid var(--ink)'
              : '1px solid var(--border-strong)',
            cursor: 'pointer', padding: 0,
            outline: 'none',
            transition: 'transform .12s',
            transform: value === k ? 'scale(1.15)' : 'scale(1)',
          }}
        />
      ))}
    </div>
  );
}

// Slide-out chart drawer (used by all mocks). Shows stub scoring chart.
function ChartDrawer({ open, onClose, component, themeKey }) {
  if (!open) return null;
  // Build mock chart rows around current value
  const c = component;
  const isTime = c.kind === 'time';
  const rows = [];
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    let v, score;
    if (isTime) {
      v = c.max - Math.round((c.min - c.max) * (1 - t)); // descending pace, max=fastest, lower sec
      score = Math.round(c.scoreMax * (1 - t));
    } else {
      v = c.min + Math.round((c.max - c.min) * (1 - t));
      score = Math.round(c.scoreMax * (1 - t));
    }
    rows.push({ v, score });
  }
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50, pointerEvents: 'none',
    }}>
      {/* scrim */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
        opacity: open ? 1 : 0, transition: 'opacity .2s',
      }} />
      {/* drawer */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '78%', background: 'var(--panel)',
        borderLeft: '1px solid var(--border-strong)',
        pointerEvents: 'auto',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .25s cubic-bezier(.2,.7,.3,1)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font)',
      }}>
        <div style={{
          padding: '12px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>SCORE CHART</div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--ink)', borderRadius: 4, padding: '4px 8px',
            fontFamily: 'inherit', fontSize: 10, letterSpacing: 1, cursor: 'pointer',
          }}>CLOSE ✕</button>
        </div>
        <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--ink)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 4 }}>
            {c.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: 1 }}>
            M · 25–29 · AFFT 2.0
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '4px 14px 14px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            fontSize: 10, color: 'var(--ink-dim)', letterSpacing: 1.5,
            padding: '6px 0', borderBottom: '1px solid var(--border)',
          }}>
            <div>{isTime ? 'TIME' : 'REPS'}</div>
            <div style={{ textAlign: 'center' }}>SCORE</div>
            <div style={{ textAlign: 'right' }}>TIER</div>
          </div>
          {rows.map((r, i) => {
            const isCurrent = isTime
              ? Math.abs(r.v - c.valueSec) < 12
              : Math.abs(r.v - c.value) < 1;
            const tier = r.score >= c.scoreMax ? 'MAX'
              : r.score >= c.scoreMax * 0.85 ? 'EXC'
              : r.score >= c.scoreMax * 0.6 ? 'SAT' : 'UNSAT';
            const tierColor = tier === 'MAX' || tier === 'EXC' ? 'var(--accent-2)'
              : tier === 'SAT' ? 'var(--warn)' : 'var(--bad)';
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                fontSize: 13, padding: '7px 0',
                borderBottom: '1px dashed var(--border)',
                color: isCurrent ? 'var(--accent)' : 'var(--ink)',
                fontWeight: isCurrent ? 700 : 400,
                background: isCurrent ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : 'transparent',
              }}>
                <div style={{ fontFamily: 'var(--font-display)' }}>
                  {isTime ? fmtMSColon(r.v) : r.v}
                  {isCurrent && <span style={{ marginLeft: 6, fontSize: 10 }}>◀ YOU</span>}
                </div>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)' }}>
                  {r.score}/{c.scoreMax}
                </div>
                <div style={{ textAlign: 'right', color: tierColor, fontSize: 10, letterSpacing: 1.5 }}>
                  {tier}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Frame toggle (iOS / Android pill) — uses CSS vars so it adapts to theme
function FrameToggle({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)', textTransform: 'uppercase' }}>Frame</div>
      <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 4, overflow: 'hidden' }}>
        {[['ios','iOS'],['android','ANDROID']].map(([k, l]) => (
          <button key={k} onClick={() => onChange?.(k)} style={{
            padding: '4px 8px', fontSize: 9, letterSpacing: 1.5,
            background: value === k ? 'var(--accent)' : 'transparent',
            color: value === k ? 'var(--bg)' : 'var(--ink-dim)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

// Demographics dropdown row — visible on main, themed via CSS vars.
// Each mock can wrap/style it via the `wrapStyle` prop if needed.
function DemographicsRow({ sex, age, standard, onSex, onAge, onStandard, style }) {
  const s = {
    background: 'var(--panel-2)', border: '1px solid var(--border-strong)',
    color: 'var(--ink)', fontFamily: 'inherit', fontSize: 11,
    padding: '4px 6px', borderRadius: 4, outline: 'none', cursor: 'pointer', width: '100%',
  };
  return (
    <div style={{
      padding: '10px 14px', borderBottom: '1px solid var(--border)',
      display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8,
      ...style,
    }}>
      <div>
        <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)', marginBottom: 3, textTransform: 'uppercase' }}>Sex</div>
        <select value={sex} onChange={(e) => onSex(e.target.value)} style={s}>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </div>
      <div>
        <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)', marginBottom: 3, textTransform: 'uppercase' }}>Age</div>
        <select value={age} onChange={(e) => onAge(e.target.value)} style={s}>
          {['<25','25–29','30–34','35–39','40–44','45–49','50–54','55–59','60+'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)', marginBottom: 3, textTransform: 'uppercase' }}>Standard</div>
        <select value={standard} onChange={(e) => onStandard(e.target.value)} style={s}>
          <option>AFFT 2.0</option><option>LEGACY</option>
        </select>
      </div>
    </div>
  );
}

Object.assign(window, {
  AFPT_DATA, THEMES, applyTheme, ThemeSwitcher, ChartDrawer, FrameToggle, DemographicsRow,
  fmtMS, fmtMSColon,
});
