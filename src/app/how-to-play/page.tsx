"use client";

import Link from "next/link";
import { useState } from "react";
import { LANGUAGES, TRANSLATIONS, type Lang, type Translation } from "@/lib/i18n";

const PIECE_LABELS = ["Wiz","Uni","Arc","Val","Gol","Djn","Phx","Knt"];
const DARK_LABELS  = ["Sor","Bas","Man","Ban","Trl","Drg","Shp","Gob"];
const HP_LIGHT = [15,14,12,13,20,14,16,8];
const HP_DARK  = [15,10,12,13,20,22,16,8];

export default function HowToPlay() {
  const [lang, setLang] = useState<Lang>("en");
  const t = TRANSLATIONS[lang];

  return (
    <main
      className="min-h-screen bg-[#070b14] text-white px-4 py-12"
      dir={t.dir}
    >
      <div className="max-w-3xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/" className="text-gray-500 hover:text-indigo-400 text-sm transition-colors mb-4 inline-block">
              {t.back}
            </Link>
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-indigo-400">A</span>rchon — {t.pageTitle}
            </h1>
            <p className="text-gray-400 text-sm">{t.pageSubtitle}</p>
          </div>

          {/* Language switcher */}
          <div className="flex gap-1.5 mt-1 shrink-0">
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  lang === code
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-gray-900/60 border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-600"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Objective ── */}
        <Section title={t.s_objective}>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">{t.obj_intro}</p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-300">
            {t.obj_ways.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ol>
        </Section>

        {/* ── Board ── */}
        <Section title={t.s_board}>
          <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
            <InfoCard color="indigo" label={t.squares[0].label} desc={t.squares[0].desc} />
            <InfoCard color="gray"   label={t.squares[1].label} desc={t.squares[1].desc} />
            <InfoCard color="amber"  label={t.squares[2].label} desc={t.squares[2].desc} />
          </div>
          <p className="text-gray-400 text-xs leading-relaxed">
            <span className="text-amber-400 font-medium">◐ </span>{t.board_note}
          </p>
        </Section>

        {/* ── Controls ── */}
        <Section title={t.s_controls}>
          <div className="grid sm:grid-cols-2 gap-3">
            <InfoCard color="indigo" label={t.controls[0].label} desc={t.controls[0].desc} />
            <InfoCard color="indigo" label={t.controls[1].label} desc={t.controls[1].desc} />
            <InfoCard color="rose"   label={t.controls[2].label} desc={t.controls[2].desc} />
            <InfoCard color="rose"   label={t.controls[3].label} desc={t.controls[3].desc} />
          </div>
        </Section>

        {/* ── Combat ── */}
        <Section title={t.s_combat}>
          <p className="text-gray-300 text-sm leading-relaxed mb-3">{t.combat_body}</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            <span className="text-amber-400 font-medium">★ </span>{t.combat_note}
          </p>
        </Section>

        {/* ── Light Pieces ── */}
        <Section title={t.s_lightPieces}>
          <PieceGrid pieces={t.light} labels={PIECE_LABELS} hps={HP_LIGHT} side="light" t={t} />
        </Section>

        {/* ── Dark Pieces ── */}
        <Section title={t.s_darkPieces}>
          <PieceGrid pieces={t.dark} labels={DARK_LABELS} hps={HP_DARK} side="dark" t={t} />
        </Section>

        {/* ── Spells ── */}
        <Section title={t.s_spells}>
          <p className="text-gray-400 text-xs mb-4 leading-relaxed">
            <span className="text-amber-400 font-medium">⚠ </span>{t.spells_note}
          </p>
          <div className="space-y-2">
            {t.spells.map((s) => (
              <div key={s.name} className="flex gap-3 rounded-xl bg-gray-900/40 border border-gray-800/50 px-4 py-3">
                <span className="text-indigo-300 font-semibold text-sm w-40 flex-shrink-0">{s.name}</span>
                <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Movement ── */}
        <Section title={t.s_movement}>
          <div className="grid sm:grid-cols-3 gap-3">
            <InfoCard color="gray"   label={t.movement[0].label} desc={t.movement[0].desc} />
            <InfoCard color="indigo" label={t.movement[1].label} desc={t.movement[1].desc} />
            <InfoCard color="amber"  label={t.movement[2].label} desc={t.movement[2].desc} />
          </div>
        </Section>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            {t.playNow}
          </Link>
        </div>
      </div>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
  const styles: Record<string, string> = {
    indigo: "bg-indigo-950/50 border-indigo-800/40 text-indigo-300",
    gray:   "bg-gray-900/50 border-gray-700/40 text-gray-300",
    amber:  "bg-amber-950/50 border-amber-800/40 text-amber-300",
    rose:   "bg-rose-950/50 border-rose-800/40 text-rose-300",
  };
  return (
    <div className={`rounded-xl border p-3 ${styles[color]}`}>
      <div className="font-semibold text-sm mb-1">{label}</div>
      <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function PieceGrid({
  pieces, labels, hps, side, t,
}: {
  pieces: Translation["light"];
  labels: string[];
  hps: number[];
  side: "light" | "dark";
  t: Translation;
}) {
  const circleClass = side === "light"
    ? "bg-indigo-700 ring-indigo-400/50"
    : "bg-rose-800 ring-rose-400/50";
  const nameClass = side === "light" ? "text-indigo-300" : "text-rose-300";
  const cardClass = side === "light"
    ? "bg-indigo-950/60 border-indigo-700/40"
    : "bg-rose-950/40 border-rose-800/30";

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {pieces.map((p, i) => (
        <div key={i} className={`rounded-xl border p-4 ${cardClass} flex gap-4`}>
          <div className={`w-12 h-12 rounded-full ${circleClass} ring-2 flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
            {labels[i]}
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`font-semibold text-sm ${nameClass}`}>{p.name}</span>
              <span className="text-gray-600 text-xs">{t.col_hp} {hps[i]}</span>
            </div>
            <div className="text-xs text-gray-400 mb-1">
              <span className="text-gray-500">{t.col_move}:</span> {p.move}
              &nbsp;·&nbsp;
              <span className="text-gray-500">{t.col_range}:</span> {p.range}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{p.notes}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
