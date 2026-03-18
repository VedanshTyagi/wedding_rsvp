'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'   // add this import at the top

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); return }
    router.push('/dashboard')   // redirect to planner dashboard
  }

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={e => setEmail(e.target.value)}
             type="email" placeholder="Email" />
      <input value={password} onChange={e => setPassword(e.target.value)}
             type="password" placeholder="Password" />
      {error && <p>{error}</p>}
      <button type="submit">Sign in</button>
      <p className="text-xs text-gray-400 text-center mt-5">
        Don't have an account?{' '}
        <Link href="/signup" className="text-gray-700 underline">
            Sign up
        </Link>
      </p>
    </form>
  )
}
