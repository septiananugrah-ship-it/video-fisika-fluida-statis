import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, win} from '../anim';
import {Bubbles, DepthRuler, PressureArrow, Water} from '../components/fluid';
import {Arrow, Formula, Glow, Label, Motes, Note, Ripple, Stage, Stream, Sub, TSub, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Hidrostatika: kolom air setinggi h di kolam diangkat menjadi diagram gaya bebas
// (p₀A ke bawah, mg ke bawah, pA ke atas) → p = p₀ + ρgh. Titik yang turun di kolam
// (makin banyak air di atasnya), bendungan menebal ke bawah, contoh akuarium
// (0,60 m → 6000 Pa; 0,20 m² → 1200 N ≈ 120 kg) dengan pengukur tekanan,
// lalu "paradoks hidrostatik": bejana berhubungan berbeda bentuk, permukaan & tekanan dasar sama.

const POOL = {x0: 100, x1: 640, surf: 300, bot: 850};
const COL = {x: 300, w: 140, h: 380};
const FBD_X = 760;

/** Pengukur tekanan analog: jarum dari 0 sampai max. */
const Gauge: React.FC<{x: number; y: number; r: number; frac: number; t: number; label?: string; color?: string}> = ({x, y, r, frac, t, label, color = C.press}) => {
  const a0 = -210;
  const a1 = 30;
  const ang = ((mix(a0, a1, Math.max(0, Math.min(1, frac))) + 0.6 * Math.sin(t * 9)) * Math.PI) / 180;
  return (
    <g>
      <circle cx={x} cy={y} r={r + 6} fill="#26315a" stroke="#7d8fbf" strokeWidth={2.5} />
      <circle cx={x} cy={y} r={r} fill="#0a1230" />
      {Array.from({length: 9}, (_, k) => {
        const a = ((a0 + ((a1 - a0) * k) / 8) * Math.PI) / 180;
        return <line key={k} x1={x + Math.cos(a) * r * 0.78} y1={y + Math.sin(a) * r * 0.78} x2={x + Math.cos(a) * r * 0.94} y2={y + Math.sin(a) * r * 0.94} stroke={C.muted} strokeWidth={2} />;
      })}
      <path d={`M${x + Math.cos((a0 * Math.PI) / 180) * r * 0.62},${y + Math.sin((a0 * Math.PI) / 180) * r * 0.62} A${r * 0.62},${r * 0.62} 0 ${frac > 0.75 ? 1 : 0} 1 ${x + Math.cos(ang) * r * 0.62},${y + Math.sin(ang) * r * 0.62}`} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={5} />
      <line x1={x} y1={y} x2={x + Math.cos(ang) * r * 0.82} y2={y + Math.sin(ang) * r * 0.82} stroke={color} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={x} cy={y} r={r * 0.12} fill={color} />
      {label ? (
        <text x={x} y={y + r * 0.5} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={r * 0.3} fill={C.ink}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

/** Ikan kecil yang berenang bolak-balik (berbalik halus). */
const Fish: React.FC<{x0: number; x1: number; y: number; t: number; speed: number; color: string; ph?: number}> = ({x0, x1, y, t, speed, color, ph = 0}) => {
  const s = Math.sin(t * speed + ph);
  const x = mix(x0, x1, 0.5 + 0.5 * s);
  const face = Math.tanh(4 * Math.cos(t * speed + ph));
  const tail = 8 * Math.sin(t * 9 + ph);
  return (
    <g transform={`translate(${x} ${y + 6 * Math.sin(t * 1.3 + ph)}) scale(${face.toFixed(3)} 1)`}>
      <path d={`M-22,0 L-38,${-12 + tail * 0.4} L-36,0 L-38,${12 + tail * 0.4} Z`} fill={color} opacity={0.9} />
      <ellipse cx={0} cy={0} rx={26} ry={13} fill={color} />
      <ellipse cx={4} cy={-4} rx={14} ry={4} fill="#fff" opacity={0.25} />
      <circle cx={14} cy={-3} r={3} fill="#0a1230" />
    </g>
  );
};

// ---- bejana berhubungan ----
const VBOT = 760;
const VTOP = 360;
const LEVEL = 470;
const VESSELS: {poly: [number, number][]; name?: string; lx: number; amp: number}[] = [
  {poly: [[270, VBOT], [270, VTOP], [330, VTOP], [330, VBOT]], name: 'gelas ramping', lx: 300, amp: 18},
  {poly: [[450, VBOT], [440, 420], [800, 420], [790, VBOT]], name: 'baskom lebar', lx: 620, amp: -6},
  {poly: [[960, VBOT], [880, VTOP], [1100, VTOP], [1020, VBOT]], lx: 990, amp: 10},
  {poly: [[1230, VBOT], [1380, VTOP], [1440, VTOP], [1290, VBOT]], lx: 1335, amp: -14},
  {poly: [[1540, VBOT], [1540, 600], [1610, 540], [1610, VTOP], [1650, VTOP], [1650, 540], [1720, 600], [1720, VBOT]], lx: 1630, amp: 12},
];

export const Hydro: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const act1 = 1 - ramp(t, cue(4) - 0.5, cue(4) + 0.1, EASE_IN_OUT); // kolom + turunan
  const poolOp = 1 - ramp(t, cue(5) - 0.5, cue(5) + 0.1, EASE_IN_OUT);
  const act2 = win(t, cue(4) - 0.3, cue(5) - 0.5, 0.7, 0.6);
  const act3 = win(t, cue(5) - 0.3, cue(7) - 0.5, 0.7, 0.6);
  const act4 = ramp(t, cue(7) - 0.3, cue(7) + 0.5);

  // ---- kolom & diagram gaya bebas ----
  const colIn = ramp(t, cue(0) + 0.6, cue(0) + 1.6);
  const lift = ramp(t, cue(1) - 0.2, cue(1) + 1.2, EASE_IN_OUT);
  const fx = mix(COL.x, FBD_X, lift);
  const colBot = POOL.surf + COL.h;
  const aTop = ramp(t, wordOf(1, 'atas') - 0.3, wordOf(1, 'atas') + 0.5);
  const aW = ramp(t, wordOf(1, 'berat') - 0.3, wordOf(1, 'berat') + 0.5);
  const aBot = ramp(t, wordOf(1, 'bawah') - 0.3, wordOf(1, 'bawah') + 0.5);
  const fbdOp = lift * act1;
  const rows = [ramp(t, wordOf(1, 'seimbang') - 0.1, wordOf(1, 'seimbang') + 0.7), ramp(t, wordOf(2, 'rho') - 0.2, wordOf(2, 'rho') + 0.6), ramp(t, wordOf(2, 'bagi') - 0.2, wordOf(2, 'bagi') + 0.6)];
  const rowsCard = rows[0] * (1 - ramp(t, cue(3) - 0.4, cue(3) + 0.1, EASE_IN_OUT));
  const mainP = ramp(t, cue(3) - 0.1, cue(3) + 0.8) * act1;

  // ---- titik turun di kolam ----
  const probe = 0.5 - 0.5 * Math.cos((t - cue(4)) * 0.75);
  const PY = POOL.surf + 40 + probe * 470;
  const PX = 370;
  const LP = (y: number) => 10 + 0.17 * (y - POOL.surf);

  // ---- akuarium ----
  const AQ = {x0: 260, x1: 860, bot: 820, h: 470, dx: 80, dy: -50};
  const SC = 700; // px per meter
  const aqSurf = AQ.bot - 0.6 * SC;
  const pRead = ramp(t, wordOf(5, 'enam', 1) - 0.6, wordOf(5, 'enam', 1) + 0.6, EASE_IN_OUT);
  const card1 = win(t, cue(5) + 0.4, cue(6) - 0.3, 0.7, 0.5);
  const card2 = ramp(t, cue(6) - 0.1, cue(6) + 0.7);
  const r1 = [ramp(t, cue(5) + 0.4, cue(5) + 1.1), ramp(t, wordOf(5, 'sentimeter') - 0.2, wordOf(5, 'sentimeter') + 0.5), ramp(t, wordOf(5, 'enam', 1) - 0.3, wordOf(5, 'enam', 1) + 0.5)];
  const r2 = [ramp(t, cue(6) + 0.2, cue(6) + 0.9), ramp(t, wordOf(6, 'nol') - 0.2, wordOf(6, 'nol') + 0.5), ramp(t, wordOf(6, 'seribu') - 0.3, wordOf(6, 'seribu') + 0.5)];
  const kgP = ramp(t, wordOf(6, 'setara') - 0.3, wordOf(6, 'setara') + 0.6);
  const botArrows = ramp(t, cue(6) + 0.6, cue(6) + 2.2);

  // ---- bejana berhubungan ----
  const fillP = ramp(t, cue(7) + 0.2, cue(7) + 3.4, EASE_IN_OUT);
  const tau = t - (cue(7) + 3.4);
  const lvl = (k: number) => {
    const base = mix(VBOT, LEVEL, fillP);
    const slosh = VESSELS[k].amp * (tau < 0 ? Math.sin(Math.PI * fillP) : Math.exp(-tau / 1.4) * Math.cos(2.4 * tau));
    return base + slosh * fillP;
  };
  const eqLine = ramp(t, wordOf(7, 'kedalaman') - 0.3, wordOf(7, 'kedalaman') + 0.5);
  const hOnly = ramp(t, cue(8) - 0.1, cue(8) + 0.7);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= Kolam ================= */}
        {poolOp > 0.001 ? (
          <g opacity={poolOp}>
            <rect x={POOL.x0 - 14} y={POOL.surf - 40} width={POOL.x1 - POOL.x0 + 28} height={POOL.bot - POOL.surf + 54} rx={10} fill="#16224a" stroke="#5f72a6" strokeWidth={3} />
            {/* ubin dinding kolam */}
            {Array.from({length: 11}, (_, k) => (
              <line key={k} x1={POOL.x0} y1={POOL.surf + k * 50} x2={POOL.x1} y2={POOL.surf + k * 50} stroke="#2a3a6e" strokeWidth={1.5} />
            ))}
            {Array.from({length: 11}, (_, k) => (
              <line key={`v${k}`} x1={POOL.x0 + k * 54} y1={POOL.surf} x2={POOL.x0 + k * 54} y2={POOL.bot} stroke="#2a3a6e" strokeWidth={1.5} />
            ))}
            <Water x={POOL.x0} y={POOL.surf} w={POOL.x1 - POOL.x0} h={POOL.bot - POOL.surf} bubbles={6} seed={2} />
            <Label x={POOL.x0 + 10} y={POOL.surf - 22} size={22} color={C.muted} anchor="start" font="mono" opacity={1 - act2}>
              permukaan: p₀
            </Label>
            {/* kolom air yang dipilih */}
            <g opacity={colIn * act1}>
              <rect x={COL.x} y={POOL.surf} width={COL.w} height={COL.h} fill="#bfe6ff" opacity={0.14} />
              <rect x={COL.x} y={POOL.surf} width={COL.w} height={COL.h} fill="none" stroke={C.gold} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-t * 20} />
              <Arrow x1={COL.x + COL.w + 30} y1={POOL.surf + 6} x2={COL.x + COL.w + 30} y2={colBot - 6} color="gold" width={3} both pulse={false} />
              <Label x={COL.x + COL.w + 54} y={POOL.surf + COL.h / 2} size={40} font="serif" italic color={C.gold} anchor="start">
                h
              </Label>
              <Label x={COL.x + COL.w / 2} y={colBot + 30} size={26} font="serif" italic color={C.ink}>
                luas A
              </Label>
            </g>
            {/* babak 2: titik turun → panah tekanan makin panjang */}
            <g opacity={act2}>
              <rect x={PX - 34} y={POOL.surf} width={68} height={PY - POOL.surf} fill="#bfe6ff" opacity={0.16} />
              <rect x={PX - 34} y={POOL.surf} width={68} height={PY - POOL.surf} fill="none" stroke={C.gold} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="6 6" />
              <Label x={PX} y={POOL.surf - 20} size={22} color={C.gold}>
                air di atas
              </Label>
              {[
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ].map(([nx, ny], k) => (
                <PressureArrow key={k} x={PX + nx * 12} y={PY + ny * 12} nx={nx} ny={ny} L={LP(PY)} width={4} />
              ))}
              <circle cx={PX} cy={PY} r={9} fill={C.ink} />
              <Glow x={PX} y={PY} r={60 + 0.08 * (PY - POOL.surf)} color="press" opacity={0.6} />
              <Gauge x={540} y={760} r={56} frac={(PY - POOL.surf) / 560} t={t} />
              <line x1={PX + 12} y1={PY} x2={540 - 60} y2={760} stroke={C.press} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="4 6" />
              <DepthRuler x={POOL.x0 + 22} yTop={POOL.surf} yBot={POOL.bot - 20} ticks={10} color={C.ink} opacity={0.6} />
            </g>
          </g>
        ) : null}

        {/* ================= Diagram gaya bebas ================= */}
        {fbdOp > 0.001 ? (
          <g opacity={fbdOp}>
            <line x1={COL.x + COL.w} y1={POOL.surf + 20} x2={fx} y2={POOL.surf + 20} stroke={C.gold} strokeOpacity={0.3 * (1 - ramp(lift, 0.8, 1))} strokeWidth={2} />
            <rect x={fx} y={POOL.surf} width={COL.w} height={COL.h} rx={4} fill="url(#water)" opacity={0.85} />
            <rect x={fx} y={POOL.surf} width={COL.w} height={COL.h} rx={4} fill="none" stroke="#cfe6ff" strokeWidth={2.5} />
            <Bubbles x={fx + 10} y={POOL.surf + 10} w={COL.w - 20} h={COL.h - 20} n={4} seed={6} />
            {/* p₀A ke bawah di atas kolom */}
            <g opacity={aTop}>
              {[-40, 0, 40].map((o) => (
                <PressureArrow key={o} x={fx + COL.w / 2 + o} y={POOL.surf - 2} nx={0} ny={-1} L={78} width={4} />
              ))}
              <Label x={fx - 20} y={POOL.surf - 44} size={36} font="serif" italic color={C.press} anchor="end">
                p<TSub>0</TSub>A
              </Label>
            </g>
            {/* berat mg dari pusat massa */}
            <g opacity={aW}>
              <circle cx={fx + COL.w / 2} cy={POOL.surf + COL.h / 2} r={7} fill={C.force} />
              <Arrow x1={fx + COL.w / 2} y1={POOL.surf + COL.h / 2} x2={fx + COL.w / 2} y2={POOL.surf + COL.h / 2 + 120} color="force" width={6} />
              <Label x={fx + COL.w + 26} y={POOL.surf + COL.h / 2 + 70} size={36} font="serif" italic color={C.force} anchor="start">
                mg
              </Label>
            </g>
            {/* pA ke atas di dasar kolom (lebih panjang: menahan keduanya) */}
            <g opacity={aBot}>
              {[-40, 0, 40].map((o) => (
                <PressureArrow key={o} x={fx + COL.w / 2 + o} y={colBot + 2} nx={0} ny={1} L={160} width={4} />
              ))}
              <Label x={fx - 20} y={colBot + 110} size={36} font="serif" italic color={C.press} anchor="end">
                pA
              </Label>
            </g>
            <Ripple x={fx + COL.w / 2} y={POOL.surf + COL.h / 2} p={(t - wordOf(1, 'seimbang')) / 1.4} r={200} color="gold" />
          </g>
        ) : null}

        {/* ================= Bendungan ================= */}
        {act2 > 0.001 ? (
          <g opacity={act2}>
            <Water x={1010} y={330} w={400} h={512} bubbles={4} seed={9} />
            <path d="M1410,300 L1460,300 L1680,842 L1410,842 Z" fill="#4a5677" stroke="#a9b6d6" strokeWidth={3} strokeLinejoin="round" />
            {Array.from({length: 13}, (_, k) => {
              const y = 330 + k * 38;
              return <line key={k} x1={1418} y1={y} x2={1460 + ((y - 300) / 542) * 220 - 8} y2={y} stroke="#000" strokeOpacity={0.14} strokeWidth={2} />;
            })}
            <Water x={1670} y={790} w={150} h={52} amp={2} seed={4} caustics={false} />
            <line x1={1000} y1={844} x2={1830} y2={844} stroke={C.muted} strokeWidth={3} />
            {[400, 480, 560, 640, 720, 800].map((y, k) => {
              const p = ramp(t, cue(4) + 3.0 + k * 0.25, cue(4) + 3.6 + k * 0.25);
              return <PressureArrow key={y} x={1406} y={y} nx={-1} ny={0} L={(12 + 0.5 * (y - 330)) * p} width={4.5} opacity={Math.min(1, p * 2)} />;
            })}
            <g opacity={ramp(t, wordOf(4, 'tebal') - 0.4, wordOf(4, 'tebal') + 0.4)}>
              <line x1={1410} y1={866} x2={1680} y2={866} stroke={C.gold} strokeWidth={3} />
              <circle cx={1410} cy={866} r={4} fill={C.gold} />
              <circle cx={1680} cy={866} r={4} fill={C.gold} />
              <Label x={1520} y={780} size={30} color={C.gold} weight={600}>
                tebal
              </Label>
              <Label x={1480} y={276} size={26} color={C.gold} anchor="start">
                tipis
              </Label>
            </g>
            <Glow x={1350} y={790} r={170} color="press" opacity={0.4 * ramp(t, cue(4) + 4, cue(4) + 5)} />
          </g>
        ) : null}

        {/* ================= Akuarium ================= */}
        {act3 > 0.001 ? (
          <g opacity={act3}>
            <ellipse cx={(AQ.x0 + AQ.x1) / 2 + 40} cy={AQ.bot + 18} rx={360} ry={16} fill="#000" opacity={0.3} />
            {/* sisi belakang & samping (perspektif) */}
            <path d={`M${AQ.x0 + AQ.dx},${AQ.bot + AQ.dy - AQ.h} L${AQ.x1 + AQ.dx},${AQ.bot + AQ.dy - AQ.h} L${AQ.x1 + AQ.dx},${AQ.bot + AQ.dy} L${AQ.x0 + AQ.dx},${AQ.bot + AQ.dy}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.3} strokeWidth={3} />
            <path d={`M${AQ.x1},${aqSurf} L${AQ.x1 + AQ.dx},${aqSurf + AQ.dy} L${AQ.x1 + AQ.dx},${AQ.bot + AQ.dy} L${AQ.x1},${AQ.bot} Z`} fill={C.deep} opacity={0.75} />
            <path d={`M${AQ.x0},${aqSurf} L${AQ.x0 + AQ.dx},${aqSurf + AQ.dy} L${AQ.x1 + AQ.dx},${aqSurf + AQ.dy} L${AQ.x1},${aqSurf} Z`} fill="#8fd0ff" opacity={0.3} />
            {/* dasar (luas A) disorot */}
            <path d={`M${AQ.x0},${AQ.bot} L${AQ.x0 + AQ.dx},${AQ.bot + AQ.dy} L${AQ.x1 + AQ.dx},${AQ.bot + AQ.dy} L${AQ.x1},${AQ.bot} Z`} fill={C.press} opacity={0.35 * botArrows * (0.75 + 0.25 * Math.sin(t * 3))} />
            <Water x={AQ.x0 + 4} y={aqSurf} w={AQ.x1 - AQ.x0 - 8} h={AQ.bot - aqSurf - 4} bubbles={0} seed={5} />
            {/* pasir, tanaman, batu udara */}
            <path d={`M${AQ.x0 + 4},${AQ.bot - 4} Q${AQ.x0 + 160},${AQ.bot - 30} ${AQ.x0 + 300},${AQ.bot - 18} T${AQ.x1 - 4},${AQ.bot - 22} L${AQ.x1 - 4},${AQ.bot - 4} Z`} fill="#c9a86a" opacity={0.7} />
            {[320, 350, 780, 805].map((x, k) => (
              <path key={x} d={`M${x},${AQ.bot - 20} q${14 * Math.sin(t * 1.2 + k)},-60 ${-4 + 8 * Math.sin(t + k)},-${120 + 30 * (k % 2)}`} fill="none" stroke={C.buoy} strokeOpacity={0.7} strokeWidth={6} strokeLinecap="round" />
            ))}
            <Bubbles x={680} y={aqSurf + 10} w={30} h={AQ.bot - aqSurf - 40} n={7} seed={3} speed={2} />
            <rect x={680} y={AQ.bot - 30} width={30} height={12} rx={5} fill="#7d8fbf" />
            <Fish x0={330} x1={760} y={520} t={t} speed={0.5} color="#ff9a4a" />
            <Fish x0={360} x1={720} y={640} t={t} speed={0.38} color="#ffd24a" ph={2} />
            {/* panah tekanan di dasar */}
            {[310, 390, 470, 550, 630, 710, 790].map((x, k) => (
              <PressureArrow key={x} x={x} y={AQ.bot - 24} nx={0} ny={-1} L={48 * ramp(botArrows, k * 0.06, k * 0.06 + 0.5)} width={4} opacity={botArrows} />
            ))}
            {/* kaca depan */}
            <rect x={AQ.x0} y={AQ.bot - AQ.h} width={AQ.x1 - AQ.x0} height={AQ.h} fill="none" stroke="#bfe3ff" strokeOpacity={0.8} strokeWidth={5} />
            <line x1={AQ.x0} y1={AQ.bot - AQ.h} x2={AQ.x0 + AQ.dx} y2={AQ.bot - AQ.h + AQ.dy} stroke="#bfe3ff" strokeOpacity={0.5} strokeWidth={3} />
            <line x1={AQ.x1} y1={AQ.bot - AQ.h} x2={AQ.x1 + AQ.dx} y2={AQ.bot - AQ.h + AQ.dy} stroke="#bfe3ff" strokeOpacity={0.5} strokeWidth={3} />
            <line x1={AQ.x1 + AQ.dx} y1={AQ.bot - AQ.h + AQ.dy} x2={AQ.x1 + AQ.dx} y2={AQ.bot + AQ.dy} stroke="#bfe3ff" strokeOpacity={0.5} strokeWidth={3} />
            <line x1={AQ.x1} y1={AQ.bot} x2={AQ.x1 + AQ.dx} y2={AQ.bot + AQ.dy} stroke="#bfe3ff" strokeOpacity={0.5} strokeWidth={3} />
            <rect x={AQ.x0 + 14} y={AQ.bot - AQ.h + 14} width={8} height={AQ.h - 28} rx={4} fill="#fff" opacity={0.15} />
            {/* kedalaman 0,60 m */}
            <Arrow x1={AQ.x0 - 44} y1={aqSurf + 4} x2={AQ.x0 - 44} y2={AQ.bot - 4} color="gold" width={3} both pulse={false} />
            <Label x={AQ.x0 - 64} y={(aqSurf + AQ.bot) / 2} size={30} color={C.gold} anchor="end" font="mono" opacity={r1[1]}>
              0,60 m
            </Label>
            {/* pengukur tekanan di dasar */}
            <path d={`M${AQ.x1 - 40},${AQ.bot - 10} L${AQ.x1 - 40},${AQ.bot + 30} L${1010},${AQ.bot + 30} L${1010},${AQ.bot - 50}`} fill="none" stroke="#7d8fbf" strokeWidth={4} strokeLinejoin="round" />
            <Gauge x={1010} y={AQ.bot - 120} r={64} frac={(6000 * pRead) / 8000} t={t} />
            <Label x={1010} y={AQ.bot - 220} size={28} color={C.press} font="mono" weight={600}>
              {`${Math.round(6000 * pRead)} Pa`}
            </Label>
            <Twinkles x={1010} y={AQ.bot - 220} rx={90} ry={20} n={4} color="press" opacity={ramp(pRead, 0.95, 1)} seed={5} />
            {/* beban setara 120 kg */}
            <g opacity={kgP}>
              <path d={`M1390,840 L1410,740 L1510,740 L1530,840 Z`} fill="#3b4a72" stroke={C.force} strokeWidth={3} strokeLinejoin="round" />
              <path d="M1430,740 q30,-60 60,0" fill="none" stroke={C.force} strokeWidth={8} />
              <text x={1460} y={796} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={30} fill={C.ink}>
                120 kg
              </text>
              <Arrow x1={1580} y1={730} x2={1580} y2={850} color="force" width={6} />
              <Label x={1610} y={790} size={30} color={C.force} anchor="start" font="mono">
                1200 N
              </Label>
            </g>
            <Ripple x={1460} y={840} p={(t - wordOf(6, 'setara') - 0.2) / 1.2} r={160} color="force" />
          </g>
        ) : null}

        {/* ================= Bejana berhubungan (paradoks hidrostatik) ================= */}
        {act4 > 0.001 ? (
          <g opacity={act4}>
            <defs>
              {VESSELS.map((v, k) => (
                <clipPath key={k} id={`hy-v${k}`}>
                  <path d={v.poly.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ') + ' Z'} />
                </clipPath>
              ))}
            </defs>
            {/* pipa penghubung */}
            <rect x={280} y={VBOT - 4} width={1420} height={26} rx={8} fill="#16224a" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={3} />
            <rect x={284} y={VBOT} width={1412} height={18} rx={6} fill={C.water} opacity={0.55 * Math.min(1, fillP * 8)} />
            <Stream
              pts={[
                [300, VBOT + 9],
                [1700, VBOT + 9],
              ]}
              color="water"
              n={10}
              speed={0.25}
              r={3}
              jitter={1}
              opacity={win(t, cue(7) + 0.3, cue(7) + 4.4, 0.4, 0.6)}
            />
            {VESSELS.map((v, k) => {
              const L = lvl(k);
              const xs = v.poly.map((p) => p[0]);
              const x0 = Math.min(...xs) - 4;
              const x1 = Math.max(...xs) + 4;
              const d = v.poly.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');
              return (
                <g key={k}>
                  <g clipPath={`url(#hy-v${k})`}>{VBOT - L > 1 ? <Water x={x0} y={L} w={x1 - x0} h={VBOT - L + 4} amp={2} seed={k} caustics={k === 1} /> : null}</g>
                  <path d={d} fill="none" stroke="#cfe6ff" strokeOpacity={0.85} strokeWidth={5} strokeLinejoin="round" />
                  {/* tekanan di dasar: sama untuk semua */}
                  <PressureArrow x={k === 3 ? 1260 : k === 1 ? 620 : v.lx} y={VBOT - 4} nx={0} ny={-1} L={Math.max(0, (VBOT - L) * 0.22)} width={4} opacity={ramp(fillP, 0.3, 0.7)} />
                  {v.name ? (
                    <Label x={v.lx} y={k === 1 ? 392 : VTOP - 30} size={26} color={C.muted}>
                      {v.name}
                    </Label>
                  ) : null}
                </g>
              );
            })}
            {/* pengukur tekanan di bawah setiap bejana */}
            {[300, 620, 990, 1260, 1630].map((x, k) => (
              <g key={x} opacity={ramp(t, cue(7) + 0.6 + k * 0.1, cue(7) + 1.2 + k * 0.1)}>
                <line x1={x} y1={VBOT + 22} x2={x} y2={VBOT + 40} stroke="#7d8fbf" strokeWidth={3} />
                <Gauge x={x} y={VBOT + 76} r={34} frac={(VBOT - lvl(k)) / 330} t={t + k} />
              </g>
            ))}
            {/* tuangan ke baskom */}
            <Stream
              pts={[
                [700, 200],
                [700, lvl(1)],
              ]}
              color="water"
              n={8}
              speed={1.4}
              r={5}
              jitter={1.5}
              opacity={win(t, cue(7) + 0.1, cue(7) + 3.2, 0.3, 0.5)}
            />
            {/* garis permukaan yang sama + h vertikal */}
            <g opacity={eqLine}>
              <line x1={220} y1={LEVEL} x2={1790} y2={LEVEL} stroke={C.gold} strokeWidth={2.5} strokeDasharray="10 8" strokeDashoffset={-t * 20} />
              <Arrow x1={1790} y1={LEVEL + 6} x2={1790} y2={VBOT - 6} color="gold" width={3} both pulse={false} />
              <Label x={1812} y={(LEVEL + VBOT) / 2} size={40} font="serif" italic color={C.gold} anchor="start">
                h
              </Label>
            </g>
            {/* tabung miring: yang dihitung jarak vertikal, bukan panjang tabung */}
            <g opacity={hOnly}>
              <line x1={1386} y1={LEVEL} x2={1386} y2={VBOT} stroke={C.press} strokeWidth={3} strokeDasharray="5 6" />
              <Glow x={1300} y={(LEVEL + VBOT) / 2} r={160} color="gold" opacity={0.4} />
              <Twinkles x={990} y={LEVEL} rx={760} ry={20} n={6} color="gold" seed={8} />
            </g>
            <Motes x={960} y={560} rx={820} ry={240} n={20} color="water" opacity={0.35} seed={6} />
          </g>
        ) : null}
      </Stage>

      {/* ---- kartu turunan (satu kartu, baris bertambah) ---- */}
      <Formula x={1390} y={470} p={rowsCard * act1} accent={C.press} size={56}>
        <div style={{opacity: rows[0]}}>
          <Tint c="press">
            <V>p</V>A
          </Tint>{' '}
          ={' '}
          <Tint c="press">
            <V>p</V>
            <Sub>0</Sub>A
          </Tint>{' '}
          + <Tint c="force">mg</Tint>
        </div>
        <div style={{opacity: rows[1], fontSize: '0.9em', marginTop: 6}}>
          <Tint c="force">mg</Tint> = (<V color="spr">ρ</V>
          <V>Ah</V>)<V>g</V>
        </div>
        <div style={{opacity: rows[2], fontSize: '0.9em', marginTop: 6, color: C.muted}}>
          bagi dengan <V>A</V> ↓
        </div>
      </Formula>
      <Formula x={1390} y={470} p={mainP} accent={C.press} size={78} caption="tekanan di kedalaman h">
        <V color="press">p</V> = <V color="press">p</V>
        <Sub>0</Sub> + <V color="spr">ρ</V>
        <V>gh</V>
      </Formula>

      {/* ---- akuarium: dua kartu berurutan di slot yang sama ---- */}
      <Formula x={1440} y={360} p={card1 * act3} accent={C.press} size={56}>
        <div style={{opacity: r1[0]}}>
          <V color="press">p</V> = <V color="spr">ρ</V>
          <V>gh</V>
        </div>
        <div style={{opacity: r1[1], fontSize: '0.9em'}}>= 1000 · 10 · 0,60</div>
        <div style={{opacity: r1[2], color: C.press}}>= 6000 Pa</div>
      </Formula>
      <Formula x={1440} y={360} p={card2 * act3} accent={C.force} size={56}>
        <div style={{opacity: r2[0]}}>
          <V color="force">F</V> = <V color="press">p</V>
          <V>A</V>
        </div>
        <div style={{opacity: r2[1], fontSize: '0.9em'}}>= 6000 · 0,20</div>
        <div style={{opacity: r2[2], color: C.force}}>= 1200 N</div>
      </Formula>
      <Note x={1460} y={640} p={kgP * act3} color={C.force} size={28}>
        ≈ beban 120 kg menekan dasar
      </Note>

      {/* ---- paradoks ---- */}
      <Note x={960} y={230} p={win(t, wordOf(7, 'bentuk') - 0.2, cue(8) - 0.2, 0.6, 0.5) * act4} color={C.gold}>
        bentuk wadah tidak berpengaruh
      </Note>
      <Note x={960} y={230} p={ramp(t, cue(8) - 0.1, cue(8) + 0.6) * act4} color={C.gold}>
        yang menentukan: <V color="gold">h</V> (vertikal) dan <V color="spr">ρ</V> cairan
      </Note>
    </AbsoluteFill>
  );
};
