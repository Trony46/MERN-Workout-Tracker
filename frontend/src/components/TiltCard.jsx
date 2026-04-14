import { useRef, useState } from 'react'

export default function TiltCard({ children, className = '' }) {
  const cardRef = useRef(null)
  const [style, setStyle] = useState({})

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    
    // Get mouse coordinates relative to the card
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Find the center of the card
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Calculate rotation: Pushing DOWN on the mouse coordinates
    const rotateX = ((y - centerY) / centerY) * -10 // Max 10 degrees tilt
    const rotateY = ((centerX - x) / centerX) * -10

    // Dynamic Under-light: Casts a shadow in the opposite direction of the tilt
    const shadowX = rotateY * -1.5
    const shadowY = rotateX * 1.5

    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      boxShadow: `${shadowX}px ${shadowY}px 25px rgba(233, 69, 96, 0.3), 0 10px 20px rgba(0,0,0,0.6)`
    })
  }

  const handleMouseLeave = () => {
    // Snap back to flat when the mouse leaves
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      boxShadow: 'none'
    })
  }

  return (
    <div
      ref={cardRef}
      className={`tilt-wrapper ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, width: '100%' }}
    >
      {children}
    </div>
  )
}