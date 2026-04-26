// Travel profile app — globe + profile header
const { useEffect, useRef, useState } = React;

// ─────────────────────────────────────────────────────────────
// Profile data
// ─────────────────────────────────────────────────────────────
const PROFILE = {
  name: 'Sofia Marquez',
  handle: '@sofiawanders',
  bio: 'Slow traveler chasing golden hours, hand-thrown ceramics, and the noise of unfamiliar markets.',
  stats: [
    { label: 'Countries', value: '24' },
    { label: 'Posts',     value: '186' },
    { label: 'Followers', value: '4.2K' },
  ],
};

const VISITED_NAMES = new Set(['Portugal', 'Japan', 'Morocco', 'France', 'Brazil', 'Thailand']);

// Continent centroids (lat, lon)
// Coordenadas para DETECCAO (lon = lon_geografico + 172, sistema do raycasting)
const CONTINENTS = {
  Europe:        { lat: 52,  lon: -173 },
  Asia:          { lat: 45,  lon: -98  },
  Africa:        { lat: 5,   lon: -166 },
  'N. America':  { lat: 48,  lon: 72   },
  'S. America':  { lat: -15, lon: 114  },
  Oceania:       { lat: -28, lon: -50  },
};

// Coordenadas para ZOOM (lon geografico real)
const CONTINENT_ZOOM = {
  Europe:        { lat: 52,  lon: 15   },
  Asia:          { lat: 45,  lon: 90   },
  Africa:        { lat: 5,   lon: 22   },
  'N. America':  { lat: 48,  lon: -100 },
  'S. America':  { lat: -15, lon: -58  },
  Oceania:       { lat: -28, lon: 138  },
};

// ─────────────────────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────────────────────
function Avatar({ size = 72 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      padding: 3,
      background: 'linear-gradient(135deg, #FFE066 0%, #FFB800 50%, #C68B00 100%)',
      boxShadow: '0 4px 14px rgba(198, 139, 0, 0.35)',
      flexShrink: 0,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #E8C9A8 0%, #C9A487 55%, #8E6B4E 100%)',
        position: 'relative', overflow: 'hidden',
        boxShadow: 'inset 0 0 0 2px #F5F0E8',
      }}>
        <div style={{
          position: 'absolute', left: '50%', top: '64%', transform: 'translate(-50%, -50%)',
          width: '70%', height: '60%', borderRadius: '50% 50% 45% 45%',
          background: 'linear-gradient(180deg, #D9B891 0%, #A8835E 100%)',
        }} />
        <div style={{
          position: 'absolute', left: '50%', top: '38%', transform: 'translate(-50%, -50%)',
          width: '46%', height: '46%', borderRadius: '50%',
          background: 'linear-gradient(180deg, #E8C9A8 0%, #B68F6A 100%)',
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Profile header
// ─────────────────────────────────────────────────────────────
function ProfileHeader() {
  return (
    <div style={{
      background: '#F5F0E8',
      padding: '52px 22px 18px',
      position: 'relative',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 80% 0%, rgba(255,217,61,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', display: 'flex', gap: 14, alignItems: 'center' }}>
        <Avatar size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: 24, fontWeight: 600, lineHeight: 1.05,
            color: '#2A2520', letterSpacing: -0.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{PROFILE.name}</div>
          <div style={{
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            fontSize: 12, color: '#8A7A65', marginTop: 4,
            letterSpacing: 0.2,
          }}>{PROFILE.handle}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#8A7A65' }}>📍</span>
            <span style={{
              fontFamily: '-apple-system, system-ui, sans-serif',
              fontSize: 12, color: '#6B5D4A', fontWeight: 500,
            }}>Lisbon · currently in Kyoto</span>
          </div>
        </div>
        <button style={{
          padding: '7px 14px', borderRadius: 100,
          border: '1px solid #2A2520', background: 'transparent',
          fontFamily: '-apple-system, system-ui, sans-serif',
          fontSize: 12, fontWeight: 600, color: '#2A2520',
          cursor: 'pointer', whiteSpace: 'nowrap',
          letterSpacing: 0.2, alignSelf: 'flex-start',
        }}>Edit</button>
      </div>

      <div style={{
        marginTop: 14,
        fontFamily: '-apple-system, system-ui, sans-serif',
        fontSize: 13.5, lineHeight: 1.5, color: '#4A3F30',
        textWrap: 'pretty',
      }}>{PROFILE.bio}</div>

      <div style={{
        marginTop: 18, display: 'flex',
        borderTop: '1px solid rgba(184, 168, 152, 0.45)',
        borderBottom: '1px solid rgba(184, 168, 152, 0.45)',
        paddingTop: 14, paddingBottom: 14,
      }}>
        {PROFILE.stats.map((s, i) => (
          <div key={s.label} style={{
            flex: 1, textAlign: 'center',
            borderLeft: i > 0 ? '1px solid rgba(184, 168, 152, 0.45)' : 'none',
          }}>
            <div style={{
              fontFamily: '-apple-system, system-ui, sans-serif',
              fontSize: 22, fontWeight: 800, color: '#FFB800',
              letterSpacing: -0.5, lineHeight: 1,
            }}>{s.value}</div>
            <div style={{
              fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
              fontSize: 9.5, color: '#8A7A65', marginTop: 6,
              textTransform: 'uppercase', letterSpacing: 1.4,
            }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Build country textures via 2D canvas + d3-geo equirectangular
// Returns { baseTexture, glowTexture } for use on Three.js sphere.
// ─────────────────────────────────────────────────────────────
function buildEquirectTexture(geojson, options = {}) {
  const W = 4096, H = 2048;

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Equirectangular: lon -180..180 → 0..W, lat 90..-90 → 0..H
  const project = (lon, lat) => [(lon + 180) / 360 * W, (90 - lat) / 180 * H];

  // Ocean
  ctx.fillStyle = '#C8D8E8';
  ctx.fillRect(0, 0, W, H);

  const drawRing = (ring) => {
    if (ring.length < 2) return;
    ctx.beginPath();
    const [x0, y0] = project(ring[0][0], ring[0][1]);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < ring.length; i++) {
      const [x, y] = project(ring[i][0], ring[i][1]);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
  };

  const drawFeature = (f, fillStyle, strokeStyle, lineWidth) => {
    const polys = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
    polys.forEach(poly => {
      // Outer + holes
      ctx.beginPath();
      poly.forEach(ring => {
        const [x0, y0] = project(ring[0][0], ring[0][1]);
        ctx.moveTo(x0, y0);
        for (let i = 1; i < ring.length; i++) {
          const [x, y] = project(ring[i][0], ring[i][1]);
          ctx.lineTo(x, y);
        }
        ctx.closePath();
      });
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill('evenodd');
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth || 1;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    });
  };

  // First pass: all countries
  geojson.features.forEach(f => {
    const visited = VISITED_NAMES.has(f.properties.name);
    if (!visited) {
      drawFeature(f, '#D4C9B0', '#B8A898', 1.6);
    }
  });

  // Second pass: visited (drawn after, on top, with golden fill + glow stroke)
  geojson.features.forEach(f => {
    const visited = VISITED_NAMES.has(f.properties.name);
    if (visited) {
      // Outer glow first
      ctx.save();
      ctx.shadowColor = '#FFD93D';
      ctx.shadowBlur = 18;
      drawFeature(f, '#FFD93D', '#FFE680', 2.2);
      ctx.restore();
    }
  });

  // Build a separate "elevation/glow" texture: only visited countries on
  // transparent background, with bright glow — used on a slightly larger
  // sphere to fake elevation + glow above the base map.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = W; glowCanvas.height = H;
  const gctx = glowCanvas.getContext('2d');
  // Transparent base
  geojson.features.forEach(f => {
    if (!VISITED_NAMES.has(f.properties.name)) return;
    const polys = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
    polys.forEach(poly => {
      gctx.beginPath();
      poly.forEach(ring => {
        const [x0, y0] = project(ring[0][0], ring[0][1]);
        gctx.moveTo(x0, y0);
        for (let i = 1; i < ring.length; i++) {
          const [x, y] = project(ring[i][0], ring[i][1]);
          gctx.lineTo(x, y);
        }
        gctx.closePath();
      });
      gctx.save();
      gctx.shadowColor = '#FFD93D';
      gctx.shadowBlur = 26;
      gctx.fillStyle = '#FFD93D';
      gctx.fill('evenodd');
      gctx.restore();
      gctx.strokeStyle = '#FFEEB0';
      gctx.lineWidth = 2.4;
      gctx.lineJoin = 'round';
      gctx.stroke();
    });
  });

  return { canvas, glowCanvas };
}

// ─────────────────────────────────────────────────────────────
// Globe (Three.js)
// ─────────────────────────────────────────────────────────────
function Globe({ onContinentClick, activeContinent }) {
  const mountRef = useRef(null);
  const sceneState = useRef({});


  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const THREE = window.THREE;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Lights — warm key + warm rim
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xfff2cc, 1.0);
    keyLight.position.set(3, 2, 4);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xffb84d, 1.2);
    rimLight.position.set(-4, 1, -3);
    scene.add(rimLight);
    const fillLight = new THREE.DirectionalLight(0x88aacc, 0.3);
    fillLight.position.set(-2, -3, 2);
    scene.add(fillLight);

    const R = 2;

    // Atmosphere shell (soft golden halo behind)
    const atmoGeo = new THREE.SphereGeometry(R * 1.08, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(0xFFD93D) } },
      vertexShader: `varying vec3 vN; void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 glowColor; varying vec3 vN; void main() { float i = pow(0.7 - dot(vN, vec3(0,0,1.0)), 3.0); gl_FragColor = vec4(glowColor, 1.0) * i * 0.6; }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    scene.add(new THREE.Mesh(atmoGeo, atmoMat));

    // Globe group (rotates as a whole)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Placeholder ocean while textures load
    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0xC8D8E8, specular: 0x668899, shininess: 18,
      emissive: 0x33455a, emissiveIntensity: 0.08,
    });
    const baseMesh = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 96), oceanMat);
    globeGroup.add(baseMesh);

    // Drag rotation + auto-rotate + inertia
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let rotX = 0.25;
    let rotY = 0.0;
    let velY = 0.0025;
    let velX = 0;
    let downPos = null;

    const onDown = (e) => {
      isDragging = true;
      const t = e.touches ? e.touches[0] : e;
      lastX = t.clientX; lastY = t.clientY;
      downPos = { x: t.clientX, y: t.clientY };
      velX = 0; velY = 0;
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const t = e.touches ? e.touches[0] : e;
      const dx = t.clientX - lastX;
      const dy = t.clientY - lastY;
      lastX = t.clientX; lastY = t.clientY;
      rotY += dx * 0.005;
      rotX += dy * 0.005;
      rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotX));
      velX = dy * 0.0008;
      velY = dx * 0.0008;
      // Suppress click if dragged
      if (downPos && Math.hypot(t.clientX - downPos.x, t.clientY - downPos.y) > 5) {
        downPos = null;
      }
    };
    const onUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      // Só retoma auto-rotate se não há continente seleccionado
      setTimeout(() => {
        if (!sceneState.current.zooming && !sceneState.current.continentActive && Math.abs(velY) < 0.001) velY = 0.0025;
      }, 1500);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onDown);
    dom.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);

    // Click → continent
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    dom.addEventListener('click', (e) => {
      if (!downPos) return;
      const rect = dom.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(baseMesh);
      if (!hits.length) return;
      const worldPt = hits[0].point.clone();
      const localPt = globeGroup.worldToLocal(worldPt);
      const norm = localPt.clone().normalize();
      const lat = Math.asin(Math.max(-1, Math.min(1, norm.y))) * 180 / Math.PI;
      let lon = Math.atan2(norm.x, norm.z) * 180 / Math.PI + 90;
      while (lon < -180) lon += 360;
      while (lon > 180) lon -= 360;
      let best = null, bestDist = Infinity;
      Object.entries(CONTINENTS).forEach(([name, c]) => {
        const dlon = ((lon - c.lon + 540) % 360) - 180;
        const dlat = lat - c.lat;
        const a = Math.sin(dlat * Math.PI / 360) ** 2 +
                  Math.cos(lat * Math.PI / 180) * Math.cos(c.lat * Math.PI / 180) *
                  Math.sin(dlon * Math.PI / 360) ** 2;
        const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        if (d < bestDist) { bestDist = d; best = name; }
      });
      if (best) onContinentClick(best);
    });

    // Animate
    let raf;
    const tick = () => {
      // Inertia
      rotX += velX;
      velX *= 0.94;
      if (!isDragging && !sceneState.current.targetRot && !sceneState.current.zooming && !sceneState.current.continentActive && velY !== 0) {
        // Gentle auto-rotate só quando não há continente seleccionado
        rotY += velY;
        velY = Math.abs(velY) > 0.0026 ? velY * 0.96 : 0.0025;
      } else if (isDragging) {
        rotY += velY;
      }
      rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotX));

      // Smooth target rotation
      const tr = sceneState.current.targetRot;
      if (tr) {
        let dy = tr.y - rotY;
        // shortest path
        while (dy > Math.PI) dy -= 2 * Math.PI;
        while (dy < -Math.PI) dy += 2 * Math.PI;
        rotY += dy * 0.07;
        rotX += (tr.x - rotX) * 0.07;
        if (Math.abs(dy) < 0.005 && Math.abs(tr.x - rotX) < 0.005) {
          sceneState.current.targetRot = null;
          sceneState.current.zooming = false;
        }
      }

      globeGroup.rotation.x = rotX;
      globeGroup.rotation.y = rotY;

      // Camera zoom
      if (sceneState.current.targetZ != null) {
        camera.position.z += (sceneState.current.targetZ - camera.position.z) * 0.08;
        if (Math.abs(camera.position.z - sceneState.current.targetZ) < 0.02) {
          sceneState.current.targetZ = null;
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    sceneState.current.zoomTo = (lat, lon, name) => {
      sceneState.current.zooming = true;
      sceneState.current.continentActive = true;
      // Para por lon em frente da camara (+z): rotY = (90 - lon) * PI/180
      const targetY = (-lon - 83) * Math.PI / 180;
      const targetX = (lat - 7) * Math.PI / 180;
      sceneState.current.targetRot = { x: targetX, y: targetY };
      // Asia precisa de mais distancia por ser maior
      const zoomByContinent = { 'Asia': 9.5 };
      sceneState.current.targetZ = zoomByContinent[name] || 7.5;
      velY = 0;
    };
    sceneState.current.resetZoom = () => {
      sceneState.current.targetZ = 8.5;
      sceneState.current.zooming = false;
      sceneState.current.continentActive = false;
      velY = 0.0025;
    };

    // Resize
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // Load countries → bake textures
    let cancelled = false;
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(topo => {
        if (cancelled) return;
        const geojson = window.topojson.feature(topo, topo.objects.countries);
        const { canvas: baseCanvas, glowCanvas } = buildEquirectTexture(geojson);

        const baseTex = new THREE.CanvasTexture(baseCanvas);
        baseTex.needsUpdate = true;
        baseTex.minFilter = THREE.LinearFilter;
        baseTex.magFilter = THREE.LinearFilter;
        baseTex.generateMipmaps = false;
        baseTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        baseMesh.material.dispose();
        baseMesh.material = new THREE.MeshPhongMaterial({
          map: baseTex,
          specular: 0x3a2a14,
          shininess: 6,
          emissive: 0xffffff,
          emissiveMap: baseTex,
          emissiveIntensity: 0.55,
        });
        baseMesh.material.needsUpdate = true;

        // The visited countries are already painted (golden + glow) into
        // the base texture, so we don't need an overlay layer. Skipping any
        // additional sphere keeps z-fighting and alpha-blend issues away.

        console.log('[globe] textures baked & applied');
      })
      .catch(err => console.error('[globe] load failed', err));

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener('mousedown', onDown);
      dom.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
      if (dom.parentNode === mount) mount.removeChild(dom);
      renderer.dispose();
    };
  }, []);

  // External activeContinent → trigger zoom
  useEffect(() => {
    if (!activeContinent) {
      sceneState.current.resetZoom?.();
      return;
    }
    const c = CONTINENT_ZOOM[activeContinent];
    if (c) sceneState.current.zoomTo?.(c.lat, c.lon, activeContinent);
  }, [activeContinent]);

  return (
    <div ref={mountRef} style={{
      width: '100%', height: '100%',
      position: 'relative',
      cursor: 'grab',
      touchAction: 'none',
    }} />
  );
}

// ─────────────────────────────────────────────────────────────
// Globe overlay (label + back button + legend)
// ─────────────────────────────────────────────────────────────
function GlobeOverlay({ activeContinent, onReset }) {
  return (
    <>
      <div style={{
        position: 'absolute', top: 14, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        pointerEvents: 'none', zIndex: 5,
      }}>
        <div style={{
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontSize: 10, color: 'rgba(80, 65, 45, 0.6)',
          textTransform: 'uppercase', letterSpacing: 2,
        }}>Travel Map</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
          fontSize: 10, color: 'rgba(80, 65, 45, 0.6)',
          textTransform: 'uppercase', letterSpacing: 2,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#FFD93D',
            boxShadow: '0 0 8px #FFD93D',
          }} />
          6 visited
        </div>
      </div>

      {activeContinent && (
        <div style={{
          position: 'absolute', top: 40, left: 16,
          pointerEvents: 'auto', zIndex: 5,
        }}>
          <button onClick={onReset} style={{
            padding: '6px 12px', borderRadius: 100,
            border: '1px solid rgba(180, 140, 0, 0.4)',
            background: 'rgba(255, 248, 220, 0.85)',
            backdropFilter: 'blur(10px)',
            fontFamily: '-apple-system, system-ui, sans-serif',
            fontSize: 11, fontWeight: 600, color: '#8A6800',
            cursor: 'pointer', letterSpacing: 0.3,
          }}>← {activeContinent}</button>
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 50, left: 16,
        display: 'flex', flexDirection: 'column', gap: 6,
        pointerEvents: 'none', zIndex: 5,
      }}>
        {[
          { c: '#FFD93D', l: 'Visited', glow: true },
          { c: '#D4C9B0', l: 'Unvisited' },
        ].map(item => (
          <div key={item.l} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
            fontSize: 10, color: 'rgba(80, 65, 45, 0.7)',
            letterSpacing: 1,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 2,
              background: item.c,
              boxShadow: item.glow ? `0 0 8px ${item.c}` : 'none',
            }} />
            {item.l}
          </div>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        pointerEvents: 'none', zIndex: 5,
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        fontSize: 9, color: 'rgba(80, 65, 45, 0.4)',
        letterSpacing: 1.5, textTransform: 'uppercase',
      }}>
        Drag · Tap continent
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Globe section
// ─────────────────────────────────────────────────────────────
function GlobeSection() {
  const [activeContinent, setActiveContinent] = useState(null);


  return (
    <div style={{
      flex: 1, position: 'relative',
      background: 'radial-gradient(ellipse at 50% 35%, #EDE8DF 0%, #D8D0C4 100%)',
      overflow: 'hidden',
      minHeight: 0,
    }}>
      <Globe
        activeContinent={activeContinent}
        onContinentClick={setActiveContinent}
      />
      <GlobeOverlay
        activeContinent={activeContinent}
        onReset={() => setActiveContinent(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────
function App() {
  return (
    <IOSDevice width={402} height={874}>
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        background: '#F5F0E8',
      }}>
        <ProfileHeader />
        <GlobeSection />
      </div>
    </IOSDevice>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <div style={{
    minHeight: '100vh', width: '100%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24, boxSizing: 'border-box',
    background: 'radial-gradient(ellipse at 50% 30%, #2a2520 0%, #14110d 100%)',
  }}>
    <App />
  </div>
);

Object.assign(window, { App });