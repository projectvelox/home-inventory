// Static login credentials
// Change the passwords below to whatever you prefer
// Tip: set VITE_WIFE_PASSWORD and VITE_LEA_PASSWORD in Vercel env vars
// to avoid having passwords visible in the GitHub repo

export const USERS = [
  {
    username: 'wife',
    displayName: 'My Love',
    password: import.meta.env.VITE_WIFE_PASSWORD || 'haven2024',
    role: 'admin',
    avatar: '👩',
  },
  {
    username: 'atea',
    displayName: 'Ate Lea',
    password: import.meta.env.VITE_LEA_PASSWORD || 'restock2024',
    role: 'helper',
    avatar: '🧹',
  },
]
