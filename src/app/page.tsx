import Link from "next/link";
import { randomBytes } from "crypto";

function generateRoomId() {
  return randomBytes(3).toString("hex").toUpperCase();
}

export default function Home() {
  const roomId = generateRoomId();

  return (
    <main className="min-h-screen bg-[#0d0d1a] flex flex-col items-center justify-center gap-10 px-4">
      <div className="text-center">
        <h1
          className="text-6xl font-bold tracking-widest text-yellow-400 mb-2"
          style={{ fontFamily: "'Press Start 2P', monospace", textShadow: "0 0 20px rgba(255,200,0,0.6)" }}
        >
          ARCHON
        </h1>
        <p className="text-gray-400 font-mono text-sm mt-4">The Light and the Dark</p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href={`/room/${roomId}?side=light`}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 text-center font-mono tracking-wider transition"
          style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "12px" }}
        >
          NEW GAME
        </Link>

        <form action="/join" method="GET" className="flex gap-2">
          <input
            name="room"
            placeholder="ROOM CODE"
            className="flex-1 bg-gray-900 border border-gray-600 text-yellow-300 font-mono px-3 py-2 text-sm uppercase tracking-widest focus:outline-none focus:border-yellow-500"
            style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "10px" }}
          />
          <button
            type="submit"
            className="bg-gray-700 hover:bg-gray-600 text-yellow-300 font-mono px-4 py-2 text-xs transition border border-gray-600"
          >
            JOIN
          </button>
        </form>
      </div>

      <p className="text-gray-600 font-mono text-xs text-center max-w-sm">
        Share your room code with your opponent to play online
      </p>
    </main>
  );
}
