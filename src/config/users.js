// Display config for the "Who's home?" login screen
// Emails are set via VITE_WIFE_EMAIL / VITE_LEA_EMAIL env vars
// (set in .env locally and in Vercel dashboard for production)
export const USERS = [
  {
    id: 'wife',
    displayName: 'My Love',
    email: import.meta.env.VITE_WIFE_EMAIL,
    role: 'admin',
    avatar: '👩',
  },
  {
    id: 'atea',
    displayName: 'Ate Lea',
    email: import.meta.env.VITE_LEA_EMAIL,
    role: 'helper',
    avatar: '🧹',
  },
]
