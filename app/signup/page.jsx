'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      const mandalas = document.querySelectorAll('.mandala-scatter');
      mandalas.forEach((mandala, index) => {
        const depth = index % 2 === 0 ? 30 : -45;
        mandala.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        mandala.style.transition = 'transform 0.1s ease-out';
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      const mandalas = document.querySelectorAll('.mandala-scatter');
      mandalas.forEach(m => m.style.transform = 'translate(0px, 0px)');
    };
  }, []);
  async function handleSignup(e) {
    e.preventDefault()
    setError(null)

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
      options: { data: { full_name: fullName } }
    })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden py-10 font-serif">
      <div className="relative z-10 w-full max-w-lg p-6 sm:p-8">
        <div className="royal-card p-8 md:p-10 text-center shadow-2xl rounded-2xl border border-white/80"
          style={{
            background: "linear-gradient(145deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.35) 100%)",
            backdropFilter: "blur(80px) saturate(160%)",
            WebkitBackdropFilter: "blur(80px) saturate(160%)",
            boxShadow: "0 10px 40px -10px rgba(154, 33, 67, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 1)"
          }}>

          <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mb-4 border border-gold/30"
            style={{ background: "linear-gradient(135deg, #9A2143, #6b1430)" }}>
            <svg className="w-6 h-6" fill="#e8c76a" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          <h1 className="text-3xl font-semibold text-navy mb-2 tracking-wide font-display">WedRSVP</h1>
          <p className="text-sm text-steel mb-8 tracking-widest uppercase">✦ Create your planner account ✦</p>

          <form onSubmit={handleSignup} className="flex flex-col gap-4 text-left">

            <div className="grid grid-cols-1 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 tracking-[0.15em] uppercase px-1">Full Name <span className="text-crimson">*</span></label>
                <input type="text" placeholder="e.g. Sneha Agarwal" required
                  value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-3.5 border border-white/60 rounded-xl text-sm bg-white/40 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-navy focus:outline-none focus:bg-white/60 focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-sans" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 tracking-[0.15em] uppercase px-1">Email <span className="text-crimson">*</span></label>
                <input type="email" placeholder="you@weddingco.com" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 border border-white/60 rounded-xl text-sm bg-white/40 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-navy focus:outline-none focus:bg-white/60 focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-sans" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 tracking-[0.15em] uppercase px-1">Password <span className="text-crimson">*</span></label>
                  <input type="password" placeholder="Min. 6 chars" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border border-white/60 rounded-xl text-sm bg-white/40 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-navy focus:outline-none focus:bg-white/60 focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-sans" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 tracking-[0.15em] uppercase px-1">Confirm <span className="text-crimson">*</span></label>
                  <input type="password" placeholder="Repeat" required
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    className="w-full px-4 py-3.5 border border-white/60 rounded-xl text-sm bg-white/40 backdrop-blur-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] text-navy focus:outline-none focus:bg-white/60 focus:border-gold focus:ring-1 focus:ring-gold/50 transition-all font-sans" />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-rose-600 text-xs bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5 mt-2 text-center font-sans">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full mt-4 bg-crimson hover:opacity-90 disabled:opacity-70 text-white py-4 rounded-xl text-[13px] font-bold tracking-[0.2em] uppercase transition-all shadow-md active:scale-[0.98]">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-sand/50">
            <p className="text-sm text-steel font-sans">
              Already have an account?{' '}
              <Link href="/login" className="text-crimson font-semibold hover:text-[#6b1430] hover:underline underline-offset-4 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}