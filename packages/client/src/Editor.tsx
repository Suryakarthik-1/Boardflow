import { useMemo, type CSSProperties } from "react";
import { Tldraw, type TLComponents } from "tldraw";
import "tldraw/tldraw.css";
import { useRoomSync } from "./sync/useRoomSync";
import {
  CanvasRoomProvider,
  CustomSharePanel,
  CustomTopPanel,
} from "./canvas/CanvasHeader";

/**
 * The collaborative canvas. Reads the room + share token from the URL, connects
 * the store to the sync server, and mounts the editor with custom tldraw
 * component slots (SharePanel and TopPanel) to seamlessly integrate the share
 * dialog and room controls without overlapping tldraw's native toolbars or menus.
 */
export default function Editor() {
  const { roomId, token, name } = useRoomParams();
  const { status, sync, error } = useRoomSync(roomId, token, name);

  const customComponents: TLComponents = useMemo(
    () => ({
      SharePanel: CustomSharePanel,
      TopPanel: CustomTopPanel,
    }),
    []
  );

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
      <CanvasRoomProvider
        roomId={roomId}
        token={token}
        name={name}
        provider={sync.provider}
      >
        <Tldraw store={sync.store} components={customComponents} />
      </CanvasRoomProvider>
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
