"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        setSigningOut(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
    };

    const isActive = (href: string) => pathname === href;

    // If we're inside a wedding (path has a segment after /dashboard that isn't a known top-level page),
    // let the wedding layout render its own sidebar — just pass children straight through.
    const isInsideWedding = /^\/dashboard\/(?!new|profile)[^/]+/i.test(pathname);
    if (isInsideWedding) return <>{children}</>;

    const navItems = [
        {
            label: "Dashboard",
            href: "/dashboard",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
        },
        {
            label: "Profile & Settings",
            href: "/dashboard/profile",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="flex min-h-screen" style={{ background: "var(--royal-cream)" }}>
            {/* Mobile overlay */}
            {open && (
                <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setOpen(false)} />
            )}

            {/* ── SIDEBAR ─────────────────────────────────────── */}
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
                    <Link href="/dashboard" onClick={() => setOpen(false)}>
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md"
                                style={{ background: "linear-gradient(135deg, #9A2143, #6b1430)" }}>
                                <svg className="w-4 h-4" fill="#e8c76a" viewBox="0 0 24 24">
                                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-semibold tracking-[0.12em] uppercase"
                                    style={{ color: "#2c1810", fontFamily: "'Cormorant Garamond', serif", letterSpacing: "0.12em" }}>
                                    WedRSVP
                                </div>
                                <div className="text-[10px] tracking-widest uppercase"
                                    style={{ color: "#c9a040", fontFamily: "'Cormorant Garamond', serif" }}>
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
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={`
                flex items-center gap-3 px-3 py-3 rounded-xl border text-sm transition-all duration-200
                ${isActive(item.href)
                                    ? "border-[#c9a040]/40 font-semibold shadow-[0_4px_16px_rgba(201,160,64,0.15)]"
                                    : "border-transparent hover:border-[#c9a040]/20"}
              `}
                            style={isActive(item.href)
                                ? { background: "linear-gradient(135deg,#fffce8,#fff8e1)", color: "#9A2143" }
                                : { color: "#6b5040" }}
                        >
                            <span style={{ color: isActive(item.href) ? "#c9a040" : "#c9a040" }}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="mx-4 mb-1 h-px" style={{ background: "linear-gradient(90deg, transparent, #c9a040 40%, transparent)" }} />

                {/* Sign Out */}
                <div className="px-3 py-4">
                    <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex w-full items-center gap-3 px-3 py-3 rounded-xl border border-transparent text-sm transition-all duration-200 hover:border-[#c9a040]/20 disabled:opacity-50"
                        style={{ color: "#8a7060" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,160,64,0.08)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                        <span style={{ color: "#c9a040" }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </span>
                        {signingOut ? "Signing out…" : "Sign out"}
                    </button>
                </div>
            </aside>

            {/* ── MAIN ────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#c9a040]/30"
                    style={{ background: "linear-gradient(90deg, #fffef5, #fdf7ec)" }}>
                    <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg transition"
                        style={{ color: "#8a7060" }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="text-sm tracking-widest uppercase font-semibold"
                        style={{ color: "#2c1810", fontFamily: "'Cormorant Garamond', serif" }}>WedRSVP</span>
                </div>

                <main className="flex-1 px-4 py-5 lg:px-8 lg:py-8 relative z-10">{children}</main>
            </div>
        </div>
    );
}
