'use client'

import { useEffect, useRef, useState } from 'react'

const CONTINENTS: Record<string, { lat: number; lon: number }> = {
  Europe:       { lat: 52,  lon: -173 },
  Asia:         { lat: 45,  lon: -98  },
  Africa:       { lat: 5,   lon: -166 },
  'N. America': { lat: 48,  lon: 72   },
  'S. America': { lat: -15, lon: 114  },
  Oceania:      { lat: -28, lon: -50  },
}

const CONTINENT_ZOOM: Record<string, { lat: number; lon: number }> = {
  Europe:       { lat: 52,  lon: 15   },
  Asia:         { lat: 45,  lon: 90   },
  Africa:       { lat: 5,   lon: 22   },
  'N. America': { lat: 48,  lon: -100 },
  'S. America': { lat: -15, lon: -58  },
  Oceania:      { lat: -28, lon: 138  },
}

interface GlobeProps {
  visitedCountries: string[]
  activeContinent: string | null
  onContinentClick: (name: string) => void
  onCountryClick?: (countryName: string) => void
  userLocation?: string
  feedMode?: boolean
  feedTab?: 'following' | 'discover'
  onSceneReady?: (reset: () => void) => void
  onSearchReady?: (search: (name: string) => boolean) => void
  onResetReady?: (reset: () => void) => void
}

function buildReliefTexture(geojson: any, visitedNames: Set<string>) {
  const W = 4096, H = 2048
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Fundo completamente transparente
  ctx.clearRect(0, 0, W, H)

  const project = (lon: number, lat: number): [number, number] => [
    (lon + 180) / 360 * W,
    (90 - lat) / 180 * H
  ]

  geojson.features.forEach((f: any) => {
    if (!visitedNames.has(f.properties.name)) return
    const polys = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates
    polys.forEach((poly: any) => {
      ctx.beginPath()
      poly.forEach((ring: any) => {
        let penDown = false
        for (let i = 0; i < ring.length; i++) {
          const [x, y] = project(ring[i][0], ring[i][1])
          if (!penDown) { ctx.moveTo(x, y); penDown = true }
          else {
            const [px] = project(ring[i - 1][0], ring[i - 1][1])
            if (Math.abs(x - px) > W / 2) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
      })
      // Fill dourado com glow
      ctx.save()
      ctx.shadowColor = '#FFD93D'
      ctx.shadowBlur = 30
      ctx.fillStyle = '#FFE066'
      ctx.fill('evenodd')
      ctx.restore()
      // Fronteira escura por cima para separar países vizinhos
      ctx.strokeStyle = 'rgba(180, 120, 0, 0.85)'
      ctx.lineWidth = 3.5
      ctx.lineJoin = 'round'
      ctx.stroke()
    })
  })

  return canvas
}

function buildEquirectTexture(geojson: any, visitedNames: Set<string>) {
  const W = 4096, H = 2048
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  const project = (lon: number, lat: number): [number, number] => [
    (lon + 180) / 360 * W,
    (90 - lat) / 180 * H
  ]

  ctx.fillStyle = '#C8D8E8'
  ctx.fillRect(0, 0, W, H)

  const drawFeature = (f: any, fillStyle: string, strokeStyle: string, lineWidth: number) => {
    const polys = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates
    polys.forEach((poly: any) => {
      ctx.beginPath()
      poly.forEach((ring: any) => {
        let penDown = false
        for (let i = 0; i < ring.length; i++) {
          const [x, y] = project(ring[i][0], ring[i][1])
          if (!penDown) {
            ctx.moveTo(x, y)
            penDown = true
          } else {
            // Detetar salto de antimeridiano — diferenca > metade da largura
            const [px] = project(ring[i - 1][0], ring[i - 1][1])
            if (Math.abs(x - px) > W / 2) {
              ctx.moveTo(x, y) // levantar caneta em vez de tracar linha
            } else {
              ctx.lineTo(x, y)
            }
          }
        }
        ctx.closePath()
      })
      ctx.fillStyle = fillStyle
      ctx.fill('evenodd')
      if (lineWidth > 0) {
        ctx.strokeStyle = strokeStyle
        ctx.lineWidth = lineWidth
        ctx.lineJoin = 'round'
        ctx.stroke()
      }
    })
  }

  geojson.features.forEach((f: any) => {
    if (!visitedNames.has(f.properties.name)) {
      drawFeature(f, '#D4C9B0', '#B8A898', 1.6)
    }
  })

  geojson.features.forEach((f: any) => {
    if (visitedNames.has(f.properties.name)) {
      ctx.save()
      ctx.shadowColor = '#FFD93D'
      ctx.shadowBlur = 18
      drawFeature(f, '#FFD93D', '#FFE680', 2.2)
      ctx.restore()
    }
  })

  return canvas
}

export default function Globe({ visitedCountries, activeContinent, onContinentClick, onCountryClick, userLocation, feedMode, feedTab, onSceneReady, onSearchReady, onResetReady }: GlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneState = useRef<any>({})
  const geojsonRef = useRef<any>(null)
  const visitedRef = useRef<string[]>(visitedCountries)
  visitedRef.current = visitedCountries
  const feedModeRef = useRef(feedMode)
  feedModeRef.current = feedMode
  const locationRef = useRef<string | undefined>(userLocation)
  locationRef.current = userLocation

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    console.log('mount dimensions:', mount.clientWidth, mount.clientHeight)

    let THREE: any
    try { THREE = (window as any).THREE } catch { return }
    if (!THREE) { console.log('THREE not found'); return }
    console.log('THREE ok')

    const W = mount.clientWidth
    const H = mount.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(35, W / H, 0.1, 100)
    camera.position.set(0, 0, 8.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H)
    renderer.setClearColor(feedMode ? 0x0d0d1a : 0x000000, feedMode ? 1 : 0)
    mount.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const keyLight = new THREE.DirectionalLight(0xfff2cc, 1.0)
    keyLight.position.set(3, 2, 4)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0xffb84d, 1.2)
    rimLight.position.set(-4, 1, -3)
    scene.add(rimLight)

    const R = 2
    const atmoGeo = new THREE.SphereGeometry(R * 1.08, 64, 64)
    const atmoMat = new THREE.ShaderMaterial({
      uniforms: { glowColor: { value: new THREE.Color(0xFFD93D) } },
      vertexShader: `varying vec3 vN; void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform vec3 glowColor; varying vec3 vN; void main() { float i = pow(0.7 - dot(vN, vec3(0,0,1.0)), 3.0); gl_FragColor = vec4(glowColor, 1.0) * i * 0.6; }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(atmoGeo, atmoMat))

    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    const oceanMat = new THREE.MeshPhongMaterial({
      color: 0xC8D8E8, specular: 0x668899, shininess: 18,
      emissive: 0x33455a, emissiveIntensity: 0.08,
    })
    const baseMesh = new THREE.Mesh(new THREE.SphereGeometry(R, 96, 96), oceanMat)
    globeGroup.add(baseMesh)

    // Esfera de relevo — ligeiramente maior, só países visitados
    const reliefMat = new THREE.MeshPhongMaterial({
      transparent: true, opacity: 0,
      depthWrite: false,
      shininess: 40,
      specular: new THREE.Color(0xFFD93D).multiplyScalar(0.3),
    })
    // No feedMode sem relevo — esfera do mesmo tamanho
    const reliefRadius = feedMode ? R * 1.001 : R * 1.03
    const reliefMesh = new THREE.Mesh(new THREE.SphereGeometry(reliefRadius, 96, 96), reliefMat)
    globeGroup.add(reliefMesh)

    // Pushpin de localização atual
    let locationPinGroup: any = null
    const addLocationPin = (lat: number, lon: number) => {
      if (locationPinGroup) { globeGroup.remove(locationPinGroup); locationPinGroup = null }
      const group = new THREE.Group()

      const redMat = new THREE.MeshPhongMaterial({
        color: 0xdd2222, emissive: 0xaa0000, emissiveIntensity: 0.3,
        shininess: 120, specular: new THREE.Color(0xffffff).multiplyScalar(0.6),
      })
      const silverMat = new THREE.MeshPhongMaterial({
        color: 0xcccccc, shininess: 200, specular: new THREE.Color(0xffffff),
      })

      // Cabeça achatada fofa — pequena e redonda
      const headGeo = new THREE.SphereGeometry(0.042, 16, 14)
      headGeo.scale(1, 0.7, 1)
      const head = new THREE.Mesh(headGeo, redMat)
      head.position.y = -0.11
      group.add(head)

      // Highlight cute na cabeça
      const highlightGeo = new THREE.SphereGeometry(0.014, 8, 8)
      const highlightMat = new THREE.MeshPhongMaterial({
        color: 0xff9999, emissive: 0xff6666, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.7, shininess: 200,
      })
      const highlight = new THREE.Mesh(highlightGeo, highlightMat)
      highlight.position.set(-0.012, -0.085, 0.025)
      group.add(highlight)

      // Pescoço fino
      const neckGeo = new THREE.CylinderGeometry(0.009, 0.015, 0.03, 10)
      const neck = new THREE.Mesh(neckGeo, redMat)
      neck.position.y = -0.078
      group.add(neck)

      // Corpo redondo (barriga fofa)
      const bodyGeo = new THREE.SphereGeometry(0.033, 14, 12)
      bodyGeo.scale(1, 1.15, 1)
      const body = new THREE.Mesh(bodyGeo, redMat)
      body.position.y = -0.037
      group.add(body)

      // Ponta metálica fina
      const tipGeo = new THREE.ConeGeometry(0.005, 0.07, 8)
      const tip = new THREE.Mesh(tipGeo, silverMat)
      tip.position.y = 0.035
      group.add(tip)

      // Anel de glow subtil
      const ringGeo = new THREE.RingGeometry(0.038, 0.052, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff4444, transparent: true, opacity: 0.2, side: THREE.DoubleSide,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.y = 0.065
      group.add(ring)

      // Posicionar no globo — a ponta toca na superfície
      const phi = (90 - lat) * Math.PI / 180
      const theta = (lon + 180) * Math.PI / 180
      const pos = new THREE.Vector3(
        -Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      ).multiplyScalar(R * 1.02)
      group.position.copy(pos)
      group.lookAt(new THREE.Vector3(0, 0, 0))
      group.rotateX(Math.PI / 2)  // ponta aponta para o globo
      locationPinGroup = group
      globeGroup.add(group)
    }

    // Geocoding da localização
    const geocodeLocation = async (location: string) => {
      if (!location) return
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`)
        const data = await res.json()
        if (data.length > 0) {
          addLocationPin(parseFloat(data[0].lat), parseFloat(data[0].lon))
          sceneState.current.locationFound = true
        } else {
          sceneState.current.locationFound = false
          console.warn('[globe] Localização não encontrada:', location)
        }
      } catch (e) {
        sceneState.current.locationFound = false
        console.warn('Geocoding failed', e)
      }
    }

    if (locationRef.current) geocodeLocation(locationRef.current)

    let isDragging = false
    let lastX = 0, lastY = 0
    let rotX = 0.25, rotY = 0.0
    let velY = 0.0025, velX = 0
    let downPos: { x: number; y: number } | null = null

    let downTime = 0
    let velYAtDown = 0
    const onDown = (e: any) => {
      isDragging = true
      downTime = Date.now()
      velYAtDown = Math.abs(velY)  // guardar ANTES de modificar
      const t = e.touches ? e.touches[0] : e
      lastX = t.clientX; lastY = t.clientY
      downPos = { x: t.clientX, y: t.clientY }
      velX = 0
      // NÃO modificar velY aqui — só parar no onUp se foi clique
    }
    const onMove = (e: any) => {
      if (!isDragging) return
      const t = e.touches ? e.touches[0] : e
      const dx = t.clientX - lastX
      const dy = t.clientY - lastY
      lastX = t.clientX; lastY = t.clientY
      rotY += dx * 0.005
      rotX += dy * 0.005
      rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotX))
      velX = dy * 0.0008
      velY = dx * 0.0008
      if (downPos && Math.hypot(t.clientX - downPos.x, t.clientY - downPos.y) > 5) {
        downPos = null
      }
    }
    const onUp = () => {
      if (!isDragging) return
      isDragging = false
      setTimeout(() => {
        if (!sceneState.current.zooming && !sceneState.current.continentActive && Math.abs(velY) < 0.001) velY = 0.0025
      }, 1500)
    }

    const dom = renderer.domElement
    dom.addEventListener('mousedown', onDown)
    dom.addEventListener('touchstart', onDown, { passive: true })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    // Testar se ponto está dentro de um polígono GeoJSON (ray casting 2D)
    const pointInPolygon = (px: number, py: number, ring: number[][]) => {
      let inside = false
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1]
        const xj = ring[j][0], yj = ring[j][1]
        const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside
      }
      return inside
    }

    // Mapa: nome GeoJSON -> nome na base de dados
    const NAME_MAP: Record<string, string> = {
      'Bosnia and Herzegovina': 'Bosnia and Herz.',
      'Central African Republic': 'Central African Rep.',
      'Democratic Republic of the Congo': 'Dem. Rep. Congo',
      'Republic of the Congo': 'Congo',
      'Dominican Republic': 'Dominican Rep.',
      'Equatorial Guinea': 'Eq. Guinea',
      'Czech Republic': 'Czechia',
      'Macedonia': 'North Macedonia',
      'South Sudan': 'S. Sudan',
      'United States of America': 'United States',
      'Guinea Bissau': 'Guinea-Bissau',
      'Ivory Coast': 'Ivory Coast',
      'East Timor': 'Timor-Leste',
      'England': 'United Kingdom',
    }

    const getCountryAtLatLon = (lat: number, lon: number) => {
      if (!geojsonRef.current) return null
      for (const f of geojsonRef.current.features) {
        const polys = f.geometry.type === 'Polygon'
          ? [f.geometry.coordinates]
          : f.geometry.coordinates
        for (const poly of polys) {
          if (pointInPolygon(lon, lat, poly[0])) {
            const rawName = f.properties?.name || f.properties?.NAME || ''
            return (NAME_MAP[rawName] || rawName) as string
          }
        }
      }
      return null
    }

    // Ripple effect canvas
    const ripples: { x: number; y: number; r: number; alpha: number }[] = []
    const rippleCanvas = document.createElement('canvas')
    rippleCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;'
    mount.appendChild(rippleCanvas)
    const rippleCtx = rippleCanvas.getContext('2d')!
    const animateRipple = () => {
      if (ripples.length === 0) return
      rippleCanvas.width = mount.clientWidth
      rippleCanvas.height = mount.clientHeight
      rippleCtx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        rp.r += 4
        rp.alpha -= 0.025
        if (rp.alpha <= 0) { ripples.splice(i, 1); continue }
        rippleCtx.beginPath()
        rippleCtx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        rippleCtx.strokeStyle = `rgba(255, 217, 61, ${rp.alpha})`
        rippleCtx.lineWidth = 2.5
        rippleCtx.stroke()
      }
      if (ripples.length > 0) requestAnimationFrame(animateRipple)
      else rippleCtx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height)
    }

    dom.addEventListener('click', (e: MouseEvent) => {
      if (!downPos) return
      const rect = dom.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObject(baseMesh)
      if (!hits.length) return
      const worldPt = hits[0].point.clone()
      const localPt = globeGroup.worldToLocal(worldPt)
      const norm = localPt.clone().normalize()
      const lat = Math.asin(Math.max(-1, Math.min(1, norm.y))) * 180 / Math.PI
      let lon = Math.atan2(norm.x, norm.z) * 180 / Math.PI + 90
      while (lon < -180) lon += 360
      while (lon > 180) lon -= 360

      // Tentar encontrar país visitado
      let lonGeo = lon - 179
      while (lonGeo < -180) lonGeo += 360
      while (lonGeo > 180) lonGeo -= 360
      const countryName = getCountryAtLatLon(lat, lonGeo)
      const isVisited = countryName && visitedRef.current.includes(countryName)

      // Só disparar se foi toque rápido, sem drag, e globo estava quase parado
      const dragDist = downPos ? Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) : 999
      const tapDuration = Date.now() - downTime
      const wasSlowEnough = Math.abs(velYAtDown) < 0.004
      const isTap = dragDist < 8 && tapDuration < 400 && wasSlowEnough

      if (isVisited && countryName && onCountryClick && isTap) {
        velY = 0
        velX = 0

        // Ripple dourado no ponto de clique
        const clickX = e.clientX - rect.left
        const clickY = e.clientY - rect.top
        ripples.push({ x: clickX, y: clickY, r: 10, alpha: 0.9 })
        ripples.push({ x: clickX, y: clickY, r: 0, alpha: 0.6 })
        ripples.push({ x: clickX, y: clickY, r: 20, alpha: 0.4 })
        animateRipple()

        // Zoom para o país — lat sem offset, só lon precisa de calibração
        const targetY = (-lonGeo - 87) * Math.PI / 180
        const targetX = lat * Math.PI / 180
        sceneState.current.targetRot = { x: targetX, y: targetY }
        sceneState.current.zooming = true
        sceneState.current.continentActive = true
        sceneState.current.targetZ = 5.0

        // Após animação de zoom, chamar onCountryClick
        setTimeout(() => {
          if (feedModeRef.current) {
            // No feed não fazer fade — blog abre inline
            onCountryClick(countryName)
          } else {
            const canvas = renderer.domElement
            let opacity = 1
            const fadeOut = setInterval(() => {
              opacity -= 0.05
              canvas.style.opacity = String(Math.max(0, opacity))
              if (opacity <= 0) {
                clearInterval(fadeOut)
                onCountryClick(countryName)
              }
            }, 16)
          }
        }, 900)
        return
      }

      // Clique normal — detetar continente
      let best: string | null = null, bestDist = Infinity
      Object.entries(CONTINENTS).forEach(([name, c]) => {
        const dlon = ((lon - c.lon + 540) % 360) - 180
        const dlat = lat - c.lat
        const a = Math.sin(dlat * Math.PI / 360) ** 2 +
          Math.cos(lat * Math.PI / 180) * Math.cos(c.lat * Math.PI / 180) *
          Math.sin(dlon * Math.PI / 360) ** 2
        const d = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        if (d < bestDist) { bestDist = d; best = name }
      })
      if (best) onContinentClick(best)
    })

    let raf: number
    const tick = () => {
      rotX += velX
      velX *= 0.94
      if (!isDragging && !sceneState.current.targetRot && !sceneState.current.zooming && !sceneState.current.continentActive && velY !== 0) {
        rotY += velY
        velY = Math.abs(velY) > 0.0026 ? velY * 0.96 : 0.0025
      } else if (isDragging) {
        rotY += velY
      }
      rotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotX))
      const tr = sceneState.current.targetRot
      if (tr) {
        let dy = tr.y - rotY
        while (dy > Math.PI) dy -= 2 * Math.PI
        while (dy < -Math.PI) dy += 2 * Math.PI
        rotY += dy * 0.07
        rotX += (tr.x - rotX) * 0.07
        if (Math.abs(dy) < 0.005 && Math.abs(tr.x - rotX) < 0.005) {
          sceneState.current.targetRot = null
          sceneState.current.zooming = false
        }
      }
      globeGroup.rotation.x = rotX
      globeGroup.rotation.y = rotY
      if (sceneState.current.targetZ != null) {
        camera.position.z += (sceneState.current.targetZ - camera.position.z) * 0.08
        if (Math.abs(camera.position.z - sceneState.current.targetZ) < 0.02) {
          sceneState.current.targetZ = null
        }
      }
      // Pulsação no feedMode
      if (feedMode && reliefMesh?.material) {
        const pulse = 0.3 + Math.sin(Date.now() * 0.002) * 0.2
        ;(reliefMesh.material as any).emissiveIntensity = pulse
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    sceneState.current.resetFeed = () => {
      sceneState.current.targetZ = 8.5
      sceneState.current.targetRot = null
      sceneState.current.zooming = false
      sceneState.current.continentActive = false
      velY = 0.0025
    }
    onSceneReady?.(sceneState.current.resetFeed)

    // Função de pesquisa de país
    sceneState.current.searchCountry = (countryName: string): boolean => {
      if (!geojsonRef.current) return false

      // Mapa reverso: nome BD -> nome GeoJSON
      const BD_TO_GEO: Record<string, string> = {
        'Bosnia and Herz.': 'Bosnia and Herzegovina',
        'Central African Rep.': 'Central African Republic',
        'Dem. Rep. Congo': 'Democratic Republic of the Congo',
        'Congo': 'Republic of the Congo',
        'Dominican Rep.': 'Dominican Republic',
        'Eq. Guinea': 'Equatorial Guinea',
        'Czechia': 'Czech Republic',
        'North Macedonia': 'Macedonia',
        'S. Sudan': 'South Sudan',
        'United States': 'United States of America',
        'Guinea-Bissau': 'Guinea Bissau',
        'Timor-Leste': 'East Timor',
        'United Kingdom': 'England',
        'eSwatini': 'Swaziland',
        'Cape Verde': 'Cabo Verde',
      }
      const searchName = BD_TO_GEO[countryName] || countryName
      
      // Encontrar o país pelo nome — match exacto primeiro, depois startsWith
      const searchLower = searchName.toLowerCase()
      const feature = geojsonRef.current.features.find((f: any) =>
        (f.properties?.name || '').toLowerCase() === searchLower
      ) || geojsonRef.current.features.find((f: any) =>
        (f.properties?.name || '').toLowerCase().startsWith(searchLower)
      )
      
      if (!feature) return false
      
      // Calcular centróide do país
      const coords: number[][] = []
      const polys = feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates
      polys.forEach((poly: any) => {
        poly[0].forEach((c: number[]) => coords.push(c))
      })
      
      const lon = coords.reduce((s, c) => s + c[0], 0) / coords.length
      const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length
      
      // Fazer zoom para o país
      const targetY = (-lon - 83) * Math.PI / 180
      const targetX = lat * Math.PI / 180
      sceneState.current.targetRot = { x: targetX, y: targetY }
      sceneState.current.zooming = true
      sceneState.current.continentActive = true
      sceneState.current.targetZ = 5.0
      velY = 0
      
      // Mapa para verificar países visitados na textura de relevo
      const NAME_MAP: Record<string, string> = {
        'Bosnia and Herzegovina': 'Bosnia and Herz.',
        'Central African Republic': 'Central African Rep.',
        'Democratic Republic of the Congo': 'Dem. Rep. Congo',
        'Dominican Republic': 'Dominican Rep.',
        'Equatorial Guinea': 'Eq. Guinea',
        'Czech Republic': 'Czechia',
        'Macedonia': 'North Macedonia',
        'South Sudan': 'S. Sudan',
        'United States of America': 'United States',
        'Guinea Bissau': 'Guinea-Bissau',
        'East Timor': 'Timor-Leste',
        'England': 'United Kingdom',
        'Swaziland': 'eSwatini',
      }

      // Piscar só o país encontrado — redesenhar textura alternando a cor
      if (geojsonRef.current) {
        let pulseCount = 0
        const buildPulseTexture = (highlight: boolean) => {
          const visited = new Set(visitedRef.current)
          const W = 4096, H = 2048
          const canvas = document.createElement('canvas')
          canvas.width = W; canvas.height = H
          const ctx = canvas.getContext('2d')!
          const project = (lo: number, la: number): [number, number] => [
            (lo + 180) / 360 * W, (90 - la) / 180 * H
          ]
          ctx.fillStyle = '#B8D4E8'
          ctx.fillRect(0, 0, W, H)
          geojsonRef.current.features.forEach((f: any) => {
            const name = f.properties?.name || ''
            const isVisited = visited.has(name)
            const isTarget = name === feature.properties.name
            const fillColor = isTarget ? (highlight ? '#FFFFFF' : '#FFB800') : isVisited ? '#FFD93D' : '#D4C9B0'
            const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
            polys.forEach((poly: any) => {
              ctx.beginPath()
              poly.forEach((ring: any) => {
                let penDown = false
                for (let i = 0; i < ring.length; i++) {
                  const [x, y] = project(ring[i][0], ring[i][1])
                  if (!penDown) { ctx.moveTo(x, y); penDown = true }
                  else {
                    const [px] = project(ring[i-1][0], ring[i-1][1])
                    if (Math.abs(x - px) > W / 2) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                  }
                }
                ctx.closePath()
              })
              ctx.fillStyle = fillColor
              ctx.fill('evenodd')
              ctx.strokeStyle = isVisited ? 'rgba(180,120,0,0.85)' : '#B8A898'
              ctx.lineWidth = isVisited ? 3.5 : 1.6
              ctx.stroke()
            })
          })
          return canvas
        }

        // Piscar redesenhando ambas as texturas
        const buildReliefPulse = (highlight: boolean) => {
          const visited = new Set(visitedRef.current)
          const W = 4096, H = 2048
          const canvas = document.createElement('canvas')
          canvas.width = W; canvas.height = H
          const ctx = canvas.getContext('2d')!
          ctx.clearRect(0, 0, W, H)
          const project = (lo: number, la: number): [number, number] => [
            (lo + 180) / 360 * W, (90 - la) / 180 * H
          ]
          geojsonRef.current.features.forEach((f: any) => {
            const name = f.properties?.name || ''
            const isTarget = name === feature.properties.name
            const bdName = NAME_MAP[name] || name
            const isVisited = visited.has(bdName)
            if (!isVisited && !isTarget) return
            const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
            polys.forEach((poly: any) => {
              ctx.beginPath()
              poly.forEach((ring: any) => {
                let penDown = false
                for (let i = 0; i < ring.length; i++) {
                  const [x, y] = project(ring[i][0], ring[i][1])
                  if (!penDown) { ctx.moveTo(x, y); penDown = true }
                  else {
                    const [px] = project(ring[i-1][0], ring[i-1][1])
                    if (Math.abs(x - px) > W / 2) ctx.moveTo(x, y)
                    else ctx.lineTo(x, y)
                  }
                }
                ctx.closePath()
              })
              ctx.fillStyle = isTarget ? (highlight ? '#FFFFFF' : '#FFE066') : '#FFE066'
              ctx.fill('evenodd')
              ctx.strokeStyle = isTarget && highlight ? '#fff' : 'rgba(180,120,0,0.85)'
              ctx.lineWidth = isTarget ? 4 : 3.5
              ctx.stroke()
            })
          })
          return canvas
        }

        // Aplicar imediatamente antes do interval para evitar flash inicial
        const applyPulse = (highlight: boolean) => {
          const tex = new THREE.CanvasTexture(buildReliefPulse(highlight))
          tex.minFilter = THREE.LinearFilter
          tex.magFilter = THREE.LinearFilter
          tex.generateMipmaps = false
          if (reliefMesh?.material) {
            reliefMesh.material.dispose()
            reliefMesh.material = new THREE.MeshPhongMaterial({
              map: tex, alphaMap: tex, transparent: true, depthWrite: false,
              shininess: 40,
              emissive: new THREE.Color(0xFFD93D),
              emissiveMap: tex, emissiveIntensity: 0.3,
            })
            reliefMesh.material.needsUpdate = true
          }
        }
        applyPulse(true) // aplicar imediatamente

        const pulse = setInterval(() => {
          pulseCount++
          const highlight = pulseCount % 2 === 0
          applyPulse(highlight)
          if (pulseCount > 8) {
            clearInterval(pulse)
            sceneState.current.rebakeTexture?.()
          }
        }, 350)
      }
      
      return true
    }
    
    onSearchReady?.(sceneState.current.searchCountry)

    // Expor função de reset do zoom
    const resetZoomFn = () => {
      sceneState.current.targetZ = 8.5
      sceneState.current.targetRot = null
      sceneState.current.zooming = false
      sceneState.current.continentActive = false
      velY = 0.0025
    }
    onResetReady?.(resetZoomFn)

    sceneState.current.zoomTo = (lat: number, lon: number, name: string) => {
      sceneState.current.zooming = true
      sceneState.current.continentActive = true
      const targetY = (-lon - 83) * Math.PI / 180
      const targetX = (lat - 7) * Math.PI / 180
      sceneState.current.targetRot = { x: targetX, y: targetY }
      const zoomByContinent: Record<string, number> = { 'Asia': 9.5 }
      sceneState.current.targetZ = zoomByContinent[name] || 7.5
      velY = 0
    }
    sceneState.current.resetZoom = () => {
      sceneState.current.targetZ = 8.5
      sceneState.current.zooming = false
      sceneState.current.continentActive = false
      velY = 0.0025
    }

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const ro = new ResizeObserver(onResize)
    ro.observe(mount)

    let geojsonCache: any = null

    const applyTexture = (geojson: any) => {
      const visited = new Set(visitedRef.current)

      // Textura base
      const baseCanvas = buildEquirectTexture(geojson, visited)
      const baseTex = new THREE.CanvasTexture(baseCanvas)
      baseTex.needsUpdate = true
      baseTex.minFilter = THREE.LinearFilter
      baseTex.magFilter = THREE.LinearFilter
      baseTex.generateMipmaps = false
      baseTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
      baseMesh.material.dispose()
      baseMesh.material = new THREE.MeshPhongMaterial({
        map: baseTex,
        specular: 0x3a2a14,
        shininess: 6,
        emissive: 0xffffff,
        emissiveMap: baseTex,
        emissiveIntensity: 0.55,
      })
      baseMesh.material.needsUpdate = true

      // Textura de relevo — só países visitados, fundo transparente
      if (visited.size > 0) {
        const reliefCanvas = buildReliefTexture(geojson, visited)
        const reliefTex = new THREE.CanvasTexture(reliefCanvas)
        reliefTex.needsUpdate = true
        reliefTex.minFilter = THREE.LinearFilter
        reliefTex.magFilter = THREE.LinearFilter
        reliefTex.generateMipmaps = false
        reliefMesh.material.dispose()
        reliefMesh.material = new THREE.MeshPhongMaterial({
          map: reliefTex,
          alphaMap: reliefTex,
          transparent: true,
          depthWrite: false,
          shininess: 40,
          emissive: new THREE.Color(0xFFD93D),
          emissiveMap: reliefTex,
          emissiveIntensity: 0.3,
        })
        reliefMesh.material.needsUpdate = true
      }
    }

    // Expor rebake para useEffect externo
    sceneState.current.rebakeTexture = () => {
      if (geojsonCache) applyTexture(geojsonCache)
    }

    let cancelled = false
    // Usar Natural Earth GeoJSON que tem nomes nos features
    fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
      .then(r => r.json())
      .then(geojson => {
        if (cancelled) return
        geojsonCache = geojson
        geojsonRef.current = geojson
        applyTexture(geojson)
      })
      .catch(() => {
        // Fallback: world-atlas com lookup de nomes por ID
        fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
          .then(r => r.json())
          .then(topo => {
            if (cancelled) return
            const topojson = (window as any).topojson
            const geojson = topojson.feature(topo, topo.objects.countries)
            geojsonCache = geojson
            geojsonRef.current = geojson
            applyTexture(geojson)
          })
          .catch(err => console.error('[globe] load failed', err))
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      dom.removeEventListener('mousedown', onDown)
      dom.removeEventListener('touchstart', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
      if (dom.parentNode === mount) mount.removeChild(dom.parentNode === mount ? dom : dom)
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    if (feedModeRef.current) return
    sceneState.current.rebakeTexture?.()
  }, [visitedCountries]) // eslint-disable-line

  useEffect(() => {
    if (!activeContinent) {
      sceneState.current.resetZoom?.()
      return
    }
    const c = CONTINENT_ZOOM[activeContinent]
    if (c) sceneState.current.zoomTo?.(c.lat, c.lon, activeContinent)
  }, [activeContinent])

  return (
    <div ref={mountRef} style={{
      width: '100%', height: '100%',
      position: 'relative',
      cursor: 'grab',
      touchAction: 'none',
    }} />
  )
}