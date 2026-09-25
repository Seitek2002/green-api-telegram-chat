import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export const SendIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 12h13M12 5l7 7-7 7" />
  </svg>
)

export const PlusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const BackIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

export const LogoutIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
)

export const CloseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

export const ClockIcon = (props: IconProps) => (
  <svg {...base} viewBox="0 0 16 16" strokeWidth={1.5} {...props}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 5v3l2 1.5" />
  </svg>
)

export const CheckIcon = (props: IconProps) => (
  <svg {...base} viewBox="0 0 16 16" strokeWidth={1.6} {...props}>
    <path d="M3 8.5l3 3 7-7" />
  </svg>
)

export const DoubleCheckIcon = (props: IconProps) => (
  <svg {...base} viewBox="0 0 20 16" strokeWidth={1.6} {...props}>
    <path d="M1.5 8.5l3 3 7-7M8.5 11.5l1 1 7-8" />
  </svg>
)

export const AlertIcon = (props: IconProps) => (
  <svg {...base} viewBox="0 0 16 16" strokeWidth={1.6} {...props}>
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 4.5v4M8 11.2v.1" />
  </svg>
)

export const EyeIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const EyeOffIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M17.9 17.9A10.4 10.4 0 0 1 12 19c-6.4 0-10-7-10-7a18.5 18.5 0 0 1 4.1-5.1M9.9 5.2A9.1 9.1 0 0 1 12 5c6.4 0 10 7 10 7a18.6 18.6 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" />
  </svg>
)

export const ChatBubbleIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.6a8.4 8.4 0 0 1-.9-3.9A8.5 8.5 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" />
  </svg>
)

/** Логотип приложения: бумажный самолётик в круге. */
export const LogoMark = (props: IconProps) => (
  <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden {...props}>
    <defs>
      <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#a695e7" />
        <stop offset="1" stopColor="#6a57d5" />
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#logo-gradient)" />
    <path d="M15.5 31.2 45 19.8c1.4-.5 2.6.3 2.2 2.3l-5 23.7c-.4 1.7-1.4 2.1-2.8 1.3l-7.7-5.7-3.7 3.6c-.4.4-.8.8-1.6.8l.5-7.9 14.4-13c.6-.6-.1-.9-1-.3L22.5 35.8l-7.6-2.4c-1.7-.5-1.7-1.6.6-2.2Z" fill="#fff" />
  </svg>
)
