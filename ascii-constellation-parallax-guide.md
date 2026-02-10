# ASCII Constellation Parallax Background Implementation Guide

## Core Concept Overview

You're building a **mouse-parallax ASCII constellation system** with multiple depth layers that respond to cursor movement. Stars closer to the user move faster (larger offset) while distant stars move slower, creating a 3D depth effect. 

Additionally, the entire sky rotates slowly around a fixed viewpoint (like starscape videos on YouTube), creating the impression of a planet rotating while you observe from a stationary position. The rotation is subtle and continuous, combined with the mouse parallax for a dynamic, immersive background.

**Key Features:**
- Mouse parallax for 3D depth
- Slow 360° sky rotation (complete rotation every 10-15 minutes)
- Mobile-friendly with battery optimization
- Cross-browser support
- Hidden pride mode easter egg with **random flag assignment per constellation** (each constellation gets a different pride flag with stepped gradients for authentic appearance)

---

## Technical Architecture

### Layer Structure (3-4 depth layers recommended)

**Layer 1 - Deep Space (slowest, 10% movement)**
- Faintest stars `·` and `.`
- No constellation lines
- Smallest glow radius
- Maximum distance from camera

**Layer 2 - Mid-distance (medium, 25% movement)**
- Medium stars `*` and `+`
- Simple 3-4 star constellations with connecting lines
- Medium glow

**Layer 3 - Foreground (faster, 50% movement)**
- Brightest stars `✦` `✧` `*` `◦`
- Complex constellations (5-8 stars) with lines
- Strongest glow effect

**Layer 4 - Dashboard Content (static, 0% movement)**
- Your actual UI elements

### Data Structure for Constellations

```javascript
const constellations = [
  {
    layer: 2,  // Which depth layer
    stars: [
      { char: '✦', x: 20, y: 15 },
      { char: '*', x: 25, y: 18 },
      { char: '*', x: 30, y: 12 },
      { char: '+', x: 28, y: 20 },
      { char: '*', x: 32, y: 24 },
      { char: '◦', x: 26, y: 25 }
    ],
    connections: [
      [0, 1],  // Connect star 0 to star 1
      [1, 2],  // Star 1 branches to star 2
      [1, 3],  // Star 1 also connects to star 3 (branching point)
      [3, 4],
      [3, 5]   // Star 3 branches to both 4 and 5
    ]
    // Open pattern - no closed loops
    // Some stars have multiple connections, creating branches
  },
  // More constellations...
];
```

---

## Implementation Approach: Canvas vs DOM

### Recommended: **Hybrid Canvas + CSS Approach**

**Use Canvas for:**
- Drawing constellation lines (SVG would work but canvas is faster for many lines)
- Star glow effects
- Dynamic rendering based on mouse position

**Use CSS/DOM for:**
- ASCII star characters (better text rendering, font support)
- Easy theme switching (light/dark mode)
- Simpler positioning

### Why Not Pure DOM?

With 50-200+ ASCII stars, DOM manipulation on every mouse move creates reflow/repaint overhead. Canvas avoids this but loses crisp text rendering. The hybrid approach gives you both.

---

## Realistic Constellation Pattern Principles

Based on real astronomical constellations (like Gemini, Leo, Libra, Scorpio, Taurus), the generated patterns must follow these rules:

1. **No Closed Loops**: Constellations are open patterns, not geometric shapes. Never connect lines back to form a complete polygon.

2. **Branching Structure**: Some stars act as "hubs" with 2-3 connections, creating branching tree-like structures. Most stars have only 1-2 connections.

3. **Organic Distribution**: Stars in a constellation are clustered but not perfectly arranged. They spread naturally around a center point.

4. **Connection Limits**: 
   - Most stars: 1-2 connections
   - Hub stars: 2-3 connections  
   - No star should have more than 3 connections

5. **Spanning Tree Approach**: Use a minimum spanning tree algorithm to ensure all stars in a constellation are connected without creating cycles.

### Visual Examples

**✓ CORRECT - Open Branching Pattern:**
```
    *           *
     \         /
      *---*---*
         /
        *
```
Stars 0,1,2,3,4,5
Connections: [[1,0], [1,2], [2,3], [2,4], [2,5]]
Star 2 is a branch point with 3 connections

**✗ INCORRECT - Closed Loop:**
```
    *---*
    |   |
    *---*
```
Connections: [[0,1], [1,2], [2,3], [3,0]]
This forms a square - NOT allowed

**✓ CORRECT - Linear with Branch:**
```
*---*---*---*
         \
          *
```
Natural open pattern with one branch point

---

## Step-by-Step Implementation

### Step 1: Set Up the Layer Container Structure

```jsx
const PRIDE_FLAGS = ['rainbow', 'trans', 'bisexual', 'lesbian', 'gay', 'pansexual', 'nonbinary', 'asexual', 'aromantic', 'genderfluid', 'agender'];

const ConstellationBackground = ({ isDarkMode, children }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const centerPos = useRef({ x: 0, y: 0 });
  const rotationRef = useRef(0); // Track rotation angle
  const [prideMode, setPrideMode] = useState(false); // Boolean: on or off
  const [constellationFlags, setConstellationFlags] = useState({}); // Map: constellation_id -> flag_type
  const constellationsRef = useRef([]); // Store generated constellations
  
  // Helper: Assign random flags to all constellations
  const randomizeConstellationFlags = () => {
    const flagMap = {};
    constellationsRef.current.forEach((constellation, index) => {
      const randomFlag = PRIDE_FLAGS[Math.floor(Math.random() * PRIDE_FLAGS.length)];
      flagMap[index] = randomFlag;
    });
    return flagMap;
  };
  
  return (
    <div 
      ref={containerRef}
      className="constellation-container"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        background: isDarkMode ? '#0a0f14' : '#e8ecf0',
        overflow: 'hidden'
      }}
      onDoubleClick={(e) => {
        // Easter egg: Shift + Double-click to toggle pride mode
        if (e.shiftKey) {
          setPrideMode(prev => {
            const newMode = !prev;
            if (newMode) {
              // Turning ON: randomize flags
              setConstellationFlags(randomizeConstellationFlags());
            }
            return newMode;
          });
        }
      }}
    >
      {/* Canvas for lines and glows */}
      <canvas 
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Rotating sky container - all star layers go inside this */}
      <div 
        className="sky-rotation-container"
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: 'center center',
          // Rotation will be applied via CSS animation
        }}
      >
        {/* Render constellations with their assigned flags */}
        {constellationsRef.current.map((constellation, index) => (
          <StarLayer
            key={index}
            constellationId={index}
            stars={constellation.stars}
            depth={constellation.layer === 1 ? 0.1 : constellation.layer === 2 ? 0.25 : 0.5}
            isDarkMode={isDarkMode}
            prideMode={prideMode}
            assignedFlag={constellationFlags[index]}
          />
        ))}
      </div>
      
      {/* Dashboard content - NOT rotated */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>
      
      {/* Pride mode indicator */}
      <PrideModeIndicator prideMode={prideMode} />
    </div>
  );
};
```

### Step 2: Procedurally Generate Constellation Data

Generate realistic open constellations with branching patterns:

```javascript
const generateConstellations = (width, height) => {
  const constellations = [];
  
  // Generate 12-15 constellations across layers
  const constellationCount = 12 + Math.floor(Math.random() * 4);
  
  for (let i = 0; i < constellationCount; i++) {
    // Determine layer (30% layer 1, 40% layer 2, 30% layer 3)
    const rand = Math.random();
    const layer = rand < 0.3 ? 1 : rand < 0.7 ? 2 : 3;
    
    // Each constellation has 3-8 stars
    const starCount = 3 + Math.floor(Math.random() * 6);
    
    // Pick a random center point for this constellation
    const centerX = width * (0.1 + Math.random() * 0.8);
    const centerY = height * (0.1 + Math.random() * 0.8);
    
    // Generate stars clustered around center
    const stars = [];
    const starChars = layer === 1 ? ['·', '.'] : 
                      layer === 2 ? ['*', '+', '·'] : 
                      ['✦', '✧', '*', '◦'];
    
    for (let j = 0; j < starCount; j++) {
      // Spread stars within a radius (50-150px depending on layer)
      const radius = (30 + Math.random() * 70) * layer;
      const angle = Math.random() * Math.PI * 2;
      
      stars.push({
        char: starChars[Math.floor(Math.random() * starChars.length)],
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }
    
    // Generate open, branching connections
    const connections = generateOpenConnections(starCount);
    
    constellations.push({ layer, stars, connections });
  }
  
  // Add scattered individual stars (no connections)
  for (let i = 0; i < 40; i++) {
    const layer = Math.random() < 0.4 ? 1 : Math.random() < 0.7 ? 2 : 3;
    const starChars = layer === 1 ? ['·', '.'] : 
                      layer === 2 ? ['*', '+'] : 
                      ['*', '◦'];
    
    constellations.push({
      layer,
      stars: [{
        char: starChars[Math.floor(Math.random() * starChars.length)],
        x: Math.random() * width,
        y: Math.random() * height
      }],
      connections: []
    });
  }
  
  return constellations;
};

/**
 * Generate open constellation connections with branching
 * - No closed loops
 * - Some stars can be branch points (2-3 connections)
 * - Most stars have 1-2 connections
 * - Creates realistic constellation patterns
 */
const generateOpenConnections = (starCount) => {
  if (starCount < 2) return [];
  
  const connections = [];
  const connectionCounts = new Array(starCount).fill(0);
  
  // Start with a spanning tree to ensure connectivity
  // This guarantees no loops while connecting all stars
  const connected = new Set([0]); // Start with star 0
  const unconnected = new Set(Array.from({ length: starCount }, (_, i) => i).slice(1));
  
  while (unconnected.size > 0) {
    // Pick a random connected star
    const connectedArray = Array.from(connected);
    const from = connectedArray[Math.floor(Math.random() * connectedArray.length)];
    
    // Pick a random unconnected star
    const unconnectedArray = Array.from(unconnected);
    const to = unconnectedArray[Math.floor(Math.random() * unconnectedArray.length)];
    
    // Only add connection if 'from' star doesn't have too many connections
    if (connectionCounts[from] < 3) {
      connections.push([from, to]);
      connectionCounts[from]++;
      connectionCounts[to]++;
      connected.add(to);
      unconnected.delete(to);
    } else {
      // If the selected star has too many connections, try another
      const alternatives = connectedArray.filter(s => connectionCounts[s] < 3);
      if (alternatives.length > 0) {
        const altFrom = alternatives[Math.floor(Math.random() * alternatives.length)];
        connections.push([altFrom, to]);
        connectionCounts[altFrom]++;
        connectionCounts[to]++;
        connected.add(to);
        unconnected.delete(to);
      }
    }
  }
  
  // Optionally add 1-3 more connections to create branches
  // But never create a cycle (closed loop)
  const extraConnections = Math.floor(Math.random() * 3);
  let attempts = 0;
  let added = 0;
  
  while (added < extraConnections && attempts < 20) {
    attempts++;
    
    const from = Math.floor(Math.random() * starCount);
    const to = Math.floor(Math.random() * starCount);
    
    // Check if this connection would create a valid branch
    if (from !== to && 
        connectionCounts[from] < 3 && 
        connectionCounts[to] < 3 &&
        !connections.some(([a, b]) => (a === from && b === to) || (a === to && b === from)) &&
        !wouldCreateCycle(connections, from, to, starCount)) {
      connections.push([from, to]);
      connectionCounts[from]++;
      connectionCounts[to]++;
      added++;
    }
  }
  
  return connections;
};

/**
 * Check if adding a connection would create a cycle
 * Uses DFS to detect if 'to' is already reachable from 'from'
 */
const wouldCreateCycle = (existingConnections, from, to, starCount) => {
  // Build adjacency list
  const adj = Array.from({ length: starCount }, () => []);
  existingConnections.forEach(([a, b]) => {
    adj[a].push(b);
    adj[b].push(a);
  });
  
  // DFS from 'from' to see if we can reach 'to'
  const visited = new Set();
  const stack = [from];
  
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === to) return true; // Cycle detected
    if (visited.has(current)) continue;
    
    visited.add(current);
    adj[current].forEach(neighbor => {
      if (!visited.has(neighbor)) {
        stack.push(neighbor);
      }
    });
  }
  
  return false;
};
```

**How the Algorithm Works:**

1. **Constellation Generation**: Creates 12-15 constellations, each with 3-8 stars clustered around a random center point
2. **Open Connection Generation**: Uses a spanning tree approach to connect all stars without creating loops:
   - Starts with one connected star
   - Randomly connects unconnected stars to the growing network
   - Limits each star to max 3 connections
   - Optionally adds 1-3 extra branches while checking for cycles
3. **Cycle Detection**: Uses depth-first search (DFS) to verify that adding a new connection won't create a closed loop
4. **Result**: Natural, open constellation patterns that look like real astronomical constellations

### Step 3: Implement Mouse Parallax Logic

This is the core of the effect. Track mouse position and update layer transforms:

```javascript
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  
  const rect = container.getBoundingClientRect();
  centerPos.current = { 
    x: rect.width / 2, 
    y: rect.height / 2 
  };
  
  let rafId = null;
  
  const handleMouseMove = (e) => {
    // Store mouse position
    mousePos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    // Debounce with RAF
    if (rafId) return;
    
    rafId = requestAnimationFrame(() => {
      updateParallax();
      rafId = null;
    });
  };
  
  const updateParallax = () => {
    const { x, y } = mousePos.current;
    const { x: cx, y: cy } = centerPos.current;
    
    // Calculate offset from center (-1 to 1 range)
    const deltaX = (x - cx) / cx;
    const deltaY = (y - cy) / cy;
    
    // Update each layer
    const layers = container.querySelectorAll('.star-layer');
    layers.forEach(layer => {
      const depth = parseFloat(layer.dataset.depth);
      
      // Parallax offset = mouse offset * depth multiplier * max movement
      const maxMove = 40; // pixels
      const offsetX = deltaX * depth * maxMove;
      const offsetY = deltaY * depth * maxMove;
      
      layer.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
    });
    
    // Redraw canvas (lines and glows)
    drawConstellationLines(deltaX, deltaY);
  };
  
  container.addEventListener('mousemove', handleMouseMove);
  
  return () => {
    container.removeEventListener('mousemove', handleMouseMove);
    if (rafId) cancelAnimationFrame(rafId);
  };
}, []);
```

### Step 3b: Implement Sky Rotation

Add slow, continuous rotation to the entire sky using CSS animations for maximum performance:

```javascript
useEffect(() => {
  const skyContainer = containerRef.current?.querySelector('.sky-rotation-container');
  if (!skyContainer) return;
  
  // Check for battery saver mode or reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isBatterySaver = navigator.getBattery ? 
    navigator.getBattery().then(battery => battery.charging === false && battery.level < 0.2) : 
    Promise.resolve(false);
  
  isBatterySaver.then(isLowBattery => {
    if (prefersReducedMotion || isLowBattery) {
      // Disable rotation for accessibility or battery saving
      skyContainer.style.animation = 'none';
      return;
    }
    
    // Apply CSS animation for rotation
    // Complete 360° rotation in 600 seconds (10 minutes)
    skyContainer.style.animation = 'skyRotation 600s linear infinite';
  });
  
  // Alternative: Manual rotation via RAF for more control
  // (Use this if you need to combine rotation with other transforms)
  const manualRotation = false; // Set to true to use RAF instead of CSS
  
  if (manualRotation) {
    let animationId;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      // 360 degrees over 600 seconds = 0.6 degrees per second
      const rotation = (elapsed / 600000) * 360;
      rotationRef.current = rotation % 360;
      
      skyContainer.style.transform = `rotate(${rotation}deg)`;
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }
}, []);
```

**CSS Animation Definition** (add to your stylesheet):

```css
@keyframes skyRotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.sky-rotation-container {
  /* Ensure smooth animation */
  will-change: transform;
  animation: skyRotation 600s linear infinite;
}

/* Disable rotation for accessibility */
@media (prefers-reduced-motion: reduce) {
  .sky-rotation-container {
    animation: none !important;
  }
}

/* Pause animation when page is hidden to save battery */
@media (prefers-reduced-motion: no-preference) {
  .sky-rotation-container {
    animation-play-state: running;
  }
  
  body:not(.page-visible) .sky-rotation-container {
    animation-play-state: paused;
  }
}
```

**Page Visibility API for Battery Saving:**

```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      document.body.classList.remove('page-visible');
    } else {
      document.body.classList.add('page-visible');
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  handleVisibilityChange(); // Set initial state
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);
```

### Step 4: Render ASCII Stars with Glow (and Pride Mode)

```jsx
const StarLayer = ({ constellationId, stars, depth, isDarkMode, prideMode, assignedFlag }) => {
  return (
    <div 
      className="star-layer"
      data-depth={depth}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: "'VT323', 'Courier New', monospace",
        fontSize: depth > 0.3 ? '20px' : depth > 0.15 ? '16px' : '12px'
      }}
    >
      {stars.map((star, idx) => {
        // Pride mode: Use this constellation's assigned flag
        const prideColor = prideMode && assignedFlag 
          ? getPrideColor(star.y, assignedFlag) 
          : null;
        
        return (
          <span
            key={idx}
            className={`star ${isDarkMode ? 'dark' : 'light'}`}
            style={{
              position: 'absolute',
              left: star.x,
              top: star.y,
              transform: 'translate(-50%, -50%)',
              // Glow effect via text-shadow
              textShadow: prideColor
                ? `0 0 ${depth * 20}px ${prideColor},
                   0 0 ${depth * 10}px ${prideColor}`
                : isDarkMode
                  ? `0 0 ${depth * 20}px rgba(200, 220, 255, ${depth * 0.8}),
                     0 0 ${depth * 10}px rgba(200, 220, 255, ${depth * 0.6})`
                  : `0 0 ${depth * 20}px rgba(20, 40, 60, ${depth * 0.5}),
                     0 0 ${depth * 10}px rgba(20, 40, 60, ${depth * 0.3})`,
              color: prideColor
                ? prideColor
                : isDarkMode 
                  ? `rgba(220, 235, 255, ${0.3 + depth * 0.7})`
                  : `rgba(40, 60, 80, ${0.5 + depth * 0.5})`,
              opacity: 0.7 + depth * 0.3,
              transition: prideMode ? 'color 0.5s ease, text-shadow 0.5s ease' : 'none'
            }}
          >
            {star.char}
          </span>
        );
      })}
    </div>
  );
};
```

**Usage Example:**
```jsx
{constellations.map((constellation, index) => (
  <StarLayer
    key={index}
    constellationId={index}
    stars={constellation.stars}
    depth={constellation.layer === 1 ? 0.1 : constellation.layer === 2 ? 0.25 : 0.5}
    isDarkMode={isDarkMode}
    prideMode={prideMode}
    assignedFlag={constellationFlags[index]} // This constellation's random flag
  />
))}
```

**Key Glow Mechanics:**
- **Dark mode**: Light colored stars (`rgba(220, 235, 255)`) with light blue/white glow
- **Light mode**: Dark colored stars (`rgba(40, 60, 80)`) with dark blue/gray glow
- **Pride mode**: **Stepped gradient** colors from this constellation's randomly assigned flag (no smooth blending between bands)
- Glow radius scales with depth (closer = bigger glow)
- Multiple `text-shadow` layers create soft diffusion
- Smooth transition when toggling pride mode
- Each constellation maintains its own flag assignment
- Each star stays within its color band - no interpolation between adjacent flag colors

### Step 5: Draw Constellation Lines on Canvas (with Stepped Pride Gradients)

```javascript
const drawConstellationLines = (deltaX, deltaY, isDarkMode, prideMode, constellationFlags) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d', { alpha: true });
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  constellations.forEach((constellation, constellationIndex) => {
    if (constellation.connections.length === 0) return;
    
    const layer = constellation.layer;
    const depth = layer === 1 ? 0.1 : layer === 2 ? 0.25 : 0.5;
    
    // Get this constellation's assigned flag
    const assignedFlag = prideMode ? constellationFlags[constellationIndex] : null;
    
    // Calculate parallax offset for this layer
    const maxMove = 40;
    const offsetX = deltaX * depth * maxMove;
    const offsetY = deltaY * depth * maxMove;
    
    // Draw connections
    constellation.connections.forEach(([startIdx, endIdx]) => {
      const start = constellation.stars[startIdx];
      const end = constellation.stars[endIdx];
      
      // Apply parallax offset
      const x1 = start.x + offsetX;
      const y1 = start.y + offsetY;
      const x2 = end.x + offsetX;
      const y2 = end.y + offsetY;
      
      // Pride mode: Create STEPPED gradient using this constellation's flag
      if (prideMode && assignedFlag) {
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        const startColor = getPrideColor(y1, assignedFlag, height);
        const endColor = getPrideColor(y2, assignedFlag, height);
        
        // For stepped gradients, we need to add multiple hard stops
        const lineLength = Math.abs(y2 - y1);
        
        if (lineLength < 1) {
          // Very short line, just use one color
          gradient.addColorStop(0, startColor);
          gradient.addColorStop(1, startColor);
        } else {
          // Create stepped gradient by sampling colors along the line
          const steps = Math.max(3, Math.floor(lineLength / 50)); // Sample every ~50px
          
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const sampleY = y1 + (y2 - y1) * t;
            const color = getPrideColor(sampleY, assignedFlag, height);
            
            // Add hard stops (repeat each color twice for sharp transitions)
            if (i > 0) {
              gradient.addColorStop(t - 0.001, getPrideColor(y1 + (y2 - y1) * (i - 1) / steps, assignedFlag, height));
            }
            gradient.addColorStop(t, color);
          }
        }
        
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = isDarkMode
          ? `rgba(180, 200, 255, ${depth * 0.4})`
          : `rgba(60, 80, 100, ${depth * 0.3})`;
      }
      
      ctx.lineWidth = depth * 1.5;
      ctx.lineCap = 'round';
      
      // Glow effect - draw multiple times with decreasing opacity
      for (let i = 3; i > 0; i--) {
        ctx.shadowBlur = i * 8;
        
        if (prideMode && assignedFlag) {
          // Use the midpoint color for glow in pride mode
          const midY = (y1 + y2) / 2;
          ctx.shadowColor = getPrideColor(midY, assignedFlag, height);
        } else {
          ctx.shadowColor = isDarkMode
            ? `rgba(200, 220, 255, ${depth * 0.3})`
            : `rgba(40, 60, 80, ${depth * 0.2})`;
        }
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      
      ctx.shadowBlur = 0; // Reset
    });
  });
};
```

**Stepped Gradient Technique for Lines:**
- Each constellation's lines use that constellation's randomly assigned flag
- Samples colors at multiple points along each line
- Creates hard color transitions by adding near-duplicate stops
- Longer lines get more color samples for better band visibility
- Short lines (< 1px) use a single solid color
- Results in authentic pride flag appearance with distinct color bands per constellation

### Step 6: Light/Dark Mode Theme Switching

```css
:root {
  /* Dark mode (default) */
  --bg-primary: #0a0f14;
  --star-color: rgb(220, 235, 255);
  --star-glow: rgba(200, 220, 255, 0.6);
  --line-color: rgba(180, 200, 255, 0.4);
  --line-glow: rgba(200, 220, 255, 0.3);
}

[data-theme="light"] {
  --bg-primary: #e8ecf0;
  --star-color: rgb(40, 60, 80);
  --star-glow: rgba(20, 40, 60, 0.5);
  --line-color: rgba(60, 80, 100, 0.3);
  --line-glow: rgba(40, 60, 80, 0.2);
}

.constellation-container {
  background: var(--bg-primary);
}
```

In React:

```jsx
const [isDarkMode, setIsDarkMode] = useState(true);

useEffect(() => {
  document.documentElement.setAttribute(
    'data-theme', 
    isDarkMode ? 'dark' : 'light'
  );
}, [isDarkMode]);
```

---

## Critical Performance Optimizations

### 1. **Use `translate3d` for GPU Acceleration**

Always use `translate3d(x, y, 0)` instead of `translate(x, y)` or `left/top` properties. This forces GPU compositing.

```javascript
layer.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
```

### 2. **Throttle Mouse Updates with RAF**

Never update on raw `mousemove` events (fires 60+ times/sec). Use `requestAnimationFrame` to batch updates:

```javascript
let rafId = null;
const handleMouseMove = (e) => {
  mousePos.current = { x: e.clientX, y: e.clientY };
  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      updateParallax();
      rafId = null;
    });
  }
};
```

### 3. **Canvas Context Settings for Performance**

```javascript
const ctx = canvas.getContext('2d', { 
  alpha: true,           // We need transparency
  desynchronized: true   // Reduces latency (Chrome)
});
```

### 4. **Limit Constellation Complexity**

- **Max 12-15 constellations** total (procedurally generated)
- **3-8 stars per constellation** (optimal range)
- **Max 50-70 total ASCII star elements** across all layers (including scattered stars)
- **No closed loops** - always use open, branching patterns
- **Max 3 connections per star** to avoid visual clutter

More than this creates diminishing returns and visible lag on lower-end devices.

### 5. **Use CSS `will-change` Sparingly**

```css
.star-layer {
  will-change: transform;
  transform: translate3d(0, 0, 0); /* Force initial compositing */
}
```

Only apply to the 3-4 star layers, not individual stars.

### 6. **Debounce Canvas Redraws**

Canvas redraw is expensive. If mouse isn't moving, don't redraw:

```javascript
let lastDrawTime = 0;
const drawThrottle = 16; // ~60fps

const drawConstellationLines = (deltaX, deltaY) => {
  const now = performance.now();
  if (now - lastDrawTime < drawThrottle) return;
  lastDrawTime = now;
  
  // ... draw logic
};
```

### 7. **Memoize Star Components**

```jsx
const Star = React.memo(({ char, x, y, depth, isDarkMode }) => {
  return (
    <span className="star" style={{...}}>
      {char}
    </span>
  );
}, (prev, next) => {
  // Only re-render if theme changes
  return prev.isDarkMode === next.isDarkMode;
});
```

Stars don't need to re-render on mouse move since their parent container transforms.

### 8. **Implement Viewport Culling**

Don't render stars outside the viewport + buffer zone:

```javascript
const isInViewport = (x, y, buffer = 100) => {
  return x > -buffer && x < width + buffer &&
         y > -buffer && y < height + buffer;
};

const visibleStars = stars.filter(s => 
  isInViewport(s.x, s.y)
);
```

### 9. **Reduce Motion for Accessibility**

```javascript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

// If true, disable parallax
const depth = prefersReducedMotion ? 0 : layer.depth;
```

### 10. **Use Passive Event Listeners**

```javascript
container.addEventListener('mousemove', handleMouseMove, { 
  passive: true 
});
```

This tells the browser you won't call `preventDefault()`, enabling scroll optimizations.

---

## Advanced Touch: Subtle Animations

Add a gentle idle animation to make the scene feel alive even without mouse movement:

```css
@keyframes twinkle {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

.star {
  animation: twinkle 3s ease-in-out infinite;
  animation-delay: calc(var(--index) * 0.2s);
}
```

Set `--index` as an inline style based on the star's array index to stagger the twinkle.

---

## Mobile & Battery Optimization

### Detecting Low Power Mode

```javascript
const useLowPowerMode = () => {
  const [isLowPower, setIsLowPower] = useState(false);
  
  useEffect(() => {
    const checkBattery = async () => {
      // Check for battery API support
      if (!navigator.getBattery) {
        // Assume low power on mobile if API not available
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        setIsLowPower(isMobile);
        return;
      }
      
      const battery = await navigator.getBattery();
      
      const updatePowerMode = () => {
        // Enable low power mode if:
        // - Battery is below 20% AND not charging
        // - OR battery saver mode is likely enabled (very low level)
        const shouldUseLowPower = 
          (!battery.charging && battery.level < 0.2) ||
          battery.level < 0.1;
        
        setIsLowPower(shouldUseLowPower);
      };
      
      updatePowerMode();
      
      battery.addEventListener('chargingchange', updatePowerMode);
      battery.addEventListener('levelchange', updatePowerMode);
      
      return () => {
        battery.removeEventListener('chargingchange', updatePowerMode);
        battery.removeEventListener('levelchange', updatePowerMode);
      };
    };
    
    checkBattery();
  }, []);
  
  return isLowPower;
};
```

### Adaptive Performance Modes

Implement three performance tiers:

**High Performance (Desktop, charging, high battery):**
- Full mouse parallax
- Sky rotation enabled
- 60 fps canvas redraws
- All glows and effects

**Medium Performance (Mobile, good battery):**
- Reduced parallax range (20px instead of 40px)
- Sky rotation enabled but slower (900s instead of 600s)
- 30 fps canvas redraws
- Simplified glows

**Low Performance (Low battery, battery saver mode):**
- No parallax (static positions)
- No sky rotation
- No canvas redraws (static lines)
- Minimal or no glows

```javascript
const getPerformanceTier = (isLowPower, isMobile, prefersReducedMotion) => {
  if (prefersReducedMotion) return 'low';
  if (isLowPower) return 'low';
  if (isMobile) return 'medium';
  return 'high';
};

const ConstellationBackground = ({ isDarkMode, children }) => {
  const isLowPower = useLowPowerMode();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const performanceTier = getPerformanceTier(isLowPower, isMobile, prefersReducedMotion);
  
  // Adjust settings based on tier
  const config = {
    high: {
      parallaxRange: 40,
      rotationDuration: 600, // seconds
      targetFPS: 60,
      enableGlow: true,
      enableRotation: true,
      enableParallax: true
    },
    medium: {
      parallaxRange: 20,
      rotationDuration: 900,
      targetFPS: 30,
      enableGlow: true,
      enableRotation: true,
      enableParallax: true
    },
    low: {
      parallaxRange: 0,
      rotationDuration: 0,
      targetFPS: 0,
      enableGlow: false,
      enableRotation: false,
      enableParallax: false
    }
  }[performanceTier];
  
  // Use config values in your implementation
  // ...
};
```

### Touch Event Handling for Mobile

Replace or augment mouse parallax with touch/tilt on mobile:

```javascript
// Mobile: Use device orientation for parallax
useEffect(() => {
  if (!isMobile || !config.enableParallax) return;
  
  const handleOrientation = (e) => {
    // Beta: front-to-back tilt (-180 to 180)
    // Gamma: left-to-right tilt (-90 to 90)
    const deltaX = (e.gamma || 0) / 45; // Normalize to -2 to 2
    const deltaY = (e.beta || 0) / 90;
    
    updateParallax(deltaX, deltaY);
  };
  
  // Request permission on iOS 13+
  if (typeof DeviceOrientationEvent !== 'undefined' && 
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      });
  } else if ('DeviceOrientationEvent' in window) {
    window.addEventListener('deviceorientation', handleOrientation);
  }
  
  return () => {
    window.removeEventListener('deviceorientation', handleOrientation);
  };
}, [isMobile, config.enableParallax]);
```

### Viewport-Based Star Culling for Mobile

Reduce render load by only drawing stars near the visible area:

```javascript
const cullStars = (stars, width, height, buffer = 200) => {
  return stars.filter(star => 
    star.x > -buffer && 
    star.x < width + buffer &&
    star.y > -buffer && 
    star.y < height + buffer
  );
};
```

### Pause When Not Visible

```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    const skyContainer = document.querySelector('.sky-rotation-container');
    const canvas = canvasRef.current;
    
    if (document.hidden) {
      // Pause all animations
      if (skyContainer) skyContainer.style.animationPlayState = 'paused';
      // Stop RAF loops
      document.body.classList.add('background-paused');
    } else {
      // Resume
      if (skyContainer) skyContainer.style.animationPlayState = 'running';
      document.body.classList.remove('background-paused');
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

---

## Browser Compatibility

### Supported Browsers

**Full Support (all features):**
- Chrome 90+ (desktop & mobile)
- Edge 90+
- Safari 14+ (desktop & iOS)
- Firefox 88+
- Opera 76+

**Partial Support (rotation works, some features degraded):**
- Chrome 60-89
- Firefox 60-87
- Safari 12-13

### Feature Detection & Fallbacks

```javascript
const checkBrowserSupport = () => {
  const support = {
    css3DTransforms: 'transform' in document.body.style,
    cssAnimations: 'animation' in document.body.style,
    canvas: !!document.createElement('canvas').getContext,
    requestAnimationFrame: !!window.requestAnimationFrame,
    deviceOrientation: 'DeviceOrientationEvent' in window,
    batteryAPI: !!navigator.getBattery,
    cssVariables: CSS.supports('--fake-var', '0')
  };
  
  return support;
};

// Implement graceful degradation
const support = checkBrowserSupport();

if (!support.cssAnimations) {
  // Disable rotation, use static background
  console.warn('CSS animations not supported, rotation disabled');
}

if (!support.canvas) {
  // Don't draw constellation lines
  console.warn('Canvas not supported, lines disabled');
}
```

### CSS Vendor Prefixes (for older browsers)

```css
.sky-rotation-container {
  -webkit-animation: skyRotation 600s linear infinite;
  -moz-animation: skyRotation 600s linear infinite;
  animation: skyRotation 600s linear infinite;
  
  -webkit-transform-origin: center center;
  -moz-transform-origin: center center;
  transform-origin: center center;
}

@-webkit-keyframes skyRotation {
  from { -webkit-transform: rotate(0deg); }
  to { -webkit-transform: rotate(360deg); }
}

@-moz-keyframes skyRotation {
  from { -moz-transform: rotate(0deg); }
  to { -moz-transform: rotate(360deg); }
}

@keyframes skyRotation {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### Safari-Specific Fixes

Safari has some quirks with CSS animations and transforms:

```css
/* Fix for Safari transform jank */
.sky-rotation-container {
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-perspective: 1000;
  perspective: 1000;
}

/* Safari doesn't support CSS.supports() for some properties */
@supports (-webkit-appearance: none) {
  .sky-rotation-container {
    /* Safari-specific adjustments */
  }
}
```

---

## Mobile Considerations

On mobile, use the device orientation approach described in the "Mobile & Battery Optimization" section above, or disable parallax entirely for battery preservation. The sky rotation continues to work well on mobile using CSS animations, which are hardware-accelerated.

**Recommended mobile approach:**
- Use device orientation for parallax (requires user permission on iOS 13+)
- Reduce rotation speed (900s instead of 600s)
- Limit constellation count (8-10 instead of 12-15)
- Reduce parallax range (20px instead of 40px)
- Use 30fps for canvas redraws instead of 60fps

---

## Final Architecture Summary

```
┌─────────────────────────────────────────────────┐
│  Container (mouse listener, easter egg)        │
│  ┌──────────────────────────────────────────┐  │
│  │ Canvas (lines + glows, z-index 1)       │  │
│  │ - Pride mode gradients                   │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ Sky Rotation Container (CSS animation)   │  │
│  │ - Rotates 360° in 600s (10 min)         │  │
│  │ - Pauses when page hidden               │  │
│  │ - Disabled in low power mode            │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │ Layer 1 (depth: 0.1) - 20 stars   │ │  │
│  │  │ Deep space, no lines               │ │  │
│  │  └────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │ Layer 2 (depth: 0.25) - 25 stars  │ │  │
│  │  │ 5 simple constellations            │ │  │
│  │  └────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────┐ │  │
│  │  │ Layer 3 (depth: 0.5) - 15 stars   │ │  │
│  │  │ 3 complex constellations           │ │  │
│  │  └────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ Dashboard Content (z-index 10, static)   │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ Pride Mode Indicator 🏳️‍🌈 (if active)    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘

Animation Flow:
1. Sky rotates continuously via CSS (GPU-accelerated)
2. Mouse Move → RAF → Update parallax transforms → Redraw canvas
3. Mobile: Device orientation → Update parallax transforms
4. Page hidden → Pause animations (battery saving)
5. Pride mode → Gradient calculations → Canvas redraw
```

**Performance Budget:**
- 50-70 total ASCII elements (12-15 constellations + 40 scattered stars)
- 12-15 procedurally generated constellations
- 3-8 stars per constellation
- 3 star layers with depth multipliers (0.1, 0.25, 0.5)
- 1 canvas redraw per frame (high tier) or per 2 frames (medium tier)
- 1 CSS animation for rotation (no JS overhead)
- Target: 60fps on high tier, 30fps on medium, static on low
- No closed loops in constellation patterns

**Performance Tiers:**

| Tier | Rotation | Parallax | FPS | Glows | Battery Impact |
|------|----------|----------|-----|-------|----------------|
| High | ✓ (600s) | ✓ (40px) | 60  | Full  | Moderate |
| Medium | ✓ (900s) | ✓ (20px) | 30 | Simplified | Low |
| Low | ✗ | ✗ | 0 | None | Minimal |

**Browser Support:**
- Chrome 90+, Edge 90+, Firefox 88+, Safari 14+ (full support)
- Chrome 60-89, Firefox 60-87, Safari 12-13 (partial support)
- Graceful degradation for older browsers

**Mobile Optimizations:**
- Device orientation replaces mouse parallax
- Battery API detection for low power mode
- Viewport culling for stars
- Page Visibility API for pause/resume
- Reduced constellation count on mobile

**Easter Egg:**
- Shift + Double Click (desktop) or two-finger triple-tap (mobile) to toggle pride mode
- Press `P` three times quickly for keyboard activation
- When ON: each constellation randomly assigned one of 11 pride flags
- All flags displayed simultaneously across the sky
- Re-randomizes each time pride mode is toggled on
- Works in all themes and performance tiers
- Smooth 0.5s transitions with stepped gradient colors
- Rainbow flag indicator (🏳️‍🌈) shows when active

This architecture keeps the main thread free for dashboard data updates while delivering a beautiful, immersive ASCII constellation background that rotates slowly like a starscape time-lapse, responds naturally to cursor movement or device tilt, and adapts to device capabilities and battery status.

---

## Pride Mode Easter Egg

A hidden feature that transforms the constellation colors into various pride flag gradients. **Each constellation is randomly assigned a different flag**, creating a diverse, inclusive sky full of color.

### Activation & Re-randomization

**Desktop:** Hold `Shift` key and double-click anywhere to toggle pride mode ON/OFF. Each time you turn it on, flags are randomly reassigned to constellations.

**Mobile:** Triple-tap with two fingers to toggle ON/OFF and re-randomize.

**Keyboard shortcut:** Press `P` key three times quickly to toggle (doesn't require Shift)

When pride mode is **ON**, each constellation gets a random flag from the 11 available options. Scattered individual stars also get random flags. This creates a beautiful, diverse sky where you might see a trans flag constellation next to a lesbian flag constellation next to a gay flag constellation.

When you toggle pride mode **OFF** and back **ON** again, all flags are re-randomized to different constellations.

```javascript
const PRIDE_FLAGS = ['rainbow', 'trans', 'bisexual', 'lesbian', 'gay', 'pansexual', 'nonbinary', 'asexual', 'aromantic', 'genderfluid', 'agender'];

const [prideMode, setPrideMode] = useState(false); // Boolean: on or off
const [constellationFlags, setConstellationFlags] = useState({}); // Map: constellation_id -> flag_type

// Helper: Assign random flags to all constellations
const randomizeConstellationFlags = (constellations) => {
  const flagMap = {};
  constellations.forEach((constellation, index) => {
    // Each constellation gets a random flag
    const randomFlag = PRIDE_FLAGS[Math.floor(Math.random() * PRIDE_FLAGS.length)];
    flagMap[index] = randomFlag;
  });
  return flagMap;
};

// Desktop activation - toggles on/off and randomizes
onDoubleClick={(e) => {
  if (e.shiftKey) {
    setPrideMode(prev => {
      const newMode = !prev;
      if (newMode) {
        // Turning ON: randomize flags
        setConstellationFlags(randomizeConstellationFlags(constellations));
      }
      return newMode;
    });
  }
}}

// Keyboard shortcut - P pressed 3 times quickly
const [pKeyCount, setPKeyCount] = useState(0);
const pKeyTimerRef = useRef(null);

useEffect(() => {
  const handleKeyPress = (e) => {
    if (e.key.toLowerCase() === 'p') {
      setPKeyCount(prev => prev + 1);
      
      if (pKeyCount === 2) {
        setPrideMode(prev => {
          const newMode = !prev;
          if (newMode) {
            setConstellationFlags(randomizeConstellationFlags(constellations));
          }
          return newMode;
        });
        setPKeyCount(0);
      }
      
      // Reset counter after 500ms
      clearTimeout(pKeyTimerRef.current);
      pKeyTimerRef.current = setTimeout(() => {
        setPKeyCount(0);
      }, 500);
    }
  };
  
  window.addEventListener('keypress', handleKeyPress);
  return () => window.removeEventListener('keypress', handleKeyPress);
}, [pKeyCount]);

// Mobile activation (alternative)
const [touchCount, setTouchCount] = useState(0);
const touchTimerRef = useRef(null);

const handleTouchStart = (e) => {
  if (e.touches.length === 2) {
    setTouchCount(prev => prev + 1);
    
    if (touchCount === 2) {
      setPrideMode(prev => {
        const newMode = !prev;
        if (newMode) {
          setConstellationFlags(randomizeConstellationFlags(constellations));
        }
        return newMode;
      });
      setTouchCount(0);
    }
    
    // Reset counter after 500ms
    clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      setTouchCount(0);
    }, 500);
  }
};
```

### Flag Color Palettes

Each flag has its own vertical gradient applied to the constellations:

**1. Rainbow (Traditional 6-Stripe Pride)**
- Red → Orange → Yellow → Green → Blue → Purple

**2. Transgender**
- Light Blue → Pink → White → Pink → Light Blue

**3. Bisexual**
- Pink (top 40%) → Purple (middle 20%) → Blue (bottom 40%)

**4. Lesbian**
- Dark Orange → Orange → White → Pink → Magenta

**5. Gay (MLM - Men Loving Men)**
- Dark Teal → Teal → Light Green → White → Light Blue → Blue → Purple

**6. Pansexual**
- Pink → Yellow → Cyan

**7. Non-Binary**
- Yellow → White → Purple → Black

**8. Asexual**
- Black → Gray → White → Purple

**9. Aromantic**
- Dark Green → Light Green → White → Gray → Black

**10. Genderfluid**
- Pink → White → Purple → Black → Blue

**11. Agender**
- Black → Gray → White → Green → White → Gray → Black

### Implementation

```javascript
/**
 * Get color for a star based on Y position and current pride flag
 * Uses STEPPED gradients (hard color transitions) for authentic flag appearance
 */
const getPrideColor = (yPosition, flagType, containerHeight = window.innerHeight) => {
  if (flagType === 'off') return null;
  
  const percentage = yPosition / containerHeight;
  
  const flagPalettes = {
    rainbow: [
      { stop: 0.0, color: 'rgba(228, 3, 3, 0.9)' },      // Red
      { stop: 0.167, color: 'rgba(255, 140, 0, 0.9)' },  // Orange
      { stop: 0.333, color: 'rgba(255, 237, 0, 0.9)' },  // Yellow
      { stop: 0.5, color: 'rgba(0, 128, 38, 0.9)' },     // Green
      { stop: 0.667, color: 'rgba(36, 64, 142, 0.9)' },  // Blue
      { stop: 0.833, color: 'rgba(115, 41, 130, 0.9)' }, // Purple
      { stop: 1.0, color: 'rgba(115, 41, 130, 0.9)' }    // Purple
    ],
    
    trans: [
      { stop: 0.0, color: 'rgba(91, 206, 250, 0.9)' },   // Light Blue
      { stop: 0.2, color: 'rgba(245, 169, 184, 0.9)' },  // Pink
      { stop: 0.4, color: 'rgba(255, 255, 255, 0.9)' },  // White
      { stop: 0.6, color: 'rgba(245, 169, 184, 0.9)' },  // Pink
      { stop: 0.8, color: 'rgba(91, 206, 250, 0.9)' },   // Light Blue
      { stop: 1.0, color: 'rgba(91, 206, 250, 0.9)' }    // Light Blue
    ],
    
    bisexual: [
      { stop: 0.0, color: 'rgba(214, 2, 112, 0.9)' },    // Pink
      { stop: 0.4, color: 'rgba(214, 2, 112, 0.9)' },    // Pink (40%)
      { stop: 0.4, color: 'rgba(155, 79, 150, 0.9)' },   // Purple (hard transition)
      { stop: 0.6, color: 'rgba(155, 79, 150, 0.9)' },   // Purple (20%)
      { stop: 0.6, color: 'rgba(0, 56, 168, 0.9)' },     // Blue (hard transition)
      { stop: 1.0, color: 'rgba(0, 56, 168, 0.9)' }      // Blue (40%)
    ],
    
    lesbian: [
      { stop: 0.0, color: 'rgba(213, 45, 0, 0.9)' },     // Dark Orange
      { stop: 0.2, color: 'rgba(255, 154, 86, 0.9)' },   // Orange
      { stop: 0.4, color: 'rgba(255, 255, 255, 0.9)' },  // White
      { stop: 0.6, color: 'rgba(212, 97, 166, 0.9)' },   // Pink
      { stop: 0.8, color: 'rgba(163, 2, 98, 0.9)' },     // Magenta
      { stop: 1.0, color: 'rgba(163, 2, 98, 0.9)' }      // Magenta
    ],
    
    gay: [
      { stop: 0.0, color: 'rgba(7, 141, 112, 0.9)' },    // Dark Teal
      { stop: 0.143, color: 'rgba(38, 206, 170, 0.9)' }, // Teal
      { stop: 0.286, color: 'rgba(152, 232, 193, 0.9)' },// Light Green
      { stop: 0.429, color: 'rgba(255, 255, 255, 0.9)' },// White
      { stop: 0.571, color: 'rgba(123, 173, 227, 0.9)' },// Light Blue
      { stop: 0.714, color: 'rgba(80, 73, 203, 0.9)' },  // Blue
      { stop: 0.857, color: 'rgba(61, 26, 120, 0.9)' },  // Purple
      { stop: 1.0, color: 'rgba(61, 26, 120, 0.9)' }     // Purple
    ],
    
    pansexual: [
      { stop: 0.0, color: 'rgba(255, 33, 140, 0.9)' },   // Pink
      { stop: 0.333, color: 'rgba(255, 33, 140, 0.9)' }, // Pink (33%)
      { stop: 0.333, color: 'rgba(255, 216, 0, 0.9)' },  // Yellow (hard transition)
      { stop: 0.667, color: 'rgba(255, 216, 0, 0.9)' },  // Yellow (33%)
      { stop: 0.667, color: 'rgba(33, 177, 255, 0.9)' }, // Cyan (hard transition)
      { stop: 1.0, color: 'rgba(33, 177, 255, 0.9)' }    // Cyan (33%)
    ],
    
    nonbinary: [
      { stop: 0.0, color: 'rgba(252, 244, 52, 0.9)' },   // Yellow
      { stop: 0.25, color: 'rgba(252, 244, 52, 0.9)' },  // Yellow (25%)
      { stop: 0.25, color: 'rgba(255, 255, 255, 0.9)' }, // White (hard transition)
      { stop: 0.5, color: 'rgba(255, 255, 255, 0.9)' },  // White (25%)
      { stop: 0.5, color: 'rgba(156, 89, 209, 0.9)' },   // Purple (hard transition)
      { stop: 0.75, color: 'rgba(156, 89, 209, 0.9)' },  // Purple (25%)
      { stop: 0.75, color: 'rgba(44, 44, 44, 0.9)' },    // Black (hard transition)
      { stop: 1.0, color: 'rgba(44, 44, 44, 0.9)' }      // Black (25%)
    ],
    
    asexual: [
      { stop: 0.0, color: 'rgba(0, 0, 0, 0.9)' },        // Black
      { stop: 0.25, color: 'rgba(0, 0, 0, 0.9)' },       // Black (25%)
      { stop: 0.25, color: 'rgba(163, 163, 163, 0.9)' }, // Gray (hard transition)
      { stop: 0.5, color: 'rgba(163, 163, 163, 0.9)' },  // Gray (25%)
      { stop: 0.5, color: 'rgba(255, 255, 255, 0.9)' },  // White (hard transition)
      { stop: 0.75, color: 'rgba(255, 255, 255, 0.9)' }, // White (25%)
      { stop: 0.75, color: 'rgba(128, 0, 128, 0.9)' },   // Purple (hard transition)
      { stop: 1.0, color: 'rgba(128, 0, 128, 0.9)' }     // Purple (25%)
    ],
    
    aromantic: [
      { stop: 0.0, color: 'rgba(61, 165, 66, 0.9)' },    // Dark Green
      { stop: 0.2, color: 'rgba(167, 211, 121, 0.9)' },  // Light Green
      { stop: 0.4, color: 'rgba(255, 255, 255, 0.9)' },  // White
      { stop: 0.6, color: 'rgba(169, 169, 169, 0.9)' },  // Gray
      { stop: 0.8, color: 'rgba(0, 0, 0, 0.9)' },        // Black
      { stop: 1.0, color: 'rgba(0, 0, 0, 0.9)' }         // Black
    ],
    
    genderfluid: [
      { stop: 0.0, color: 'rgba(255, 117, 162, 0.9)' },  // Pink
      { stop: 0.2, color: 'rgba(255, 255, 255, 0.9)' },  // White
      { stop: 0.4, color: 'rgba(190, 24, 214, 0.9)' },   // Purple
      { stop: 0.6, color: 'rgba(0, 0, 0, 0.9)' },        // Black
      { stop: 0.8, color: 'rgba(51, 62, 189, 0.9)' },    // Blue
      { stop: 1.0, color: 'rgba(51, 62, 189, 0.9)' }     // Blue
    ],
    
    agender: [
      { stop: 0.0, color: 'rgba(0, 0, 0, 0.9)' },        // Black
      { stop: 0.143, color: 'rgba(185, 185, 185, 0.9)' },// Gray
      { stop: 0.286, color: 'rgba(255, 255, 255, 0.9)' },// White
      { stop: 0.429, color: 'rgba(183, 244, 132, 0.9)' },// Green
      { stop: 0.571, color: 'rgba(255, 255, 255, 0.9)' },// White
      { stop: 0.714, color: 'rgba(185, 185, 185, 0.9)' },// Gray
      { stop: 0.857, color: 'rgba(0, 0, 0, 0.9)' },      // Black
      { stop: 1.0, color: 'rgba(0, 0, 0, 0.9)' }         // Black
    ]
  };
  
  const colors = flagPalettes[flagType] || flagPalettes.rainbow;
  
  // Find which color band we're in (no interpolation - stepped gradient)
  for (let i = 0; i < colors.length - 1; i++) {
    if (percentage >= colors[i].stop && percentage < colors[i + 1].stop) {
      // Return the current band's color without blending
      return colors[i].color;
    }
  }
  
  // Return last color if we're at the very end
  return colors[colors.length - 1].color;
};
```

**Key Changes for Stepped Gradients:**
- No color interpolation between stops - each band is solid
- Hard transitions between colors (authentic to real pride flags)
- Some flags like bisexual and pansexual use duplicate stops to create hard edges (e.g., `stop: 0.4` appears twice with different colors)
- The function returns exact colors for each band, not blended values

### Visual Changes

When pride mode is active:

1. **Stars**: Each constellation's stars use **stepped gradient** colors from that constellation's randomly assigned flag

2. **Constellation Lines**: Each constellation's lines use the colors from its assigned flag with hard color stops for authentic appearance

3. **Glows**: Match each constellation's assigned pride flag colors instead of the default blue/white

4. **Diversity**: Looking up at the sky, you'll see a rainbow constellation next to a trans constellation next to a lesbian constellation - all together in the same view, creating a beautiful, inclusive representation

5. **Indicator**: A rainbow pride flag emoji (🏳️‍🌈) appears in bottom-right corner when pride mode is active (representing all flags collectively)

6. **Transitions**: Smooth 0.5s ease transition when toggling (only the transition is smooth, the colors remain stepped)

**Why Random Assignment?**
Instead of forcing all constellations to use the same flag, random assignment creates a more diverse and inclusive sky. Each flag gets representation, and the variety is visually striking - you might see all 11 different flags across your constellations simultaneously. This celebrates the full spectrum of LGBTQ+ identities together.

**Why Stepped Gradients?**
Real pride flags have distinct horizontal color bands, not smooth gradients. Using stepped gradients creates a more authentic, recognizable appearance that respects the original flag designs. Stars appear in solid color bands, and constellation lines show crisp color transitions as they cross between vertical bands.

```
SMOOTH GRADIENT (wrong):        STEPPED GRADIENT (correct):
┌─────────────────────┐        ┌─────────────────────┐
│ ████████████████████ │ Red    │ ████████████████████ │ Red
│ ████████████████████ │ ↓      │ ████████████████████ │ Red
│ ████████████████████ │ Blend  │ ──────────────────── │ ← Hard edge
│ ████████████████████ │ ↓      │ ████████████████████ │ Orange
│ ████████████████████ │ Orange │ ████████████████████ │ Orange
│ ████████████████████ │ ↓      │ ──────────────────── │ ← Hard edge
│ ████████████████████ │ Blend  │ ████████████████████ │ Yellow
│ ████████████████████ │ ↓      │ ████████████████████ │ Yellow
│ ████████████████████ │ Yellow │ ──────────────────── │ ← Hard edge
└─────────────────────┘        └─────────────────────┘
   Colors blend together           Distinct color bands
```

**Implementation Detail:**
The `getPrideColor()` function returns the exact color for each band without interpolation. Canvas line gradients sample colors at multiple points along the line and use near-duplicate stops to create hard transitions.

### Pride Mode Indicator Component

```jsx
const PrideModeIndicator = ({ prideMode }) => {
  if (!prideMode) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      fontSize: '20px',
      opacity: 0.7,
      zIndex: 1000,
      transition: 'opacity 0.3s ease',
      cursor: 'pointer',
      userSelect: 'none'
    }}
    title="Pride Mode Active - All Flags"
    >
      🏳️‍🌈
    </div>
  );
};
```

### Implementation Notes

- Pride mode is a simple boolean toggle (ON/OFF)
- When enabled, each constellation is randomly assigned one of the 11 pride flags
- Each flag uses **stepped gradients** (hard color transitions) for authentic flag appearance
- Each flag has authentic color values from official pride flag specifications
- No smooth blending between color bands - maintains distinct horizontal stripes
- Re-randomizes flags each time pride mode is turned on
- All 11 flags can appear simultaneously across different constellations
- The gradient remains fixed in viewport space, not rotated with the sky
- Works in all performance tiers (though glows may be simplified in low tier)
- State persists until toggled off (flags stay assigned to their constellations)
- Can be combined with theme switching (pride colors work on both light/dark backgrounds)
- Smooth state transitions when toggling (the transition animation is smooth, but colors remain stepped)

### Accessibility

The pride mode respects `prefers-reduced-motion` by disabling the smooth transition animations but still allowing the color change.

---

## Design Specifications

### Theme Colors

**Dark Mode:**
- Background: `#0a0f14`
- Star colors: `rgba(220, 235, 255, 0.3-1.0)` (light blue/white, varying by depth)
- Star glow: Light blue/white (`rgba(200, 220, 255, 0.6)`)
- Line colors: `rgba(180, 200, 255, 0.4)`
- Line glow: `rgba(200, 220, 255, 0.3)`

**Light Mode:**
- Background: `#e8ecf0`
- Star colors: `rgba(40, 60, 80, 0.5-1.0)` (dark blue/gray, varying by depth)
- Star glow: Dark blue/gray (`rgba(20, 40, 60, 0.5)`)
- Line colors: `rgba(60, 80, 100, 0.3)`
- Line glow: `rgba(40, 60, 80, 0.2)`

### ASCII Characters by Layer

**Layer 1 (Deep Space):**
- `·` (middle dot)
- `.` (period)

**Layer 2 (Mid Distance):**
- `*` (asterisk)
- `+` (plus)
- `·` (middle dot)

**Layer 3 (Foreground):**
- `✦` (four-pointed star)
- `✧` (small star)
- `*` (asterisk)
- `◦` (white bullet)

---

## Implementation Checklist

### Core Features
- [ ] Set up container with refs for canvas and mouse tracking
- [ ] Implement procedural constellation generation algorithm
- [ ] Create open connection generation with branch detection
- [ ] Generate 12-15 constellations with 3-8 stars each
- [ ] Add 40+ scattered individual stars
- [ ] Create 3 star layers with appropriate depth values (0.1, 0.25, 0.5)

### Sky Rotation
- [ ] Add sky-rotation-container wrapper around star layers
- [ ] Implement CSS animation for 360° rotation (600s duration)
- [ ] Add Page Visibility API to pause when tab is hidden
- [ ] Detect and disable rotation for battery saver mode
- [ ] Respect prefers-reduced-motion media query

### Mouse Parallax
- [ ] Implement mouse move handler with RAF throttling
- [ ] Add parallax transform updates for each layer
- [ ] Support device orientation on mobile (with iOS permission)
- [ ] Implement adaptive parallax range based on performance tier

### Rendering
- [ ] Render ASCII stars with appropriate glows
- [ ] Draw open constellation lines on canvas (no closed loops)
- [ ] Support pride mode gradient for stars and lines

### Themes
- [ ] Implement light/dark mode theme switching
- [ ] Add pride mode with random flag assignment per constellation
- [ ] Implement 11 pride flag palettes (Rainbow, Trans, Bisexual, Lesbian, Gay/MLM, Pansexual, Non-Binary, Asexual, Aromantic, Genderfluid, Agender)
- [ ] Create flag randomization system
- [ ] Add pride mode indicator (rainbow flag emoji)
- [ ] Support stepped gradients for stars and constellation lines
- [ ] Smooth transitions between theme modes

### Performance
- [ ] Add CSS optimizations (`will-change`, `translate3d`)
- [ ] Memoize star components
- [ ] Implement performance tier detection (high/medium/low)
- [ ] Add battery level detection and low power mode
- [ ] Implement viewport culling for mobile
- [ ] Add FPS throttling for medium/low performance tiers

### Accessibility & Compatibility
- [ ] Add `prefers-reduced-motion` support
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Add vendor prefixes for older browsers
- [ ] Implement feature detection and fallbacks
- [ ] Test on iOS Safari and Android Chrome

### Optional Enhancements
- [ ] Add optional twinkle animation
- [ ] Add pride mode indicator (flag emoji)
- [ ] Implement constellation fade-in on mount
- [ ] Add keyboard shortcuts for toggling features

---

This architecture keeps the main thread free for dashboard data updates while delivering a beautiful, immersive ASCII constellation background that rotates slowly like a starscape time-lapse (complete rotation every 10 minutes), responds naturally to cursor movement or device tilt, adapts intelligently to device capabilities and battery status, and includes a hidden pride mode easter egg where each constellation is randomly assigned one of 11 inclusive pride flags (Rainbow, Trans, Bisexual, Lesbian, Gay/MLM, Pansexual, Non-Binary, Asexual, Aromantic, Genderfluid, and Agender), creating a diverse, celebratory sky that represents the full LGBTQ+ community. The system works seamlessly across desktop and mobile, respects accessibility preferences, and gracefully degrades on older browsers.
