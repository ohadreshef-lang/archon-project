"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import usePartySocket from "partysocket/react";
import GameCanvas from "./GameCanvas";
import type { BoardPiece, GameState, NetworkMessage, Side } from "@/lib/types";
import { createInitialBoard } from "@/lib/initialBoard";
import { PARTYKIT_HOST, OSCILLATING_SQUARES, LIGHT_HOME, DARK_HOME } from "@/lib/constants";
import { pickAIMove } from "@/lib/gameLogic";

function createInitialState(): GameState {
  return {
    board: createInitialBoard(),
    currentTurn: "light",
    luminanceStep: 3,
    luminanceDirection: 1,
    turnCount: 0,
    spellsUsed: { light: [], dark: [] },
    casterMaxHp: { light: 15, dark: 15 },
    phase: "strategy",
    combat: null,
    winner: null,
  };
}

interface Props {
  roomId: string;
  playerSide: Side;
  vsAI?: boolean;
}

export default function GameRoom({ roomId, playerSide, vsAI = false }: Props) {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  // Keep a ref so callbacks always read latest state without stale closures
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const aiSide: Side = playerSide === "light" ? "dark" : "light";
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const joinUrl = `${window.location.origin}/room/${roomId}?side=dark`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Join my Archon game!", url: joinUrl });
      } else {
        await navigator.clipboard.writeText(joinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(joinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    }
  }, [roomId]);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: vsAI ? "__ai_unused__" : roomId, // AI mode doesn't use the socket
    onOpen(event) {
      if (vsAI) return;
      (event.target as WebSocket).send(JSON.stringify({ type: "REQUEST_SYNC" }));
    },
    onMessage(event) {
      if (vsAI) return;
      const msg = JSON.parse(event.data) as NetworkMessage;
      if (msg.type === "SYNC" || msg.type === "MOVE") {
        setGameState(msg.payload as GameState);
      }
    },
  });

  const handleMove = useCallback((from: [number, number], to: [number, number]) => {
    const prev = gameStateRef.current;
    if (prev.currentTurn !== playerSide || prev.phase !== "strategy") return;
    const next = applyMove(prev, from, to);
    setGameState(next);
    if (!vsAI) socket.send(JSON.stringify({ type: "MOVE", payload: next }));
  }, [playerSide, socket, vsAI]);

  const handleCombatResult = useCallback((attackerHp: number, defenderHp: number) => {
    const prev = gameStateRef.current;
    if (prev.phase !== "combat" || !prev.combat) return;
    const next = applyCombatResult(prev, attackerHp, defenderHp);
    setGameState(next);
    if (!vsAI && playerSide === prev.combat.attackerSide) {
      socket.send(JSON.stringify({ type: "MOVE", payload: next }));
    }
  }, [playerSide, socket, vsAI]);

  // AI turn: fires whenever it becomes the AI's turn in vs-AI mode
  useEffect(() => {
    if (!vsAI) return;
    if (gameState.phase !== "strategy") return;
    if (gameState.currentTurn !== aiSide) return;
    if (gameState.winner) return;

    const delay = 600 + Math.random() * 600; // 600–1200ms "think" time
    const timer = setTimeout(() => {
      const state = gameStateRef.current;
      // Guard again inside timeout in case state changed
      if (state.phase !== "strategy" || state.currentTurn !== aiSide || state.winner) return;
      const move = pickAIMove(state.board, aiSide);
      if (move) {
        const next = applyMove(state, move.from, move.to);
        setGameState(next);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [vsAI, aiSide, gameState.phase, gameState.currentTurn, gameState.winner]);


  const isMyTurn = gameState.currentTurn === playerSide && gameState.phase === "strategy";
  const luminanceLabel = ["●●●●●●", "◐●●●●●", "◐◐●●●●", "◐◐◐●●●", "◐◐◐◐●●", "◐◐◐◐◐●"][gameState.luminanceStep] ?? "";

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-[576px] px-2">
      {/* HUD */}
      <div className="flex items-center gap-4 w-full">
        <div className="flex-1 bg-gray-900/60 backdrop-blur border border-gray-700/50 rounded-xl px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${gameState.currentTurn === "light" ? "bg-indigo-400 shadow-[0_0_6px_#818cf8]" : "bg-rose-500 shadow-[0_0_6px_#fb7185]"}`} />
            <span className="text-xs text-gray-300 font-medium">
              {gameState.currentTurn === "light" ? "Light" : "Dark"}'s turn
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">Luminance</span>
            <span className="text-xs text-amber-400 font-mono">{luminanceLabel}</span>
          </div>
          {!vsAI && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-mono text-gray-400 hover:text-indigo-300 transition-colors group"
              title="Share invite link"
            >
              <span className="text-gray-600 group-hover:text-indigo-400 transition-colors">
                {copied ? "✓" : "⎘"}
              </span>
              <span>{copied ? "Copied!" : `Room ${roomId}`}</span>
            </button>
          )}
        </div>

        <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
          playerSide === "light"
            ? "bg-indigo-950/60 border-indigo-600/40 text-indigo-300"
            : "bg-rose-950/60 border-rose-600/40 text-rose-300"
        }`}>
          {playerSide === "light" ? "⬜ Light" : "⬛ Dark"}
        </div>
      </div>

      {/* Win/lose banner */}
      {gameState.winner && (
        <div className={`px-8 py-3 rounded-2xl text-xl font-bold tracking-wide border ${
          gameState.winner === playerSide
            ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
            : "bg-red-950/80 border-red-500/50 text-red-300"
        }`}>
          {gameState.winner === playerSide ? "Victory" : "Defeated"}
        </div>
      )}

      {/* Combat banner */}
      {gameState.phase === "combat" && (
        <div className="px-6 py-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-sm font-semibold animate-pulse">
          ⚔ Combat in progress
        </div>
      )}

      <GameCanvas
        gameState={gameState}
        playerSide={playerSide}
        onMove={handleMove}
        onCombatResult={handleCombatResult}
      />

      {/* Status + help link */}
      <div className="flex items-center justify-between w-full">
        <p className="text-xs text-gray-600 font-medium">
          {gameState.phase === "combat"
            ? "Battle in progress — use arrow keys + space to fight"
            : isMyTurn
            ? "Your turn — click a piece to move, green = move, red = attack"
            : vsAI
            ? "AI is thinking…"
            : "Waiting for opponent…"}
        </p>
        <a
          href="/how-to-play"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400/60 hover:text-indigo-400 transition-colors whitespace-nowrap"
        >
          How to play →
        </a>
      </div>
    </div>
  );
}

function applyMove(state: GameState, from: [number, number], to: [number, number]): GameState {
  const [fromCol, fromRow] = from;
  const [toCol, toRow] = to;
  const board = state.board.map((row) => [...row]);
  const piece = board[fromRow][fromCol];
  if (!piece) return state;

  const target = board[toRow][toCol];
  let phase: GameState["phase"] = "strategy";
  let combat = null;

  if (target && target.side !== piece.side) {
    phase = "combat";
    const isLightHome = toCol === LIGHT_HOME[0] && toRow === LIGHT_HOME[1];
    const isDarkHome  = toCol === DARK_HOME[0]  && toRow === DARK_HOME[1];
    const sqType: "light" | "dark" | "oscillating" =
      isLightHome ? "light" :
      isDarkHome  ? "dark"  :
      OSCILLATING_SQUARES.has(toRow * 9 + toCol) ? "oscillating" :
      (toCol + toRow) % 2 === 0 ? "light" : "dark";

    combat = {
      attackerPieceId: piece.id,
      defenderPieceId: target.id,
      attackerSide: piece.side,
      boardCol: toCol,
      boardRow: toRow,
      squareLuminance: state.luminanceStep,
      squareType: sqType,
    };
  } else {
    board[toRow][toCol] = { ...piece, col: toCol, row: toRow };
    board[fromRow][fromCol] = null;
  }

  let step = state.luminanceStep + state.luminanceDirection;
  let dir = state.luminanceDirection;
  if (step > 5) { step = 4; dir = -1; }
  if (step < 0) { step = 1; dir = 1; }

  return {
    ...state, board, phase, combat,
    currentTurn: state.currentTurn === "light" ? "dark" : "light",
    luminanceStep: step, luminanceDirection: dir,
    turnCount: state.turnCount + 1,
  };
}

function applyCombatResult(state: GameState, attackerHp: number, defenderHp: number): GameState {
  const combat = state.combat!;
  const board = state.board.map((row) => [...row]);

  let attacker: BoardPiece | null = null, aCol = -1, aRow = -1;
  let defender: BoardPiece | null = null, dCol = -1, dRow = -1;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c]?.id === combat.attackerPieceId) { attacker = board[r][c]; aCol = c; aRow = r; }
      if (board[r][c]?.id === combat.defenderPieceId) { defender = board[r][c]; dCol = c; dRow = r; }
    }
  }
  if (!attacker || !defender) return { ...state, phase: "strategy", combat: null };

  // Clear both squares first
  board[aRow][aCol] = null;
  board[dRow][dCol] = null;

  const checkWinner = (s: GameState): Side | null => {
    let light = false, dark = false;
    for (const row of s.board) for (const cell of row) {
      if (cell?.side === "light") light = true;
      if (cell?.side === "dark") dark = true;
    }
    if (!light) return "dark";
    if (!dark) return "light";
    return null;
  };

  if (attackerHp > 0 && defenderHp <= 0) {
    // Attacker wins — moves to defender's square
    board[dRow][dCol] = { ...attacker, col: dCol, row: dRow, hp: attackerHp };
  } else if (defenderHp > 0 && attackerHp <= 0) {
    // Defender wins — stays in place
    board[dRow][dCol] = { ...defender, col: dCol, row: dRow, hp: defenderHp };
  }
  // else both dead — squares stay empty

  const next: GameState = { ...state, board, phase: "strategy", combat: null };
  next.winner = checkWinner(next);
  return next;
}
