export type Lang = "en" | "es" | "he" | "fr" | "de";

export const LANGUAGES: { code: Lang; flag: string; label: string }[] = [
  { code: "en", flag: "🇬🇧", label: "English" },
  { code: "es", flag: "🇪🇸", label: "Español" },
  { code: "he", flag: "🇮🇱", label: "עברית" },
  { code: "fr", flag: "🇫🇷", label: "Français" },
  { code: "de", flag: "🇩🇪", label: "Deutsch" },
];

export interface PieceTr {
  name: string;
  move: string;
  range: string;
  notes: string;
}

export interface SpellTr {
  name: string;
  desc: string;
}

export interface SquareTr { label: string; desc: string }
export interface ControlTr { label: string; desc: string }
export interface MoveTr    { label: string; desc: string }

export interface Translation {
  dir: "ltr" | "rtl";
  back: string;
  playNow: string;
  pageTitle: string;
  pageSubtitle: string;

  // section headings
  s_objective:   string;
  s_board:       string;
  s_controls:    string;
  s_combat:      string;
  s_lightPieces: string;
  s_darkPieces:  string;
  s_spells:      string;
  s_movement:    string;

  // objective
  obj_intro: string;
  obj_ways:  [string, string, string];

  // board
  squares: [SquareTr, SquareTr, SquareTr];
  board_note: string;

  // controls
  controls: [ControlTr, ControlTr, ControlTr, ControlTr];

  // combat
  combat_body: string;
  combat_note: string;

  // pieces
  col_move:  string;
  col_range: string;
  col_hp:    string;
  col_notes: string;
  light: PieceTr[];
  dark:  PieceTr[];

  // spells
  spells_note: string;
  spells: SpellTr[];

  // movement types
  movement: [MoveTr, MoveTr, MoveTr];
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH
// ─────────────────────────────────────────────────────────────────────────────
const en: Translation = {
  dir: "ltr",
  back: "← Back",
  playNow: "Play Now",
  pageTitle: "How to Play",
  pageSubtitle: "A strategy + real-time combat game for two players.",

  s_objective:   "Objective",
  s_board:       "The Board",
  s_controls:    "Controls",
  s_combat:      "Combat",
  s_lightPieces: "Light Side Pieces",
  s_darkPieces:  "Dark Side Pieces",
  s_spells:      "Spells",
  s_movement:    "Movement Types",

  obj_intro: "Win in one of three ways:",
  obj_ways: [
    "Control all 5 Power Points simultaneously — the glowing amber squares.",
    "Eliminate all enemy pieces from the board.",
    "Imprison the enemy's last piece with the Imprison spell.",
  ],

  squares: [
    { label: "Light Squares",       desc: "Permanently light. Light side starts on the left (columns A–B). Boosts Light HP in combat." },
    { label: "Dark Squares",        desc: "Permanently dark. Dark side starts on the right (columns H–I). Boosts Dark HP in combat." },
    { label: "Oscillating Squares", desc: "Cycle through 6 shades each turn — column E, the middle row, and inner corners of each quadrant. Advantage flows between sides." },
  ],
  board_note: "Light plays from the left; Dark from the right. The 5 Power Points form a cross: centre (E5), left edge (A5 — permanent Light home), right edge (I5 — permanent Dark home), top (E1), and bottom (E9). The luminance cycle shifts one step each turn — squares that favour you now may favour your opponent soon.",

  controls: [
    { label: "Board — Select Piece",  desc: "Click one of your pieces. Valid moves highlight green, valid attacks highlight red." },
    { label: "Board — Move / Attack", desc: "Click a highlighted square to move. Click a red square to attack — this starts combat." },
    { label: "Combat — Move",         desc: "Arrow keys to move your unit around the arena." },
    { label: "Combat — Fire",         desc: "Space bar to shoot. There is a cooldown between shots." },
  ],

  combat_body: "When a piece moves onto an enemy square, both players enter a real-time arena. Each controls their own unit — move and fire to reduce the opponent to 0 HP. The winner returns to the board; the loser is removed. Damage persists between battles — there is no auto-healing.",
  combat_note: "The square's colour affects HP: fighting on a square that favours your side gives up to +7 HP. Power Points restore 1 HP per turn to any unit standing on them.",

  col_move: "Move", col_range: "Range", col_hp: "HP", col_notes: "Notes",

  light: [
    { name: "Wizard",     move: "Teleport (anywhere)", range: "Long",       notes: "Casts all 7 spells. Each spell cast permanently reduces max HP." },
    { name: "Unicorn",    move: "Ground (4)",           range: "Med–Long",   notes: "Fast fire rate. Best ground attacker for Light." },
    { name: "Archer",     move: "Ground (3)",           range: "Medium",     notes: "Balanced mid-range attacker." },
    { name: "Valkyrie",   move: "Flying (3)",           range: "Medium",     notes: "Flying gives strong board mobility." },
    { name: "Golem",      move: "Ground (2, slow)",     range: "Long",       notes: "Huge HP and damage. Very slow." },
    { name: "Djinni",     move: "Flying (4)",           range: "Long",       notes: "Fast shots. Strong flying attacker." },
    { name: "Phoenix",    move: "Flying (5)",           range: "Short–Med",  notes: "Can become an invulnerable fireball — but immobile while doing so." },
    { name: "Knight ×7",  move: "Ground (3)",           range: "Melee",      notes: "Fast reload, very fragile. Useless against ranged units." },
  ],
  dark: [
    { name: "Sorceress",      move: "Teleport (anywhere)", range: "Long",      notes: "Mirror of the Wizard. Casts all 7 spells." },
    { name: "Basilisk",       move: "Ground (3)",           range: "Med–Long",  notes: "Most powerful Dark attacker but critically low HP. Needs dark squares." },
    { name: "Manticore",      move: "Ground (3)",           range: "Medium",    notes: "Mirror of the Archer." },
    { name: "Banshee",        move: "Flying (3)",           range: "Close (area)", notes: "Shriek hits an area. Mirror of the Valkyrie." },
    { name: "Troll",          move: "Ground (2, slow)",     range: "Long",      notes: "Mirror of the Golem." },
    { name: "Dragon",         move: "Flying (4)",           range: "Long",      notes: "Highest HP and damage in the game. Slowest reload — exploit this." },
    { name: "Shapeshifter",   move: "Flying (5)",           range: "Varies",    notes: "Copies the opponent's abilities in combat. Fully heals after every fight." },
    { name: "Goblin ×7",      move: "Ground (3)",           range: "Melee",     notes: "Mirror of the Knight." },
  ],

  spells_note: "Only the Wizard (Light) and Sorceress (Dark) can cast spells. Each spell may only be used once per game. Every spell permanently reduces the caster's max HP — use them wisely.",
  spells: [
    { name: "Teleport",         desc: "Move any of your pieces instantly to any empty square — or onto an enemy to trigger combat immediately." },
    { name: "Heal",             desc: "Fully restore one unit's HP. Cannot target a unit on a Power Point." },
    { name: "Shift Time",       desc: "Reverse or jump the luminance cycle. Enormously powerful for flipping board-wide combat advantage." },
    { name: "Exchange",         desc: "Swap the board positions of any two pieces — own, enemy, or one of each." },
    { name: "Summon Elemental", desc: "Summon a random elemental (Fire, Earth, Water, Air) to fight one battle on your behalf, then disappear." },
    { name: "Revive",           desc: "Resurrect one destroyed piece at full HP, placed next to your spellcaster." },
    { name: "Imprison",         desc: "Freeze an enemy piece in place. It cannot move until the luminance cycle reaches the imprisoned piece's extreme." },
  ],

  movement: [
    { label: "Ground",   desc: "Orthogonal only (no diagonal). Blocked by any piece in the path." },
    { label: "Flying",   desc: "Any direction including diagonal. Can fly over occupied squares." },
    { label: "Teleport", desc: "Wizard/Sorceress only — move to any square on the board instantly." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SPANISH
// ─────────────────────────────────────────────────────────────────────────────
const es: Translation = {
  dir: "ltr",
  back: "← Volver",
  playNow: "Jugar ahora",
  pageTitle: "Cómo jugar",
  pageSubtitle: "Un juego de estrategia y combate en tiempo real para dos jugadores.",

  s_objective:   "Objetivo",
  s_board:       "El tablero",
  s_controls:    "Controles",
  s_combat:      "Combate",
  s_lightPieces: "Piezas del lado Claro",
  s_darkPieces:  "Piezas del lado Oscuro",
  s_spells:      "Hechizos",
  s_movement:    "Tipos de movimiento",

  obj_intro: "Gana de una de estas tres maneras:",
  obj_ways: [
    "Controla los 5 Puntos de Poder simultáneamente — las casillas doradas parpadeantes.",
    "Elimina todas las piezas enemigas del tablero.",
    "Encarcela la última pieza enemiga con el hechizo Encarcelar.",
  ],

  squares: [
    { label: "Casillas Claras",      desc: "Permanentemente claras. El lado Claro comienza a la izquierda (columnas A–B). Aumentan los PV del lado Claro en combate." },
    { label: "Casillas Oscuras",     desc: "Permanentemente oscuras. El lado Oscuro comienza a la derecha (columnas H–I). Aumentan los PV del lado Oscuro en combate." },
    { label: "Casillas Oscilantes",  desc: "Cambian entre 6 tonalidades cada turno — la columna E, la fila central y los rincones interiores de cada cuadrante. La ventaja alterna entre bandos." },
  ],
  board_note: "El lado Claro juega desde la izquierda; el Oscuro desde la derecha. Los 5 Puntos de Poder forman una cruz: centro (E5), borde izquierdo (A5 — hogar permanente del lado Claro), borde derecho (I5 — hogar permanente del lado Oscuro), arriba (E1) y abajo (E9). El ciclo de luminancia avanza un paso cada turno — las casillas que te favorecen ahora pueden favorecer a tu rival pronto.",

  controls: [
    { label: "Tablero — Seleccionar",   desc: "Haz clic en una de tus piezas. Los movimientos válidos se iluminan en verde, los ataques en rojo." },
    { label: "Tablero — Mover/Atacar",  desc: "Haz clic en una casilla iluminada para mover. Haz clic en una roja para atacar — inicia el combate." },
    { label: "Combate — Mover",         desc: "Teclas de dirección para mover tu unidad por la arena." },
    { label: "Combate — Disparar",      desc: "Barra espaciadora para disparar. Hay un tiempo de recarga entre disparos." },
  ],

  combat_body: "Cuando una pieza se mueve sobre una casilla enemiga, ambos jugadores entran en una arena en tiempo real. Cada uno controla su propia unidad — muévete y dispara para reducir al oponente a 0 PV. El ganador regresa al tablero; el perdedor es eliminado. El daño persiste entre batallas — no hay curación automática.",
  combat_note: "El color de la casilla afecta los PV: combatir en una casilla favorable te da hasta +7 PV. Los Puntos de Poder restauran 1 PV por turno a cualquier unidad sobre ellos.",

  col_move: "Movimiento", col_range: "Alcance", col_hp: "PV", col_notes: "Notas",

  light: [
    { name: "Mago",            move: "Teletransporte (cualquier lugar)", range: "Largo",       notes: "Lanza los 7 hechizos. Cada hechizo reduce permanentemente los PV máximos." },
    { name: "Unicornio",       move: "Tierra (4)",                       range: "Med–Largo",   notes: "Cadencia de fuego alta. Mejor atacante terrestre del lado Claro." },
    { name: "Arquero",         move: "Tierra (3)",                       range: "Medio",       notes: "Atacante equilibrado de alcance medio." },
    { name: "Valquiria",       move: "Vuelo (3)",                        range: "Medio",       notes: "El vuelo otorga gran movilidad en el tablero." },
    { name: "Gólem",           move: "Tierra (2, lento)",                range: "Largo",       notes: "PV y daño enormes. Muy lento." },
    { name: "Genio",           move: "Vuelo (4)",                        range: "Largo",       notes: "Disparos rápidos. Poderoso atacante aéreo." },
    { name: "Fénix",           move: "Vuelo (5)",                        range: "Corto–Medio", notes: "Puede convertirse en una bola de fuego invulnerable — pero inmóvil mientras lo hace." },
    { name: "Caballero ×7",    move: "Tierra (3)",                       range: "Cuerpo a cuerpo", notes: "Recarga rápida, muy frágil. Inútil contra unidades a distancia." },
  ],
  dark: [
    { name: "Hechicera",         move: "Teletransporte (cualquier lugar)", range: "Largo",       notes: "Espejo del Mago. Lanza los 7 hechizos." },
    { name: "Basilisco",         move: "Tierra (3)",                       range: "Med–Largo",   notes: "El atacante oscuro más poderoso, pero con PV muy bajos. Necesita casillas oscuras." },
    { name: "Mantícora",         move: "Tierra (3)",                       range: "Medio",       notes: "Espejo del Arquero." },
    { name: "Banshee",           move: "Vuelo (3)",                        range: "Cerca (área)", notes: "El chillido golpea un área. Espejo de la Valquiria." },
    { name: "Trol",              move: "Tierra (2, lento)",                range: "Largo",       notes: "Espejo del Gólem." },
    { name: "Dragón",            move: "Vuelo (4)",                        range: "Largo",       notes: "Máximo daño y PV del juego. La recarga más lenta — explotala." },
    { name: "Cambiaformas",      move: "Vuelo (5)",                        range: "Variable",    notes: "Copia las habilidades del rival en combate. Se cura completamente tras cada lucha." },
    { name: "Trasgo ×7",         move: "Tierra (3)",                       range: "Cuerpo a cuerpo", notes: "Espejo del Caballero." },
  ],

  spells_note: "Solo el Mago (Claro) y la Hechicera (Oscuro) pueden lanzar hechizos. Cada hechizo solo se puede usar una vez por partida. Cada lanzamiento reduce permanentemente los PV máximos del lanzador — úsalos con sabiduría.",
  spells: [
    { name: "Teletransporte",    desc: "Mueve cualquiera de tus piezas al instante a cualquier casilla vacía — o sobre un enemigo para iniciar el combate de inmediato." },
    { name: "Curar",             desc: "Restaura completamente los PV de una unidad. No puede usarse en unidades sobre un Punto de Poder." },
    { name: "Alterar el Tiempo", desc: "Invierte o salta el ciclo de luminancia. Extremadamente poderoso para cambiar la ventaja en todo el tablero." },
    { name: "Intercambiar",      desc: "Intercambia las posiciones en el tablero de dos piezas cualesquiera — propias, enemigas o una de cada." },
    { name: "Invocar Elemental", desc: "Invoca un elemental aleatorio (Fuego, Tierra, Agua, Aire) para luchar una batalla por ti y luego desaparecer." },
    { name: "Revivir",           desc: "Resucita una pieza destruida con los PV completos, colocada junto a tu lanzador de hechizos." },
    { name: "Encarcelar",        desc: "Congela una pieza enemiga en su lugar. No puede moverse hasta que el ciclo de luminancia alcance el extremo de ese bando." },
  ],

  movement: [
    { label: "Tierra",        desc: "Solo ortogonal (sin diagonal). Bloqueado por cualquier pieza en el camino." },
    { label: "Vuelo",         desc: "Cualquier dirección incluyendo diagonal. Puede volar sobre casillas ocupadas." },
    { label: "Teletransporte", desc: "Solo Mago/Hechicera — se mueven a cualquier casilla del tablero al instante." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// HEBREW
// ─────────────────────────────────────────────────────────────────────────────
const he: Translation = {
  dir: "rtl",
  back: "→ חזרה",
  playNow: "שחק עכשיו",
  pageTitle: "איך משחקים",
  pageSubtitle: "משחק אסטרטגיה וקרב בזמן אמת לשני שחקנים.",

  s_objective:   "מטרת המשחק",
  s_board:       "הלוח",
  s_controls:    "שליטה",
  s_combat:      "קרב",
  s_lightPieces: "כלי צד האור",
  s_darkPieces:  "כלי צד החושך",
  s_spells:      "לחשים",
  s_movement:    "סוגי תנועה",

  obj_intro: "ניצחון מתאפשר באחת משלוש דרכים:",
  obj_ways: [
    "שליטה בכל 5 נקודות הכוח בו-זמנית — הריבועים הענברים הזוהרים.",
    "חיסול כל כלי היריב מהלוח.",
    "כליאת הכלי האחרון של היריב בעזרת לחש הכליאה.",
  ],

  squares: [
    { label: "ריבועים בהירים",   desc: "בהירים לצמיתות. צד האור מתחיל משמאל (עמודות A–B). מעניקים נק' חיים נוספות לצד האור בקרב." },
    { label: "ריבועים אפלים",    desc: "אפלים לצמיתות. צד החושך מתחיל מימין (עמודות H–I). מעניקים נק' חיים נוספות לצד החושך בקרב." },
    { label: "ריבועים דינמיים",  desc: "עוברים בין 6 גוונים בכל תור — עמודה E, שורת האמצע ופינות פנימיות של כל רבעון. היתרון עובר בין הצדדים." },
  ],
  board_note: "האור משחק משמאל; החושך מימין. 5 נקודות הכוח יוצרות צלב: מרכז (E5), קצה שמאל (A5 — בית קבוע של האור), קצה ימין (I5 — בית קבוע של החושך), למעלה (E1) ולמטה (E9). מחזור הלומינסנס מתקדם צעד אחד בכל תור — ריבועים שמעניקים לך יתרון עכשיו עשויים להעניק יתרון ליריבך בקרוב.",

  controls: [
    { label: "לוח — בחירת כלי",    desc: "לחץ על אחד מכליך. מהלכים חוקיים מסומנים בירוק, התקפות חוקיות מסומנות באדום." },
    { label: "לוח — מהלך / התקפה", desc: "לחץ על ריבוע מסומן להזזה. לחץ על ריבוע אדום לתקיפה — זה מתחיל קרב." },
    { label: "קרב — תנועה",         desc: "מקשי החצים להזזת היחידה שלך בזירה." },
    { label: "קרב — ירי",           desc: "מקש הרווח לירי. קיים זמן טעינה בין ירייה לירייה." },
  ],

  combat_body: "כשכלי עובר לריבוע של יריב, שני השחקנים נכנסים לזירת קרב בזמן אמת. כל שחקן שולט ביחידה שלו — הזז וירה כדי להביא את היריב ל-0 נק' חיים. המנצח חוזר ללוח; המפסיד מוסר. נזק נשמר בין קרבות — אין ריפוי אוטומטי.",
  combat_note: "צבע הריבוע משפיע על נק' החיים: קרב בריבוע נוח לצדך מעניק עד +7 נק' חיים. נקודות הכוח משיבות נק' חיים אחת לתור לכל יחידה העומדת עליהן.",

  col_move: "תנועה", col_range: "טווח", col_hp: "נ\"ח", col_notes: "הערות",

  light: [
    { name: "קוסם",          move: "טלפורט (כל מקום)",    range: "ארוך",         notes: "מטיל את כל 7 הלחשים. כל לחש מקטין את נק' החיים המקסימליות לצמיתות." },
    { name: "חד-קרן",        move: "קרקע (4)",             range: "בינוני–ארוך",  notes: "קצב ירי גבוה. התוקף הקרקעי הטוב ביותר בצד האור." },
    { name: "קשת",           move: "קרקע (3)",             range: "בינוני",       notes: "תוקף מאוזן לטווח בינוני." },
    { name: "ולקירי",        move: "טיסה (3)",             range: "בינוני",       notes: "הטיסה מעניקה ניידות גבוהה בלוח." },
    { name: "גולם",          move: "קרקע (2, איטי)",       range: "ארוך",         notes: "נק' חיים ונזק עצומים. איטי מאוד." },
    { name: "ג'יני",         move: "טיסה (4)",             range: "ארוך",         notes: "ירי מהיר. תוקף מעופף חזק." },
    { name: "פניקס",         move: "טיסה (5)",             range: "קצר–בינוני",  notes: "יכול להפוך לכדור אש בלתי פגיע — אך ללא תנועה בזמן כך." },
    { name: "אביר ×7",       move: "קרקע (3)",             range: "קרב צמוד",    notes: "טעינה מהירה, שביר מאוד. חסר ערך מול יחידות מרחוק." },
  ],
  dark: [
    { name: "מכשפה",          move: "טלפורט (כל מקום)",    range: "ארוך",         notes: "המראה של הקוסם. מטילה את כל 7 הלחשים." },
    { name: "בזיליסק",        move: "קרקע (3)",             range: "בינוני–ארוך",  notes: "התוקף החזק ביותר בצד החושך, אך עם מעט מאוד נק' חיים. דורש ריבועים אפלים." },
    { name: "מנטיקור",        move: "קרקע (3)",             range: "בינוני",       notes: "המראה של הקשת." },
    { name: "בנשי",           move: "טיסה (3)",             range: "קרוב (שטח)",   notes: "הצרחה פוגעת בשטח. המראה של הולקירי." },
    { name: "טרול",           move: "קרקע (2, איטי)",       range: "ארוך",         notes: "המראה של הגולם." },
    { name: "דרקון",          move: "טיסה (4)",             range: "ארוך",         notes: "הנזק ונק' החיים הגבוהים ביותר במשחק. הטעינה האיטית ביותר — ניתן לנצל זאת." },
    { name: "משנה-צורה",      move: "טיסה (5)",             range: "משתנה",        notes: "מעתיק את יכולות היריב בקרב. מתרפא לחלוטין לאחר כל קרב." },
    { name: "גובלין ×7",      move: "קרקע (3)",             range: "קרב צמוד",    notes: "המראה של האביר." },
  ],

  spells_note: "רק הקוסם (אור) והמכשפה (חושך) יכולים להטיל לחשים. כל לחש ניתן לשימוש פעם אחת בלבד למשחק. כל לחש מקטין את נק' החיים המקסימליות של המטיל לצמיתות — השתמש בהם בחוכמה.",
  spells: [
    { name: "טלפורט",        desc: "הזזת כל כלי שלך לאלתר לכל ריבוע ריק — או לריבוע של יריב להתחלת קרב מיידית." },
    { name: "ריפוי",         desc: "שחזור מלא של נק' החיים של יחידה אחת. לא ניתן להשתמש על יחידה בנקודת כוח." },
    { name: "שינוי זמן",     desc: "היפוך מחזור הלומינסנס או קפיצה לצד הנגדי. עוצמתי ביותר לשינוי היתרון בכל הלוח." },
    { name: "החלפה",         desc: "החלפת מיקום של שני כלים כלשהם — שלך, של היריב, או אחד מכל סוג." },
    { name: "זימון אלמנטל",  desc: "זימון אלמנטל אקראי (אש, אדמה, מים, אוויר) שיילחם קרב אחד עבורך ואז ייעלם." },
    { name: "תחייה",         desc: "החייאת כלי שנהרס בנק' חיים מלאות, ממוקם ליד המטיל שלך." },
    { name: "כליאה",         desc: "קיבוע כלי יריב במקומו. לא יכול לזוז עד שמחזור הלומינסנס מגיע לקצה הצד של הכלי הכלוא." },
  ],

  movement: [
    { label: "קרקע",    desc: "כיוונים ניצבים בלבד (ללא אלכסון). חסום על ידי כל כלי בדרך." },
    { label: "טיסה",    desc: "כל כיוון כולל אלכסון. יכול לעוף מעל ריבועים תפוסים." },
    { label: "טלפורט", desc: "קוסם/מכשפה בלבד — זז לכל ריבוע בלוח לאלתר." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FRENCH
// ─────────────────────────────────────────────────────────────────────────────
const fr: Translation = {
  dir: "ltr",
  back: "← Retour",
  playNow: "Jouer maintenant",
  pageTitle: "Comment jouer",
  pageSubtitle: "Un jeu de stratégie et de combat en temps réel pour deux joueurs.",

  s_objective:   "Objectif",
  s_board:       "Le plateau",
  s_controls:    "Contrôles",
  s_combat:      "Combat",
  s_lightPieces: "Pièces du côté Lumière",
  s_darkPieces:  "Pièces du côté Ombre",
  s_spells:      "Sorts",
  s_movement:    "Types de déplacement",

  obj_intro: "Gagnez de l'une de ces trois façons :",
  obj_ways: [
    "Contrôlez les 5 Points de Pouvoir simultanément — les cases ambrées qui brillent.",
    "Éliminez toutes les pièces adverses du plateau.",
    "Emprisonnez la dernière pièce ennemie avec le sort Emprisonner.",
  ],

  squares: [
    { label: "Cases claires",     desc: "Définitivement claires. Le côté Lumière débute à gauche (colonnes A–B). Augmentent les PV du côté Lumière en combat." },
    { label: "Cases sombres",     desc: "Définitivement sombres. Le côté Ombre débute à droite (colonnes H–I). Augmentent les PV du côté Ombre en combat." },
    { label: "Cases oscillantes", desc: "Alternent entre 6 nuances à chaque tour — colonne E, rangée centrale et coins intérieurs de chaque quadrant. L'avantage bascule entre les camps." },
  ],
  board_note: "La Lumière joue à gauche ; l'Ombre à droite. Les 5 Points de Pouvoir forment une croix : centre (E5), bord gauche (A5 — demeure permanente de la Lumière), bord droit (I5 — demeure permanente de l'Ombre), haut (E1) et bas (E9). Le cycle de luminance avance d'un cran à chaque tour — les cases qui vous favorisent maintenant pourraient favoriser votre adversaire bientôt.",

  controls: [
    { label: "Plateau — Sélectionner", desc: "Cliquez sur l'une de vos pièces. Les mouvements valides s'affichent en vert, les attaques en rouge." },
    { label: "Plateau — Déplacer / Attaquer", desc: "Cliquez sur une case surlignée pour bouger. Cliquez sur une case rouge pour attaquer — cela lance le combat." },
    { label: "Combat — Se déplacer", desc: "Touches directionnelles pour déplacer votre unité dans l'arène." },
    { label: "Combat — Tirer", desc: "Barre espace pour tirer. Il y a un temps de recharge entre chaque tir." },
  ],

  combat_body: "Quand une pièce se déplace sur la case d'un ennemi, les deux joueurs entrent dans une arène en temps réel. Chacun contrôle sa propre unité — déplacez-vous et tirez pour réduire l'adversaire à 0 PV. Le vainqueur retourne sur le plateau ; le perdant est éliminé. Les dégâts persistent entre les combats — il n'y a pas de guérison automatique.",
  combat_note: "La couleur de la case affecte les PV : combattre sur une case favorable vous donne jusqu'à +7 PV. Les Points de Pouvoir restaurent 1 PV par tour à toute unité qui s'y trouve.",

  col_move: "Déplacement", col_range: "Portée", col_hp: "PV", col_notes: "Notes",

  light: [
    { name: "Magicien",       move: "Téléportation (partout)",  range: "Longue",       notes: "Lance les 7 sorts. Chaque sort réduit définitivement les PV maximum." },
    { name: "Licorne",        move: "Sol (4)",                   range: "Moy–Longue",   notes: "Cadence de tir élevée. Meilleur attaquant terrestre côté Lumière." },
    { name: "Archer",         move: "Sol (3)",                   range: "Moyenne",      notes: "Attaquant équilibré à portée moyenne." },
    { name: "Valkyrie",       move: "Vol (3)",                   range: "Moyenne",      notes: "Le vol offre une excellente mobilité sur le plateau." },
    { name: "Golem",          move: "Sol (2, lent)",             range: "Longue",       notes: "PV et dégâts énormes. Très lent." },
    { name: "Djinn",          move: "Vol (4)",                   range: "Longue",       notes: "Tirs rapides. Puissant attaquant volant." },
    { name: "Phénix",         move: "Vol (5)",                   range: "Courte–Moy",   notes: "Peut devenir une boule de feu invulnérable — mais immobile pendant ce temps." },
    { name: "Chevalier ×7",   move: "Sol (3)",                   range: "Mêlée",        notes: "Rechargement rapide, très fragile. Inutile contre les unités à distance." },
  ],
  dark: [
    { name: "Sorcière",       move: "Téléportation (partout)",  range: "Longue",       notes: "Miroir du Magicien. Lance les 7 sorts." },
    { name: "Basilic",        move: "Sol (3)",                   range: "Moy–Longue",   notes: "L'attaquant Ombre le plus puissant, mais avec des PV très faibles. A besoin de cases sombres." },
    { name: "Manticore",      move: "Sol (3)",                   range: "Moyenne",      notes: "Miroir de l'Archer." },
    { name: "Banshee",        move: "Vol (3)",                   range: "Proche (zone)", notes: "Le cri touche une zone. Miroir de la Valkyrie." },
    { name: "Troll",          move: "Sol (2, lent)",             range: "Longue",       notes: "Miroir du Golem." },
    { name: "Dragon",         move: "Vol (4)",                   range: "Longue",       notes: "Dégâts et PV les plus élevés du jeu. Rechargement le plus lent — exploitez-le." },
    { name: "Métamorphe",     move: "Vol (5)",                   range: "Variable",     notes: "Copie les capacités de l'adversaire en combat. Se soigne entièrement après chaque combat." },
    { name: "Gobelin ×7",     move: "Sol (3)",                   range: "Mêlée",        notes: "Miroir du Chevalier." },
  ],

  spells_note: "Seuls le Magicien (Lumière) et la Sorcière (Ombre) peuvent lancer des sorts. Chaque sort ne peut être utilisé qu'une seule fois par partie. Chaque sort réduit définitivement les PV maximum du lanceur — utilisez-les avec sagesse.",
  spells: [
    { name: "Téléportation",    desc: "Déplacez instantanément l'une de vos pièces vers n'importe quelle case vide — ou sur un ennemi pour déclencher immédiatement le combat." },
    { name: "Guérison",         desc: "Restaure entièrement les PV d'une unité. Ne peut pas cibler une unité sur un Point de Pouvoir." },
    { name: "Altérer le temps", desc: "Inverse ou fait sauter le cycle de luminance. Extrêmement puissant pour renverser l'avantage sur tout le plateau." },
    { name: "Échange",          desc: "Échange les positions de deux pièces quelconques — les vôtres, celles de l'ennemi, ou une de chaque." },
    { name: "Invoquer un élémental", desc: "Invoque un élémental aléatoire (Feu, Terre, Eau, Air) pour livrer un seul combat en votre nom, puis disparaître." },
    { name: "Résurrection",     desc: "Ressuscite une pièce détruite avec ses PV complets, placée à côté de votre lanceur de sorts." },
    { name: "Emprisonner",      desc: "Immobilise une pièce ennemie sur place. Elle ne peut pas bouger jusqu'à ce que le cycle de luminance atteigne l'extrême de son camp." },
  ],

  movement: [
    { label: "Sol",           desc: "Orthogonal uniquement (pas en diagonale). Bloqué par toute pièce sur le chemin." },
    { label: "Vol",           desc: "Toutes directions, y compris en diagonale. Peut survoler les cases occupées." },
    { label: "Téléportation", desc: "Magicien/Sorcière uniquement — se déplace instantanément sur n'importe quelle case." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// GERMAN
// ─────────────────────────────────────────────────────────────────────────────
const de: Translation = {
  dir: "ltr",
  back: "← Zurück",
  playNow: "Jetzt spielen",
  pageTitle: "Spielanleitung",
  pageSubtitle: "Ein Strategie- und Echtzeit-Kampfspiel für zwei Spieler.",

  s_objective:   "Ziel",
  s_board:       "Das Spielfeld",
  s_controls:    "Steuerung",
  s_combat:      "Kampf",
  s_lightPieces: "Figuren der Lichtseite",
  s_darkPieces:  "Figuren der Dunkelseite",
  s_spells:      "Zauber",
  s_movement:    "Bewegungsarten",

  obj_intro: "Gewinne auf eine dieser drei Arten:",
  obj_ways: [
    "Kontrolliere alle 5 Kraftpunkte gleichzeitig — die leuchtenden bernsteinfarbenen Felder.",
    "Eliminiere alle gegnerischen Figuren vom Spielfeld.",
    "Sperre die letzte Figur des Gegners mit dem Einsperren-Zauber ein.",
  ],

  squares: [
    { label: "Helle Felder",       desc: "Dauerhaft hell. Die Lichtseite startet links (Spalten A–B). Erhöhen die LP der Lichtseite im Kampf." },
    { label: "Dunkle Felder",      desc: "Dauerhaft dunkel. Die Dunkelseite startet rechts (Spalten H–I). Erhöhen die LP der Dunkelseite im Kampf." },
    { label: "Wechselnde Felder",  desc: "Wechseln jeden Zug zwischen 6 Schattierungen — Spalte E, die mittlere Reihe und innere Ecken jedes Quadranten. Der Vorteil fließt zwischen den Seiten." },
  ],
  board_note: "Licht spielt von links; Dunkel von rechts. Die 5 Kraftpunkte bilden ein Kreuz: Mitte (E5), linker Rand (A5 — dauerhaftes Zuhause des Lichts), rechter Rand (I5 — dauerhaftes Zuhause der Dunkelheit), oben (E1) und unten (E9). Der Luminanz-Zyklus schreitet jeden Zug einen Schritt voran — Felder, die dir jetzt nützen, können deinem Gegner bald nützen.",

  controls: [
    { label: "Spielfeld — Auswählen",       desc: "Klicke auf eine deiner Figuren. Gültige Züge werden grün, gültige Angriffe rot hervorgehoben." },
    { label: "Spielfeld — Ziehen / Angreifen", desc: "Klicke auf ein hervorgehobenes Feld zum Ziehen. Klicke auf ein rotes Feld zum Angreifen — das startet den Kampf." },
    { label: "Kampf — Bewegen",             desc: "Pfeiltasten, um deine Einheit in der Arena zu bewegen." },
    { label: "Kampf — Schießen",            desc: "Leertaste zum Schießen. Zwischen den Schüssen gibt es eine Abklingzeit." },
  ],

  combat_body: "Wenn eine Figur auf das Feld eines Gegners zieht, treten beide Spieler in eine Echtzeit-Arena. Jeder steuert seine eigene Einheit — bewege dich und schieße, um den Gegner auf 0 LP zu reduzieren. Der Gewinner kehrt auf das Spielfeld zurück; der Verlierer wird entfernt. Schaden bleibt zwischen Kämpfen erhalten — es gibt keine automatische Heilung.",
  combat_note: "Die Feldfarbe beeinflusst die LP: Kämpfen auf einem günstigen Feld gibt bis zu +7 LP. Kraftpunkte stellen jeder Einheit darauf 1 LP pro Zug wieder her.",

  col_move: "Bewegung", col_range: "Reichweite", col_hp: "LP", col_notes: "Hinweise",

  light: [
    { name: "Zauberer",      move: "Teleport (überall)",     range: "Weit",          notes: "Wirkt alle 7 Zauber. Jeder Zauber senkt dauerhaft die maximalen LP." },
    { name: "Einhorn",       move: "Boden (4)",              range: "Mittel–Weit",   notes: "Hohe Feuerrate. Bester Bodenangreifer der Lichtseite." },
    { name: "Bogenschütze",  move: "Boden (3)",              range: "Mittel",        notes: "Ausgewogener Mittelstreckenangreifer." },
    { name: "Walküre",       move: "Flug (3)",               range: "Mittel",        notes: "Flug ermöglicht hohe Mobilität auf dem Spielfeld." },
    { name: "Golem",         move: "Boden (2, langsam)",     range: "Weit",          notes: "Enorme LP und Schaden. Sehr langsam." },
    { name: "Dschinn",       move: "Flug (4)",               range: "Weit",          notes: "Schnelle Schüsse. Starker fliegender Angreifer." },
    { name: "Phönix",        move: "Flug (5)",               range: "Nah–Mittel",    notes: "Kann zu einem unverwundbaren Feuerball werden — ist dabei aber unbeweglich." },
    { name: "Ritter ×7",     move: "Boden (3)",              range: "Nahkampf",      notes: "Schnelles Nachladen, sehr zerbrechlich. Nutzlos gegen Fernkampfeinheiten." },
  ],
  dark: [
    { name: "Zauberin",      move: "Teleport (überall)",     range: "Weit",          notes: "Spiegel des Zauberers. Wirkt alle 7 Zauber." },
    { name: "Basilisk",      move: "Boden (3)",              range: "Mittel–Weit",   notes: "Mächtigster Angreifer der Dunkelseite, aber kritisch niedrige LP. Braucht dunkle Felder." },
    { name: "Mantikor",      move: "Boden (3)",              range: "Mittel",        notes: "Spiegel des Bogenschützen." },
    { name: "Banshee",       move: "Flug (3)",               range: "Nah (Fläche)",  notes: "Schrei trifft eine Fläche. Spiegel der Walküre." },
    { name: "Troll",         move: "Boden (2, langsam)",     range: "Weit",          notes: "Spiegel des Golems." },
    { name: "Drache",        move: "Flug (4)",               range: "Weit",          notes: "Höchste LP und Schaden im Spiel. Langsamste Nachladezeit — nutze das aus." },
    { name: "Gestaltwandler",move: "Flug (5)",               range: "Variabel",      notes: "Kopiert die Fähigkeiten des Gegners im Kampf. Heilt sich nach jedem Kampf vollständig." },
    { name: "Kobold ×7",     move: "Boden (3)",              range: "Nahkampf",      notes: "Spiegel des Ritters." },
  ],

  spells_note: "Nur der Zauberer (Licht) und die Zauberin (Dunkel) können Zauber wirken. Jeder Zauber darf nur einmal pro Spiel eingesetzt werden. Jeder Zauber senkt dauerhaft die maximalen LP des Wirkers — setze sie klug ein.",
  spells: [
    { name: "Teleport",            desc: "Bewege eine deiner Figuren sofort auf ein beliebiges freies Feld — oder auf einen Gegner, um sofort Kampf auszulösen." },
    { name: "Heilung",             desc: "Stellt die LP einer Einheit vollständig wieder her. Kann nicht auf eine Einheit auf einem Kraftpunkt angewendet werden." },
    { name: "Zeit verschieben",    desc: "Kehrt den Luminanz-Zyklus um oder springt zum Gegenpol. Äußerst mächtig, um den Vorteil auf dem gesamten Spielfeld zu wenden." },
    { name: "Tausch",              desc: "Tauscht die Positionen zweier beliebiger Figuren — eigene, gegnerische oder eine von jedem." },
    { name: "Elementar beschwören",desc: "Beschwört ein zufälliges Elementar (Feuer, Erde, Wasser, Luft), das einen Kampf für dich führt und dann verschwindet." },
    { name: "Wiederbeleben",       desc: "Erweckt eine zerstörte Figur mit vollen LP wieder zum Leben, platziert neben deinem Zauberwirker." },
    { name: "Einsperren",          desc: "Friert eine gegnerische Figur an ihrem Platz ein. Sie kann sich nicht bewegen, bis der Luminanz-Zyklus den Extrempunkt der eingesperrten Seite erreicht." },
  ],

  movement: [
    { label: "Boden",    desc: "Nur orthogonal (keine Diagonale). Wird durch jede Figur im Weg blockiert." },
    { label: "Flug",     desc: "Alle Richtungen einschließlich Diagonale. Kann über besetzte Felder fliegen." },
    { label: "Teleport", desc: "Nur Zauberer/Zauberin — bewegt sich sofort auf ein beliebiges Feld." },
  ],
};

export const TRANSLATIONS: Record<Lang, Translation> = { en, es, he, fr, de };
