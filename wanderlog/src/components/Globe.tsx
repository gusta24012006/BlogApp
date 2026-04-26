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

export default function Globe({ visitedCountries, activeContinent, onContinentClick }: GlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneState = useRef<any>({})
  const visitedRef = useRef<string[]>(visitedCountries)
  visitedRef.current = visitedCountries

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
    renderer.setClearColor(0x000000, 0)
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

    let isDragging = false
    let lastX = 0, lastY = 0
    let rotX = 0.25, rotY = 0.0
    let velY = 0.0025, velX = 0
    let downPos: { x: number; y: number } | null = null

    const onDown = (e: any) => {
      isDragging = true
      const t = e.touches ? e.touches[0] : e
      lastX = t.clientX; lastY = t.clientY
      downPos = { x: t.clientX, y: t.clientY }
      velX = 0; velY = 0
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
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

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
    }

    // Expor rebake para useEffect externo
    sceneState.current.rebakeTexture = () => {
      if (geojsonCache) applyTexture(geojsonCache)
    }

    let cancelled = false
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(topo => {
        if (cancelled) return
        const topojson = (window as any).topojson
        const geojson = topojson.feature(topo, topo.objects.countries)
        geojsonCache = geojson
        applyTexture(geojson)
      })
      .catch(err => console.error('[globe] load failed', err))

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
    sceneState.current.rebakeTexture?.()
  }, [visitedCountries])

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