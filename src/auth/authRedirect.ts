const DEFAULT_AUTH_REDIRECT_URL = 'https://netjesflashcards.vercel.app'

/** Redirect URL for magic links, OAuth, and email confirmations. */
export function getAuthRedirectUrl(): string {
  return import.meta.env.VITE_AUTH_REDIRECT_URL ?? DEFAULT_AUTH_REDIRECT_URL
}
