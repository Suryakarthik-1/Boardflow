import { useEffect, useState } from "react";
import { connectRoomSync, type RoomSync } from "./connectRoom";

export type RoomStatus = "loading" | "ready" | "error";

export interface RoomSyncState {
  status: RoomStatus;
  sync?: RoomSync;
  error?: string;
}

/**
 * Connect a room's tldraw store to the sync server. Reconnects/reloads whenever
 * the room id, token or name change. The store is only exposed once the
 * document has been reconciled, so the editor mounts against existing content.
 */
export function useRoomSync(
  roomId: string,
  token: string,
  name: string,
): RoomSyncState {
  const [state, setState] = useState<RoomSyncState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let sync: RoomSync | undefined;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const serverUrl = `${protocol}://${window.location.host}/ws`;

    setState({ status: "loading" });

    connectRoomSync({ roomId, token, name, serverUrl })
      .then((s) => {
        if (cancelled) {
          s.cleanup();
          return;
        }
        sync = s;
        setState({ status: "ready", sync: s });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ status: "error", error: String(err) });
        }
      });

    return () => {
      cancelled = true;
      sync?.cleanup();
    };
  }, [roomId, token, name]);

  return state;
}
