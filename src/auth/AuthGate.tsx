import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { ensureProfile } from '../api/profile'
import { getAuthRedirectUrl } from './authRedirect'
import { AuthContext } from './AuthContext'

type AuthMode = 'password' | 'magic-link'

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | 'loading'>('loading')
  const [mode, setMode] = useState<AuthMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [profileReady, setProfileReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session && session !== 'loading') {
      ensureProfile(session.user.id).then(() => setProfileReady(true))
    } else {
      setProfileReady(false)
    }
  }, [session])

  function resetFormState() {
    setError(null)
    setLinkSent(false)
    setPassword('')
  }

  function switchMode(next: AuthMode) {
    setMode(next)
    resetFormState()
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: getAuthRedirectUrl() },
      })
      setSubmitting(false)
      if (error) {
        setError(error.message)
        return
      }
      setLinkSent(true)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      setError(error.message)
    }
  }

  async function handleSendLink(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setLinkSent(true)
  }

  if (session === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-ink-light">Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border-2 border-cloud-dark bg-white p-6 text-center shadow-sm">
          <h1 className="mb-1 text-2xl font-extrabold text-brand-green">Netjes Nederlands</h1>
          <p className="mb-6 text-ink-light">Sign in to track your streak, XP, and progress everywhere.</p>

          <div className="mb-4 flex rounded-xl border-2 border-cloud-dark p-1">
            <button
              type="button"
              onClick={() => switchMode('password')}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                mode === 'password' ? 'bg-brand-green text-white' : 'text-ink-light'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchMode('magic-link')}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors ${
                mode === 'magic-link' ? 'bg-brand-green text-white' : 'text-ink-light'
              }`}
            >
              Magic link
            </button>
          </div>

          {linkSent ? (
            <p className="text-ink">
              {mode === 'magic-link' || isSignUp ? (
                <>
                  Check <strong>{email}</strong> for a link to finish signing in.
                </>
              ) : (
                <>Signed in successfully.</>
              )}
            </p>
          ) : mode === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-2 border-cloud-dark px-4 py-3 text-center outline-none focus:border-brand-blue"
              />
              <input
                type="password"
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="rounded-xl border-2 border-cloud-dark px-4 py-3 text-center outline-none focus:border-brand-blue"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-green py-3 font-bold text-white shadow-[0_4px_0_var(--color-brand-green-dark)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-brand-green-dark)] disabled:opacity-60"
              >
                {submitting ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp((v) => !v)
                  setError(null)
                }}
                className="text-sm text-brand-blue underline"
              >
                {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
              </button>
              {error && <p className="text-sm text-brand-red">{error}</p>}
            </form>
          ) : (
            <form onSubmit={handleSendLink} className="flex flex-col gap-3">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-2 border-cloud-dark px-4 py-3 text-center outline-none focus:border-brand-blue"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-green py-3 font-bold text-white shadow-[0_4px_0_var(--color-brand-green-dark)] active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-brand-green-dark)] disabled:opacity-60"
              >
                {submitting ? 'Sending...' : 'Send magic link'}
              </button>
              {error && <p className="text-sm text-brand-red">{error}</p>}
            </form>
          )}
        </div>
      </div>
    )
  }

  if (!profileReady) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-ink-light">Setting up your profile...</p>
      </div>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        userId: session.user.id,
        email: session.user.email ?? null,
        signOut: async () => {
          await supabase.auth.signOut()
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
