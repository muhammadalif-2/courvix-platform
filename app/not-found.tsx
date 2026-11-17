import { BrandLogo } from "@/components/brand";
export default function NotFound() {
  return (
    <main className="state-screen">
      <section>
        <a href="/" aria-label="Courvix home">
          <BrandLogo />
        </a>
        <h1>A different route to your next session.</h1>
        <p>
          This page may have moved or the address may be incomplete. Open your
          workspace or return to Courvix to find the right place.
        </p>
        <div className="actions">
          <a className="btn primary" href="/dashboard">
            Open workspace
          </a>
          <a className="btn" href="/">
            Back to Courvix
          </a>
        </div>
      </section>
    </main>
  );
}
