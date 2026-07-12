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
    // Add body class to indicate preloader active (can be used to defer heavy assets)
    document.body.classList.add('preloader-active')

    // Set CSS --vh to avoid mobile 100dvh jitter (address bar resize)
    const setVh = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }
    setVh()
    window.addEventListener('resize', setVh)

    // Pause and hide background video to reduce CPU during preloader
    const bgVideo = document.querySelector('.bg-video')
    if (bgVideo) {
      try { bgVideo.pause() } catch (e) {}
      bgVideo.style.visibility = 'hidden'
      bgVideo.style.pointerEvents = 'none'
    }

    const start = performance.now()
    const duration = 1200 // shorten loader to 1.2s for snappier UX

    let rafId
    const step = (now) => {
      const elapsed = now - start
      const nextProgress = Math.min(100, Math.floor((elapsed / duration) * 100))
      setProgress(nextProgress)

      const idealLogIndex = Math.min(logs.length - 1, Math.floor((nextProgress / 100) * logs.length))
      setLogIndex(idealLogIndex)

      if (elapsed < duration) {
        rafId = requestAnimationFrame(step)
      } else {
        // reveal background video after brief fade
        if (bgVideo) {
          bgVideo.style.visibility = ''
          try { bgVideo.play().catch(()=>{}) } catch (e) {}
          bgVideo.style.pointerEvents = ''
        }
        document.body.classList.remove('preloader-active')
        document.body.classList.add('preloader-complete')
        setTimeout(() => onComplete(), 200)
      }
    }

    rafId = requestAnimationFrame(step)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      document.body.classList.remove('preloader-active')
      window.removeEventListener('resize', setVh)
    }
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
            style={{ transform: `scaleX(${progress / 100})` }}
          ></div>
        </div>
        
        <div className="progress-percentage">
          {progress}%
        </div>
      </div>
    </div>
  )
}
