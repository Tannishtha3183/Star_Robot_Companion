import React, { useRef, useState, useEffect } from "react";
import { ExpressionType, CompanionState } from "../types";

interface CompanionModelProps {
  state: CompanionState;
  expression: ExpressionType;
  onTapPart?: (part: "antenna" | "chest" | "head" | "ears") => void;
}

export const CompanionModel: React.FC<CompanionModelProps> = ({
  state,
  expression,
  onTapPart,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth sunset lighting calibrated of our gorgeous palette
  const light = {
    x: 82,
    y: 45,
    intensity: 1.25,
    timeOfDay: "sunset" as const,
  };

  // States to hold the smoothly interpolated positions (look direction)
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [bobTime, setBobTime] = useState(0);

  // Animation frame and tracking references
  const targetLook = useRef({ x: 0, y: 0 });
  const currentLook = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number | null>(null);
  const blinkRef = useRef({ isBlinking: false });
  const [isBlinking, setIsBlinking] = useState(false);

  // Periodic Blink Timer
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      blinkRef.current.isBlinking = true;
      
      // Short blink duration
      setTimeout(() => {
        setIsBlinking(false);
        blinkRef.current.isBlinking = false;
      }, 120);

      // Schedule next random blink interval between 3 to 7 seconds
      const nextTime = 3000 + Math.random() * 4000;
      blinkTimeout = setTimeout(triggerBlink, nextTime);
    };

    blinkTimeout = setTimeout(triggerBlink, 4000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Track cursor coordinates across the document window
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Distance vectors
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;

      // Distance cap
      const maxDistance = 400;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const strength = Math.min(distance / maxDistance, 1.0);

      // Normalized coordinates (-1 to 1) weighted by distance
      targetLook.current = {
        x: Math.cos(angle) * strength,
        y: Math.sin(angle) * strength,
      };
    };

    const handleMouseLeave = () => {
      // Return slowly to center when cursor leaves viewport
      targetLook.current = { x: 0, y: 0 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // requestAnimationFrame Main Loop for Float, Tilt and Look Dampening
  useEffect(() => {
    let lastTime = performance.now();

    const animateLoop = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      // Interpolation speed (higher = faster snapping, lower = smoother drift)
      const interpolationFactor = 0.08; 

      // Linearly update the look matrix toward target look
      currentLook.current.x += (targetLook.current.x - currentLook.current.x) * interpolationFactor;
      currentLook.current.y += (targetLook.current.y - currentLook.current.y) * interpolationFactor;

      setLook({ x: currentLook.current.x, y: currentLook.current.y });
      setBobTime(time * 0.002); // continuous flow sine variable

      requestRef.current = requestAnimationFrame(animateLoop);
    };

    requestRef.current = requestAnimationFrame(animateLoop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Compute physical floating offset (oscillation math)
  // Bob slower and tighter in thinking state, more dynamic in excited
  const bobFactor = state === "thinking" ? 3 : state === "listening" ? 4 : 7;
  const bobSpeed = state === "thinking" ? 0.8 : 1.2;
  const hoverY = Math.sin(bobTime * bobSpeed) * bobFactor;

  // Tiny extra phase lag for Head movement relative to the torso for luxurious physical dynamics
  const headHoverY = Math.sin(bobTime * bobSpeed - 0.5) * (bobFactor * 0.4);

  // Listening state: Star leans slightly forward (scale and positive y shift)
  const isListening = state === "listening";
  const scaleChange = isListening ? 1.02 : 1.0;
  
  // Normalized Light vectors mapping (-50% to +50%)
  const lx = (light.x - 50) / 100; // -0.5 to 0.5
  const ly = (light.y - 50) / 100; // -0.5 to 0.5

  // Glow color configurations based on CompanionState and Expressions
  const getGlowColor = () => {
    switch (state) {
      case "listening":
        return "#818cf8"; // indigo-400
      case "thinking":
        return "#fbbf24"; // amber-400 (scanning)
      case "responding":
        return "#10b981"; // emerald-500
      default:
        // Adjust standard color depending on expression
        if (expression === "excited") return "#f43f5e"; // rose-500
        if (expression === "happy") return "#06b6d4"; // cyan-500
        if (expression === "thoughtful") return "#10b981"; // purple
        return "#06b6d4"; // standard cyan
    }
  };

  const glowColor = getGlowColor();

  // Draw expressive eyes paths/tags
  const renderEyes = (isLeft: boolean) => {
    const eyeCenterOffset = isLeft ? -30 : 30;
    
    // Core center of head visor is 160, 145
    const centerX = 160;
    const centerY = 145;

    // Smooth cursor look translation inside the visor bounds (max 10px horizontal, 6px vertical bounds)
    const eyeX = centerX + eyeCenterOffset + look.x * 12;
    const eyeY = centerY + look.y * 8;

    // Is eye blinking right now? If yes, squish the scale to nearly 0
    if (isBlinking) {
      return (
        <rect
          x={eyeX - 12}
          y={eyeY - 1}
          width={24}
          height={2}
          fill={glowColor}
          opacity={0.9}
          rx={1}
          className="transition-all duration-75"
        />
      );
    }

    // Thinking state features structured scanning orbits
    if (state === "thinking") {
      return (
        <g transform={`translate(${eyeX}, ${eyeY})`}>
          {/* Scanning circular frame */}
          <circle cx={0} cy={0} r={10} fill="none" stroke={glowColor} strokeWidth={2} opacity={0.6} />
          {/* Internal glowing horizontal line */}
          <line
            x1={-12}
            y1={Math.sin(bobTime * 5) * 8}
            x2={12}
            y2={Math.sin(bobTime * 5) * 8}
            stroke={glowColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Specialized Expression Geometry
    switch (expression) {
      case "happy":
        // Arch shape (smiling crecent curves)
        return (
          <path
            d={`M ${eyeX - 14} ${eyeY + 4} Q ${eyeX} ${eyeY - 10} ${eyeX + 14} ${eyeY + 4}`}
            fill="none"
            stroke={glowColor}
            strokeWidth={5}
            strokeLinecap="round"
            filter="url(#glow-filter)"
          />
        );
      
      case "excited":
        // Angular cheerful arrows / stars
        return (
          <g transform={`translate(${eyeX}, ${eyeY})`}>
            {/* Triangular open arrows */}
            <path
              d="M -12 4 L 0 -8 L 12 4"
              fill="none"
              stroke={glowColor}
              strokeWidth={5.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow-filter)"
            />
          </g>
        );

      case "thoughtful":
        // Slightly tilted narrowed down rectangles
        return (
          <g transform={`translate(${eyeX}, ${eyeY}) rotate(${isLeft ? 8 : -8})`}>
            <rect
              x={-13}
              y={-4}
              width={26}
              height={8}
              rx={4}
              fill={glowColor}
              filter="url(#glow-filter)"
            />
          </g>
        );

      case "surprised":
        // Giant wide circular hollow rims with centering dot LEDs
        return (
          <g transform={`translate(${eyeX}, ${eyeY})`}>
            <circle
              cx={0}
              cy={0}
              r={12}
              fill="none"
              stroke={glowColor}
              strokeWidth={4.5}
              filter="url(#glow-filter)"
            />
            <circle cx={0} cy={0} r={3} fill={glowColor} />
          </g>
        );

      case "gentle":
        // Peaceful relaxed curve tilting downward slightly, sleepy/happy warmth
        return (
          <path
            d={`M ${eyeX - 13} ${eyeY - 3} Q ${eyeX} ${eyeY + 8} ${eyeX + 13} ${eyeY - 3}`}
            fill="none"
            stroke={glowColor}
            strokeWidth={4.5}
            strokeLinecap="round"
            filter="url(#glow-filter)"
          />
        );

      case "neutral":
      default:
        // Sleek horizontal oval capsule LEDs
        return (
          <rect
            x={eyeX - 12}
            y={eyeY - 6}
            width={24}
            height={12}
            rx={6}
            fill={glowColor}
            filter="url(#glow-filter)"
          />
        );
    }
  };

  // State-based head tilt calculations (slight tilts based on cursor coordinates + dynamic pose state)
  let headTiltX = look.y * 7;
  let headTiltY = look.x * 12; // yaw rotation
  let headTiltZ = look.x * 4;  // roll angle

  if (state === "thinking") {
    // Elegant tilted pose when processing
    headTiltZ += 5;
    headTiltY += Math.sin(bobTime * 2) * 2; // subtle scanning rotation
  } else if (state === "responding") {
    // Temporary vertical nod motion cycle
    headTiltX += Math.abs(Math.sin(bobTime * 6)) * -8;
  }

  // Torso tilts slightly opposite for high tech weight balance counter-stabilization
  const torsoRotateZ = -look.x * 3;
  const torsoTranslateX = -look.x * 5;

  return (
    <div
      ref={containerRef}
      id="companion-container"
      className="relative flex items-center justify-center select-none cursor-default transition-transform duration-500 ease-out"
      style={{
        transform: `scale(${scaleChange})`,
        width: "100%",
        maxWidth: "360px",
        height: "440px",
      }}
    >
      {/* Immersive shadows dropping on the dock backdrop */}
      <div 
        id="star-drop-shadow"
        className="absolute bottom-6 w-32 h-5 bg-black/15 blur-xl rounded-full transition-all duration-300 transform"
        style={{
          transform: `scale(${1 - hoverY / 45}) translateX(${look.x * -8}px)`,
          opacity: 0.85 - hoverY / 80,
        }}
      />

      {/* Floating particles during thinking state */}
      {state === "thinking" && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 4 }).map((_, i) => {
            const angle = (i * 90 + (bobTime * 30)) % 360;
            const r = 110 + Math.sin(bobTime * 2 + i) * 15;
            const px = Math.cos((angle * Math.PI) / 180) * r;
            const py = Math.sin((angle * Math.PI) / 180) * r - 40;
            return (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full blur-[1px] transition-all duration-100 ease-linear"
                style={{
                  backgroundColor: glowColor,
                  left: `calc(50% + ${px}px - 4px)`,
                  top: `calc(50% + ${py}px - 4px)`,
                  opacity: 0.6 + Math.sin(bobTime * 3 + i) * 0.4,
                  transform: `scale(${0.6 + Math.sin(bobTime * 4 + i) * 0.4})`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Main SVG Vector Model */}
      <svg
        id="star-vector"
        viewBox="0 0 320 400"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* LED Glow Filters */}
          <filter id="glow-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComponentTransfer in="blur" result="brightBlur">
              <feFuncA type="linear" slope="2.5" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="brightBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Subtly offset radial lighting layers for high-end plastic/ceramic shadows */}
          <radialGradient id="ceramic-highlight" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.85} />
            <stop offset="50%" stopColor="#f3f4f6" />
            <stop offset="100%" stopColor="#d1d5db" />
          </radialGradient>

          <linearGradient id="brushed-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3f4f6" />
            <stop offset="25%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="75%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          <linearGradient id="dark-visor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Core ring color gradient */}
          <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glowColor} stopOpacity={0.8} />
            <stop offset="70%" stopColor={glowColor} stopOpacity={0.2} />
            <stop offset="100%" stopColor={glowColor} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* ================= BACKGROUND THRUSTER EMISSION ================= */}
        <g id="base-stabilizer-flame" style={{ transform: `translateY(${hoverY}px)` }} className="transition-all duration-300">
          <ellipse
            cx="160"
            cy="335"
            rx={20 + Math.sin(bobTime * 10) * 3}
            ry={12 + Math.abs(Math.sin(bobTime * 5)) * 12}
            fill="none"
            stroke={glowColor}
            strokeWidth="3"
            opacity={0.35 + (state === "thinking" ? 0.3 : 0)}
            filter="url(#glow-filter)"
          />
          <circle
            cx="160"
            cy="338"
            r={5 + Math.sin(bobTime * 15) * 1.5}
            fill={glowColor}
            opacity={0.7}
            filter="url(#glow-filter)"
          />
        </g>

        {/* ================= TORSO / CHASSIS CONTAINER ================= */}
        <g
          id="torso-group"
          style={{
            transform: `translate3d(${torsoTranslateX}px, ${hoverY}px, 0px) rotate(${torsoRotateZ}deg)`,
            transformOrigin: "160px 280px",
          }}
          className="transition-transform duration-200 ease-out"
        >
          {/* Main Torso Shield - Premium white ceramic base */}
          <path
            d="M 115 250 C 105 285, 115 320, 160 330 C 205 320, 215 285, 205 250 Z"
            fill="url(#ceramic-highlight)"
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Dynamic Torso Shadow - travel opposite to the light coordinates */}
          <path
            d="M 115 250 C 105 285, 115 320, 160 330 C 205 320, 215 285, 205 250 Z"
            fill="#000000"
            opacity={Math.max(0.05, 0.25 - light.intensity * 0.1)}
            style={{
              transform: `translate(${lx * -16}px, ${ly * -12}px) scale(0.96)`,
              transformOrigin: "160px 290px",
            }}
          />

          {/* Dynamic Torso Lighting Highlight - travels matching the light source */}
          <path
            d="M 115 250 C 105 285, 115 320, 160 330 C 205 320, 215 285, 205 250 Z"
            fill="#ffffff"
            opacity={Math.min(0.45, 0.2 + lx * 0.1 + light.intensity * 0.15)}
            style={{
              transform: `translate(${lx * 14}px, ${ly * 10}px) scale(0.93)`,
              transformOrigin: "160px 290px",
            }}
          />

          {/* Torso Center Panel Lines */}
          <path
            d="M 160 250 L 160 328"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Shoulder/joint mounts (brushed dark gray metal sockets) */}
          <rect x="94" y="246" width="12" height="24" rx="5" fill="#4b5563" />
          <rect x="214" y="246" width="12" height="24" rx="5" fill="#4b5563" />

          {/* Floating stabilized thruster ring socket */}
          <path
            d="M 144 322 L 176 322 L 168 335 L 152 335 Z"
            fill="#374151"
            stroke="#4b5563"
            strokeWidth="1"
          />

          {/* Star Core Ring - elegant reactor orb embodying operational state */}
          <g
            className="cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
            style={{ transformOrigin: "160px 285px" }}
            onClick={() => onTapPart?.("chest")}
            title="Click to engage Star Core"
          >
            <circle cx="160" cy="285" r="22" fill="url(#core-glow)" />
            <circle
              cx="160"
              cy="285"
              r="11"
              fill="none"
              stroke={glowColor}
              strokeWidth="3.5"
              opacity={0.8}
              filter="url(#glow-filter)"
              style={{
                // Ring pulse animation relative to states
                animation: `${state === "thinking" ? "spin 3s linear infinite" : "none"}`,
                transformOrigin: "160px 285px",
              }}
            />
            {/* Internal core micro-dot */}
            <circle cx="160" cy="285" r="4" fill="#ffffff" />
          </g>
        </g>

        {/* ================= FLOATING HEAD GROUP ================= */}
        <g
          id="head-group"
          style={{
            transform: `translate3d(${look.x * 12}px, ${hoverY + headHoverY}px, 0px) rotateX(${headTiltX}deg) rotateY(${headTiltY}deg) rotateZ(${headTiltZ}deg)`,
            transformOrigin: "160px 145px",
          }}
          className="transition-transform duration-100 ease-out"
        >
          {/* 1. Antenna stalk & glowing tip with interactive touch sensors */}
          <g
            id="antenna-touch-zone"
            className="cursor-pointer group/antenna"
            onClick={() => onTapPart?.("antenna")}
            title="Click to signal Antenna Cores"
          >
            <line x1="160" y1="80" x2="160" y2="40" stroke="url(#brushed-metal)" strokeWidth="5.5" strokeLinecap="round" className="group-hover/antenna:stroke-blue-400 transition-colors" />
            {/* Subtle antenna segments */}
            <circle cx="160" cy="55" r="5" fill="#6b7280" />
            
            {/* Glowing Antenna Sphere, changes frequency of animation based on thinking state */}
            <g transform="translate(160, 36)" className="group-hover/antenna:scale-125 transition-transform origin-center">
              <circle
                cx="0"
                cy="0"
                r="8"
                fill={glowColor}
                opacity={0.8}
                filter="url(#glow-filter)"
                className={`${state === "thinking" ? "animate-pulse" : "animate-antenna-glow"}`}
                style={{
                  animationDuration: state === "thinking" ? "0.6s" : "2s",
                  // Provide css variables for keyframe pulsing
                  ["--glow-color" as any]: glowColor,
                  ["--min-glow" as any]: state === "listening" ? "0.6" : "0.3",
                }}
              />
              {/* White core inside the antenna bulb */}
              <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
            </g>
          </g>

          {/* 2. Side audio/sensor pads - premium mechanical cyber ears */}
          <g className="cursor-pointer group/ears" onClick={() => onTapPart?.("ears")} title="Click to ping sensory audio pads">
            <rect x="74" y="125" width="8" height="38" rx="4" fill="#6b7280" className="group-hover/ears:fill-blue-400 transition-colors" />
            <rect x="238" y="125" width="8" height="38" rx="4" fill="#6b7280" className="group-hover/ears:fill-blue-400 transition-colors" />

            <circle cx="77" cy="144" r="3" fill={glowColor} opacity={0.65} filter="url(#glow-filter)" />
            <circle cx="243" cy="144" r="3" fill={glowColor} opacity={0.65} filter="url(#glow-filter)" />
          </g>

          {/* Head & visor interactive container structure */}
          <g
            id="visor-touch-zone"
            className="cursor-pointer group/visor"
            onClick={() => onTapPart?.("head")}
            title="Click to engage Star visor"
          >
            {/* 3. Main Head Globe - Rounded matte ceramic visor frame */}
            <rect
              x="80"
              y="90"
              width="160"
              height="110"
              rx="54"
              fill="url(#ceramic-highlight)"
              stroke="#e5e7eb"
              strokeWidth="1.5"
            />

            {/* 4. Head travel shadow overlay mapping the light source (shades opposite) */}
            <rect
              x="80"
              y="90"
              width="160"
              height="110"
              rx="54"
              fill="#000000"
              opacity={Math.max(0.04, 0.18 - light.intensity * 0.05)}
              style={{
                transform: `translate(${lx * -18}px, ${ly * -12}px) scale(0.98)`,
                transformOrigin: "160px 145px",
              }}
            />

            {/* 5. Head travel highlight matching light coordinates */}
            <rect
              x="80"
              y="90"
              width="160"
              height="110"
              rx="54"
              fill="#ffffff"
              opacity={Math.min(0.5, 0.15 + lx * 0.12 + light.intensity * 0.2)}
              style={{
                transform: `translate(${lx * 15}px, ${ly * 10}px) scale(0.96)`,
                transformOrigin: "160px 145px",
              }}
            />

            {/* 6. High-end dark glass visor shield */}
            <rect
              x="94"
              y="110"
              width="132"
              height="70"
              rx="35"
              fill="url(#ceramic-highlight)"
              style={{ filter: "brightness(0.12)" }}
              className="group-hover/visor:stroke-blue-500/25 group-hover/visor:stroke-[1.5px] transition-all"
            />

            {/* 7. Eyes LEDs (Rendering left and right) */}
            <g id="eyes-led-container" className="group-hover/visor:scale-105 transition-transform" style={{ transformOrigin: "160px 145px" }}>
              {/* Center clipping group relative to visor coordinates */}
              {renderEyes(true)}
              {renderEyes(false)}
            </g>
          </g>

          {/* 8. Visor Dynamic Gloss Reflection curves (Static crescent highlight + dynamic travel highlight) */}
          {/* Static premium curved glass reflection reflection */}
          <path
            d="M 103 118 Q 160 102 217 118"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity={0.16}
            strokeLinecap="round"
          />

          {/* Draggable light source projection: traveling light glides across glass glass */}
          <ellipse
            cx={160 + lx * 45}
            cy={132 + ly * 20}
            rx={20 + light.intensity * 10}
            ry={10 + light.intensity * 5}
            fill="#ffffff"
            opacity={Math.min(0.24, 0.08 + light.intensity * 0.1)}
            style={{ filter: "blur(4px)" }}
          />
        </g>

        {/* Neck connector joint */}
        <g id="neck-link" style={{ transform: `translateY(${hoverY}px)` }} className="transition-all duration-300">
          <rect x="146" y="214" width="28" height="24" rx="4" fill="#374151" stroke="#4b5563" strokeWidth="1" />
          <ellipse cx="160" cy="216" rx="14" ry="4" fill="#1f2937" />
        </g>
      </svg>
    </div>
  );
};
