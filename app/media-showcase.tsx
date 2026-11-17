"use client";
import { useRef, useState } from "react";
import {
  Play,
  Download,
  ArrowUpRight,
  Film,
  Clock3,
  ArrowRight,
  Pause,
} from "lucide-react";
import "./media-showcase.css";
import media from "@/public/media/media-manifest.json";
const demoFilm = media.videos[0];
const teaserFilm = media.videos[1];
const chapters = demoFilm.chapters.map(
  ({ start, title }) => [start, title] as const,
);
const durationLabel = (seconds: number) =>
  Math.floor(seconds / 60) +
  ":" +
  String(Math.floor(seconds % 60)).padStart(2, "0");
const mediaRevision = "narrated-v2";
export function DemoVideo() {
  const ref = useRef<HTMLVideoElement>(null),
    seek = useRef<number | null>(null),
    [active, setActive] = useState(0),
    [error, setError] = useState("");
  function jump(time: number) {
    const v = ref.current;
    if (!v) return;
    setError("");
    seek.current = time;
    if (v.readyState > 0) {
      v.currentTime = time;
      seek.current = null;
    } else v.load();
    void v
      .play()
      .catch(() => setError("Press Play in the player to continue."));
  }
  return (
    <section className="m-section media-showcase" id="product-film">
      <div className="premium-section-heading">
        <span className="m-eyebrow">THE COURVIX PRODUCT FILM</span>
        <h2>
          A clearer business.
          <br />
          From setup to the next session.
        </h2>
        <p>
          See how Club Management and Personal Training connect your records,
          your people and the next action. Follow the narrated tour, or jump
          straight to the workflow that matters to you.
        </p>
      </div>
      <div className="media-player-layout">
        <div className="media-player">
          <video
            ref={ref}
            controls
            playsInline
            preload="none"
            poster={"/media/courvix-demo-poster.jpg?v=" + mediaRevision}
            onLoadedMetadata={() => {
              if (seek.current !== null) {
                ref.current!.currentTime = seek.current;
                seek.current = null;
              }
            }}
            onTimeUpdate={(e) => {
              const t = e.currentTarget.currentTime;
              let index = 0;
              chapters.forEach(([s], i) => {
                if (t >= s) index = i;
              });
              setActive(index);
            }}
            onError={() =>
              setError(
                "The video could not load. Try the download link or the interactive demo.",
              )
            }
            aria-label="Courvix narrated product walkthrough in English"
          >
            <source
              src={"/api/media?file=" + demoFilm.file + "&v=" + mediaRevision}
              type="video/mp4"
            />
            <track
              kind="captions"
              src={"/media/" + demoFilm.captions + "?v=" + mediaRevision}
              srcLang="en"
              label="English captions"
            />
            Your browser does not support video.{" "}
            <a href={"/media/" + demoFilm.file + "?v=" + mediaRevision}>
              Download the product demo.
            </a>
          </video>
          <div className="media-video-meta">
            <span>
              <Clock3 size={13} />
              {durationLabel(demoFilm.duration)} · English AI narration +
              captions
            </span>
            <span>Original music + sound effects</span>
          </div>
          {error && (
            <p className="media-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <aside className="media-chapters" aria-label="Video chapters">
          <span>CHOOSE YOUR CHAPTER</span>
          {chapters.map(([time, title], i) => (
            <button
              key={time}
              className={active === i ? "active" : ""}
              aria-current={active === i ? "true" : undefined}
              onClick={() => jump(time)}
            >
              <span>
                {Math.floor(time / 60) +
                  ":" +
                  String(time % 60).padStart(2, "0")}
              </span>
              <b>{title}</b>
              <Play size={12} />
            </button>
          ))}
          <a href={"/media/" + demoFilm.file + "?v=" + mediaRevision} download>
            <Download size={14} />
            Download 1080p demo
          </a>
        </aside>
      </div>
      <p className="media-disclosure">
        A narrated motion-design tour with sports photography, sample product
        records and English captions. Synthetic voice; no customer recordings.
        Try the <a href="/demo">interactive demo</a> or{" "}
        <a href="/media/courvix-video-scripts.txt" download>
          download the scripts
        </a>
        .
      </p>
    </section>
  );
}
export function SportsStory() {
  const [sport, setSport] = useState(0),
    [paused, setPaused] = useState(false);
  const names = ["Court sports", "Track & endurance", "Personal training"];
  return (
    <section
      className={"m-section sports-story " + (paused ? "motion-paused" : "")}
    >
      <div className="sports-stage">
        <img
          src="/courvix-track.webp"
          alt="Athlete training on an outdoor track"
          loading="lazy"
        />
        <div className="sports-stage-shade" />
        <svg viewBox="0 0 600 540" className="sports-motion" aria-hidden="true">
          <defs>
            <linearGradient id="sport-line">
              <stop stopColor="#ffb276" />
              <stop offset="1" stopColor="#fff1d9" />
            </linearGradient>
          </defs>
          {sport === 0 ? (
            <g className="court-animation">
              <rect x="75" y="100" width="450" height="350" rx="12" />
              <path d="M300 100V450M75 275H525M190 275a110 110 0 1 0 220 0a110 110 0 1 0 -220 0" />
              <circle className="sport-ball" cx="300" cy="275" r="18" />
              <path className="sport-trail" d="M130 370Q300 90 465 220" />
            </g>
          ) : sport === 1 ? (
            <g className="track-animation">
              {[0, 1, 2, 3].map((i) => (
                <path
                  key={i}
                  d={
                    "M" +
                    (90 + i * 55) +
                    " 450Q" +
                    (30 + i * 55) +
                    " 150 " +
                    (360 + i * 55) +
                    " 90"
                  }
                />
              ))}
              <g className="sport-runner">
                <circle cx="310" cy="200" r="20" />
                <path d="M300 225L280 305M300 235L355 265L380 225M290 245L245 270L220 240M280 305L330 350L370 335M280 305L235 365L190 365" />
              </g>
            </g>
          ) : (
            <g className="strength-animation">
              <path d="M90 390H510" />
              <circle cx="300" cy="180" r="22" />
              <path d="M300 205L300 300M300 230L240 255L230 205M300 230L360 255L370 205M300 300L245 350L230 390M300 300L355 350L370 390" />
              <g className="sport-barbell">
                <path d="M170 170H430M190 135V205M210 145V195M390 145V195M410 135V205" />
              </g>
            </g>
          )}
        </svg>
        <div className="sports-stage-caption">
          <span>THE SPORT CHANGES.</span>
          <strong>
            The work behind it
            <br />
            deserves clarity.
          </strong>
        </div>
        <button
          className="sports-pause"
          onClick={() => setPaused(!paused)}
          aria-label={
            paused ? "Resume sports animation" : "Pause sports animation"
          }
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </button>
      </div>
      <div className="sports-story-copy">
        <span className="m-eyebrow">BUILT AROUND THE WAY YOU COACH</span>
        <h2>
          Different disciplines.
          <br />A shared need for clarity.
        </h2>
        <p>
          Behind the next practice, race or personal milestone are people,
          schedules and payment records. Give that work a clear home.
        </p>
        <div
          className="sports-story-tabs"
          role="group"
          aria-label="Sport illustration"
        >
          {names.map((name, i) => (
            <button
              key={name}
              aria-pressed={sport === i}
              onClick={() => setSport(i)}
            >
              {name}
              <ArrowRight size={12} />
            </button>
          ))}
        </div>
        <p className="sports-feature-copy">
          {sport === 0
            ? "Keep team rosters, coach assignments, training sessions and recurring dues together."
            : sport === 1
              ? "Organize training groups, session attendance and the records behind consistent practice."
              : "Connect client goals, session packs, appointments and recorded progress."}
        </p>
        <a
          className="m-text-link"
          href={sport === 2 ? "/personal-training" : "/clubs"}
        >
          Explore the workflow <ArrowUpRight size={16} />
        </a>
      </div>
    </section>
  );
}
export function SocialTeaser() {
  return (
    <section className="m-section social-teaser" id="teaser">
      <div>
        <span className="m-eyebrow">THE COURVIX BRAND TEASER</span>
        <h2>
          Your sport.
          <br />
          Your next chapter.
        </h2>
        <p>
          Built for sport. Designed for management. A narrated introduction to
          the people and workflows behind Courvix, designed specifically for a
          4:5 social feed with captions, music and sound effects.
        </p>
        <div className="social-format-tags">
          <span>{Math.round(teaserFilm.duration)} seconds</span>
          <span>1080 × 1350</span>
          <span>4:5 portrait</span>
        </div>
        <a
          className="m-button"
          href={"/media/" + teaserFilm.file + "?v=" + mediaRevision}
          download
        >
          Download social teaser <Download size={16} />
        </a>
        <small>
          For your Courvix social channels. No posting is performed from this
          page.
        </small>
      </div>
      <div className="social-teaser-player">
        <video
          controls
          playsInline
          preload="none"
          poster={"/media/courvix-teaser-poster.jpg?v=" + mediaRevision}
          aria-label="Courvix narrated social teaser, 4 by 5 portrait"
        >
          <source
            src={"/api/media?file=" + teaserFilm.file + "&v=" + mediaRevision}
            type="video/mp4"
          />
          <track
            kind="captions"
            src={"/media/" + teaserFilm.captions + "?v=" + mediaRevision}
            srcLang="en"
            label="English captions"
          />
          <a href={"/media/" + teaserFilm.file + "?v=" + mediaRevision}>
            Download teaser
          </a>
        </video>
      </div>
    </section>
  );
}
