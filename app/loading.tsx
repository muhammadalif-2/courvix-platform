import { BrandLogo } from "@/components/brand";
export default function Loading() {
  return (
    <main className="state-screen" role="status">
      <section>
        <BrandLogo />
        <h1>Getting your workspace ready.</h1>
        <p>Bringing your people, schedules and records into view.</p>
        <div className="state-loading-bar" aria-hidden="true" />
      </section>
    </main>
  );
}
