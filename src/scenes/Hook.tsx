import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Bubbles, DepthRuler, PressureArrow, Water, wavePath} from '../components/fluid';
import {Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Pembuka: kapal baja raksasa mengapung, baut baja kecil tenggelam (jatuh bebas → percikan → turun
// dengan kecepatan terminal); dinding bendungan menebal ke bawah (panah tekanan ∝ kedalaman);
// penyelam turun 10 m (p mutlak 100 → 200 kPa, gendang telinga tertekan); kubus dalam air
// didorong dari segala arah; secangkir air → dasar samudra.

const WL = 500; // permukaan laut
const SEABED = 852;
const BOLT_X = 1440;

// ---- baut: jatuh bebas lalu tenggelam dengan hambatan (kecepatan terminal) ----
const Y0 = 300;
const T_FALL = 0.55;
const ACC = (2 * (WL - Y0)) / (T_FALL * T_FALL);
const V1 = ACC * T_FALL;
const VT = 165;
const TAU = 0.16;
const boltY = (tau: number) => {
  if (tau <= 0) return Y0;
  if (tau < T_FALL) return Y0 + 0.5 * ACC * tau * tau;
  const s = tau - T_FALL;
  return Math.min(SEABED - 12, WL + VT * s + (V1 - VT) * TAU * (1 - Math.exp(-s / TAU)));
};
// waktu menyentuh dasar (dicari numerik sekali)
const T_LAND = (() => {
  for (let s = T_FALL; s < 6; s += 0.005) if (boltY(s) >= SEABED - 12.01) return s;
  return 3;
})();

const CONT_COLORS = ['#c9584f', '#3f78c9', '#d9a23a', '#3fa877', '#8d63c9', '#c97a3f'];

/** Kapal kargo baja tampak samping. Titik asal = garis air di tengah kapal. */
const Ship: React.FC<{t: number}> = ({t}) => {
  const hull = 'M-440,-78 L372,-78 L428,-102 Q414,10 330,96 L-372,96 Q-432,64 -446,-6 Z';
  return (
    <g>
      <defs>
        <clipPath id="hk-hull">
          <path d={hull} />
        </clipPath>
        <linearGradient id="hk-steel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b4a72" />
          <stop offset="100%" stopColor="#1b2440" />
        </linearGradient>
      </defs>
      {/* peti kemas bertingkat */}
      {Array.from({length: 11}, (_, c) =>
        Array.from({length: c % 3 === 1 ? 2 : 3}, (_, r) => {
          const x = -262 + c * 54;
          const y = -78 - 34 * (r + 1);
          const col = CONT_COLORS[(c * 3 + r * 2) % CONT_COLORS.length];
          return (
            <g key={`${c}-${r}`}>
              <rect x={x} y={y} width={52} height={33} fill={col} opacity={0.82} stroke="#0b1020" strokeWidth={1.5} />
              <line x1={x + 26} y1={y + 4} x2={x + 26} y2={y + 29} stroke="#000" strokeOpacity={0.25} strokeWidth={2} />
            </g>
          );
        }),
      )}
      {/* anjungan & cerobong */}
      <rect x={-410} y={-218} width={104} height={140} fill="#d7deef" stroke="#7d8bb3" strokeWidth={2} />
      <rect x={-422} y={-236} width={128} height={20} fill="#c3cce3" stroke="#7d8bb3" strokeWidth={2} />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={-398 + k * 24} y={-200 + r * 36} width={14} height={12} rx={2} fill={C.cyan} opacity={0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.7 + k + r * 2))} />
          ))}
        </g>
      ))}
      <path d="M-368,-236 L-362,-290 L-332,-290 L-326,-236 Z" fill="#c9584f" stroke="#0b1020" strokeWidth={1.5} />
      <rect x={-366} y={-280} width={38} height={8} fill="#1b2440" />
      {/* asap cerobong */}
      {Array.from({length: 6}, (_, i) => {
        const ph = (((t * 0.22 + i / 6) % 1) + 1) % 1;
        return <circle key={i} cx={-347 - 120 * ph - 10 * Math.sin(t + i)} cy={-298 - 70 * ph} r={8 + 26 * ph} fill="#9aa6c8" opacity={0.28 * cyc(ph)} />;
      })}
      {/* lambung */}
      <path d={hull} fill="url(#hk-steel)" stroke="#8fa0cc" strokeWidth={2.5} strokeLinejoin="round" />
      <g clipPath="url(#hk-hull)">
        <rect x={-460} y={6} width={920} height={100} fill="#8e2f3c" />
        <rect x={-460} y={-2} width={920} height={8} fill="#e8edf7" opacity={0.85} />
        <rect x={-460} y={-78} width={920} height={8} fill="#fff" opacity={0.1} />
        {Array.from({length: 9}, (_, k) => (
          <line key={k} x1={-380 + k * 90} y1={-70} x2={-380 + k * 90} y2={96} stroke="#000" strokeOpacity={0.12} strokeWidth={2} />
        ))}
      </g>
      <text x={150} y={-40} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.head} fontWeight={700} fontSize={26} fill="#e8edf7" opacity={0.75} letterSpacing={6}>
        BAJA
      </text>
    </g>
  );
};

/** Bendungan penampang: muka air tegak di x = FX, tebal di dasar. */
const DAM_FX = 620;
const DAM_TOP = 300;
const DAM_BOT = 842;
const DAM_SURF = 332;
const Dam: React.FC<{t: number; t0: number; op: number}> = ({t, t0, op}) => {
  if (op <= 0.001) return null;
  const ys = [390, 460, 530, 600, 670, 740, 810];
  const Lof = (y: number) => 14 + 0.4 * (y - DAM_SURF);
  return (
    <g opacity={op}>
      <Water x={110} y={DAM_SURF} w={DAM_FX - 110} h={DAM_BOT - DAM_SURF} bubbles={5} seed={3} />
      <Water x={858} y={790} w={110} h={DAM_BOT - 790} amp={2} seed={5} caustics={false} />
      <path d={`M${DAM_FX},${DAM_TOP} L${DAM_FX + 52},${DAM_TOP} L${DAM_FX + 252},${DAM_BOT} L${DAM_FX},${DAM_BOT} Z`} fill="#4a5677" stroke="#a9b6d6" strokeWidth={3} strokeLinejoin="round" />
      {/* tekstur beton */}
      {Array.from({length: 14}, (_, k) => {
        const y = DAM_TOP + 30 + k * 36;
        const xr = DAM_FX + 52 + ((y - DAM_TOP) / (DAM_BOT - DAM_TOP)) * 200;
        return <line key={k} x1={DAM_FX + 8} y1={y} x2={xr - 8} y2={y} stroke="#000" strokeOpacity={0.14} strokeWidth={2} />;
      })}
      <line x1={DAM_FX + 6} y1={DAM_TOP + 6} x2={DAM_FX + 6} y2={DAM_BOT - 6} stroke="#fff" strokeOpacity={0.15} strokeWidth={5} />
      <line x1={100} y1={DAM_BOT + 2} x2={980} y2={DAM_BOT + 2} stroke={C.muted} strokeWidth={3} />
      {/* panah tekanan: makin panjang makin dalam (p ∝ h) */}
      {ys.map((y, k) => {
        const p = ramp(t, t0 + 0.5 + k * 0.32, t0 + 1.1 + k * 0.32);
        return <PressureArrow key={y} x={DAM_FX - 4} y={y} nx={-1} ny={0} L={Lof(y) * p} width={4.5} opacity={Math.min(1, p * 2)} />;
      })}
      {/* garis selubung segitiga distribusi tekanan */}
      <path
        d={`M${DAM_FX - 4},${DAM_SURF} L${DAM_FX - 4 - Lof(DAM_BOT - 10)},${DAM_BOT - 10}`}
        stroke={C.press}
        strokeWidth={2}
        strokeDasharray="6 8"
        strokeDashoffset={-t * 18}
        fill="none"
        opacity={0.7 * ramp(t, t0 + 2.6, t0 + 3.4)}
      />
      <DepthRuler x={140} yTop={DAM_SURF} yBot={DAM_BOT - 10} ticks={8} opacity={0.8} />
      <Label x={162} y={DAM_SURF + 40} size={30} font="serif" italic anchor="start" color={C.muted}>
        h
      </Label>
      {/* tebal dinding: tipis di atas, tebal di bawah */}
      <g opacity={ramp(t, t0 + 2.4, t0 + 3.2)}>
        <line x1={DAM_FX} y1={DAM_TOP - 18} x2={DAM_FX + 52} y2={DAM_TOP - 18} stroke={C.gold} strokeWidth={3} />
        <Label x={DAM_FX + 70} y={DAM_TOP - 18} size={28} anchor="start" color={C.gold}>
          tipis
        </Label>
        <line x1={DAM_FX} y1={DAM_BOT + 22} x2={DAM_FX + 252} y2={DAM_BOT + 22} stroke={C.gold} strokeWidth={3} />
        <circle cx={DAM_FX} cy={DAM_BOT + 22} r={4} fill={C.gold} />
        <circle cx={DAM_FX + 252} cy={DAM_BOT + 22} r={4} fill={C.gold} />
        <Label x={DAM_FX + 150} y={DAM_BOT - 40} size={30} color={C.gold} weight={600}>
          tebal
        </Label>
      </g>
      <Glow x={DAM_FX - 60} y={DAM_BOT - 60} r={160} color="press" opacity={0.5 * ramp(t, t0 + 2.6, t0 + 3.4)} />
    </g>
  );
};

/** Penyelam (kepala di atas), kaki menendang pelan. Titik asal = dada. */
const Diver: React.FC<{t: number}> = ({t}) => {
  const kick = Math.sin(t * 3.2);
  return (
    <g>
      <rect x={-44} y={-56} width={24} height={86} rx={11} fill="#e3b33d" stroke="#7a5a14" strokeWidth={2} />
      {[-1, 1].map((s) => {
        const a = s * 9 * kick;
        return (
          <g key={s} transform={`rotate(${a} ${s * 9} 38)`}>
            <path d={`M${s * 9},36 L${s * 12},104`} stroke="#1d2a4a" strokeWidth={17} strokeLinecap="round" />
            <path d={`M${s * 12 - 9},104 L${s * 12 + 9},104 L${s * 12 + 15 * s + s * 6},146 L${s * 12 - 12 * s},142 Z`} fill={C.cyan} opacity={0.9} />
          </g>
        );
      })}
      <rect x={-23} y={-58} width={46} height={100} rx={20} fill="#22305a" stroke="#7d8fbf" strokeWidth={2.5} />
      <path d="M-14,-42 Q30,-34 34,-4 L30,14" fill="none" stroke="#22305a" strokeWidth={12} strokeLinecap="round" />
      <path d="M-14,-42 Q30,-34 34,-4 L30,14" fill="none" stroke="#7d8fbf" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      <circle cx={0} cy={-80} r={22} fill="#2c3a63" stroke="#7d8fbf" strokeWidth={2} />
      <rect x={4} y={-92} width={24} height={18} rx={6} fill={C.cyan} opacity={0.55} stroke="#e6f6ff" strokeWidth={2} />
      <circle cx={24} cy={-66} r={6} fill="#9aa6c8" />
      {/* telinga */}
      <path d="M-10,-86 q-7,6 0,12" fill="none" stroke={C.press} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

export const Hook: React.FC = () => {
  const {t, cue, cueEnd, wordOf, dur} = useScene();

  // ---- babak ----
  const actA = 1 - ramp(t, cue(3) - 0.5, cue(3) + 0.2, EASE_IN_OUT);
  const actB = win(t, cue(3) - 0.2, cue(5) - 0.5, 0.8, 0.6);
  const actC = win(t, cue(4) - 0.3, cue(5) - 0.5, 0.8, 0.6);
  const actD = win(t, cue(5) - 0.3, cue(6) - 0.5, 0.8, 0.6);
  const actE = ramp(t, cue(6) - 0.3, cue(6) + 0.5);

  // ---- babak A: kapal & baut ----
  const heave = 5 * Math.sin(t * 0.7) + 2 * Math.sin(t * 1.3 + 1);
  const pitch = 0.7 * Math.sin(t * 0.55 + 0.4);
  const shipX = 720;
  const shipIn = ramp(t, -0.4, 1.4);
  const tDrop = wordOf(1, 'dijatuhkan') - 0.1;
  const tau = t - tDrop;
  const by = boltY(tau);
  const boltShow = ramp(t, tDrop - 0.6, tDrop - 0.2);
  const tImpact = tDrop + T_FALL;
  const tLand = tDrop + T_LAND;
  const sinkTau = Math.max(0, tau - T_FALL);
  const settle = ramp(t, tLand - 0.1, tLand + 0.5);
  const boltRot = (1 - settle) * (25 * Math.sin(sinkTau * 4.5) * Math.exp(-sinkTau * 0.6) + 10 * ramp(t, tImpact, tImpact + 0.4)) + settle * 84;
  const boltX = BOLT_X + (tau > T_FALL ? 14 * Math.sin(sinkTau * 2.6) * (1 - settle) : 0);
  const trail: [number, number][] = [1, 2, 3, 4, 5].map((k) => [BOLT_X, boltY(tau - k * 0.04)]);
  const zoomA = 1 + 0.08 * win(t, tDrop - 0.4, cue(2) + 1.2, 1.2, 1.6);
  const zA = {x: BOLT_X - 120, y: 600};
  const why = ramp(t, cue(2) + 0.2, cue(2) + 1.0);
  const qMark = ramp(t, wordOf(2, 'mengapa'), wordOf(2, 'mengapa') + 0.6);

  // ---- babak C: penyelam 10 m ----
  const COL_TOP = 236;
  const PXM = 38; // piksel per meter (0 m = permukaan)
  const depthAt = (tt: number) => 10 * ramp(tt, cue(4) + 0.4, cueEnd(4) + 0.4, EASE_IN_OUT);
  const dpt = depthAt(t);
  const diverX = 1330 + 18 * Math.sin(t * 0.6);
  const diverY = COL_TOP + 8 + dpt * PXM + 64; // kepala tepat di garis kedalaman
  const pAbs = 100 + 10 * dpt; // kPa, p_atm = 100 kPa, +10 kPa per meter air
  const EC = {x: 1645, y: 430};

  // ---- babak D: kubus ----
  const cubeBob = 3 * Math.sin(t * 1.1);
  const CUB = {x: 960, y: 560 + cubeBob, s: 190};
  const arrowsD = ramp(t, cue(5) + 0.8, cue(5) + 2.6);
  const tagsD = ramp(t, wordOf(5, 'Ketiganya'), wordOf(5, 'Ketiganya') + 0.8);
  const wordD = ramp(t, wordOf(5, 'tekanan') - 0.1, wordOf(5, 'tekanan') + 0.6);
  const Lcube = (y: number) => 26 + 0.13 * (y - 250);

  // ---- babak E: cangkir → samudra ----
  const spk = ramp(t, cue(6) + 1.2, cueEnd(6) - 0.4, EASE_IN_OUT);
  const pathE: [number, number][] = [
    [540, 520],
    [700, 360],
    [960, 300],
    [1180, 340],
    [1350, 520],
    [1380, 700],
    [1400, 800],
  ];
  const segPt = (u: number): [number, number] => {
    const n = pathE.length - 1;
    const f = Math.min(n - 1e-6, Math.max(0, u * n));
    const i = Math.floor(f);
    const k = f - i;
    return [mix(pathE[i][0], pathE[i + 1][0], k), mix(pathE[i][1], pathE[i + 1][1], k)];
  };
  const [sx, sy] = segPt(spk);
  const strail = [1, 2, 3, 4, 5, 6].map((k) => segPt(Math.max(0, spk - k * 0.012)));

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= Babak A ================= */}
        {actA > 0.001 ? (
          <g opacity={actA} transform={`translate(${zA.x} ${zA.y}) scale(${zoomA}) translate(${-zA.x} ${-zA.y})`}>
            <Glow x={960} y={WL - 40} r={760} color="water" opacity={0.25} />
            {/* cahaya bulan & bintang samar */}
            <circle cx={1660} cy={250} r={46} fill="#e9f1ff" opacity={0.75} />
            <Glow x={1660} y={250} r={180} color="white" opacity={0.35} />
            <Twinkles x={1100} y={260} rx={700} ry={90} n={6} color="white" opacity={0.5} seed={4} />
            <g opacity={shipIn} transform={`translate(${shipX} ${WL + heave}) rotate(${pitch})`}>
              <ellipse cx={0} cy={110} rx={420} ry={26} fill="#000" opacity={0.25} />
              <Ship t={t} />
            </g>
            {/* baut (di atas air: tampil sebelum lapisan air) */}
            {tau < T_FALL + 0.05 ? (
              <g opacity={boltShow} transform={`translate(${boltX} ${by}) rotate(${boltRot})`}>
                <Bolt />
              </g>
            ) : null}
            <Water x={0} y={WL} w={1920} h={SEABED - WL + 30} amp={5} bubbles={7} seed={1} />
            {/* pantulan bulan di permukaan */}
            {Array.from({length: 6}, (_, k) => (
              <rect key={k} x={1600 + 30 * Math.sin(t * 1.4 + k * 1.7)} y={WL + 12 + k * 14} width={120 - k * 14} height={3} rx={1.5} fill="#e9f1ff" opacity={0.25 - k * 0.03} />
            ))}
            {/* buih di ujung lambung (riak kecil saat kapal naik-turun) */}
            {[shipX - 440, shipX + 420].map((fx, k) => (
              <g key={k}>
                {[0, 1, 2].map((j) => {
                  const ph = (((t * 0.5 + j / 3 + k * 0.2) % 1) + 1) % 1;
                  return <ellipse key={j} cx={fx + (k ? 1 : -1) * 70 * ph} cy={WL + 2} rx={20 + 50 * ph} ry={4 + 4 * ph} fill="none" stroke="#e8f6ff" strokeWidth={2} opacity={0.5 * cyc(ph)} />;
                })}
              </g>
            ))}
            {/* dasar laut */}
            <path d={`M0,${SEABED} Q300,${SEABED - 10} 620,${SEABED} T1240,${SEABED - 6} T1920,${SEABED} L1920,${SEABED + 40} L0,${SEABED + 40} Z`} fill="#2a2a3e" opacity={0.9} />
            <path d={`M0,${SEABED} Q300,${SEABED - 10} 620,${SEABED} T1240,${SEABED - 6} T1920,${SEABED}`} fill="none" stroke="#6d6a8a" strokeWidth={2.5} />
            {/* rumput laut bergoyang */}
            {[180, 236, 1640, 1700, 1760].map((x, k) => (
              <path key={x} d={`M${x},${SEABED} q${10 + 12 * Math.sin(t * 1.1 + k)},-40 0,-80 q${-12 - 10 * Math.sin(t * 1.3 + k)},-36 ${6 * Math.sin(t + k)},-70`} fill="none" stroke={C.buoy} strokeOpacity={0.45} strokeWidth={5} strokeLinecap="round" />
            ))}
            {/* percikan saat baut masuk */}
            <Ripple x={BOLT_X} y={WL} p={(t - tImpact) / 1.3} r={130} color="water" rings={3} width={3} />
            {Array.from({length: 9}, (_, k) => {
              const s = t - tImpact;
              if (s < 0 || s > 0.75) return null;
              const ang = -Math.PI / 2 + (k - 4) * 0.22;
              const v = 330 + 90 * rand(k * 3.1);
              const x = BOLT_X + Math.cos(ang) * v * s;
              const y = WL + Math.sin(ang) * v * s + 0.5 * 1500 * s * s;
              return y <= WL + 2 ? <circle key={k} cx={x} cy={y} r={4.5} fill="#d8f0ff" opacity={1 - s / 0.75} /> : null;
            })}
            {/* baut di dalam air: tenggelam dengan jejak gelembung */}
            {tau >= T_FALL ? (
              <g>
                {Array.from({length: 10}, (_, k) => {
                  const rel = T_FALL + k * 0.16;
                  const age = tau - rel;
                  if (age < 0 || age > 2.4) return null;
                  const y0 = boltY(rel);
                  const yy = y0 - 95 * age;
                  if (yy < WL + 6) return null;
                  const r = 3 + 2.5 * rand(k * 2.3);
                  return <circle key={k} cx={BOLT_X + 10 * Math.sin(age * 5 + k)} cy={yy} r={r} fill="none" stroke="#d8f0ff" strokeWidth={1.5} opacity={0.8 * (1 - age / 2.4)} />;
                })}
                <Spark x={boltX} y={by} r={6} color="cyan" opacity={0.6 * (1 - settle)} trail={trail} />
                <g transform={`translate(${boltX} ${by}) rotate(${boltRot})`}>
                  <Bolt />
                </g>
                <Ripple x={BOLT_X} y={SEABED - 4} p={(t - tLand) / 1.1} r={70} color="muted" rings={2} />
                <Glow x={BOLT_X} y={SEABED - 14} r={70} color="cyan" opacity={0.35 * settle * (0.7 + 0.3 * Math.sin(t * 2))} />
              </g>
            ) : null}
            <Label x={shipX - 30} y={250} size={30} color={C.muted} opacity={win(t, 1.8, cue(2) - 0.2, 0.8, 0.6)}>
              puluhan ribu ton
            </Label>
            {/* baja = baja */}
            <g opacity={why}>
              <Label x={shipX + 140} y={WL + 70} size={30} color={C.gold} weight={600}>
                baja
              </Label>
              <Label x={BOLT_X + 70} y={SEABED - 50} size={30} color={C.gold} weight={600} anchor="start">
                baja
              </Label>
              <Label x={1270} y={330} size={150} weight={700} color={C.gold} opacity={qMark * (0.75 + 0.25 * Math.sin(t * 3))}>
                ?
              </Label>
              <Glow x={1270} y={330} r={130} color="gold" opacity={0.5 * qMark} />
            </g>
          </g>
        ) : null}

        {/* ================= Babak B: bendungan ================= */}
        {actB > 0.001 ? <Dam t={t} t0={cue(3)} op={actB} /> : null}

        {/* ================= Babak C: penyelam ================= */}
        {actC > 0.001 ? (
          <g opacity={actC}>
            <Water x={1010} y={COL_TOP} w={820} h={880 - COL_TOP} bubbles={4} seed={8} />
            <DepthRuler x={1090} yTop={COL_TOP + 8} yBot={COL_TOP + 8 + 10 * PXM} ticks={10} color={C.ink} opacity={0.85} />
            {[0, 5, 10].map((m) => (
              <Label key={m} x={1070} y={COL_TOP + 8 + m * PXM} size={24} anchor="end" font="mono" color={C.ink}>
                {`${m} m`}
              </Label>
            ))}
            {/* penanda kedalaman sekarang */}
            <line x1={1094} y1={diverY - 64} x2={diverX - 30} y2={diverY - 64} stroke={C.press} strokeWidth={2} strokeDasharray="5 7" opacity={0.6} />
            <circle cx={1090} cy={COL_TOP + 8 + dpt * PXM} r={7} fill={C.press} />
            {/* gelembung napas */}
            {Array.from({length: 9}, (_, i) => {
              const T = 1.7;
              const ph = (((t / T + i / 9) % 1) + 1) % 1;
              const age = ph * T;
              const tRel = t - age;
              const y0 = COL_TOP + 8 + depthAt(tRel) * PXM + 64 - 53;
              const x0 = 1330 + 18 * Math.sin(tRel * 0.6) + 20;
              const yy = y0 - 150 * age;
              if (yy < COL_TOP + 8) return null;
              const r = 3 + 3 * rand(i * 4.1) + age * 2;
              return <circle key={i} cx={x0 + 8 * Math.sin(age * 4 + i)} cy={yy} r={r} fill="none" stroke="#d8f0ff" strokeWidth={1.6} opacity={0.8 * cyc(ph)} />;
            })}
            <Glow x={diverX} y={diverY} r={130} color="water" opacity={0.4} />
            <g transform={`translate(${diverX} ${diverY}) rotate(${4 * Math.sin(t * 0.8)}) scale(0.8)`}>
              <Diver t={t} />
            </g>
            {/* panggilan telinga */}
            <line x1={diverX + 4} y1={diverY - 70} x2={EC.x - 118} y2={EC.y + 20} stroke={C.press} strokeWidth={2} strokeDasharray="4 6" opacity={0.7} />
            <circle cx={EC.x} cy={EC.y} r={122} fill="#0a1230" stroke={C.press} strokeOpacity={0.7} strokeWidth={3} />
            <EarDetail x={EC.x} y={EC.y} d={dpt} t={t} />
            <Label x={EC.x} y={EC.y - 150} size={26} color={C.press} weight={600}>
              telinga
            </Label>
            <Label x={EC.x} y={EC.y + 160} size={30} font="mono" color={C.ink}>
              {`p ≈ ${Math.round(pAbs)} kPa`}
            </Label>
            <Label x={EC.x} y={EC.y + 198} size={22} color={C.muted}>
              tekanan mutlak
            </Label>
          </g>
        ) : null}

        {/* ================= Babak D: kubus didorong dari segala arah ================= */}
        {actD > 0.001 ? (
          <g opacity={actD}>
            <Water x={500} y={250} w={920} h={600} bubbles={6} seed={11} />
            <Glow x={CUB.x} y={CUB.y} r={330} color="press" opacity={0.22 * arrowsD} />
            {/* molekul air bergetar di sekitar kubus */}
            {Array.from({length: 26}, (_, i) => {
              const bx = 540 + rand(i * 3.7) * 840;
              const byy = 290 + rand(i * 5.3) * 520;
              if (Math.abs(bx - CUB.x) < 150 && Math.abs(byy - CUB.y) < 150) return null;
              return <circle key={i} cx={bx + 9 * Math.sin(t * (2 + rand(i) * 3) + i)} cy={byy + 9 * Math.cos(t * (2.4 + rand(i + 1) * 3) + i * 2)} r={4} fill="#9fd4ff" opacity={0.35} />;
            })}
            <rect x={CUB.x - CUB.s / 2 + 10} y={CUB.y - CUB.s / 2 + 12} width={CUB.s} height={CUB.s} rx={10} fill="#000" opacity={0.25} />
            <rect x={CUB.x - CUB.s / 2} y={CUB.y - CUB.s / 2} width={CUB.s} height={CUB.s} rx={10} fill="#33426e" stroke="#c4d2f2" strokeWidth={3} />
            <rect x={CUB.x - CUB.s / 2 + 12} y={CUB.y - CUB.s / 2 + 12} width={CUB.s - 24} height={14} rx={7} fill="#fff" opacity={0.1} />
            {[-1, 0, 1].map((k) => {
              const off = k * 55;
              const yt = CUB.y - CUB.s / 2;
              const yb = CUB.y + CUB.s / 2;
              const yS = CUB.y + off;
              const q = (j: number) => ramp(arrowsD, j * 0.12, j * 0.12 + 0.5);
              return (
                <g key={k}>
                  <PressureArrow x={CUB.x + off} y={yt - 3} nx={0} ny={-1} L={Lcube(yt) * q(0)} width={4.5} />
                  <PressureArrow x={CUB.x + CUB.s / 2 + 3} y={yS} nx={1} ny={0} L={Lcube(yS) * q(1)} width={4.5} />
                  <PressureArrow x={CUB.x + off} y={yb + 3} nx={0} ny={1} L={Lcube(yb) * q(2)} width={4.5} />
                  <PressureArrow x={CUB.x - CUB.s / 2 - 3} y={yS} nx={-1} ny={0} L={Lcube(yS) * q(3)} width={4.5} />
                </g>
              );
            })}
            {/* tiga teka-teki menyatu ke satu jawaban */}
            {[
              {x: 640, label: 'kapal'},
              {x: 960, label: 'bendungan'},
              {x: 1280, label: 'penyelam'},
            ].map((g, k) => (
              <g key={g.label} opacity={tagsD}>
                <Label x={g.x} y={200} size={28} color={C.muted} weight={600}>
                  {g.label}
                </Label>
                <Stream
                  pts={[
                    [g.x, 226],
                    [mix(g.x, CUB.x, 0.5), 300],
                    [CUB.x + (k - 1) * 40, CUB.y - CUB.s / 2 - 70],
                  ]}
                  color="gold"
                  n={5}
                  speed={0.45}
                  r={4}
                  jitter={2}
                  seed={k}
                />
              </g>
            ))}
            <Label x={CUB.x} y={800} size={58} weight={700} color={C.press} opacity={wordD}>
              tekanan fluida
            </Label>
            <Twinkles x={CUB.x} y={800} rx={220} ry={30} n={5} color="press" opacity={wordD} seed={5} />
            <Ripple x={CUB.x} y={CUB.y} p={(t - wordOf(5, 'tekanan')) / 1.6} r={260} color="press" />
          </g>
        ) : null}

        {/* ================= Babak E: secangkir air → dasar samudra ================= */}
        {actE > 0.001 ? (
          <g opacity={actE}>
            {/* cangkir */}
            <ellipse cx={540} cy={712} rx={120} ry={14} fill="#000" opacity={0.3} />
            <Water x={466} y={560} w={148} h={140} amp={2.5} seed={14} caustics={false} />
            <path d="M456,520 L462,704 Q540,716 618,704 L624,520" fill="none" stroke="#cfe6ff" strokeWidth={5} strokeLinejoin="round" opacity={0.85} />
            <path d="M624,560 q52,6 50,56 q-2,48 -54,52" fill="none" stroke="#cfe6ff" strokeWidth={5} opacity={0.85} />
            {[600, 650].map((y) => (
              <g key={y}>
                <PressureArrow x={466} y={y} nx={1} ny={0} L={12 + 0.12 * (y - 560)} width={3} />
                <PressureArrow x={614} y={y} nx={-1} ny={0} L={12 + 0.12 * (y - 560)} width={3} />
              </g>
            ))}
            {/* uap */}
            {[0, 1, 2].map((k) => {
              const ph = (((t * 0.3 + k / 3) % 1) + 1) % 1;
              return <path key={k} d={`M${510 + k * 30},${500 - ph * 60} q10,-12 0,-24 q-10,-12 0,-24`} fill="none" stroke="#cfe6ff" strokeWidth={3} strokeLinecap="round" opacity={0.4 * cyc(ph)} />;
            })}
            <Label x={540} y={776} size={30} color={C.ink}>
              secangkir air
            </Label>
            {/* kolom samudra: makin gelap makin dalam */}
            <defs>
              <linearGradient id="hk-ocean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.water} stopOpacity={0.55} />
                <stop offset="55%" stopColor="#0b2f66" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#030712" stopOpacity={1} />
              </linearGradient>
            </defs>
            <path d={`${wavePath(1060, 1740, 240, t, 4, 0.035, 2)} L1740,860 L1060,860 Z`} fill="url(#hk-ocean)" />
            <path d={wavePath(1060, 1740, 240, t, 4, 0.035, 2)} fill="none" stroke="#cfeaff" strokeOpacity={0.7} strokeWidth={2.5} />
            {[330, 450, 570, 690, 800].map((y) => {
              const L = 14 + 0.21 * (y - 240);
              return (
                <g key={y}>
                  <PressureArrow x={1064} y={y} nx={1} ny={0} L={L} width={4} opacity={0.9} />
                  <PressureArrow x={1736} y={y} nx={-1} ny={0} L={L} width={4} opacity={0.9} />
                </g>
              );
            })}
            <line x1={1060} y1={240} x2={1060} y2={860} stroke="#cfe6ff" strokeOpacity={0.5} strokeWidth={3} />
            <line x1={1740} y1={240} x2={1740} y2={860} stroke="#cfe6ff" strokeOpacity={0.5} strokeWidth={3} />
            <Bubbles x={1200} y={260} w={400} h={560} n={7} seed={6} />
            {/* ikan sungut di kedalaman */}
            {(() => {
              const fx = 1400 + 60 * Math.sin(t * 0.4);
              const fy = 760 + 10 * Math.sin(t * 0.9);
              const flip = Math.tanh(3 * Math.cos(t * 0.4));
              return (
                <g transform={`translate(${fx} ${fy}) scale(${flip.toFixed(3)} 1)`}>
                  <path d="M-34,0 Q-10,-24 22,-6 L22,6 Q-10,24 -34,0 Z M-34,0 L-52,-14 L-48,0 L-52,14 Z" fill="#1f2c4f" stroke="#5b6d9c" strokeWidth={2} />
                  <path d="M10,-14 Q24,-40 40,-30" fill="none" stroke="#5b6d9c" strokeWidth={2} />
                  <circle cx={40} cy={-30} r={5} fill={C.buoy} />
                  <circle cx={40} cy={-30} r={22} fill="url(#soft-buoy)" opacity={0.8 + 0.2 * Math.sin(t * 4)} />
                  <circle cx={10} cy={-4} r={3} fill="#fff" opacity={0.8} />
                </g>
              );
            })()}
            <Label x={1400} y={830} size={30} color={C.ink}>
              dasar samudra
            </Label>
            <DrawPath2 pts={pathE} p={spk} />
            <Spark x={sx} y={sy} r={8} color="press" trail={strail} opacity={win(t, cue(6) + 1.0, dur - 1.0, 0.5, 0.6)} />
            <Motes x={1400} y={560} rx={360} ry={300} n={24} color="water" opacity={0.4} seed={9} />
          </g>
        ) : null}
      </Stage>
      <Note x={960} y={190} p={why * actA} color={C.gold}>
        sama-sama baja · yang besar mengapung
      </Note>
    </AbsoluteFill>
  );
};

/** Baut baja: kepala segi enam + batang berulir. Titik asal = tengah. */
const Bolt: React.FC = () => (
  <g>
    <rect x={-17} y={-30} width={34} height={14} rx={3} fill="#a9b4cf" stroke="#e6ecfa" strokeWidth={1.5} />
    <rect x={-7} y={-16} width={14} height={46} fill="#8792b0" stroke="#d3dbef" strokeWidth={1.2} />
    {[-10, -2, 6, 14, 22].map((y) => (
      <line key={y} x1={-7} y1={y} x2={7} y2={y + 4} stroke="#4c5675" strokeWidth={1.5} />
    ))}
  </g>
);

/** Rincian telinga: liang telinga, gendang telinga melengkung ke dalam ∝ kedalaman, panah tekanan. */
const EarDetail: React.FC<{x: number; y: number; d: number; t: number}> = ({x, y, d, t}) => {
  const sag = 3 + 2.6 * d;
  return (
    <g>
      {/* daun telinga */}
      <path d={`M${x - 95},${y - 70} q-26,70 0,140`} fill="none" stroke="#c9a28a" strokeWidth={9} strokeLinecap="round" />
      {/* liang telinga */}
      <rect x={x - 92} y={y - 28} width={112} height={56} rx={8} fill={C.water} opacity={0.35} />
      <line x1={x - 92} y1={y - 30} x2={x + 22} y2={y - 30} stroke="#c9a28a" strokeWidth={4} />
      <line x1={x - 92} y1={y + 30} x2={x + 22} y2={y + 30} stroke="#c9a28a" strokeWidth={4} />
      {/* telinga tengah (udara) */}
      <ellipse cx={x + 62} cy={y} rx={40} ry={46} fill="#1a2550" stroke="#5b6d9c" strokeWidth={2} />
      <Label x={x + 66} y={y + 64} size={18} color={C.muted}>
        udara
      </Label>
      {/* gendang telinga */}
      <path d={`M${x + 22},${y - 32} Q${x + 22 + sag * 2},${y} ${x + 22},${y + 32}`} fill="none" stroke={C.press} strokeWidth={4} />
      {[-15, 0, 15].map((o) => (
        <PressureArrow key={o} x={x + 20 + sag * 0.9 * (1 - (o / 32) ** 2)} y={y + o} nx={-1} ny={0} L={14 + 4.8 * d} width={3} />
      ))}
      <g opacity={ramp(d, 0, 1.5)}>
        <Ripple x={x + 24} y={y} p={(t * 0.5) % 1} r={40} color="press" rings={2} width={2} />
      </g>
    </g>
  );
};

/** Jejak putus-putus lintasan (dari cangkir ke dasar samudra). */
const DrawPath2: React.FC<{pts: [number, number][]; p: number}> = ({pts, p}) => {
  if (p <= 0) return null;
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0]},${q[1]}`).join(' ');
  return <path d={d} fill="none" stroke={C.press} strokeOpacity={0.35 * Math.min(1, p * 4)} strokeWidth={2.5} strokeDasharray="4 10" strokeLinejoin="round" />;
};
