"use client";

import { useEffect, useRef } from "react";
import type { GameState } from "@/lib/types";

interface Props {
  gameState: GameState;
  onMove: (from: [number, number], to: [number, number]) => void;
}

export default function GameCanvas({ gameState, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const boardSceneRef = useRef<import("@/game/scenes/BoardScene").BoardScene | null>(null);

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
        backgroundColor: "#1a1a2e",
        parent: containerRef.current!,
        scene: [boardScene, CombatScene],
        pixelArt: true,
        roundPixels: true,
      });

      gameRef.current = game;

      boardScene.events.once("create", () => {
        boardScene.setMoveHandler(onMove);
        boardScene.updateState(gameState);
      });
    })();

    return () => {
      game?.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    boardSceneRef.current?.updateState(gameState);
  }, [gameState]);

  return (
    <div
      ref={containerRef}
      className="border-4 border-yellow-500 shadow-[0_0_30px_rgba(255,200,0,0.4)]"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
