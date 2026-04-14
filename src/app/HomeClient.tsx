"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";


export function HomeClient({ roomId }: { roomId: string }) {
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode]         = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  // Auto-focus code input when join expands
  useEffect(() => {
    if (joinOpen) inputRef.current?.focus();
  }, [joinOpen]);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length >= 4) router.push(`/room/${trimmed}?side=dark`);
  }

  function closeJoin() {
    setJoinOpen(false);
    setCode("");
  }

  return (
    <main className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center px-5 relative overflow-hidden">

      {/* Ambient center glow — single, centered, not competing */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-900/10 rounded-full blur-3xl" />
      </div>

      {/* ── Logo ── */}
      <div className="text-center mb-10 relative">
        <h1 className="text-[4rem] sm:text-[5rem] font-bold tracking-[0.06em] text-white leading-none">
          <span className="text-amber-400">A</span>RCHON
        </h1>
        <p className="text-gray-600 text-xs tracking-[0.35em] uppercase mt-2">
          Light · vs · Dark
        </p>
      </div>

      {/* ── Button stack ── */}
      <div className="w-full max-w-[340px] flex flex-col gap-3 relative">

        {/* 1 ─ Play vs AI  (primary / largest) */}
        <Link
          href={`/room/${roomId}?side=light&ai=true`}
          className="w-full h-[72px] flex items-center justify-center rounded-2xl
            bg-amber-500/10 border border-amber-500/40
            hover:bg-amber-500/20 hover:border-amber-400/70
            text-white font-bold text-lg tracking-wide
            shadow-[0_0_22px_rgba(245,158,11,0.12)] hover:shadow-[0_0_32px_rgba(245,158,11,0.24)]
            transition-all duration-150 active:scale-[0.97]"
        >
          Play vs AI
        </Link>
        {/* "Start here" hint */}
        <p className="text-center text-[11px] text-amber-700/75 -mt-1.5 mb-0.5 tracking-wide">
          Start here
        </p>

        {/* 2 ─ Play Online */}
        <Link
          href={`/room/${roomId}?side=light`}
          className="w-full h-[64px] flex items-center justify-center rounded-2xl
            bg-white/5 border border-white/10
            hover:bg-white/10 hover:border-white/20
            text-white font-semibold text-base tracking-wide
            transition-all duration-150 active:scale-[0.97]"
        >
          Play Online
        </Link>

        {/* 3 ─ Join Game (expands in-place) */}
        {!joinOpen ? (
          <button
            onClick={() => setJoinOpen(true)}
            className="w-full h-[64px] flex items-center justify-center rounded-2xl
              bg-white/5 border border-white/10
              hover:bg-white/10 hover:border-white/20
              text-white font-semibold text-base tracking-wide
              transition-all duration-150 active:scale-[0.97]"
          >
            Join Game
          </button>
        ) : (
          <form
            onSubmit={handleJoin}
            className="rounded-2xl bg-gray-900/80 border border-white/10 p-4 flex flex-col gap-3"
          >
            <input
              ref={inputRef}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="Room code"
              maxLength={6}
              autoComplete="off"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600
                px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-white/25
                uppercase tracking-[0.3em] text-center font-mono"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeJoin}
                className="flex-1 h-11 rounded-xl border border-white/10
                  text-gray-500 text-sm font-medium
                  hover:text-gray-300 hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={code.length < 4}
                className="flex-1 h-11 rounded-xl bg-white text-gray-900 font-bold text-sm
                  hover:bg-amber-300 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              >
                Join →
              </button>
            </div>
          </form>
        )}

        {/* 4 ─ How to Play (ghost / smallest) */}
        <Link
          href="/how-to-play"
          className="w-full h-10 flex items-center justify-center
            text-gray-500 hover:text-gray-300 text-sm font-medium
            transition-colors mt-1"
        >
          How to Play
        </Link>
      </div>
    </main>
  );
}
