import { useState, useEffect, useMemo, type CSSProperties } from "react";
import type { WebsocketProvider } from "y-websocket";

interface Collaborator {
  id: string;
  name: string;
  color: string;
}

interface CanvasHeaderProps {
  roomId: string;
  token: string;
  currentName: string;
  provider: WebsocketProvider;
}

export function CanvasHeader({
  roomId,
  token,
  currentName,
  provider,
}: CanvasHeaderProps) {
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roomName, setRoomName] = useState<string>("Boardflow");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isConnected, setIsConnected] = useState(provider.wsconnected);

  // Fetch room name from API
  useEffect(() => {
    if (!roomId) return;
    fetch(`/api/rooms/${roomId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.name) setRoomName(data.name);
      })
      .catch(() => {});
  }, [roomId]);

  // Track connection status
  useEffect(() => {
    const onStatus = () => setIsConnected(provider.wsconnected);
    provider.on("status", onStatus);
    provider.on("sync", onStatus);
    return () => {
      provider.off("status", onStatus);
      provider.off("sync", onStatus);
    };
  }, [provider]);

  // Track active collaborators via awareness
  useEffect(() => {
    const awareness = provider.awareness;
    const updateCollaborators = () => {
      const states = awareness.getStates();
      const list: Collaborator[] = [];
      states.forEach((state) => {
        if (state && typeof state === "object" && "name" in state) {
          const s = state as { id?: string; name: string; color?: string };
          list.push({
            id: s.id ?? Math.random().toString(),
            name: s.name,
            color: s.color ?? "#62d6a0",
          });
        }
      });
      setCollaborators(list);
    };

    updateCollaborators();
    awareness.on("change", updateCollaborators);
    return () => {
      awareness.off("change", updateCollaborators);
    };
  }, [provider]);

  // Share link with token
  const shareUrl = useMemo(() => {
    const url = new URL(window.location.href);
    if (token) url.searchParams.set("token", token);
    url.searchParams.delete("name"); // let joining guest generate their own name
    return url.toString();
  }, [token]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      <header style={headerStyle}>
        {/* Left: Branding & Room Info */}
        <div style={leftSectionStyle}>
          <a href="/" style={homeLinkStyle} title="Back to Home">
            <span style={{ fontSize: "16px" }}>←</span>
            <span style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Boardflow</span>
          </a>
          <span style={dividerStyle}>/</span>
          <span style={roomTitleStyle}>{roomName}</span>
          <span
            style={{
              ...statusDotStyle,
              background: isConnected ? "#3fb98a" : "#f5b301",
            }}
            title={isConnected ? "Connected (Realtime Sync Active)" : "Reconnecting..."}
          />
        </div>

        {/* Right: Collaborators & Share Button */}
        <div style={rightSectionStyle}>
          {/* Active Collaborators Avatars */}
          <div style={avatarGroupStyle}>
            {collaborators.map((c, i) => (
              <div
                key={`${c.id}-${i}`}
                style={{
                  ...avatarStyle,
                  background: c.color,
                  marginLeft: i === 0 ? 0 : "-8px",
                  zIndex: 10 - i,
                }}
                title={c.name === currentName ? `${c.name} (You)` : c.name}
              >
                {c.name.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>

          {/* Share Button */}
          <button
            style={shareButtonStyle}
            onClick={() => setShowShare(true)}
            aria-label="Share this board"
          >
            <ShareIcon />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Share Modal Dialog */}
      {showShare && (
        <div style={modalBackdropStyle} onClick={() => setShowShare(false)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <div>
                <h3 style={modalTitleStyle}>Share board</h3>
                <p style={modalSubtitleStyle}>
                  Anyone with this link can view and collaborate in real-time.
                </p>
              </div>
              <button
                style={closeButtonStyle}
                onClick={() => setShowShare(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div style={inputGroupStyle}>
              <input
                type="text"
                readOnly
                value={shareUrl}
                style={inputStyle}
                onFocus={(e) => e.target.select()}
              />
              <button
                style={{
                  ...copyButtonStyle,
                  background: copied ? "#3fb98a" : "#62d6a0",
                  color: "#062a24",
                }}
                onClick={handleCopy}
              >
                {copied ? "Copied! ✓" : "Copy link"}
              </button>
            </div>

            <div style={metaFooterStyle}>
              <span style={badgeStyle}>Role: Editor</span>
              <span style={userNoticeStyle}>
                You are drawing as <strong>{currentName}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Styles (Scoped, High z-index to overlay canvas cleanly)
// ---------------------------------------------------------------------------

const headerStyle: CSSProperties = {
  position: "absolute",
  top: 10,
  left: 12,
  right: 12,
  zIndex: 400,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  pointerEvents: "none", // lets canvas below receive clicks except on controls
};

const leftSectionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(6, 42, 36, 0.88)",
  backdropFilter: "blur(12px)",
  padding: "7px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(245, 245, 240, 0.12)",
  boxShadow: "0 4px 18px rgba(0, 0, 0, 0.18)",
  pointerEvents: "auto",
};

const rightSectionStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  pointerEvents: "auto",
};

const homeLinkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  color: "#f5f5f0",
  textDecoration: "none",
  fontSize: "14px",
};

const dividerStyle: CSSProperties = {
  color: "rgba(245, 245, 240, 0.28)",
  fontSize: "14px",
};

const roomTitleStyle: CSSProperties = {
  color: "#d9f1e5",
  fontSize: "13px",
  fontWeight: 500,
  maxWidth: "180px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const statusDotStyle: CSSProperties = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  display: "inline-block",
  marginLeft: "2px",
};

const shareButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  background: "#62d6a0",
  color: "#062a24",
  border: "none",
  borderRadius: "8px",
  padding: "8px 14px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.22)",
  transition: "all 0.15s ease",
};

const avatarGroupStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  background: "rgba(6, 42, 36, 0.88)",
  backdropFilter: "blur(12px)",
  padding: "4px 8px",
  borderRadius: "10px",
  border: "1px solid rgba(245, 245, 240, 0.12)",
};

const avatarStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  fontSize: "11px",
  fontWeight: 800,
  color: "#062a24",
  border: "2px solid #062a24",
  userSelect: "none",
};

const modalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.5)",
  backdropFilter: "blur(4px)",
  zIndex: 1000,
  display: "grid",
  placeItems: "center",
  padding: "20px",
};

const modalCardStyle: CSSProperties = {
  background: "#073d35",
  border: "1px solid rgba(245, 245, 240, 0.16)",
  borderRadius: "14px",
  padding: "24px",
  width: "100%",
  maxWidth: "480px",
  boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
  color: "#f5f5f0",
  fontFamily: "inherit",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 700,
  color: "#f5f5f0",
};

const modalSubtitleStyle: CSSProperties = {
  margin: "6px 0 0 0",
  fontSize: "13px",
  color: "#d9f1e5",
  opacity: 0.85,
};

const closeButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "rgba(245, 245, 240, 0.6)",
  fontSize: "16px",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: "6px",
};

const inputGroupStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  marginTop: "16px",
  marginBottom: "16px",
};

const inputStyle: CSSProperties = {
  flex: 1,
  background: "#062a24",
  border: "1px solid rgba(245, 245, 240, 0.18)",
  borderRadius: "8px",
  padding: "10px 12px",
  color: "#f5f5f0",
  fontSize: "13px",
  outline: "none",
};

const copyButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "8px",
  padding: "10px 16px",
  fontWeight: 700,
  fontSize: "13px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "background 0.2s ease",
};

const metaFooterStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "12px",
  borderTop: "1px solid rgba(245, 245, 240, 0.1)",
  fontSize: "12px",
};

const badgeStyle: CSSProperties = {
  background: "rgba(98, 214, 160, 0.14)",
  color: "#62d6a0",
  padding: "3px 8px",
  borderRadius: "4px",
  fontWeight: 600,
};

const userNoticeStyle: CSSProperties = {
  color: "rgba(245, 245, 240, 0.7)",
};
