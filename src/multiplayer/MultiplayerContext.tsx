import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type RoomPlayer = { id: string; name: string; scores: Record<string, number> };
export type GameRoom = { code: string; hostId: string; status: "lobby" | "playing"; gameId?: string; version: number; players: Record<string, RoomPlayer> };
type Multiplayer = { room: GameRoom | null; playerId: string; busy: boolean; error: string; createRoom: (name: string) => Promise<void>; joinRoom: (code: string, name: string) => Promise<void>; startGame: (gameId: string) => Promise<void>; submitScore: (gameId: string, score: number) => Promise<void>; leaveRoom: () => void };

const Context = createContext<Multiplayer | null>(null);
const storedId = () => { const found = sessionStorage.getItem("multiplayer-player"); if (found) return found; const id = crypto.randomUUID(); sessionStorage.setItem("multiplayer-player", id); return id; };

export function MultiplayerProvider({ children }: { children: ReactNode }) {
  const [playerId] = useState(storedId); const [room, setRoom] = useState<GameRoom | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const roomRef = useRef(room); roomRef.current = room;
  const request = useCallback(async (payload: Record<string, unknown>) => { setBusy(true); setError(""); try { const response = await fetch("/api/rooms", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...payload, playerId }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); setRoom(data); localStorage.setItem("multiplayer-room", data.code); return data as GameRoom; } catch (cause) { setError(cause instanceof Error ? cause.message : "No fue posible conectar"); throw cause; } finally { setBusy(false); } }, [playerId]);
  useEffect(() => { const saved = localStorage.getItem("multiplayer-room"); if (!saved) return; fetch(`/api/rooms?code=${saved}`).then(response => response.ok ? response.json() : null).then(data => { if (data?.players?.[playerId]) setRoom(data); else localStorage.removeItem("multiplayer-room"); }).catch(() => undefined); }, [playerId]);
  useEffect(() => { if (!room) return; const timer = window.setInterval(() => fetch(`/api/rooms?code=${roomRef.current?.code}`).then(response => response.ok ? response.json() : null).then(data => data && setRoom(data)).catch(() => undefined), 1500); return () => window.clearInterval(timer); }, [room?.code]);
  const value = useMemo<Multiplayer>(() => ({ room, playerId, busy, error, createRoom: async name => { await request({ action: "create", name }); }, joinRoom: async (code, name) => { await request({ action: "join", code, name }); }, startGame: async gameId => { if (room) await request({ action: "start", code: room.code, gameId }); }, submitScore: async (gameId, score) => { if (room) await request({ action: "score", code: room.code, gameId, score }); }, leaveRoom: () => { localStorage.removeItem("multiplayer-room"); setRoom(null); setError(""); } }), [room, playerId, busy, error, request]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useMultiplayer() { const context = useContext(Context); if (!context) throw new Error("MultiplayerProvider missing"); return context; }
