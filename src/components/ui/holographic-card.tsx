import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import "./holographic-card.css"

// React port of https://codepen.io/linxiang-webcraft/pen/JobXpLO,
// which credits Simey's Pokemon card holo effect: https://poke-holo.simey.me/

type HolographicCardProps = {
  aspectRatio?: number
  borderRadius?: string
  children: ReactNode
  className?: string
  foilImage?: string
}

type Spring = {
  axes: string[]
  current: Record<string, number>
  target: Record<string, number>
  velocity: Record<string, number>
}

type SpringSettings = {
  damping: number
  stiffness: number
}

const DEFAULT_FOIL_IMAGE = "https://i.imgur.com/vu5azD2.jpeg"
const STOP_THRESHOLD = 0.001
const SPRING_INTERACT_SETTINGS: SpringSettings = {
  stiffness: 0.066,
  damping: 0.25,
}
const SPRING_RETURN_SETTINGS: SpringSettings = {
  stiffness: 0.01,
  damping: 0.06,
}

export function HolographicCard({
  aspectRatio = 0.718,
  borderRadius = "4.55% / 3.5%",
  children,
  className,
  foilImage = DEFAULT_FOIL_IMAGE,
}: HolographicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const rotatorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    const rotator = rotatorRef.current
    if (!card || !rotator) return

    const rotationSpring = createSpring({ x: 0, y: 0 })
    const backgroundSpring = createSpring({ x: 50, y: 50 })
    const pointerSpring = createSpring({ x: 50, y: 50, effectIntensity: 0 })
    const springs = [rotationSpring, backgroundSpring, pointerSpring]

    let frameId: number | null = null
    let lastTimestamp = 0
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    let springSettings = SPRING_INTERACT_SETTINGS

    function setRotation({ x, y }: Record<string, number>) {
      rotator?.style.setProperty("--tilt-left-right", `${x}deg`)
      rotator?.style.setProperty("--tilt-up-down", `${y}deg`)
    }

    function setShineBackground({ x, y }: Record<string, number>) {
      rotator?.style.setProperty("--background-x", `${x}%`)
      rotator?.style.setProperty("--background-y", `${y}%`)
    }

    function setPointer({ x, y, effectIntensity }: Record<string, number>) {
      rotator?.style.setProperty("--pointer-x", `${x}%`)
      rotator?.style.setProperty("--pointer-y", `${y}%`)
      rotator?.style.setProperty("--pointer-from-center", getPointerDistanceFromCenter(x, y).toString())
      rotator?.style.setProperty("--effect-intensity", effectIntensity.toString())
    }

    function applyVisualState() {
      setRotation({
        x: round(rotationSpring.current.x),
        y: round(rotationSpring.current.y),
      })
      setShineBackground({
        x: round(backgroundSpring.current.x),
        y: round(backgroundSpring.current.y),
      })
      setPointer({
        x: round(pointerSpring.current.x),
        y: round(pointerSpring.current.y),
        effectIntensity: round(pointerSpring.current.effectIntensity),
      })
    }

    function animateCard(timestamp: number) {
      if (!lastTimestamp) lastTimestamp = timestamp

      const deltaTime = Math.min((timestamp - lastTimestamp) / 16.666, 4)
      lastTimestamp = timestamp

      springs.forEach((spring) => updateSpring(spring, deltaTime, springSettings))

      if (springs.every(isCloseToTarget)) {
        springs.forEach(finishSpringAtTarget)
        applyVisualState()
        frameId = null
        lastTimestamp = 0
        return
      }

      applyVisualState()
      frameId = requestAnimationFrame(animateCard)
    }

    function startAnimation() {
      if (frameId === null) frameId = requestAnimationFrame(animateCard)
    }

    function handlePointerMove(event: PointerEvent) {
      if (resetTimer !== null) clearTimeout(resetTimer)
      resetTimer = null
      springSettings = SPRING_INTERACT_SETTINGS

      const rect = card?.getBoundingClientRect()
      if (!rect) return

      const pointer = {
        x: round(clamp(((event.clientX - rect.left) / rect.width) * 100)),
        y: round(clamp(((event.clientY - rect.top) / rect.height) * 100)),
      }
      const center = {
        x: pointer.x - 50,
        y: pointer.y - 50,
      }

      setSpringTarget(rotationSpring, {
        x: round(-(center.x / 3.5)),
        y: round(center.y / 3.5),
      })
      setSpringTarget(backgroundSpring, {
        x: mapRange(pointer.x, 0, 100, 37, 63),
        y: mapRange(pointer.y, 0, 100, 33, 67),
      })
      setSpringTarget(pointerSpring, {
        x: pointer.x,
        y: pointer.y,
        effectIntensity: 1,
      })

      startAnimation()
    }

    function handlePointerLeave() {
      if (resetTimer !== null) clearTimeout(resetTimer)

      resetTimer = setTimeout(() => {
        springSettings = SPRING_RETURN_SETTINGS
        setSpringTarget(rotationSpring, { x: 0, y: 0 })
        setSpringTarget(backgroundSpring, { x: 50, y: 50 })
        setSpringTarget(pointerSpring, { x: 50, y: 50, effectIntensity: 0 })
        resetTimer = null
        startAnimation()
      }, 500)
    }

    card.addEventListener("pointermove", handlePointerMove)
    card.addEventListener("pointerleave", handlePointerLeave)
    card.addEventListener("pointercancel", handlePointerLeave)

    return () => {
      card.removeEventListener("pointermove", handlePointerMove)
      card.removeEventListener("pointerleave", handlePointerLeave)
      card.removeEventListener("pointercancel", handlePointerLeave)
      if (resetTimer !== null) clearTimeout(resetTimer)
      if (frameId !== null) cancelAnimationFrame(frameId)
    }
  }, [])

  const style = {
    "--card-aspect": aspectRatio,
    "--card-radius": borderRadius,
    "--foil": `url("${foilImage}")`,
  } as CSSProperties

  return (
    <div className={cn("holographic-card", className)} ref={cardRef} style={style}>
      <div className="holographic-card__rotator" ref={rotatorRef}>
        <div className="holographic-card__front">
          <div className="holographic-card__content">{children}</div>
          <div aria-hidden className="holographic-card__shine" />
          <div aria-hidden className="holographic-card__glare" />
          <div aria-hidden className="holographic-card__edge" />
        </div>
      </div>
    </div>
  )
}

function createSpring(initialValue: Record<string, number>): Spring {
  const axes = Object.keys(initialValue)
  return {
    axes,
    current: { ...initialValue },
    target: { ...initialValue },
    velocity: Object.fromEntries(axes.map((axis) => [axis, 0])),
  }
}

function setSpringTarget(spring: Spring, value: Record<string, number>) {
  Object.assign(spring.target, value)
}

function updateSpring(spring: Spring, deltaTime: number, settings: SpringSettings) {
  spring.axes.forEach((axis) => {
    const distance = spring.target[axis] - spring.current[axis]
    spring.velocity[axis] += distance * settings.stiffness * deltaTime
    spring.velocity[axis] *= Math.pow(1 - settings.damping, deltaTime)
    spring.current[axis] += spring.velocity[axis] * deltaTime
  })
}

function isCloseToTarget(spring: Spring) {
  return spring.axes.every((axis) => {
    const distance = Math.abs(spring.target[axis] - spring.current[axis])
    const speed = Math.abs(spring.velocity[axis])
    return distance < STOP_THRESHOLD && speed < STOP_THRESHOLD
  })
}

function finishSpringAtTarget(spring: Spring) {
  spring.current = { ...spring.target }
  spring.axes.forEach((axis) => {
    spring.velocity[axis] = 0
  })
}

function getPointerDistanceFromCenter(x: number, y: number) {
  const distance = Math.hypot(x - 50, y - 50) / 50
  return round(clamp(distance, 0, 1))
}

function mapRange(value: number, fromMin: number, fromMax: number, toMin: number, toMax: number) {
  const progress = (value - fromMin) / (fromMax - fromMin)
  return round(toMin + progress * (toMax - toMin))
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max)
}

function round(value: number, precision = 3) {
  return Number(value.toFixed(precision))
}
