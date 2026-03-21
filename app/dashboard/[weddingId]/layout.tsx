"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const weddingId = params.weddingId as string;
  const [open, setOpen] = useState(false);

  // If this is the public guest check-in/invite page, don't show the dashboard sidebar at all
  if (pathname.includes('/checkin/guest/')) {
    return <>{children}</>;
  }

  const base = `/dashboard/${weddingId}`;
  const labelMap: Record<string, string> = {
    guests: "Guests",
    rsvp: "RSVP Tracker",
    cards: "Invite Templates",
    invites: "Invites",
    send: "Send Invites",
    accommodation: "Accommodation",
    seating: "Seating",
    checkin: "Check-in",
    analytics: "Analytics",
    crm: "CRM Sync",
    builder: "Builder",
    manual: "Manual Card Builder",
    bulk: "Bulk Sender",
    ai: "AI Card Generator",
    new: "New",
  };

  const pathParts = pathname
    .replace(base, "")
    .split("/")
    .filter(Boolean);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Wedding", href: base },
    ...pathParts.map((part, index) => ({
      label: labelMap[part] ?? part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      href: `${base}/${pathParts.slice(0, index + 1).join("/")}`,
    })),
  ];

  const navItems = [
    {
      label: "Guests",
      href: `${base}/guests`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "RSVP Tracker",
      href: `${base}/rsvp`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: "Invite Templates",
      href: `${base}/cards`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      label: "Send Invites",
      href: `${base}/invites/send`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    {
      label: "Accommodation",
      href: `${base}/accommodation`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Seating",
      href: `${base}/seating`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
    },
    {
      label: "Check-in",
      href: `${base}/checkin`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Analytics",
      href: `${base}/analytics`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
    },
    {
      label: "CRM Sync",
      href: `${base}/crm`,
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const isActive = (href: string) =>
    pathname === href || (pathname.startsWith(href + "/") && href !== base);

  const isHome = pathname === base || pathname === base + "/";

  return (
    <div className="flex min-h-screen bg-cream">

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 z-30 flex flex-col
        transition-transform duration-300
        rounded-br-[2rem] overflow-hidden
        border-r border-b border-[#c9a040]/50
        shadow-[4px_0_40px_rgba(201,160,64,0.13)]
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
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
                  style={{ color: "#2c1810", fontFamily: "'Cormorant Garamond', serif" }}>WedRSVP</div>
                <div className="text-[10px] tracking-widest uppercase"
                  style={{ color: "#c9a040", fontFamily: "'Cormorant Garamond', serif" }}>✦ Wedding Dashboard ✦</div>
              </div>
            </div>
          </Link>
        </div>

        <div className="mx-4 my-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #c9a040 40%, transparent)" }} />

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`
                flex items-center gap-2.5 px-3 py-3 rounded-xl border text-sm transition-all duration-200
                ${isActive(item.href)
                  ? "border-[#c9a040]/40 font-semibold shadow-[0_4px_16px_rgba(201,160,64,0.15)]"
                  : "border-transparent hover:border-[#c9a040]/20"}
              `}
              style={isActive(item.href)
                ? { background: "linear-gradient(135deg,#fffce8,#fff8e1)", color: "#9A2143" }
                : { color: "#6b5040" }}
            >
              <span style={{ color: "#c9a040" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#c9a040]/30"
          style={{ background: "linear-gradient(90deg, #fffef5, #fdf7ec)" }}>
          <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-cream transition">
            <svg className="w-5 h-5 text-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-semibold text-navy text-sm">WedRSVP</span>
        </div>

        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-8 relative z-10">
          <div className="mx-auto mb-6 max-w-7xl">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#9e8878]">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-md border border-[#e8ddd0] bg-white px-3 py-2 text-sm text-[#4a3728] transition-colors hover:bg-[#fdf5ee]"
              >
                <span aria-hidden="true">←</span>
                Back
              </button>
              {breadcrumbItems.map((item, index) => (
                <div key={item.href} className="flex items-center gap-3">
                  {index > 0 && <span className="text-[#c9a96e]">/</span>}
                  {index === breadcrumbItems.length - 1 ? (
                    <span className="text-[#2c1810]">{item.label}</span>
                  ) : (
                    <Link href={item.href} className="transition-colors hover:text-[#2c1810]">
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
