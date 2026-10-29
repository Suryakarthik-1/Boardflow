import { about } from "../content";
import Reveal from "./Reveal";

export default function AboutSection() {
  return (
    <section className="section section--light" id="about">
      <div className="container">
        <div className="about__split">
          <Reveal>
            <div className="about__art">
              <AboutArt />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div>
              <span className="eyebrow eyebrow--on-light">{about.eyebrow}</span>
              <h2 className="h2">
                {about.heading[0]}
                <br />
                {about.heading[1]}
              </h2>
              <div className="about__body">
                {about.body.map((p) => (
                  <p key={p.slice(0, 24)}>{p}</p>
                ))}
              </div>
              <div className="about__badges">
                {about.badges.map((badge) => (
                  <span className="about__badge" key={badge}>
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Abstract editorial mark (stands in for the reference's founder photograph). */
function AboutArt() {
  return (
    <svg viewBox="0 0 400 500" role="img" aria-label="Abstract Boardflow mark">
      <rect width="400" height="500" fill="#E8EAE5" />
      <g stroke="#C9CFC8" strokeWidth="1" opacity="0.6">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1="0" y1={60 * i} x2="400" y2={60 * i} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1={60 * i} y1="0" x2={60 * i} y2="500" />
        ))}
      </g>
      <polygon points="120,220 200,160 280,220 280,300 200,360 120,300" fill="#D9F1E5" />
      <polygon points="140,220 200,180 260,220 260,300 200,340 140,300" fill="none" stroke="#62D6A0" strokeWidth="2" />
      <circle cx="200" cy="250" r="20" fill="#62D6A0" />
    </svg>
  );
}
