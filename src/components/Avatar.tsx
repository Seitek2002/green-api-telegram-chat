import styles from './Avatar.module.css'

// Градиенты аватаров в духе палитры MAX
const GRADIENTS = [
  ['#5ec7ce', '#1f8a9a'],
  ['#78b1f5', '#2d62c9'],
  ['#a79dff', '#5b47d6'],
  ['#f78fb7', '#c43f7a'],
  ['#f2ab7d', '#d0632b'],
]

function hash(value: string): number {
  let result = 0
  for (const char of value) result = (result * 31 + char.charCodeAt(0)) | 0
  return Math.abs(result)
}

function initials(name: string): string {
  const letters = name
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
  return (letters || name.replace(/\D/g, '').slice(-2) || '?').toUpperCase()
}

interface AvatarProps {
  name: string
  seed: string
  size?: number
}

export function Avatar({ name, seed, size = 48 }: AvatarProps) {
  const [from, to] = GRADIENTS[hash(seed) % GRADIENTS.length]
  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `linear-gradient(135deg, ${from}, ${to})`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
