import React, { useMemo } from 'react';
import { motion } from 'motion/react';

export default function RailwaySignalSelectionIndicator() {
  // Generate random floating background digital particles (Apple Vision Pro/Enterprise Dashboard vibe)
  const particles = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // random percentage
      y: Math.random() * 100, // random percentage
      size: 1 + Math.random() * 3,
      opacity: 0.1 + Math.random() * 0.6,
      duration: 5 + Math.random() * 8,
      delay: Math.random() * -10,
    }));
  }, []);

  // Generate orbit sparks that run around the spinner
  const orbitSparks = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      radius: 50 + i * 8,
      duration: 6 + i * 2,
      delay: i * -1.5,
      direction: i % 2 === 0 ? 360 : -360,
    }));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-[#070B14]/30 rounded-2xl border border-slate-900/40 shadow-[0_12px_36px_rgba(0,0,0,0.8)] max-w-md mx-auto overflow-hidden relative select-none w-full my-3">
      {/* 1. Futuristic Cinematic Backdrops */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d] via-[#050811] to-[#010204] pointer-events-none z-0" />
      
      {/* Subtle Digital Grid Background line indicators */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] pointer-events-none opacity-45" />

      {/* Volumetric ambient depth-of-field lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[150px] h-[150px] bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[180px] h-[180px] bg-rose-500/5 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-cyan-500/5 rounded-full blur-[70px] pointer-events-none" />

      {/* Dynamic Digital Floating Ground Matrix Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-cyan-400/40 blur-[0.4px]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.sin(p.id) * 10, 0],
              opacity: [p.opacity * 0.4, p.opacity * 1.5, p.opacity * 0.4],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Container for Slow Camera Zoom & Orbit */}
      <motion.div
        className="relative z-10 w-full flex flex-col items-center justify-center my-3"
        animate={{
          scale: [0.98, 1.02, 0.98],
          rotateX: [4, -4, 4],
          rotateY: [-5, 5, -5],
          y: [-4, 4, -4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          perspective: 1200,
        }}
      >
        {/* Orbiting Energy Ring & Sparks around the fan */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {orbitSparks.map((spark) => (
            <motion.div
              key={spark.id}
              className="absolute border border-dashed rounded-full"
              style={{
                width: `${spark.radius * 2}px`,
                height: `${spark.radius * 2}px`,
                borderColor: spark.id % 2 === 0 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(217, 70, 239, 0.09)',
                transformStyle: 'preserve-3d',
                transform: `rotateX(68deg) rotateY(${spark.id * 15}deg)`,
              }}
              animate={{
                rotateZ: [0, spark.direction],
              }}
              transition={{
                duration: spark.duration,
                repeat: Infinity,
                delay: spark.delay,
                ease: "linear",
              }}
            />
          ))}

          {/* Radial Expanding Energy Waves */}
          <motion.div
            className="absolute rounded-full border border-teal-500/20 pointer-events-none"
            animate={{
              width: [40, 110],
              height: [40, 110],
              opacity: [0.7, 0],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className="absolute rounded-full border border-purple-500/15 pointer-events-none"
            animate={{
              width: [60, 140],
              height: [60, 140],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              delay: 1.5,
              ease: "easeOut",
            }}
          />
        </div>

        {/* 2. THE MAIN NEON FLOWER SPINNER DESIGN - SHRUNK TO A LUXURIOUS 6-PETAL GLASS COMPACT INTERFACE WITH CONCENTRIC METAL CHANNELS */}
        <div className="relative w-[220px] h-[220px] flex items-center justify-center">
          
          {/* 3D Carved Engraved Concentric Metallic rail slots mimicking the video background perfectly */}
          <div className="absolute w-[225px] h-[225px] rounded-full bg-gradient-to-br from-[#121826] via-[#0d121c] to-[#04060b] border border-slate-900/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.06),0_15px_30px_rgba(0,0,0,0.95)] flex items-center justify-center z-0 pointer-events-none">
            {/* Outer metallic slot track */}
            <div className="absolute w-[184px] h-[184px] rounded-full border-2 border-slate-950/75 bg-slate-950/15 shadow-[inset_0_2.5px_6px_rgba(0,0,0,0.85),0_1px_1px_rgba(255,255,255,0.035)] flex items-center justify-center">
              {/* Mid metallic slot track */}
              <div className="absolute w-[150px] h-[150px] rounded-full border border-slate-950/50 bg-slate-950/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.85),0_1px_1.5px_rgba(255,255,255,0.02)] flex items-center justify-center">
                {/* Inner metallic slot track */}
                <div className="absolute w-[116px] h-[116px] rounded-full border border-slate-950/40 bg-slate-950/25 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.8)]" />
              </div>
            </div>
          </div>

          {/* Ambient Glowing Glass Color Wheels backdrop layer */}
          <motion.div
            className="absolute w-[140px] h-[140px] rounded-full bg-gradient-to-tr from-purple-500/10 via-cyan-500/10 to-amber-500/15 blur-2xl pointer-events-none"
            animate={{
              rotate: [0, 360],
              scale: [0.94, 1.06, 0.94],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Faint static circular radar rings behind the spinner for Apple Vision Pro style */}
          <div className="absolute w-[184px] h-[184px] rounded-full border border-indigo-500/[0.04] pointer-events-none z-0" />
          <div className="absolute w-[150px] h-[150px] rounded-full border border-indigo-500/[0.06] pointer-events-none z-0" />
          <div className="absolute w-[116px] h-[116px] rounded-full border border-indigo-500/[0.08] pointer-events-none z-0" />

          {/* Rotating Flower Spinner containing 6 Symmetrically Detached Glassy Petals (Rotates dynamically/fast like a real fan!) */}
          <motion.div
            className="w-[140px] h-[140px] relative"
            animate={{
              // Fast and active rotation as requested ("teji se jaise fan ka bled krta hai move or dekhne me akarshak hoga")
              rotate: [0, 360],
            }}
            transition={{
              duration: 1.3, // swift real fan speed loop (kaphi dekhne me akarshak or dynamic hoga!)
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* Subtle Motion Blur Trail Layer simulating soft glass reflection drag */}
            <div className="absolute inset-0 rotate-2 rounded-full opacity-35 blur-[1.5px] pointer-events-none scale-[0.99]">
              <SpinnerBladesSvg className="w-full h-full" idPrefix="blur1" />
            </div>

            {/* Clean Primary Sharp Glassmorphic Layer - with breathing brightness pulsing neon bloom */}
            <motion.div 
              className="absolute inset-0"
              animate={{
                opacity: [0.9, 1.0, 0.9],
                filter: [
                  "drop-shadow(0 0 12px rgba(105,47,246,0.45))",
                  "drop-shadow(0 0 22px rgba(61,206,252,0.65))",
                  "drop-shadow(0 0 12px rgba(105,47,246,0.45))"
                ]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <SpinnerBladesSvg className="w-full h-full" idPrefix="sharp" />
            </motion.div>
          </motion.div>

          {/* 3. MULTIPLE CONCENTRIC NEON RINGS & GLASSMORPHISM CORE WITH SOFT PULSE EFFECT */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Transparent Glassmorphic shadow core shield */}
            <div className="w-[48px] h-[48px] rounded-full bg-slate-950/75 backdrop-blur-xl border border-white/15 flex items-center justify-center shadow-2xl relative">
              
              {/* Concentric Neon Ring 1 - Pulse 1 */}
              <motion.div
                className="absolute inset-[2px] rounded-full border border-blue-400/40"
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.65, 0.95, 0.65],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Concentric Neon Ring 2 - Pulse 2 */}
              <motion.div
                className="absolute -inset-1.5 rounded-full border border-indigo-500/30"
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.4, 0.75, 0.4],
                }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4
                }}
              />

              {/* Concentric pulse wave radiating from the core */}
              <motion.div
                className="absolute -inset-[18px] rounded-full border border-indigo-400/15"
                animate={{
                  scale: [0.95, 1.45, 0.95],
                  opacity: [0.45, 0.05, 0.45],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Glowing pure blue glassy inner core dot (sisa jaisa chmkega) */}
              <div className="w-[30px] h-[30px] rounded-full bg-slate-950/80 border border-white/15 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.35)] flex items-center justify-center overflow-hidden relative">
                {/* Real-time pure blue gloss gradient sphere */}
                <div 
                  className="absolute inset-0 rounded-full" 
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #5DE7FF 0%, #2011FA 62%, #0B00B5 100%)',
                    boxShadow: '0 0 15px rgba(32,17,250,0.9), inset 0 0 8px rgba(255,255,255,0.5)',
                  }}
                />
                
                {/* Specular high-end glass glare highlight (Sisa gloss effect) */}
                <div className="absolute top-0.5 left-1 w-2.5 h-1.5 rounded-full bg-white/60 rotate-[-15deg] pointer-events-none filter blur-[0.2px]" />
                
                {/* Breathing micro LED pulse */}
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-cyan-200 to-indigo-300 opacity-80"
                  animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Holographic dotted systems metric ring */}
              <motion.div 
                className="absolute -inset-3.5 rounded-full border border-indigo-400/25 border-dotted"
                animate={{
                  rotate: -360
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </div>

          {/* Premium Orbital Energy Sparks following the concentric metal slots (like the video!) */}
          <div className="absolute w-[184px] h-[184px] pointer-events-none flex items-center justify-center z-0">
            {/* Spark 1: Electric Cyan following concentric tracks */}
            <motion.div
              className="absolute w-full h-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
            >
              <div 
                className="absolute w-2 h-2 rounded-full bg-[#5DE7FF]" 
                style={{
                  top: '-4px', 
                  left: 'calc(50% - 4px)',
                  boxShadow: '0 0 10px #5DE7FF, 0 0 20px #3DCEFC'
                }} 
              />
            </motion.div>

            {/* Spark 2: Orange/Golden following inner track in opposite direction */}
            <motion.div
              className="absolute w-[150px] h-[150px]"
              animate={{ rotate: -360 }}
              transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
            >
              <div 
                className="absolute w-1.5 h-1.5 rounded-full bg-[#FFB300]" 
                style={{
                  top: '-3px', 
                  left: 'calc(50% - 3px)',
                  boxShadow: '0 0 8px #FFB300, 0 0 16px #FEBD04'
                }} 
              />
            </motion.div>
          </div>

        </div>
      </motion.div>

      {/* Realistic bottom half-shadow projection underneath the glassy spinner */}
      <div className="relative w-32 h-6 mt-2 opacity-50 z-0 pointer-events-none select-none overflow-hidden flex items-center justify-center">
        {/* We use a skewed, squashed rotating container with vertical fade-out mask to represent the beautiful bottom half-shadow */}
        <motion.div
          className="absolute inset-x-2 bottom-0 h-2.5 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent blur-[2.5px] rounded-full scale-y-50"
          animate={{
            scaleX: [0.95, 1.05, 0.95],
            opacity: [0.45, 0.65, 0.45],
            skewX: [8, 14, 8],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Animated rotating shadow trace that matches fast spinner rotation but deeply shaded and masked */}
        <motion.div
          className="absolute inset-0 scale-y-[0.22] scale-x-75 translate-y-2.5 opacity-35 filter blur-[2.5px]"
          style={{
            maskImage: 'linear-gradient(to top, black 35%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to top, black 35%, transparent 95%)',
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 1.3, // Matches fast rotation speed perfectly
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <SpinnerBladesSvg className="w-full h-full select-none" idPrefix="shadow" />
        </motion.div>
      </div>

      {/* Cybernetic Selection Panel / User Interface Status Board */}
      <div className="w-full mt-4 relative z-10 font-sans">
        <div className="relative overflow-hidden bg-slate-950/85 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.06)] w-full max-w-xs mx-auto">
          {/* High-tech glass highlights */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-purple-500/30 via-cyan-400/50 to-orange-500/30" />
          
          <div className="absolute left-0 inset-y-0 w-[3px] bg-gradient-to-b from-purple-500 to-indigo-600" />
          <div className="absolute right-0 inset-y-0 w-[3px] bg-gradient-to-b from-pink-500 to-orange-500" />

          <div className="relative overflow-hidden py-1 text-center">
            <motion.h4
              className="text-sm font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-amber-300 select-none relative z-10"
              animate={{
                textShadow: [
                  "0 0 12px rgba(168,85,247,0.35), 0 0 20px rgba(6,182,212,0.25)",
                  "0 0 20px rgba(168,85,247,0.7), 0 0 35px rgba(6,182,212,0.5)",
                  "0 0 12px rgba(168,85,247,0.35), 0 0 20px rgba(6,182,212,0.25)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Choose a Segment
            </motion.h4>
            <div className="text-[10px] text-zinc-500 font-mono tracking-widest font-black uppercase mt-1">
              प्रभाग का चयन करें
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            Please select an option from the left sidebar to open documents, forms, reports, or the automated Claim TA portal.
          </div>
        </div>
      </div>
    </div>
  );
}

// 6-bladed premium glassy SVGs representing the crystal glass glowing fan spinner (with custom offsets to not touch center)
interface SvgProps {
  className?: string;
  idPrefix: string;
}

function SpinnerBladesSvg({ className, idPrefix }: SvgProps) {
  // 6 spec-compliant colorful glassy blade gradients matching the user's config:
  // Petal 1: Top Purple (#692FF6), Glow (#B066FF)
  // Petal 2: Top Right Cyan (#3DCEFC), Glow (#5DE7FF)
  // Petal 3: Right Orange (#FEBD04), Glow (#FFB300)
  // Petal 4: Bottom Right Pink (#F803A7), Glow (#FF4BC1)
  // Petal 5: Bottom Left Blue (#2011FA), Glow (#4D6DFF)
  // Petal 6: Left Lavender (#7313E6), Glow paired with (#B066FF)
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Petal 1: Top Purple Gradient */}
        <linearGradient id={`${idPrefix}-petal-purple`} x1="100" y1="72" x2="114" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#692FF6" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#692FF6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#B066FF" stopOpacity="1" />
        </linearGradient>

        {/* Petal 2: Top Right Cyan Gradient */}
        <linearGradient id={`${idPrefix}-petal-cyan`} x1="100" y1="72" x2="114" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3DCEFC" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#3DCEFC" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#5DE7FF" stopOpacity="1" />
        </linearGradient>

        {/* Petal 3: Right Orange Gradient */}
        <linearGradient id={`${idPrefix}-petal-orange`} x1="100" y1="72" x2="114" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEBD04" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#FEBD04" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFB300" stopOpacity="1" />
        </linearGradient>

        {/* Petal 4: Bottom Right Pink Gradient */}
        <linearGradient id={`${idPrefix}-petal-pink`} x1="100" y1="72" x2="114" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F803A7" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#F803A7" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FF4BC1" stopOpacity="1" />
        </linearGradient>

        {/* Petal 5: Bottom Left Blue Gradient */}
        <linearGradient id={`${idPrefix}-petal-blue`} x1="100" y1="72" x2="114" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2011FA" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#2011FA" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#4D6DFF" stopOpacity="1" />
        </linearGradient>

        {/* Petal 6: Left Lavender Gradient */}
        <linearGradient id={`${idPrefix}-petal-lavender`} x1="100" y1="72" x2="114" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7313E6" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#7313E6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#B066FF" stopOpacity="1" />
        </linearGradient>

        {/* General Glass highlight linear gradient representing 3D crystalline gloss sheerness */}
        <linearGradient id={`${idPrefix}-glass-shine`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
        </linearGradient>
        
        {/* Soft neon outer shadow filter for 3D realism elevation */}
        <filter id={`${idPrefix}-neon-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Symmetrical 6-Petal layout of soft glassy fan blade raindrops spaced exactly 60 degrees apart */}
      {/* Detached from center: starts smoothly at y=72 instead of y=100 (leaving space from central blue dot) */}
      <g filter={`url(#${idPrefix}-neon-glow)`}>
        
        {/* Petal 1: Top Purple (0 degrees) */}
        <g transform="rotate(0 100 100)">
          <path 
            d="M100 72 C116 67, 128 46, 114 26 C95 8, 84 26, 93 52 C95 60, 98 67, 100 72 Z" 
            fill={`url(#${idPrefix}-petal-purple)`} 
            className="stroke-[1px] stroke-purple-300/30"
          />
          {/* Crystalline Gloss overlay specular trace */}
          <path 
            d="M101.5 70.5 C114.5 65.5, 124 48, 112.5 28.5" 
            stroke={`url(#${idPrefix}-glass-shine)`} 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeOpacity="0.7"
          />
        </g>

        {/* Petal 2: Top Right Cyan (rotated 60 degrees) */}
        <g transform="rotate(60 100 100)">
          <path 
            d="M100 72 C116 67, 128 46, 114 26 C95 8, 84 26, 93 52 C95 60, 98 67, 100 72 Z" 
            fill={`url(#${idPrefix}-petal-cyan)`} 
            className="stroke-[1px] stroke-cyan-300/30"
          />
          {/* Crystalline Gloss overlay specular trace */}
          <path 
            d="M101.5 70.5 C114.5 65.5, 124 48, 112.5 28.5" 
            stroke={`url(#${idPrefix}-glass-shine)`} 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeOpacity="0.7"
          />
        </g>

        {/* Petal 3: Right Orange (rotated 120 degrees) */}
        <g transform="rotate(120 100 100)">
          <path 
            d="M100 72 C116 67, 128 46, 114 26 C95 8, 84 26, 93 52 C95 60, 98 67, 100 72 Z" 
            fill={`url(#${idPrefix}-petal-orange)`} 
            className="stroke-[1px] stroke-amber-200/35"
          />
          {/* Crystalline Gloss overlay specular trace */}
          <path 
            d="M101.5 70.5 C114.5 65.5, 124 48, 112.5 28.5" 
            stroke={`url(#${idPrefix}-glass-shine)`} 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeOpacity="0.7"
          />
        </g>

        {/* Petal 4: Bottom Right Pink (rotated 180 degrees) */}
        <g transform="rotate(180 100 100)">
          <path 
            d="M100 72 C116 67, 128 46, 114 26 C95 8, 84 26, 93 52 C95 60, 98 67, 100 72 Z" 
            fill={`url(#${idPrefix}-petal-pink)`} 
            className="stroke-[1px] stroke-pink-300/35"
          />
          {/* Crystalline Gloss overlay specular trace */}
          <path 
            d="M101.5 70.5 C114.5 65.5, 124 48, 112.5 28.5" 
            stroke={`url(#${idPrefix}-glass-shine)`} 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeOpacity="0.7"
          />
        </g>

        {/* Petal 5: Bottom Left Blue (rotated 240 degrees) */}
        <g transform="rotate(240 100 100)">
          <path 
            d="M100 72 C116 67, 128 46, 114 26 C95 8, 84 26, 93 52 C95 60, 98 67, 100 72 Z" 
            fill={`url(#${idPrefix}-petal-blue)`} 
            className="stroke-[1px] stroke-blue-200/30"
          />
          {/* Crystalline Gloss overlay specular trace */}
          <path 
            d="M101.5 70.5 C114.5 65.5, 124 48, 112.5 28.5" 
            stroke={`url(#${idPrefix}-glass-shine)`} 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeOpacity="0.7"
          />
        </g>

        {/* Petal 6: Left Lavender (rotated 300 degrees) */}
        <g transform="rotate(300 100 100)">
          <path 
            d="M100 72 C116 67, 128 46, 114 26 C95 8, 84 26, 93 52 C95 60, 98 67, 100 72 Z" 
            fill={`url(#${idPrefix}-petal-lavender)`} 
            className="stroke-[1px] stroke-purple-200/30"
          />
          {/* Crystalline Gloss overlay specular trace */}
          <path 
            d="M101.5 70.5 C114.5 65.5, 124 48, 112.5 28.5" 
            stroke={`url(#${idPrefix}-glass-shine)`} 
            strokeWidth="1.2" 
            strokeLinecap="round" 
            strokeOpacity="0.7"
          />
        </g>
      </g>
      
      {/* Premium reflective glass concentric alignment indicators */}
      <circle cx="100" cy="100" r="95" stroke="white" strokeOpacity="0.03" strokeWidth="1" />
      <circle cx="100" cy="100" r="82" stroke="white" strokeOpacity="0.015" strokeWidth="1" />
    </svg>
  );
}
