// mock-blues.jsx — Mock C: AF DRESS BLUES (no frame)
// score: ring/dial gauge · input: stepper (− /+) + slider · demographics: settings drawer
// altitude: visible · lap breakdown: clean table

function MockBlues({ themeKey = 'blues', onTheme, frameKind = 'ios', onFrameChange }) {
  const [active, setActive] = React.useState('run');
  const [chartOpen, setChartOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [coreEx, setCoreEx] = React.useState('plank');
  const [sex, setSex] = React.useState('M');
  const [age, setAge] = React.useState('25–29');
  const [standard, setStandard] = React.useState('AFFT 2.0');
  const safeTop = frameKind === 'ios' ? 56 : 44;
  const rootRef = React.useRef(null);
  React.useEffect(() => { applyTheme(rootRef.current, themeKey); }, [themeKey]);

  const D = AFPT_DATA;
  const cores = { sit: D.components.core, plank: D.components.plank };
  const components = { push: D.components.push, core: cores[coreEx], run: D.components.run };
  const cs = components[active];

  // ring gauge constants
  const R = 56, C = 2 * Math.PI * R;
  const pct = D.composite / 100;

  return (
    <div ref={rootRef} style={{
      width: '100%', height: '100%',
      background: 'var(--bg)', color: 'var(--ink)',
      fontFamily: 'var(--font)', overflow: 'auto', position: 'relative',
    }}>
      {/* Brass-trim header */}
      <div style={{
        padding: `${safeTop}px 16px 14px`,
        background: 'linear-gradient(180deg, var(--panel-2), var(--panel))',
        borderBottom: '1px solid var(--accent-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* AF roundel placeholder */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'radial-gradient(circle, var(--accent-2) 30%, var(--panel) 32%, var(--panel) 60%, var(--accent-2) 62%)',
            border: '1.5px solid var(--accent-2)',
          }} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 3, color: 'var(--ink)', lineHeight: 1 }}>
              AFPT
            </div>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--ink-dim)', marginTop: 3 }}>
              FITNESS COMPOSITE · AFFT 2.0
            </div>
          </div>
        </div>
        <button onClick={() => setSettingsOpen(true)} style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'transparent', border: '1px solid var(--border-strong)',
          color: 'var(--accent)', cursor: 'pointer', fontSize: 16,
        }}>⚙</button>
      </div>

      {/* Demographics dropdowns — always visible */}
      <DemographicsRow sex={sex} age={age} standard={standard} onSex={setSex} onAge={setAge} onStandard={setStandard} style={{ padding: '10px 16px' }} />

      {/* Ring gauge composite */}
      <div style={{ padding: '20px 16px 14px', display: 'flex', alignItems: 'center', gap: 18, borderBottom: '1px solid var(--border)' }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent-2)" />
              <stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
          </defs>
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--panel-2)" strokeWidth="10" />
          <circle cx="70" cy="70" r={R} fill="none" stroke="url(#ringGrad)" strokeWidth="10"
            strokeLinecap="round" strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 70 70)" />
          {/* thresholds */}
          {[0.75, 0.9].map((t, i) => {
            const a = -Math.PI / 2 + 2 * Math.PI * t;
            const x1 = 70 + Math.cos(a) * (R - 8), y1 = 70 + Math.sin(a) * (R - 8);
            const x2 = 70 + Math.cos(a) * (R + 8), y2 = 70 + Math.sin(a) * (R + 8);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--ink-dim)" strokeWidth="1.5" />;
          })}
          <text x="70" y="62" textAnchor="middle" fontSize="9" letterSpacing="2" fill="var(--ink-dim)" fontFamily="var(--font)">COMPOSITE</text>
          <text x="70" y="86" textAnchor="middle" fontSize="32" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-display)" letterSpacing="2">{D.composite.toFixed(0)}</text>
          <text x="70" y="102" textAnchor="middle" fontSize="9" letterSpacing="2" fill="var(--accent-2)" fontFamily="var(--font)">EXCELLENT</text>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--ink-dim)', marginBottom: 4 }}>STATUS</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2, color: 'var(--accent-2)', marginBottom: 10 }}>EXCELLENT</div>
          <div style={{ fontSize: 11, color: 'var(--ink-dim)', lineHeight: 1.7 }}>
            <div>+{D.passDelta.toFixed(0)}.0 above pass</div>
            <div>+{D.maxDelta.toFixed(0)}.0 to max score</div>
          </div>
        </div>
      </div>

      {/* Component cards */}
      <div style={{ padding: '12px 12px 0', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {Object.entries(components).map(([k, c]) => {
          const isActive = k === active;
          return (
            <button key={k} onClick={() => setActive(k)} style={{
              background: isActive ? 'var(--panel-2)' : 'var(--panel)',
              border: `1px solid ${isActive ? 'var(--accent-2)' : 'var(--border)'}`,
              borderRadius: 8, padding: '10px 8px',
              color: 'var(--ink)', cursor: 'pointer', textAlign: 'left',
              boxShadow: isActive ? '0 0 0 2px color-mix(in oklab, var(--accent-2) 25%, transparent)' : 'none',
            }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--ink-dim)', marginBottom: 4 }}>
                {c.short}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                {c.kind === 'time' ? fmtMSColon(c.valueSec) : c.value}
              </div>
              <div style={{ marginTop: 6, height: 3, background: 'var(--panel-2)', borderRadius: 2, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(c.score / c.scoreMax) * 100}%`, background: 'var(--accent-2)', borderRadius: 2 }} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 4 }}>
                {c.score}/{c.scoreMax} pts
              </div>
            </button>
          );
        })}
      </div>

      {/* Active editor */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 2, color: 'var(--ink)' }}>
            {cs.name}
          </div>
          <button onClick={() => setChartOpen(true)} style={{
            background: 'transparent', border: '1px solid var(--accent)',
            color: 'var(--accent)', padding: '4px 10px', borderRadius: 14,
            fontFamily: 'inherit', fontSize: 10, letterSpacing: 1.5, cursor: 'pointer',
          }}>See chart →</button>
        </div>

        {active === 'core' && (
          <div style={{ display: 'inline-flex', background: 'var(--panel-2)', borderRadius: 6, padding: 2, marginBottom: 12 }}>
            {[['sit','Sit-ups'],['plank','Plank']].map(([k, l]) => (
              <button key={k} onClick={() => setCoreEx(k)} style={{
                padding: '4px 12px', fontSize: 11,
                background: coreEx === k ? 'var(--accent-2)' : 'transparent',
                color: coreEx === k ? 'var(--bg)' : 'var(--ink-dim)',
                border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
              }}>{l}</button>
            ))}
          </div>
        )}

        {/* stepper + value + slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, justifyContent: 'center' }}>
          <button style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--panel-2)', border: '1px solid var(--border-strong)',
            color: 'var(--ink)', fontSize: 18, cursor: 'pointer',
          }}>−</button>
          <div style={{
            flex: 1, textAlign: 'center', padding: '4px 0',
            fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700, lineHeight: 1,
            color: 'var(--ink)',
          }}>
            {cs.kind === 'time' ? fmtMSColon(cs.valueSec) : cs.value}
            <div style={{ fontSize: 10, color: 'var(--ink-dim)', letterSpacing: 1.5, marginTop: 2, fontFamily: 'var(--font)' }}>
              {cs.score} / {cs.scoreMax} pts
            </div>
          </div>
          <button style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent)', border: '1px solid var(--accent)',
            color: 'var(--bg)', fontSize: 18, cursor: 'pointer', fontWeight: 700,
          }}>+</button>
        </div>

        {/* slider */}
        <div style={{ position: 'relative', height: 22, marginTop: 6 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 4, background: 'var(--panel-2)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', left: 0, top: 9, width: '70%', height: 4, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: 2 }} />
          <div style={{ position: 'absolute', left: '70%', top: 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--ink)', border: '2px solid var(--accent-2)', transform: 'translateX(-50%)', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-dim)', marginTop: 4 }}>
          <span>min {cs.kind === 'time' ? fmtMSColon(cs.min) : cs.min}</span>
          <span style={{ color: 'var(--accent-2)' }}>max {cs.kind === 'time' ? fmtMSColon(cs.max) : cs.max}</span>
        </div>

        {/* Altitude (visible) */}
        {active === 'run' && (
          <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--panel-2)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>ALTITUDE ADJUSTMENT</div>
              <div style={{ fontSize: 12, color: 'var(--ink)' }}>Sea Level</div>
            </div>
            <select defaultValue="sea" style={{ background: 'var(--panel)', border: '1px solid var(--border-strong)', color: 'var(--ink)', padding: '4px 6px', borderRadius: 4, fontFamily: 'inherit', fontSize: 11 }}>
              <option>Sea Level</option><option>3000–4000 ft</option><option>4000–5000 ft</option><option>5000+ ft</option>
            </select>
          </div>
        )}
      </div>

      {/* Lap splits — clean table */}
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 2, color: 'var(--ink)' }}>LAP PACE PLAN</div>
          <div style={{ fontSize: 10, color: 'var(--ink-dim)' }}>8 × 400m → {fmtMSColon(D.components.run.valueSec)}</div>
        </div>
        <div style={{ background: 'var(--panel-2)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 1fr 1fr', padding: '8px 12px', fontSize: 9, letterSpacing: 2, color: 'var(--ink-dim)', borderBottom: '1px solid var(--border)' }}>
            <span>LAP</span><span>PACE</span><span>SPLIT</span><span style={{ textAlign: 'right' }}>vs TGT</span>
          </div>
          {D.laps.map((l, i) => (
            <div key={l.n} style={{
              display: 'grid', gridTemplateColumns: '36px 1fr 1fr 1fr',
              padding: '8px 12px', fontSize: 12,
              borderBottom: i < 7 ? '1px solid var(--border)' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
            }}>
              <span style={{ color: 'var(--ink-dim)' }}>{String(l.n).padStart(2, '0')}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{fmtMS(l.paceSec)}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{fmtMSColon(l.splitSec)}</span>
              <span style={{ textAlign: 'right', color: 'var(--accent-2)', fontSize: 11 }}>on pace</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <FrameToggle value={frameKind} onChange={onFrameChange} />
        <ThemeSwitcher value={themeKey} onChange={onTheme} />
      </div>

      {/* Settings drawer */}
      {settingsOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
          <div onClick={() => setSettingsOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '78%',
            background: 'var(--panel)', borderLeft: '1px solid var(--accent-2)',
            padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 2, color: 'var(--ink)' }}>SETTINGS</div>
              <button onClick={() => setSettingsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--ink-dim)', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            {[['Sex','Male'],['Age group','25–29'],['Standard','AFFT 2.0'],['Altitude','Sea Level'],['Units','Imperial']].map(([l, v]) => (
              <div key={l} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{l}</span>
                <span style={{ fontSize: 13, color: 'var(--ink)' }}>{v} ›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChartDrawer open={chartOpen} onClose={() => setChartOpen(false)} component={cs} themeKey={themeKey} />
    </div>
  );
}

window.MockBlues = MockBlues;
