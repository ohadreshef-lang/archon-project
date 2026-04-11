import Link from "next/link";

const LIGHT_PIECES = [
  { label: "Wiz", name: "Wizard", move: "Teleport (anywhere)", range: "Long", hp: 15, notes: "Casts all 7 spells. Each spell cast reduces max HP." },
  { label: "Uni", name: "Unicorn", move: "Ground (4)", range: "Medium–Long", hp: 14, notes: "Fast fire rate. Best ground attacker for Light." },
  { label: "Arc", name: "Archer", move: "Ground (3)", range: "Medium", hp: 12, notes: "Balanced mid-range attacker." },
  { label: "Val", name: "Valkyrie", move: "Flying (3)", range: "Medium", hp: 13, notes: "Flying gives strong board mobility." },
  { label: "Gol", name: "Golem", move: "Ground (2, slow)", range: "Long", hp: 20, notes: "Huge HP and damage. Very slow." },
  { label: "Djn", name: "Djinni", move: "Flying (4)", range: "Long", hp: 14, notes: "Fast shots. Strong flying attacker." },
  { label: "Phx", name: "Phoenix", move: "Flying (5)", range: "Short–Med", hp: 16, notes: "Can become an invulnerable fireball — but immobile while doing so." },
  { label: "Knt", name: "Knight ×7", move: "Ground (3)", range: "Melee", hp: 8, notes: "Fast reload, very fragile. Useless against ranged units." },
];

const DARK_PIECES = [
  { label: "Sor", name: "Sorceress", move: "Teleport (anywhere)", range: "Long", hp: 15, notes: "Mirror of the Wizard. Casts all 7 spells." },
  { label: "Bas", name: "Basilisk", move: "Ground (3)", range: "Medium–Long", hp: 10, notes: "Most powerful Dark attacker but critically low HP. Needs dark squares." },
  { label: "Man", name: "Manticore", move: "Ground (3)", range: "Medium", hp: 12, notes: "Mirror of the Archer." },
  { label: "Ban", name: "Banshee", move: "Flying (3)", range: "Close (area)", hp: 13, notes: "Shriek hits an area. Mirror of the Valkyrie." },
  { label: "Trl", name: "Troll", move: "Ground (2, slow)", range: "Long", hp: 20, notes: "Mirror of the Golem." },
  { label: "Drg", name: "Dragon", move: "Flying (4)", range: "Long", hp: 22, notes: "Highest HP and damage in the game. Slowest reload — exploit this." },
  { label: "Shp", name: "Shapeshifter", move: "Flying (5)", range: "Varies", hp: 16, notes: "Copies the opponent's abilities in combat. Fully heals after every fight." },
  { label: "Gob", name: "Goblin ×7", move: "Ground (3)", range: "Melee", hp: 8, notes: "Mirror of the Knight." },
];

const SPELLS = [
  { name: "Teleport", desc: "Move any of your pieces instantly to any empty square — or onto an enemy to trigger combat immediately." },
  { name: "Heal", desc: "Fully restore one unit's HP. Cannot target a unit on a Power Point." },
  { name: "Shift Time", desc: "Reverse or jump the luminance cycle. Enormously powerful for flipping board-wide combat advantage." },
  { name: "Exchange", desc: "Swap the board positions of any two pieces — own, enemy, or one of each." },
  { name: "Summon Elemental", desc: "Summon a random elemental (Fire, Earth, Water, Air) to fight one battle on your behalf, then disappear." },
  { name: "Revive", desc: "Resurrect one destroyed piece at full HP, placed next to your spellcaster." },
  { name: "Imprison", desc: "Freeze an enemy piece in place. It can't move until the luminance cycle reaches the imprisoned piece's extreme." },
];

function PieceCard({ piece, side }: { piece: typeof LIGHT_PIECES[0]; side: "light" | "dark" }) {
  const bg = side === "light" ? "bg-indigo-950/60 border-indigo-700/40" : "bg-rose-950/40 border-rose-800/30";
  const circle = side === "light" ? "bg-indigo-700 ring-indigo-400/50" : "bg-rose-800 ring-rose-400/50";
  const text = side === "light" ? "text-indigo-300" : "text-rose-300";

  return (
    <div className={`rounded-xl border p-4 ${bg} flex gap-4`}>
      <div className={`w-12 h-12 rounded-full ${circle} ring-2 flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {piece.label}
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className={`font-semibold ${text}`}>{piece.name}</span>
          <span className="text-gray-600 text-xs">HP {piece.hp}</span>
        </div>
        <div className="text-xs text-gray-400 mb-1">
          <span className="text-gray-500">Move:</span> {piece.move} &nbsp;·&nbsp; <span className="text-gray-500">Range:</span> {piece.range}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{piece.notes}</p>
      </div>
    </div>
  );
}

export default function HowToPlay() {
  return (
    <main className="min-h-screen bg-[#070b14] text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-gray-500 hover:text-indigo-400 text-sm transition-colors mb-6 inline-block">
            ← Back
          </Link>
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-indigo-400">A</span>rchon — How to Play
          </h1>
          <p className="text-gray-400">A strategy + real-time combat game for two players.</p>
        </div>

        {/* Objective */}
        <Section title="Objective">
          <p className="text-gray-300 text-sm leading-relaxed mb-3">Win in one of three ways:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-300">
            <li><span className="text-white font-medium">Control all 5 Power Points</span> simultaneously — the glowing amber squares.</li>
            <li><span className="text-white font-medium">Eliminate all enemy pieces</span> from the board.</li>
            <li><span className="text-white font-medium">Imprison the enemy's last piece</span> with the Imprison spell.</li>
          </ol>
        </Section>

        {/* Board */}
        <Section title="The Board">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <InfoCard color="indigo" label="Light Squares" desc="Permanently light. Boost Light side HP in combat." />
            <InfoCard color="gray" label="Dark Squares" desc="Permanently dark. Boost Dark side HP in combat." />
            <InfoCard color="amber" label="Oscillating Squares" desc="Shift through 6 shades over time — advantage flows between sides." />
          </div>
          <p className="text-gray-400 text-xs mt-3 leading-relaxed">
            The <span className="text-amber-400 font-medium">luminance cycle</span> shifts one step each turn. Squares that favour you now may favour your opponent soon — plan around it.
          </p>
        </Section>

        {/* Controls */}
        <Section title="Controls">
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <InfoCard color="indigo" label="Board — Select Piece" desc="Click one of your pieces. Valid moves highlight green, valid attacks highlight red." />
            <InfoCard color="indigo" label="Board — Move / Attack" desc="Click a highlighted square to move. Click a red square to attack — this starts combat." />
            <InfoCard color="rose" label="Combat — Move" desc="Arrow keys to move your unit around the arena." />
            <InfoCard color="rose" label="Combat — Fire" desc="Space bar to shoot. There's a cooldown between shots." />
          </div>
        </Section>

        {/* Combat */}
        <Section title="Combat">
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            When a piece moves onto an enemy square, both players enter a real-time arena. Each controls their own unit — move and fire to reduce the opponent to 0 HP. The winner returns to the board; the loser is removed. <span className="text-amber-300">Damage persists</span> between battles — there's no auto-healing.
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            The square's colour affects HP: fighting on a square that favours your side gives up to <span className="text-white font-medium">+7 HP</span>. Power Points restore 1 HP per turn to any unit standing on them.
          </p>
        </Section>

        {/* Light pieces */}
        <Section title="Light Side Pieces">
          <div className="grid sm:grid-cols-2 gap-3">
            {LIGHT_PIECES.map((p) => <PieceCard key={p.label} piece={p} side="light" />)}
          </div>
        </Section>

        {/* Dark pieces */}
        <Section title="Dark Side Pieces">
          <div className="grid sm:grid-cols-2 gap-3">
            {DARK_PIECES.map((p) => <PieceCard key={p.label} piece={p} side="dark" />)}
          </div>
        </Section>

        {/* Spells */}
        <Section title="Spells">
          <p className="text-gray-400 text-xs mb-4 leading-relaxed">
            Only the <span className="text-indigo-300">Wizard</span> (Light) and <span className="text-rose-300">Sorceress</span> (Dark) can cast spells. Each spell may only be used <span className="text-white font-medium">once per game</span>. Every spell permanently reduces the caster's max HP — use them wisely.
          </p>
          <div className="space-y-2">
            {SPELLS.map((s) => (
              <div key={s.name} className="flex gap-3 rounded-xl bg-gray-900/40 border border-gray-800/50 px-4 py-3">
                <span className="text-indigo-300 font-semibold text-sm w-36 flex-shrink-0">{s.name}</span>
                <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Movement types */}
        <Section title="Movement Types">
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <InfoCard color="gray" label="Ground" desc="Orthogonal only (no diagonal). Blocked by any piece in the path." />
            <InfoCard color="indigo" label="Flying" desc="Any direction including diagonal. Can fly over occupied squares." />
            <InfoCard color="amber" label="Teleport" desc="Wizard/Sorceress only — move to any square on the board instantly." />
          </div>
        </Section>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Play Now
          </Link>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-gray-800" />
        {title}
        <span className="h-px flex-1 bg-gray-800" />
      </h2>
      {children}
    </section>
  );
}

function InfoCard({ color, label, desc }: { color: "indigo" | "gray" | "amber" | "rose"; label: string; desc: string }) {
  const colors = {
    indigo: "bg-indigo-950/50 border-indigo-800/40 text-indigo-300",
    gray:   "bg-gray-900/50 border-gray-700/40 text-gray-300",
    amber:  "bg-amber-950/50 border-amber-800/40 text-amber-300",
    rose:   "bg-rose-950/50 border-rose-800/40 text-rose-300",
  };
  return (
    <div className={`rounded-xl border p-3 ${colors[color]}`}>
      <div className="font-semibold text-sm mb-1">{label}</div>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
