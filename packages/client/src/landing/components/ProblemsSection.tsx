import { useState } from "react";
import { problems } from "../content";
import Reveal from "./Reveal";

export default function ProblemsSection() {
  const [active, setActive] = useState(0);
  const current = problems.categories[active] ?? problems.categories[0]!;

  return (
    <section className="section section--light" id="product">
      <div className="container">
        <Reveal>
          <div className="section__head">
            <div>
              <span className="eyebrow eyebrow--on-light">{problems.eyebrow}</span>
              <h2 className="h2">
                {problems.heading[0]}
                <br />
                {problems.heading[1]}
              </h2>
            </div>
            <p className="lede">{problems.intro}</p>
          </div>
        </Reveal>

        <Reveal>
          <div className="problems__tabs" role="tablist" aria-label="Problems">
            {problems.categories.map((cat, i) => (
              <button
                key={cat.id}
                role="tab"
                aria-selected={i === active}
                className={`problems__tab ${i === active ? "is-active" : ""}`}
                onClick={() => setActive(i)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="problems__split">
          <Reveal>
            <div>
              <h3 className="problems__title">{current.title}</h3>
              <p className="problems__body">{current.body}</p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <ProblemArt index={active} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/**
 * A warm, muted editorial illustration that changes with the selected problem.
 * Stands in for the reference's photograph (no broken image links).
 */
function ProblemArt({ index }: { index: number }) {
  return (
    <svg
      viewBox="0 0 520 340"
      style={{ width: "100%", height: "auto" }}
      role="img"
      aria-label="Abstract editorial illustration"
    >
      <rect width="520" height="340" fill="#E8EAE5" />
      <rect x="40" y="40" width="440" height="260" fill="#F5F5F0" />

      {/* a small canvas-like grid of nodes and links, shifted per problem */}
      <g stroke="#C9CFC8" strokeWidth="1">
        <line x1="80" y1="90" x2="200" y2="90" />
        <line x1="80" y1="90" x2="80" y2="210" />
        <line x1="200" y1="90" x2="200" y2="210" />
        <line x1="80" y1="210" x2="200" y2="210" />
      </g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(${80 + i * 44 + (index * 18) % 30}, ${90 + (i % 2) * 120})`}>
          <rect width="26" height="26" fill="#D9F1E5" stroke="#62D6A0" strokeWidth="1.5" />
        </g>
      ))}
      <circle cx="360" cy="170" r="46" fill="none" stroke="#62D6A0" strokeWidth="1.5" />
      <circle cx="360" cy="170" r="20" fill="#D9F1E5" />
      <rect x="300" y="260" width="160" height="10" fill="#102B25" opacity="0.08" />
    </svg>
  );
}
