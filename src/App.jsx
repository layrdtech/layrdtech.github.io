import React, { useState, useEffect, useRef } from 'react'
import { Brain, Cpu, Layers } from 'lucide-react'
import CustomCursor from './components/CustomCursor.jsx'
import TechSandbox from './components/TechSandbox.jsx'
import { getStoredSubmissionData, storeContactMessage, storeSubscription } from './lib/persistence.js'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 })
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [submissionData, setSubmissionData] = useState(() => getStoredSubmissionData())
  const audioRef = useRef(null)

  useEffect(() => {
    audioRef.current = new Audio('public/interstellar.mp3')
    audioRef.current.loop = true
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  useEffect(() => {
    const syncSubmissionState = () => {
      const data = getStoredSubmissionData()
      setSubmissionData(data)
      if (typeof window !== 'undefined') {
        window.__LAYRD_SUBMISSIONS__ = data
      }
    }

    syncSubmissionState()
    window.addEventListener('layrd:data-updated', syncSubmissionState)

    return () => {
      window.removeEventListener('layrd:data-updated', syncSubmissionState)
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const handleViewportChange = () => setIsMobile(mediaQuery.matches)

    handleViewportChange()
    mediaQuery.addEventListener?.('change', handleViewportChange)

    const handleScroll = () => {
      const header = document.querySelector('.nav-header')
      if (header) {
        header.classList.toggle('is-scrolled', window.scrollY > 12)
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      mediaQuery.removeEventListener?.('change', handleViewportChange)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const toggleAudio = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(err => console.log("Audio play blocked: " + err))
    } else {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault()
    const myForm = e.target
    const formData = new FormData(myForm)
    const subscriberEmail = formData.get('email')?.toString().trim() || newsletterEmail

    if (!subscriberEmail) return

    await storeSubscription({
      email: subscriberEmail,
      createdAt: new Date().toISOString(),
      source: 'newsletter-form'
    })

    setSubmissionData(getStoredSubmissionData())
    setNewsletterSubmitted(true)
    setTimeout(() => {
      setNewsletterSubmitted(false)
      setNewsletterEmail('')
      myForm.reset()
    }, 3000)
  }

  // Mouse tracking spotlight
  useEffect(() => {
    if (isMobile) return

    const handleMouseMove = (e) => {
      setSpotlightPos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isMobile])

  // Scroll animations & tilt interactions
  useEffect(() => {
    if (loading || isMobile) return

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
        }
      })
    }, observerOptions)

    const revealElements = document.querySelectorAll('.reveal-on-scroll')
    revealElements.forEach((el) => observer.observe(el))

    // Background parallax scroll
    const handleScroll = () => {
      const scrolled = window.pageYOffset
      const spheres = document.querySelectorAll('.ambient-glow-sphere')
      if (spheres[0]) spheres[0].style.transform = `translateY(${scrolled * 0.12}px)`
      if (spheres[1]) spheres[1].style.transform = `translateY(${scrolled * 0.08}px)`
      if (spheres[2]) spheres[2].style.transform = `translateY(${scrolled * 0.05}px)`
      const grid = document.querySelector('.bg-ambient-grid')
      if (grid) grid.style.transform = `translateY(${scrolled * 0.15}px)`
    }
    window.addEventListener('scroll', handleScroll)

    // Logo follow mouse tilt
    const logoContainer = document.querySelector('.logo-showcase-container')
    const handleLogoTilt = (e) => {
      if (!logoContainer) return
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const tiltX = (dy / cy) * 15
      const tiltY = (dx / cx) * 15
      logoContainer.style.transform = `rotateX(${-tiltX}deg) rotateY(${tiltY}deg)`
    }
    window.addEventListener('mousemove', handleLogoTilt)

    const timer = setTimeout(() => {
      setLoading(false)
    }, 1200)

    return () => {
      revealElements.forEach((el) => observer.unobserve(el))
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleLogoTilt)
      clearTimeout(timer)
    }
  }, [loading, isMobile])

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    const myForm = e.target
    const formData = new FormData(myForm)
    const applicantName = formData.get('name')?.toString().trim() || 'Unknown applicant'
    const applicantEmail = formData.get('email')?.toString().trim() || 'No email provided'
    const applicantMessage = formData.get('message')?.toString().trim() || 'No message provided.'

    await storeContactMessage({
      name: applicantName,
      email: applicantEmail,
      message: applicantMessage,
      createdAt: new Date().toISOString(),
      source: 'membership-form'
    })

    setSubmissionData(getStoredSubmissionData())

    const subject = encodeURIComponent(`Membership application from ${applicantName}`)
    const body = encodeURIComponent(
      `Name: ${applicantName}\nEmail: ${applicantEmail}\n\nMessage:\n${applicantMessage}`
    )

    window.location.href = `mailto:layrd.tech@gmail.com?subject=${subject}&body=${body}`

    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setEmail('')
      setName('')
      setMessage('')
      myForm.reset()
    }, 3000)
  }

  const pillars = [
    {
      id: 'ai',
      tag: 'Sector 01 / Intelligence',
      title: 'Generative AI Engineering',
      desc: 'Building autonomous prompt networks, agent workflows, and semantic index arrays.',
      icon: <Brain size={44} />,
      class: 'ai'
    },
    {
      id: 'robotics',
      tag: 'Sector 02 / Hardware',
      title: 'Edge IoT & Microcontrollers',
      desc: 'Connecting environments and programming real-time boards like STM32 and Arduino.',
      icon: <Cpu size={44} />,
      class: 'robotics'
    },
    {
      id: 'fabrication',
      tag: 'Sector 03 / Fabrication',
      title: '3D Printing & Project Assistance',
      desc: 'Turning student concepts into physical reality with 3D structural slicing, structural CAD layouts, and custom project assistance.',
      icon: <Layers size={44} />,
      class: 'fabrication'
    }
  ]

  const workshops = [
    { title: "AI & Machine Learning Applications", description: "Map deep networks and create custom models using Python neural code packages.", stream: "All Streams" },
    { title: "Arduino & IoT in Smart Systems", description: "Connect sensors, build live relays, and transmit data arrays over Wi-Fi.", stream: "Engineering, CompSci" },
    { title: "KiCad PCB Design & Electronics", description: "Create technical schematics and draft multilayer printed copper circuit boards.", stream: "Engineering, Electronics" },
    { title: "STM32 Microcontroller Programming", description: "Program registers, configure interrupts, and write embedded threads directly on chips.", stream: "CompSci, Electronics" },
    { title: "Electrical Circuits & Signal Analysis", description: "Verify circuit nodes, analyze sine waves with virtual oscilloscopes, and master power logic.", stream: "Electrical Engineering" },
    { title: "3D Printing & Design Slicing", description: "Draft CAD wireframes, slice geometries, and print functional physical objects.", stream: "Engineering, Medicine" }
  ]

  const recentSubmissions = [...(submissionData?.messages || []), ...(submissionData?.subscriptions || [])]
    .slice(-6)
    .reverse()

  if (loading) {
    return (
      <div className="preloader-container">
        <div className="preloader-grid"></div>
        <div className="preloader-content">
          <div className="preloader-logo-ring"></div>
          <h1 className="preloader-title">LAYRD.TECH</h1>
          <div className="preloader-status">Initializing engineering sandbox...</div>
          <div className="progress-bar-wrapper">
            <div className="progress-bar-fill" style={{ width: '60%' }}></div>
          </div>
          <div className="progress-percentage">60%</div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* Background Video Player */}
      <video autoPlay muted loop playsInline className="bg-video">
        <source src="./public/background.mp4" type="video/mp4" />
        <source src="./public/background.webm" type="video/webm" />
      </video>

      {/* Background Floating Particles */}
      <div className="bg-particle particle-1"></div>
      <div className="bg-particle particle-2"></div>
      <div className="bg-particle particle-3"></div>

      {/* Ambient background glow layers */}
      <div id="glow-cyan" className="ambient-glow-sphere sphere-cyan" style={{ top: '10%', right: '5%' }}></div>
      <div id="glow-purple" className="ambient-glow-sphere sphere-purple" style={{ top: '45%', left: '-10%' }}></div>
      <div id="glow-cyan-bottom" className="ambient-glow-sphere sphere-cyan" style={{ bottom: '5%', right: '10%', width: '250px', height: '250px' }}></div>

      {/* Physics Cursor */}
      <CustomCursor />

      {/* Radial Spotlight */}
      <div 
        className="radial-spotlight"
        style={{ left: `${spotlightPos.x}px`, top: `${spotlightPos.y}px` }}
      ></div>

      <div className="bg-ambient-grid"></div>

      {/* Navigation */}
      <header className="nav-header">
        <div className="nav-brand">
          <div className="brand-icon-box">
            <img src="./public/logo.png" alt="Layrd Tech Logo" className="brand-logo-img" />
          </div>
          <span className="brand-name">LAYRD.TECH</span>
        </div>

        <nav className="nav-links">
          <a href="#guild" className="nav-link">The Guild</a>
          <a href="#sectors" className="nav-link">Sectors</a>
          <a href="#workshops" className="nav-link">Workshops</a>
          <a href="#gallery" className="nav-link">Gallery</a>
          <a href="#about" className="nav-link">About</a>
          <a href="#sandbox" className="nav-link">Sandbox</a>
        </nav>

        <a href="#contact" className="nav-cta">Join Community</a>

        <button
          type="button"
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>

      <div className={`mobile-nav-panel ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#guild" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">The Guild</a>
        <a href="#sectors" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Sectors</a>
        <a href="#workshops" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Workshops</a>
        <a href="#gallery" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Gallery</a>
        <a href="#about" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">About</a>
        <a href="#sandbox" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link">Sandbox</a>
        <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="mobile-nav-link mobile-nav-cta">Join Community</a>
      </div>

      {/* Hero Section */}
      <section className="section-wrapper hero-wrapper">
        <div className="hero-text-block">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            <span>FROM IDEA TO PRODUCT</span>
          </div>
          <h1 className="hero-main-title">
            <span>Find Your Inner</span><br />
            <span>Engineer.</span>
          </h1>
          <p className="hero-desc">
            We are a hands-on community built to help students create real things—taking your technical ideas all the way to finished functional products. We merge electronics, microchips, 3D manufacturing, and emerging software tracks to turn curious students into capable makers.
          </p>
          <div className="hero-ctas">
            <a href="#contact" className="btn btn-primary">Join the Guild</a>
            <a href="#sandbox" className="btn btn-secondary">Enter Sandbox Lab</a>
          </div>
        </div>

        <div className="hero-graphic-block">
          <div className="logo-showcase-container" id="logo-parallax-element">
            {/* Concentric tech rings */}
            <div className="tech-ring ring-outer"></div>
            <div className="tech-ring ring-inner"></div>
            
            {/* Spec labels */}
            <div className="tech-spec spec-top-left">SYS_CORE // ACTIVE</div>
            <div className="tech-spec spec-bottom-right">NODE_LINK // ESTABLISHED</div>
            
            <img src="./public/logo.png" alt="Layrd Tech Logo" className="hero-logo-img" />
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section-wrapper reveal-on-scroll" id="guild">
        <div className="section-header">
          <span className="section-label">01 // The Movement</span>
          <h2 className="section-title">The Creator's Pipeline</h2>
          <p>
            Academics teach rules. We build actual prototypes. Here is the path from a blank page to a functional, powered electronic product.
          </p>
        </div>

        <div className="grid-container">
          <div className="workshop-card glass-panel interactive-card reveal-on-scroll">
            <span className="card-badge">Phase 01 // The Spark</span>
            <h3 className="card-title">Concept & System Architecture</h3>
            <p className="card-desc">Formulate the spark. Map electrical connections, select components, and design the physical layout of your next-gen product.</p>
          </div>

          <div className="workshop-card glass-panel interactive-card reveal-on-scroll">
            <span className="card-badge">Phase 02 // Prototyping</span>
            <h3 className="card-title">Electronics & Physical Builds</h3>
            <p className="card-desc">Solder microcontrollers, route actual copper traces in KiCad, and 3D print structural frame enclosures to protect your nodes.</p>
          </div>

          <div className="workshop-card glass-panel interactive-card reveal-on-scroll">
            <span className="card-badge">Phase 03 // Production</span>
            <h3 className="card-title">Deploy & Launch Sprints</h3>
            <p className="card-desc">Compile embedded firmware, run real-time hardware telemetry streams, and launch a finished product ready for the world.</p>
          </div>
        </div>
      </section>

      {/* Sectors Timeline */}
      <section className="section-wrapper reveal-on-scroll" id="sectors">
        <div className="section-header">
          <span className="section-label">02 // The Frontier</span>
          <h2 className="section-title">Emergent Technology Sectors</h2>
          <p>We map current generation fields into practical community training modules.</p>
        </div>

        <div className="timeline-container">
          <div className="timeline-line-center"></div>
          
          {pillars.map((pillar) => (
            <div key={pillar.id} className="timeline-item reveal-on-scroll">
              <div className="timeline-node-dot"></div>
              <div className="timeline-content-card glass-panel">
                <span className="timeline-tag">{pillar.tag}</span>
                <h3 className="timeline-card-title">{pillar.title}</h3>
                <p className="timeline-card-desc">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workshops Grid */}
      <section className="section-wrapper reveal-on-scroll" id="workshops">
        <div className="section-header">
          <span className="section-label">03 // Sprints</span>
          <h2 className="section-title">Active Workshop Tracks</h2>
        </div>

        <div className="grid-container">
          {workshops.map((w, idx) => (
            <div key={idx} className="workshop-card glass-panel interactive-card reveal-on-scroll">
              <span className="card-badge">Module 0{idx + 1} // {w.stream}</span>
              <h3 className="card-title">{w.title}</h3>
              <p className="card-desc">{w.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Guild Gallery (Encapsulated B&W Horizontal Scroll Grid) */}
      <section className="section-wrapper reveal-on-scroll" id="gallery">
        <div className="section-header">
          <span className="section-label">04 // Build Sessions</span>
          <h2 className="section-title">The Guild Gallery</h2>
          <p>
            Browse snapshots from our hands-on engineering labs and student product expositions.
          </p>
        </div>
        
        <div className="encapsulated-gallery-box">
          <div className="gallery-grid">
            <div className="gallery-card">
              <div className="gallery-img-wrapper">
                <img src="./public/gallery1.jpg" alt="Hands-on Microcontroller Build Session" className="gallery-img" />
              </div>
            </div>

            <div className="gallery-card">
              <div className="gallery-img-wrapper">
                <img src="./public/gallery2.jpg" alt="Technical Exposition Presentation" className="gallery-img" />
              </div>
            </div>

            <div className="gallery-card">
              <div className="gallery-img-wrapper">
                <img src="./public/gallery3.jpg" alt="Layrd.Tech Engineering Assembly" className="gallery-img" />
              </div>
            </div>

            <div className="gallery-card">
              <div className="gallery-img-wrapper">
                <img src="./public/gallery4.jpg" alt="Classroom Lecture and Q&A" className="gallery-img" />
              </div>
            </div>

            <div className="gallery-card">
              <div className="gallery-img-wrapper">
                <img src="./public/gallery5.jpg" alt="Engineering Lab Presentation" className="gallery-img" />
              </div>
            </div>

            <div className="gallery-card">
              <div className="gallery-img-wrapper">
                <img src="./public/gallery6.jpg" alt="Technical Discussion session" className="gallery-img" />
              </div>
            </div>

            <div className="gallery-card">
              <div className="gallery-img-wrapper">
                <img src="./public/gallery7.jpg" alt="Layrd.Tech Core Team and Mentors" className="gallery-img" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Founder */}
      <section className="section-wrapper reveal-on-scroll" id="about">
        <div className="founder-layout-wrapper">
          <div className="founder-img-card glass-panel reveal-on-scroll">
            <div className="tech-corner top-left"></div>
            <div className="tech-corner top-right"></div>
            <div className="tech-corner bottom-left"></div>
            <div className="tech-corner bottom-right"></div>
            <div className="founder-img-frame">
              <img src="./public/founder.jpg" alt="Founder of Layrd.Tech" className="founder-img" />
            </div>
            <div className="founder-quote-box">
              <p className="founder-creed">"One million dreams, one mission: better engineering."</p>
            </div>
          </div>
          
          <div className="founder-info-block reveal-on-scroll">
            <span className="section-label">05 // Visionary</span>
            <h2 className="section-title">Meet the Founder</h2>
            <p className="founder-text-body">
              Every great advancement starts with a single question: How can we make this better? From designing intricate firmware circuits to architecting scalable industrial frameworks, my journey has been defined by a relentless pursuit of engineering excellence.
            </p>
            <p className="founder-text-body" style={{ marginTop: '15px' }}>
              This startup is the culmination of that journey—a dedicated vehicle to turn ambitious possibilities into functional, high-performance realities.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Sandbox */}
      <section className="section-wrapper reveal-on-scroll" id="sandbox">
        <div className="section-header">
          <span className="section-label">06 // Toolkit</span>
          <h2 className="section-title">The Engineering Sandbox</h2>
          <p>
            A set of real, no-nonsense calculators our members use on the bench — from sizing an LED resistor to decoding registers. Everything runs live in your browser.
          </p>
        </div>
        <TechSandbox />
      </section>

      {/* Connect Form */}
      <section className="section-wrapper reveal-on-scroll" id="contact">
        <div className="section-header">
          <span className="section-label">07 // Connect</span>
          <h2 className="section-title">Join the Guild</h2>
          <p>Don't wait for graduation. The world is built by people who didn't wait for permission. Apply to join our active peer network and start engineering your first product.</p>
        </div>

        <div className="contact-hub-wrapper">
          <div className="contact-card glass-panel">
            {submitted ? (
              <div className="success-message">
                <span>✓ Transmission established. Welcome to the Guild.</span>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="contact-form" name="contact" method="POST" data-netlify="true">
                <input type="hidden" name="form-name" value="contact" />
                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input 
                      type="text" 
                      name="name"
                      className="form-input" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      name="email"
                      className="form-input" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Select Inquiry</label>
                  <select name="inquiry" className="form-input">
                    <option>Join the Engineering Guild</option>
                    <option>Request School/College Demo</option>
                    <option>General Inquiry</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Why do you want to build?</label>
                  <textarea 
                    name="why_build"
                    className="form-input" 
                    rows="3" 
                    placeholder="Tell us about the project you want to create..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="form-submit-btn">Apply for Membership</button>
              </form>
            )}
          </div>

          <div className="contact-info-card glass-panel">
            <div className="info-header">
              <h3 className="info-title">Layrd.Tech Guild</h3>
              <p>Fostering hardware literacy and community creators.</p>
            </div>
            <div className="info-items-list">
              <div className="info-item">
                <div>
                  <div className="info-label">Direct Mail</div>
                  <a href="mailto:layrd.tech@gmail.com" className="info-link">layrd.tech@gmail.com</a>
                </div>
              </div>
            </div>
            <div className="social-grid">
              <h4 className="social-title">Secure Nodes</h4>
              <div className="social-links-row">
                <a href="https://instagram.com/layrd.tech" className="social-btn" target="_blank" rel="noreferrer">IG</a>
                <a href="https://twitter.com/layrd.tech" className="social-btn" target="_blank" rel="noreferrer">TW</a>
                <a href="https://github.com/layrd-tech" className="social-btn" target="_blank" rel="noreferrer">GH</a>
                <a href="https://linkedin.com/company/layrdtech" className="social-btn" target="_blank" rel="noreferrer">LN</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Build Log Newsletter */}
      <section className="section-wrapper reveal-on-scroll newsletter-section">
        <div className="newsletter-card glass-panel animate-on-hover">
          <h3 className="sandbox-title">Subscribe to the Build Log</h3>
          <p className="sandbox-panel-desc">Get hardware schematics, firmware repositories, and community project logs delivered bi-weekly.</p>
          {newsletterSubmitted ? (
            <div className="success-message">
              <span>✓ Subscribed to the Build Log node. Welcome.</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form" name="newsletter" method="POST" data-netlify="true">
              <input type="hidden" name="form-name" value="newsletter" />
              <input 
                type="email" 
                name="email"
                className="form-input" 
                placeholder="Enter your email address" 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required 
              />
              <button type="submit" className="newsletter-btn">Subscribe</button>
            </form>
          )}
        </div>
      </section>

      <section className="section-wrapper reveal-on-scroll">
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '18px' }}>
          <h3 className="sandbox-title" style={{ marginBottom: '8px' }}>Recent submissions</h3>
          <p className="sandbox-panel-desc" style={{ marginBottom: '16px' }}>
            Entries saved to Firebase and local storage will appear here instantly after you submit the forms.
          </p>
          {recentSubmissions.length === 0 ? (
            <p style={{ color: '#b8c0d8', fontSize: '0.95rem' }}>No submissions yet. Submit the membership or newsletter form to see them here.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
              {recentSubmissions.map((item) => {
                const label = item.type === 'subscription' ? 'Subscription' : 'Message'
                const detail = item.type === 'subscription'
                  ? item.email || 'No email'
                  : `${item.name || 'Unknown'} • ${item.email || 'No email'}`

                return (
                  <li key={item.id} style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', color: '#b8c0d8', marginTop: '4px' }}>{detail}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <footer className="footer">
        <p className="footer-text">
          © 2026 Layrd.Tech. Supporting generation-shaping developers & creators. All rights reserved.
        </p>
      </footer>


      <div 
        onClick={toggleAudio} 
        className={`audio-control-btn ${isPlaying ? 'playing' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Toggle Background Music"
      >
        <div className="audio-pulse"></div>
        <span className="audio-icon">
          {!isPlaying ? (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 5L6 9H2v6h4l5 4V5z"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          )}
        </span>
      </div>
    </div>
  )
}
