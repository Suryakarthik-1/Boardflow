import { useState } from "react";
import { canvasUrl, createRoom } from "../api";

/**
 * "Open a canvas" without an account: create a room, then jump to its share
 * link. The guest name is generated once per browser and reused, so a returning
 * visitor keeps the same identity on their boards.
 */
export function useOpenBoard() {
  const [pending, setPending] = useState(false);

  const open = async () => {
    if (pending) return;
    setPending(true);
    try {
      const name = guestName();
      const { room, shareToken } = await createRoom("Untitled board", name);
      window.location.assign(canvasUrl(room.id, shareToken, name));
    } catch (err) {
      console.error("Failed to open board", err);
      setPending(false);
    }
  };

  return { open, pending };
}

function guestName(): string {
  const KEY = "boardflow:guest-name";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const name = `Guest-${Math.random().toString(36).slice(2, 6)}`;
  localStorage.setItem(KEY, name);
  return name;
}
