// mock-tactical.jsx — Mock A: TACTICAL HUD (frame toggle: iOS / Android)
// score: big number + EXC badge · input: slider + numeric field
// demographics: sex/age/standard dropdowns ALWAYS VISIBLE on main
// altitude: visible near run · lap breakdown: full 8 rows w/ pace bars

function MockTactical({ themeKey = 'tactical', onTheme, frameKind = 'ios', onFrameChange }) {
  const [active, setActive] = React.useState('run');
  const [chartOpen, setChartOpen] = React.useState(false);
  const [coreEx, setCoreEx] = React.useState('plank');
  const [standard, setStandard] = React.useState('AFFT 2.0');
  const [sex, setSex] = React.useState('M');
  const [age, setAge] = React.useState('25–29');
  const rootRef = React.useRef(null);
  React.useEffect(() => { applyTheme(rootRef.current, themeKey); }, [themeKey]);

  const D = AFPT_DATA;
  const cores = { sit: D.components.core, plank: D.components.plank };
  const components = { push: D.components.push, core: cores[coreEx], run: D.components.run };
  const cs = components[active];

  // safe-area top padding so AF-PRT row sits BELOW status icons / notch
  const safeTop = frameKind === 'ios' ? 56 : 44;

  // tactical-styled select
  const selectStyle = {
    background: 'var(--panel-2)', border: '1px solid var(--border-strong)',
    color: 'var(--accent)', fontFamily: 'var(--font)', fontSize: 10,
    letterSpacing: 1.5, padding: '4px 6px', borderRadius: 3, outline: 'none',
    cursor: 'pointer', textTransform: 'uppercase',
  };

  const compRow = (key, c) => {
    const isActive = key === active;
    return (
      <button key={key} onClick={() => setActive(key)} style={{
        flex: 1, background: isActive ? 'var(--panel-2)' : 'transparent',
        border: `1px solid ${isActive ? 'var(--border-strong)' : 'var(--border)'}`,
        borderRadius: 4, padding: '8px 4px',
        color: isActive ? 'var(--accent)' : 'var(--ink)',
        fontFamily: 'var(--font)', cursor: 'pointer', position: 'relative',
      }}>
        {isActive && <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%', boxShadow: '0 0 8px var(--accent)' }} />}
        <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)', marginBottom: 4 }}>{c.short}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, lineHeight: 1 }}>
          {c.kind === 'time' ? fmtMSColon(c.valueSec) : c.value}
        </div>
        <div style={{ fontSize: 9, marginTop: 4, letterSpacing: 1.5,
          color: c.status === 'MAX' || c.status === 'EXC' ? 'var(--accent-2)' : 'var(--accent)' }}>
          ▲ {c.status}
        </div>
      </button>
    );
  };

  return (
    <div ref={rootRef} style={{
      width: '100%', height: '100%',
      background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font)',
      overflow: 'auto', position: 'relative',
      backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(29,233,255,0.025) 2px, rgba(29,233,255,0.025) 3px)',
    }}>
      {/* Title row — sits BELOW status bar / notch */}
      <div style={{
        paddingTop: safeTop, padding: `${safeTop}px 14px 8px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
          <div style={{ fontFamily: 'var(--font-display)', letterSpacing: 2, fontSize: 13, color: 'var(--accent)' }}>AF-PRT</div>
        </div>
        <button onClick={() => alert('Settings')} aria-label="Settings" style={{
          width: 30, height: 30, background: 'var(--panel-2)',
          border: '1px solid var(--border-strong)', borderRadius: 4,
          color: 'var(--accent)', cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>⚙</button>
      </div>

      {/* Demographics dropdowns — ALWAYS VISIBLE on main */}
      <div style={{
        padding: '0 14px 12px', borderBottom: '1px solid var(--border)',
        display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 6,
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--ink-dim)', marginBottom: 3 }}>SEX</div>
          <select value={sex} onChange={(e) => setSex(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
            <option value="M">MALE</option>
            <option value="F">FEMALE</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--ink-dim)', marginBottom: 3 }}>AGE</div>
          <select value={age} onChange={(e) => setAge(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
            <option>&lt;25</option>
            <option>25–29</option>
            <option>30–34</option>
            <option>35–39</option>
            <option>40–44</option>
            <option>45–49</option>
            <option>50–54</option>
            <option>55–59</option>
            <option>60+</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 8, letterSpacing: 2, color: 'var(--ink-dim)', marginBottom: 3 }}>STANDARD</div>
          <select value={standard} onChange={(e) => setStandard(e.target.value)} style={{ ...selectStyle, width: '100%' }}>
            <option>AFFT 2.0</option>
            <option>LEGACY</option>
          </select>
        </div>
      </div>

      {/* Composite score */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--ink-dim)' }}>COMP</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 700, lineHeight: 1, color: 'var(--ink)' }}>
            {D.composite.toFixed(1)}
          </div>
          <div style={{ border: '1px solid var(--accent-2)', color: 'var(--accent-2)', padding: '2px 8px', borderRadius: 3, fontSize: 10, letterSpacing: 2 }}>▲ EXC</div>
          <div style={{ marginLeft: 'auto', fontSize: 10, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>
            +{D.passDelta.toFixed(0)} PASS · +{D.maxDelta.toFixed(0)} MAX
          </div>
        </div>
        <div style={{ marginTop: 10, position: 'relative', height: 8, background: 'var(--panel-2)', borderRadius: 2, border: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '75%', background: 'linear-gradient(90deg, var(--bad), var(--warn) 60%, var(--accent-2))', opacity: 0.5 }} />
          <div style={{ position: 'absolute', left: '94%', top: -3, bottom: -3, width: 2, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, letterSpacing: 1.5, color: 'var(--ink-dim)', marginTop: 4 }}>
          <span>UNSAT</span><span>SAT 75</span><span>EXC 90</span><span>MAX 100</span>
        </div>
      </div>

      <div style={{ padding: 12, display: 'flex', gap: 6, borderBottom: '1px solid var(--border)' }}>
        {Object.entries(components).map(([k, c]) => compRow(k, c))}
      </div>

      <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--accent)' }}>{cs.name}</div>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>
            SCORE <span style={{ color: 'var(--ink)' }}>{cs.score}/{cs.scoreMax}</span>
          </div>
        </div>

        {active === 'core' && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {[['sit','SIT-UPS'],['plank','PLANK']].map(([k, l]) => (
              <button key={k} onClick={() => setCoreEx(k)} style={{
                flex: 1, padding: '4px 6px', fontSize: 9, letterSpacing: 1.5,
                background: coreEx === k ? 'var(--accent)' : 'transparent',
                color: coreEx === k ? 'var(--bg)' : 'var(--ink-dim)',
                border: '1px solid var(--border)', borderRadius: 3, fontFamily: 'inherit', cursor: 'pointer',
              }}>{l}</button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 700, lineHeight: 1, color: 'var(--ink)' }}>
            {cs.kind === 'time' ? fmtMSColon(cs.valueSec) : cs.value}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, border: '1px solid var(--border-strong)', borderRadius: 3, padding: '4px 6px' }}>
            <span style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>EDIT</span>
            <input type="text" defaultValue={cs.kind === 'time' ? fmtMSColon(cs.valueSec) : cs.value} style={{
              width: 60, background: 'transparent', border: 'none',
              color: 'var(--accent)', fontFamily: 'var(--font-display)',
              fontSize: 14, outline: 'none', textAlign: 'right',
            }} />
          </div>
          <button onClick={() => setChartOpen(true)} style={{
            marginLeft: 'auto', background: 'transparent',
            border: '1px solid var(--border-strong)', color: 'var(--accent)',
            padding: '5px 10px', borderRadius: 3, fontSize: 9,
            letterSpacing: 1.5, fontFamily: 'inherit', cursor: 'pointer',
          }}>[ CHART ]</button>
        </div>

        <div style={{ position: 'relative', height: 28 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 12, height: 4, background: 'var(--panel-2)', border: '1px solid var(--border)' }} />
          <div style={{ position: 'absolute', left: 0, top: 12, width: '70%', height: 4, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: `${i * 10}%`, top: 8, width: 1, height: 12, background: 'var(--border-strong)' }} />
          ))}
          <div style={{ position: 'absolute', left: '70%', top: 6, width: 14, height: 14, transform: 'translateX(-50%)', background: 'var(--accent)', boxShadow: '0 0 12px var(--accent)', clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)', marginTop: 2 }}>
          <span>MIN <span style={{ color: 'var(--ink)' }}>{cs.kind === 'time' ? fmtMSColon(cs.min) : cs.min}</span></span>
          <span>MAX <span style={{ color: 'var(--accent-2)' }}>{cs.kind === 'time' ? fmtMSColon(cs.max) : cs.max}</span></span>
        </div>

        {active === 'run' && (
          <div style={{ marginTop: 10, padding: '6px 8px', border: '1px dashed var(--border-strong)', borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>⛰ ALT-ADJ</span>
            <select defaultValue={D.altitude} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontFamily: 'inherit', fontSize: 10, letterSpacing: 1, outline: 'none' }}>
              <option>Sea Level</option><option>3000–4000 ft</option><option>4000–5000 ft</option><option>5000+ ft</option>
            </select>
          </div>
        )}
      </div>

      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'var(--accent)' }}>LAP SPLITS</div>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>8 × 400M · TGT {fmtMSColon(D.components.run.valueSec)}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 2fr', fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
          <span>#</span><span>PACE</span><span>SPLIT</span><span></span>
        </div>
        {D.laps.map((l) => (
          <div key={l.n} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 2fr', fontSize: 12, padding: '6px 0', borderBottom: '1px dashed var(--border)', alignItems: 'center' }}>
            <span style={{ color: 'var(--ink-dim)' }}>{l.n}</span>
            <span style={{ fontFamily: 'var(--font-display)' }}>{fmtMS(l.paceSec)}</span>
            <span style={{ fontFamily: 'var(--font-display)' }}>{fmtMSColon(l.splitSec)}</span>
            <div style={{ height: 4, background: 'var(--panel-2)', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(l.paceSec - 95) / 15 * 100}%`, background: 'var(--accent-2)', boxShadow: '0 0 6px var(--accent-2)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* footer — frame toggle + theme switcher */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>FRAME</div>
          <div style={{ display: 'flex', border: '1px solid var(--border-strong)', borderRadius: 3, overflow: 'hidden' }}>
            {[['ios','iOS'],['android','ANDROID']].map(([k, l]) => (
              <button key={k} onClick={() => onFrameChange?.(k)} style={{
                padding: '4px 8px', fontSize: 9, letterSpacing: 1.5,
                background: frameKind === k ? 'var(--accent)' : 'transparent',
                color: frameKind === k ? 'var(--bg)' : 'var(--ink-dim)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: 'var(--ink-dim)' }}>THEME</div>
          <ThemeSwitcher value={themeKey} onChange={onTheme} />
        </div>
      </div>

      <ChartDrawer open={chartOpen} onClose={() => setChartOpen(false)} component={cs} themeKey={themeKey} />
    </div>
  );
}

window.MockTactical = MockTactical;
