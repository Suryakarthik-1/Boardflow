import { footer } from "../content";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div>
            <div className="footer__brand">{footer.brand}</div>
            <div className="footer__tagline">{footer.tagline}</div>
          </div>
          <nav className="footer__links" aria-label="Footer">
            {footer.links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} Boardflow</span>
          <span>A shared canvas that survives bad connections.</span>
        </div>
      </div>
    </footer>
  );
}
