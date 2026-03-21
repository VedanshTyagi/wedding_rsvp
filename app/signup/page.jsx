'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [fullName, setFullName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [done, setDone]           = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSignup(e) {
    e.preventDefault()
    setError(null)

    // Basic validation
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }  // stored in raw_user_meta_data
      }                                // trigger copies it to profiles table
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // Show success state — tell them to check email if confirm is on,
    // or redirect straight to dashboard if confirm is off (dev mode)
    if (!error) {
        router.push('/dashboard')   // straight to dashboard, no email step
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl border border-gray-200 w-full max-w-sm text-center">
          <div className="text-2xl mb-3">✓</div>
          <h2 className="text-lg font-semibold mb-2">Account created</h2>
          <p className="text-sm text-gray-500 mb-6">
            Check your email to confirm your account,
            then sign in to get started.
          </p>
          <Link href="/login"
            className="block bg-gray-900 text-white py-2 rounded-lg text-sm">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl border border-gray-200 w-full max-w-sm">

        <h1 className="text-2xl font-semibold mb-1">WedRSVP</h1>
        <p className="text-sm text-gray-500 mb-6">Create your planner account</p>

        <form onSubmit={handleSignup} className="flex flex-col gap-3">

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Full name</label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              type="text"
              placeholder="Sneha Agarwal"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Email</label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              type="email"
              placeholder="you@weddingco.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Password</label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Confirm password</label>
            <input
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400"
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white py-2 rounded-lg text-sm mt-1 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

        </form>

        <p className="text-xs text-gray-400 text-center mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-gray-700 underline">Sign in</Link>
        </p>

      </div>
    </div>
  )
}