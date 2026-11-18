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
import { TrainingDayStory } from "./public-scenes";
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
export function SportsStory() { return <TrainingDayStory/>; }
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
