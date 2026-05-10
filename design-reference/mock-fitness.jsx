// mock-fitness.jsx — Mock E: FITNESS GRADIENT (no frame)
// score: big ring with gradient · input: tap-to-edit + slider · demographics: top header w/ avatar
// altitude: visible · lap breakdown: 4-up tile grid (compact, scrolls horizontally for 8)

function MockFitness({ themeKey = 'fitness', onTheme, frameKind = 'ios', onFrameChange }) {
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

  const R = 70, C = 2 * Math.PI * R;
  const pct = D.composite / 100;

  return (
    <div ref={rootRef} style={{
      width: '100%', height: '100%',
      color: 'var(--ink)',
      fontFamily: 'var(--font)', overflow: 'auto', position: 'relative',
      background: 'linear-gradient(160deg, #2b1456 0%, #6b1a5e 45%, #c92a7c 100%)',
    }}>
      {/* Header */}
      <div style={{ padding: `${safeTop}px 16px 10px`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff',
          }}>{sex}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>PT Calculator</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Composite fitness score</div>
          </div>
        </div>
        <button onClick={() => setSettingsOpen(true)} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff', cursor: 'pointer', fontSize: 14,
        }}>⚙</button>
      </div>

      {/* Demographics dropdowns — always visible */}
      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 8 }}>
        {[
          ['Sex', sex, setSex, [['M','Male'],['F','Female']]],
          ['Age', age, setAge, [['<25','<25'],['25–29','25–29'],['30–34','30–34'],['35–39','35–39'],['40–44','40–44'],['45–49','45–49'],['50–54','50–54'],['55–59','55–59'],['60+','60+']]],
          ['Standard', standard, setStandard, [['AFFT 2.0','AFFT 2.0'],['LEGACY','LEGACY']]],
        ].map(([label, val, setter, opts]) => (
          <div key={label}>
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)', marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
            <select value={val} onChange={(e) => setter(e.target.value)} style={{
              width: '100%', background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
              padding: '5px 6px', borderRadius: 8, outline: 'none', cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}>{opts.map(([v, l]) => <option key={v} value={v} style={{ color: '#1b0d2a' }}>{l}</option>)}</select>
          </div>
        ))}
      </div>

      {/* Big gradient ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 16px 16px' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="fitGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffb547" />
              <stop offset="50%" stopColor="#ff5dab" />
              <stop offset="100%" stopColor="#ff5d7c" />
            </linearGradient>
          </defs>
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
          <circle cx="100" cy="100" r={R} fill="none" stroke="url(#fitGrad)" strokeWidth="10"
            strokeLinecap="round" strokeDasharray={`${C * pct} ${C}`} transform="rotate(-90 100 100)" />
          <text x="100" y="98" textAnchor="middle" fontSize="56" fontWeight="700" fill="#fff" fontFamily="var(--font-display)">{D.composite.toFixed(0)}</text>
          <text x="100" y="124" textAnchor="middle" fontSize="11" letterSpacing="3" fill="rgba(255,255,255,0.85)" fontFamily="var(--font)" fontWeight="600">EXCELLENT</text>
        </svg>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: -6 }}>
          <span>+{D.passDelta.toFixed(0)} above pass</span>
          <span>·</span>
          <span>+{D.maxDelta.toFixed(0)} to max</span>
        </div>
      </div>

      {/* Component pills */}
      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {Object.entries(components).map(([k, c]) => {
          const isActive = k === active;
          return (
            <button key={k} onClick={() => setActive(k)} style={{
              background: isActive ? '#fff' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '12px 10px',
              color: isActive ? '#3a0f4d' : '#fff', cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              boxShadow: isActive ? '0 8px 20px rgba(0,0,0,0.2)' : 'none',
              transition: 'all .2s',
            }}>
              <div style={{ fontSize: 10, letterSpacing: 1.5, opacity: 0.7, marginBottom: 4 }}>
                {c.short}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, letterSpacing: -0.5 }}>
                {c.kind === 'time' ? fmtMSColon(c.valueSec) : c.value}
              </div>
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                {c.score}/{c.scoreMax}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active editor (glass card) */}
      <div style={{
        margin: '0 16px 14px',
        background: 'rgba(255,255,255,0.08)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.12)',
        padding: 16, backdropFilter: 'blur(14px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: 1 }}>
            {cs.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>
            {cs.score} / {cs.scoreMax} pts
          </div>
        </div>

        {active === 'core' && (
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.18)', borderRadius: 999, padding: 3, marginBottom: 12, gap: 2 }}>
            {[['sit','Sit-ups'],['plank','Plank']].map(([k, l]) => (
              <button key={k} onClick={() => setCoreEx(k)} style={{
                flex: 1, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                background: coreEx === k ? '#fff' : 'transparent',
                color: coreEx === k ? '#3a0f4d' : 'rgba(255,255,255,0.7)',
                border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
              }}>{l}</button>
            ))}
          </div>
        )}

        {/* tap-to-edit big number */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>
            {cs.kind === 'time' ? fmtMSColon(cs.valueSec) : cs.value}
          </div>
          <button style={{
            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', padding: '5px 12px', borderRadius: 999, fontSize: 11,
            fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500,
          }}>✎ edit</button>
          <button onClick={() => setChartOpen(true)} style={{
            marginLeft: 'auto',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', padding: '5px 10px', borderRadius: 999, fontSize: 11,
            fontFamily: 'inherit', cursor: 'pointer',
          }}>chart</button>
        </div>

        {/* slider */}
        <div style={{ position: 'relative', height: 24 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 10, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: 0, top: 10, width: '70%', height: 4, background: 'linear-gradient(90deg, #ffb547, #ff5dab)', borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: '70%', top: 1, width: 22, height: 22, borderRadius: '50%', background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
          <span>min · {cs.kind === 'time' ? fmtMSColon(cs.min) : cs.min}</span>
          <span style={{ color: '#ffd97a' }}>max · {cs.kind === 'time' ? fmtMSColon(cs.max) : cs.max}</span>
        </div>

        {/* Altitude (visible) */}
        {active === 'run' && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.18)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>⛰ Altitude adjustment</span>
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>Sea Level ▾</span>
          </div>
        )}
      </div>

      {/* Lap plan */}
      <div style={{ margin: '0 16px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Lap plan</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>8 × 400m → {fmtMSColon(D.components.run.valueSec)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {D.laps.map((l) => (
            <div key={l.n} style={{
              background: 'rgba(255,255,255,0.08)', borderRadius: 10,
              padding: '8px 6px', textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 2 }}>L{l.n}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{fmtMS(l.paceSec)}</div>
              <div style={{ fontSize: 10, color: '#ffb547', marginTop: 2 }}>{fmtMSColon(l.splitSec)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '4px 16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <FrameToggle value={frameKind} onChange={onFrameChange} />
        <ThemeSwitcher value={themeKey} onChange={onTheme} />
      </div>

      {/* Settings drawer */}
      {settingsOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
          <div onClick={() => setSettingsOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '78%',
            background: 'linear-gradient(160deg, #2b1456, #6b1a5e)', borderLeft: '1px solid rgba(255,255,255,0.2)',
            padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Settings</div>
              <button onClick={() => setSettingsOpen(false)} style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            {[['Altitude','Sea Level'],['Units','Imperial'],['Notifications','On']].map(([l, v]) => (
              <div key={l} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#fff' }}>{l}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{v} ›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChartDrawer open={chartOpen} onClose={() => setChartOpen(false)} component={cs} themeKey={themeKey} />
    </div>
  );
}

window.MockFitness = MockFitness;
