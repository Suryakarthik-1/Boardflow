import { services } from "../content";
import Reveal from "./Reveal";

export default function ServicesSection() {
  return (
    <section className="section section--dark" id="services">
      <div className="container">
        <Reveal>
          <div className="section__head">
            <div>
              <span className="eyebrow">{services.eyebrow}</span>
              <h2 className="h2">
                {services.heading[0]}
                <br />
                {services.heading[1]}
              </h2>
            </div>
            <p className="lede">{services.intro}</p>
          </div>
        </Reveal>

        <div className="services__grid">
          {services.panels.map((panel, i) => (
            <Reveal key={panel.title} delay={i * 100}>
              <div className={`service ${i === 0 ? "service--teal" : "service--mint"}`}>
                {i === 0 ? <DotCluster /> : <MeasurementBars />}
                <h3>{panel.title}</h3>
                <p>{panel.body}</p>
                <a className="text-link" href="#cases">
                  {panel.link} →
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function DotCluster() {
  return (
    <svg viewBox="0 0 72 72" role="img" aria-label="Cluster of connected dots">
      <g stroke="#62D6A0" strokeWidth="1.2">
        <line x1="36" y1="36" x2="16" y2="20" />
        <line x1="36" y1="36" x2="56" y2="20" />
        <line x1="36" y1="36" x2="16" y2="52" />
        <line x1="36" y1="36" x2="56" y2="52" />
      </g>
      {[
        [16, 20],
        [56, 20],
        [16, 52],
        [56, 52],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#62D6A0" />
      ))}
      <circle cx="36" cy="36" r="8" fill="#D9F1E5" />
    </svg>
  );
}

function MeasurementBars() {
  const bars: Array<[number, number]> = [
    [16, 38],
    [30, 24],
    [44, 48],
    [58, 32],
  ];
  return (
    <svg viewBox="0 0 72 72" role="img" aria-label="Vertical measurement bars">
      {bars.map(([x, h], i) => (
        <rect
          key={x}
          x={x}
          y={64 - h}
          width="8"
          height={h}
          fill={i % 2 === 0 ? "#62D6A0" : "#D9F1E5"}
        />
      ))}
    </svg>
  );
}
