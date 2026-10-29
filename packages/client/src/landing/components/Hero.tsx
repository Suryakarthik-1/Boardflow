import { hero } from "../content";
import { useOpenBoard } from "../useOpenBoard";
import Reveal from "./Reveal";

export default function Hero() {
  const { open: openBoard, pending } = useOpenBoard();
  const [a, b, c] = hero.headline;

  return (
    <section className="hero">
      <div className="container">
        <div className="hero__grid">
          <div>
            <Reveal>
              <span className="eyebrow hero__eyebrow">{hero.eyebrow}</span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="hero__title">
                {a}
                <br />
                {b}
                <br />
                <em>{c}</em>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="hero__desc">{hero.description}</p>
            </Reveal>
            <Reveal delay={240}>
              <div className="hero__actions">
                <a
                  className="btn btn--light"
                  href={hero.primaryCta.href}
                  aria-disabled={pending}
                  onClick={(e) => {
                    e.preventDefault();
                    void openBoard();
                  }}
                >
                  {hero.primaryCta.label}
                </a>
                <a className="text-link" href={hero.secondaryCta.href}>
                  {hero.secondaryCta.label} →
                </a>
              </div>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <HeroArt />
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="hero__foot">
            {hero.footnotes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Abstract architectural still-life: stepped geometric platforms in off-white,
 * mint and saturated green against the dark hero. Drawn as SVG (no raster
 * asset) so it stays crisp and matches the palette exactly.
 */
function HeroArt() {
  return (
    <svg
      className="hero__art"
      viewBox="0 0 560 440"
      role="img"
      aria-label="Abstract geometric composition of stacked blocks"
    >
      <defs>
        <linearGradient id="hf-offwhite" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5F5F0" />
          <stop offset="1" stopColor="#DDE1DA" />
        </linearGradient>
        <linearGradient id="hf-mint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#62D6A0" />
          <stop offset="1" stopColor="#3FB98A" />
        </linearGradient>
        <linearGradient id="hf-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0E5C49" />
          <stop offset="1" stopColor="#073D35" />
        </linearGradient>
        <linearGradient id="hf-pale" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9F1E5" />
          <stop offset="1" stopColor="#B7E3CE" />
        </linearGradient>
      </defs>

      {/* ambient shadow */}
      <ellipse cx="285" cy="384" rx="210" ry="20" fill="#000" opacity="0.28" />

      {/* left green block */}
      <polygon points="60,250 78,236 136,236 118,250" fill="#0E5C49" />
      <rect x="60" y="250" width="58" height="130" fill="url(#hf-green)" />

      {/* right mint column */}
      <polygon points="470,260 488,246 530,246 512,260" fill="#3FB98A" />
      <rect x="470" y="260" width="42" height="120" fill="url(#hf-mint)" />

      {/* platform 1 — off-white */}
      <polygon points="90,300 110,284 490,284 470,300" fill="#E8EAE5" />
      <rect x="90" y="300" width="380" height="80" fill="url(#hf-offwhite)" />

      {/* platform 2 — pale mint */}
      <polygon points="130,244 150,228 450,228 430,244" fill="#C4E8D7" />
      <rect x="130" y="244" width="300" height="56" fill="url(#hf-pale)" />

      {/* platform 3 — mint */}
      <polygon points="170,196 190,180 410,180 390,196" fill="#3FB98A" />
      <rect x="170" y="196" width="220" height="48" fill="url(#hf-mint)" />

      {/* floating accent cube */}
      <polygon points="452,120 468,108 484,120 468,132" fill="#62D6A0" opacity="0.9" />
    </svg>
  );
}
