// mock-fitness.jsx — Mock E: FITNESS GRADIENT (no frame)

// Stadium-shape perimeter parameterization. t in [0,1) starts at top-middle, goes clockwise.
// `expand` pushes the point outward along the local normal (for label halos).
function stadiumPoint(t, x, y, w, h, r, expand = 0) {
  const P = 2 * (w - 2 * r) + 2 * Math.PI * r;
  let s = ((t % 1) + 1) % 1 * P;
  const sh = w / 2 - r;
  const semi = Math.PI * r;
  if (s < sh) return { x: x + w / 2 + s, y: y - expand };
  s -= sh;
  if (s < semi) {
    const a = -Math.PI / 2 + (s / semi) * Math.PI;
    return { x: x + w - r + (r + expand) * Math.cos(a), y: y + r + (r + expand) * Math.sin(a) };
  }
  s -= semi;
  if (s < w - 2 * r) return { x: x + w - r - s, y: y + h + expand };
  s -= w - 2 * r;
  if (s < semi) {
    const a = Math.PI / 2 + (s / semi) * Math.PI;
    return { x: x + r + (r + expand) * Math.cos(a), y: y + r + (r + expand) * Math.sin(a) };
  }
  s -= semi;
  return { x: x + r + s, y: y - expand };
}

// score: big ring with gradient · input: tap-to-edit + slider · demographics: top header w/ avatar
// altitude: visible · lap breakdown: 4-up tile grid (compact, scrolls horizontally for 8)

function MockFitness({ themeKey = 'fitness', onTheme, frameKind = 'ios', onFrameChange }) {
  const [active, setActive] = React.useState('run');
  const [chartOpen, setChartOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [coreEx, setCoreEx] = React.useState('plank');
  const [pushVariant, setPushVariant] = React.useState('hrpu'); // hrpu | std | exempt
  const [runVariant, setRunVariant] = React.useState('run');    // run | hamr | exempt
  const [editing, setEditing] = React.useState(false);
  const [sex, setSex] = React.useState('M');
  const [age, setAge] = React.useState('25–29');
  const [standard, setStandard] = React.useState('AFFT 2.0');
  const [waistIn, setWaistIn] = React.useState(34);
  const [heightIn, setHeightIn] = React.useState(70);
  const safeTop = frameKind === 'ios' ? 56 : 44;
  const rootRef = React.useRef(null);
  React.useEffect(() => { applyTheme(rootRef.current, themeKey); }, [themeKey]);

  const afpt = useAFPTState();
  const D = afpt.live;
  const cores = { sit: D.components.core, plank: D.components.plank };

  const HAMR_META = { kind: 'reps', name: '20M HAMR SHUTTLES', short: 'HAMR', value: 80, min: 21, max: 96, score: 49, scoreMax: 60, status: 'EXC' };
  const EXEMPT_RUN = { kind: 'exempt', name: 'CARDIO — EXEMPT', short: 'EXMT', score: 0, scoreMax: 60, status: 'EXMT' };
  const EXEMPT_PUSH = { kind: 'exempt', name: 'STRENGTH — EXEMPT', short: 'EXMT', score: 0, scoreMax: 20, status: 'EXMT' };
  const STD_PUSH = { ...D.components.push, name: '1-MINUTE PUSH-UPS', short: 'PUSH' };
  const pushC = pushVariant === 'exempt' ? EXEMPT_PUSH : pushVariant === 'std' ? STD_PUSH : { ...D.components.push, short: 'HRPU', name: 'HAND-RELEASE PUSH-UPS' };
  const runC = runVariant === 'exempt' ? EXEMPT_RUN : runVariant === 'hamr' ? HAMR_META : D.components.run;
  const components = { push: pushC, core: cores[coreEx], run: runC };
  const cs = components[active];
  const isExempt = cs.kind === 'exempt';
  const activeStateKey = active === 'core' ? coreEx : active;
  const csValue = !isExempt && (cs.kind === 'time' ? cs.valueSec : cs.value);
  const csPct = !isExempt && (cs.kind === 'time' ? (cs.max - csValue) / (cs.max - cs.min) : (csValue - cs.min) / (cs.max - cs.min));
  const fillPct = Math.max(0, Math.min(1, csPct || 0)) * 100;
  const whtr = waistIn / heightIn;
  const whtrPass = whtr <= 0.55;
  const sliderPos = cs.kind === 'time' ? 100 - fillPct : fillPct;
  const onSliderChange = (v) => afpt.setValue(activeStateKey, v);
  const onTextEdit = (raw) => {
    if (cs.kind === 'time') { const s = parseMSS(raw); if (s != null) afpt.setValue(activeStateKey, s); }
    else { const n = parseInt(raw, 10); if (!isNaN(n)) afpt.setValue(activeStateKey, n); }
  };

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

        {active === 'push' && (
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.18)', borderRadius: 999, padding: 3, marginBottom: 12, gap: 2 }}>
            {[['hrpu','HRPU'],['std','Push-ups'],['exempt','Exempt']].map(([k, l]) => (
              <button key={k} onClick={() => setPushVariant(k)} style={{
                flex: 1, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                background: pushVariant === k ? '#fff' : 'transparent',
                color: pushVariant === k ? '#3a0f4d' : 'rgba(255,255,255,0.7)',
                border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
              }}>{l}</button>
            ))}
          </div>
        )}

        {active === 'run' && (
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.18)', borderRadius: 999, padding: 3, marginBottom: 12, gap: 2 }}>
            {[['run','2-mile'],['hamr','HAMR'],['exempt','Exempt']].map(([k, l]) => (
              <button key={k} onClick={() => setRunVariant(k)} style={{
                flex: 1, padding: '5px 10px', fontSize: 11, fontWeight: 600,
                background: runVariant === k ? '#fff' : 'transparent',
                color: runVariant === k ? '#3a0f4d' : 'rgba(255,255,255,0.7)',
                border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
              }}>{l}</button>
            ))}
          </div>
        )}

        {isExempt ? (
          <div style={{ padding: '20px 8px', textAlign: 'center', background: 'rgba(0,0,0,0.18)', borderRadius: 14 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>Exempt</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 4, lineHeight: 1.4 }}>
              Component skipped per medical profile.<br/>Composite computed from remaining components.
            </div>
          </div>
        ) : (
          <React.Fragment>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
              {editing ? (
                <input autoFocus type="text"
                  value={cs.kind === 'time' ? fmtMSColon(cs.valueSec) : cs.value}
                  onChange={(e) => onTextEdit(e.target.value)}
                  onBlur={() => setEditing(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditing(false); }}
                  style={{
                    fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -2,
                    background: 'transparent', border: 'none', outline: 'none',
                    width: '4ch', padding: 0, fontFamily: 'inherit',
                  }} />
              ) : (
                <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>
                  {cs.kind === 'time' ? fmtMSColon(cs.valueSec) : cs.value}
                </div>
              )}
              <button onClick={() => setEditing(true)} style={{
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

            <LiveRange value={csValue} min={cs.min} max={cs.max} onChange={onSliderChange} style={{ height: 24 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 10, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4 }} />
              <div style={{ position: 'absolute', left: 0, top: 10, width: `${sliderPos}%`, height: 4, background: 'linear-gradient(90deg, #ffb547, #ff5dab)', borderRadius: 4 }} />
              <div style={{ position: 'absolute', left: `${sliderPos}%`, top: 1, width: 22, height: 22, borderRadius: '50%', background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }} />
            </LiveRange>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
              <span>min · {cs.kind === 'time' ? fmtMSColon(cs.min) : cs.min}</span>
              <span style={{ color: '#ffd97a' }}>max · {cs.kind === 'time' ? fmtMSColon(cs.max) : cs.max}</span>
            </div>
          </React.Fragment>
        )}

        {active === 'run' && runVariant === 'run' && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.18)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>⛰ Altitude adjustment</span>
            <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>Sea Level ▾</span>
          </div>
        )}
      </div>

      {/* Body composition — WHtR */}
      <div style={{ margin: '0 16px 14px', background: 'rgba(255,255,255,0.08)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)', padding: 16, backdropFilter: 'blur(14px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: 1 }}>BODY COMPOSITION</div>
          <div style={{
            fontSize: 10, letterSpacing: 1.5, fontWeight: 700, padding: '3px 9px', borderRadius: 999,
            background: whtrPass ? 'rgba(123,228,168,0.18)' : 'rgba(255,138,161,0.18)',
            color: whtrPass ? '#7be4a8' : '#ff8aa1',
            border: `1px solid ${whtrPass ? 'rgba(123,228,168,0.4)' : 'rgba(255,138,161,0.4)'}`,
          }}>{whtrPass ? 'PASS' : 'FAIL'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1, letterSpacing: -1.5 }}>{whtr.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>WHtR · max 0.55</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[
            ['Waist', waistIn, setWaistIn, 24, 50],
            ['Height', heightIn, setHeightIn, 58, 84],
          ].map(([lbl, val, setter, mn, mx]) => (
            <div key={lbl}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,0.55)' }}>{lbl.toUpperCase()}</span>
                <input type="number" value={val} min={mn} max={mx}
                  onChange={(e) => setter(parseInt(e.target.value) || mn)}
                  style={{ width: 54, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, textAlign: 'right', borderRadius: 8, padding: '3px 6px', outline: 'none' }} />
              </div>
              <LiveRange value={val} min={mn} max={mx} onChange={setter} style={{ height: 20 }}>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 4 }} />
                <div style={{ position: 'absolute', left: 0, top: 8, width: `${(val - mn) / (mx - mn) * 100}%`, height: 4, background: 'linear-gradient(90deg, #ffb547, #ff5dab)', borderRadius: 4 }} />
                <div style={{ position: 'absolute', left: `${(val - mn) / (mx - mn) * 100}%`, top: 1, width: 18, height: 18, borderRadius: '50%', background: '#fff', transform: 'translateX(-50%)', boxShadow: '0 4px 10px rgba(0,0,0,0.25)' }} />
              </LiveRange>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{mn}–{mx} in</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lap plan — Track Clock checkpoints */}
      <div style={{ margin: '0 16px 14px', background: 'rgba(255,255,255,0.06)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', padding: '14px 10px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2, padding: '0 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>Pace plan</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
            each lap · <span style={{ color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fmtMS(Math.round(D.components.run.valueSec / 8))}</span>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4, padding: '0 4px' }}>
          Glance at your watch crossing the line.
        </div>

        {/* Stadium track w/ 8 checkpoints */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width="100%" viewBox="0 0 340 190" style={{ maxWidth: 340, display: 'block' }}>
            <defs>
              <linearGradient id="finGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffb547" />
                <stop offset="1" stopColor="#ff5dab" />
              </linearGradient>
            </defs>

            {/* track surface */}
            <rect x="70" y="50" width="200" height="90" rx="45" fill="none"
                  stroke="rgba(255,255,255,0.12)" strokeWidth="14" />
            <rect x="70" y="50" width="200" height="90" rx="45" fill="none"
                  stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="2 6" />

            {/* center: goal time */}
            <text x="170" y="87" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" letterSpacing="2">GOAL</text>
            <text x="170" y="113" textAnchor="middle" fill="#fff" fontSize="26" fontWeight="800" letterSpacing="-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {fmtMSColon(D.components.run.valueSec)}
            </text>

            {/* 8 checkpoint markers */}
            {D.laps.map((l, i) => {
              const t = ((i + 1) / 8) % 1;
              const p = stadiumPoint(t, 70, 50, 200, 90, 45, 0);
              const lp = stadiumPoint(t, 70, 50, 200, 90, 45, 22);
              const isFinish = i === 7;
              const anchor = (t > 0.05 && t < 0.45) ? 'start'
                           : (t > 0.55 && t < 0.95) ? 'end'
                           : 'middle';
              const labelDx = anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0;
              return (
                <g key={l.n}>
                  <circle cx={p.x} cy={p.y} r={isFinish ? 7 : 4.5}
                          fill={isFinish ? 'url(#finGrad)' : '#fff'}
                          stroke={isFinish ? 'rgba(255,255,255,0.4)' : 'none'} strokeWidth="1.5" />
                  {isFinish && (
                    <text x={p.x} y={p.y + 0.5} textAnchor="middle" dominantBaseline="middle"
                          fontSize="6" fontWeight="800" fill="#2b1456" letterSpacing="0.5">FIN</text>
                  )}
                  <text x={lp.x + labelDx} y={lp.y - 4} textAnchor={anchor} fontSize="8"
                        fill={isFinish ? '#ffb547' : 'rgba(255,255,255,0.55)'} letterSpacing="1" fontWeight="600">
                    {isFinish ? 'FINISH' : `L${l.n}`}
                  </text>
                  <text x={lp.x + labelDx} y={lp.y + 7} textAnchor={anchor} fontSize="11"
                        fill="#fff" fontWeight={isFinish ? 800 : 600}
                        style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fmtMSColon(l.splitSec)}
                  </text>
                </g>
              );
            })}
          </svg>
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
