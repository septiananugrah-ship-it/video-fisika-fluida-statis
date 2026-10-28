import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {PressureArrow} from '../components/fluid';
import {Car} from '../components/physics';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Fase 1 (baris 0): bola Pascal — piston suntik menambah tekanan, semburan keluar sama kuat ke segala arah.
// Fase 2 (1–7): dongkrak hidraulik. A₁ = 5 cm², A₂ = 200 cm² (40×): lebar piston ∝ diameter (√40 ≈ 6,3) → 50 px & 316 px.
// 400 kg (4000 N) ditahan 100 N. Skala langkah 3 px/cm: piston kecil turun 80 cm = 240 px, piston besar naik 2 cm = 6 px.
// W = 100 N · 0,80 m = 4000 N · 0,02 m = 80 J.

type P = [number, number];
const BC: P = [900, 500];
const BR = 170;
const MOUTH: P = [BC[0] - BR + 4, 500];
const HOLES = [140, 105, 70, 35, 0, -35, -70, -105, -140];
const V0 = 430;
const G = 1100;

// dongkrak
const SX = 380;
const SW = 50;
const LX = 900;
const LW = 316;
const CH_T = 710;
const BASE = 770;
const Y0 = 450;
const LIQ = '#3aa8ff';

export const Pascal: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  const ph1 = 1 - ramp(t, cue(1) - 0.4, cue(1) + 0.4, EASE_IN_OUT);
  const ph2 = ramp(t, cue(1) + 0.1, cue(1) + 0.9);

  // ---------- fase 1 ----------
  const ballIn = ramp(t, -0.5, 0.8);
  const tPush = cue(0) + 0.15;
  const tStop = cueEnd(0) - 0.2;
  const push = ramp(t, tPush, tStop, (x) => x);
  const pushing = win(t, tPush, tStop, 0.3, 0.5);
  const xp = mix(420, 600, push);
  const fLaw = ramp(t, wordOf(0, 'Pascal') - 0.5, wordOf(0, 'Pascal') + 0.4);
  const fDp = ramp(t, wordOf(0, 'diteruskan') - 0.4, wordOf(0, 'diteruskan') + 0.4);
  const wallP = ramp(t, tPush + 0.3, tPush + 0.9) * (1 - ramp(t, tStop + 0.2, tStop + 0.9));

  // ---------- fase 2 ----------
  const liftIn = ramp(t, cue(1) + 0.2, cue(1) + 1.2);
  const pistIn = ramp(t, wordOf(1, 'piston') - 0.2, wordOf(1, 'piston') + 0.8, BACK);
  const twoP = win(t, wordOf(1, 'piston') + 0.2, wordOf(2, 'F') - 0.9, 0.6, 0.5);
  const eqP = win(t, cue(2) + 0.2, cue(3) + 0.6, 0.6, 0.6);
  const f2 = win(t, wordOf(2, 'F') - 0.4, cue(4) - 0.2, 0.6, 0.5);
  const aLab = win(t, cue(3) + 0.1, cue(5) - 0.2, 0.6, 0.5);
  const a2Lab = win(t, wordOf(3, 'besar') - 0.3, cue(5) - 0.2, 0.6, 0.5);
  const grid = win(t, wordOf(3, 'empat') - 0.8, cue(5) - 0.3, 0.6, 0.5);
  const gridFill = ramp(t, wordOf(3, 'empat') - 0.6, cueEnd(3) + 0.3, (x) => x);
  const tDrop = wordOf(4, 'beban');
  const carDrop = ramp(t, tDrop - 0.9, tDrop + 0.1, (x) => x * x);
  const carIn = ramp(t, tDrop - 0.9, tDrop - 0.5);
  const f100 = ramp(t, wordOf(4, 'seratus') - 0.4, wordOf(4, 'seratus') + 0.3);
  const f4 = win(t, wordOf(4, 'seratus') - 0.2, cue(5) + 0.4, 0.6, 0.5);
  const pumpA = wordOf(5, 'mengangkat') - 0.2;
  const pumpB = wordOf(5, 'delapan') + 1.2;
  const pump = ramp(t, pumpA, pumpB, EASE_IN_OUT);
  const pumpRate = Math.min(1, (ramp(t + 0.05, pumpA, pumpB, EASE_IN_OUT) - pump) * 60);
  const vol = win(t, pumpA + 0.3, cue(6) + 0.5, 0.6, 0.6);
  const mag = win(t, pumpA + 0.4, cue(6) - 0.1, 0.6, 0.5);
  const f6 = ramp(t, cue(6) + 0.2, cue(6) + 0.9);
  const f6num = ramp(t, wordOf(6, 'Usaha') - 0.3, wordOf(6, 'Usaha') + 0.5);
  const bForce = ramp(t, wordOf(6, 'Gaya') - 0.2, wordOf(6, 'Gaya') + 0.5);
  const bDist = ramp(t, wordOf(6, 'jarak') - 0.2, wordOf(6, 'jarak') + 0.5);
  const energy = ramp(t, cue(7) + 0.2, cue(7) + 1.0);
  const nEnergy = ramp(t, wordOf(7, 'energi') - 0.3, wordOf(7, 'energi') + 0.5);
  const nTrade = ramp(t, wordOf(7, 'menukar') - 0.3, wordOf(7, 'menukar') + 0.5);

  const y1 = Y0 + 240 * pump; // dasar piston kecil
  const y2 = Y0 - 6 * pump - 1.2 * Math.sin(t * 1.6) * ramp(t, tDrop, tDrop + 1) * (1 - pumpRate); // dasar piston besar
  const carY = y2 - 40 - 340 * (1 - carDrop) + (t > tDrop + 0.1 ? -5 * Math.exp(-(t - tDrop - 0.1) * 5) * Math.sin((t - tDrop - 0.1) * 20) : 0);

  return (
    <AbsoluteFill>
      <Stage>
        {/* =================== FASE 1: bola Pascal =================== */}
        {ph1 > 0.001 ? (
          <g opacity={ph1 * ballIn}>
            <defs>
              <clipPath id="pas-ball">
                <circle cx={BC[0]} cy={BC[1]} r={BR - 6} />
              </clipPath>
              <radialGradient id="pas-ballg" cx="40%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#5cc0ff" stopOpacity={0.75} />
                <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
              </radialGradient>
            </defs>
            {/* semburan: lintasan parabola (v₀ sama untuk semua lubang = tekanan sama) */}
            {HOLES.map((a, j) => {
              const ar = (a * Math.PI) / 180;
              const nx = Math.cos(ar);
              const ny = -Math.sin(ar);
              const h0: P = [BC[0] + BR * nx, BC[1] + BR * ny];
              const arrive = Math.hypot(h0[0] - MOUTH[0], h0[1] - MOUTH[1]) / 900;
              const s = ramp(t, tPush + arrive, tPush + arrive + 0.25) * (1 - ramp(t, tStop, tStop + 0.5));
              if (s <= 0.001) return null;
              const posAt = (tau: number): P => [h0[0] + nx * V0 * tau, h0[1] + ny * V0 * tau + 0.5 * G * tau * tau];
              const path = Array.from({length: 13}, (_, k) => posAt((k / 12) * 0.48))
                .map((p, k) => `${k ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
                .join(' ');
              return (
                <g key={j} opacity={s}>
                  <path d={path} fill="none" stroke={C.water} strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" />
                  {Array.from({length: 7}, (_, i) => {
                    const ph = (((t * 2.1 + i / 7 + j * 0.13) % 1) + 1) % 1;
                    const p = posAt(ph * 0.48);
                    return <circle key={i} cx={p[0]} cy={p[1]} r={4.5 - 2 * ph} fill="#bfe6ff" opacity={cyc(ph) * 0.95} />;
                  })}
                </g>
              );
            })}
            {/* tabung suntik */}
            <rect x={300} y={466} width={MOUTH[0] - 296} height={68} rx={10} fill="none" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={6} />
            <rect x={xp + 12} y={472} width={MOUTH[0] + 10 - xp - 12} height={56} fill={LIQ} opacity={0.55} />
            <rect x={xp} y={470} width={16} height={60} rx={4} fill="#5d6a93" stroke={C.ink} strokeOpacity={0.6} strokeWidth={2} />
            <rect x={xp - 250} y={494} width={252} height={12} rx={4} fill="#3b466e" />
            <rect x={xp - 262} y={456} width={16} height={88} rx={6} fill="#5d6a93" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
            <Arrow x1={xp - 380} y1={500} x2={xp - 272} y2={500} color="force" width={7} opacity={pushing} />
            <Label x={xp - 330} y={456} size={28} color={C.force} weight={600} opacity={pushing}>
              tekan
            </Label>
            <Stream pts={[[xp + 30, 500], [MOUTH[0] + 10, 500]]} color="press" n={5} speed={0.9} r={4} jitter={3} opacity={pushing} />
            {/* bola */}
            <ellipse cx={BC[0]} cy={BC[1] + BR + 26} rx={140} ry={12} fill="#000" opacity={0.35} />
            <circle cx={BC[0]} cy={BC[1]} r={BR} fill="url(#pas-ballg)" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={6} />
            <g clipPath="url(#pas-ball)">
              {/* gelombang tambahan tekanan dari mulut suntik */}
              {[0, 1, 2].map((k) => {
                const ph = ((((t - tPush) * 0.9 + k / 3) % 1) + 1) % 1;
                return <circle key={k} cx={MOUTH[0]} cy={MOUTH[1]} r={ph * 360} fill="none" stroke={C.press} strokeWidth={4} opacity={cyc(ph) * 0.7 * pushing} />;
              })}
              <circle cx={BC[0] - 60} cy={BC[1] - 70} r={40} fill="#fff" opacity={0.08} />
            </g>
            {HOLES.map((a, j) => {
              const ar = (a * Math.PI) / 180;
              return <circle key={j} cx={BC[0] + BR * Math.cos(ar)} cy={BC[1] - BR * Math.sin(ar)} r={5} fill="#0a1230" stroke="#bfe3ff" strokeWidth={2} />;
            })}
            {/* tekanan pada dinding: sama besar ke segala arah */}
            {Array.from({length: 12}, (_, i) => {
              const a = (i / 12) * Math.PI * 2 + 0.26;
              const wx = BC[0] + (BR - 8) * Math.cos(a);
              const wy = BC[1] - (BR - 8) * Math.sin(a);
              return <PressureArrow key={i} x={wx} y={wy} nx={-Math.cos(a)} ny={Math.sin(a)} L={18 + 22 * wallP} width={4} opacity={0.4 + 0.6 * wallP} />;
            })}
            <Glow x={BC[0]} y={BC[1]} r={260} color="press" opacity={wallP * 0.5} />
            <Label x={BC[0]} y={BC[1]} size={40} font="serif" italic color={C.ink} weight={600} opacity={fDp}>
              +Δp
            </Label>
            <Motes x={BC[0]} y={BC[1]} rx={300} ry={260} n={16} color="water" opacity={0.4} seed={2} />
          </g>
        ) : null}

        {/* =================== FASE 2: dongkrak hidraulik =================== */}
        {ph2 > 0.001 ? (
          <g opacity={ph2 * liftIn}>
            <defs>
              <linearGradient id="pas-liq" gradientUnits="userSpaceOnUse" x1="0" y1={Y0 - 10} x2="0" y2={BASE}>
                <stop offset="0%" stopColor={LIQ} stopOpacity={0.75} />
                <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
              </linearGradient>
            </defs>
            <ellipse cx={720} cy={BASE + 22} rx={460} ry={14} fill="#000" opacity={0.35} />
            {/* cairan */}
            <path
              d={`M${SX - SW / 2},${y1} L${SX + SW / 2},${y1} L${SX + SW / 2},${CH_T} L${LX - LW / 2},${CH_T} L${LX - LW / 2},${y2} L${LX + LW / 2},${y2} L${LX + LW / 2},${BASE} L${SX - SW / 2},${BASE} Z`}
              fill="url(#pas-liq)"
            />
            {/* kilau gelembung di saluran */}
            {Array.from({length: 6}, (_, k) => {
              const ph = (((t * 0.12 + k / 6) % 1) + 1) % 1;
              return <circle key={k} cx={mix(SX + 40, LX + 120, ph)} cy={740 + 10 * Math.sin(t * 2 + k * 1.7)} r={2.5 + (k % 2)} fill="#fff" opacity={0.35 * cyc(ph)} />;
            })}
            {/* aliran cairan saat memompa */}
            <Stream
              pts={[
                [SX, y1 + 20],
                [SX, 740],
                [LX, 740],
                [LX, y2 + 30],
              ]}
              color="water"
              n={14}
              speed={0.8}
              r={5}
              jitter={4}
              opacity={pumpRate}
            />
            {/* dinding */}
            <g fill="none" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={10} strokeLinejoin="round">
              <path d={`M${SX - SW / 2 - 5},300 L${SX - SW / 2 - 5},${BASE + 5} L${LX + LW / 2 + 5},${BASE + 5} L${LX + LW / 2 + 5},380`} />
              <path d={`M${SX + SW / 2 + 5},300 L${SX + SW / 2 + 5},${CH_T - 5} L${LX - LW / 2 - 5},${CH_T - 5} L${LX - LW / 2 - 5},380`} />
            </g>
            <line x1={LX + LW / 2 - 14} y1={400} x2={LX + LW / 2 - 14} y2={BASE - 16} stroke="#fff" strokeOpacity={0.1} strokeWidth={6} strokeLinecap="round" />

            {/* volume yang dipindahkan */}
            <g opacity={vol}>
              <rect x={SX - SW / 2} y={Y0} width={SW} height={Math.max(0, y1 - 30 - Y0)} fill={C.gold} fillOpacity={0.12} stroke={C.gold} strokeWidth={2} strokeDasharray="6 6" strokeDashoffset={-t * 12} />
              <rect x={LX - LW / 2} y={y2} width={LW} height={Math.max(0, Y0 - y2)} fill={C.gold} opacity={0.9} />
              <line x1={SX - SW / 2 - 40} y1={Y0} x2={SX - SW / 2 - 40} y2={y1} stroke={C.gold} strokeWidth={4} />
              <line x1={SX - SW / 2 - 50} y1={Y0} x2={SX - SW / 2 - 30} y2={Y0} stroke={C.gold} strokeWidth={4} />
              <line x1={SX - SW / 2 - 50} y1={y1} x2={SX - SW / 2 - 30} y2={y1} stroke={C.gold} strokeWidth={4} />
              <Label x={SX - SW / 2 - 60} y={(Y0 + y1) / 2 - 22} size={30} font="mono" color={C.gold} weight={600} anchor="end">
                {`${Math.round((80 * (y1 - Y0)) / 240)} cm`}
              </Label>
              <Label x={SX - SW / 2 - 60} y={(Y0 + y1) / 2 + 18} size={24} color={C.gold} anchor="end">
                {`V = ${Math.round((400 * (y1 - Y0)) / 240)} cm³`}
              </Label>
              <Label x={LX + LW / 2 + 22} y={Y0 - 30} size={24} color={C.gold} anchor="start">
                {`V = ${Math.round((400 * (y1 - Y0)) / 240)} cm³`}
              </Label>
            </g>
            {/* kaca pembesar celah 2 cm */}
            <g opacity={mag}>
              <defs>
                <clipPath id="pas-mag">
                  <circle cx={1300} cy={580} r={95} />
                </clipPath>
              </defs>
              <line x1={LX + LW / 2 + 6} y1={Y0} x2={1210} y2={555} stroke={C.muted} strokeWidth={2} strokeDasharray="5 6" />
              <circle cx={1300} cy={580} r={95} fill="#0a1230" />
              <g clipPath="url(#pas-mag)">
                <rect x={1200} y={600} width={200} height={90} fill="url(#pas-liq)" />
                <rect x={1200} y={600 - 36 * pump} width={200} height={36 * pump} fill={C.gold} opacity={0.9} />
                <rect x={1200} y={600 - 36 * pump - 60} width={200} height={60} fill="#5d6a93" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
                <line x1={1200} y1={600} x2={1400} y2={600} stroke={C.ink} strokeWidth={2} strokeDasharray="6 6" />
                <line x1={1352} y1={500} x2={1352} y2={690} stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={10} />
              </g>
              <circle cx={1300} cy={580} r={95} fill="none" stroke={C.ink} strokeOpacity={0.7} strokeWidth={4} />
              <line x1={1367} y1={647} x2={1410} y2={690} stroke={C.ink} strokeOpacity={0.7} strokeWidth={10} strokeLinecap="round" />
              <Label x={1300} y={460} size={28} font="mono" color={C.gold} weight={600}>
                {`naik ${(2 * pump).toFixed(1).replace('.', ',')} cm`}
              </Label>
            </g>

            {/* piston kecil + batang + gaya */}
            <g opacity={pistIn} transform={`translate(0 ${(1 - pistIn) * -40})`}>
              <rect x={SX - 8} y={y1 - 140} width={16} height={112} rx={4} fill="#3b466e" />
              <rect x={SX - 40} y={y1 - 152} width={80} height={14} rx={6} fill="#5d6a93" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
              <rect x={SX - SW / 2} y={y1 - 30} width={SW} height={30} rx={5} fill="#5d6a93" stroke={C.ink} strokeOpacity={0.6} strokeWidth={2} />
              <rect x={SX - SW / 2 + 4} y={y1 - 26} width={SW - 8} height={6} rx={3} fill="#fff" opacity={0.15} />
            </g>
            <g opacity={f100}>
              <Arrow x1={SX} y1={y1 - 250} x2={SX} y2={y1 - 162} color="force" width={7} />
              <Label x={SX + 26} y={y1 - 220} size={30} color={C.force} weight={600} anchor="start">
                <tspan fontFamily={FONT.serif} fontStyle="italic">F</tspan>
                <tspan baselineShift="sub" fontSize="0.65em">1</tspan> = 100 N
              </Label>
            </g>
            {/* piston besar (landasan) */}
            <g opacity={pistIn} transform={`translate(0 ${(1 - pistIn) * -40})`}>
              <rect x={LX - LW / 2} y={y2 - 40} width={LW} height={40} rx={6} fill="#5d6a93" stroke={C.ink} strokeOpacity={0.6} strokeWidth={2} />
              <rect x={LX - LW / 2 + 8} y={y2 - 34} width={LW - 16} height={8} rx={4} fill="#fff" opacity={0.14} />
            </g>
            {/* mobil 400 kg */}
            <g opacity={carIn}>
              <ellipse cx={LX} cy={y2 - 40} rx={130 * (0.4 + 0.6 * carDrop)} ry={7} fill="#000" opacity={0.4 * carDrop} />
              <Car x={LX} y={carY} scale={1.1} color={C.force} wheel={0} />
              <Label x={LX} y={carY - 170} size={28} color={C.force} weight={600}>
                400 kg · 4000 N
              </Label>
              <Ripple x={LX} y={y2 - 40} p={ramp(t, tDrop + 0.05, tDrop + 1.2)} r={200} color="force" />
            </g>

            {/* tekanan sama di bawah kedua piston */}
            <g opacity={eqP}>
              <line x1={SX - 60} y1={Y0 + 8} x2={LX + LW / 2 + 40} y2={Y0 + 8} stroke={C.press} strokeWidth={2} strokeDasharray="10 8" strokeDashoffset={-t * 14} />
              <PressureArrow x={SX} y={y1 + 2} nx={0} ny={1} L={46} width={4.5} />
              {[-130, -65, 0, 65, 130].map((dx) => (
                <PressureArrow key={dx} x={LX + dx} y={y2 + 2} nx={0} ny={1} L={46} width={4.5} />
              ))}
              <Label x={SX + 52} y={Y0 + 54} size={30} font="serif" italic color={C.press} weight={600}>
                p
              </Label>
              <Label x={LX + LW / 2 - 24} y={Y0 + 54} size={30} font="serif" italic color={C.press} weight={600}>
                p
              </Label>
              <Ripple x={SX} y={Y0 + 30} p={ramp(t, cue(2) + 0.2, cue(2) + 1.4)} r={80} color="press" />
              <Ripple x={LX} y={Y0 + 30} p={ramp(t, cue(2) + 0.4, cue(2) + 1.6)} r={180} color="press" />
            </g>
            {/* label luas */}
            <g opacity={aLab}>
              <Glow x={SX} y={y1 - 15} r={50} color="cyan" />
              <Label x={SX - SW / 2 - 24} y={y1 - 15} size={30} color={C.cyan} weight={600} anchor="end">
                <tspan fontFamily={FONT.serif} fontStyle="italic">A</tspan>
                <tspan baselineShift="sub" fontSize="0.65em">1</tspan> = 5 cm²
              </Label>
            </g>
            <g opacity={a2Lab}>
              <Label x={LX} y={(y2 + CH_T) / 2 + 10} size={32} color={C.cyan} weight={600}>
                <tspan fontFamily={FONT.serif} fontStyle="italic">A</tspan>
                <tspan baselineShift="sub" fontSize="0.65em">2</tspan> = 200 cm²
              </Label>
            </g>
            {/* tampak atas: 40 petak A₁ mengisi A₂ */}
            <g opacity={grid}>
              <rect x={1150} y={510} width={590} height={280} rx={18} fill="rgba(10,16,36,0.8)" stroke={C.line} strokeWidth={2} />
              <Label x={1445} y={540} size={22} color={C.muted}>
                tampak atas
              </Label>
              <rect x={1180} y={620} width={40} height={40} fill={C.cyan} opacity={0.85} />
              <Label x={1200} y={690} size={24} font="serif" italic color={C.cyan}>
                A₁
              </Label>
              <rect x={1270} y={570} width={320} height={200} fill="none" stroke={C.cyan} strokeWidth={3} />
              {Array.from({length: 40}, (_, i) => {
                const on = ramp(gridFill * 40, i, i + 1);
                const cx = 1270 + (i % 8) * 40;
                const cy = 570 + Math.floor(i / 8) * 40;
                return <rect key={i} x={cx + 3} y={cy + 3} width={34} height={34} rx={3} fill={C.cyan} opacity={0.65 * on} transform={`translate(${(1 - on) * (1180 - cx)} ${(1 - on) * (620 - cy)})`} />;
              })}
              <Label x={1665} y={670} size={40} font="mono" color={C.cyan} weight={700} opacity={ramp(gridFill, 0.9, 1)}>
                ×40
              </Label>
              <Twinkles x={1665} y={670} rx={50} ry={40} n={4} color="cyan" opacity={ramp(gridFill, 0.9, 1)} />
            </g>
            {/* energi: usaha mengalir dari tangan ke beban */}
            <g opacity={energy}>
              <Stream
                pts={[
                  [SX, y1 - 150],
                  [SX, y1 - 20],
                  [SX, 740],
                  [LX, 740],
                  [LX, y2 - 120],
                ]}
                color="work"
                n={16}
                speed={0.35}
                r={6}
                jitter={3}
              />
              <Glow x={LX} y={y2 - 100} r={170} color="work" opacity={0.5} />
              <Glow x={SX} y={y1 - 150} r={90} color="work" opacity={0.5} />
            </g>
            <Motes x={640} y={600} rx={420} ry={200} n={16} color="water" opacity={0.3} seed={6} />
            <Spark x={SX} y={y1 - 152} r={6} color="force" opacity={pumpRate} />
          </g>
        ) : null}
      </Stage>

      <Note x={1470} y={300} p={fLaw * ph1} color={C.press} size={32}>
        <span style={{color: C.press}}>Hukum Pascal</span>: tambahan tekanan
        <br />
        diteruskan ke seluruh bagian fluida
      </Note>
      <Note x={1460} y={300} p={twoP} color={C.cyan} size={32}>
        dua piston: <span style={{color: C.gold}}>kecil</span> &amp; <span style={{color: C.gold}}>besar</span>
        <br />
        satu cairan yang <span style={{color: C.cyan}}>sama</span>
      </Note>
      <Formula x={1460} y={300} p={f2 * ph2} accent={C.press} size={64}>
        <Frac n={<V>F₁</V>} d={<V>A₁</V>} /> = <Frac n={<V>F₂</V>} d={<V>A₂</V>} />
      </Formula>
      <Formula x={1440} y={300} p={f4 * ph2} accent={C.force} size={58}>
        <V>F</V>
        <Sub>1</Sub> = <Frac n="5" d="200" /> · 4000 = <span style={{color: C.force}}>100 N</span>
      </Formula>
      <Formula x={1460} y={300} p={f6 * ph2} accent={C.work} size={58}>
        <V>F</V>
        <Sub>1</Sub>
        <V>s</V>
        <Sub>1</Sub> = <V>F</V>
        <Sub>2</Sub>
        <V>s</V>
        <Sub>2</Sub>
        <div style={{fontSize: 38, fontFamily: FONT.mono, opacity: f6num, marginTop: 6}}>
          100·0,80 = 4000·0,02 = <span style={{color: C.work}}>80 J</span>
        </div>
      </Formula>
      <Badge x={1300} y={520} text="gaya × 40" color={C.force} opacity={bForce * ph2 * (1 - nEnergy)} scale={0.9 + 0.1 * bForce} />
      <Badge x={1610} y={520} text="jarak ÷ 40" color={C.gold} opacity={bDist * ph2 * (1 - nEnergy)} scale={0.9 + 0.1 * bDist} />
      <Note x={1460} y={620} p={nEnergy * ph2} color={C.work} size={30}>
        <span style={{color: C.muted, fontSize: 24}}>Video #1 · Usaha & Energi</span>
        <br />
        energi tidak bisa diciptakan
        <div style={{opacity: nTrade, color: C.work}}>gaya ⇄ jarak, W masuk = W keluar</div>
      </Note>
    </AbsoluteFill>
  );
};
