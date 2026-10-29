import { decision } from "../content";
import Reveal from "./Reveal";

export default function DecisionSection() {
  return (
    <section className="section section--light" id="workflow">
      <div className="container">
        <Reveal>
          <div className="section__head">
            <div>
              <span className="eyebrow eyebrow--on-light">{decision.eyebrow}</span>
              <h2 className="h2">
                {decision.heading[0]}
                <br />
                {decision.heading[1]}
                <br />
                {decision.heading[2]}
              </h2>
            </div>
            <p className="lede">{decision.intro}</p>
          </div>
        </Reveal>

        <div className="decision__split">
          <Reveal>
            <ol className="decision__criteria">
              {decision.criteria.map((item, i) => (
                <li className="decision__item" key={item.title}>
                  <span className="decision__num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          <Reveal delay={100}>
            <div className="decision__diagram">
              <DecisionDiagram />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** A mint curve moving through decision stages, with a circular marker. */
function DecisionDiagram() {
  return (
    <svg viewBox="0 0 560 360" role="img" aria-label="Decision flow diagram">
      <path
        d="M40 280 C 120 280, 150 150, 230 120"
        fill="none"
        stroke="#62D6A0"
        strokeWidth="2"
      />
      <path
        d="M230 120 C 300 120, 340 80, 410 60"
        fill="none"
        stroke="#62D6A0"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M230 120 C 300 120, 340 210, 410 250"
        fill="none"
        stroke="#62D6A0"
        strokeWidth="1.5"
        opacity="0.7"
      />

      <circle cx="40" cy="280" r="5" fill="#D9F1E5" />
      <circle cx="230" cy="120" r="9" fill="#62D6A0" />
      <circle cx="410" cy="60" r="5" fill="#D9F1E5" />
      <circle cx="410" cy="250" r="5" fill="#D9F1E5" />

      <text x="52" y="300" fill="#F5F5F0" fontSize="13" letterSpacing="0.06em">
        {decision.diagram.labels[0]}
      </text>
      <text x="252" y="112" fill="#F5F5F0" fontSize="13" letterSpacing="0.06em">
        {decision.diagram.labels[1]}
      </text>
      <text x="422" y="56" fill="#F5F5F0" fontSize="13" letterSpacing="0.06em">
        {decision.diagram.labels[2]}
      </text>
      <text x="422" y="270" fill="#F5F5F0" fontSize="13" letterSpacing="0.06em">
        {decision.diagram.labels[3]}
      </text>
    </svg>
  );
}
