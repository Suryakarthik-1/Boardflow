import { useState } from "react";
import { nav } from "../content";
import { useOpenBoard } from "../useOpenBoard";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { open: openBoard, pending } = useOpenBoard();

  return (
    <header className="nav">
      <a className="nav__brand" href="#">
        <span className="nav__mark" aria-hidden="true" />
        {nav.brand}
      </a>

      <nav className="nav__links" aria-label="Primary">
        {nav.links.map((link) => (
          <a key={link.href} className="nav__link" href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

      <a
        className="btn btn--light nav__cta"
        href={nav.cta.href}
        aria-disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          void openBoard();
        }}
      >
        {nav.cta.label}
      </a>

      <button
        className="nav__toggle"
        aria-label="Toggle navigation"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <nav className="nav__mobile" aria-label="Mobile">
          {nav.links.map((link) => (
            <a
              key={link.href}
              className="nav__link"
              href={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
