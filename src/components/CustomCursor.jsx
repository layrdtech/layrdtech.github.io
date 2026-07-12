import React, { useState, useEffect, useRef } from 'react'

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [trail, setTrail] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const [hoverText, setHoverText] = useState('')
  const [ripples, setRipples] = useState([])
  const requestRef = useRef()
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      setPosition({ x: e.clientX, y: e.clientY })
    }

    const handleMouseClick = (e) => {
      const newRipple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY
      }
      setRipples((prev) => [...prev, newRipple])
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
      }, 800)
    }

    const handleMouseOver = (e) => {
      const target = e.target
      const isInteractive = 
        target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.closest('button') || 
        target.closest('a') || 
        target.closest('.interactive-card') || 
        window.getComputedStyle(target).cursor === 'pointer'

      if (isInteractive) {
        setHovered(true)
        const customText = target.getAttribute('data-cursor-text') || ''
        setHoverText(customText)
      } else {
        setHovered(false)
        setHoverText('')
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('click', handleMouseClick)
    document.addEventListener('mouseover', handleMouseOver)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('click', handleMouseClick)
      document.removeEventListener('mouseover', handleMouseOver)
    }
  }, [])

  // Smooth trail effect using requestAnimationFrame
  useEffect(() => {
    const updateTrail = () => {
      setTrail((prev) => {
        // Linear interpolation towards target mouse coords
        const dx = mouseRef.current.x - prev.x
        const dy = mouseRef.current.y - prev.y
        // Speed coefficient
        const speed = 0.15 
        return {
          x: prev.x + dx * speed,
          y: prev.y + dy * speed
        }
      })
      requestRef.current = requestAnimationFrame(updateTrail)
    }
    requestRef.current = requestAnimationFrame(updateTrail)
    return () => cancelAnimationFrame(requestRef.current)
  }, [])

  // Hide custom cursor on mobile touch devices
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (isMobile) return null

  return (
    <>
      {/* Laser Point Cursor Core */}
      <div 
        className={`custom-cursor-core ${hovered ? 'hovered' : ''}`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      >
        {hoverText && <span className="cursor-badge-text">{hoverText}</span>}
      </div>

      {/* Trailing Physics Ring */}
      <div 
        className={`custom-cursor-ring ${hovered ? 'hovered' : ''}`}
        style={{ left: `${trail.x}px`, top: `${trail.y}px` }}
      ></div>

      {/* Click Ripple Rings */}
      {ripples.map((ripple) => (
        <div 
          key={ripple.id} 
          className="click-ripple"
          style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
        ></div>
      ))}
    </>
  )
}
