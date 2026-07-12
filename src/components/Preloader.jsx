import React, { useState, useEffect } from 'react'

export default function Preloader({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [logIndex, setLogIndex] = useState(0)

  const logs = [
    "Initializing Core Systems...",
    "Calibrating Neural Networks (AI & LLM Ensembles)...",
    "Simulating Quantum Gate Operations (Superposition state)...",
    "Initializing IoT Sensor Networks & Microcontrollers...",
    "Injecting Brain-Computer Interface telemetry signals...",
    "Establishing Cryptographic Keys for Decentralized Nodes...",
    "Assembling Next-Generation Tech Environment...",
    "System Ready. Launching Experience!"
  ]

  useEffect(() => {
    const start = Date.now()
    const duration = 2200 // 2.2 seconds loader

    const timer = setInterval(() => {
      const elapsed = Date.now() - start
      const nextProgress = Math.min(100, Math.floor((elapsed / duration) * 100))
      
      setProgress(nextProgress)

      // Shift logs depending on progress threshold
      const idealLogIndex = Math.min(
        logs.length - 1,
        Math.floor((nextProgress / 100) * logs.length)
      )
      setLogIndex(idealLogIndex)

      if (elapsed >= duration) {
        clearInterval(timer)
        setTimeout(() => {
          onComplete()
        }, 300)
      }
    }, 30)

    return () => clearInterval(timer)
  }, [onComplete])

  return (
    <div className="preloader-container">
      {/* Background Animated Tech Grid */}
      <div className="preloader-grid"></div>
      
      <div className="preloader-content">
        <div className="preloader-logo-ring">
          <div className="inner-glow-dot"></div>
        </div>
        
        <h1 className="preloader-title">LAYRD.TECH</h1>
        <div className="preloader-status">
          <span className="terminal-prompt">&gt;</span> {logs[logIndex]}
        </div>

        <div className="progress-bar-wrapper">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="progress-percentage">
          {progress}%
        </div>
      </div>
    </div>
  )
}
