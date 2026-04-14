import { randomBytes } from "crypto";
import { HomeClient } from "./HomeClient";

function generateRoomId() {
  return randomBytes(3).toString("hex").toUpperCase();
}

export default function Home() {
  return <HomeClient roomId={generateRoomId()} />;
}
