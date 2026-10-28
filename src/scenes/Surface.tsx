import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Bubbles, WaterMolecule} from '../components/fluid';
import {Arrow, DrawPath, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Tegangan permukaan: kulit air.
// 1 anggang-anggang berjalan (lekukan bergerak bersama kaki) + jarum mengapung (bukan gaya apung).
// 2 molekul dalam (tarikan seimbang) vs molekul permukaan (resultan ke dalam) → kulit tegang.
// 3 γ = F/L pada garis potong di permukaan; γ air ≈ 0,072 N/m.
// 4 tetesan & gelembung bergoyang menuju bola (luas minimum).
// 5 lapisan sabun pada bingkai kawat dengan kawat geser: dua permukaan → F = 2γL.

const useGT = () => {
  const f = useCurrentFrame();
  const {fps} = useScene();
  return f / fps;
};

/* ================================================================== */
/* 1 — anggang-anggang & jarum                                          */
/* ================================================================== */
const Y0 = 600;
const X0 = 100;
const X1 = 1820;
const YB = 800;
const K = 1.5;
const NX = 1450;
const NL = 260;

type Dimple = {x: number; d: number; w: number};

const PhaseStrider: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const wave = (x: number) => 1.2 * Math.sin(x * 0.03 + gT * 1.8) + 0.8 * Math.sin(x * 0.071 - gT * 2.6);
  // anggang-anggang: meluncur dengan kayuhan kaki tengah (periode 1,3 dtk)
  const P = 1.3;
  const sw = Math.sin((2 * Math.PI * t) / P);
  const bx = 330 + 44 * t - 12 * Math.cos((2 * Math.PI * t) / P);
  const by = Y0 - 62 * K + 2 * Math.sin((4 * Math.PI * t) / P);
  const tips: {x: number; d: number; kneeX: number; kneeY: number; ax: number; ay: number}[] = [
    {x: bx + 128 * K, d: 8, kneeX: bx + 96 * K, kneeY: by - 26 * K, ax: bx + 50 * K, ay: by + 3 * K},
    {x: bx + (-34 + 30 * sw) * K, d: 13, kneeX: bx + (-4 + 14 * sw) * K, kneeY: by - 46 * K, ax: bx + 6 * K, ay: by + 6 * K},
    {x: bx - 172 * K, d: 11, kneeX: bx - 92 * K, kneeY: by - 40 * K, ax: bx - 26 * K, ay: by + 6 * K},
  ];
  // jarum diletakkan hati-hati dengan pinset
  const tN = wordOf(0, 'jarum');
  const lower = ramp(t, tN - 0.2, tN + 1.6, EASE_IN_OUT);
  const dN = 13 * ramp(t, tN + 1.2, tN + 2.0);
  const nIn = ramp(t, tN - 0.8, tN - 0.2);
  const dimples: Dimple[] = tips.map((p) => ({x: p.x, d: p.d, w: 20}));
  const ySurf = (x: number) => {
    let y = Y0 + wave(x);
    for (const dd of dimples) y += dd.d * Math.exp(-(((x - dd.x) / dd.w) ** 2));
    const ex = Math.max(0, Math.abs(x - NX) - NL / 2);
    y += dN * Math.exp(-((ex / 34) ** 2));
    return y;
  };
  const pts: string[] = [];
  for (let x = X0; x <= X1; x += 6) pts.push(`${x === X0 ? 'M' : 'L'}${x},${ySurf(x).toFixed(1)}`);
  const top = pts.join(' ');
  const body = `${top} L${X1},${YB} L${X0},${YB} Z`;
  const ny = mix(380, Y0 + wave(NX) - 4, lower) + dN;
  const lift = 140 * ramp(t, tN + 1.9, tN + 2.8, EASE_IN_OUT);
  const tweez = win(t, tN - 0.8, tN + 2.4, 0.5, 0.6);
  // baris 1: zoom ke jarum + gaya
  const zoom = ramp(t, cue(1) - 0.3, cue(1) + 1.2, EASE_IN_OUT);
  const zs = 1 + 0.4 * zoom;
  const forces = ramp(t, cue(1) + 0.6, cue(1) + 1.4);
  const ang = (34 * Math.PI) / 180;
  const exL = NX - NL / 2 - 4;
  const exR = NX + NL / 2 + 4;
  const yEdge = ny;
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          <linearGradient id="sf-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.water} stopOpacity={0.55} />
            <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
          </linearGradient>
          <linearGradient id="sf-needle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2f5ff" />
            <stop offset="100%" stopColor="#6b7698" />
          </linearGradient>
        </defs>
        <g transform={`translate(${NX} ${Y0}) scale(${zs}) translate(${-NX} ${-Y0})`}>
          {/* tanaman air di tepi kiri & daun teratai di kanan */}
          {[0, 1, 2, 3, 4].map((i) => {
            const rx = 130 + i * 22;
            const hgt = 230 + 50 * rand(i * 3.7);
            const sway = 12 * Math.sin(gT * 0.8 + i * 1.3);
            return <path key={i} d={`M${rx},${Y0 + 10} Q${rx + 8},${Y0 - hgt * 0.5} ${rx + 24 + sway},${Y0 - hgt}`} fill="none" stroke={i % 2 ? '#3f8f6a' : '#2f6f55'} strokeWidth={7 - i * 0.6} strokeLinecap="round" />;
          })}
          <ellipse cx={262 + 10 * Math.sin(gT * 0.8 + 3)} cy={Y0 - 236} rx={9} ry={26} fill="#8a5a32" />
          <path d={body} fill="url(#sf-water)" />
          {/* pantulan langit di bawah lekukan: bayangan bulat khas anggang-anggang di dasar */}
          {tips.map((p, i) => (
            <ellipse key={i} cx={p.x} cy={YB - 18} rx={20 + p.d} ry={6} fill="#000" opacity={0.25} />
          ))}
          <ellipse cx={NX} cy={YB - 18} rx={NL / 2 + 20} ry={7} fill="#000" opacity={0.25 * ramp(dN, 0, 13)} />
          {[0, 1, 2, 3].map((i) => {
            const cx = X0 + ((((i * 0.27 + gT * 0.025) % 1) + 1) % 1) * (X1 - X0);
            return <path key={i} d={`M${cx - 30},${Y0 + 10} L${cx + 40},${Y0 + 10} L${cx + 110},${YB} L${cx + 40},${YB} Z`} fill="#fff" opacity={0.035 + 0.02 * Math.sin(gT + i)} />;
          })}
          <Bubbles x={X0 + 20} y={Y0 + 30} w={X1 - X0 - 40} h={YB - Y0 - 50} n={7} seed={11} />
          <path d={top} fill="none" stroke="#cfeaff" strokeOpacity={0.8} strokeWidth={2.5} />
          <g transform={`translate(1735 ${Y0 + wave(1735) - 2})`}>
            <ellipse cx={0} cy={0} rx={78} ry={15} fill="#2f8f5a" stroke="#6fd49a" strokeWidth={2} />
            <path d="M0,0 L78,-3 L66,9 Z" fill="#0c1631" opacity={0.9} />
            <path d="M-50,-2 Q0,-10 40,-2" fill="none" stroke="#9af0c0" strokeWidth={1.5} opacity={0.5} />
          </g>
          {/* lekukan disorot */}
          {tips.map((p, i) => (
            <ellipse key={i} cx={p.x} cy={Y0 + p.d * 0.5} rx={26} ry={6} fill={C.cyan} opacity={0.2} />
          ))}
          {/* anggang-anggang */}
          <g>
            {tips.map((p, i) => (
              <path
                key={`far${i}`}
                d={`M${p.ax - 8},${p.ay} L${p.kneeX - 14},${p.kneeY + 6} L${p.x - 20},${ySurf(p.x - 20)}`}
                fill="none"
                stroke="#5a4a3a"
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.55}
              />
            ))}
            <g transform={`translate(${bx} ${by}) scale(${K})`}>
              <ellipse cx={0} cy={0} rx={72} ry={13} fill="#4a3a2c" stroke="#a88a6a" strokeWidth={1.5} />
              {[-40, -20, 0, 20].map((sx) => (
                <line key={sx} x1={sx} y1={-11} x2={sx + 6} y2={11} stroke="#2e241a" strokeWidth={1.2} opacity={0.6} />
              ))}
              <ellipse cx={-10} cy={-5} rx={40} ry={3.5} fill="#fff" opacity={0.18} />
              <circle cx={80} cy={-2} r={11} fill="#4a3a2c" stroke="#a88a6a" strokeWidth={1.5} />
              <circle cx={85} cy={-5} r={3} fill="#ffd9a0" />
              <path d={`M88,-8 q18,${-22 + 2 * Math.sin(gT * 3)} 40,-20 M86,-10 q10,${-26 + 2 * Math.sin(gT * 3 + 1)} 30,-30`} fill="none" stroke="#a88a6a" strokeWidth={1.5} />
            </g>
            {tips.map((p, i) => (
              <path
                key={`near${i}`}
                d={`M${p.ax},${p.ay} L${p.kneeX},${p.kneeY} L${p.x},${ySurf(p.x)}`}
                fill="none"
                stroke="#8a6e52"
                strokeWidth={5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
          </g>
          {/* jarum + pinset */}
          <g opacity={nIn}>
            <rect x={NX - NL / 2} y={ny - 5} width={NL} height={10} rx={5} fill="url(#sf-needle)" stroke="#dfe6f6" strokeWidth={1} />
            <path d={`M${NX + NL / 2 - 2},${ny - 5} L${NX + NL / 2 + 26},${ny} L${NX + NL / 2 - 2},${ny + 5} Z`} fill="#cfd8f0" />
            <ellipse cx={NX - NL / 2 + 16} cy={ny} rx={9} ry={3} fill="#0c1631" />
          </g>
          <g opacity={tweez}>
            <path d={`M${NX - 40},${ny - 230 - lift} L${NX - 8},${ny - 8 - lift}`} stroke="#c9d2e6" strokeWidth={7} strokeLinecap="round" />
            <path d={`M${NX + 40},${ny - 230 - lift} L${NX + 8},${ny - 8 - lift}`} stroke="#c9d2e6" strokeWidth={7} strokeLinecap="round" />
          </g>
          <Ripple x={NX} y={Y0} p={ramp(t, tN + 1.3, tN + 2.7, (q) => q)} r={220} color="cyan" rings={2} />
          {/* gaya pada jarum */}
          <g opacity={forces}>
            <Arrow x1={exL} y1={yEdge} x2={exL - 110 * Math.cos(ang)} y2={yEdge - 110 * Math.sin(ang)} color="cyan" width={5} />
            <Arrow x1={exR} y1={yEdge} x2={exR + 110 * Math.cos(ang)} y2={yEdge - 110 * Math.sin(ang)} color="cyan" width={5} />
            <Label x={exL - 110 * Math.cos(ang) - 14} y={yEdge - 110 * Math.sin(ang) - 16} size={30} color={C.cyan} anchor="end" weight={700} font="serif" italic>
              γ
            </Label>
            <Label x={exR + 110 * Math.cos(ang) + 14} y={yEdge - 110 * Math.sin(ang) - 16} size={30} color={C.cyan} anchor="start" weight={700} font="serif" italic>
              γ
            </Label>
            <Arrow x1={NX} y1={ny + 6} x2={NX} y2={ny + 92} color="force" width={5} />
            <Label x={NX + 22} y={ny + 80} size={26} color={C.force} anchor="start" weight={700}>
              W
            </Label>
          </g>
        </g>
        <Motes x={960} y={Y0 - 60} rx={760} ry={140} n={20} color="cyan" opacity={0.35} seed={3} />
      </Stage>
      <Note x={1400} y={245} p={ramp(t, cue(1) + 0.2, cue(1) + 1.0)} color={C.cyan} size={32}>
        <span style={{color: C.muted, textDecoration: 'line-through', textDecorationColor: C.heat, textDecorationThickness: 3}}>gaya apung</span>
        <span style={{color: C.muted, margin: '0 14px'}}>→</span>
        <Tint c={C.cyan}>tegangan permukaan</Tint>
      </Note>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* 2 — molekul dalam vs permukaan                                       */
/* ================================================================== */
const COLS = 8;
const ROWS = 4;
const GX0 = 290;
const GY0 = 420;
const SP = 118;
const IN = {c: 2, r: 2};
const SU = {c: 5, r: 0};

const PhaseMolecules: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const pos = (c: number, r: number): [number, number] => [
    GX0 + c * SP + 5 * Math.sin(gT * 2.1 + c * 1.7 + r * 2.3),
    GY0 + r * SP + 4 * Math.sin(gT * 1.8 + c * 2.9 + r * 1.1) + (r === 0 ? 3 * Math.sin(gT * 1.2 + c * 0.8) : 0),
  ];
  const inP = ramp(t, cue(2) + 0.6, cue(2) + 1.6);
  const inArr = win(t, cue(2) + 1.0, cue(3) + 0.6, 0.7, 0.7);
  const suP = ramp(t, cue(3) + 0.3, cue(3) + 1.3);
  const suArr = ramp(t, cue(3) + 0.8, cue(3) + 1.8);
  const tIn = wordOf(3, 'dalam');
  const res = ramp(t, tIn - 0.2, tIn + 0.7);
  const tK = wordOf(3, 'kulit');
  const skin = ramp(t, tK - 0.6, tK + 1.2, EASE_IN_OUT);
  const [ix, iy] = pos(IN.c, IN.r);
  const [sx, sy] = pos(SU.c, SU.r);
  const topRow = Array.from({length: COLS}, (_, c) => pos(c, 0));
  const skinPts: [number, number][] = [[GX0 - 70, topRow[0][1] - 26], ...topRow.map(([x, y]) => [x, y - 26] as [number, number]), [GX0 + (COLS - 1) * SP + 70, topRow[COLS - 1][1] - 26]];
  const skinD = skinPts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const dirs8 = Array.from({length: 8}, (_, k) => (k * Math.PI) / 4);
  const dirsS = [0, Math.PI, Math.PI / 2, Math.PI / 4, (3 * Math.PI) / 4];
  const tramp = ramp(t, tK - 0.2, tK + 0.8);
  const ballY = 600 + 10 * Math.sin(gT * 2.2);
  const dip = 30 + 10 * Math.sin(gT * 2.2);
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        {/* udara di atas, air di bawah */}
        <rect x={GX0 - 110} y={GY0 - 60} width={COLS * SP + 116} height={ROWS * SP + 40} rx={18} fill={C.water} opacity={0.12} />
        <line x1={GX0 - 110} y1={GY0 - 60} x2={GX0 + (COLS - 1) * SP + 110} y2={GY0 - 60} stroke="#cfeaff" strokeOpacity={0.5} strokeWidth={2} strokeDasharray="10 8" strokeDashoffset={-gT * 10} />
        <Label x={GX0 - 90} y={GY0 - 100} size={24} color={C.muted} anchor="start">
          udara
        </Label>
        <Label x={GX0 - 90} y={GY0 - 30} size={24} color={C.water} anchor="start">
          air
        </Label>
        {/* kulit tegang */}
        <DrawPath d={skinD} p={skin} stroke={C.cyan} width={5} halo opacity={0.85} />
        <Glow x={ix} y={iy} r={110} color="cyan" opacity={inP * 0.8} />
        <Glow x={sx} y={sy} r={110} color="force" opacity={suP * 0.7} />
        {Array.from({length: ROWS}, (_, r) =>
          Array.from({length: COLS}, (_, c) => {
            const [x, y] = pos(c, r);
            const hi = (c === IN.c && r === IN.r) || (c === SU.c && r === SU.r);
            return <WaterMolecule key={`${c}-${r}`} x={x} y={y} s={0.86} rot={20 * Math.sin(gT * (0.9 + rand(c * 7 + r) * 0.8) + c + r * 2)} opacity={hi ? 1 : 0.62} />;
          }),
        )}
        {/* tarikan pada molekul dalam: seimbang */}
        <g opacity={inArr}>
          {dirs8.map((a, k) => (
            <Arrow key={k} x1={ix + 26 * Math.cos(a)} y1={iy + 26 * Math.sin(a)} x2={ix + 70 * Math.cos(a)} y2={iy + 70 * Math.sin(a)} color="cyan" width={4} pulse={false} />
          ))}
        </g>
        {/* molekul permukaan: tarikan hanya ke samping & bawah */}
        <g opacity={suArr * (1 - 0.45 * res)}>
          {dirsS.map((a, k) => (
            <Arrow key={k} x1={sx + 26 * Math.cos(a)} y1={sy + 26 * Math.sin(a)} x2={sx + 70 * Math.cos(a)} y2={sy + 70 * Math.sin(a)} color="cyan" width={4} pulse={false} />
          ))}
        </g>
        <g opacity={res}>
          <Arrow x1={sx + 36} y1={sy + 10} x2={sx + 36} y2={sy + 132} color="force" width={7} />
        </g>
        <Label x={sx} y={GY0 - 100} size={24} color={C.muted} opacity={suArr * (1 - res)}>
          tak ada tetangga di atas
        </Label>
        <Label x={sx} y={GY0 - 100} size={26} color={C.force} weight={700} opacity={res}>
          resultan ke dalam ↓
        </Label>
        {/* sisipan: satu molekul dalam diperbesar */}
        <g opacity={win(t, cue(2) + 1.6, cue(3) - 0.1, 0.7, 0.6)}>
          <Glow x={1530} y={610} r={170} color="cyan" opacity={0.6} />
          {dirs8.map((a, k) => {
            const L = 120 + 6 * Math.sin(gT * 3);
            return <Arrow key={k} x1={1530 + 44 * Math.cos(a)} y1={610 + 44 * Math.sin(a)} x2={1530 + L * Math.cos(a)} y2={610 + L * Math.sin(a)} color="cyan" width={5} pulse={false} />;
          })}
          <WaterMolecule x={1530} y={606} s={1.5} rot={15 * Math.sin(gT * 1.2)} />
          <Label x={1530} y={780} size={30} color={C.cyan} weight={700}>
            ΣF = 0
          </Label>
        </g>
        {/* analogi: membran tegang dengan bola */}
        <g opacity={tramp}>
          <line x1={1350} y1={600} x2={1350} y2={680} stroke={C.muted} strokeWidth={4} />
          <line x1={1710} y1={600} x2={1710} y2={680} stroke={C.muted} strokeWidth={4} />
          <path d={`M1350,600 Q1530,${600 + dip * 2} 1710,600`} fill="none" stroke={C.cyan} strokeWidth={5} />
          <path d={`M1350,600 Q1530,${600 + dip * 2} 1710,600`} fill="none" stroke={C.cyan} strokeOpacity={0.25} strokeWidth={16} />
          <circle cx={1530} cy={ballY + dip - 34} r={30} fill="url(#ball)" stroke="#9aa6d6" strokeWidth={2} />
          <Label x={1530} y={740} size={26} color={C.cyan} weight={600}>
            seperti kulit yang tegang
          </Label>
        </g>
        <Motes x={GX0 + 360} y={GY0 + 150} rx={460} ry={230} n={18} color="cyan" opacity={0.35} seed={5} />
      </Stage>
      <Note x={1530} y={330} p={win(t, cue(2) + 0.8, cue(3) - 0.1, 0.7, 0.5)} color={C.cyan} size={28}>
        di dalam: tarikan ke segala arah → <Tint c={C.cyan}>seimbang</Tint>
      </Note>
      <Note x={1530} y={330} p={ramp(t, cue(3) + 0.5, cue(3) + 1.3)} color={C.force} size={28}>
        di permukaan: tertarik <Tint c={C.force}>ke dalam</Tint>
      </Note>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* 3 — γ = F/L                                                          */
/* ================================================================== */
const PhaseGamma: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const sheet = ramp(t, cue(4) - 0.4, cue(4) + 0.6);
  const cut = ramp(t, cue(4) + 0.6, cue(4) + 1.6);
  const arr = ramp(t, wordOf(4, 'gaya') - 0.2, wordOf(4, 'gaya') + 0.6);
  const f1 = ramp(t, cue(4) + 0.4, cue(4) + 1.2);
  const tV = wordOf(4, 'nol');
  const val = ramp(t, tV - 0.2, tV + 0.6);
  const poly = 'M330,410 L1010,410 L1100,770 L240,770 Z';
  const xs = [450, 510, 570, 630, 690, 750, 810, 870];
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          <linearGradient id="sf-sheet" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.water} stopOpacity={0.18} />
            <stop offset="100%" stopColor={C.water} stopOpacity={0.45} />
          </linearGradient>
          <clipPath id="sf-sheet-c">
            <path d={poly} />
          </clipPath>
        </defs>
        <g opacity={sheet}>
          <path d={poly} fill="url(#sf-sheet)" stroke="#cfeaff" strokeOpacity={0.6} strokeWidth={2.5} />
          <g clipPath="url(#sf-sheet-c)">
            {Array.from({length: 7}, (_, i) => {
              const y = 430 + i * 52 + ((gT * 14) % 52);
              const amp = 4 + (y - 410) * 0.012;
              const d = Array.from({length: 25}, (_, k) => {
                const x = 220 + k * 37;
                return `${k ? 'L' : 'M'}${x},${(y + amp * Math.sin(x * 0.02 + gT * 1.5 + i)).toFixed(1)}`;
              }).join(' ');
              return <path key={i} d={d} fill="none" stroke="#cfeaff" strokeWidth={1.5} opacity={0.18 * cyc(((gT * 14) % 52) / 52 * 0.2 + i / 7 * 0.8 + 0.1)} />;
            })}
          </g>
          <Label x={670} y={385} size={24} color={C.muted}>
            permukaan air
          </Label>
        </g>
        {/* garis potong sepanjang L */}
        <g opacity={cut}>
          <line x1={420} y1={590} x2={420 + 480 * cut} y2={590} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
          <line x1={420} y1={590} x2={420 + 480 * cut} y2={590} stroke={C.cyan} strokeOpacity={0.3} strokeWidth={16} strokeLinecap="round" />
          <line x1={420} y1={735} x2={900} y2={735} stroke={C.ink} strokeWidth={2.5} />
          <line x1={420} y1={722} x2={420} y2={748} stroke={C.ink} strokeWidth={2.5} />
          <line x1={900} y1={722} x2={900} y2={748} stroke={C.ink} strokeWidth={2.5} />
          <Label x={660} y={735} size={32} color={C.ink} weight={700} font="serif" italic>
            L
          </Label>
        </g>
        <g opacity={arr}>
          {xs.map((x, i) => {
            const pul = 1 + 0.12 * Math.sin(gT * 4 + i);
            return (
              <g key={i}>
                <Arrow x1={x} y1={578} x2={x} y2={578 - 70 * pul} color="cyan" width={4} pulse={false} />
                <Arrow x1={x} y1={602} x2={x} y2={602 + 70 * pul} color="cyan" width={4} pulse={false} />
              </g>
            );
          })}
          <Label x={930} y={500} size={30} color={C.cyan} anchor="start" weight={700} font="serif" italic>
            F
          </Label>
          <Label x={930} y={680} size={30} color={C.cyan} anchor="start" weight={700} font="serif" italic>
            F
          </Label>
        </g>
        <Twinkles x={1480} y={610} rx={260} ry={40} n={4} opacity={val} seed={4} />
        <Motes x={670} y={590} rx={420} ry={200} n={16} color="cyan" opacity={0.35} seed={8} />
      </Stage>
      <Formula x={1480} y={400} p={f1} accent={C.cyan} size={64} caption="gaya per satuan panjang (N/m)">
        <V color={C.cyan}>γ</V> = <Frac n={<V>F</V>} d={<V>L</V>} />
      </Formula>
      <Note x={1480} y={610} p={val} color={C.cyan} size={32}>
        air, suhu kamar: <Tint c={C.cyan}>γ ≈ 0,072 N/m</Tint>
      </Note>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* 4 — tetesan & gelembung menuju bola                                  */
/* ================================================================== */
const blob = (cx: number, cy: number, R: number, a: number, b: number, ph: number) => {
  const n = 72;
  return (
    Array.from({length: n}, (_, i) => {
      const th = (i / n) * 2 * Math.PI;
      const r = R * (1 + 0.3 * a * Math.cos(2 * th) + 0.07 * b * Math.cos(3 * th + ph));
      return `${i ? 'L' : 'M'}${(cx + r * Math.cos(th)).toFixed(1)},${(cy + r * Math.sin(th)).toFixed(1)}`;
    }).join(' ') + ' Z'
  );
};

const PhaseSphere: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const tRel = wordOf(5, 'Karena');
  const stretch = ramp(t, cue(5) + 0.3, cue(5) + 2.4, EASE_IN_OUT);
  const tau = t - tRel;
  const osc = tau <= 0 ? 1 : Math.exp(-tau / 1.6) * Math.cos(3.2 * tau);
  const a = stretch * osc;
  const b = (tau <= 0 ? 0.6 * stretch : Math.exp(-tau / 1.2) * 0.8) * Math.sin(gT * 4);
  const dx = 560;
  const dy = 500 + 6 * Math.sin(gT * 0.9);
  const pull = win(t, cue(5) + 0.2, tRel + 0.1, 0.5, 0.3);
  const R = 120;
  const tB = wordOf(5, 'gelembung');
  const bIn = ramp(t, tB - 0.4, tB + 0.4);
  const btau = t - tB;
  const ba = btau <= 0 ? 0.9 : 0.9 * Math.exp(-btau / 1.4) * Math.cos(3 * btau);
  const bx = 1390 + 14 * Math.sin(gT * 0.5);
  const byy = 500 - 10 * Math.sin(gT * 0.7);
  const BR = 140;
  const note = ramp(t, wordOf(5, 'bentuk') - 0.2, wordOf(5, 'bentuk') + 0.6);
  const rel = ramp(t, tRel, tRel + 1.4, (q) => q);
  // luas permukaan (keliling) relatif terhadap bola
  const per = (aa: number) => {
    let s = 0;
    let px = 0;
    let py = 0;
    for (let i = 0; i <= 48; i++) {
      const th = (i / 48) * 2 * Math.PI;
      const r = 1 + 0.3 * aa * Math.cos(2 * th);
      const x = r * Math.cos(th);
      const y = r * Math.sin(th);
      if (i) s += Math.hypot(x - px, y - py);
      px = x;
      py = y;
    }
    return s / (2 * Math.PI);
  };
  const areaRel = per(Math.abs(a));
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          <radialGradient id="sf-drop" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#d8f0ff" stopOpacity={0.95} />
            <stop offset="35%" stopColor={C.water} stopOpacity={0.85} />
            <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
          </radialGradient>
          <linearGradient id="sf-irid" x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${(gT * 30) % 360} 0.5 0.5)`}>
            <stop offset="0%" stopColor="#ff7ad9" />
            <stop offset="25%" stopColor="#ffd24a" />
            <stop offset="50%" stopColor="#5ef0b0" />
            <stop offset="75%" stopColor="#4fd6ff" />
            <stop offset="100%" stopColor="#b77dff" />
          </linearGradient>
        </defs>
        {/* tetesan air */}
        <Glow x={dx} y={dy} r={260} color="water" opacity={0.5} />
        <path d={blob(dx, dy, R, a, b, gT)} fill="url(#sf-drop)" stroke="#cfeaff" strokeWidth={2.5} />
        <ellipse cx={dx - R * 0.38} cy={dy - R * 0.42} rx={R * 0.22} ry={R * 0.12} fill="#fff" opacity={0.55} transform={`rotate(-30 ${dx - R * 0.38} ${dy - R * 0.42})`} />
        <g opacity={pull}>
          <Arrow x1={dx + R * (1 + 0.3 * a) + 10} y1={dy} x2={dx + R * (1 + 0.3 * a) + 120} y2={dy} color="work" width={6} />
          <Arrow x1={dx - R * (1 + 0.3 * a) - 10} y1={dy} x2={dx - R * (1 + 0.3 * a) - 120} y2={dy} color="work" width={6} />
          <Label x={dx} y={dy - R - 70} size={28} color={C.work} weight={600}>
            perlu usaha untuk memperluas
          </Label>
        </g>
        <Ripple x={dx} y={dy} p={rel} r={260} color="cyan" rings={2} />
        <Label x={dx} y={720} size={28} color={C.ink} weight={600}>
          tetesan air
        </Label>
        {/* pengukur luas permukaan */}
        <g transform="translate(960 340)">
          <rect x={0} y={0} width={22} height={300} rx={11} fill="#1a2550" stroke={C.line} strokeWidth={2} />
          <rect x={0} y={300 - 300 * Math.min(1, (areaRel - 0.95) / 0.35)} width={22} height={300 * Math.min(1, (areaRel - 0.95) / 0.35)} rx={11} fill={C.work} />
          <line x1={-8} y1={300 - 300 * (0.05 / 0.35)} x2={30} y2={300 - 300 * (0.05 / 0.35)} stroke={C.cyan} strokeWidth={3} />
          <Label x={11} y={-26} size={22} color={C.muted}>
            luas
          </Label>
          <Label x={40} y={300 - 300 * (0.05 / 0.35)} size={20} color={C.cyan} anchor="start">
            bola
          </Label>
        </g>
        {/* gelembung sabun */}
        <g opacity={bIn}>
          <Glow x={bx} y={byy} r={240} color="cyan" opacity={0.3} />
          <path d={blob(bx, byy, BR, ba, 0.4 * ba, gT * 1.3)} fill="#bfe0ff" fillOpacity={0.06} stroke="url(#sf-irid)" strokeWidth={5} />
          <path d={blob(bx, byy, BR - 8, ba, 0.4 * ba, gT * 1.3)} fill="none" stroke="url(#sf-irid)" strokeWidth={2} opacity={0.4} />
          <path d={`M${bx - BR * 0.62},${byy - BR * 0.3} A${BR * 0.7},${BR * 0.7} 0 0 1 ${bx - BR * 0.1},${byy - BR * 0.68}`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.6} />
          <circle cx={bx + BR * 0.45} cy={byy + BR * 0.4} r={8} fill="#fff" opacity={0.4} />
          <Label x={1390} y={720} size={28} color={C.ink} weight={600}>
            gelembung sabun
          </Label>
        </g>
        <Twinkles x={960} y={800} rx={300} ry={20} n={3} opacity={note} seed={6} />
        <Motes x={960} y={500} rx={700} ry={240} n={20} color="cyan" opacity={0.35} seed={9} />
      </Stage>
      <Note x={960} y={810} p={note} color={C.cyan} size={30}>
        bola = bentuk dengan <Tint c={C.cyan}>luas permukaan terkecil</Tint>
      </Note>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* 5 — lapisan sabun pada bingkai kawat: F = 2γL                        */
/* ================================================================== */
const FX0 = 260;
const FY0 = 320;
const FY1 = 680;

const PhaseFilm: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const xs = 740 + 70 * Math.sin((t - cue(6)) * 0.9);
  const film = ramp(t, cue(6) - 0.2, cue(6) + 1.0);
  const two = ramp(t, wordOf(6, 'dua') - 0.2, wordOf(6, 'dua') + 0.6);
  const sideP = ramp(t, wordOf(6, 'depan') - 0.3, wordOf(6, 'depan') + 0.5);
  const f = ramp(t, wordOf(6, 'gamma') - 0.3, wordOf(6, 'gamma') + 0.5);
  const L = FY1 - FY0;
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          <linearGradient id="sf-film" x1="0" y1="0" x2="1" y2="1" gradientTransform={`rotate(${20 * Math.sin(gT * 0.4)} 0.5 0.5)`}>
            <stop offset="0%" stopColor="#ff7ad9" stopOpacity={0.35} />
            <stop offset="30%" stopColor="#ffd24a" stopOpacity={0.25} />
            <stop offset="55%" stopColor="#5ef0b0" stopOpacity={0.3} />
            <stop offset="80%" stopColor="#4fd6ff" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#b77dff" stopOpacity={0.35} />
          </linearGradient>
          <clipPath id="sf-film-c">
            <rect x={FX0} y={FY0} width={Math.max(1, xs - FX0)} height={L} />
          </clipPath>
        </defs>
        {/* lapisan sabun */}
        <g opacity={film}>
          <rect x={FX0} y={FY0} width={xs - FX0} height={L} fill="url(#sf-film)" />
          <g clipPath="url(#sf-film-c)">
            {Array.from({length: 6}, (_, i) => {
              const y = FY0 + 30 + i * 58 + 10 * Math.sin(gT * 0.8 + i);
              const d = Array.from({length: 14}, (_, k) => {
                const x = FX0 + k * 50;
                return `${k ? 'L' : 'M'}${x},${(y + 14 * Math.sin(x * 0.012 + gT * 0.9 + i * 1.3)).toFixed(1)}`;
              }).join(' ');
              return <path key={i} d={d} fill="none" stroke={['#ff7ad9', '#ffd24a', '#5ef0b0', '#4fd6ff', '#b77dff', '#ffffff'][i]} strokeWidth={3} opacity={0.22} />;
            })}
          </g>
        </g>
        {/* bingkai kawat U */}
        <path d={`M${xs + 160},${FY0} L${FX0},${FY0} L${FX0},${FY1} L${xs + 160},${FY1}`} fill="none" stroke="#c9d2e6" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
        <line x1={FX0 - 4} y1={FY0 + 6} x2={xs + 150} y2={FY0 + 6} stroke="#fff" strokeOpacity={0.3} strokeWidth={2} />
        {/* kawat geser */}
        <line x1={xs} y1={FY0 - 22} x2={xs} y2={FY1 + 22} stroke="#e8edf8" strokeWidth={9} strokeLinecap="round" />
        <Glow x={xs} y={(FY0 + FY1) / 2} r={120} color="cyan" opacity={0.35 * film} />
        {/* gaya: lapisan menarik ke kiri, tangan menarik ke kanan */}
        <g opacity={f}>
          <Arrow x1={xs - 12} y1={(FY0 + FY1) / 2} x2={xs - 190} y2={(FY0 + FY1) / 2} color="cyan" width={7} />
          <Label x={xs - 110} y={(FY0 + FY1) / 2 - 36} size={32} color={C.cyan} weight={700} font="serif" italic>
            2γL
          </Label>
          <Arrow x1={xs + 12} y1={(FY0 + FY1) / 2 + 60} x2={xs + 150} y2={(FY0 + FY1) / 2 + 60} color="force" width={6} />
          <Label x={xs + 160} y={(FY0 + FY1) / 2 + 60} size={30} color={C.force} anchor="start" weight={700} font="serif" italic>
            F
          </Label>
        </g>
        {/* ukuran L */}
        <g opacity={film}>
          <line x1={xs + 40} y1={FY0} x2={xs + 40} y2={FY1} stroke={C.ink} strokeWidth={2.5} strokeDasharray="8 6" />
          <Label x={xs + 58} y={FY0 + 50} size={32} color={C.ink} anchor="start" weight={700} font="serif" italic>
            L
          </Label>
        </g>
        {/* penampang: dua permukaan */}
        <g opacity={two}>
          <rect x={1170} y={560} width={620} height={230} rx={18} fill="#0c1631" stroke={C.line} strokeWidth={2} />
          <Label x={1480} y={590} size={22} color={C.muted} spacing={2}>
            PENAMPANG LAPISAN
          </Label>
          <rect x={1260} y={652} width={380} height={46} fill="url(#sf-film)" />
          <line x1={1260} y1={652} x2={1640} y2={652 + 2 * Math.sin(gT * 2)} stroke={C.cyan} strokeWidth={4} />
          <line x1={1260} y1={698} x2={1640} y2={698 + 2 * Math.sin(gT * 2 + 1)} stroke={C.cyan} strokeWidth={4} />
          <circle cx={1660} cy={675} r={26} fill="#e8edf8" stroke="#9aa6c8" strokeWidth={2} />
          <g opacity={sideP}>
            <Arrow x1={1600} y1={652} x2={1460} y2={652} color="cyan" width={4} pulse={false} />
            <Arrow x1={1600} y1={698} x2={1460} y2={698} color="cyan" width={4} pulse={false} />
            <Label x={1250} y={636} size={22} color={C.cyan} anchor="end">
              depan
            </Label>
            <Label x={1250} y={714} size={22} color={C.cyan} anchor="end">
              belakang
            </Label>
            <Label x={1430} y={628} size={24} color={C.cyan} anchor="end" font="serif" italic>
              γL
            </Label>
            <Label x={1430} y={726} size={24} color={C.cyan} anchor="end" font="serif" italic>
              γL
            </Label>
          </g>
        </g>
        <Twinkles x={1480} y={350} rx={220} ry={50} n={4} opacity={f} seed={12} />
        <Motes x={560} y={500} rx={420} ry={220} n={16} color="cyan" opacity={0.35} seed={10} />
      </Stage>
      <Formula x={1480} y={350} p={f} accent={C.cyan} size={66} caption="dua permukaan: depan + belakang">
        <V>F</V> = 2<V color={C.cyan}>γ</V>
        <V>L</V>
      </Formula>
    </AbsoluteFill>
  );
};

export const Surface: React.FC = () => {
  const {t, cue} = useScene();
  const p1 = 1 - ramp(t, cue(2) - 0.6, cue(2) + 0.1, EASE_IN_OUT);
  const p2 = win(t, cue(2) - 0.5, cue(4) - 0.6, 0.7, 0.6);
  const p3 = win(t, cue(4) - 0.5, cue(5) - 0.6, 0.7, 0.6);
  const p4 = win(t, cue(5) - 0.5, cue(6) - 0.6, 0.7, 0.6);
  const p5 = ramp(t, cue(6) - 0.5, cue(6) + 0.3);
  return (
    <AbsoluteFill>
      <PhaseStrider op={p1} />
      <PhaseMolecules op={p2} />
      <PhaseGamma op={p3} />
      <PhaseSphere op={p4} />
      <PhaseFilm op={p5} />
    </AbsoluteFill>
  );
};

