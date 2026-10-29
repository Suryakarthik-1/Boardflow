import { value } from "../content";
import { useOpenBoard } from "../useOpenBoard";
import Reveal from "./Reveal";

export default function ValueSection() {
  const { open: openBoard, pending } = useOpenBoard();
  return (
    <section className="section section--light" id="value">
      <div className="container">
        <Reveal>
          <div className="section__head">
            <div>
              <span className="eyebrow eyebrow--on-light">{value.eyebrow}</span>
              <h2 className="h2">
                {value.heading[0]}
                <br />
                {value.heading[1]}
              </h2>
            </div>
          </div>
        </Reveal>

        <div className="value__columns">
          {value.columns.map((col, i) => (
            <Reveal key={col.title} delay={i * 100}>
              <div className="value__col">
                <ValueIcon index={i} />
                <h3>{col.title}</h3>
                <p>{col.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="value__statement">
            <div>
              <p>{value.statement}</p>
              <a
                className="btn btn--dark"
                href={value.cta.href}
                aria-disabled={pending}
                onClick={(e) => {
                  e.preventDefault();
                  void openBoard();
                }}
              >
                {value.cta.label}
              </a>
            </div>
            <ValueArt />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ValueIcon({ index }: { index: number }) {
  const icons = [
    // broken / interrupted link
    <g key="a" stroke="#62D6A0" strokeWidth="1.6">
      <line x1="10" y1="20" x2="30" y2="20" />
      <line x1="38" y1="36" x2="46" y2="44" />
    </g>,
    // question node
    <g key="b">
      <circle cx="28" cy="28" r="16" fill="none" stroke="#62D6A0" strokeWidth="1.6" />
      <text x="28" y="33" textAnchor="middle" fontSize="16" fill="#102B25">
        ?
      </text>
    </g>,
    // misaligned chart
    <g key="c" stroke="#62D6A0" strokeWidth="1.6">
      <path d="M10 44 L18 32 L26 40 L34 22 L42 30 L46 18" fill="none" />
    </g>,
  ];
  return (
    <svg viewBox="0 0 56 56" role="img" aria-label="Icon">
      {icons[index]}
    </svg>
  );
}

function ValueArt() {
  return (
    <svg viewBox="0 0 220 220" role="img" aria-label="Abstract geometric illustration">
      <polygon points="30,150 60,130 120,130 90,150" fill="#D9F1E5" />
      <rect x="30" y="150" width="60" height="60" fill="#62D6A0" />
      <polygon points="110,110 140,90 200,90 170,110" fill="#E8EAE5" />
      <rect x="110" y="110" width="60" height="80" fill="#102B25" />
    </svg>
  );
}
