"use client";

import Link from 'next/link';
import { useEffect } from 'react';

export default function LandingPage() {
  // Apply parallax strictly to mandalas (floral borders remain normal)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;

      const mandalas = document.querySelectorAll<HTMLElement>('.mandala-scatter');
      mandalas.forEach((mandala, index) => {
        // Vary the speed of parallax slightly for each mandala to give depth
        const depth = index % 2 === 0 ? 30 : -45;
        mandala.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        mandala.style.transition = 'transform 0.1s ease-out';
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      // Reset mandalas when leaving this page
      const mandalas = document.querySelectorAll<HTMLElement>('.mandala-scatter');
      mandalas.forEach(m => m.style.transform = 'translate(0px, 0px)');
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-16 px-4 sm:px-8 relative overflow-hidden font-serif z-10 page-padding">
      <div className="max-w-5xl w-full text-center space-y-12">
        {/* Header / Logo emblem */}
        <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center shadow-[0_8px_32px_rgba(154,33,67,0.25)] border border-[#e8c76a]/40"
          style={{ background: "linear-gradient(135deg, #9A2143, #6b1430)" }}>
          <svg className="w-10 h-10" fill="#e8c76a" viewBox="0 0 24 24">
            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>

        {/* Hero Title */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-wide" style={{ color: "#2c1810", fontFamily: "'Cormorant Garamond', serif" }}>
            WedRSVP
          </h1>
          <p className="text-xs md:text-sm tracking-[0.3em] uppercase font-semibold" style={{ color: "#9A2143", letterSpacing: "0.4em" }}>
            ✦ The Royal Standard in Wedding Planning ✦
          </p>
        </div>

        {/* Hero description */}
        <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed" style={{ color: "#6f5a4a" }}>
          Experience seamless, elegant, and luxurious wedding management. From organizing guest lists to dispatching breathtaking digital invitations — all flawlessly orchestrated in one magnificent platform.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 relative z-20">
          <Link href="/signup"
            className="w-full sm:w-auto px-10 py-4 rounded-xl text-sm font-bold tracking-[0.2em] uppercase transition-all shadow-[0_8px_32px_rgba(154,33,67,0.25)] hover:shadow-[0_12px_44px_rgba(154,33,67,0.35)] hover:-translate-y-1"
            style={{ background: "#9A2143", color: "#FBF8F2" }}>
            Begin Journey
          </Link>
          <Link href="/login"
            className="w-full sm:w-auto px-10 py-4 rounded-xl text-sm font-bold tracking-[0.2em] uppercase transition-all shadow-sm hover:shadow-md hover:-translate-y-1 backdrop-blur-md bg-white/40"
            style={{ border: "1px solid rgba(201, 160, 64, 0.5)", color: "#2c1810" }}>
            Sign In
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-auto w-3/4 max-w-md h-px mt-16 opacity-70" style={{ background: "linear-gradient(90deg, transparent, #c9a040, transparent)" }} />

        {/* Features / Services row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 text-left relative z-20">
          {[
            {
              title: "Guest Management",
              desc: "Effortlessly organize tables, monitor accommodations, and handle check-ins.",
              icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            },
            {
              title: "Rich Invitations",
              desc: "Design and distribute breathtaking, culturally rich invitations to guests.",
              icon: "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            },
            {
              title: "Real-time RSVPs",
              desc: "Track attendees and meal preferences dynamically with live intelligent syncing.",
              icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            },
          ].map((feature, i) => (
            <div key={i} className="royal-card p-10 rounded-[32px] transition-all duration-300 hover:-translate-y-2 relative overflow-hidden group"
              style={{
                background: "linear-gradient(145deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.35) 100%)",
                backdropFilter: "blur(40px) saturate(160%)",
                WebkitBackdropFilter: "blur(40px) saturate(160%)",
                border: "1px solid rgba(255, 255, 255, 0.8)",
                boxShadow: "0 10px 40px -10px rgba(154, 33, 67, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 1)"
              }}>
              <div className="w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: "rgba(154,33,67,0.08)" }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#9A2143">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-wide" style={{ color: "#2c1810" }}>{feature.title}</h3>
              <p className="text-base leading-relaxed font-medium" style={{ color: "#6f5a4a" }}>{feature.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
