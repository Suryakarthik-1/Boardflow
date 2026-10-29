import type { CreateRoomResponse } from "@boardflow/shared";

/** Create a room on the server and get back its share link. */
export async function createRoom(
  name: string,
  guestName: string,
): Promise<CreateRoomResponse> {
  const res = await fetch("/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, guestName }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `createRoom failed (${res.status})`);
  }
  return (await res.json()) as CreateRoomResponse;
}

/** The `/canvas/<roomId>` URL with the share token and guest name in the query. */
export function canvasUrl(roomId: string, token: string, name: string): string {
  return `/canvas/${roomId}?${new URLSearchParams({ token, name }).toString()}`;
}
