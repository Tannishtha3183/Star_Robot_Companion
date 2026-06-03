import { playChocClick, playChirp, playCorePulse, playCompBubble, toggleMute, getMuteState } from "./audio.js";

// Global Application State
let state = "idle"; // idle, thinking, listening, responding
let expression = "neutral"; // neutral, happy, excited, thoughtful, surprised, gentle
let theme = "dark"; // dark, light
let sessions = [];
let currentSessionId = "session-default";
let showSessions = true;

// SVG Animation and Eye Tracking Coordinates
const targetLook = { x: 0, y: 0 };
const currentLook = { x: 0, y: 0 };
let bobTime = 0;
let isBlinking = false;

// Periodic Blink Timer logic
function initBlinkTimer() {
  const triggerBlink = () => {
    isBlinking = true;
    
    // Short blink duration (120ms)
    setTimeout(() => {
      isBlinking = false;
    }, 120);

    // Schedule next random blink interval between 3 to 7 seconds
    const nextTime = 3000 + Math.random() * 4000;
    setTimeout(triggerBlink, nextTime);
  };

  setTimeout(triggerBlink, 4000);
}

// Cursor coordinates listener
function initCursorTracker() {
  const container = document.getElementById("companion-container");
  
  window.addEventListener("mousemove", (e) => {
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;

    const maxDistance = 400;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const strength = Math.min(distance / maxDistance, 1.0);

    // Normalized coordinates (-1 to 1) weighted by cursor distance
    targetLook.x = Math.cos(angle) * strength;
    targetLook.y = Math.sin(angle) * strength;
  });

  document.addEventListener("mouseleave", () => {
    // Slowly return to center when mouse leaves document window
    targetLook.x = 0;
    targetLook.y = 0;
  });
}

// Animation loops using requestAnimationFrame (interpolating float and looks)
function startAnimationLoop() {
  let lastTime = performance.now();

  const animate = (time) => {
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    // Linear look interpolation (factor 0.08)
    const interpolationFactor = 0.08;
    currentLook.x += (targetLook.x - currentLook.x) * interpolationFactor;
    currentLook.y += (targetLook.y - currentLook.y) * interpolationFactor;

    bobTime = time * 0.002;

    updateCompanionModelTransformations();

    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
}

// Dynamic glow colors based on current companion state and mood
function getGlowColor() {
  if (state === "listening") return "#818cf8"; // indigo
  if (state === "thinking") return "#fbbf24"; // amber
  if (state === "responding") return "#10b981"; // emerald
  
  if (expression === "excited") return "#f43f5e"; // rose
  if (expression === "happy") return "#06b6d4"; // cyan
  if (expression === "thoughtful") return "#8b5cf6"; // purple
  
  return "#06b6d4"; // default cyan
}

// Apply SVG node matrices, rotations and translations
function updateCompanionModelTransformations() {
  const glowColor = getGlowColor();
  const starVector = document.getElementById("star-vector");
  if (starVector) {
    starVector.style.setProperty("--glow-color", glowColor);
  }

  // Float calculations
  const bobFactor = state === "thinking" ? 3 : state === "listening" ? 4 : 7;
  const bobSpeed = state === "thinking" ? 0.8 : 1.2;
  const hoverY = Math.sin(bobTime * bobSpeed) * bobFactor;
  const headHoverY = Math.sin(bobTime * bobSpeed - 0.5) * (bobFactor * 0.4);

  // Apply thruster plume scale shifts
  const flameEllipse = document.getElementById("base-flame-ellipse");
  const flameCircle = document.getElementById("base-flame-circle");
  if (flameEllipse && flameCircle) {
    const rx = 20 + Math.sin(bobTime * 10) * 3;
    const ry = 12 + Math.abs(Math.sin(bobTime * 5)) * 12;
    flameEllipse.setAttribute("rx", rx);
    flameEllipse.setAttribute("ry", ry);
    flameEllipse.setAttribute("opacity", 0.35 + (state === "thinking" ? 0.3 : 0));
    
    flameCircle.setAttribute("r", 5 + Math.sin(bobTime * 15) * 1.5);
  }

  // Apply Torso transformations
  const torsoGroup = document.getElementById("torso-group");
  const torsoShadow = document.getElementById("torso-shadow");
  const torsoHighlight = document.getElementById("torso-highlight");
  if (torsoGroup) {
    const torsoRotateZ = -currentLook.x * 3;
    const torsoTranslateX = -currentLook.x * 5;
    torsoGroup.style.transform = `translate3d(${torsoTranslateX}px, ${hoverY}px, 0px) rotate(${torsoRotateZ}deg)`;
    torsoGroup.style.transformOrigin = "160px 280px";

    // Lighting angles shifting
    const lx = currentLook.x * 0.25;
    const ly = currentLook.y * 0.25;
    if (torsoShadow) {
      torsoShadow.style.transform = `translate(${lx * -16}px, ${ly * -12}px) scale(0.96)`;
      torsoShadow.style.transformOrigin = "160px 290px";
    }
    if (torsoHighlight) {
      torsoHighlight.style.transform = `translate(${lx * 14}px, ${ly * 10}px) scale(0.93)`;
      torsoHighlight.style.transformOrigin = "160px 290px";
    }
  }

  // Apply Head transformations
  const headGroup = document.getElementById("head-group");
  const headShadow = document.getElementById("head-shadow");
  const headHighlight = document.getElementById("head-highlight");
  const glassGlow = document.getElementById("visor-glass-glow");
  if (headGroup) {
    let headTiltX = currentLook.y * 7;
    let headTiltY = currentLook.x * 12; // yaw
    let headTiltZ = currentLook.x * 4;  // roll
    
    if (state === "thinking") {
      headTiltZ += 5;
      headTiltY += Math.sin(bobTime * 2) * 2;
    } else if (state === "responding") {
      headTiltX += Math.abs(Math.sin(bobTime * 6)) * -8;
    }

    headGroup.style.transform = `translate3d(${currentLook.x * 12}px, ${hoverY + headHoverY}px, 0px) rotateX(${headTiltX}deg) rotateY(${headTiltY}deg) rotateZ(${headTiltZ}deg)`;
    headGroup.style.transformOrigin = "160px 145px";

    // Visor shadows shifts
    const lx = currentLook.x * 0.25;
    const ly = currentLook.y * 0.25;
    if (headShadow) {
      headShadow.style.transform = `translate(${lx * -18}px, ${ly * -12}px) scale(0.98)`;
      headShadow.style.transformOrigin = "160px 145px";
    }
    if (headHighlight) {
      headHighlight.style.transform = `translate(${lx * 15}px, ${ly * 10}px) scale(0.96)`;
      headHighlight.style.transformOrigin = "160px 145px";
    }
    if (glassGlow) {
      glassGlow.setAttribute("cx", 160 + lx * 45);
      glassGlow.setAttribute("cy", 132 + ly * 20);
    }
  }

  // Neck Link joint transformations
  const neckLink = document.getElementById("neck-link");
  if (neckLink) {
    neckLink.style.transform = `translateY(${hoverY}px)`;
  }

  // Reactor core pulsing ring spin
  const coreRing = document.getElementById("torso-core-ring");
  if (coreRing) {
    if (state === "thinking") {
      coreRing.style.transform = `rotate(${(performance.now() * 0.15) % 360}deg)`;
      coreRing.style.transformOrigin = "160px 285px";
    } else {
      coreRing.style.transform = "none";
    }
  }

  // Redraw Visor eyes matching coordinates
  updateVisorEyes(currentLook.x, currentLook.y, isBlinking, state, expression, glowColor);

  // Redraw floating thinking particles
  updateParticles(state, bobTime, glowColor);

  // Update scale factor if listening
  const companionContainer = document.getElementById("companion-container");
  if (companionContainer) {
    const scale = state === "listening" ? 1.02 : 1.0;
    companionContainer.style.transform = `scale(${scale})`;
  }
}

// Render eyes shapes inside visor glass
function updateVisorEyes(lookX, lookY, isBlinking, state, expression, glowColor) {
  const renderEye = (isLeft) => {
    const eyeCenterOffset = isLeft ? -30 : 30;
    const centerX = 160;
    const centerY = 145;
    
    const eyeX = centerX + eyeCenterOffset + lookX * 12;
    const eyeY = centerY + lookY * 8;

    if (isBlinking) {
      return `<rect x="${eyeX - 12}" y="${eyeY - 1}" width="24" height="2" fill="${glowColor}" opacity="0.9" rx="1" />`;
    }

    if (state === "thinking") {
      const orbitY = Math.sin(bobTime * 5) * 8;
      return `<g transform="translate(${eyeX}, ${eyeY})">
        <circle cx="0" cy="0" r="10" fill="none" stroke="${glowColor}" stroke-width="2" opacity="0.6" />
        <line x1="-12" y1="${orbitY}" x2="12" y2="${orbitY}" stroke="${glowColor}" stroke-width="2.5" stroke-linecap="round" />
      </g>`;
    }

    switch (expression) {
      case "happy":
        return `<path d="M ${eyeX - 14} ${eyeY + 4} Q ${eyeX} ${eyeY - 10} ${eyeX + 14} ${eyeY + 4}" fill="none" stroke="${glowColor}" stroke-width="5" stroke-linecap="round" filter="url(#glow-filter)" />`;
      case "excited":
        return `<g transform="translate(${eyeX}, ${eyeY})">
          <path d="M -12 4 L 0 -8 L 12 4" fill="none" stroke="${glowColor}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-filter)" />
        </g>`;
      case "thoughtful":
        const rotation = isLeft ? 8 : -8;
        return `<g transform="translate(${eyeX}, ${eyeY}) rotate(${rotation})">
          <rect x="-13" y="-4" width="26" height="8" rx="4" fill="${glowColor}" filter="url(#glow-filter)" />
        </g>`;
      case "surprised":
        return `<g transform="translate(${eyeX}, ${eyeY})">
          <circle cx="0" cy="0" r="12" fill="none" stroke="${glowColor}" stroke-width="4.5" filter="url(#glow-filter)" />
          <circle cx="0" cy="0" r="3" fill="${glowColor}" />
        </g>`;
      case "gentle":
        return `<path d="M ${eyeX - 13} ${eyeY - 3} Q ${eyeX} ${eyeY + 8} ${eyeX + 13} ${eyeY - 3}" fill="none" stroke="${glowColor}" stroke-width="4.5" stroke-linecap="round" filter="url(#glow-filter)" />`;
      case "neutral":
      default:
        return `<rect x="${eyeX - 12}" y="${eyeY - 6}" width="24" height="12" rx="6" fill="${glowColor}" filter="url(#glow-filter)" />`;
    }
  };

  const eyesContainer = document.getElementById("eyes-led-container");
  if (eyesContainer) {
    eyesContainer.innerHTML = renderEye(true) + renderEye(false);
  }
}

// Particle generator (orbiting orbits during compiling coordinates)
function updateParticles(state, bobTime, glowColor) {
  const container = document.getElementById("companion-container");
  if (!container) return;

  let particles = container.querySelectorAll(".particle");
  if (particles.length === 0 && state === "thinking") {
    for (let i = 0; i < 4; i++) {
      const p = document.createElement("div");
      p.className = "particle";
      container.appendChild(p);
    }
    particles = container.querySelectorAll(".particle");
  }

  particles.forEach((p, i) => {
    if (state === "thinking") {
      const angle = (i * 90 + (bobTime * 30)) % 360;
      const r = 110 + Math.sin(bobTime * 2 + i) * 15;
      const px = Math.cos((angle * Math.PI) / 180) * r;
      const py = Math.sin((angle * Math.PI) / 180) * r - 40;
      
      p.style.backgroundColor = glowColor;
      p.style.left = `calc(50% + ${px}px - 4px)`;
      p.style.top = `calc(50% + ${py}px - 4px)`;
      p.style.opacity = 0.6 + Math.sin(bobTime * 3 + i) * 0.4;
      p.style.transform = `scale(${0.6 + Math.sin(bobTime * 4 + i) * 0.4})`;
      p.style.display = "block";
    } else {
      p.style.display = "none";
    }
  });
}

// Tap click feedback speech triggers
function initRobotPartTaps() {
  const clickParts = [
    { id: "antenna-touch-zone", part: "antenna" },
    { id: "chest-touch-zone", part: "chest" },
    { id: "ears-touch-zone", part: "ears" },
    { id: "visor-touch-zone", part: "head" }
  ];

  clickParts.forEach(({ id, part }) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      handleRobotTap(part);
    });
  });
}

function handleRobotTap(part) {
  if (state === "thinking") return;

  let randomTexts = [];
  let stateChange = "responding";
  let exprChange = "neutral";

  if (part === "antenna") {
    playChirp();
    exprChange = "excited";
    randomTexts = [
      "Antenna core query matched! Beam signals synchronized with orbital satellites.",
      "That tickles! Re-aligning my long-range transceivers on deep frequency bands.",
      "Wireless telemetry request acknowledged! Current atmospheric status is supreme."
    ];
  } else if (part === "chest") {
    playCorePulse();
    exprChange = "happy";
    randomTexts = [
      "Primary Fusion Core energized! Fusion cells operating at 100% capacity.",
      "A warm wave of kinetic voltage ripples through my mechanical actuators! Thank you.",
      "Accessing central processor registers. Direct cardiac resonance is calibrated!"
    ];
  } else if (part === "ears") {
    playCompBubble();
    exprChange = "thoughtful";
    randomTexts = [
      "Sensory pads pinged! Microphones calibrated. I'm listening to your keystrokes.",
      "Bilateral communication channels configured. Ready for verbal parameters.",
      "Acoustic frequency levels balanced! Sonic arrays operating at peak sensitivity."
    ];
  } else if (part === "head") {
    playChocClick();
    exprChange = "gentle";
    randomTexts = [
      "Star gaze activated! Initiating real-time optical feed processing.",
      "Visor shield integrity verified. Scanning grid coordinates at high resolution.",
      "Optic sensor tracking recalibrated. I see you looking at my mechanical visor frame!"
    ];
  }

  const matchedText = randomTexts[Math.floor(Math.random() * randomTexts.length)];
  
  // Set physical expressions
  state = stateChange;
  expression = exprChange;
  
  updateCompanionStatusIndicators();

  const companionMsg = {
    id: `msg-star-${Date.now()}-${Math.random()}`,
    sender: "star",
    text: matchedText,
    expression: exprChange,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };

  setTimeout(() => {
    addMessageToCurrentSession(companionMsg);
    state = "idle";
    updateCompanionStatusIndicators();
  }, 450);
}

// Add message logs to active array and persist
function addMessageToCurrentSession(msg) {
  sessions = sessions.map((s) => {
    if (s.id === currentSessionId) {
      let updatedTitle = s.title;
      // Change title of session if first user prompt
      if (s.messages.length <= 1 && msg.sender === "user") {
        updatedTitle = msg.text.length > 30 ? msg.text.slice(0, 28) + "..." : msg.text;
      }
      return {
        ...s,
        title: updatedTitle,
        messages: [...s.messages, msg]
      };
    }
    return s;
  });

  saveSessionsToStorage();
  renderChatView();
  renderSessionsSidebar();
}

// Generate fresh session logs
function createNewChatSession() {
  const newId = `session-${Date.now()}`;
  const newSession = {
    id: newId,
    title: `Session #${sessions.length + 1}`,
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: `init-${Date.now()}`,
        sender: "star",
        text: "My neural registers have been cleared! Let's start a fresh discussion.",
        expression: "excited",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ]
  };

  sessions.unshift(newSession);
  currentSessionId = newId;
  state = "idle";
  expression = "neutral";

  saveSessionsToStorage();
  renderChatView();
  renderSessionsSidebar();
  updateCompanionStatusIndicators();
}

function deleteChatSession(sessionId) {
  sessions = sessions.filter((s) => s.id !== sessionId);

  if (sessions.length === 0) {
    // Reset to fallback standard logs
    sessions = [getDefaultSession()];
    currentSessionId = "session-default";
  } else if (currentSessionId === sessionId) {
    currentSessionId = sessions[0].id;
  }

  state = "idle";
  expression = "neutral";

  saveSessionsToStorage();
  renderChatView();
  renderSessionsSidebar();
  updateCompanionStatusIndicators();
}

function clearAllHistory() {
  localStorage.removeItem("star_chat_sessions_v2");
  localStorage.removeItem("star_chat_current_session_id_v2");

  sessions = [getDefaultSession()];
  currentSessionId = "session-default";
  state = "idle";
  expression = "neutral";

  saveSessionsToStorage();
  renderChatView();
  renderSessionsSidebar();
  updateCompanionStatusIndicators();
}

// Fetch default starter session payload
function getDefaultSession() {
  return {
    id: "session-default",
    title: "Standard Gold & Global Markets",
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: "init",
        sender: "star",
        text: "Greetings! I am Star, your responsive AI companion.\n\nMy custom chassis is rendered in real-time with vector layers which respond directly to your actions. For instance, notice how my LED eyes track your cursor! Chat with me on the right to trigger intelligent responses, physical expressions, and mechanical core changes.",
        expression: "happy",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }
    ]
  };
}

// Local storage controls
function loadSessionsFromStorage() {
  try {
    const saved = localStorage.getItem("star_chat_sessions_v2");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sessions = parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load sessions from storage", e);
  }

  if (sessions.length === 0) {
    sessions = [getDefaultSession()];
  }

  try {
    const savedId = localStorage.getItem("star_chat_current_session_id_v2");
    if (savedId && sessions.some(s => s.id === savedId)) {
      currentSessionId = savedId;
    } else {
      currentSessionId = sessions[0].id;
    }
  } catch (e) {
    currentSessionId = sessions[0].id;
  }

  // Load theme & mute settings
  try {
    const savedTheme = localStorage.getItem("star_theme");
    if (savedTheme === "light") {
      theme = "light";
    }
  } catch (e) {}

  applyTheme(theme);
}

function saveSessionsToStorage() {
  try {
    localStorage.setItem("star_chat_sessions_v2", JSON.stringify(sessions));
    localStorage.setItem("star_chat_current_session_id_v2", currentSessionId);
  } catch (e) {
    console.error("Failed to save sessions to storage", e);
  }
}

// Theme toggles
function applyTheme(targetTheme) {
  theme = targetTheme;
  const body = document.body;
  const isDark = theme === "dark";

  body.className = isDark ? "theme-dark" : "theme-light";
  
  // Update button content
  const themeBtn = document.getElementById("btn-toggle-theme");
  if (themeBtn) {
    themeBtn.innerHTML = isDark 
      ? `<i data-lucide="moon"></i><span>Dark</span>` 
      : `<i data-lucide="sun"></i><span>Light</span>`;
  }

  // Update stamp texts and footer tags
  const pedestalStamp = document.getElementById("pedestal-stamp-text");
  const footerEd = document.getElementById("footer-edition");
  const footerCal = document.getElementById("footer-calibration");
  
  if (pedestalStamp) pedestalStamp.innerText = isDark ? "Meadow Edition" : "Sunset Edition";
  if (footerEd) footerEd.innerText = isDark ? "Moonlit Meadow" : "Sunset Edition";
  if (footerCal) footerCal.innerText = isDark ? "Calibrated with Moonlit Meadow" : "Calibrated with Sunset Mountains";
  
  localStorage.setItem("star_theme", theme);
  refreshIcons();
}

// Markdown Parser Logic
function parseInlineStyles(content, isDark) {
  let stateStr = content;
  let html = "";
  
  while (stateStr.length > 0) {
    // Bold **text**
    const boldMatch = stateStr.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      html += `<strong class="${isDark ? 'text-white' : 'text-slate-900'}">${boldMatch[1]}</strong>`;
      stateStr = stateStr.slice(boldMatch[0].length);
      continue;
    }

    // Italics *text*
    const italicMatch = stateStr.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      html += `<em class="italic text-inherit">${italicMatch[1]}</em>`;
      stateStr = stateStr.slice(italicMatch[0].length);
      continue;
    }

    // Inline code `code`
    const inlineCodeMatch = stateStr.match(/^`([^`]+)`/);
    if (inlineCodeMatch) {
      html += `<code class="px-1.5 py-0.5 rounded text-[11px] font-mono whitespace-nowrap ${
        isDark ? 'bg-black/20 border border-white/5 text-[#EEE8D1]' : 'bg-slate-100 border border-slate-200 text-slate-800'
      }">${inlineCodeMatch[1]}</code>`;
      stateStr = stateStr.slice(inlineCodeMatch[0].length);
      continue;
    }

    // Plain character (escape HTML characters)
    const char = stateStr[0];
    if (char === '<') html += '&lt;';
    else if (char === '>') html += '&gt;';
    else if (char === '&') html += '&amp;';
    else html += char;
    
    stateStr = stateStr.slice(1);
  }
  return html;
}

function findTableBlocks(lines) {
  const blocks = [];
  const n = lines.length;
  let i = 0;

  while (i < n) {
    const line = lines[i].trim();
    if (line.startsWith("|") && line.endsWith("|") && i + 1 < n) {
      const nextLine = lines[i + 1].trim();
      const body = nextLine.startsWith("|") && nextLine.endsWith("|") ? nextLine.slice(1, -1) : "";
      const isSeparator = body && /^[:\-\s|]+$/.test(body) && body.includes("-");

      if (isSeparator) {
        const startIndex = i;
        const splitRow = (rowText) => {
          let cells = rowText.trim().split("|");
          if (rowText.trim().startsWith("|")) cells.shift();
          if (rowText.trim().endsWith("|")) cells.pop();
          return cells.map(c => c.trim());
        };

        const headers = splitRow(line);
        const rows = [];

        let r = i + 2;
        while (r < n) {
          const rowLine = lines[r].trim();
          if (rowLine.startsWith("|") && rowLine.endsWith("|")) {
            rows.push(splitRow(rowLine));
            r++;
          } else {
            break;
          }
        }

        blocks.push({
          startIndex,
          endIndex: r - 1,
          headers,
          rows
        });

        i = r;
        continue;
      }
    }
    i++;
  }
  return blocks;
}

function parseMarkdown(text, isDark) {
  if (!text) return "";
  const lines = text.split("\n");
  const tableBlocks = findTableBlocks(lines);
  
  let html = `<div class="markdown-container">`;
  let idx = 0;
  
  let currentList = null; 
  let inCodeBlock = false;
  let codeLines = [];
  
  const flushList = () => {
    if (currentList) {
      if (currentList.type === "bullet") {
        html += `<ul class="list-none my-3 pl-1 space-y-1.5">`;
        currentList.items.forEach(item => {
          html += `<li><span class="flex-1">${parseInlineStyles(item, isDark)}</span></li>`;
        });
        html += `</ul>`;
      } else {
        html += `<ol class="list-decimal my-3 pl-6 space-y-1.5 text-xs">`;
        currentList.items.forEach(item => {
          html += `<li>${parseInlineStyles(item, isDark)}</li>`;
        });
        html += `</ol>`;
      }
      currentList = null;
    }
  };
  
  while (idx < lines.length) {
    const tableBlock = tableBlocks.find(b => idx >= b.startIndex && idx <= b.endIndex);
    if (tableBlock) {
      flushList();
      if (inCodeBlock) inCodeBlock = false;
      
      html += `<div class="table-responsive"><table class="markdown-table"><thead><tr>`;
      tableBlock.headers.forEach(h => {
        html += `<th>${parseInlineStyles(h, isDark)}</th>`;
      });
      html += `</tr></thead><tbody>`;
      
      tableBlock.rows.forEach(row => {
        html += `<tr>`;
        row.forEach(cell => {
          html += `<td>${parseInlineStyles(cell, isDark)}</td>`;
        });
        html += `</tr>`;
      });
      html += `</tbody></table></div>`;
      
      idx = tableBlock.endIndex + 1;
      continue;
    }
    
    const line = lines[idx];
    const trimmed = line.trim();
    
    if (!trimmed) {
      flushList();
      idx++;
      continue;
    }
    
    if (trimmed.startsWith("```")) {
      flushList();
      if (inCodeBlock) {
        html += `<pre><code>${codeLines.join("\n")}</code></pre>`;
        codeLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      idx++;
      continue;
    }
    
    if (inCodeBlock) {
      codeLines.push(line);
      idx++;
      continue;
    }
    
    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      html += `<h4>${trimmed.slice(4)}</h4>`;
      idx++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      html += `<h3>${trimmed.slice(3)}</h3>`;
      idx++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      html += `<h2>${trimmed.slice(2)}</h2>`;
      idx++;
      continue;
    }
    
    // Bullet lists
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      const itemText = trimmed.slice(2);
      if (!currentList) {
        currentList = { type: "bullet", items: [itemText] };
      } else if (currentList.type === "bullet") {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: "bullet", items: [itemText] };
      }
      idx++;
      continue;
    }
    
    // Numbered lists
    const numberedMatch = trimmed.match(/^\d+\.\s(.*)/);
    if (numberedMatch) {
      const itemText = numberedMatch[1];
      if (!currentList) {
        currentList = { type: "numbered", items: [itemText] };
      } else if (currentList.type === "numbered") {
        currentList.items.push(itemText);
      } else {
        flushList();
        currentList = { type: "numbered", items: [itemText] };
      }
      idx++;
      continue;
    }
    
    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      html += `<blockquote>${parseInlineStyles(trimmed.slice(2), isDark)}</blockquote>`;
      idx++;
      continue;
    }
    
    // Plain text
    flushList();
    html += `<p>${parseInlineStyles(trimmed, isDark)}</p>`;
    idx++;
  }
  
  flushList();
  html += `</div>`;
  return html;
}

// UI State Updates
function updateCompanionStatusIndicators() {
  const sealTitle = document.querySelector("#star-status-seal h2");
  const sealDesc = document.getElementById("star-status-desc");
  const playgroundClass = document.getElementById("chat-playground");
  const stateSeal = document.getElementById("companion-state-seal");
  
  if (sealDesc) {
    if (state === "thinking") sealDesc.innerText = "• PROCESSING PROMPT •";
    else if (state === "listening") sealDesc.innerText = "• ATTENTIVE LISTENING •";
    else if (state === "responding") sealDesc.innerText = "• EXPRESSING RESPONSE •";
    else sealDesc.innerText = "• REAL-TIME TRACKING ACTIVE •";
  }

  if (playgroundClass) {
    // Sync class configurations for pulsing dots
    playgroundClass.className = `state-${state}`;
  }

  if (stateSeal) {
    if (state === "thinking") {
      stateSeal.innerText = "thinking state (processing)";
    } else if (state === "listening") {
      stateSeal.innerText = "listening state";
    } else if (state === "responding") {
      stateSeal.innerText = "responding gesture";
    } else {
      stateSeal.innerText = `idle state — expression: ${expression}`;
    }
  }
}

// Render active conversation logs
function renderChatView() {
  const container = document.getElementById("messages-container");
  if (!container) return;

  const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
  if (!activeSession) return;

  const isDark = theme === "dark";
  const messages = activeSession.messages;

  container.innerHTML = "";

  messages.forEach((msg) => {
    const isUser = msg.sender === "user";
    const wrapper = document.createElement("div");
    wrapper.className = `message-wrapper ${isUser ? 'user' : 'star'}`;
    
    const innerHTML = `
      <div class="profile-orb">
        <i data-lucide="${isUser ? 'user' : 'cpu'}" style="width: 14px; height: 14px;"></i>
      </div>
      <div class="message-content">
        <div class="message-bubble">
          ${isUser ? `<p class="whitespace-pre-line">${msg.text}</p>` : parseMarkdown(msg.text, isDark)}
        </div>
        <div class="message-meta">
          <span>${msg.timestamp}</span>
          ${!isUser && msg.expression ? `<span class="mood-badge">mood: ${msg.expression}</span>` : ""}
        </div>
      </div>
    `;

    wrapper.innerHTML = innerHTML;
    container.appendChild(wrapper);
  });

  // Render typing indicator bubble if in thinking state
  if (state === "thinking") {
    const typingWrapper = document.createElement("div");
    typingWrapper.className = "message-wrapper star typing";
    typingWrapper.innerHTML = `
      <div class="profile-orb">
        <i data-lucide="refresh-cw" style="width: 14px; height: 14px; animation: spin 1.5s linear infinite;"></i>
      </div>
      <div class="message-content">
        <div class="typing-bubble">
          <span class="typing-dot">
            <span class="typing-dot-ping"></span>
            <span class="typing-dot-inner"></span>
          </span>
          <span class="typing-text">Star is compiling thought coordinates...</span>
        </div>
      </div>
    `;
    container.appendChild(typingWrapper);
  }

  // Inject suggestion chips if conversation is new and robot is idle
  renderSuggestionChips(messages);

  // Auto-scroll down
  container.scrollTop = container.scrollHeight;
  refreshIcons();
}

function renderSuggestionChips(messages) {
  const panel = document.getElementById("suggestions-panel");
  const listContainer = document.getElementById("suggestions-list");
  if (!panel || !listContainer) return;

  if (messages.length < 3 && state === "idle") {
    panel.style.display = "block";
    listContainer.innerHTML = "";

    const suggestions = [
      { text: "Can you list country cost comparison metrics in a clear markdown table?", action: "table_query" },
      { text: "Can you show me your happy expression?", action: "set_happy" },
      { text: "Tell me a short, futuristic story about you", action: "story" },
      { text: "What materials are you constructed of?", action: "specs" },
    ];

    suggestions.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "btn-suggestion";
      btn.innerText = s.text;
      btn.addEventListener("click", () => {
        handleSendMessage(s.text);
      });
      listContainer.appendChild(btn);
    });
  } else {
    panel.style.display = "none";
  }
}

// Render Saved chats sidebar
function renderSessionsSidebar() {
  const sidebar = document.getElementById("sidebar-sessions");
  const listContainer = document.getElementById("sessions-list");
  if (!sidebar || !listContainer) return;

  const btnHistory = document.getElementById("btn-toggle-sidebar");
  if (btnHistory) {
    btnHistory.querySelector("span").innerText = `History (${sessions.length})`;
  }

  if (!showSessions) {
    sidebar.style.display = "none";
    if (btnHistory) btnHistory.classList.remove("active-toggle");
    return;
  }

  sidebar.style.display = "flex";
  if (btnHistory) btnHistory.classList.add("active-toggle");
  listContainer.innerHTML = "";

  sessions.forEach((s) => {
    const isActive = s.id === currentSessionId;
    const item = document.createElement("div");
    item.className = `session-item ${isActive ? 'active' : ''}`;
    
    item.innerHTML = `
      <button class="session-btn" type="button">
        <span class="title">${s.title || "Untitled Chat"}</span>
        <span class="date">${new Date(s.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
      </button>
      <button class="btn-delete-session" type="button" title="Delete conversation logs">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    `;

    // Click handler to switch sessions
    item.querySelector(".session-btn").addEventListener("click", () => {
      currentSessionId = s.id;
      state = "idle";
      expression = "neutral";
      saveSessionsToStorage();
      renderChatView();
      renderSessionsSidebar();
      updateCompanionStatusIndicators();
    });

    // Delete handler
    item.querySelector(".btn-delete-session").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteChatSession(s.id);
    });

    listContainer.appendChild(item);
  });

  refreshIcons();
}

// Send user prompts to Gemini REST path
async function handleSendMessage(inputText) {
  if (!inputText.trim() || state === "thinking") return;

  const errorAlert = document.getElementById("error-alert");
  if (errorAlert) errorAlert.style.display = "none";

  const userText = inputText;
  const inputEl = document.getElementById("prompt-input-box");
  if (inputEl) inputEl.value = "";

  // Append user message logs
  const userMsg = {
    id: `msg-user-${Date.now()}-${Math.random()}`,
    sender: "user",
    text: userText,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
  
  addMessageToCurrentSession(userMsg);

  // Set State to processing (Thinking animations)
  state = "thinking";
  updateCompanionStatusIndicators();
  renderChatView();

  // Custom Reactive Theme and expression checks
  const lowerText = userText.toLowerCase();
  if (lowerText.includes("midnight") || lowerText.includes("theme") || lowerText.includes("sunrise") || lowerText.includes("dawn") || lowerText.includes("noon")) {
    setTimeout(() => {
      applyTheme(theme === "dark" ? "light" : "dark");
    }, 500);
  } else if (lowerText.includes("happy") || lowerText.includes("smile")) {
    expression = "happy";
  }

  try {
    const activeSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];
    const history = activeSession ? activeSession.messages : [];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText, history }),
    });

    if (!response.ok) {
      throw new Error(`Server returned error status ${response.status}`);
    }

    const data = await response.json();

    // Set state to Responding gesture nod
    state = "responding";
    if (data.expression) {
      expression = data.expression;
    }
    updateCompanionStatusIndicators();
    renderChatView();

    const starMsg = {
      id: `msg-star-${Date.now()}-${Math.random()}`,
      sender: "star",
      text: data.text || "I was unable to formulate a response.",
      expression: data.expression || "neutral",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Nod delay representation
    setTimeout(() => {
      addMessageToCurrentSession(starMsg);
      state = "idle";
      updateCompanionStatusIndicators();
    }, 900);

  } catch (err) {
    console.error(err);
    state = "idle";
    updateCompanionStatusIndicators();
    renderChatView();

    if (errorAlert) {
      document.getElementById("error-message").innerText = "Unable to reach Star. Check if backend Node server is running.";
      errorAlert.style.display = "flex";
    }
  }
}

// Refresh vector icons
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Set Event Listeners on UI controls
function initUIEventListeners() {
  // Input focus/blur tracker
  const inputEl = document.getElementById("prompt-input-box");
  if (inputEl) {
    inputEl.addEventListener("focus", () => {
      if (state === "idle") {
        state = "listening";
        updateCompanionStatusIndicators();
      }
    });

    inputEl.addEventListener("blur", () => {
      if (state === "listening") {
        state = "idle";
        updateCompanionStatusIndicators();
      }
    });
  }

  // Form submits
  const formEl = document.getElementById("prompt-field-form");
  if (formEl) {
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      if (inputEl) {
        handleSendMessage(inputEl.value);
      }
    });
  }

  // Nav buttons
  const btnMute = document.getElementById("btn-toggle-mute");
  if (btnMute) {
    // Initial sync
    btnMute.innerHTML = getMuteState() 
      ? `<i data-lucide="volume-x"></i><span>Muted</span>` 
      : `<i data-lucide="volume-2"></i><span>Sfx</span>`;
      
    btnMute.addEventListener("click", () => {
      const res = toggleMute();
      btnMute.innerHTML = res 
        ? `<i data-lucide="volume-x"></i><span>Muted</span>` 
        : `<i data-lucide="volume-2"></i><span>Sfx</span>`;
      refreshIcons();
    });
  }

  const btnTheme = document.getElementById("btn-toggle-theme");
  if (btnTheme) {
    btnTheme.addEventListener("click", () => {
      applyTheme(theme === "dark" ? "light" : "dark");
    });
  }

  const btnClear = document.getElementById("btn-clear-chat");
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      createNewChatSession();
    });
  }

  const btnSidebarNew = document.getElementById("btn-sidebar-new");
  if (btnSidebarNew) {
    btnSidebarNew.addEventListener("click", () => {
      createNewChatSession();
    });
  }

  const btnHistory = document.getElementById("btn-toggle-sidebar");
  if (btnHistory) {
    btnHistory.addEventListener("click", () => {
      showSessions = !showSessions;
      renderSessionsSidebar();
    });
  }

  const btnClearAll = document.getElementById("btn-clear-history");
  if (btnClearAll) {
    btnClearAll.addEventListener("click", () => {
      if (confirm("Are you sure you want to delete all saved conversations? This cannot be undone.")) {
        clearAllHistory();
      }
    });
  }
}

// Initializer Coordinator
function initApp() {
  loadSessionsFromStorage();
  initBlinkTimer();
  initCursorTracker();
  initRobotPartTaps();
  initUIEventListeners();
  startAnimationLoop();

  // Initial drawings
  renderChatView();
  renderSessionsSidebar();
  updateCompanionStatusIndicators();
  refreshIcons();
}

// Run app once page elements are loaded
window.addEventListener("DOMContentLoaded", initApp);
