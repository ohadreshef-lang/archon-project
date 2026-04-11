import { notFound } from "next/navigation";
import GameRoom from "@/components/GameRoom";
import type { Side } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ side?: string }>;
}

export default async function RoomPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { side } = await searchParams;

  if (!id) notFound();

  const playerSide: Side = side === "dark" ? "dark" : "light";

  return (
    <main className="min-h-screen bg-[#0d0d1a] flex flex-col items-center justify-center gap-6 px-4 py-8">
      <h1
        className="text-2xl text-yellow-400"
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        ARCHON
      </h1>
      <GameRoom roomId={id} playerSide={playerSide} />
    </main>
  );
}
