import type * as Party from "partykit/server";

export default class ArchonServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Send current game state to newly connected player
    this.room.storage.get("gameState").then((state) => {
      if (state) {
        conn.send(JSON.stringify({ type: "SYNC", payload: state }));
      }
    });
  }

  async onMessage(message: string, sender: Party.Connection) {
    const msg = JSON.parse(message) as GameMessage;

    switch (msg.type) {
      case "MOVE":
      case "SPELL":
      case "COMBAT_ACTION":
      case "COMBAT_RESULT": {
        // Persist and broadcast to all players
        if (msg.type !== "COMBAT_ACTION") {
          await this.room.storage.put("gameState", msg.payload);
        }
        this.room.broadcast(message, [sender.id]);
        break;
      }
      case "JOIN": {
        this.room.broadcast(message);
        break;
      }
    }
  }
}

type GameMessage =
  | { type: "MOVE"; payload: unknown }
  | { type: "SPELL"; payload: unknown }
  | { type: "COMBAT_ACTION"; payload: unknown }
  | { type: "COMBAT_RESULT"; payload: unknown }
  | { type: "JOIN"; payload: unknown }
  | { type: "SYNC"; payload: unknown };
