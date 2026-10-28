import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, rand, ramp, win} from '../anim';
import {PressureArrow, Water} from '../components/fluid';
import {Crate, Ground, Person, fmt} from '../components/physics';
import {Arrow, Badge, Formula, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Fase A (baris 0): bumi & lautan udara. Fase B (1–2): kolom udara di atas kepala, 10 ton per m², tubuh mendorong balik.
// Fase C (3–4): skala tekanan mutlak vs ukur, ban 2,2 bar ukur = 3,2 bar mutlak.
// Fase D (5–6): penyelam; tiap 10 m air +100 kPa (ρgh = 1000·10·10), 10 m → 200 kPa = 2× permukaan.

type P = [number, number];
const EC: P = [960, 2500];
const ER = 1800;
const ATM = 360; // tebal lapisan udara yang digambar (dilebih-lebihkan, ≈ 6 px/km)
const MOLS = Array.from({length: 150}, (_, i) => {
  const u = rand(i * 3.1 + 1);
  const H = 85;
  return {
    h: -H * Math.log(1 - u * (1 - Math.exp(-ATM / H))),
    a0: rand(i * 7.7 + 2) * 0.9,
    sp: 0.004 + 0.006 * rand(i * 1.3 + 4),
    r: 1.4 + 1.8 * rand(i * 5.2 + 3),
  };
});

// skala tekanan (fase C): 0 bar di y=800, 140 px per bar
const PB0 = 800;
const PPX = 140;
const yBar = (b: number) => PB0 - b * PPX;

// fase D: permukaan air y=250, 28 px per meter
const WS = 250;
const MPX = 28;

const polar = (cx: number, cy: number, r: number, deg: number): P => [cx + r * Math.cos((deg * Math.PI) / 180), cy - r * Math.sin((deg * Math.PI) / 180)];

/** Jarum ukur bundar: 0..max memetakan 210° → −30° (searah jarum jam lewat atas). */
const Dial: React.FC<{x: number; y: number; r: number; v: number; max: number; ticks: number[]; minor?: number; unit: string; t: number; opacity?: number; tickFmt?: (v: number) => string}> = ({
  x,
  y,
  r,
  v,
  max,
  ticks,
  minor = 0,
  unit,
  t,
  opacity = 1,
  tickFmt = (k) => String(k),
}) => {
  if (opacity <= 0.001) return null;
  const ang = (val: number) => 210 - (240 * Math.max(0, Math.min(max * 1.02, val))) / max;
  const vv = v + max * 0.004 * Math.sin(t * 9) * Math.min(1, v / (max * 0.05));
  const a0 = polar(x, y, r * 0.86, ang(0));
  const a1 = polar(x, y, r * 0.86, ang(vv));
  const large = (240 * vv) / max > 180 ? 1 : 0;
  const nMinor = minor ? Math.round(max / minor) : 0;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y + 8} r={r + 8} fill="#000" opacity={0.35} />
      <circle cx={x} cy={y} r={r + 8} fill="#18244a" stroke={C.muted} strokeWidth={3} />
      <circle cx={x} cy={y} r={r} fill="#0b1430" stroke={C.faint} strokeWidth={2} />
      <path d={`M${polar(x, y, r * 0.86, 210).join(',')} A${r * 0.86},${r * 0.86} 0 1 1 ${polar(x, y, r * 0.86, -30).join(',')}`} fill="none" stroke={C.faint} strokeWidth={10} strokeLinecap="round" />
      {vv > max * 0.005 ? <path d={`M${a0.join(',')} A${r * 0.86},${r * 0.86} 0 ${large} 1 ${a1.join(',')}`} fill="none" stroke={C.press} strokeWidth={10} strokeLinecap="round" opacity={0.85} /> : null}
      {Array.from({length: nMinor + 1}, (_, i) => {
        const a = ang(i * minor);
        const p1 = polar(x, y, r * 0.95, a);
        const p2 = polar(x, y, r * 0.88, a);
        return <line key={`m${i}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={C.muted} strokeWidth={2} />;
      })}
      {ticks.map((k) => {
        const a = ang(k);
        const p1 = polar(x, y, r * 0.97, a);
        const p2 = polar(x, y, r * 0.8, a);
        const pl = polar(x, y, r * 0.64, a);
        return (
          <g key={k}>
            <line x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={C.ink} strokeWidth={3} />
            <Label x={pl[0]} y={pl[1]} size={r * 0.16} font="mono" color={C.ink}>
              {tickFmt(k)}
            </Label>
          </g>
        );
      })}
      <Label x={x} y={y + r * 0.52} size={r * 0.15} color={C.muted} font="mono">
        {unit}
      </Label>
      {(() => {
        const tip = polar(x, y, r * 0.84, ang(vv));
        const tail = polar(x, y, -r * 0.16, ang(vv));
        return (
          <g>
            <line x1={tail[0]} y1={tail[1]} x2={tip[0]} y2={tip[1]} stroke={C.press} strokeWidth={6} strokeLinecap="round" />
            <circle cx={x} cy={y} r={r * 0.09} fill={C.ink} />
            <circle cx={tip[0]} cy={tip[1]} r={9} fill="url(#soft-press)" />
          </g>
        );
      })()}
      <path d={`M${x - r * 0.7},${y - r * 0.55} Q${x},${y - r * 1.05} ${x + r * 0.7},${y - r * 0.55}`} fill="none" stroke="#fff" strokeOpacity={0.07} strokeWidth={r * 0.18} strokeLinecap="round" />
    </g>
  );
};

/** Penyelam tegak sederhana dengan tabung, masker, dan kaki katak yang mengayuh. */
const Diver: React.FC<{x: number; y: number; t: number; s?: number}> = ({x, y, t, s = 1}) => {
  const k = Math.sin(t * 3.2);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-40} y={-74} width={24} height={84} rx={11} fill="#d9a83a" stroke="#ffe08a" strokeWidth={2} />
      <rect x={-36} y={-66} width={6} height={60} rx={3} fill="#fff" opacity={0.25} />
      {[-1, 1].map((side) => {
        const sw = side * k * 10;
        const fx = side * 10 + sw;
        return (
          <g key={side}>
            <path d={`M${side * 7},${12} L${fx},${86}`} stroke="#1d2f62" strokeWidth={15} strokeLinecap="round" />
            <path d={`M${fx - 9},${84} L${fx + 9},${84} L${fx + 16 + sw * 0.6},${120} L${fx - 16 + sw * 0.6},${120} Z`} fill={C.cyan} opacity={0.9} />
          </g>
        );
      })}
      <rect x={-18} y={-76} width={38} height={94} rx={17} fill="#1d2f62" stroke={C.cyan} strokeWidth={2.5} />
      <path d={`M14,-62 Q${40 + k * 4},-40 ${30 + k * 6},-14`} stroke="#1d2f62" strokeWidth={12} strokeLinecap="round" fill="none" />
      <circle cx={2} cy={-96} r={19} fill="#f0cfa8" />
      <rect x={2} y={-108} width={23} height={15} rx={6} fill="#9fe3ff" stroke="#e8f8ff" strokeWidth={2} opacity={0.95} />
      <path d={`M-28,-74 Q-30,-104 -8,-112`} stroke="#3a4770" strokeWidth={4} fill="none" />
      <circle cx={18} cy={-86} r={5} fill="#3a4770" />
    </g>
  );
};

export const Atmosphere: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  // ---------- fase ----------
  const zoomE = ramp(t, cue(1) - 0.6, cue(1) + 1.3, EASE_IN_OUT);
  const A = 1 - ramp(t, cue(1) - 0.1, cue(1) + 1.1, EASE_IN_OUT);
  const B = ramp(t, cue(1) + 0.5, cue(1) + 1.5) * (1 - ramp(t, cue(3) - 0.5, cue(3) + 0.3, EASE_IN_OUT));
  const Cp = ramp(t, cue(3) + 0.1, cue(3) + 0.9) * (1 - ramp(t, cue(5) - 0.5, cue(5) + 0.3, EASE_IN_OUT));
  const D = ramp(t, cue(5) + 0.1, cue(5) + 0.9);

  // ---------- fase A ----------
  const aIn = ramp(t, -0.6, 1.0);
  const zFade = 1 - ramp(t, cue(1) - 0.7, cue(1) - 0.1, EASE_IN_OUT);
  const label0 = ramp(t, wordOf(0, 'lautan') - 0.2, wordOf(0, 'lautan') + 0.6) * zFade;
  const thick = ramp(t, wordOf(0, 'setebal') - 0.2, wordOf(0, 'setebal') + 0.9);
  const scaleVis = thick * zFade;
  const zs = 1 + 2.6 * zoomE;
  const ZP: P = [960, 690];

  // ---------- fase B ----------
  const colP = ramp(t, wordOf(1, 'udara') - 0.4, wordOf(1, 'udara') + 1.2, EASE_IN_OUT);
  const fAtm = ramp(t, wordOf(1, 'seratus') - 0.3, wordOf(1, 'seratus') + 0.6);
  const fTon = ramp(t, wordOf(2, 'sepuluh') - 0.2, wordOf(2, 'sepuluh') + 0.6);
  const tLand = wordOf(2, 'meter') + 0.2;
  const crateA = ramp(t, wordOf(2, 'beban') - 0.4, wordOf(2, 'beban') + 0.2);
  const crateDrop = ramp(t, wordOf(2, 'beban') - 0.2, tLand, (x) => x * x);
  const crateY = mix(470, 780, crateDrop) + (t > tLand ? -6 * Math.exp(-(t - tLand) * 5) * Math.sin((t - tLand) * 22) : 0);
  const bal = ramp(t, wordOf(2, 'gepeng') - 0.3, wordOf(2, 'gepeng') + 0.7);
  const balIn = ramp(t, wordOf(2, 'dalam') - 0.2, wordOf(2, 'dalam') + 0.7);
  const breathe = 1 + 0.015 * Math.sin(t * 1.6);

  // ---------- fase C ----------
  const sAbs = ramp(t, wordOf(3, 'mutlak') - 0.2, wordOf(3, 'mutlak') + 0.6);
  const vac = ramp(t, wordOf(3, 'hampa') - 0.3, wordOf(3, 'hampa') + 0.5);
  const sGauge = ramp(t, wordOf(3, 'ukur', 0) - 0.2, wordOf(3, 'ukur', 0) + 0.9, EASE_IN_OUT);
  const atmLine = ramp(t, wordOf(3, 'sekitar') - 0.3, wordOf(3, 'sekitar') + 0.5);
  const fAbs = ramp(t, cueEnd(3) - 0.8, cueEnd(3) + 0.2);
  const tire = ramp(t, cue(4) - 0.2, cue(4) + 0.6);
  const inflate = ramp(t, cue(4) + 0.3, wordOf(4, 'bar') + 0.3, EASE_IN_OUT);
  const absRead = ramp(t, wordOf(4, 'tiga') - 0.6, wordOf(4, 'tiga') + 0.4);
  const fNums = ramp(t, wordOf(4, 'tiga') - 0.1, wordOf(4, 'tiga') + 0.7);
  const gaugeBar = 2.2 * inflate;
  const absBar = 1 + gaugeBar;

  // ---------- fase D ----------
  const tTen = wordOf(5, 'seratus');
  const markM = 10 * ramp(t, wordOf(5, 'sepuluh') - 0.6, tTen, EASE_IN_OUT) + 10 * ramp(t, tTen + 0.9, cueEnd(5) + 0.2, EASE_IN_OUT);
  const fRho = ramp(t, tTen - 0.2, tTen + 0.6) * (1 - ramp(t, cue(6) + 2.2, cue(6) + 2.9, EASE_IN_OUT));
  const depth = 0.6 + 9.4 * ramp(t, cue(5) + 0.6, wordOf(6, 'sepuluh') + 0.6, EASE_IN_OUT);
  const bob = 4 * Math.sin(t * 1.3);
  const pAbs = 100 + 10 * depth; // kPa
  const two = ramp(t, wordOf(6, 'dua') - 0.2, wordOf(6, 'dua') + 0.6);
  const ear = ramp(t, wordOf(6, 'gendang') - 0.5, wordOf(6, 'gendang') + 0.4);
  const diverY = WS + depth * MPX + 70 + bob;
  const diverX = 590 + 10 * Math.sin(t * 0.7);
  const bow = 6 + 22 * ((pAbs - 100) / 100);

  return (
    <AbsoluteFill>
      <Stage>
        {/* =================== FASE A: lautan udara =================== */}
        {A > 0.001 ? (
          <g opacity={A * aIn} transform={`translate(${ZP[0]} ${ZP[1]}) scale(${zs}) translate(${-ZP[0]} ${-ZP[1]})`}>
            <defs>
              <radialGradient id="atm-air" cx={EC[0]} cy={EC[1]} r={ER + ATM} gradientUnits="userSpaceOnUse">
                <stop offset={`${(ER / (ER + ATM)) * 100}%`} stopColor="#5cc0ff" stopOpacity={0.62} />
                <stop offset={`${((ER + 70) / (ER + ATM)) * 100}%`} stopColor="#3a8dff" stopOpacity={0.3} />
                <stop offset={`${((ER + 180) / (ER + ATM)) * 100}%`} stopColor="#2a5fd0" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#1a2f80" stopOpacity={0} />
              </radialGradient>
              <radialGradient id="atm-earth" cx={EC[0]} cy={EC[1] - ER * 0.7} r={ER * 1.2} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1f6fb8" />
                <stop offset="60%" stopColor="#0f3d7a" />
                <stop offset="100%" stopColor="#061a3c" />
              </radialGradient>
              <clipPath id="atm-earth-clip">
                <circle cx={EC[0]} cy={EC[1]} r={ER} />
              </clipPath>
            </defs>
            <Twinkles x={960} y={260} rx={800} ry={90} n={7} color="cyan" opacity={0.5} />
            <circle cx={EC[0]} cy={EC[1]} r={ER + ATM * (0.45 + 0.55 * thick)} fill="url(#atm-air)" />
            {/* molekul udara: rapat di bawah, renggang di atas, hanyut pelan */}
            {MOLS.map((m, i) => {
              const ph = (((m.a0 + t * m.sp) % 0.9) + 0.9) % 0.9;
              const a = ph - 0.45;
              const rr = ER + 6 + m.h * (0.45 + 0.55 * thick) + 3 * Math.sin(t * 2 + i);
              return <circle key={i} cx={EC[0] + rr * Math.sin(a)} cy={EC[1] - rr * Math.cos(a)} r={m.r} fill="#cfeaff" opacity={0.75 * Math.sin((Math.PI * ph) / 0.9)} />;
            })}
            <circle cx={EC[0]} cy={EC[1]} r={ER} fill="url(#atm-earth)" />
            <g clipPath="url(#atm-earth-clip)">
              {[0, 1, 2, 3, 4].map((i) => {
                const a = -0.5 + i * 0.27 + t * 0.006;
                const p = [EC[0] + (ER - 60) * Math.sin(a), EC[1] - (ER - 60) * Math.cos(a)];
                return <ellipse key={i} cx={p[0]} cy={p[1]} rx={150 + 60 * rand(i)} ry={46 + 20 * rand(i + 2)} transform={`rotate(${(a * 180) / Math.PI} ${p[0]} ${p[1]})`} fill="#2f7a5c" opacity={0.7} />;
              })}
            </g>
            <circle cx={EC[0]} cy={EC[1]} r={ER} fill="none" stroke="#9fdcff" strokeOpacity={0.7} strokeWidth={3} />
            {/* awan tipis yang hanyut */}
            {[0, 1, 2].map((i) => {
              const a = -0.32 + i * 0.3 + 0.012 * t;
              const p = [EC[0] + (ER + 30) * Math.sin(a), EC[1] - (ER + 30) * Math.cos(a)];
              return <ellipse key={i} cx={p[0]} cy={p[1]} rx={70} ry={12} fill="#eaf6ff" opacity={0.28} transform={`rotate(${(a * 180) / Math.PI} ${p[0]} ${p[1]})`} />;
            })}
            {/* skala ketinggian */}
            <g opacity={scaleVis}>
              <line x1={1260} y1={724} x2={1260} y2={724 - ATM} stroke={C.muted} strokeWidth={2} />
              {[0, 10, 20, 30, 40, 50, 60].map((km) => (
                <g key={km}>
                  <line x1={1260} y1={724 - km * 6} x2={1260 + (km % 20 === 0 ? 16 : 9)} y2={724 - km * 6} stroke={C.muted} strokeWidth={2} />
                  {km % 20 === 0 && km > 0 ? (
                    <Label x={1286} y={724 - km * 6} size={22} font="mono" color={C.muted} anchor="start">
                      {`${km} km`}
                    </Label>
                  ) : null}
                </g>
              ))}
              <Label x={1300} y={724 - ATM - 30} size={26} color={C.cyan} weight={600} anchor="start">
                puluhan km
              </Label>
            </g>
            <Person x={960} y={702} scale={0.32} />
            <Glow x={960} y={680} r={60} color="water" opacity={label0} />
            <g opacity={label0}>
              <Label x={560} y={430} size={48} color={C.water} weight={600}>
                lautan udara
              </Label>
              <Arrow x1={760} y1={612} x2={928} y2={672} color="cyan" width={4} pulse={false} />
              <Label x={650} y={600} size={28} color={C.ink}>
                kita di dasarnya
              </Label>
            </g>
          </g>
        ) : null}

        {/* =================== FASE B: berat kolom udara =================== */}
        {B > 0.001 ? (
          <g opacity={B} transform={`translate(430 700) scale(${1.06 - 0.06 * ramp(t, cue(1) + 0.5, cue(1) + 1.6, EASE_IN_OUT)}) translate(-430 -700)`}>
            <Ground x1={150} x2={1770} y={800} />
            {/* kolom udara */}
            <g opacity={colP}>
              <defs>
                <linearGradient id="atm-col" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4fb4ff" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="#4fb4ff" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <rect x={365} y={mix(590, 180, colP)} width={130} height={590 - mix(590, 180, colP)} fill="url(#atm-col)" stroke={C.water} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="8 8" strokeDashoffset={-t * 12} />
              {Array.from({length: 46}, (_, i) => {
                const u = rand(i * 2.3 + 7);
                const yy = 586 - 400 * u * u + 4 * Math.sin(t * 2.4 + i * 1.7);
                if (yy < mix(590, 180, colP)) return null;
                return <circle key={i} cx={372 + 116 * rand(i * 4.1 + 1) + 4 * Math.cos(t * 2 + i)} cy={yy} r={2.2} fill="#cfeaff" opacity={0.75} />;
              })}
              <Arrow x1={540} y1={300} x2={540} y2={560} color="force" width={6} opacity={ramp(t, wordOf(1, 'udara') + 0.4, wordOf(1, 'udara') + 1.0)} />
              <Label x={566} y={330} size={28} color={C.force} weight={600} anchor="start" opacity={ramp(t, wordOf(1, 'udara') + 0.4, wordOf(1, 'udara') + 1.0)}>
                berat udara
              </Label>
              <Motes x={430} y={400} rx={90} ry={200} n={14} color="water" opacity={0.4} seed={3} />
            </g>
            {/* orang */}
            <ellipse cx={430} cy={804} rx={60} ry={8} fill="#000" opacity={0.4} />
            <g transform={`translate(430 800) scale(1 ${breathe}) translate(-430 -800)`}>
              <Person x={430} y={800} scale={1.15} arm={10 * Math.sin(t * 0.9)} />
            </g>
            {/* tekanan dari luar (ke dalam) & dari dalam tubuh (ke luar) */}
            <g opacity={bal}>
              <ellipse cx={430} cy={688} rx={68} ry={124} fill="url(#soft-press)" opacity={0.6} />
              {Array.from({length: 10}, (_, i) => {
                const a = (i / 10) * Math.PI * 2 + 0.3;
                const ex = 430 + 74 * Math.cos(a);
                const ey = 688 - 128 * Math.sin(a);
                if (ey > 792) return null;
                return <PressureArrow key={i} x={ex} y={ey} nx={Math.cos(a)} ny={-Math.sin(a)} L={42} width={4} />;
              })}
            </g>
            <g opacity={balIn}>
              {Array.from({length: 8}, (_, i) => {
                const a = (i / 8) * Math.PI * 2 + 0.7;
                const ex = 430 + 58 * Math.cos(a);
                const ey = 688 - 104 * Math.sin(a);
                if (ey > 780) return null;
                return <PressureArrow key={i} x={ex} y={ey} nx={-Math.cos(a)} ny={Math.sin(a)} L={36} width={3.5} color="#ffc2dc" />;
              })}
            </g>
            

            {/* 10 ton di atas 1 m² */}
            <g opacity={crateA}>
              <path d="M1150,800 L1490,800 L1450,770 L1190,770 Z" fill={C.press} fillOpacity={0.18} stroke={C.press} strokeWidth={3} />
              <Label x={1320} y={830} size={26} font="mono" color={C.press} weight={600}>
                1 m²
              </Label>
              <ellipse cx={1320} cy={790} rx={150 * (0.4 + 0.6 * crateDrop)} ry={10} fill="#000" opacity={0.35 * crateDrop} />
              <Crate x={1320} y={crateY} w={260} h={200} label="10 ton" color={C.force} />
              {[0, 1, 2].map((k) => (
                <line key={k} x1={1220 + k * 100} y1={crateY - 215 - 30 * (1 - crateDrop)} x2={1220 + k * 100} y2={crateY - 260 - 30 * (1 - crateDrop)} stroke={C.ink} strokeWidth={3} strokeLinecap="round" opacity={0.35 * Math.sin(Math.PI * crateDrop)} />
              ))}
              <Ripple x={1320} y={790} p={ramp(t, tLand - 0.05, tLand + 1.1)} r={220} color="force" />
            </g>
            
          </g>
        ) : null}

        {/* =================== FASE C: mutlak vs ukur =================== */}
        {Cp > 0.001 ? (
          <g opacity={Cp}>
            {/* tabung skala, isi merah muda sampai tekanan saat ini */}
            <rect x={590} y={yBar(4.2)} width={46} height={PB0 - yBar(4.2)} rx={23} fill="#0b1430" stroke={C.muted} strokeWidth={3} />
            <defs>
              <linearGradient id="atm-pfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.press} stopOpacity={0.95} />
                <stop offset="100%" stopColor={C.press} stopOpacity={0.35} />
              </linearGradient>
            </defs>
            <rect x={598} y={yBar(absBar * atmLine + (1 - atmLine) * absBar * sAbs)} width={30} height={Math.max(0, PB0 - 8 - yBar(absBar * atmLine + (1 - atmLine) * absBar * sAbs))} rx={15} fill="url(#atm-pfill)" />
            {Array.from({length: 4}, (_, k) => {
              const ph = (((t * 0.35 + k / 4) % 1) + 1) % 1;
              const top = yBar(absBar * sAbs);
              return <circle key={k} cx={613 + 5 * Math.sin(t * 3 + k)} cy={PB0 - 14 - ph * Math.max(0, PB0 - 30 - top)} r={3} fill="#fff" opacity={0.5 * cyc(ph) * sAbs} />;
            })}
            {/* skala mutlak (kiri) */}
            <g opacity={sAbs}>
              <Label x={560} y={yBar(4.2) - 34} size={28} color={C.ink} weight={600} anchor="end">
                mutlak
              </Label>
              {[0, 1, 2, 3, 4].map((b) => (
                <g key={b}>
                  <line x1={572} y1={yBar(b)} x2={590} y2={yBar(b)} stroke={C.ink} strokeWidth={3} />
                  <Label x={562} y={yBar(b)} size={24} font="mono" color={C.ink} anchor="end">
                    {String(b)}
                  </Label>
                </g>
              ))}
              {[0.5, 1.5, 2.5, 3.5].map((b) => (
                <line key={b} x1={580} y1={yBar(b)} x2={590} y2={yBar(b)} stroke={C.muted} strokeWidth={2} />
              ))}
              <Label x={612} y={PB0 + 34} size={22} font="mono" color={C.muted}>
                bar
              </Label>
            </g>
            {/* ruang hampa di titik nol */}
            <g opacity={vac}>
              <rect x={250} y={PB0 - 46} width={130} height={80} rx={12} fill="#05070f" stroke={C.muted} strokeWidth={2} strokeDasharray="6 6" strokeDashoffset={-t * 10} />
              <Label x={315} y={PB0 - 6} size={24} color={C.muted}>
                hampa
              </Label>
              <Arrow x1={388} y1={PB0} x2={448} y2={PB0} color="muted" width={3} pulse={false} />
              <Ripple x={613} y={PB0} p={ramp(t, wordOf(3, 'hampa') - 0.1, wordOf(3, 'hampa') + 1.2)} r={90} color="press" />
            </g>
            {/* garis udara sekitar */}
            <g opacity={atmLine}>
              <line x1={250} y1={yBar(1)} x2={1000} y2={yBar(1)} stroke={C.cyan} strokeWidth={2.5} strokeDasharray="10 8" strokeDashoffset={-t * 14} />
              <Label x={1000} y={yBar(1) + 26} size={24} color={C.cyan} anchor="end">
                udara sekitar ≈ 1 bar
              </Label>
            </g>
            {/* skala ukur (kanan), nol di garis atmosfer */}
            <g opacity={sGauge} transform={`translate(0 ${(1 - sGauge) * 60})`}>
              <Label x={680} y={yBar(4.2) - 34} size={28} color={C.cyan} weight={600} anchor="start">
                ukur
              </Label>
              {[-1, 0, 1, 2, 3].map((b) => (
                <g key={b} opacity={b < 0 ? 0.5 : 1}>
                  <line x1={636} y1={yBar(b + 1)} x2={654} y2={yBar(b + 1)} stroke={C.cyan} strokeWidth={3} />
                  <Label x={664} y={yBar(b + 1)} size={24} font="mono" color={C.cyan} anchor="start">
                    {b < 0 ? '−1' : String(b)}
                  </Label>
                </g>
              ))}
            </g>
            {/* panah pembacaan ban */}
            <g opacity={absRead}>
              <Arrow x1={470} y1={PB0} x2={470} y2={yBar(absBar)} color="press" width={6} both />
              <Label x={452} y={mix(PB0, yBar(absBar), 0.55)} size={30} font="mono" color={C.press} weight={600} anchor="end">
                {`${fmt(absBar, 1)} bar`}
              </Label>
            </g>
            <g opacity={tire * sGauge}>
              <Arrow x1={760} y1={yBar(1)} x2={760} y2={yBar(absBar)} color="cyan" width={6} opacity={Math.min(1, gaugeBar * 3)} />
              <Label x={782} y={mix(yBar(1), yBar(absBar), 0.5)} size={30} font="mono" color={C.cyan} weight={600} anchor="start" opacity={Math.min(1, gaugeBar * 3)}>
                {`${fmt(gaugeBar, 1)} bar`}
              </Label>
              <line x1={600} y1={yBar(absBar)} x2={1000} y2={yBar(absBar)} stroke={C.press} strokeWidth={2} strokeDasharray="4 8" opacity={0.7} />
            </g>
            <Twinkles x={420} y={yBar(absBar)} rx={60} ry={30} n={4} color="press" opacity={absRead} />

            {/* ban + alat ukur */}
            <g opacity={tire}>
              {(() => {
                const cx = 1220;
                const cy = 650;
                const r = 140;
                const sy = 0.86 + 0.14 * inflate;
                return (
                  <g>
                    <ellipse cx={cx} cy={cy + r + 8} rx={r * 0.9} ry={10} fill="#000" opacity={0.4} />
                    <g transform={`translate(${cx} ${cy + r}) scale(${1 + 0.06 * (1 - inflate)} ${sy}) translate(${-cx} ${-cy - r})`}>
                      <circle cx={cx} cy={cy} r={r} fill="#141a2e" stroke="#3b466e" strokeWidth={4} />
                      {Array.from({length: 24}, (_, i) => {
                        const a = (i / 24) * Math.PI * 2;
                        return <line key={i} x1={cx + (r - 2) * Math.cos(a)} y1={cy + (r - 2) * Math.sin(a)} x2={cx + (r - 18) * Math.cos(a)} y2={cy + (r - 18) * Math.sin(a)} stroke="#2a3254" strokeWidth={8} />;
                      })}
                      <circle cx={cx} cy={cy} r={r * 0.78} fill="#0d1226" stroke="#2a3254" strokeWidth={3} />
                      {/* molekul udara di dalam ban: makin rapat & cepat saat dipompa */}
                      {Array.from({length: 26}, (_, i) => {
                        if (i > 10 + 16 * inflate) return null;
                        const sp = 0.5 + inflate;
                        const a = rand(i * 3.3) * Math.PI * 2 + t * sp * (rand(i) > 0.5 ? 1 : -1);
                        const rr = r * (0.58 + 0.16 * (0.5 + 0.5 * Math.sin(t * 3 * sp + i)));
                        return <circle key={i} cx={cx + rr * Math.cos(a)} cy={cy + rr * Math.sin(a)} r={3} fill={C.press} opacity={0.75} />;
                      })}
                      <circle cx={cx} cy={cy} r={r * 0.5} fill="#5d6a93" stroke={C.ink} strokeOpacity={0.5} strokeWidth={3} />
                      {Array.from({length: 5}, (_, i) => {
                        const a = (i / 5) * Math.PI * 2 + 0.3;
                        return <circle key={i} cx={cx + r * 0.3 * Math.cos(a)} cy={cy + r * 0.3 * Math.sin(a)} r={7} fill="#2a3254" />;
                      })}
                      <circle cx={cx} cy={cy} r={16} fill="#2a3254" />
                    </g>
                    <path d={`M${cx + 60},${cy - 60} Q${cx + 160},${cy - 150} 1470,${cy - 80}`} fill="none" stroke="#3b466e" strokeWidth={8} strokeLinecap="round" />
                    <Stream pts={[[cx + 60, cy - 60], [cx + 140, cy - 125], [1470, cy - 80]]} color="press" n={5} speed={0.6} r={4} jitter={0} opacity={0.7 * (inflate < 0.999 ? 1 : 0.3)} />
                  </g>
                );
              })()}
              <Dial x={1560} y={560} r={110} v={gaugeBar} max={4} ticks={[0, 1, 2, 3, 4]} minor={0.5} unit="bar (ukur)" t={t} />
            </g>
            
          </g>
        ) : null}

        {/* =================== FASE D: penyelam =================== */}
        {D > 0.001 ? (
          <g opacity={D}>
            <rect x={174} y={WS - 40} width={772} height={860 - WS + 46} rx={10} fill="none" stroke="#bfe3ff" strokeOpacity={0.35} strokeWidth={4} />
            <Water x={180} y={WS} w={760} h={860 - WS} amp={5} bubbles={6} seed={2} />
            {/* sinar matahari dari atas */}
            {[0, 1, 2].map((k) => (
              <path key={k} d={`M${300 + k * 220 + 30 * Math.sin(t * 0.4 + k)},${WS} l60,0 l${120 - k * 30},${560} l-90,0 Z`} fill="#dff4ff" opacity={0.045 + 0.02 * Math.sin(t * 0.9 + k)} />
            ))}
            {/* garis tiap 10 m */}
            {[0, 10, 20].map((m) => {
              const y = WS + m * MPX;
              const on = m === 0 ? 1 : ramp(markM, m - 1.5, m);
              return (
                <g key={m}>
                  {m > 0 ? <line x1={260} y1={y} x2={940} y2={y} stroke={C.press} strokeOpacity={0.35 + 0.35 * on} strokeWidth={2} strokeDasharray="10 10" strokeDashoffset={-t * 10} /> : null}
                  <Label x={238} y={m === 0 ? y + 26 : y} size={24} font="mono" color={C.ink} anchor="end">
                    {`${m} m`}
                  </Label>
                  <g opacity={on}>
                    <Label x={918} y={m === 0 ? y + 30 : y - 22} size={28} font="mono" color={C.press} weight={600} anchor="end">
                      {`${m / 10 + 1} atm`}
                    </Label>
                  </g>
                  {m > 0 ? <Ripple x={850} y={y} p={ramp(markM, m - 0.2, m + 3)} r={120} color="press" /> : null}
                  {m > 0 ? (
                    <g opacity={win(markM, m - 0.3, m + 4, 0.6, 2.5) * (1 - ramp(t, cue(6) + 1, cue(6) + 1.8))}>
                      <rect x={690} y={y + 14} width={140} height={40} rx={20} fill="rgba(10,16,36,0.85)" stroke={C.press} strokeWidth={2} />
                      <Label x={760} y={y + 34} size={22} color={C.press} weight={600}>
                        +1 atm
                      </Label>
                    </g>
                  ) : null}
                </g>
              );
            })}
            <line x1={244} y1={WS} x2={244} y2={WS + 22 * MPX} stroke={C.muted} strokeWidth={2} />
            {Array.from({length: 23}, (_, i) => (
              <line key={i} x1={244} y1={WS + i * MPX} x2={i % 5 === 0 ? 262 : 254} y2={WS + i * MPX} stroke={C.muted} strokeWidth={2} />
            ))}
            {/* penanda kedalaman yang menyapu turun */}
            <g opacity={ramp(t, cue(5) + 0.4, cue(5) + 1.0) * (1 - ramp(t, cue(6) + 1.5, cue(6) + 2.3, EASE_IN_OUT))}>
              <rect x={248} y={WS + markM * MPX - 3} width={690} height={6} rx={3} fill={C.press} opacity={0.5} />
              <Spark x={258} y={WS + markM * MPX} r={7} color="press" />
            </g>
            {/* gelembung napas penyelam */}
            {Array.from({length: 7}, (_, i) => {
              const ph = (((t * 0.32 + i / 7) % 1) + 1) % 1;
              const y0 = diverY - 86;
              const by = mix(y0, WS + 8, ph);
              const bx = diverX + 22 + 10 * Math.sin(t * 2.5 + i * 1.9) + ph * 14;
              const r = 3 + 4 * ph * (1 + 0.08 * depth);
              return (
                <g key={i} opacity={cyc(ph) * 0.8}>
                  <circle cx={bx} cy={by} r={r} fill="none" stroke="#d8f0ff" strokeWidth={1.5} />
                  <circle cx={bx - r * 0.3} cy={by - r * 0.3} r={r * 0.3} fill="#fff" opacity={0.8} />
                </g>
              );
            })}
            {/* panah tekanan di sekeliling penyelam, makin panjang saat makin dalam */}
            {Array.from({length: 10}, (_, i) => {
              const a = (i / 10) * Math.PI * 2 + 0.2;
              const ex = diverX + 64 * Math.cos(a);
              const ey = diverY - 10 - 112 * Math.sin(a);
              return <PressureArrow key={i} x={ex} y={ey} nx={Math.cos(a)} ny={-Math.sin(a)} L={12 + 0.16 * pAbs} width={3.5} opacity={0.85} />;
            })}
            <Diver x={diverX} y={diverY} t={t} />
            <Motes x={diverX} y={diverY - 20} rx={120} ry={150} n={12} color="cyan" opacity={0.35} seed={8} />

            {/* alat ukur tekanan di penyelam */}
            <Label x={1250} y={318} size={26} color={C.muted} opacity={ramp(t, cue(5) + 0.6, cue(5) + 1.3)}>
              tekanan mutlak di penyelam
            </Label>
            <Dial x={1250} y={505} r={150} v={pAbs} max={300} ticks={[0, 100, 200, 300]} minor={50} unit="kPa" t={t} opacity={ramp(t, cue(5) + 0.6, cue(5) + 1.3)} />
            <Label x={1250} y={612} size={34} font="mono" color={C.press} weight={600} opacity={ramp(t, cue(5) + 0.6, cue(5) + 1.3)}>
              {`${fmt(pAbs)} kPa`}
            </Label>
            <Glow x={1250} y={505} r={230} color="press" opacity={two * 0.6} />
            
            <Twinkles x={1250} y={785} rx={220} ry={40} n={5} color="press" opacity={two} />

            {/* gendang telinga */}
            <g opacity={ear}>
              <line x1={diverX + 4} y1={diverY - 96} x2={1490} y2={735} stroke={C.muted} strokeWidth={2} strokeDasharray="6 8" strokeDashoffset={-t * 12} />
              <defs>
                <clipPath id="atm-ear">
                  <circle cx={1600} cy={760} r={108} />
                </clipPath>
              </defs>
              <g clipPath="url(#atm-ear)">
                <rect x={1490} y={650} width={110} height={220} fill={C.water} opacity={0.45} />
                <path d={`M1598,650 L1598,670 Q${1598 + bow * 1.6},760 1598,850 L1598,870 L1710,870 L1710,650 Z`} fill="#20142e" />
                <path d={`M1598,670 Q${1598 + bow * 1.6},760 1598,850`} fill="none" stroke="#ffd0e3" strokeWidth={6} />
                {[700, 760, 820].map((y, k) => {
                  const xm = 1598 + bow * 1.6 * (1 - ((y - 760) / 90) ** 2) * 0.5;
                  return <PressureArrow key={k} x={xm - 4} y={y} nx={-1} ny={0} L={14 + 0.2 * pAbs} width={4} />;
                })}
                {[715, 805].map((y, k) => (
                  <PressureArrow key={k} x={1600 + bow * 0.6 + 8} y={y} nx={1} ny={0} L={34} width={3.5} color="#ffc2dc" />
                ))}
              </g>
              <circle cx={1600} cy={760} r={108} fill="none" stroke={C.ink} strokeOpacity={0.6} strokeWidth={3} />
              <Label x={1600} y={626} size={24} color={C.ink}>
                gendang telinga
              </Label>
              <Label x={1534} y={760} size={20} color={C.ink}>
                air
              </Label>
              <Label x={1666} y={760} size={20} color="#ffc2dc">
                udara
              </Label>
            </g>
            
          </g>
        ) : null}
      </Stage>
      <Note x={790} y={640} p={balIn * B} color={C.press} size={28}>
              <V>p</V>
              <Sub>dalam</Sub> = <V>p</V>
              <Sub>luar</Sub> → seimbang
            </Note>
      <Formula x={1320} y={300} p={fAtm * B} accent={C.press} size={58}>
              <V color="press">p</V>
              <Sub>atm</Sub> ≈ 100 kPa = 10<Sup>5</Sup> Pa
              <div style={{fontSize: 38, fontFamily: FONT.head, color: C.muted, opacity: fTon, marginTop: 4}}>
                ≈ <span style={{color: C.force}}>10 ton</span> di atas tiap m²
              </div>
            </Formula>
      <Formula x={1340} y={290} p={fAbs * Cp} accent={C.press} size={58}>
              <V>p</V>
              <Sub>mutlak</Sub> = <V>p</V>
              <Sub>ukur</Sub> + <V>p</V>
              <Sub>atm</Sub>
              <div style={{fontSize: 44, fontFamily: FONT.mono, opacity: fNums, marginTop: 6}}>
                <span style={{color: C.press}}>3,2</span> ≈ <span style={{color: C.cyan}}>2,2</span> + 1 <span style={{fontSize: 30, color: C.muted}}>bar</span>
              </div>
            </Formula>
      <Badge x={1250} y={785} text="2× tekanan di permukaan" color={C.press} size={28} opacity={two * D} scale={0.9 + 0.1 * ramp(t, wordOf(6, 'dua') - 0.2, wordOf(6, 'dua') + 0.5, BACK)} />
      <Formula x={1390} y={228} p={fRho * D} accent={C.press} size={56}>
              <V>ρgh</V> = 1000 · 10 · 10 = 10<Sup>5</Sup> Pa
            </Formula>
    </AbsoluteFill>
  );
};
