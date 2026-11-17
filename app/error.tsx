"use client";
import { BrandLogo } from "@/components/brand";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="state-screen">
      <section>
        <a href="/" aria-label="Courvix home">
          <BrandLogo />
        </a>
        <h1>Let’s get you back on track.</h1>
        <p>
          This page could not be displayed. Try loading it again. If the problem
          continues, contact support with the page address and time; don’t
          include private account details.
        </p>
        <div className="actions">
          <button className="btn primary" onClick={reset}>
            Try again
          </button>
          <a className="btn" href="/">
            Back to Courvix
          </a>
        </div>
      </section>
    </main>
  );
}
