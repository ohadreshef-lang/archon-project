import Link from "next/link";
import { randomBytes } from "crypto";

function generateRoomId() {
  return randomBytes(3).toString("hex").toUpperCase();
}

export default function Home() {
  const roomId = generateRoomId();

  return (
    <main className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center gap-12 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-900/20 rounded-full blur-3xl" />
      </div>

      {/* Title */}
      <div className="text-center relative">
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-indigo-500/60" />
          <span className="text-indigo-400 text-xs tracking-[0.3em] uppercase font-medium">Strategy · Combat · Magic</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-indigo-500/60" />
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-white mb-2">
          <span className="text-indigo-400">A</span>rchon
        </h1>
        <p className="text-gray-500 text-sm">The Light and the Dark</p>
      </div>

      {/* Cards */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        {/* vs AI */}
        <Link
          href={`/room/${roomId}?side=light&ai=true`}
          className="flex-1 group relative overflow-hidden rounded-2xl bg-emerald-950/50 border border-emerald-700/30 hover:border-emerald-500/60 p-6 transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4 text-xl">🤖</div>
            <h2 className="text-white font-semibold text-lg mb-1">vs AI</h2>
            <p className="text-gray-400 text-xs leading-relaxed">Play solo as Light against an AI opponent. No opponent needed.</p>
          </div>
        </Link>

        {/* New multiplayer game */}
        <Link
          href={`/room/${roomId}?side=light`}
          className="flex-1 group relative overflow-hidden rounded-2xl bg-indigo-950/60 border border-indigo-600/30 hover:border-indigo-400/60 p-6 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-xl">⬜</div>
            <h2 className="text-white font-semibold text-lg mb-1">New Game</h2>
            <p className="text-gray-400 text-xs leading-relaxed">Create a room and play as Light. Share the room code with your opponent.</p>
          </div>
        </Link>

        {/* Join multiplayer */}
        <div className="flex-1 rounded-2xl bg-rose-950/40 border border-rose-800/30 p-6">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center mb-4 text-xl">⬛</div>
          <h2 className="text-white font-semibold text-lg mb-1">Join Game</h2>
          <p className="text-gray-400 text-xs mb-4">Enter a room code to join as Dark.</p>
          <form action="/join" method="GET" className="flex gap-2">
            <input
              name="room"
              placeholder="Room code"
              className="flex-1 min-w-0 bg-gray-900/60 border border-gray-700/60 text-white placeholder-gray-600 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-rose-500/60 uppercase tracking-widest"
              maxLength={6}
            />
            <button
              type="submit"
              className="bg-rose-600/80 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Join
            </button>
          </form>
        </div>
      </div>

      <Link
        href="/how-to-play"
        className="text-gray-500 hover:text-indigo-400 text-sm transition-colors underline underline-offset-4 relative"
      >
        How to play →
      </Link>
    </main>
  );
}
