import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  const room = request.nextUrl.searchParams.get("room")?.toUpperCase().trim();
  if (!room) redirect("/");
  redirect(`/room/${room}?side=dark`);
}
