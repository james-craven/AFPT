// mock-light.jsx — Mock D: MODERN LIGHT (iOS frame, AF Connect-y)
// score: card with badge style · input: slider w/ numeric input · demographics: settings drawer
// altitude: tucked in settings · lap breakdown: clean rows w/ pace mini-bars

function MockLight({ themeKey = 'light', onTheme, frameKind = 'ios', onFrameChange }) {
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

  return (
    <div ref={rootRef} style={{
      width: '100%', height: '100%',
      background: 'var(--bg)', color: 'var(--ink)',
      fontFamily: 'var(--font)', overflow: 'auto', position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        padding: `${safeTop}px 16px 10px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.3 }}>
            PT Calculator
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-dim)', marginTop: 2 }}>
            Composite fitness score
          </div>
        </div>
        <button onClick={() => setSettingsOpen(true)} style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--panel-2)', border: '1px solid var(--border)',
          color: 'var(--ink)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>⚙</button>
      </div>

      {/* Demographics dropdowns — always visible */}
      <DemographicsRow sex={sex} age={age} standard={standard} onSex={setSex} onAge={setAge} onStandard={setStandard} style={{ padding: '0 16px 14px', borderBottom: 'none' }} />

      {/* Composite card — number + badge */}
      <div style={{
        margin: '0 16px 14px',
        background: 'var(--panel)', borderRadius: 14,
        border: '1px solid var(--border)',
        padding: 16, boxShadow: '0 2px 8px rgba(20,30,55,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: 'var(--ink-dim)', textTransform: 'uppercase' }}>
            Composite score
          </div>
          <div style={{
            background: 'color-mix(in oklab, var(--accent-2) 18%, transparent)',
            color: 'var(--accent-2)',
            padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
          }}>● Excellent</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--ink)', letterSpacing: -1, lineHeight: 1 }}>
            {D.composite.toFixed(1)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-dim)' }}>/ 100</div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--accent-2)', fontWeight: 600 }}>
            +{D.passDelta.toFixed(0)} above pass
          </div>
        </div>
        {/* threshold bar */}
        <div style={{ position: 'relative', height: 8, background: 'var(--panel-2)', borderRadius: 4 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '94%', background: 'linear-gradient(90deg, var(--bad), var(--warn) 75%, var(--accent-2))', borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: '75%', top: -2, bottom: -2, width: 1.5, background: 'var(--ink-dim)', opacity: 0.5 }} />
          <div style={{ position: 'absolute', left: '90%', top: -2, bottom: -2, width: 1.5, background: 'var(--ink-dim)', opacity: 0.5 }} />
          <div style={{ position: 'absolute', left: '94%', top: -3, width: 14, height: 14, borderRadius: '50%', background: 'var(--ink)', border: '3px solid var(--accent-2)', transform: 'translateX(-50%)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-dim)', marginTop: 4 }}>
          <span>Unsat</span><span>Sat 75</span><span>Exc 90</span><span>100</span>
        </div>
      </div>

      {/* Component cards */}
      <div style={{ padding: '0 16px 14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {Object.entries(components).map(([k, c]) => {
          const isActive = k === active;
          return (
            <button key={k} onClick={() => setActive(k)} style={{
              background: 'var(--panel)',
              border: `${isActive ? 2 : 1}px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 12, padding: '10px 8px',
              color: 'var(--ink)', cursor: 'pointer', textAlign: 'center',
              boxShadow: isActive ? '0 2px 12px color-mix(in oklab, var(--accent) 25%, transparent)' : 'none',
            }}>
              <div style={{ fontSize: 10, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                {c.short}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: isActive ? 'var(--accent)' : 'var(--ink)' }}>
                {c.kind === 'time' ? fmtMSColon(c.valueSec) : c.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-dim)', marginTop: 6 }}>
                {c.score}/{c.scoreMax}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active editor card */}
      <div style={{
        margin: '0 16px 14px',
        background: 'var(--panel)', borderRadius: 14,
        border: '1px solid var(--border)', padding: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{cs.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-dim)', marginTop: 2 }}>
              {cs.score} / {cs.scoreMax} pts
            </div>
          </div>
          <button onClick={() => setChartOpen(true)} style={{
            background: 'transparent', border: '1px solid var(--border-strong)',
            color: 'var(--accent)', padding: '5px 10px', borderRadius: 8,
            fontFamily: 'inherit', fontSize: 11, fontWeight: 500, cursor: 'pointer',
          }}>See chart</button>
        </div>

        {active === 'core' && (
          <div style={{ display: 'flex', background: 'var(--panel-2)', borderRadius: 10, padding: 3, marginBottom: 12 }}>
            {[['sit','Sit-ups'],['plank','Plank']].map(([k, l]) => (
              <button key={k} onClick={() => setCoreEx(k)} style={{
                flex: 1, padding: '6px 10px', fontSize: 12, fontWeight: 500,
                background: coreEx === k ? 'var(--panel)' : 'transparent',
                color: coreEx === k ? 'var(--ink)' : 'var(--ink-dim)',
                border: 'none', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: coreEx === k ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}>{l}</button>
            ))}
          </div>
        )}

        {/* big value + numeric input */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--ink)', lineHeight: 1, letterSpacing: -1 }}>
            {cs.kind === 'time' ? fmtMSColon(cs.valueSec) : cs.value}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>Type</span>
            <input
              type="text"
              defaultValue={cs.kind === 'time' ? fmtMSColon(cs.valueSec) : cs.value}
              style={{
                width: 70, padding: '6px 8px',
                background: 'var(--panel-2)', border: '1px solid var(--border-strong)',
                borderRadius: 8, fontFamily: 'inherit',
                fontSize: 14, color: 'var(--ink)', outline: 'none', textAlign: 'center',
              }}
            />
          </div>
        </div>

        {/* slider */}
        <div style={{ position: 'relative', height: 22 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 4, background: 'var(--panel-2)', borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: 0, top: 9, width: '70%', height: 4, background: 'var(--accent)', borderRadius: 4 }} />
          <div style={{ position: 'absolute', left: '70%', top: 1, width: 20, height: 20, borderRadius: '50%', background: '#fff', border: '2px solid var(--accent)', transform: 'translateX(-50%)', boxShadow: '0 2px 6px rgba(20,30,55,0.15)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-dim)', marginTop: 6 }}>
          <span>Min: {cs.kind === 'time' ? fmtMSColon(cs.min) : cs.min}</span>
          <span style={{ color: 'var(--accent-2)', fontWeight: 600 }}>Max: {cs.kind === 'time' ? fmtMSColon(cs.max) : cs.max}</span>
        </div>
      </div>

      {/* Lap splits */}
      <div style={{ margin: '0 16px 14px', background: 'var(--panel)', borderRadius: 14, border: '1px solid var(--border)', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Lap targets</div>
          <div style={{ fontSize: 11, color: 'var(--ink-dim)' }}>8 × 400m → {fmtMSColon(D.components.run.valueSec)}</div>
        </div>
        {D.laps.map((l) => (
          <div key={l.n} style={{
            display: 'grid', gridTemplateColumns: '24px 60px 1fr 60px',
            padding: '8px 0', alignItems: 'center', gap: 10,
            borderBottom: l.n < 8 ? '1px solid var(--border)' : 'none',
            fontSize: 12,
          }}>
            <span style={{ color: 'var(--ink-dim)', fontWeight: 600 }}>{l.n}</span>
            <span style={{ color: 'var(--ink)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtMS(l.paceSec)}</span>
            <div style={{ height: 5, background: 'var(--panel-2)', borderRadius: 3, position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(l.paceSec - 95) / 14 * 100}%`, background: 'var(--accent)', borderRadius: 3 }} />
            </div>
            <span style={{ textAlign: 'right', color: 'var(--ink-dim)', fontVariantNumeric: 'tabular-nums' }}>{fmtMSColon(l.splitSec)}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '6px 16px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <FrameToggle value={frameKind} onChange={onFrameChange} />
        <ThemeSwitcher value={themeKey} onChange={onTheme} />
      </div>

      {/* Settings drawer */}
      {settingsOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
          <div onClick={() => setSettingsOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(20,30,55,0.4)' }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '80%',
            background: 'var(--panel)', borderLeft: '1px solid var(--border)',
            padding: 16, boxShadow: '-4px 0 20px rgba(20,30,55,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Settings</div>
              <button onClick={() => setSettingsOpen(false)} style={{ width: 28, height: 28, background: 'var(--panel-2)', border: 'none', borderRadius: 8, color: 'var(--ink)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            {[['Sex','Male'],['Age group','25–29'],['Standard','AFFT 2.0'],['Altitude adjustment','Sea Level'],['Units','Imperial']].map(([l, v]) => (
              <div key={l} style={{ padding: '14px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--ink)' }}>{l}</span>
                <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}>{v} ›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChartDrawer open={chartOpen} onClose={() => setChartOpen(false)} component={cs} themeKey={themeKey} />
    </div>
  );
}

window.MockLight = MockLight;
