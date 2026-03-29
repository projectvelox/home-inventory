// Display config for the "Who's home?" login screen
// Trim all emails — Vercel/dotenv can inject trailing \n which breaks signInWithPassword
const e = v => (v ?? '').trim()

export const USERS = [
  {
    id:          'wife',
    displayName: 'My Love',
    email:       e(import.meta.env.VITE_WIFE_EMAIL),
    role:        'admin',
    avatar:      '👩',
  },
  {
    id:          'atea',
    displayName: 'Ate Lea',
    email:       e(import.meta.env.VITE_LEA_EMAIL),
    role:        'helper',
    avatar:      '🧹',
  },
  {
    id:          'daddyjo',
    displayName: 'Daddy Jo',
    email:       e(import.meta.env.VITE_DADDYJO_EMAIL),
    role:        'admin',
    avatar:      '👨',
  },
  {
    id:          'neneella',
    displayName: 'Nene Ella',
    email:       e(import.meta.env.VITE_NENEELLA_EMAIL),
    role:        'admin',
    avatar:      '👩',
  },
  {
    id:          'wowagrace',
    displayName: 'Wowa Grace',
    email:       e(import.meta.env.VITE_WOWAGRACE_EMAIL),
    role:        'admin',
    avatar:      '👵',
  },
]
