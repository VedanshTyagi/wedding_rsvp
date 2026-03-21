"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const params    = useParams();
  const pathname  = usePathname();
  const weddingId = params.weddingId as string;
  const [open, setOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);

  const base = `/dashboard/${weddingId}`;

  const navItems = [
    {
      label: "Guests",
      href: `${base}/guests`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    },
    {
      label: "RSVP Tracker",
      href: `${base}/rsvp`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
    },
    {
      label: "Send Invites",
      href: `${base}/invites/send`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>,
    },
    {
      label: "Accommodation",
      href: `${base}/accommodation`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
    },
    {
      label: "Seating",
      href: `${base}/seating`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
    },
    {
      label: "Check-in",
      href: `${base}/checkin`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    },
    {
      label: "Analytics",
      href: `${base}/analytics`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>,
    },
    {
      label: "CRM Sync",
      href: `${base}/crm`,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
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

      {/* ── Sidebar ── */}
      <aside style={{
        position: "fixed",
        top: 0, left: 0,
        height: "100%",
        width: 240,
        background: "#fff",
        borderRight: "1px solid #EDD498",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "all 0.3s ease-in-out",
      }}
      className={`lg:z-auto ${!desktopOpen ? 'lg:-translate-x-full lg:opacity-0' : 'lg:translate-x-0 lg:opacity-100'}`}
      >
        {/* Logo */}
        <div style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid #EDD498",
        }}>
          <Link href={base} onClick={() => setOpen(false)}
            style={{ textDecoration: "none", display: "block" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32,
                background: "#9A2143",
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <span style={{
                fontFamily: "Georgia, serif",
                fontSize: 16, fontWeight: 600,
                color: "#2c1810", letterSpacing: 1,
              }}>WEDRSVP</span>
            </div>
          </Link>
          <p style={{
            fontSize: 11, color: "#BFA054",
            letterSpacing: 3, textTransform: "uppercase",
            marginTop: 4, marginLeft: 42,
          }}>✦ Wedding Planner ✦</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  marginBottom: 2,
                  textDecoration: "none",
                  fontSize: 14,
                  fontFamily: "Georgia, serif",
                  background: active ? "#FBF8F2" : "transparent",
                  color: active ? "#9A2143" : "#6f5a4a",
                  borderLeft: active ? "3px solid #9A2143" : "3px solid transparent",
                  fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ color: active ? "#9A2143" : "#BFA054", flexShrink: 0 }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Back to all weddings */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid #EDD498" }}>
          <Link
            href="/dashboard"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8,
              textDecoration: "none",
              fontSize: 13, color: "#9e8878",
              fontFamily: "Georgia, serif",
            }}
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, background: "#9A2143",
              borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <span style={{
              fontFamily: "Georgia, serif", fontSize: 14,
              fontWeight: 600, color: "#2c1810", letterSpacing: 1,
            }}>WEDRSVP</span>
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
