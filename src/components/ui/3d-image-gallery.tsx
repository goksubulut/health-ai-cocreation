"use client"

import React, {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import * as THREE from "three"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, Html, OrbitControls, Plane, Sphere, useTexture } from "@react-three/drei"
import { Heart, MapPin, Navigation, X } from "lucide-react"

export type ListingCard = {
  id: string
  imageUrl: string
  title: string
  city: string
  distanceKm: number
  category: string
  summary: string
}

type ListingContextType = {
  selectedCard: ListingCard | null
  setSelectedCard: (card: ListingCard | null) => void
  cards: ListingCard[]
  favoriteIds: string[]
  onToggleFavorite?: (listingId: string) => void
}

const ListingContext = createContext<ListingContextType | undefined>(undefined)

function useListingCard() {
  const ctx = useContext(ListingContext)
  if (!ctx) throw new Error("useListingCard must be used within ListingProvider")
  return ctx
}

function ListingProvider({
  children,
  cards,
  favoriteIds,
  onToggleFavorite,
}: {
  children: React.ReactNode
  cards: ListingCard[]
  favoriteIds: string[]
  onToggleFavorite?: (listingId: string) => void
}) {
  const [selectedCard, setSelectedCard] = useState<ListingCard | null>(null)

  return (
    <ListingContext.Provider value={{ selectedCard, setSelectedCard, cards, favoriteIds, onToggleFavorite }}>
      {children}
    </ListingContext.Provider>
  )
}

function StarfieldBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 1)
    mountRef.current.appendChild(renderer.domElement)

    const starsGeometry = new THREE.BufferGeometry()
    const starsCount = 7000
    const positions = new Float32Array(starsCount * 3)
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.65, sizeAttenuation: true })
    const stars = new THREE.Points(starsGeometry, starsMaterial)
    scene.add(stars)

    camera.position.z = 10

    let animationId = 0
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      stars.rotation.y += 0.00008
      stars.rotation.x += 0.00004
      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animationId)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      starsGeometry.dispose()
      starsMaterial.dispose()
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 z-0 bg-black" />
}

function FloatingCard({
  card,
  position,
}: {
  card: ListingCard
  position: { x: number; y: number; z: number; scale: number }
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { setSelectedCard } = useListingCard()
  const imageTexture = useTexture(card.imageUrl)
  const cardTexture = useListingCardTexture(card, imageTexture.image)
  const targetScale = hovered ? position.scale * 1.08 : position.scale

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position)
      const currentScale = groupRef.current.scale.x
      const nextScale = THREE.MathUtils.lerp(currentScale, targetScale, 0.12)
      groupRef.current.scale.setScalar(nextScale)
    }
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = THREE.MathUtils.lerp(material.opacity, hovered ? 0.42 : 0.18, 0.14)
    }
  })

  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation()
    setSelectedCard(card)
  }

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]} scale={position.scale}>
      <Plane ref={glowRef} args={[2.62, 3.7]} position={[0, 0, -0.04]} renderOrder={18}>
        <meshBasicMaterial color="#5eead4" transparent opacity={0.16} depthWrite={false} depthTest={false} />
      </Plane>
      <Plane
        ref={meshRef}
        args={[2.46, 3.44]}
        renderOrder={20}
        onClick={handleClick}
        onPointerOver={() => {
          setHovered(true)
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = "auto"
        }}
      >
        <meshBasicMaterial map={cardTexture} transparent toneMapped={false} depthWrite={false} depthTest={false} />
      </Plane>
    </group>
  )
}

function ListingModal({ onOpenDetail }: { onOpenDetail?: (listing: ListingCard) => void }) {
  const { selectedCard, setSelectedCard, favoriteIds, onToggleFavorite } = useListingCard()

  if (!selectedCard) return null
  const isSaved = favoriteIds.includes(selectedCard.id)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) setSelectedCard(null)
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#1b1b1b] p-5 border border-white/15 shadow-2xl">
        <button
          type="button"
          onClick={() => setSelectedCard(null)}
          className="absolute -top-11 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="h-8 w-8" />
        </button>

        <img
          src={selectedCard.imageUrl}
          alt={selectedCard.title}
          className="h-64 w-full rounded-xl object-cover"
          loading="lazy"
        />

        <div className="mt-4 text-white">
          <h3 className="text-xl font-semibold">{selectedCard.title}</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-white/75">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {selectedCard.city}
            </span>
            <span className="inline-flex items-center gap-1">
              <Navigation className="h-4 w-4" /> {selectedCard.distanceKm.toFixed(1)} km
            </span>
            <span>{selectedCard.category}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/80">{selectedCard.summary}</p>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => onOpenDetail?.(selectedCard)}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg text-sm font-medium text-black transition hover:opacity-90"
            style={{ backgroundColor: "#a855f7" }}
          >
            Open Listing Details
          </button>
          <button
            type="button"
            onClick={() => onToggleFavorite?.(selectedCard.id)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-black transition hover:opacity-90"
            style={{ backgroundColor: "#c084fc" }}
          >
            <Heart className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  )
}

function ListingGalaxy() {
  const { cards } = useListingCard()

  const cardPositions = useMemo(() => {
    const sorted = [...cards]
    const positions = sorted.map((card, index) => {
      const shell = Math.floor(index / 8)
      const itemsPerShell = 8
      const indexInShell = index % itemsPerShell
      const angle = (indexInShell / itemsPerShell) * Math.PI * 2 + shell * 0.52
      const radius = 5.8 + shell * 1.75
      const y = ((indexInShell % 4) - 1.5) * 1.82 + (shell % 2 === 0 ? 0.32 : -0.32)
      const scale = 0.8 - shell * 0.07
      return {
        id: card.id,
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius,
        scale: Math.max(scale, 0.62),
      }
    })

    const byId = new Map(positions.map((item) => [item.id, item]))
    return cards.map((card) => byId.get(card.id) ?? { x: 0, y: 0, z: 0, scale: 1 })
  }, [cards])

  return (
    <>
      <Sphere args={[2.25, 48, 48]} position={[0, 0, 0]} renderOrder={1}>
        <meshPhysicalMaterial
          color="#d9ddff"
          emissive="#7c4dff"
          emissiveIntensity={0.14}
          roughness={0.12}
          metalness={0.02}
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </Sphere>
      <Sphere args={[2.82, 48, 48]} position={[0, 0, 0]} renderOrder={0}>
        <meshBasicMaterial color="#a855f7" transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
      </Sphere>
      <Sphere args={[3.36, 48, 48]} position={[0, 0, 0]} renderOrder={0}>
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.05} side={THREE.BackSide} depthWrite={false} />
      </Sphere>
      <Html position={[0, -3.9, 0]} center>
        <div className="rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[10px] text-white/85">
          Your location
        </div>
      </Html>
      {cards.map((card, index) => (
        <FloatingCard key={card.id} card={card} position={cardPositions[index]} />
      ))}
    </>
  )
}

type ThreeDImageGalleryProps = {
  cards: ListingCard[]
  title?: string
  subtitle?: string
  onOpenDetail?: (listing: ListingCard) => void
  favoriteIds?: string[]
  onToggleFavorite?: (listingId: string) => void
}

export default function ThreeDImageGallery({
  cards,
  title = "Discover Listings",
  subtitle = "Nearby listings are closer to the center and visually larger. Drag to orbit and click any card to open details.",
  onOpenDetail,
  favoriteIds = [],
  onToggleFavorite,
}: ThreeDImageGalleryProps) {
  return (
    <ListingProvider cards={cards} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite}>
      <div className="relative h-[calc(100dvh-6rem)] min-h-[640px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_35%),linear-gradient(180deg,_rgba(7,10,19,0.88),_rgba(2,6,23,1))]">
        <StarfieldBackground />

        <Canvas
          camera={{ position: [0, 0, 15], fov: 50 }}
          className="absolute inset-0 z-10"
          onCreated={({ gl }) => {
            gl.domElement.style.pointerEvents = "auto"
            gl.outputColorSpace = THREE.SRGBColorSpace
          }}
        >
          <Suspense fallback={null}>
            <Environment preset="night" />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.7} />
            <pointLight position={[-10, -10, -10]} intensity={0.35} />
            <ListingGalaxy />
            <OrbitControls
              enablePan
              enableZoom
              enableRotate
              minDistance={9}
              maxDistance={19}
              autoRotate={false}
              rotateSpeed={0.42}
              zoomSpeed={0.95}
              panSpeed={0.72}
              target={[0, 0, 0]}
            />
          </Suspense>
        </Canvas>

        <ListingModal onOpenDetail={onOpenDetail} />

        <div className="pointer-events-none absolute top-4 left-4 z-20 max-w-xl text-white">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-xs opacity-70">{subtitle}</p>
        </div>
      </div>
    </ListingProvider>
  )
}

const CARD_TEXTURE_WIDTH = 960
const CARD_TEXTURE_HEIGHT = 1320

function useListingCardTexture(card: ListingCard, image: CanvasImageSource | undefined) {
  const texture = useMemo(() => {
    if (!image) return null

    const canvas = document.createElement("canvas")
    canvas.width = CARD_TEXTURE_WIDTH
    canvas.height = CARD_TEXTURE_HEIGHT
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    createRoundedRectPath(ctx, 0, 0, canvas.width, canvas.height, 66)
    ctx.save()
    ctx.clip()

    const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    backgroundGradient.addColorStop(0, "#0b1120")
    backgroundGradient.addColorStop(0.45, "#111827")
    backgroundGradient.addColorStop(1, "#020617")
    ctx.fillStyle = backgroundGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    createRoundedRectPath(ctx, 54, 54, canvas.width - 108, 610, 42)
    ctx.clip()
    drawCoverImage(ctx, image, 54, 54, canvas.width - 108, 610)
    const imageOverlay = ctx.createLinearGradient(0, 54, 0, 664)
    imageOverlay.addColorStop(0, "rgba(255, 255, 255, 0.04)")
    imageOverlay.addColorStop(0.55, "rgba(15, 23, 42, 0.08)")
    imageOverlay.addColorStop(1, "rgba(2, 6, 23, 0.58)")
    ctx.fillStyle = imageOverlay
    ctx.fillRect(54, 54, canvas.width - 108, 610)
    ctx.restore()

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)"
    createRoundedRectPath(ctx, 54, 54, canvas.width - 108, 610, 42)
    ctx.fill()

    const chipGradient = ctx.createLinearGradient(54, 0, 338, 0)
    chipGradient.addColorStop(0, "rgba(244, 114, 182, 0.18)")
    chipGradient.addColorStop(1, "rgba(59, 130, 246, 0.16)")
    ctx.fillStyle = chipGradient
    createRoundedRectPath(ctx, 54, 700, 314, 82, 26)
    ctx.fill()

    ctx.fillStyle = "#f5f3ff"
    ctx.font = "600 32px Inter, Arial, sans-serif"
    ctx.fillText(card.category.toUpperCase(), 96, 753)

    ctx.fillStyle = "#f8fafc"
    ctx.font = "700 62px Inter, Arial, sans-serif"
    const titleMetrics = drawWrappedText(ctx, card.title, 76, 850, canvas.width - 152, 74, 2)

    ctx.fillStyle = "rgba(226, 232, 240, 0.82)"
    ctx.font = "500 33px Inter, Arial, sans-serif"
    drawWrappedText(ctx, card.summary, 76, titleMetrics.bottom + 52, canvas.width - 152, 46, 3)

    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)"
    ctx.lineWidth = 3
    createRoundedRectPath(ctx, 74, canvas.height - 174, canvas.width - 148, 92, 28)
    ctx.stroke()

    ctx.fillStyle = "#f8fafc"
    ctx.font = "600 34px Inter, Arial, sans-serif"
    ctx.fillText(card.city, 112, canvas.height - 116)
    ctx.textAlign = "right"
    ctx.fillText(`${card.distanceKm.toFixed(1)} km away`, canvas.width - 110, canvas.height - 116)
    ctx.textAlign = "left"

    ctx.restore()

    const nextTexture = new THREE.CanvasTexture(canvas)
    nextTexture.colorSpace = THREE.SRGBColorSpace
    nextTexture.anisotropy = 8
    nextTexture.needsUpdate = true
    return nextTexture
  }, [card.category, card.city, card.distanceKm, card.summary, card.title, image])

  useLayoutEffect(() => {
    return () => {
      texture?.dispose()
    }
  }, [texture])

  return texture
}

function createRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + safeRadius, y)
  ctx.arcTo(x + width, y, x + width, y + height, safeRadius)
  ctx.arcTo(x + width, y + height, x, y + height, safeRadius)
  ctx.arcTo(x, y + height, x, y, safeRadius)
  ctx.arcTo(x, y, x + width, y, safeRadius)
  ctx.closePath()
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const source = image as { width?: number; height?: number }
  const sourceWidth = source.width ?? width
  const sourceHeight = source.height ?? height
  const scale = Math.max(width / sourceWidth, height / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const drawX = x + (width - drawWidth) / 2
  const drawY = y + (height - drawHeight) / 2
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ""

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(nextLine).width <= maxWidth || currentLine.length === 0) {
      currentLine = nextLine
      return
    }
    lines.push(currentLine)
    currentLine = word
  })

  if (currentLine) lines.push(currentLine)

  const visibleLines = lines.slice(0, maxLines)
  visibleLines.forEach((line, index) => {
    const isLastVisibleLine = index === visibleLines.length - 1
    const needsEllipsis = lines.length > maxLines && isLastVisibleLine
    ctx.fillText(needsEllipsis ? `${line}...` : line, x, y + index * lineHeight, maxWidth)
  })

  return {
    lines: visibleLines,
    bottom: y + Math.max(visibleLines.length - 1, 0) * lineHeight,
  }
}
