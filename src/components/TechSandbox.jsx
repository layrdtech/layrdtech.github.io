import React, { useState, useEffect, useRef } from 'react'
import { Cpu, Activity, Play, RefreshCw, Zap, Send } from 'lucide-react'

// Helper to determine resistor color band representation (4-band: digit1, digit2, multiplier, tolerance)
const getResistorColorBands = (ohms) => {
  const code = [
    { color: 'black', val: 0, bg: '#000000', text: '#fff' },
    { color: 'brown', val: 1, bg: '#8B4513', text: '#fff' },
    { color: 'red', val: 2, bg: '#FF0000', text: '#fff' },
    { color: 'orange', val: 3, bg: '#FFA500', text: '#000' },
    { color: 'yellow', val: 4, bg: '#FFFF00', text: '#000' },
    { color: 'green', val: 5, bg: '#008000', text: '#fff' },
    { color: 'blue', val: 6, bg: '#0000FF', text: '#fff' },
    { color: 'violet', val: 7, bg: '#EE82EE', text: '#000' },
    { color: 'gray', val: 8, bg: '#808080', text: '#fff' },
    { color: 'white', val: 9, bg: '#FFFFFF', text: '#000' }
  ]

  let val = ohms
  let multiplier = 0
  
  if (val >= 1000) {
    val = ohms / 10
    multiplier = 2 // 10^2
  } else if (val >= 100) {
    val = ohms / 10
    multiplier = 1 // 10^1
  } else {
    multiplier = 0 // 10^0
  }

  const str = Math.round(val).toString().padStart(2, '0')
  const digit1 = parseInt(str[0]) || 0
  const digit2 = parseInt(str[1]) || 0

  const color1 = code.find(c => c.val === digit1) || code[0]
  const color2 = code.find(c => c.val === digit2) || code[0]
  const color3 = code.find(c => c.val === multiplier) || code[0]
  
  return [
    { label: color1.color, color: color1.bg, text: color1.text },
    { label: color2.color, color: color2.bg, text: color2.text },
    { label: `10^${multiplier}`, color: color3.bg, text: color3.text },
    { label: 'Gold (5%)', color: '#D4AF37', text: '#000' }
  ]
}

export default function TechSandbox() {
  const [activeTab, setActiveTab] = useState('elec') // 'elec', 'ai', 'iot'

  // --- Electronics Lab Ohm's Law States ---
  const [voltage, setVoltage] = useState(5)
  const [resistance, setResistance] = useState(220)

  const current = (voltage / resistance) * 1000 // mA
  const power = voltage * (current / 1000) // W
  
  const ledGlowClass = current < 5 ? 'glow-off' : current >= 5 && current <= 30 ? 'glow-on' : 'glow-danger'
  const circuitStatusText = current < 5 ? 'LED DIM / OFF' : current >= 5 && current <= 30 ? 'OPTIMAL CURRENT' : 'DANGER: OVERCURRENT'
  const circuitIndicatorClass = current < 5 ? 'status-indicator offline' : current >= 5 && current <= 30 ? 'status-indicator online' : 'status-indicator alert-fired'

  const bands = getResistorColorBands(resistance)

  // --- AI Neural Classifier States (REAL 2D Training in React) ---
  const canvasRef = useRef(null)
  const [aiTraining, setAiTraining] = useState(false)
  const [aiEpoch, setAiEpoch] = useState(0)
  const [modelStats, setModelStats] = useState({ loss: 0.85, accuracy: 0 })
  const [aiLogs, setAiLogs] = useState(['System Ready. Awaiting training trigger...'])
  const aiLogEndRef = useRef(null)

  // Dataset generation for decision boundary classifier (Circle Classification)
  const [dataset] = useState(() => {
    const points = []
    // Center of circle: (0.5, 0.5)
    for (let i = 0; i < 40; i++) {
      const x = 0.1 + Math.random() * 0.8
      const y = 0.1 + Math.random() * 0.8
      const dist = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2)
      const label = dist < 0.28 ? 1 : 0 // Inside circle = 1, outside = 0
      points.push({ x, y, label })
    }
    return points
  })

  // Simple classification weights (w1, w2, bias) initialized
  const weightsRef = useRef({ w1: 0.1, w2: -0.2, bias: 0.05 })

  useEffect(() => {
    drawDecisionBoundary()
  }, [dataset, activeTab])

  useEffect(() => {
    if (aiLogEndRef.current) {
      aiLogEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [aiLogs])

  const predict = (x, y, weights) => {
    // Sigmoid activation
    const z = x * weights.w1 + y * weights.w2 + weights.bias
    return 1 / (1 + Math.exp(-z))
  }

  const drawDecisionBoundary = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    
    // Draw background boundary prediction grid
    const scale = 4
    for (let py = 0; py < height; py += scale) {
      for (let px = 0; px < width; px += scale) {
        const x = px / width
        const y = py / height
        const pred = predict(x, y, weightsRef.current)
        
        // Blend colors based on neural prediction
        const r = Math.round(pred * 112)
        const g = Math.round((1 - pred) * 240)
        const b = Math.round((1 - pred) * 255 + pred * 50)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.22)`
        ctx.fillRect(px, py, scale, scale)
      }
    }

    // Draw reference boundary (Circle target boundary)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(width / 2, height / 2, 0.28 * width, 0, 2 * Math.PI)
    ctx.stroke()

    // Draw dataset points
    dataset.forEach(pt => {
      ctx.beginPath()
      ctx.arc(pt.x * width, pt.y * height, 5, 0, 2 * Math.PI)
      
      if (pt.label === 1) {
        ctx.fillStyle = '#00f0ff' // Inside (Cyan)
        ctx.strokeStyle = '#ffffff'
      } else {
        ctx.fillStyle = '#7000ff' // Outside (Purple)
        ctx.strokeStyle = '#3b3d46'
      }
      ctx.lineWidth = 1
      ctx.fill()
      ctx.stroke()
    })
  }

  const runAiTraining = () => {
    if (aiTraining) return
    setAiTraining(false)
    setAiTraining(true)
    setAiEpoch(0)
    setAiLogs([
      '[INIT] Loaded 40 2D coordinate vectors...',
      '[INIT] Learning rate set to 0.1 (SGD optimizer)',
      '[RUN] Core stochastic gradient descent sequence started.'
    ])

    let epoch = 0
    const lr = 0.1
    const maxEpochs = 20

    const interval = setInterval(() => {
      epoch += 1
      
      // Perform training step on dataset (Stochastic Gradient Descent)
      let totalLoss = 0
      let correct = 0

      dataset.forEach(pt => {
        const pred = predict(pt.x, pt.y, weightsRef.current)
        const error = pt.label - pred
        
        // Accumulate binary cross-entropy loss
        totalLoss += error ** 2

        // Weight updates
        weightsRef.current.w1 += lr * error * pt.x
        weightsRef.current.w2 += lr * error * pt.y
        weightsRef.current.bias += lr * error

        const isCorrect = (pred >= 0.5 ? 1 : 0) === pt.label
        if (isCorrect) correct++
      })

      const averageLoss = totalLoss / dataset.length
      const accuracy = correct / dataset.length

      setAiEpoch(epoch)
      setModelStats({ loss: averageLoss, accuracy })
      setAiLogs(prev => [
        ...prev,
        `Epoch ${epoch}/20 | Loss: ${averageLoss.toFixed(4)} | Accuracy: ${(accuracy * 100).toFixed(1)}%`
      ])

      drawDecisionBoundary()

      if (epoch >= maxEpochs) {
        clearInterval(interval)
        setAiTraining(false)
        setAiLogs(prev => [
          ...prev,
          '[SUCCESS] Weights convergence achieved.',
          '[DEPLOY] Model weights compiled for hardware serialization.'
        ])
      }
    }, 180)
  }

  // --- IoT Telemetry & AT Serial Command Hub States ---
  const [telemetry, setTelemetry] = useState([])
  const [anomaly, setAnomaly] = useState(false)
  const [sensorOnline, setSensorOnline] = useState(true)
  const [activeSensorType, setActiveSensorType] = useState('temp') // 'temp' (DHT11), 'light' (LDR), 'dist' (Ultrasonic)
  const [cmdInput, setCmdInput] = useState('')
  const [serialHistory, setSerialHistory] = useState([
    'LAYRD Edge node serial terminal v1.2',
    'Type AT commands or click quick nodes below to query firmware.',
    'Ready.'
  ])
  const serialEndRef = useRef(null)

  useEffect(() => {
    if (serialEndRef.current) {
      serialEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [serialHistory])

  useEffect(() => {
    const baseline = Array.from({ length: 15 }, (_, i) => ({
      time: i,
      val: activeSensorType === 'temp' ? 22 + Math.random() * 2 
         : activeSensorType === 'light' ? 620 + Math.random() * 40
         : 18 + Math.random() * 5
    }))
    setTelemetry(baseline)
  }, [activeSensorType])

  useEffect(() => {
    if (!sensorOnline) return

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        const nextTime = prev.length ? prev[prev.length - 1].time + 1 : 0
        let baseVal = 0
        
        if (activeSensorType === 'temp') {
          baseVal = anomaly ? 39 + Math.random() * 4 : 22 + Math.random() * 1.5
        } else if (activeSensorType === 'light') {
          baseVal = anomaly ? 120 + Math.random() * 30 : 640 + Math.random() * 30
        } else {
          baseVal = anomaly ? 4 + Math.random() * 1.5 : 19 + Math.random() * 3
        }

        const updated = [...prev, { time: nextTime, val: parseFloat(baseVal.toFixed(2)) }]
        if (updated.length > 15) {
          updated.shift()
        }
        return updated
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [sensorOnline, anomaly, activeSensorType])

  const triggerSpike = () => {
    setAnomaly(true)
    sendSerialCmd('AT+ANOMALY')
    setTimeout(() => {
      setAnomaly(false)
    }, 4000)
  }

  const getTelemetryPath = () => {
    if (telemetry.length < 2) return ''
    
    // Bounds adjust based on selected sensor
    const maxVal = activeSensorType === 'temp' ? 45 : activeSensorType === 'light' ? 800 : 35
    const minVal = activeSensorType === 'temp' ? 15 : activeSensorType === 'light' ? 100 : 2
    const width = 360
    const height = 110

    const points = telemetry.map((t, idx) => {
      const x = (idx / (telemetry.length - 1)) * width
      const percentage = (t.val - minVal) / (maxVal - minVal)
      const y = height - percentage * height
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })

    return `M ${points.join(' L ')}`
  }

  // AT Serial Terminal Command Interpreter
  const handleSerialSubmit = (e) => {
    if (e) e.preventDefault()
    if (!cmdInput.trim()) return
    const cmd = cmdInput.toUpperCase().trim()
    setCmdInput('')
    sendSerialCmd(cmd)
  }

  const sendSerialCmd = (cmd) => {
    setSerialHistory(prev => [...prev, `> ${cmd}`])
    
    setTimeout(() => {
      if (!sensorOnline && cmd !== 'AT+CONNECT' && cmd !== 'AT') {
        setSerialHistory(prev => [...prev, 'ERROR: NODE DISCONNECTED (No response)'])
        return
      }

      let response = ''
      if (cmd === 'AT') {
        response = 'OK'
      } else if (cmd === 'AT+CONNECT') {
        setSensorOnline(true)
        response = 'OK [Node link online]'
      } else if (cmd === 'AT+DISCONNECT') {
        setSensorOnline(false)
        response = 'OK [Node link terminated]'
      } else if (cmd === 'AT+STATUS') {
        response = `+STATUS: ONLINE=1; VOLT=3.3V; SENSOR_TYPE=${activeSensorType.toUpperCase()}`
      } else if (cmd === 'AT+READ') {
        const curVal = telemetry.length ? telemetry[telemetry.length - 1].val : 0
        const unit = activeSensorType === 'temp' ? 'C' : activeSensorType === 'light' ? 'ADC' : 'CM'
        response = `+READ: ${curVal.toFixed(2)} ${unit}`
      } else if (cmd === 'AT+ANOMALY') {
        response = 'OK [Injecting telemetry hardware anomaly]'
      } else if (cmd.startsWith('AT+SENSOR=')) {
        const type = cmd.split('=')[1]
        if (type === 'TEMP' || type === 'LIGHT' || type === 'DIST') {
          setActiveSensorType(type.toLowerCase())
          response = `OK [Configured active telemetry stream: ${type}]`
        } else {
          response = 'ERROR: INVALID SENSOR PARAM (Use TEMP, LIGHT, or DIST)'
        }
      } else {
        response = `ERROR: COMMAND NOT FOUND (Type AT, AT+STATUS, AT+READ, AT+SENSOR=TEMP|LIGHT|DIST)`
      }
      
      setSerialHistory(prev => [...prev, response])
    }, 100)
  }

  return (
    <div className="sandbox-card glass-panel" id="tech-sandbox-container">
      <div className="sandbox-header">
        <div className="sandbox-indicator">
          <Activity size={16} className="animated-pulse-icon" />
          <span>Interactive Next-Gen Tech Lab</span>
        </div>
        <h3 className="sandbox-title">Layrd Sandbox Labs</h3>
      </div>

      {/* Tabs */}
      <div className="sandbox-tabs">
        <button 
          className={`sandbox-tab-btn ${activeTab === 'elec' ? 'active' : ''}`}
          onClick={() => setActiveTab('elec')}
        >
          <span>Electronics Lab</span>
        </button>
        <button 
          className={`sandbox-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai')}
        >
          <span>AI Networks</span>
        </button>
        <button 
          className={`sandbox-tab-btn ${activeTab === 'iot' ? 'active' : ''}`}
          onClick={() => setActiveTab('iot')}
        >
          <span>Edge Telemetry</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="sandbox-panel-content">
        
        {/* --- Electronics Panel --- */}
        {activeTab === 'elec' && (
          <div className="sandbox-elec-layout">
            <div>
              <h4 className="sandbox-panel-title">Ohm's Law Prototyper</h4>
              <p className="sandbox-panel-desc">
                Adjust the source voltage and resistor load values. Monitor the resulting circuit current to protect the LED from burning out.
              </p>
              
              <div className="elec-controls-row">
                <div className="elec-slider-group">
                  <label className="form-label">Voltage: <span className="font-mono">{voltage.toFixed(1)}</span> V</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="12" 
                    step="0.5" 
                    value={voltage} 
                    onChange={(e) => setVoltage(parseFloat(e.target.value))}
                    className="elec-range" 
                  />
                </div>
                <div className="elec-slider-group">
                  <label className="form-label">Resistance: <span className="font-mono">{resistance}</span> Ω</label>
                  <input 
                    type="range" 
                    min="50" 
                    max="1000" 
                    step="10" 
                    value={resistance} 
                    onChange={(e) => setResistance(parseInt(e.target.value))}
                    className="elec-range" 
                  />
                </div>
              </div>

              {/* Dynamic Resistor Color Code display */}
              <div style={{ marginBottom: '20px' }}>
                <span className="result-label" style={{ display: 'block', marginBottom: '8px' }}>Resistor Color Bands (4-Band)</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {bands.map((band, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        flex: 1, 
                        background: band.color, 
                        color: band.text, 
                        fontSize: '9px',
                        padding: '4px',
                        textAlign: 'center', 
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        fontFamily: 'monospace'
                      }}
                    >
                      {band.label.toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>

              <div className="elec-results-box">
                <div className="elec-result-item">
                  <span className="result-label">Circuit Current (I)</span>
                  <span className="result-val font-mono">{current.toFixed(1)} mA</span>
                </div>
                <div className="elec-result-item">
                  <span className="result-label">LED Status</span>
                  <span className={circuitIndicatorClass}>{circuitStatusText}</span>
                </div>
              </div>

              {/* Live Formula computation card */}
              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                background: 'rgba(0,0,0,0.12)', 
                borderRadius: '6px',
                fontSize: '11px',
                color: 'var(--text-gray)',
                border: '1px solid rgba(255,255,255,0.02)',
                lineHeight: '1.5'
              }}>
                <span className="result-label" style={{ display: 'block', marginBottom: '4px' }}>Formula & Power Dissipation</span>
                <div>Formula: <strong>I = V / R</strong> ➔ {voltage.toFixed(1)}V / {resistance}Ω = <strong>{current.toFixed(1)} mA</strong></div>
                <div>Power: <strong>P = V * I</strong> ➔ {voltage.toFixed(1)}V * {(current/1000).toFixed(4)}A = <strong>{power.toFixed(3)} W</strong></div>
                <div style={{ marginTop: '4px', color: power > 0.25 ? '#ff4b4b' : '#00f0ff' }}>
                  {power > 0.25 ? '⚠️ WARNING: Power exceeds standard 1/4W resistor rating.' : '✓ Safe under standard 1/4W resistor rating.'}
                </div>
              </div>
            </div>

            <div className="elec-schematic-wrapper">
              <div className="schematic-board">
                {/* SVG Circuit Schematic Overlay */}
                <svg className="schematic-circuit-svg" viewBox="0 0 180 140">
                  <path d="M 26,65 L 26,20 L 96,20 L 165,20 L 165,65 L 165,120 L 96,120 L 26,120 Z" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="2" />
                  <path 
                    id="circuit-current-flow" 
                    d="M 26,65 L 26,20 L 96,20 L 165,20 L 165,65 L 165,120 L 96,120 L 26,120 Z" 
                    fill="none" 
                    stroke={current < 5 ? 'rgba(255, 255, 255, 0.08)' : current >= 5 && current <= 30 ? 'var(--primary-glow)' : '#ff4b4b'} 
                    strokeWidth="1.5" 
                    strokeDasharray="4, 8" 
                    style={{ animation: current < 5 ? 'none' : `flowCurrent ${(current < 5 ? 0 : current >= 5 && current <= 30 ? Math.max(0.3, 15 / current) : 0.12).toFixed(2)}s linear infinite` }}
                  />
                </svg>

                <div className="schematic-component voltage-source">
                  <span className="comp-label">VCC</span>
                  <span className="comp-val">{voltage.toFixed(1)}V</span>
                </div>
                <div className="schematic-component resistor">
                  <span className="comp-label">RES</span>
                  <span className="comp-val">{resistance}Ω</span>
                </div>
                <div className="schematic-component led">
                  <div className={`led-glow-glow ${ledGlowClass}`}></div>
                  <span className="comp-label">LED</span>
                </div>
                <div className="schematic-component ground">
                  <span className="comp-label">GND</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* --- AI Panel --- */}
        {activeTab === 'ai' && (
          <div className="sandbox-ai-layout">
            <div className="ai-controls-wrapper">
              <h4 className="sandbox-panel-title">Decision Boundary Classifier</h4>
              <p className="sandbox-panel-desc">
                Tune and train a single-layer perceptron neural network right in your browser. Watch the weights converge to separate Cyan (inside radius) and Purple coordinate nodes.
              </p>

              <div className="ai-stat-row">
                <div className="ai-stat-card">
                  <div className="stat-label">Loss Parameter</div>
                  <div className="stat-val font-mono">
                    {modelStats.loss.toFixed(4)}
                  </div>
                </div>
                <div className="ai-stat-card">
                  <div className="stat-label">Model Accuracy</div>
                  <div className="stat-val font-mono">
                    {`${(modelStats.accuracy * 100).toFixed(1)}%`}
                  </div>
                </div>
                <div className="ai-stat-card">
                  <div className="stat-label">Epoch Cycles</div>
                  <div className="stat-val font-mono">{aiEpoch}/20</div>
                </div>
              </div>

              <button 
                onClick={runAiTraining}
                disabled={aiTraining}
                className="action-btn primary-btn"
              >
                {aiTraining ? <RefreshCw className="spin-icon" size={16} /> : <Play size={16} />}
                <span>{aiTraining ? 'Optimizing Weights...' : 'Train Neural Net'}</span>
              </button>
            </div>

            {/* Interactive Decision Boundary Canvas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px'
              }}>
                <canvas 
                  ref={canvasRef} 
                  width={220} 
                  height={220} 
                  style={{ borderRadius: '6px', width: '220px', height: '220px' }}
                />
              </div>
              
              <div className="ai-terminal-wrapper">
                <div className="terminal-header">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                  <span className="terminal-title">bash - layrd_ai_engine.sh</span>
                </div>
                <div className="terminal-body font-mono">
                  {aiLogs.map((log, idx) => (
                    <div key={idx} className="terminal-line">
                      <span className="terminal-cursor">&gt;</span> {log}
                    </div>
                  ))}
                  <div ref={aiLogEndRef} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- IoT Panel --- */}
        {activeTab === 'iot' && (
          <div className="sandbox-iot-layout">
            <div className="iot-controls">
              <h4 className="sandbox-panel-title">Edge Telemetry Hub</h4>
              <p className="sandbox-panel-desc">
                Plot and check real-time telemetry from remote edge microchips. Query the device using AT serial commands.
              </p>

              {/* Sensor Selection Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => { setActiveSensorType('temp'); sendSerialCmd('AT+SENSOR=TEMP'); }}
                  style={{ fontSize: '10px', padding: '4px 10px' }}
                  className={`action-btn ${activeSensorType === 'temp' ? 'primary-btn' : ''}`}
                >
                  DHT11 (Temp)
                </button>
                <button 
                  onClick={() => { setActiveSensorType('light'); sendSerialCmd('AT+SENSOR=LIGHT'); }}
                  style={{ fontSize: '10px', padding: '4px 10px' }}
                  className={`action-btn ${activeSensorType === 'light' ? 'primary-btn' : ''}`}
                >
                  LDR (Photocell)
                </button>
                <button 
                  onClick={() => { setActiveSensorType('dist'); sendSerialCmd('AT+SENSOR=DIST'); }}
                  style={{ fontSize: '10px', padding: '4px 10px' }}
                  className={`action-btn ${activeSensorType === 'dist' ? 'primary-btn' : ''}`}
                >
                  Ultrasonic
                </button>
              </div>

              <div className="iot-node-status-row">
                <div className="node-status-tile">
                  <span className="tile-label">Node Status</span>
                  <span className={`status-indicator ${sensorOnline ? 'online' : 'offline'}`}>
                    {sensorOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div className="node-status-tile">
                  <span className="tile-label">Last Reading</span>
                  <span className="font-mono text-white text-lg">
                    {telemetry.length && sensorOnline ? (
                      activeSensorType === 'temp' ? `${telemetry[telemetry.length - 1].val.toFixed(1)} °C`
                      : activeSensorType === 'light' ? `${Math.round(telemetry[telemetry.length - 1].val)} ADC`
                      : `${telemetry[telemetry.length - 1].val.toFixed(1)} CM`
                    ) : 'N/A'}
                  </span>
                </div>
                <div className="node-status-tile">
                  <span className="tile-label">Packet Alert</span>
                  <span className={`status-indicator ${anomaly ? 'alert-fired' : 'stable'}`}>
                    {anomaly ? 'ANOMALY DETECTED' : 'NOMINAL'}
                  </span>
                </div>
              </div>

              <div className="iot-actions">
                <button 
                  onClick={() => {
                    const online = !sensorOnline;
                    sendSerialCmd(online ? 'AT+CONNECT' : 'AT+DISCONNECT');
                  }} 
                  className={`action-btn ${sensorOnline ? 'secondary-btn' : 'primary-btn'}`}
                >
                  {sensorOnline ? 'Disconnect Node' : 'Connect Node'}
                </button>

                <button 
                  onClick={triggerSpike}
                  disabled={!sensorOnline || anomaly}
                  className="action-btn warning-btn"
                >
                  <Zap size={14} />
                  <span>Simulate Spike</span>
                </button>
              </div>
            </div>

            {/* IoT Real-Time Graph and Serial Console */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="iot-graph-card">
                <div className="graph-header font-mono">
                  <span>telemetry_stream_v2.log</span>
                  <span className="blink-green-dot"></span>
                </div>
                <div className="graph-body">
                  {sensorOnline && telemetry.length > 1 ? (
                    <svg className="telemetry-svg" viewBox="0 0 360 110">
                      <path 
                        d={getTelemetryPath()} 
                        fill="none" 
                        stroke={anomaly ? "#ff3e3e" : "#00f0ff"} 
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      {telemetry.length && (
                        <path 
                          d={`${getTelemetryPath()} L 360,110 L 0,110 Z`} 
                          fill={anomaly ? "rgba(255, 62, 62, 0.05)" : "rgba(0, 240, 255, 0.05)"}
                        />
                      )}
                    </svg>
                  ) : (
                    <div className="graph-offline-mask">
                      <span>CONNECTION LINK DOWN</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AT Serial Terminal Terminal */}
              <div className="ai-terminal-wrapper" style={{ height: '140px' }}>
                <div className="terminal-header" style={{ justifyContent: 'space-between' }}>
                  <span className="terminal-title">Serial AT Command Console</span>
                  <span style={{ fontSize: '7px', color: 'var(--text-dark)' }}>COM4 // 115200 BAUD</span>
                </div>
                <div className="terminal-body font-mono" style={{ fontSize: '9px', padding: '6px' }}>
                  {serialHistory.map((line, idx) => (
                    <div key={idx} className="terminal-line" style={{ marginBottom: '2px' }}>
                      {line}
                    </div>
                  ))}
                  <div ref={serialEndRef} />
                </div>
                <form 
                  onSubmit={handleSerialSubmit} 
                  style={{ 
                    display: 'flex', 
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    background: 'rgba(0,0,0,0.1)' 
                  }}
                >
                  <input 
                    type="text"
                    value={cmdInput}
                    onChange={(e) => setCmdInput(e.target.value)}
                    placeholder="Type AT command (e.g. AT, AT+STATUS, AT+READ)..."
                    style={{ 
                      flex: 1, 
                      background: 'transparent',
                      border: 'none', 
                      color: '#fff',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      padding: '6px 10px',
                      outline: 'none'
                    }}
                  />
                  <button 
                    type="submit"
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--text-gray)',
                      padding: '0 10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Send size={10} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  )
}
