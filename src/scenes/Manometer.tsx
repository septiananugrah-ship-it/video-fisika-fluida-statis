import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {PressureArrow, wavePath} from '../components/fluid';
import {fmt} from '../components/physics';
import {Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pipa U: lengan kiri x=480, kanan x=800, atas y=220, lengkung pusat (640, 650) r=160, lebar dalam 60 px.
// Cairan digambar sebagai goresan tebal di sepanjang garis tengah (strokeDasharray = rentang cairan),
// jadi permukaan selalu datar dan isi mengikuti lengkung. Panjang garis tengah = 2·430 + π·160.
// Fase 2: 8 px/cm → Δh 25 cm = 200 px (ρ = 800 → 2000 Pa). Fase 3: 14 px/cm → minyak 20 cm, air 16 cm.

type P = [number, number];
const XL = 480;
const XR = 800;
const TOP = 220;
const BY = 650;
const R = 160;
const ARM = BY - TOP;
const ARC = Math.PI * R;
const TOT = 2 * ARM + ARC;
const CL = `M${XL},${TOP} L${XL},${BY} A${R},${R} 0 0 0 ${XR},${BY} L${XR},${TOP}`;
const LW = 60;
const JUGY = 158; // kendi tuang (di kanan atas lengan kiri, di bawah zona judul)

// bejana berhubungan (kanan, baris 0–1): saluran dasar + tabung tegak, corong, tabung miring, bola
const VES = [
  'M1130,760 L1710,760 L1710,800 L1130,800 Z',
  'M1150,420 L1200,420 L1200,770 L1150,770 Z',
  'M1290,770 L1330,770 L1385,430 L1235,430 Z',
  'M1440,770 L1490,770 L1585,430 L1535,430 Z',
  'M1645,770 L1675,770 L1675,430 L1645,430 Z',
];

/** Titik pada garis tengah pada jarak d (px) dari ujung kiri atas. */
const at = (d: number): P => {
  if (d <= ARM) return [XL, TOP + d];
  if (d <= ARM + ARC) {
    const s = (d - ARM) / R;
    return [640 - R * Math.cos(s), BY + R * Math.sin(s)];
  }
  return [XR, BY - (d - ARM - ARC)];
};
/** Jarak garis tengah untuk permukaan di lengan kiri / kanan pada ketinggian y. */
const dLeft = (y: number) => y - TOP;
const dRight = (y: number) => TOT - (y - TOP);

/** Segmen cairan dari jarak a ke b. */
const Seg: React.FC<{a: number; b: number; color: string; id: string; opacity?: number}> = ({a, b, color, id, opacity = 1}) =>
  b - a < 0.5 ? null : (
    <g opacity={opacity}>
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1={TOP} x2="0" y2={BY + R + 30}>
          <stop offset="0%" stopColor={color} stopOpacity={0.8} />
          <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
        </linearGradient>
      </defs>
      <path d={CL} fill="none" stroke={`url(#${id})`} strokeWidth={LW} strokeDasharray={`0 ${a.toFixed(2)} ${(b - a).toFixed(2)} 99999`} />
      <path d={CL} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={8} strokeDasharray={`0 ${a.toFixed(2)} ${(b - a).toFixed(2)} 99999`} transform="translate(-16 0)" />
    </g>
  );

/** Permukaan bergoyang di lengan x pada ketinggian y. */
const Surf: React.FC<{x: number; y: number; t: number; color?: string; seed?: number}> = ({x, y, t, color = '#cfeaff', seed = 0}) => (
  <path d={wavePath(x - LW / 2 + 1, x + LW / 2 - 1, y, t, 2.5, 0.12, seed)} fill="none" stroke={color} strokeWidth={3} strokeOpacity={0.85} />
);

/** Dinding kaca pipa U. */
const Tube: React.FC<{capLeft?: number}> = ({capLeft = 0}) => (
  <g>
    <path d={CL} fill="none" stroke="#bfe3ff" strokeOpacity={0.55} strokeWidth={LW + 14} />
    <path d={CL} fill="none" stroke="#0a1230" strokeWidth={LW} />
    <path d={CL} fill="none" stroke="#fff" strokeOpacity={0.05} strokeWidth={LW} />
    {capLeft > 0.001 ? <rect x={XL - LW / 2 - 10} y={TOP - 14} width={LW + 20} height={18} rx={6} fill="#3b466e" stroke={C.muted} strokeWidth={2} opacity={capLeft} /> : null}
  </g>
);

/** Gelembung kecil naik di lengan (x) dari yB ke permukaan yS. */
const ArmBubbles: React.FC<{x: number; yS: number; yB: number; t: number; seed: number; opacity?: number}> = ({x, yS, yB, t, seed, opacity = 1}) => (
  <g opacity={opacity}>
    {[0, 1, 2].map((k) => {
      const ph = (((t * (0.18 + 0.05 * k) + k * 0.33 + seed) % 1) + 1) % 1;
      if (yB - yS < 20) return null;
      return <circle key={k} cx={x - 14 + 28 * ((k * 0.618 + seed) % 1) + 4 * Math.sin(t * 2 + k)} cy={yB - ph * (yB - yS - 8)} r={2.5 + (k % 2)} fill="#fff" opacity={0.4 * cyc(ph)} />;
    })}
  </g>
);

/** Gelombang segitiga 0..1..0 (pantulan dinding tanpa loncatan). */
const tri = (x: number) => {
  const f = ((x % 2) + 2) % 2;
  return f < 1 ? f : 2 - f;
};

export const Manometer: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  const ph1 = 1 - ramp(t, cue(6) - 0.5, cue(6) + 0.3, EASE_IN_OUT);
  const ph3 = ramp(t, cue(6) + 0.1, cue(6) + 0.9);

  // ---------- baris 0: mengisi pipa, bergoyang lalu tenang ----------
  const tubeIn = ramp(t, -0.5, 0.8);
  const pourA = cue(0) + 0.3;
  const pourB = wordOf(0, 'setinggi') - 0.6;
  const fill = ramp(t, pourA, pourB, (x) => x);
  const pouring = win(t, pourA - 0.2, pourB - 0.1, 0.3, 0.4);
  const Lfull = TOT - 2 * (470 - TOP);
  const Lq = Lfull * fill;
  const slA = 70 * ramp(t, pourA, pourA + 0.8) * Math.exp(-Math.max(0, t - pourB) / 1.1);
  const slosh = slA * Math.cos((2 * Math.PI * (t - pourB)) / 1.5) + 2 * Math.sin(t * 1.7);

  // ---------- baris 3–5: gas mendorong ----------
  const gasIn = ramp(t, cue(3) - 0.3, cue(3) + 0.5);
  const tPush = wordOf(3, 'mendorong');
  const push = ramp(t, tPush - 0.6, tPush + 1.4, EASE_IN_OUT);
  const pushOver = push * (1 + 0.12 * Math.exp(-Math.max(0, t - tPush - 1.4) / 0.6) * Math.sin(Math.max(0, t - tPush - 1.4) * 6));
  const gasBreath = 2 * Math.sin(t * 1.4) * push;
  const shift = 100 * pushOver + gasBreath; // px pergeseran tiap lengan (Δh = 2·shift)
  const oilTint = ramp(t, wordOf(4, 'delapan') - 0.4, wordOf(4, 'delapan') + 0.6);
  const liq1 = interpolateColors(oilTint, [0, 1], [C.water, '#e9a93c']);

  const dA = (TOT - Lq) / 2 + slosh * (1 - gasIn) + shift;
  const dB = dA + Lq;
  const yLs = at(dA)[1];
  const yRs = at(dB)[1];

  const vesV = win(t, wordOf(0, 'setinggi') - 1.0, cue(2) - 0.5, 0.9, 0.6);
  const vesY = 520 + 2 * Math.sin(t * 1.3);

  // baris 1: titik setinggi bertekanan sama
  const eq = win(t, cue(1) + 0.2, cue(2) + 0.2, 0.6, 0.6);
  const eqNote = win(t, wordOf(1, 'tekanan') - 0.4, cue(2) - 0.2, 0.6, 0.5);

  // baris 2: titik menelusuri jalur
  const trA = wordOf(2, 'telusuri') - 0.2;
  const trB = cueEnd(2) + 0.4;
  const tr = ramp(t, trA, trB, EASE_IN_OUT);
  const trVis = win(t, trA - 0.3, cue(3) - 0.2, 0.4, 0.5);
  const dDot = mix(dA + 8, dB - 8, tr);
  const dotP = at(dDot);
  const dP = ((dotP[1] - 470) / 800) * 1000 * 10; // Pa, 8 px/cm
  const goingDown = Math.max(0, Math.min(1, (at(dDot + 6)[1] - dotP[1]) / 4));
  const goingUp = Math.max(0, Math.min(1, (dotP[1] - at(dDot + 6)[1]) / 4));
  const fRule = win(t, wordOf(2, 'tambahkan') - 0.4, cue(3) - 0.1, 0.6, 0.5);
  const trail: P[] = [1, 2, 3, 4, 5].map((k) => at(Math.max(dA, dDot - k * 9)));

  // baris 4–5
  const fPush = win(t, tPush - 0.4, wordOf(4, 'tekanan') - 0.5, 0.6, 0.5);
  const eqGas = ramp(t, wordOf(4, 'beda') - 0.4, wordOf(4, 'beda') + 0.4);
  const fGas = ramp(t, wordOf(4, 'tekanan') - 0.3, wordOf(4, 'tekanan') + 0.5);
  const fGasNum = ramp(t, wordOf(4, 'ribu') - 0.3, wordOf(4, 'ribu') + 0.4);
  const ruler = ramp(t, wordOf(5, 'penggaris') - 0.6, wordOf(5, 'penggaris') + 0.3);
  const nManometer = ramp(t, wordOf(5, 'manometer') - 0.3, wordOf(5, 'manometer') + 0.5);

  // ---------- fase 3: minyak vs air ----------
  const S3 = 14;
  const oilA = cue(6) + 0.9;
  const oilB = wordOf(6, 'diimbangi') - 0.2;
  const hoCm = 20 * ramp(t, oilA, oilB, EASE_IN_OUT);
  const x3 = 0.4 * hoCm * S3; // geser air tiap lengan (px)
  const settle3 = 6 * Math.exp(-Math.max(0, t - oilB) / 0.9) * Math.sin(Math.max(0, t - oilB) * 5) * ramp(t, oilA, oilA + 1);
  const y0w = 518;
  const yIf = y0w + x3 + settle3; // batas minyak–air (lengan kiri)
  const yRw = y0w - x3 - settle3; // permukaan air kanan
  const yOil = yIf - hoCm * S3;
  const oilPour = win(t, oilA - 0.3, oilB, 0.3, 0.4);
  const br20 = ramp(t, wordOf(6, 'dua') - 0.3, wordOf(6, 'dua') + 0.5);
  const br16 = ramp(t, wordOf(6, 'enam') - 0.3, wordOf(6, 'enam') + 0.5);
  const eq3 = ramp(t, wordOf(6, 'diimbangi') - 0.3, wordOf(6, 'diimbangi') + 0.5);
  const tr3A = wordOf(6, 'diimbangi') + 0.2;
  const tr3B = cue(7) + 1.4;
  const tr3 = ramp(t, tr3A, tr3B, EASE_IN_OUT);
  const tr3Vis = win(t, tr3A - 0.3, cue(7) + 2.6, 0.4, 0.6);
  // jalur titik: puncak minyak → batas (kiri), menyeberang garis putus-putus, naik ke permukaan air kanan
  const seg1 = yIf - yOil;
  const seg3 = yIf - yRw;
  const tot3 = seg1 + (XR - XL) + seg3;
  const pos3 = tr3 * tot3;
  const dot3: P = pos3 < seg1 ? [XL, yOil + 6 + pos3 * ((seg1 - 6) / seg1)] : pos3 < seg1 + (XR - XL) ? [XL + (pos3 - seg1), yIf] : [XR, yIf - (pos3 - seg1 - (XR - XL)) * ((seg3 - 6) / seg3)];
  const oilBar = Math.min(1, pos3 / seg1);
  const waterBar = Math.max(0, Math.min(1, (pos3 - seg1 - (XR - XL)) / seg3));
  const f7 = ramp(t, cue(7) + 0.2, cue(7) + 0.9);
  const f7num = ramp(t, wordOf(7, 'delapan') - 0.3, wordOf(7, 'delapan') + 0.4);
  const bars = ramp(t, tr3A - 0.2, tr3A + 0.5);

  return (
    <AbsoluteFill>
      <Stage>
        {/* =================== FASE 1–2: pipa U, gas =================== */}
        {ph1 > 0.001 ? (
          <g opacity={ph1 * tubeIn}>
            <ellipse cx={640} cy={862} rx={260} ry={14} fill="#000" opacity={0.35} />
            {/* penyangga */}
            <rect x={600} y={830} width={80} height={28} rx={6} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
            <Tube capLeft={gasIn} />
            <Seg a={dA} b={dB} color={liq1} id="mano-l1" />
            <Surf x={XL} y={yLs} t={t} />
            <Surf x={XR} y={yRs} t={t} seed={2} />
            <ArmBubbles x={XL} yS={yLs} yB={BY + 60} t={t} seed={0.1} opacity={fill} />
            <ArmBubbles x={XR} yS={yRs} yB={BY + 60} t={t} seed={0.6} opacity={fill} />
            {/* tuang air */}
            <g opacity={pouring * (1 - gasIn)}>
              <path d={`M${XL + 50},${JUGY + 50} L${XL + 120},${JUGY + 50} L${XL + 130},${JUGY} L${XL + 40},${JUGY} Z`} fill="#16224a" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={3} transform={`rotate(${-24 - 4 * Math.sin(t * 3)} ${XL + 85} ${JUGY + 25})`} />
              <path d={`M${XL + 44},${JUGY + 14} Q${XL + 14},${JUGY + 6} ${XL + 2},${JUGY + 26}`} fill="none" stroke="#bfe3ff" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
              <rect x={XL - 6} y={JUGY + 26} width={12} height={Math.max(0, yLs - JUGY - 26)} rx={6} fill={C.water} opacity={0.7} />
              <Stream pts={[[XL, 194], [XL, Math.max(200, yLs - 4)]]} color="water" n={6} speed={1.4} r={4} jitter={2} />
            </g>
            <Label x={(XL + XR) / 2} y={500} size={30} color={C.cyan} weight={600} opacity={ramp(t, wordOf(0, 'setinggi') - 0.2, wordOf(0, 'setinggi') + 0.6) * (1 - ramp(t, cue(1), cue(1) + 0.6))}>
              sama tinggi
            </Label>
            <line x1={XL - 60} y1={470} x2={XR + 60} y2={470} stroke={C.cyan} strokeWidth={2} strokeDasharray="8 8" strokeDashoffset={-t * 12} opacity={ramp(t, wordOf(0, 'setinggi') - 0.2, wordOf(0, 'setinggi') + 0.6) * (1 - ramp(t, cue(1) + 0.4, cue(1) + 1))} />

            {/* bejana berhubungan: bentuk apa pun, permukaan tetap setinggi */}
            {vesV > 0.001 ? (
              <g opacity={vesV}>
                <defs>
                  <clipPath id="mano-ves">
                    {VES.map((d, i) => (
                      <path key={i} d={d} />
                    ))}
                    <circle cx={1660} cy={570} r={70} />
                  </clipPath>
                  <linearGradient id="mano-vesg" gradientUnits="userSpaceOnUse" x1="0" y1="500" x2="0" y2="800">
                    <stop offset="0%" stopColor={C.water} stopOpacity={0.8} />
                    <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
                  </linearGradient>
                </defs>
                <ellipse cx={1420} cy={826} rx={320} ry={12} fill="#000" opacity={0.3} />
                <g stroke="#bfe3ff" strokeOpacity={0.55} strokeWidth={14} strokeLinejoin="round" fill="none">
                  {VES.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                  <circle cx={1660} cy={570} r={70} />
                </g>
                <g fill="#0a1230">
                  {VES.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                  <circle cx={1660} cy={570} r={70} />
                </g>
                <g clipPath="url(#mano-ves)">
                  <path d={`${wavePath(1120, 1720, vesY, t, 3, 0.05, 1)} L1720,810 L1120,810 Z`} fill="url(#mano-vesg)" />
                  <path d={wavePath(1120, 1720, vesY, t, 3, 0.05, 1)} fill="none" stroke="#cfeaff" strokeWidth={3} strokeOpacity={0.8} />
                  <Stream pts={[[1175, 780], [1660, 780]]} color="water" n={6} speed={0.15} r={3} jitter={3} opacity={0.6} />
                </g>
                <line x1={1110} y1={vesY} x2={1740} y2={vesY} stroke={C.cyan} strokeWidth={2} strokeDasharray="8 8" strokeDashoffset={-t * 12} opacity={0.8} />
                <Label x={1420} y={372} size={26} color={C.cyan} weight={600}>
                  bejana berhubungan
                </Label>
              </g>
            ) : null}

            {/* baris 1: titik setinggi */}
            <g opacity={eq}>
              {[
                {y: 560, a: 'A', b: 'B', L: 22},
                {y: 640, a: 'C', b: 'D', L: 34},
              ].map((r, k) => (
                <g key={k}>
                  <line x1={XL - 90} y1={r.y} x2={XR + 90} y2={r.y} stroke={C.press} strokeWidth={2.5} strokeDasharray="10 8" strokeDashoffset={-t * 14} opacity={ramp(t, cue(1) + 0.3 + k * 0.7, cue(1) + 0.9 + k * 0.7)} />
                  {[XL, XR].map((x, j) => (
                    <g key={j} opacity={ramp(t, cue(1) + 0.5 + k * 0.7, cue(1) + 1.1 + k * 0.7)}>
                      <Glow x={x} y={r.y} r={50} color="press" />
                      <PressureArrow x={x - 6} y={r.y} nx={-1} ny={0} L={r.L} width={3.5} />
                      <PressureArrow x={x + 6} y={r.y} nx={1} ny={0} L={r.L} width={3.5} />
                      <circle cx={x} cy={r.y} r={7} fill={C.press} stroke="#fff" strokeWidth={2} />
                      <Label x={j ? x + 72 : x - 72} y={r.y - 22} size={28} font="serif" italic color={C.press} weight={600}>
                        {j ? r.b : r.a}
                      </Label>
                    </g>
                  ))}
                  <Ripple x={XL} y={r.y} p={ramp(t, cue(1) + 0.5 + k * 0.7, cue(1) + 1.8 + k * 0.7)} r={70} color="press" />
                  <Ripple x={XR} y={r.y} p={ramp(t, cue(1) + 0.5 + k * 0.7, cue(1) + 1.8 + k * 0.7)} r={70} color="press" />
                </g>
              ))}
            </g>

            {/* baris 2: titik menelusuri jalur */}
            <g opacity={trVis}>
              <path d={CL} fill="none" stroke={C.gold} strokeOpacity={0.35} strokeWidth={3} strokeDasharray={`0 ${dA} ${Math.max(0, dDot - dA)} 99999`} />
              <Spark x={dotP[0]} y={dotP[1]} r={9} color="gold" trail={trail} />
              <g opacity={goingDown}>
                <Label x={dotP[0] + (dotP[0] < 640 ? -78 : 78)} y={dotP[1]} size={30} font="serif" italic color={C.work} weight={600}>
                  +ρgh
                </Label>
              </g>
              <g opacity={goingUp}>
                <Label x={dotP[0] + (dotP[0] < 640 ? -78 : 78)} y={dotP[1]} size={30} font="serif" italic color={C.heat} weight={600}>
                  −ρgh
                </Label>
              </g>
              {/* pembacaan berjalan */}
              <g>
                <rect x={1150} y={520} width={520} height={250} rx={18} fill="rgba(10,16,36,0.8)" stroke={C.line} strokeWidth={2} />
                <Label x={1180} y={560} size={24} color={C.muted} anchor="start">
                  tekanan di titik emas
                </Label>
                <Label x={1180} y={625} size={44} font="mono" color={C.ink} weight={600} anchor="start">
                  {`p₀ ${dP >= -0.5 ? '+' : '−'} ${fmt(Math.abs(Math.round(dP / 50) * 50))} Pa`}
                </Label>
                <rect x={1180} y={680} width={460} height={22} rx={11} fill={C.faint} opacity={0.5} />
                <rect x={1180} y={680} width={Math.max(0, (460 * dP) / 4300)} height={22} rx={11} fill={C.press} />
                <Label x={1180} y={736} size={22} color={C.muted} anchor="start">
                  0
                </Label>
                <Label x={1640} y={736} size={22} color={C.muted} anchor="end">
                  dasar pipa
                </Label>
              </g>
            </g>

            {/* tabung gas */}
            <g opacity={gasIn}>
              <rect x={150} y={290} width={190} height={290} rx={40} fill="#2a1430" fillOpacity={0.6} stroke={C.press} strokeWidth={3} />
              <rect x={166} y={310} width={14} height={250} rx={7} fill="#fff" opacity={0.08} />
              {Array.from({length: 18}, (_, i) => {
                const sp = 0.25 + push * 0.25;
                const x = 170 + 150 * tri(t * sp * (0.7 + (i % 5) * 0.13) + i * 0.37);
                const y = 310 + 250 * tri(t * sp * (0.9 + (i % 3) * 0.17) + i * 0.61);
                return <circle key={i} cx={x} cy={y} r={5} fill={C.press} opacity={0.85} />;
              })}
              <Label x={245} y={620} size={30} color={C.press} weight={600}>
                gas
              </Label>
              <path d={`M245,290 L245,190 L${XL},190 L${XL},${TOP - 12}`} fill="none" stroke="#3b466e" strokeWidth={16} strokeLinejoin="round" />
              <path d={`M245,290 L245,190 L${XL},190 L${XL},${TOP - 12}`} fill="none" stroke="#fff" strokeOpacity={0.08} strokeWidth={6} strokeLinejoin="round" />
              <g transform={`rotate(${90 * ramp(t, cue(3) + 0.2, tPush - 0.4)} 360 190)`}>
                <circle cx={360} cy={190} r={16} fill="#1a2550" stroke={C.muted} strokeWidth={3} />
                <line x1={346} y1={190} x2={374} y2={190} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
              </g>
              <Stream
                pts={[
                  [245, 290],
                  [245, 190],
                  [XL, 190],
                  [XL, Math.max(TOP, yLs - 10)],
                ]}
                color="press"
                n={10}
                speed={0.45}
                r={4}
                jitter={1}
                opacity={ramp(t, tPush - 0.6, tPush)}
              />
              {/* gas menekan permukaan kiri */}
              {[-16, 0, 16].map((dx) => (
                <PressureArrow key={dx} x={XL + dx} y={yLs - 3} nx={0} ny={-1} L={30 + 16 * push} width={3.5} opacity={push} />
              ))}
              <PressureArrow x={XR} y={yRs - 3} nx={0} ny={-1} L={30} width={3.5} color="#ffc2dc" opacity={push} />
              <Label x={XR} y={yRs - 70} size={22} color="#ffc2dc" opacity={push}>
                udara luar
              </Label>
            </g>
            {/* garis tekanan sama & beda tinggi */}
            <g opacity={eqGas}>
              <line x1={XL - 50} y1={yLs} x2={XR + 50} y2={yLs} stroke={C.press} strokeWidth={2.5} strokeDasharray="10 8" strokeDashoffset={-t * 14} />
              <circle cx={XL} cy={yLs} r={7} fill={C.press} stroke="#fff" strokeWidth={2} />
              <circle cx={XR} cy={yLs} r={7} fill={C.press} stroke="#fff" strokeWidth={2} />
              <line x1={XR + 44} y1={yRs} x2={XR + 44} y2={yLs} stroke={C.spr} strokeWidth={4} />
              <line x1={XR + 34} y1={yRs} x2={XR + 54} y2={yRs} stroke={C.spr} strokeWidth={4} />
              <line x1={XR + 34} y1={yLs} x2={XR + 54} y2={yLs} stroke={C.spr} strokeWidth={4} />
              <Label x={XR + 66} y={(yRs + yLs) / 2} size={30} font="serif" italic color={C.spr} weight={600} anchor="start" opacity={1 - ruler}>
                Δh = 25 cm
              </Label>
              <Ripple x={XR} y={yLs} p={ramp(t, wordOf(4, 'beda') - 0.2, wordOf(4, 'beda') + 1.2)} r={80} color="press" />
            </g>
            <g opacity={oilTint * (1 - ruler)}>
              <Label x={640} y={628} size={26} font="mono" color="#f3c46c" weight={600}>
                ρ = 800 kg/m³
              </Label>
            </g>
            {/* penggaris */}
            <g opacity={ruler}>
              <rect x={XR + 34} y={yRs - 50} width={52} height={yLs - yRs + 100} rx={6} fill="#e9d9a6" opacity={0.9} />
              {Array.from({length: 36}, (_, i) => {
                const y = yRs - 40 + i * 8;
                if (y > yLs + 44) return null;
                return <line key={i} x1={XR + 34} y1={y} x2={XR + 34 + (i % 5 === 0 ? 22 : 12)} y2={y} stroke="#3a2a10" strokeWidth={2} />;
              })}
              <Spark x={XR + 60} y={yRs} r={6} color="gold" />
              <Spark x={XR + 60} y={yLs} r={6} color="gold" />
              <Label x={XR + 104} y={(yRs + yLs) / 2} size={30} font="mono" color={C.gold} weight={600} anchor="start">
                25 cm
              </Label>
            </g>
          </g>
        ) : null}

        {/* =================== FASE 3: minyak vs air =================== */}
        {ph3 > 0.001 ? (
          <g opacity={ph3}>
            <ellipse cx={640} cy={862} rx={260} ry={14} fill="#000" opacity={0.35} />
            <rect x={600} y={830} width={80} height={28} rx={6} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
            <Tube />
            <Seg a={dLeft(yIf)} b={dRight(yRw)} color={C.water} id="mano-w3" />
            <Seg a={dLeft(yOil)} b={dLeft(yIf)} color="#e9a93c" id="mano-o3" />
            <line x1={XL - 29} y1={yIf} x2={XL + 29} y2={yIf} stroke="#ffe3a8" strokeWidth={2} opacity={Math.min(1, hoCm)} />
            {hoCm > 0.2 ? <Surf x={XL} y={yOil} t={t} color="#ffe3a8" /> : <Surf x={XL} y={yIf} t={t} />}
            <Surf x={XR} y={yRw} t={t} seed={2} />
            <ArmBubbles x={XR} yS={yRw} yB={BY + 60} t={t} seed={0.4} />
            {/* tuang minyak */}
            <g opacity={oilPour}>
              <path d={`M${XL + 50},${JUGY + 50} L${XL + 120},${JUGY + 50} L${XL + 130},${JUGY} L${XL + 40},${JUGY} Z`} fill="#2a2010" stroke="#f3c46c" strokeOpacity={0.8} strokeWidth={3} transform={`rotate(${-24 - 4 * Math.sin(t * 3)} ${XL + 85} ${JUGY + 25})`} />
              <path d={`M${XL + 44},${JUGY + 14} Q${XL + 14},${JUGY + 6} ${XL + 2},${JUGY + 26}`} fill="none" stroke="#f3c46c" strokeWidth={6} strokeLinecap="round" opacity={0.7} />
              <rect x={XL - 5} y={JUGY + 26} width={10} height={Math.max(0, yOil - JUGY - 26)} rx={5} fill="#e9a93c" opacity={0.75} />
              <Stream pts={[[XL, 194], [XL, Math.max(200, yOil - 4)]]} color="gold" n={6} speed={1.3} r={4} jitter={2} />
            </g>
            <Label x={XL - 92} y={(yOil + yIf) / 2 - 60} size={26} color="#f3c46c" weight={600} anchor="end" opacity={ramp(t, oilA + 0.5, oilA + 1.2)}>
              minyak
            </Label>
            <Label x={XR + 92} y={yRw - 50} size={26} color={C.water} weight={600} anchor="start" opacity={ramp(t, oilA + 0.5, oilA + 1.2)}>
              air
            </Label>
            {/* garis batas: tekanan sama */}
            <g opacity={eq3}>
              <line x1={XL - 70} y1={yIf} x2={XR + 70} y2={yIf} stroke={C.press} strokeWidth={2.5} strokeDasharray="10 8" strokeDashoffset={-t * 14} />
              <circle cx={XL} cy={yIf} r={7} fill={C.press} stroke="#fff" strokeWidth={2} />
              <circle cx={XR} cy={yIf} r={7} fill={C.press} stroke="#fff" strokeWidth={2} />
              <Label x={640} y={yIf - 26} size={22} color={C.press}>
                tekanan sama
              </Label>
            </g>
            <g opacity={br20}>
              <line x1={XL - 60} y1={yOil} x2={XL - 60} y2={yIf} stroke="#f3c46c" strokeWidth={4} />
              <line x1={XL - 70} y1={yOil} x2={XL - 50} y2={yOil} stroke="#f3c46c" strokeWidth={4} />
              <line x1={XL - 70} y1={yIf} x2={XL - 50} y2={yIf} stroke="#f3c46c" strokeWidth={4} />
              <Label x={XL - 80} y={(yOil + yIf) / 2 + 10} size={30} font="mono" color="#f3c46c" weight={600} anchor="end">
                20 cm
              </Label>
            </g>
            <g opacity={br16}>
              <line x1={XR + 60} y1={yRw} x2={XR + 60} y2={yIf} stroke={C.water} strokeWidth={4} />
              <line x1={XR + 50} y1={yRw} x2={XR + 70} y2={yRw} stroke={C.water} strokeWidth={4} />
              <line x1={XR + 50} y1={yIf} x2={XR + 70} y2={yIf} stroke={C.water} strokeWidth={4} />
              <Label x={XR + 80} y={(yRw + yIf) / 2 + 10} size={30} font="mono" color={C.water} weight={600} anchor="start">
                16 cm
              </Label>
            </g>
            <g opacity={tr3Vis}>
              <Spark x={dot3[0]} y={dot3[1]} r={9} color="gold" />
              <Ripple x={XR} y={yRw} p={ramp(t, tr3B - 0.1, tr3B + 1.2)} r={70} color="gold" />
            </g>
            <Motes x={640} y={560} rx={260} ry={220} n={14} color="water" opacity={0.35} seed={5} />
            {/* batang tekanan di garis batas */}
            <g opacity={bars}>
              <rect x={1130} y={500} width={560} height={300} rx={18} fill="rgba(10,16,36,0.8)" stroke={C.line} strokeWidth={2} />
              <Label x={1410} y={532} size={22} color={C.muted}>
                tekanan kolom di atas garis batas
              </Label>
              <line x1={1180} y1={740} x2={1640} y2={740} stroke={C.muted} strokeWidth={2} />
              {[
                {x: 1250, p: oilBar, c: '#e9a93c', l: 'minyak 20 cm', v: 1600 * oilBar},
                {x: 1470, p: waterBar, c: C.water, l: 'air 16 cm', v: 1600 * waterBar},
              ].map((b, k) => (
                <g key={k}>
                  <rect x={b.x} y={740 - 150} width={100} height={150} rx={8} fill={b.c} opacity={0.08} />
                  <rect x={b.x} y={740 - 150 * b.p} width={100} height={150 * b.p} rx={8} fill={b.c} opacity={0.85} />
                  <Label x={b.x + 50} y={740 - 150 * b.p - 20} size={24} font="mono" color={b.c} weight={600} opacity={Math.min(1, b.p * 4)}>
                    {`${fmt(b.v)} Pa`}
                  </Label>
                  <Label x={b.x + 50} y={770} size={22} color={b.c}>
                    {b.l}
                  </Label>
                </g>
              ))}
              <line x1={1230} y1={590} x2={1590} y2={590} stroke={C.press} strokeWidth={2} strokeDasharray="6 6" opacity={waterBar} />
              <Label x={1410} y={572} size={34} color={C.press} weight={700} opacity={ramp(waterBar, 0.95, 1)}>
                =
              </Label>
            </g>
            <Twinkles x={1410} y={330} rx={300} ry={70} n={5} color="spr" opacity={f7num} />
          </g>
        ) : null}
      </Stage>
      <Note x={1420} y={262} p={eqNote * ph1} color={C.press} size={30}>
        setinggi, cairan sama, terhubung → <V>p</V> sama
      </Note>
      <Formula x={1410} y={330} p={fRule * ph1} accent={C.gold} size={56}>
        turun: <span style={{color: C.work}}>+ρgh</span>
        <span style={{display: 'inline-block', width: 50}} />
        naik: <span style={{color: C.heat}}>−ρgh</span>
      </Formula>
      <Formula x={1400} y={330} p={fPush * ph1} accent={C.press} size={60} caption="gas mendorong lebih kuat daripada udara luar">
        <V color="press">p</V>
        <Sub>gas</Sub> &gt; <V color="press">p</V>
        <Sub>atm</Sub>
      </Formula>
      <Formula x={1400} y={330} p={fGas * ph1} accent={C.press} size={58} caption={<span style={{opacity: nManometer}}>manometer: tekanan tak terlihat → beda tinggi yang terbaca</span>}>
        <V>p</V>
        <Sub>ukur</Sub> = <V color="spr">ρ</V>
        <V>g</V>Δ<V>h</V>
        <div style={{fontSize: 42, fontFamily: FONT.mono, opacity: fGasNum, marginTop: 4}}>
          = 800 · 10 · 0,25 = <span style={{color: C.press}}>2000 Pa</span>
        </div>
      </Formula>
      <Formula x={1410} y={330} p={f7 * ph3} accent={C.spr} size={58}>
        <V color="spr">ρ</V>
        <Sub>minyak</Sub> = <Frac n="16" d="20" /> · 1000 = <span style={{color: C.spr, opacity: 0.35 + 0.65 * f7num}}>800 kg/m³</span>
      </Formula>
    </AbsoluteFill>
  );
};
