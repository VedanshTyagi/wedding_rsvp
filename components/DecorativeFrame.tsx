"use client";

import { usePathname } from "next/navigation";

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
