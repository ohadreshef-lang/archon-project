"use client";

import { useEffect, useRef, useState } from "react";
import usePartySocket from "partysocket/react";
import GameCanvas from "./GameCanvas";
import type { GameState, NetworkMessage, Side } from "@/lib/types";
import { createInitialBoard } from "@/lib/initialBoard";
import { PARTYKIT_HOST } from "@/lib/constants";

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
}

export default function GameRoom({ roomId, playerSide }: Props) {
  const [gameState, setGameState] = useState<GameState>(createInitialState);

  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: roomId,
    onMessage(event) {
      const msg = JSON.parse(event.data) as NetworkMessage;
      handleNetworkMessage(msg);
    },
  });

  function handleNetworkMessage(msg: NetworkMessage) {
    switch (msg.type) {
      case "SYNC":
      case "MOVE":
        setGameState(msg.payload as GameState);
        break;
    }
  }

  function handleMove(from: [number, number], to: [number, number]) {
    if (gameState.currentTurn !== playerSide) return;

    setGameState((prev) => {
      const next = applyMove(prev, from, to);
      socket.send(JSON.stringify({ type: "MOVE", payload: next }));
      return next;
    });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-6 font-mono text-sm text-yellow-300">
        <span>Room: {roomId}</span>
        <span>You: {playerSide === "light" ? "⬜ Light" : "⬛ Dark"}</span>
        <span>Turn: {gameState.currentTurn === "light" ? "⬜ Light" : "⬛ Dark"}</span>
        <span>Luminance: {gameState.luminanceStep}/5</span>
      </div>

      {gameState.winner && (
        <div className="text-3xl font-bold text-yellow-400 animate-pulse">
          {gameState.winner === playerSide ? "YOU WIN!" : "YOU LOSE"}
        </div>
      )}

      <GameCanvas gameState={gameState} onMove={handleMove} />

      <div className="text-xs text-gray-400 font-mono">
        {gameState.currentTurn === playerSide
          ? "Your turn — click a piece to move"
          : "Waiting for opponent..."}
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
    // Trigger combat
    phase = "combat";
    combat = {
      attackerPieceId: piece.id,
      defenderPieceId: target.id,
      boardCol: toCol,
      boardRow: toRow,
      squareLuminance: state.luminanceStep,
    };
  } else {
    board[toRow][toCol] = { ...piece, col: toCol, row: toRow };
    board[fromRow][fromCol] = null;
  }

  // Advance luminance
  let step = state.luminanceStep + state.luminanceDirection;
  let dir = state.luminanceDirection;
  if (step > 5) { step = 4; dir = -1; }
  if (step < 0) { step = 1; dir = 1; }

  return {
    ...state,
    board,
    phase,
    combat,
    currentTurn: state.currentTurn === "light" ? "dark" : "light",
    luminanceStep: step,
    luminanceDirection: dir,
    turnCount: state.turnCount + 1,
  };
}
