import { footer } from "../content";

export default function UtilityBar() {
  return (
    <div className="utility">
      <span className="utility__brand">
        <span className="utility__dot" aria-hidden="true" />
        {footer.brand}
      </span>
      <a href="/canvas">Launch demo</a>
    </div>
  );
}
