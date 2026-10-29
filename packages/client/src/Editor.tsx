import { useMemo, type CSSProperties } from "react";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";
import { useRoomSync } from "./sync/useRoomSync";

/**
 * The collaborative canvas. Reads the room + share token from the URL, connects
 * the store to the sync server, and only mounts the editor once the document
 * has been reconciled (so a joining peer sees existing content rather than
 * creating a duplicate default page).
 */
export default function Editor() {
  const { roomId, token, name } = useRoomParams();
  const { status, sync, error } = useRoomSync(roomId, token, name);

  if (status === "error") {
    return (
      <div style={center}>
        <p>Couldn’t open this board: {error}</p>
      </div>
    );
  }

  if (status !== "ready" || !sync) {
    return (
      <div style={center}>
        <p>Connecting…</p>
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      <Tldraw store={sync.store} />
    </div>
  );
}

const center: CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "grid",
  placeItems: "center",
};

function useRoomParams() {
  return useMemo(() => {
    // /canvas/<roomId>?token=…&name=…
    const roomId = window.location.pathname.split("/").filter(Boolean)[1] ?? "";
    const params = new URLSearchParams(window.location.search);
    return {
      roomId,
      token: params.get("token") ?? "",
      name: params.get("name") ?? "Guest",
    };
  }, []);
}
