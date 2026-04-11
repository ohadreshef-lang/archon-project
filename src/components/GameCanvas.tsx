"use client";

import { useEffect, useRef } from "react";
import type { BoardPiece, GameState, Side } from "@/lib/types";

interface Props {
  gameState: GameState;
  playerSide: Side;
  onMove: (from: [number, number], to: [number, number]) => void;
  onCombatResult: (attackerHp: number, defenderHp: number) => void;
}

function findPieceById(board: (BoardPiece | null)[][], id: string): BoardPiece | null {
  for (const row of board)
    for (const cell of row)
      if (cell?.id === id) return cell;
  return null;
}

export default function GameCanvas({ gameState, playerSide, onMove, onCombatResult }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const boardSceneRef = useRef<import("@/game/scenes/BoardScene").BoardScene | null>(null);
  const combatActiveRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    if (gameRef.current) return;

    let game: import("phaser").Game;

    (async () => {
      const PhaserModule = await import("phaser");
      const { BoardScene } = await import("@/game/scenes/BoardScene");
      const { CombatScene } = await import("@/game/scenes/CombatScene");

      const boardScene = new BoardScene();
      boardSceneRef.current = boardScene;

      game = new PhaserModule.Game({
        type: PhaserModule.AUTO,
        width: 9 * 64,
        height: 9 * 64,
        backgroundColor: "#070b14",
        parent: containerRef.current!,
        scene: [boardScene, CombatScene],
        pixelArt: false,
        antialias: true,
      });

      gameRef.current = game;
      boardScene.setMoveHandler(onMove);
      boardScene.updateState(gameState);
    })();

    return () => {
      game?.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep move handler fresh (closure over latest gameState)
  useEffect(() => {
    boardSceneRef.current?.setMoveHandler(onMove);
  }, [onMove]);

  // Push board state updates
  useEffect(() => {
    boardSceneRef.current?.updateState(gameState);
  }, [gameState]);

  // Launch or stop CombatScene based on phase
  useEffect(() => {
    const scene = boardSceneRef.current;
    if (!scene) return;

    if (gameState.phase === "combat" && gameState.combat && !combatActiveRef.current) {
      const { combat, board } = gameState;
      const attacker = findPieceById(board, combat.attackerPieceId);
      const defender = findPieceById(board, combat.defenderPieceId);
      if (!attacker || !defender) return;

      combatActiveRef.current = true;
      const isLocalAttacker = playerSide === combat.attackerSide;

      scene.launchCombat(attacker, defender, combat, isLocalAttacker, (aHp, dHp) => {
        combatActiveRef.current = false;
        onCombatResult(aHp, dHp);
      });
    }

    if (gameState.phase === "strategy") {
      combatActiveRef.current = false;
    }
  }, [gameState.phase, gameState.combat, playerSide, onCombatResult]);

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden ring-2 ring-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.25)]"
      style={{ width: 9 * 64, height: 9 * 64 }}
    />
  );
}
