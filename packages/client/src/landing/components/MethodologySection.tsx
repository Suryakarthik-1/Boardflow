import { methodology } from "../content";
import Reveal from "./Reveal";

export default function MethodologySection() {
  return (
    <section className="section section--light" id="sync">
      <div className="container">
        <Reveal>
          <div className="section__head">
            <div>
              <span className="eyebrow eyebrow--on-light">{methodology.eyebrow}</span>
              <h2 className="h2">
                {methodology.heading[0]}
                <br />
                {methodology.heading[1]}
              </h2>
            </div>
            <p className="lede">{methodology.intro}</p>
          </div>
        </Reveal>

        <div className="methodology__stages">
          {methodology.stages.map((stage, i) => (
            <Reveal key={stage.key} delay={i * 100}>
              <div className="methodology__stage">
                <StageDiagram kind={i} />
                <span className="methodology__key">{stage.key}</span>
                <h3>{stage.title}</h3>
                <p>{stage.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Minimal technical diagrams: nodes / branching / upward curve. */
function StageDiagram({ kind }: { kind: number }) {
  if (kind === 0) {
    // Baseline: central node surrounded by connected nodes.
    return (
      <svg viewBox="0 0 200 130" role="img" aria-label="Central node connected to surrounding nodes">
        <g stroke="#B9C6BF" strokeWidth="1.2">
          {[0, 72, 144, 216, 288].map((deg) => {
            const r = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1="100"
                y1="65"
                x2={100 + 46 * Math.cos(r)}
                y2={65 + 46 * Math.sin(r)}
              />
            );
          })}
        </g>
        {[0, 72, 144, 216, 288].map((deg) => {
          const r = (deg * Math.PI) / 180;
          return (
            <rect
              key={deg}
              x={100 + 46 * Math.cos(r) - 5}
              y={65 + 46 * Math.sin(r) - 5}
              width="10"
              height="10"
              fill="#D9F1E5"
              stroke="#62D6A0"
              strokeWidth="1"
            />
          );
        })}
        <circle cx="100" cy="65" r="9" fill="#62D6A0" />
      </svg>
    );
  }

  if (kind === 1) {
    // Root cause: central square with branching lines to smaller nodes.
    return (
      <svg viewBox="0 0 200 130" role="img" aria-label="Central square branching into smaller nodes">
        <rect x="86" y="51" width="28" height="28" fill="#62D6A0" />
        <g stroke="#B9C6BF" strokeWidth="1.2">
          <line x1="100" y1="51" x2="70" y2="26" />
          <line x1="100" y1="51" x2="130" y2="26" />
          <line x1="100" y1="79" x2="60" y2="104" />
          <line x1="100" y1="79" x2="140" y2="104" />
          <line x1="114" y1="65" x2="150" y2="65" />
        </g>
        {[
          [70, 26],
          [130, 26],
          [60, 104],
          [140, 104],
          [150, 65],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#D9F1E5" stroke="#62D6A0" strokeWidth="1" />
        ))}
      </svg>
    );
  }

  // Proof: upward curve within measurable bounds.
  return (
    <svg viewBox="0 0 200 130" role="img" aria-label="Upward curve within bounded area">
      <g stroke="#E2E7E1" strokeWidth="1">
        <line x1="20" y1="110" x2="20" y2="20" />
        <line x1="20" y1="110" x2="180" y2="110" />
        <line x1="70" y1="20" x2="70" y2="110" strokeDasharray="3 3" />
        <line x1="130" y1="20" x2="130" y2="110" strokeDasharray="3 3" />
      </g>
      <path
        d="M20 96 C 60 90, 80 70, 110 58 S 170 34, 180 28"
        fill="none"
        stroke="#62D6A0"
        strokeWidth="2"
      />
      <circle cx="180" cy="28" r="5" fill="#62D6A0" />
    </svg>
  );
}
