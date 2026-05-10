// mock-stencil.jsx — Mock B: STENCIL OPS (Android frame)
// score: horizontal threshold bar · input: tap-to-edit big number · demographics: top header
// altitude: tucked in settings drawer · lap breakdown: bar chart pace strip

function MockStencil({ themeKey = 'stencil', onTheme, frameKind = 'ios', onFrameChange }) {
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

  const stencilFont = '"Stardos Stencil", "Black Ops One", "Special Elite", monospace';

  return (
    <div ref={rootRef} style={{
      width: '100%', height: '100%',
      background: 'var(--bg)', color: 'var(--ink)',
      fontFamily: 'var(--font)',
      overflow: 'auto', position: 'relative',
      backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(213,196,128,0.06) 1px, transparent 0)',
      backgroundSize: '12px 12px',
    }}>
      {/* Top header bar */}
      <div style={{
        padding: `${safeTop}px 14px 12px`,
        background: 'var(--panel-2)',
        borderBottom: '2px solid var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, border: '2px solid var(--accent)',
            borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent)', fontFamily: stencilFont, fontSize: 14,
          }}>★</div>
          <div>
            <div style={{ fontFamily: stencilFont, fontSize: 16, letterSpacing: 2, color: 'var(--accent)', lineHeight: 1 }}>
              AFPT-CALC
            </div>
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)', marginTop: 2 }}>
              ISSUE 2.0
            </div>
          </div>
        </div>
        <button onClick={() => setSettingsOpen(true)} style={{
          background: 'transparent', border: '1px solid var(--accent)',
          color: 'var(--accent)', padding: '4px 8px', borderRadius: 2,
          fontFamily: stencilFont, fontSize: 11, letterSpacing: 2, cursor: 'pointer',
        }}>SETTINGS</button>
      </div>

      {/* Demographics dropdowns — always visible */}
      <DemographicsRow sex={sex} age={age} standard={standard} onSex={setSex} onAge={setAge} onStandard={setStandard} />

      {/* Composite — horizontal threshold bar */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--ink-dim)' }}>COMPOSITE</div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--accent-2)' }}>
            +{D.passDelta.toFixed(0)} ABV PASS · +{D.maxDelta.toFixed(0)} TO MAX
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ fontFamily: stencilFont, fontSize: 56, lineHeight: 1, color: 'var(--accent)', letterSpacing: 2 }}>
            {D.composite.toFixed(0)}
          </div>
          <div style={{
            background: 'var(--accent-2)', color: 'var(--bg)',
            padding: '4px 10px', fontFamily: stencilFont, fontSize: 12,
            letterSpacing: 3, borderRadius: 2,
          }}>
            EXCELLENT
          </div>
        </div>
        {/* threshold bar */}
        <div style={{ marginTop: 12, position: 'relative' }}>
          <div style={{ display: 'flex', height: 18, border: '1px solid var(--border-strong)' }}>
            <div style={{ flex: 75, background: 'rgba(200,81,63,0.2)' }} />
            <div style={{ flex: 15, background: 'rgba(230,167,64,0.25)' }} />
            <div style={{ flex: 10, background: 'rgba(184,196,106,0.3)' }} />
          </div>
          {/* tier labels */}
          <div style={{ display: 'flex', fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)', marginTop: 4 }}>
            <div style={{ flex: 75 }}>UNSAT</div>
            <div style={{ flex: 15 }}>SAT</div>
            <div style={{ flex: 10, textAlign: 'right' }}>EXC</div>
          </div>
          {/* you marker */}
          <div style={{
            position: 'absolute', left: '94%', top: -4, bottom: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            transform: 'translateX(-50%)',
          }}>
            <div style={{ fontFamily: stencilFont, fontSize: 9, color: 'var(--accent)', letterSpacing: 1, marginBottom: 2 }}>YOU</div>
            <div style={{ width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '6px solid var(--accent)' }} />
          </div>
        </div>
      </div>

      {/* Component tabs as ammo-box style */}
      <div style={{ padding: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, borderBottom: '1px solid var(--border)' }}>
        {Object.entries(components).map(([k, c]) => {
          const isActive = k === active;
          return (
            <button key={k} onClick={() => setActive(k)} style={{
              background: isActive ? 'var(--accent)' : 'var(--panel)',
              color: isActive ? 'var(--bg)' : 'var(--ink)',
              border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              padding: '8px 6px', cursor: 'pointer',
              fontFamily: stencilFont, position: 'relative',
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            }}>
              <div style={{ fontSize: 10, letterSpacing: 2, opacity: 0.7 }}>{c.short}</div>
              <div style={{ fontSize: 24, letterSpacing: 1, marginTop: 2 }}>
                {c.kind === 'time' ? fmtMSColon(c.valueSec) : c.value}
              </div>
              <div style={{ fontSize: 9, letterSpacing: 2, marginTop: 4, opacity: 0.85 }}>
                {c.score}/{c.scoreMax}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active component editor */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontFamily: stencilFont, fontSize: 13, letterSpacing: 2, color: 'var(--accent)' }}>
            ▣ {cs.name}
          </div>
          <button onClick={() => setChartOpen(true)} style={{
            background: 'transparent', border: '1px solid var(--accent)',
            color: 'var(--accent)', padding: '3px 8px', borderRadius: 2,
            fontFamily: stencilFont, fontSize: 10, letterSpacing: 2, cursor: 'pointer',
          }}>CHART ▸</button>
        </div>

        {active === 'core' && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {[['sit','SIT-UPS'],['plank','PLANK']].map(([k, l]) => (
              <button key={k} onClick={() => setCoreEx(k)} style={{
                flex: 1, padding: '5px 6px', fontFamily: stencilFont, fontSize: 11, letterSpacing: 2,
                background: coreEx === k ? 'var(--accent)' : 'transparent',
                color: coreEx === k ? 'var(--bg)' : 'var(--ink-dim)',
                border: '1px solid var(--border-strong)', cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
        )}

        {/* tap-to-edit big number */}
        <div style={{
          padding: '10px 12px', border: '2px dashed var(--border-strong)',
          marginBottom: 8, position: 'relative', cursor: 'pointer',
          background: 'var(--panel)',
        }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--ink-dim)', marginBottom: 2 }}>
            ✎ TAP TO EDIT
          </div>
          <div style={{ fontFamily: stencilFont, fontSize: 44, lineHeight: 1, color: 'var(--accent)', letterSpacing: 2 }}>
            {cs.kind === 'time' ? fmtMSColon(cs.valueSec) : cs.value}
            <span style={{ fontSize: 14, color: 'var(--ink-dim)', marginLeft: 8, letterSpacing: 1 }}>
              {cs.kind === 'time' ? '' : 'reps'}
            </span>
          </div>
          <div style={{ position: 'absolute', top: 8, right: 10, fontFamily: stencilFont, fontSize: 11, letterSpacing: 2, color: 'var(--accent-2)' }}>
            {cs.score}/{cs.scoreMax} pts
          </div>
        </div>

        {/* slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: stencilFont, fontSize: 11, letterSpacing: 1, color: 'var(--ink-dim)' }}>
            MIN<br/>{cs.kind === 'time' ? fmtMSColon(cs.min) : cs.min}
          </span>
          <div style={{ flex: 1, position: 'relative', height: 18 }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 7, height: 4, background: 'var(--panel-2)', border: '1px solid var(--border-strong)' }} />
            <div style={{ position: 'absolute', left: 0, top: 7, width: '70%', height: 4, background: 'var(--accent)' }} />
            <div style={{ position: 'absolute', left: '70%', top: 0, width: 14, height: 18, transform: 'translateX(-50%)', background: 'var(--accent)', border: '2px solid var(--bg)' }} />
          </div>
          <span style={{ fontFamily: stencilFont, fontSize: 11, letterSpacing: 1, color: 'var(--accent-2)', textAlign: 'right' }}>
            MAX<br/>{cs.kind === 'time' ? fmtMSColon(cs.max) : cs.max}
          </span>
        </div>
      </div>

      {/* Lap splits — bar chart pace strip */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: stencilFont, fontSize: 12, letterSpacing: 2, color: 'var(--accent)' }}>
            ⊟ LAP-PACE PLAN
          </div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>
            8 × 400M → {fmtMSColon(D.components.run.valueSec)}
          </div>
        </div>
        {/* bar chart */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 80, marginBottom: 6 }}>
          {D.laps.map((l) => {
            const h = ((l.paceSec - 95) / 12) * 80;
            return (
              <div key={l.n} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ fontFamily: stencilFont, fontSize: 9, color: 'var(--accent-2)' }}>{fmtMS(l.paceSec)}</div>
                <div style={{ width: '100%', height: Math.max(h, 12), background: 'var(--accent)', position: 'relative' }} />
                <div style={{ fontFamily: stencilFont, fontSize: 10, color: 'var(--ink-dim)' }}>L{l.n}</div>
              </div>
            );
          })}
        </div>
        {/* split totals row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, marginTop: 4 }}>
          {D.laps.map((l) => (
            <div key={l.n} style={{ textAlign: 'center', fontFamily: stencilFont, fontSize: 9, letterSpacing: 1, color: 'var(--ink)' }}>
              {fmtMSColon(l.splitSec)}
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <FrameToggle value={frameKind} onChange={onFrameChange} />
        <ThemeSwitcher value={themeKey} onChange={onTheme} />
      </div>

      {/* Settings drawer (peek from right) */}
      {settingsOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
          <div onClick={() => setSettingsOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: '76%',
            background: 'var(--panel)', borderLeft: `2px solid var(--accent)`,
            padding: 14, fontFamily: 'var(--font)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: stencilFont, fontSize: 14, letterSpacing: 2, color: 'var(--accent)' }}>SETTINGS</div>
              <button onClick={() => setSettingsOpen(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink)', padding: '3px 8px', cursor: 'pointer', fontFamily: stencilFont, fontSize: 10, letterSpacing: 2 }}>✕</button>
            </div>
            {[
              ['SEX', 'Male'],
              ['AGE GROUP', '25–29'],
              ['STANDARD', 'AFFT 2.0'],
              ['ALTITUDE', 'Sea Level'],
              ['UNITS', 'Imperial'],
            ].map(([l, v]) => (
              <div key={l} style={{ padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--ink-dim)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontFamily: stencilFont, fontSize: 13, letterSpacing: 1.5, color: 'var(--ink)' }}>{v} ▾</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChartDrawer open={chartOpen} onClose={() => setChartOpen(false)} component={cs} themeKey={themeKey} />
    </div>
  );
}

window.MockStencil = MockStencil;
