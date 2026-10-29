import { lazy, Suspense } from "react";
import LandingPage from "./landing/LandingPage";

// The tldraw editor is code-split so the marketing landing page loads without
// pulling in the canvas engine. It lives at `/canvas/<roomId>`.
const Editor = lazy(() => import("./Editor"));

export default function App() {
  if (window.location.pathname.startsWith("/canvas")) {
    return (
      <Suspense fallback={null}>
        <Editor />
      </Suspense>
    );
  }
  return <LandingPage />;
}
