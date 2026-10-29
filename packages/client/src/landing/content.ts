/**
 * All landing-page copy in one place so wording can be tuned without touching
 * component markup. The design language follows the Cadvel reference
 * (editorial, architectural, restrained); the content is Boardflow's.
 */

export const nav = {
  brand: "Boardflow",
  links: [
    { label: "Product", href: "#product" },
    { label: "How it syncs", href: "#sync" },
    { label: "Demo", href: "#cases" },
    { label: "About", href: "#about" },
  ],
  cta: { label: "Open canvas", href: "/canvas" },
};

export const hero = {
  eyebrow: "AI collaborative creation platform",
  headline: ["Your team's thinking,", "on one canvas.", "In sync — even offline."],
  description:
    "Boardflow is a shared canvas for docs, diagrams and visual planning. Edits converge in real time, keep working through bad connections, and AI reasons over the actual objects on your board — not a screenshot of it.",
  primaryCta: { label: "Open the canvas", href: "/canvas" },
  secondaryCta: { label: "Watch the demo", href: "#cases" },
  footnotes: ["CRDT-synchronized", "Local-first", "AI-native"],
};

export const problems = {
  eyebrow: "Why teams switch",
  heading: ["Five collaboration problems", "we solve on one canvas"],
  intro:
    "Most tools lose work in the gap between thinking and shipping. Boardflow removes the gap itself.",
  categories: [
    {
      id: "lost-work",
      label: "Lost work",
      title: "Edits that survive a dropped connection",
      body: "A refresh, a flight, a dead link — and the afternoon's work is gone. Boardflow keeps every change in a local-first CRDT, so nothing is lost. It converges the moment you're back online.",
    },
    {
      id: "version-chaos",
      label: "Version chaos",
      title: "One document, not eleven files",
      body: "Diagram_final_v2 (1).png is a symptom, not a workflow. Boardflow keeps one living canvas with snapshots you can browse and restore — no more archaeology across chat threads.",
    },
    {
      id: "tool-sprawl",
      label: "Tool sprawl",
      title: "Docs, diagrams and plans in one place",
      body: "Stop gluing a whiteboard, a doc and a roadmap together with screenshots. Boardflow holds structured objects — notes, arrows, frames, documents — on a single surface.",
    },
    {
      id: "slow-handoffs",
      label: "Slow handoffs",
      title: "Presence that closes the loop",
      body: "Live cursors, selections and comments mean a decision gets made in the room, not three days later. See who's editing, where, right now.",
    },
    {
      id: "no-ai-leverage",
      label: "No AI leverage",
      title: "AI that reads the board, not your prompt history",
      body: "Because the AI works on the canvas objects themselves, it turns sticky notes into a roadmap, explains a diagram, and extracts tasks — grounded in what's actually on screen.",
    },
  ],
};

export const methodology = {
  eyebrow: "How it syncs",
  heading: ["We only ship what", "provably converges"],
  intro:
    "Before a single feature, we built the synchronization guarantee first. Three properties make offline collaboration deterministic, not eventual.",
  stages: [
    {
      key: "Baseline",
      title: "Local-first",
      body: "Every edit applies to your canvas instantly — no round-trip to a server. Feedback lands in under 100ms, whether or not you're connected.",
    },
    {
      key: "Root cause",
      title: "CRDT merge",
      body: "Last-write-wins is the root cause of lost work. A CRDT merges concurrent edits into one structure instead of overwriting someone's changes.",
    },
    {
      key: "Proof",
      title: "Convergence",
      body: "Disconnect, edit from three machines, reconnect — every client converges to the identical document, deterministically, every time.",
    },
  ],
};

export const services = {
  eyebrow: "The product",
  heading: ["Start with one canvas", "and a shared baseline"],
  intro:
    "Boardflow splits cleanly into two layers: a real-time canvas that never drops your work, and an AI that operates on the objects already on it.",
  panels: [
    {
      title: "Live canvas",
      body: "Multiplayer presence, comments and CRDT sync. See who's editing — online or offline — and converge without conflicts.",
      link: "Read more",
    },
    {
      title: "AI copilot",
      body: "Turn sticky notes into a roadmap, a diagram into an explanation, or a prompt into new nodes. The AI works on the canvas itself.",
      link: "Read more",
    },
  ],
};

export const cases = {
  eyebrow: "Demo",
  heading: ["Every canvas leaves", "a version behind"],
  intro:
    "Snapshots and measurable guarantees — the kind you can show in a one-minute demo video.",
  cards: [
    {
      category: "Sync",
      title: "Three machines, one board",
      body: "Open the same canvas on three devices, disconnect one, edit everywhere, reconnect — watch the edits converge deterministically.",
    },
    {
      category: "Performance",
      title: "Thousands of objects",
      body: "A stress test with 1,000+ canvas objects keeps the editor smooth and synchronization bounded.",
    },
    {
      category: "AI",
      title: "Sticky notes → roadmap",
      body: "One prompt turns a wall of sticky notes into a phased roadmap you can act on.",
    },
    {
      category: "AI",
      title: "Diagram → architecture",
      body: "Ask the AI to explain a diagram and get a clear technical write-up, grounded in the objects themselves.",
    },
  ],
};

export const decision = {
  eyebrow: "The workflow",
  heading: ["You can start with a", "share link. We designed", "it that way."],
  intro:
    "No account, no setup. Open a canvas, hand out the link, and reach for AI only when the board is ready for it.",
  criteria: [
    {
      title: "One share link",
      body: "Create a canvas and hand out a link. Viewer or editor is decided on the link — no signup in the way.",
    },
    {
      title: "Works offline",
      body: "Bad Wi-Fi doesn't stop the meeting. Edits queue locally and land the moment you reconnect.",
    },
    {
      title: "AI when you want it",
      body: "Start with sync. Turn on AI features when the board is ready to summarize, roadmap, or explain itself.",
    },
  ],
  diagram: { labels: ["Past info", "Decision", "Go further", "Stop"] },
};

export const value = {
  eyebrow: "Why it matters",
  heading: ["The cost of", "not syncing"],
  columns: [
    {
      title: "Without sync",
      body: "Edits that vanish on a dropped connection, redone in a follow-up meeting no one wanted.",
    },
    {
      title: "Unexplained decisions",
      body: "A roadmap nobody can trace back to the thinking that produced it — decisions without evidence.",
    },
    {
      title: "Customer impact",
      body: "Misaligned teams shipping from different versions of the same plan.",
    },
  ],
  statement:
    "Measurement before motion. Boardflow makes the state of your team's thinking visible, shareable, and provably in sync — before you build on it.",
  cta: { label: "Open the canvas", href: "/canvas" },
};

export const about = {
  eyebrow: "About",
  heading: ["Built to survive", "a bad connection"],
  body: [
    "Boardflow is an AI collaborative creation platform, built in 2026. It pairs CRDT synchronization with AI that works on the actual objects of your board — so collaboration keeps working through bad connections, and the AI understands the canvas, not a screenshot of it.",
    "The thesis is simple: collaboration software should never lose your work, and AI should reason over the real structure you've built — before it ever suggests designing, building, or fixing the platform behind it.",
  ],
  badges: ["React", "TypeScript", "Yjs", "WebSockets", "MongoDB", "Redis", "DeepSeek"],
};

export const footer = {
  brand: "Boardflow",
  tagline: "A shared canvas that survives bad connections.",
  links: [
    { label: "Product", href: "#product" },
    { label: "How it syncs", href: "#sync" },
    { label: "Demo", href: "#cases" },
    { label: "About", href: "#about" },
  ],
};
