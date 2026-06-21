import { Redis } from "@upstash/redis";

const redis = new Redis({ url: process.env.KV_REST_API_URL!, token: process.env.KV_REST_API_TOKEN! });
const TTL = 60 * 60 * 3;
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const validGames = new Set(["bomberos","incendio","formula-1","detective-datos","campeon","energia","esperar","vivienda","mision-espacial","hospitales"]);

type Player = { id: string; name: string; scores: Record<string, number> };
type Room = { code: string; hostId: string; status: "lobby" | "playing"; gameId?: string; version: number; players: Record<string, Player> };
const key = (code: string) => `game-room:${code}`;
const json = (res: any, response: any, status = 200) => { res.setHeader("cache-control", "no-store"); return res.status(status).json(response); };
const cleanName = (value: unknown) => String(value ?? "").trim().slice(0, 20);
const cleanCode = (value: unknown) => String(value ?? "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6);
const code = () => Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");

export default async function handler(request: any, response: any) {
  try {
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return json(response, { error: "Multijugador no configurado" }, 503);
    if (request.method === "GET") {
      const roomCode = cleanCode(request.query?.code);
      const room = roomCode.length === 6 ? await redis.get<Room>(key(roomCode)) : null;
      return room ? json(response, room) : json(response, { error: "Partida no encontrada" }, 404);
    }
    if (request.method !== "POST") return json(response, { error: "Método no permitido" }, 405);
    const body = request.body ?? {};
    const action = String(body.action ?? "");
    const playerId = String(body.playerId ?? "").slice(0, 80);
    const name = cleanName(body.name);
    if (action === "create") {
      if (!playerId || name.length < 2) return json(response, { error: "Escribe un nombre de al menos 2 caracteres" }, 400);
      for (let attempt = 0; attempt < 10; attempt++) {
        const roomCode = code();
        const room: Room = { code: roomCode, hostId: playerId, status: "lobby", version: 0, players: { [playerId]: { id: playerId, name, scores: {} } } };
        if (await redis.set(key(roomCode), room, { nx: true, ex: TTL })) return json(response, room, 201);
      }
      return json(response, { error: "No fue posible crear la partida" }, 503);
    }
    const roomCode = cleanCode(body.code);
    if (roomCode.length !== 6) return json(response, { error: "Código inválido" }, 400);
    const lockKey = `${key(roomCode)}:lock`;
    const lockToken = crypto.randomUUID();
    let locked = false;
    for (let attempt = 0; attempt < 20 && !locked; attempt++) {
      locked = Boolean(await redis.set(lockKey, lockToken, { nx: true, ex: 3 }));
      if (!locked) await new Promise(resolve => setTimeout(resolve, 35));
    }
    if (!locked) return json(response, { error: "La sala está ocupada; intenta nuevamente" }, 409);
    try {
      const room = await redis.get<Room>(key(roomCode));
      if (!room) return json(response, { error: "Código inválido o partida expirada" }, 404);
      if (action === "join") {
        if (!playerId || name.length < 2) return json(response, { error: "Escribe un nombre de al menos 2 caracteres" }, 400);
        if (!room.players[playerId] && Object.keys(room.players).length >= 20) return json(response, { error: "La sala alcanzó su máximo de 20 jugadores" }, 409);
        room.players[playerId] = { id: playerId, name, scores: room.players[playerId]?.scores ?? {} };
      } else if (action === "start") {
        if (room.hostId !== playerId) return json(response, { error: "Solo quien creó la sala puede iniciar" }, 403);
        if (!validGames.has(body.gameId)) return json(response, { error: "Juego inválido" }, 400);
        room.status = "playing"; room.gameId = body.gameId; room.version += 1;
      } else if (action === "score") {
        if (!room.players[playerId] || !validGames.has(body.gameId)) return json(response, { error: "Jugador o juego inválido" }, 400);
        room.players[playerId].scores[body.gameId] = Math.max(0, Math.min(1000, Math.round(Number(body.score) || 0)));
      } else return json(response, { error: "Acción inválida" }, 400);
      await redis.set(key(roomCode), room, { ex: TTL });
      return json(response, room);
    } finally {
      await redis.eval("if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end", [lockKey], [lockToken]);
    }
  } catch (error) {
    console.error(error);
    return json(response, { error: "No fue posible sincronizar la partida" }, 500);
  }
}
