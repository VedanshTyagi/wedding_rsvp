"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const weddingId = params.weddingId as string;
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const base = `/dashboard/${weddingId}`;

  const navItems = [
    {
      label: "Guests",
      href: `${base}/guests`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      label: "RSVP Tracker",
      href: `${base}/rsvp`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
      label: "Send Invites",
      href: `${base}/invites/send`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    },
    {
      label: "Accommodation",
      href: `${base}/accommodation`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    },
    {
      label: "Seating",
      href: `${base}/seating`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
    },
    {
      label: "Check-in",
      href: `${base}/checkin`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Analytics",
      href: `${base}/analytics`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
    },
    {
      label: "CRM Sync",
      href: `${base}/crm`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    },
  ];

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href + "/") && href !== base);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      {/* Mobile overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(44,24,16,0.45)",
            zIndex: 40,
          }}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        transition-all duration-300 ease-in-out
        rounded-br-[2rem] overflow-hidden
        border-r border-b border-[#c9a040]/50
        shadow-[4px_0_40px_rgba(201,160,64,0.13)]
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${desktopOpen ? "lg:static lg:ml-0" : "lg:absolute lg:-translate-x-full lg:opacity-0"}
      `}
        style={{ background: "linear-gradient(175deg, #fffef5 0%, #fdf7ec 55%, #f8edcf 100%)" }}
      >
        {/* Royal gold top stripe */}
        <div className="h-[3px] w-full flex-shrink-0"
          style={{ background: "linear-gradient(90deg, #9A2143, #c9a040, #e8c76a, #c9a040, #9A2143)" }} />

        {/* Logo */}
        <div className="px-5 pt-5 pb-4 border-b border-[#c9a040]/25">
          <Link href={base} onClick={() => setOpen(false)}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md"
                style={{ background: "linear-gradient(135deg, #9A2143, #6b1430)" }}>
                <svg className="w-4 h-4" fill="#e8c76a" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[0.12em] uppercase"
                  style={{ color: "#2c1810", letterSpacing: "0.12em" }}>
                  WedRSVP
                </div>
                <div className="text-[10px] tracking-widest uppercase"
                  style={{ color: "#c9a040" }}>
                  ✦ Wedding Planner ✦
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Decorative divider */}
        <div className="mx-4 my-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #c9a040 40%, transparent)" }} />

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl border text-[17px] transition-all duration-200
                  ${active
                    ? "border-[#c9a040]/40 font-semibold shadow-[0_4px_16px_rgba(201,160,64,0.15)]"
                    : "border-transparent hover:border-[#c9a040]/20"}
                `}
                style={active
                  ? { background: "linear-gradient(135deg,#fffce8,#fff8e1)", color: "#9A2143" }
                  : { color: "#6b5040" }}
              >
                <span style={{ color: active ? "#c9a040" : "#c9a040" }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 mb-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #c9a040 40%, transparent)" }} />

        {/* Back to all weddings */}
        <div className="px-3 py-4">
          <Link
            href="/dashboard"
            className="flex w-full items-center gap-3 px-3 py-3 rounded-xl border border-transparent text-[17px] transition-all duration-200 hover:border-[#c9a040]/20"
            style={{ color: "#8a7060" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,160,64,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ color: "#c9a040" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            All Weddings
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
        className="lg:ml-60">

        {/* Mobile & Desktop topbar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 16px",
          background: "#fff",
          borderBottom: "1px solid #EDD498",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
        >
          {/* Mobile toggle */}
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden"
            style={{
              background: "none", border: "1px solid #EDD498",
              borderRadius: 8, padding: "6px 8px",
              cursor: "pointer", color: "#9A2143",
              display: "flex", alignItems: "center",
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop toggle */}
          <button
            onClick={() => setDesktopOpen(!desktopOpen)}
            className="hidden lg:flex"
            style={{
              background: "none", border: "1px solid #EDD498",
              borderRadius: 8, padding: "6px 8px",
              cursor: "pointer", color: "#9A2143",
              alignItems: "center",
            }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, background: "#9A2143",
              borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span style={{
              fontSize: 14,
              fontWeight: 600, color: "#2c1810", letterSpacing: 1,
            }}>WEDRSVP</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm text-[#9e8878] ml-4">
            {pathname.split('/').filter(Boolean).map((seg, idx, arr) => {
              const href = "/" + arr.slice(0, idx + 1).join("/");
              const isLast = idx === arr.length - 1;
              let name = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
              if (seg.length > 20 && seg.includes('-')) name = "Wedding";
              return (
                <span key={href} className="flex items-center gap-2">
                  {idx > 0 && <span className="opacity-50">/</span>}
                  {isLast ? (
                    <span className="font-semibold text-[#2c1810]">{name}</span>
                  ) : (
                    <Link href={href} className="hover:text-[#BFA054] transition-colors" style={{ textDecoration: 'none' }}>{name}</Link>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Page content with decorative borders */}
        <div className="page-frame" style={{ flex: 1 }}>
          <div className="decorative-border-left" aria-hidden="true" />
          <main className="page-frame-content sm:p-8 relative z-10" style={{ padding: "24px 20px" }}>
            {children}
          </main>
          <div className="decorative-border-right" aria-hidden="true" />
        </div>
      </div>

      {/* Sidebar spacer for lg screens */}
      <style>{`
        @media (min-width: 1024px) {
          aside { 
            transform: ${desktopOpen ? "translateX(0)" : "translateX(-100%)"} !important; 
            position: ${desktopOpen ? "static" : "absolute"} !important; 
            margin-left: ${desktopOpen ? "0px" : "-240px"} !important;
          }
          .lg\\:ml-60 { margin-left: 0 !important; }
          .lg\\:hidden { display: none !important; }
        }
        @media (max-width: 1023px) {
          .lg\\:ml-60 { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
