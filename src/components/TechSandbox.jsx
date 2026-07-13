import React, { useState, useMemo } from 'react'
import {
  Zap, Lightbulb, CircuitBoard, Waves, Timer, Binary, BatteryCharging
} from 'lucide-react'

/* ------------------------------------------------------------------ *
 * Shared helpers — real engineering math, no simulation.
 * ------------------------------------------------------------------ */

// E-series (standard preferred values) used to snap to real parts.
const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82]
const E24 = [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91]

function nearestESeries(value, series = E24) {
  if (!isFinite(value) || value <= 0) return null
  const decade = Math.floor(Math.log10(value))
  let best = null
  for (let d = decade - 1; d <= decade + 1; d++) {
    const mult = Math.pow(10, d)
    for (const base of series) {
      const candidate = base * mult
      if (best === null || Math.abs(candidate - value) < Math.abs(best - value)) {
        best = candidate
      }
    }
  }
  return best
}

// Format a value with SI prefix + unit (e.g. 1500 Ω -> "1.5 kΩ").
function si(value, unit = '', digits = 3) {
  if (value === null || value === undefined || !isFinite(value)) return '—'
  if (value === 0) return `0 ${unit}`.trim()
  const prefixes = [
    { p: 'G', e: 9 }, { p: 'M', e: 6 }, { p: 'k', e: 3 },
    { p: '', e: 0 }, { p: 'm', e: -3 }, { p: 'µ', e: -6 },
    { p: 'n', e: -9 }, { p: 'p', e: -12 }
  ]
  const abs = Math.abs(value)
  const chosen = prefixes.find(pr => abs >= Math.pow(10, pr.e)) || prefixes[prefixes.length - 1]
  const scaled = value / Math.pow(10, chosen.e)
  const str = parseFloat(scaled.toPrecision(digits)).toString()
  return `${str} ${chosen.p}${unit}`.trim()
}

const num = (v) => {
  const n = parseFloat(v)
  return isFinite(n) ? n : NaN
}

/* Reusable little primitives ---------------------------------------- */

function Field({ label, hint, children }) {
  return (
    <label className="lab-field">
      <span className="lab-field-label">
        {label}
        {hint ? <em className="lab-field-hint">{hint}</em> : null}
      </span>
      {children}
    </label>
  )
}

function Readout({ label, value, accent = false, danger = false }) {
  return (
    <div className={`lab-readout ${accent ? 'is-accent' : ''} ${danger ? 'is-danger' : ''}`}>
      <span className="lab-readout-label">{label}</span>
      <span className="lab-readout-value">{value}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * TOOL 1 — Ohm's Law & Power
 * ------------------------------------------------------------------ */
function OhmsLaw() {
  const [v, setV] = useState('5')
  const [i, setI] = useState('')
  const [r, setR] = useState('220')

  const solved = useMemo(() => {
    let V = num(v), I = num(i), R = num(r)
    const known = [!isNaN(V), !isNaN(I), !isNaN(R)].filter(Boolean).length
    if (known < 2) return { error: 'Enter any two values.' }

    if (!isNaN(V) && !isNaN(I)) R = V / I
    else if (!isNaN(V) && !isNaN(R)) I = V / R
    else if (!isNaN(I) && !isNaN(R)) V = I * R

    const P = V * I
    if (!isFinite(V) || !isFinite(I) || !isFinite(R)) return { error: 'Values produce an undefined result.' }
    return { V, I, R, P }
  }, [v, i, r])

  return (
    <ToolShell
      title="Ohm's Law & Power"
      desc="Enter any two of voltage, current, or resistance — the rest are derived, including power dissipation."
    >
      <div className="lab-grid-3">
        <Field label="Voltage" hint="V"><input className="lab-input" inputMode="decimal" value={v} placeholder="—" onChange={e => setV(e.target.value)} /></Field>
        <Field label="Current" hint="A"><input className="lab-input" inputMode="decimal" value={i} placeholder="—" onChange={e => setI(e.target.value)} /></Field>
        <Field label="Resistance" hint="Ω"><input className="lab-input" inputMode="decimal" value={r} placeholder="—" onChange={e => setR(e.target.value)} /></Field>
      </div>

      {solved.error ? (
        <div className="lab-note">{solved.error}</div>
      ) : (
        <div className="lab-results">
          <Readout label="Voltage" value={si(solved.V, 'V')} accent />
          <Readout label="Current" value={si(solved.I, 'A')} accent />
          <Readout label="Resistance" value={si(solved.R, 'Ω')} accent />
          <Readout label="Power" value={si(solved.P, 'W')} accent />
        </div>
      )}
      <div className="lab-formula">V = I · R&nbsp;&nbsp;•&nbsp;&nbsp;P = V · I = I²R = V²/R</div>
    </ToolShell>
  )
}

/* ------------------------------------------------------------------ *
 * TOOL 2 — LED Series Resistor Designer
 * ------------------------------------------------------------------ */
function LedResistor() {
  const [vs, setVs] = useState('5')
  const [vf, setVf] = useState('2.0')
  const [mA, setMA] = useState('20')

  const out = useMemo(() => {
    const Vs = num(vs), Vf = num(vf), If = num(mA) / 1000
    if ([Vs, Vf, If].some(isNaN)) return { error: 'Fill in every field.' }
    if (Vf >= Vs) return { error: 'Supply must exceed the LED forward voltage.' }
    if (If <= 0) return { error: 'LED current must be positive.' }
    const R = (Vs - Vf) / If
    const nearest = nearestESeries(R, E12)
    const actualI = (Vs - Vf) / nearest
    const P = (Vs - Vf) * If
    const Pnearest = (Vs - Vf) * actualI
    const rating = Pnearest <= 0.0625 ? '1/16 W' : Pnearest <= 0.125 ? '1/8 W' : Pnearest <= 0.25 ? '1/4 W' : Pnearest <= 0.5 ? '1/2 W' : '≥ 1 W'
    return { R, nearest, actualI, P, Pnearest, rating }
  }, [vs, vf, mA])

  return (
    <ToolShell
      title="LED Series Resistor"
      desc="Size the current-limiting resistor for an LED, snapped to the nearest standard E12 value with a power-rating recommendation."
    >
      <div className="lab-grid-3">
        <Field label="Supply" hint="V"><input className="lab-input" inputMode="decimal" value={vs} onChange={e => setVs(e.target.value)} /></Field>
        <Field label="LED Vf" hint="V"><input className="lab-input" inputMode="decimal" value={vf} onChange={e => setVf(e.target.value)} /></Field>
        <Field label="LED current" hint="mA"><input className="lab-input" inputMode="decimal" value={mA} onChange={e => setMA(e.target.value)} /></Field>
      </div>

      {out.error ? (
        <div className="lab-note">{out.error}</div>
      ) : (
        <div className="lab-results">
          <Readout label="Ideal resistor" value={si(out.R, 'Ω')} />
          <Readout label="Nearest E12" value={si(out.nearest, 'Ω')} accent />
          <Readout label="Actual current" value={si(out.actualI, 'A')} />
          <Readout label="Min. resistor rating" value={out.rating} accent />
        </div>
      )}
      <div className="lab-formula">R = (V_supply − V_f) / I_LED</div>
    </ToolShell>
  )
}

/* ------------------------------------------------------------------ *
 * TOOL 3 — Resistor Color Decoder
 * ------------------------------------------------------------------ */
const DIGITS = [
  { name: 'Black', v: 0, hex: '#111114', fg: '#fff' },
  { name: 'Brown', v: 1, hex: '#7c4a1e', fg: '#fff' },
  { name: 'Red', v: 2, hex: '#d63b30', fg: '#fff' },
  { name: 'Orange', v: 3, hex: '#e8862b', fg: '#111' },
  { name: 'Yellow', v: 4, hex: '#f2d045', fg: '#111' },
  { name: 'Green', v: 5, hex: '#3fae6b', fg: '#fff' },
  { name: 'Blue', v: 6, hex: '#3b7dd8', fg: '#fff' },
  { name: 'Violet', v: 7, hex: '#9b6dd6', fg: '#fff' },
  { name: 'Grey', v: 8, hex: '#9aa0a6', fg: '#111' },
  { name: 'White', v: 9, hex: '#f3f3f5', fg: '#111' }
]
const MULTS = [
  ...DIGITS.map(d => ({ ...d, mult: Math.pow(10, d.v), label: `×${si(Math.pow(10, d.v), '')}` })),
  { name: 'Gold', v: -1, hex: '#c9a227', fg: '#111', mult: 0.1, label: '×0.1' },
  { name: 'Silver', v: -2, hex: '#b8b8bd', fg: '#111', mult: 0.01, label: '×0.01' }
]
const TOLS = [
  { name: 'Brown', hex: '#7c4a1e', fg: '#fff', tol: 1 },
  { name: 'Red', hex: '#d63b30', fg: '#fff', tol: 2 },
  { name: 'Green', hex: '#3fae6b', fg: '#fff', tol: 0.5 },
  { name: 'Blue', hex: '#3b7dd8', fg: '#fff', tol: 0.25 },
  { name: 'Violet', hex: '#9b6dd6', fg: '#fff', tol: 0.1 },
  { name: 'Gold', hex: '#c9a227', fg: '#111', tol: 5 },
  { name: 'Silver', hex: '#b8b8bd', fg: '#111', tol: 10 }
]

function BandSelect({ options, value, onChange }) {
  return (
    <select className="lab-input lab-select" value={value} onChange={e => onChange(parseInt(e.target.value))}>
      {options.map((o, idx) => <option key={idx} value={idx}>{o.name}{o.label ? ` (${o.label})` : ''}</option>)}
    </select>
  )
}

function ResistorDecoder() {
  const [fiveBand, setFiveBand] = useState(false)
  const [d1, setD1] = useState(2) // red
  const [d2, setD2] = useState(2) // red
  const [d3, setD3] = useState(0) // black (5-band only)
  const [mult, setMult] = useState(1) // brown ×10
  const [tol, setTol] = useState(5) // gold 5%

  const out = useMemo(() => {
    const digits = fiveBand
      ? `${DIGITS[d1].v}${DIGITS[d2].v}${DIGITS[d3].v}`
      : `${DIGITS[d1].v}${DIGITS[d2].v}`
    const value = parseInt(digits, 10) * MULTS[mult].mult
    const tolerance = TOLS[tol].tol
    const min = value * (1 - tolerance / 100)
    const max = value * (1 + tolerance / 100)
    return { value, tolerance, min, max }
  }, [fiveBand, d1, d2, d3, mult, tol])

  const bandColors = fiveBand
    ? [DIGITS[d1], DIGITS[d2], DIGITS[d3], MULTS[mult], TOLS[tol]]
    : [DIGITS[d1], DIGITS[d2], MULTS[mult], TOLS[tol]]

  return (
    <ToolShell
      title="Resistor Color Decoder"
      desc="Read a resistor straight off the bands. Choose 4- or 5-band, set each ring, and get the value plus its tolerance window."
    >
      <div className="lab-seg">
        <button className={!fiveBand ? 'is-active' : ''} onClick={() => setFiveBand(false)}>4-band</button>
        <button className={fiveBand ? 'is-active' : ''} onClick={() => setFiveBand(true)}>5-band</button>
      </div>

      {/* Visual resistor */}
      <div className="resistor-viz">
        <span className="resistor-lead" />
        <div className="resistor-body">
          {bandColors.map((b, idx) => (
            <span key={idx} className="resistor-band" style={{ background: b.hex }} />
          ))}
        </div>
        <span className="resistor-lead" />
      </div>

      <div className={fiveBand ? 'lab-grid-5' : 'lab-grid-4'}>
        <Field label="Digit 1"><BandSelect options={DIGITS} value={d1} onChange={setD1} /></Field>
        <Field label="Digit 2"><BandSelect options={DIGITS} value={d2} onChange={setD2} /></Field>
        {fiveBand && <Field label="Digit 3"><BandSelect options={DIGITS} value={d3} onChange={setD3} /></Field>}
        <Field label="Multiplier"><BandSelect options={MULTS} value={mult} onChange={setMult} /></Field>
        <Field label="Tolerance"><BandSelect options={TOLS} value={tol} onChange={setTol} /></Field>
      </div>

      <div className="lab-results">
        <Readout label="Resistance" value={si(out.value, 'Ω')} accent />
        <Readout label="Tolerance" value={`± ${out.tolerance}%`} />
        <Readout label="Min" value={si(out.min, 'Ω')} />
        <Readout label="Max" value={si(out.max, 'Ω')} />
      </div>
    </ToolShell>
  )
}

/* ------------------------------------------------------------------ *
 * TOOL 4 — RC Filter / Time Constant
 * ------------------------------------------------------------------ */
const CAP_UNITS = [
  { label: 'pF', mult: 1e-12 },
  { label: 'nF', mult: 1e-9 },
  { label: 'µF', mult: 1e-6 },
  { label: 'mF', mult: 1e-3 }
]
const RES_UNITS = [
  { label: 'Ω', mult: 1 },
  { label: 'kΩ', mult: 1e3 },
  { label: 'MΩ', mult: 1e6 }
]

function RcFilter() {
  const [r, setR] = useState('10')
  const [rU, setRU] = useState(1) // kΩ
  const [c, setC] = useState('100')
  const [cU, setCU] = useState(1) // nF

  const out = useMemo(() => {
    const R = num(r) * RES_UNITS[rU].mult
    const C = num(c) * CAP_UNITS[cU].mult
    if ([R, C].some(isNaN) || R <= 0 || C <= 0) return { error: 'Enter positive R and C.' }
    const tau = R * C
    const fc = 1 / (2 * Math.PI * R * C)
    return { tau, fc, settle: 5 * tau }
  }, [r, rU, c, cU])

  return (
    <ToolShell
      title="RC Filter Designer"
      desc="Time constant and −3 dB cutoff for a resistor–capacitor pair. Works for first-order low/high-pass filters and RC delays."
    >
      <div className="lab-grid-2">
        <Field label="Resistance">
          <div className="lab-inline">
            <input className="lab-input" inputMode="decimal" value={r} onChange={e => setR(e.target.value)} />
            <select className="lab-input lab-select lab-unit" value={rU} onChange={e => setRU(parseInt(e.target.value))}>
              {RES_UNITS.map((u, idx) => <option key={idx} value={idx}>{u.label}</option>)}
            </select>
          </div>
        </Field>
        <Field label="Capacitance">
          <div className="lab-inline">
            <input className="lab-input" inputMode="decimal" value={c} onChange={e => setC(e.target.value)} />
            <select className="lab-input lab-select lab-unit" value={cU} onChange={e => setCU(parseInt(e.target.value))}>
              {CAP_UNITS.map((u, idx) => <option key={idx} value={idx}>{u.label}</option>)}
            </select>
          </div>
        </Field>
      </div>

      {out.error ? (
        <div className="lab-note">{out.error}</div>
      ) : (
        <div className="lab-results">
          <Readout label="Time constant τ" value={si(out.tau, 's')} accent />
          <Readout label="Cutoff frequency" value={si(out.fc, 'Hz')} accent />
          <Readout label="~Settling (5τ)" value={si(out.settle, 's')} />
        </div>
      )}
      <div className="lab-formula">τ = R · C&nbsp;&nbsp;•&nbsp;&nbsp;f_c = 1 / (2π · R · C)</div>
    </ToolShell>
  )
}

/* ------------------------------------------------------------------ *
 * TOOL 5 — 555 Astable Timer
 * ------------------------------------------------------------------ */
function Timer555() {
  const [r1, setR1] = useState('1')
  const [r1U, setR1U] = useState(1) // kΩ
  const [r2, setR2] = useState('10')
  const [r2U, setR2U] = useState(1) // kΩ
  const [c, setC] = useState('10')
  const [cU, setCU] = useState(2) // µF

  const out = useMemo(() => {
    const R1 = num(r1) * RES_UNITS[r1U].mult
    const R2 = num(r2) * RES_UNITS[r2U].mult
    const C = num(c) * CAP_UNITS[cU].mult
    if ([R1, R2, C].some(isNaN) || R1 <= 0 || R2 <= 0 || C <= 0) return { error: 'Enter positive R1, R2 and C.' }
    const tHigh = 0.693 * (R1 + R2) * C
    const tLow = 0.693 * R2 * C
    const period = tHigh + tLow
    const freq = 1 / period
    const duty = (R1 + R2) / (R1 + 2 * R2) * 100
    return { freq, duty, tHigh, tLow }
  }, [r1, r1U, r2, r2U, c, cU])

  const ResRow = (label, val, setVal, unit, setUnit) => (
    <Field label={label}>
      <div className="lab-inline">
        <input className="lab-input" inputMode="decimal" value={val} onChange={e => setVal(e.target.value)} />
        <select className="lab-input lab-select lab-unit" value={unit} onChange={e => setUnit(parseInt(e.target.value))}>
          {RES_UNITS.map((u, idx) => <option key={idx} value={idx}>{u.label}</option>)}
        </select>
      </div>
    </Field>
  )

  return (
    <ToolShell
      title="555 Astable Timer"
      desc="Classic 555 astable oscillator. Set R1, R2 and the timing capacitor to get output frequency and duty cycle."
    >
      <div className="lab-grid-3">
        {ResRow('R1', r1, setR1, r1U, setR1U)}
        {ResRow('R2', r2, setR2, r2U, setR2U)}
        <Field label="Capacitor">
          <div className="lab-inline">
            <input className="lab-input" inputMode="decimal" value={c} onChange={e => setC(e.target.value)} />
            <select className="lab-input lab-select lab-unit" value={cU} onChange={e => setCU(parseInt(e.target.value))}>
              {CAP_UNITS.map((u, idx) => <option key={idx} value={idx}>{u.label}</option>)}
            </select>
          </div>
        </Field>
      </div>

      {out.error ? (
        <div className="lab-note">{out.error}</div>
      ) : (
        <div className="lab-results">
          <Readout label="Frequency" value={si(out.freq, 'Hz')} accent />
          <Readout label="Duty cycle" value={`${out.duty.toFixed(1)} %`} accent />
          <Readout label="T high" value={si(out.tHigh, 's')} />
          <Readout label="T low" value={si(out.tLow, 's')} />
        </div>
      )}
      <div className="lab-formula">f = 1.44 / ((R1 + 2·R2)·C)&nbsp;&nbsp;•&nbsp;&nbsp;D = (R1+R2)/(R1+2·R2)</div>
    </ToolShell>
  )
}

/* ------------------------------------------------------------------ *
 * TOOL 6 — Number Base Converter
 * ------------------------------------------------------------------ */
function BaseConverter() {
  const [value, setValue] = useState(255n)
  const [error, setError] = useState('')
  const [width, setWidth] = useState(8)

  const handle = (raw, base) => {
    const cleaned = raw.trim().replace(/^0x|^0b|^0o/i, '')
    if (cleaned === '') { setValue(0n); setError(''); return }
    const valid = { 2: /^[01]+$/, 8: /^[0-7]+$/, 10: /^\d+$/, 16: /^[0-9a-fA-F]+$/ }
    if (!valid[base].test(cleaned)) { setError(`Invalid base-${base} input.`); return }
    try {
      const prefix = { 2: '0b', 8: '0o', 10: '', 16: '0x' }[base]
      setValue(BigInt(prefix + cleaned))
      setError('')
    } catch { setError('Could not parse value.') }
  }

  const mask = (1n << BigInt(width)) - 1n
  const masked = value & mask
  const overflow = value > mask
  // two's complement interpretation of the masked value
  const signBit = 1n << BigInt(width - 1)
  const signed = masked >= signBit ? masked - (1n << BigInt(width)) : masked

  return (
    <ToolShell
      title="Number Base Converter"
      desc="Convert between decimal, hex, binary and octal — the everyday embedded/register workflow. Includes fixed-width two's-complement."
    >
      <div className="lab-grid-2">
        <Field label="Decimal"><input className="lab-input lab-mono" value={value.toString(10)} onChange={e => handle(e.target.value, 10)} /></Field>
        <Field label="Hex" hint="0x"><input className="lab-input lab-mono" value={value.toString(16).toUpperCase()} onChange={e => handle(e.target.value, 16)} /></Field>
        <Field label="Binary" hint="0b"><input className="lab-input lab-mono" value={value.toString(2)} onChange={e => handle(e.target.value, 2)} /></Field>
        <Field label="Octal" hint="0o"><input className="lab-input lab-mono" value={value.toString(8)} onChange={e => handle(e.target.value, 8)} /></Field>
      </div>

      {error ? <div className="lab-note">{error}</div> : null}

      <div className="lab-seg lab-seg-wide">
        {[8, 16, 32, 64].map(w => (
          <button key={w} className={width === w ? 'is-active' : ''} onClick={() => setWidth(w)}>{w}-bit</button>
        ))}
      </div>

      <div className="lab-results">
        <Readout label={`Unsigned (${width}-bit)`} value={masked.toString(10)} accent />
        <Readout label={`Signed (two's comp.)`} value={signed.toString(10)} accent />
        <Readout label="Overflow?" value={overflow ? 'YES — truncated' : 'No'} danger={overflow} />
      </div>
      <div className="lab-mono lab-bits">
        {masked.toString(2).padStart(width, '0').replace(new RegExp(`(.{4})(?=.)`, 'g'), '$1 ')}
      </div>
    </ToolShell>
  )
}

/* ------------------------------------------------------------------ *
 * TOOL 7 — Battery Life Estimator
 * ------------------------------------------------------------------ */
function BatteryLife() {
  const [cap, setCap] = useState('2000')
  const [load, setLoad] = useState('80')
  const [eff, setEff] = useState('85')

  const out = useMemo(() => {
    const C = num(cap), I = num(load), E = num(eff) / 100
    if ([C, I].some(isNaN) || C <= 0 || I <= 0) return { error: 'Enter battery capacity and load current.' }
    const efficiency = isNaN(E) ? 1 : Math.min(Math.max(E, 0.01), 1)
    const hours = (C / I) * efficiency
    const days = hours / 24
    return { hours, days }
  }, [cap, load, eff])

  const fmtDuration = (h) => {
    if (!isFinite(h)) return '—'
    if (h >= 48) return `${(h / 24).toFixed(1)} days`
    const hh = Math.floor(h)
    const mm = Math.round((h - hh) * 60)
    return `${hh} h ${mm} min`
  }

  return (
    <ToolShell
      title="Battery Life Estimator"
      desc="Runtime for a battery-powered node from pack capacity and average current draw, derated for real-world discharge efficiency."
    >
      <div className="lab-grid-3">
        <Field label="Capacity" hint="mAh"><input className="lab-input" inputMode="decimal" value={cap} onChange={e => setCap(e.target.value)} /></Field>
        <Field label="Avg. current" hint="mA"><input className="lab-input" inputMode="decimal" value={load} onChange={e => setLoad(e.target.value)} /></Field>
        <Field label="Efficiency" hint="%"><input className="lab-input" inputMode="decimal" value={eff} onChange={e => setEff(e.target.value)} /></Field>
      </div>

      {out.error ? (
        <div className="lab-note">{out.error}</div>
      ) : (
        <div className="lab-results">
          <Readout label="Estimated runtime" value={fmtDuration(out.hours)} accent />
          <Readout label="In hours" value={`${out.hours.toFixed(1)} h`} />
          <Readout label="In days" value={`${out.days.toFixed(2)} d`} />
        </div>
      )}
      <div className="lab-formula">t = (Capacity / Load) · efficiency</div>
    </ToolShell>
  )
}

/* ------------------------------------------------------------------ *
 * Shared tool wrapper
 * ------------------------------------------------------------------ */
function ToolShell({ title, desc, children }) {
  return (
    <div className="lab-tool">
      <div className="lab-tool-head">
        <h4 className="lab-tool-title">{title}</h4>
        <p className="lab-tool-desc">{desc}</p>
      </div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Toolkit registry + shell
 * ------------------------------------------------------------------ */
const TOOLS = [
  { id: 'ohms', name: "Ohm's Law", tag: 'V · I · R · P', icon: Zap, Comp: OhmsLaw },
  { id: 'led', name: 'LED Resistor', tag: 'Series resistor', icon: Lightbulb, Comp: LedResistor },
  { id: 'resistor', name: 'Color Decoder', tag: '4 / 5-band', icon: CircuitBoard, Comp: ResistorDecoder },
  { id: 'rc', name: 'RC Filter', tag: 'τ · cutoff', icon: Waves, Comp: RcFilter },
  { id: 'timer', name: '555 Timer', tag: 'Astable', icon: Timer, Comp: Timer555 },
  { id: 'base', name: 'Base Convert', tag: 'HEX · BIN · DEC', icon: Binary, Comp: BaseConverter },
  { id: 'battery', name: 'Battery Life', tag: 'Runtime', icon: BatteryCharging, Comp: BatteryLife }
]

export default function TechSandbox() {
  const [active, setActive] = useState('ohms')
  const ActiveComp = TOOLS.find(t => t.id === active).Comp

  return (
    <div className="lab glass-panel" id="tech-sandbox-container">
      <div className="lab-header">
        <span className="lab-eyebrow">Engineering Toolkit</span>
        <h3 className="lab-heading">Layrd Sandbox</h3>
        <p className="lab-intro">
          Real, browser-native calculators engineers reach for daily — no sign-up, no server round-trips.
          Every result is computed live from the actual formulas.
        </p>
      </div>

      <div className="lab-body">
        <nav className="lab-rail" aria-label="Toolkit">
          {TOOLS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                className={`lab-rail-item ${active === t.id ? 'is-active' : ''}`}
                onClick={() => setActive(t.id)}
              >
                <Icon size={16} className="lab-rail-icon" />
                <span className="lab-rail-text">
                  <span className="lab-rail-name">{t.name}</span>
                  <span className="lab-rail-tag">{t.tag}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="lab-stage">
          <ActiveComp />
        </div>
      </div>
    </div>
  )
}
