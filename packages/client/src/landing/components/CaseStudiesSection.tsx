import { useRef } from "react";
import { cases } from "../content";
import Reveal from "./Reveal";

export default function CaseStudiesSection() {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    scroller.current?.scrollBy({ left: dir * 380, behavior: "smooth" });
  };

  return (
    <section className="section section--light" id="cases">
      <div className="container">
        <Reveal>
          <div className="section__head">
            <div>
              <span className="eyebrow eyebrow--on-light">{cases.eyebrow}</span>
              <h2 className="h2">
                {cases.heading[0]}
                <br />
                {cases.heading[1]}
              </h2>
            </div>
            <p className="lede">{cases.intro}</p>
          </div>
        </Reveal>

        <Reveal>
          <div className="cases__scroller" ref={scroller}>
            {cases.cards.map((card, i) => (
              <article className="case" key={card.title}>
                <div className="case__art">
                  <CaseArt index={i} />
                </div>
                <span className="case__cat">{card.category}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <a className="text-link text-link--dark" href="#cases">
                  Read more →
                </a>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="cases__controls">
            <button className="cases__btn" aria-label="Previous" onClick={() => scrollBy(-1)}>
              ←
            </button>
            <button className="cases__btn" aria-label="Next" onClick={() => scrollBy(1)}>
              →
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CaseArt({ index }: { index: number }) {
  const motifs = [
    // three devices converging
    <>
      <rect x="60" y="50" width="90" height="70" fill="#F5F5F0" stroke="#C9CFC8" />
      <rect x="180" y="50" width="90" height="70" fill="#F5F5F0" stroke="#C9CFC8" />
      <rect x="300" y="50" width="90" height="70" fill="#F5F5F0" stroke="#C9CFC8" />
      <path d="M150 85 H180 M270 85 H300" stroke="#62D6A0" strokeWidth="2" />
      <circle cx="150" cy="85" r="5" fill="#62D6A0" />
      <circle cx="300" cy="85" r="5" fill="#62D6A0" />
    </>,
    // dense grid
    <>
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x={60 + (i % 4) * 60}
          y={40 + Math.floor(i / 4) * 60}
          width="40"
          height="40"
          fill="#D9F1E5"
          stroke="#62D6A0"
          strokeWidth="1"
        />
      ))}
    </>,
    // sticky notes to roadmap
    <>
      {[60, 150, 240, 330].map((x, i) => (
        <rect key={x} x={x} y={50 + (i % 2) * 30} width="70" height="50" fill="#D9F1E5" />
      ))}
      <path d="M60 120 H400" stroke="#62D6A0" strokeWidth="2" />
      <circle cx="400" cy="120" r="5" fill="#62D6A0" />
    </>,
    // diagram
    <>
      <rect x="60" y="60" width="80" height="60" fill="#F5F5F0" stroke="#C9CFC8" />
      <rect x="300" y="60" width="80" height="60" fill="#F5F5F0" stroke="#C9CFC8" />
      <line x1="140" y1="90" x2="300" y2="90" stroke="#62D6A0" strokeWidth="2" />
      <circle cx="140" cy="90" r="5" fill="#62D6A0" />
      <circle cx="300" cy="90" r="5" fill="#62D6A0" />
    </>,
  ];

  return (
    <svg viewBox="0 0 460 160" role="img" aria-label="Case study illustration">
      <rect width="460" height="160" fill="#E8EAE5" />
      {motifs[index % motifs.length]}
    </svg>
  );
}
