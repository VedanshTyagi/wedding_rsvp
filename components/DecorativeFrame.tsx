"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
/**
 * Wraps page content with decorative floral borders (DESIGN copy.png)
 * and scattered scrollable mandala watermarks.
 *
 * - Dashboard pages: borders are handled inside their own layouts
 *   (between sidebar and content), so we only render the mandalas here.
 * - Non-dashboard pages: full border + mandalas wrapper.
 * - checkin/guest pages: no decoration at all.
 */
export default function DecorativeFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Global parallax mouse tracker for mandalas
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      const mandalas = document.querySelectorAll<HTMLElement>('.mandala-scatter');
      mandalas.forEach((mandala, index) => {
        const depth = index % 2 === 0 ? 30 : -45;
        mandala.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
        mandala.style.transition = 'transform 0.1s ease-out';
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      const mandalas = document.querySelectorAll<HTMLElement>('.mandala-scatter');
      mandalas.forEach(m => m.style.transform = 'translate(0px, 0px)');
    };
  }, []);

  // No decoration on checkin/guest pages
  if (/\/checkin\/guest\//.test(pathname)) {
    return <>{children}</>;
  }

  const Mandalas = () => (
    <>
      <div className="mandala-scatter mandala-1" aria-hidden="true" />
      <div className="mandala-scatter mandala-2" aria-hidden="true" />
      <div className="mandala-scatter mandala-3" aria-hidden="true" />
      <div className="mandala-scatter mandala-4" aria-hidden="true" />
    </>
  );

  // Dashboard pages handle their own borders (between sidebar & content)
  if (pathname.startsWith("/dashboard")) {
    return (
      <div className="page-frame-content" style={{ position: "static" }}>
        <Mandalas />
        {children}
      </div>
    );
  }

  // All other pages: wrap with side borders
  return (
    <div className="page-frame">
      <div className="decorative-border-left" aria-hidden="true" />
      <div className="page-frame-content">
        <Mandalas />
        {children}
      </div>
      <div className="decorative-border-right" aria-hidden="true" />
    </div>
  );
}
