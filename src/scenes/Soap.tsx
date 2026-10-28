import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE_IN, EASE_IN_OUT, mix, ramp, rand, win} from '../anim';
import {WaterMolecule} from '../components/fluid';
import {Glow, Label, Motes, Note, Ripple, Stage, Tint, Twinkles} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Sabun & ikatan hidrogen.
// 1 jaringan ikatan hidrogen (garis putus-putus berkelip) + batang γ: air jauh lebih besar dari etanol/aseton.
// 2 molekul surfaktan (kepala suka air, ekor menghindari air) → menyisip di permukaan, ikatan putus, jarum γ turun.
// 3 sabun diteteskan dekat jarum mengapung → jarum tenggelam; air + sabun membasahi kain (sudut kontak mengecil, kotoran terangkat).

const useGT = () => {
  const f = useCurrentFrame();
  const {fps} = useScene();
  return f / fps;
};
const OIL = '#e8b04a';

/** Molekul surfaktan: kepala (bulat, suka air) + ekor zig-zag (menghindari air). (x, y) = pusat kepala; ang = arah ekor (derajat, 0 = ke atas). */
const Surfactant: React.FC<{x: number; y: number; ang?: number; s?: number; gT: number; seed?: number; opacity?: number}> = ({x, y, ang = 0, s = 1, gT, seed = 0, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  const n = 10;
  const pts = Array.from({length: n + 1}, (_, i) => {
    const along = 14 + i * 9;
    const side = (i % 2 ? 6 : -6) + 4 * Math.sin(gT * 3 + i * 0.6 + seed) * (i / n);
    return `${i ? 'L' : 'M'}${side.toFixed(1)},${(-along).toFixed(1)}`;
  }).join(' ');
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s})`} opacity={opacity}>
      <path d={pts} fill="none" stroke={OIL} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
      <circle r={13} fill={C.water} stroke="#cfeaff" strokeWidth={2} />
      <circle cx={-4} cy={-4} r={4} fill="#fff" opacity={0.6} />
    </g>
  );
};

/** Pengukur γ setengah lingkaran (0 … 0,08 N/m). */
const Dial: React.FC<{x: number; y: number; g: number; opacity?: number}> = ({x, y, g, opacity = 1}) => {
  if (opacity <= 0.001) return null;
  const R = 150;
  const angOf = (v: number) => Math.PI - (v / 0.08) * Math.PI;
  const a = angOf(g);
  const a72 = angOf(0.072);
  return (
    <g opacity={opacity}>
      <path d={`M${x - R},${y} A${R},${R} 0 0 1 ${x + R},${y}`} fill="none" stroke={C.line} strokeWidth={18} strokeLinecap="round" />
      <path d={`M${x - R},${y} A${R},${R} 0 0 1 ${x + R * Math.cos(a)},${y - R * Math.sin(a)}`} fill="none" stroke={C.cyan} strokeWidth={18} strokeLinecap="round" opacity={0.8} />
      {[0, 0.02, 0.04, 0.06, 0.08].map((v) => (
        <line key={v} x1={x + (R - 24) * Math.cos(angOf(v))} y1={y - (R - 24) * Math.sin(angOf(v))} x2={x + (R - 12) * Math.cos(angOf(v))} y2={y - (R - 12) * Math.sin(angOf(v))} stroke={C.muted} strokeWidth={2.5} />
      ))}
      <line x1={x + (R + 12) * Math.cos(a72)} y1={y - (R + 12) * Math.sin(a72)} x2={x + (R + 30) * Math.cos(a72)} y2={y - (R + 30) * Math.sin(a72)} stroke={C.cyan} strokeWidth={3} />
      <Label x={x} y={y - R - 52} size={22} color={C.cyan}>
        0,072 N/m · air murni
      </Label>
      <line x1={x} y1={y} x2={x + (R - 30) * Math.cos(a)} y2={y - (R - 30) * Math.sin(a)} stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
      <circle cx={x} cy={y} r={12} fill={C.cyan} />
      <Label x={x} y={y + 44} size={30} color={C.cyan} weight={700} font="serif" italic>
        γ
      </Label>
    </g>
  );
};

/* ================================================================== */
/* 1 — jaringan ikatan hidrogen                                         */
/* ================================================================== */
const NR = 4;
const NC = 6;
const NX0 = 230;
const NY0 = 330;
const NSX = 160;
const NSY = 150;
const HI = {c: 2, r: 1};

const PhaseNet: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const pos = (c: number, r: number): [number, number] => [
    NX0 + c * NSX + (r % 2) * 40 + 18 * (rand(c * 7 + r * 3) - 0.5) + 6 * Math.sin(gT * 1.6 + c * 1.3 + r * 2.1),
    NY0 + r * NSY + 18 * (rand(c * 3 + r * 11) - 0.5) + 5 * Math.sin(gT * 1.4 + c * 2.2 + r),
  ];
  const tB = wordOf(0, 'ikatan');
  const bonds = ramp(t, tB - 0.2, tB + 1.2);
  const hi = ramp(t, cue(1) + 0.4, cue(1) + 1.2);
  const tK = wordOf(1, 'kulit');
  const skin = ramp(t, tK - 0.4, tK + 0.8);
  const bars = ramp(t, cue(0) + 0.6, cue(0) + 2.0, EASE_IN_OUT);
  const pairs: [number, number, number, number][] = [];
  for (let r = 0; r < NR; r++)
    for (let c = 0; c < NC; c++) {
      if (c < NC - 1) pairs.push([c, r, c + 1, r]);
      if (r < NR - 1) pairs.push([c, r, c, r + 1]);
    }
  const G = [
    {name: 'air', v: 0.072, c: C.cyan},
    {name: 'etanol', v: 0.022, c: C.muted},
    {name: 'aseton', v: 0.024, c: C.muted},
  ];
  const topY = NY0 - 50;
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <rect x={NX0 - 70} y={topY} width={NC * NSX + 60} height={NR * NSY + 10} rx={20} fill={C.water} opacity={0.1} />
        <path
          d={Array.from({length: 18}, (_, i) => {
            const x = NX0 - 70 + (i / 17) * (NC * NSX + 60);
            return `${i ? 'L' : 'M'}${x.toFixed(1)},${(topY + 3 * Math.sin(x * 0.03 + gT * 1.5)).toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke={C.cyan}
          strokeWidth={3 + 4 * skin}
          opacity={0.35 + 0.6 * skin}
        />
        <path
          d={Array.from({length: 18}, (_, i) => {
            const x = NX0 - 70 + (i / 17) * (NC * NSX + 60);
            return `${i ? 'L' : 'M'}${x.toFixed(1)},${(topY + 3 * Math.sin(x * 0.03 + gT * 1.5)).toFixed(1)}`;
          }).join(' ')}
          fill="none"
          stroke={C.cyan}
          strokeWidth={18}
          opacity={0.18 * skin}
        />
        {/* ikatan hidrogen */}
        {pairs.map(([c1, r1, c2, r2], i) => {
          const [x1, y1] = pos(c1, r1);
          const [x2, y2] = pos(c2, r2);
          const L = Math.hypot(x2 - x1, y2 - y1);
          const ux = (x2 - x1) / L;
          const uy = (y2 - y1) / L;
          const isHi = (c1 === HI.c && r1 === HI.r) || (c2 === HI.c && r2 === HI.r);
          const fl = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(gT * (1.5 + rand(i) * 2) + i * 1.7));
          const draw = ramp(bonds, (i / pairs.length) * 0.6, (i / pairs.length) * 0.6 + 0.4);
          return (
            <line
              key={i}
              x1={x1 + ux * 34}
              y1={y1 + uy * 34}
              x2={x1 + ux * (34 + (L - 68) * draw)}
              y2={y1 + uy * (34 + (L - 68) * draw)}
              stroke={isHi ? C.gold : C.cyan}
              strokeWidth={isHi ? 3 + 1.5 * hi : 3}
              strokeDasharray="7 7"
              strokeDashoffset={-gT * 16}
              strokeLinecap="round"
              opacity={(isHi ? Math.max(fl, hi) : fl) * draw * 0.9}
            />
          );
        })}
        {(() => {
          const [x, y] = pos(HI.c, HI.r);
          return <Glow x={x} y={y} r={120} color="gold" opacity={hi * 0.7} />;
        })()}
        {Array.from({length: NR}, (_, r) =>
          Array.from({length: NC}, (_, c) => {
            const [x, y] = pos(c, r);
            return <WaterMolecule key={`${c}${r}`} x={x} y={y} s={0.9} rot={rand(c * 5 + r) * 360 + 18 * Math.sin(gT * (0.8 + rand(c + r * 9)) + c)} />;
          }),
        )}
        <Label x={NX0 - 50} y={topY - 34} size={24} color={C.cyan} anchor="start" opacity={skin} weight={600}>
          kulit air
        </Label>
        {/* batang γ */}
        <g opacity={bars * (1 - ramp(t, cue(1) + 4.5, cue(1) + 5.3, EASE_IN_OUT))}>
          <Label x={1500} y={330} size={26} color={C.muted} weight={600} spacing={2}>
            TEGANGAN PERMUKAAN γ
          </Label>
          <line x1={1240} y1={760} x2={1760} y2={760} stroke={C.muted} strokeWidth={2.5} />
          {G.map((g, i) => {
            const x = 1310 + i * 190;
            const h = (g.v / 0.08) * 360 * bars;
            return (
              <g key={i}>
                <rect x={x - 55} y={760 - h} width={110} height={h} rx={10} fill={g.c} opacity={i === 0 ? 0.85 : 0.45} />
                <rect x={x - 45} y={760 - h + 8} width={18} height={Math.max(0, h - 16)} rx={8} fill="#fff" opacity={0.15 + 0.08 * Math.sin(gT * 2 + i)} />
                <Label x={x} y={792} size={26} color={i === 0 ? C.cyan : C.muted} weight={600}>
                  {g.name}
                </Label>
              </g>
            );
          })}
          <Label x={1310} y={760 - (0.072 / 0.08) * 360 * bars - 30} size={26} color={C.cyan} weight={700} opacity={bars}>
            0,072 N/m
          </Label>
          <Twinkles x={1310} y={430} rx={80} ry={40} n={3} opacity={bars} seed={3} />
        </g>
        <Motes x={650} y={560} rx={500} ry={280} n={18} color="cyan" opacity={0.35} seed={5} />
      </Stage>
      <Note x={1500} y={250} p={ramp(t, tB - 0.1, tB + 0.7)} color={C.cyan} size={30}>
        jawabannya: <Tint c={C.cyan}>ikatan hidrogen</Tint>
      </Note>
      <Note x={1500} y={520} p={ramp(t, cue(1) + 5.0, cue(1) + 5.8)} color={C.gold} size={30}>
        jaringan tarik-menarik → <Tint c={C.cyan}>kulit air kuat</Tint>
      </Note>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* 2 — surfaktan                                                        */
/* ================================================================== */
const SY = 480; // permukaan air
const SX0 = 160;
const SX1 = 1150;
const MCOL = 11;
const MSP = 90;
const SLOTS = [0, 1, 3, 4, 6, 7, 8, 9];

const PhaseSurf: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  // baris 2: satu molekul surfaktan diperbesar
  const close = win(t, cue(2) - 0.3, cue(3) - 0.2, 0.7, 0.6);
  const headL = ramp(t, wordOf(2, 'kepala') - 0.2, wordOf(2, 'kepala') + 0.6);
  const tailL = ramp(t, wordOf(2, 'ekor') - 0.2, wordOf(2, 'ekor') + 0.6);
  // baris 3: menyisip di permukaan
  const xsec = ramp(t, cue(3) - 0.3, cue(3) + 0.5);
  const arrive = SLOTS.map((_, k) => ramp(t, cue(3) + 0.6 + 0.75 * k, cue(3) + 2.0 + 0.75 * k, EASE_IN_OUT));
  const frac = arrive.reduce((s, a) => s + a, 0) / SLOTS.length;
  const g = 0.072 - 0.04 * frac;
  const molPos = (c: number, r: number): [number, number] => [SX0 + 50 + c * MSP + (r % 2) * 30 + 4 * Math.sin(gT * 1.8 + c + r * 2), SY + 45 + r * 95 + 4 * Math.sin(gT * 1.5 + c * 1.7 + r)];
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        {/* close-up */}
        <g opacity={close}>
          <Glow x={900} y={560} r={360} color="water" opacity={0.35} />
          <Surfactant x={700} y={560} ang={90 + 5 * Math.sin(gT * 0.8)} s={4} gT={gT} />
          <g opacity={headL}>
            <circle cx={700} cy={560} r={80} fill="none" stroke={C.water} strokeWidth={3} strokeDasharray="8 6" strokeDashoffset={-gT * 12} />
            <Label x={700} y={730} size={32} color={C.water} weight={700}>
              kepala: suka air
            </Label>
            <Label x={700} y={772} size={24} color={C.muted}>
              (hidrofilik)
            </Label>
            {[0, 1, 2, 3, 4].map((i) => {
              const a = Math.PI * (0.62 + 0.19 * i) + 0.12 * Math.sin(gT * 0.7 + i);
              return <WaterMolecule key={i} x={700 + 135 * Math.cos(a)} y={560 + 135 * Math.sin(a)} s={0.6} rot={(a * 180) / Math.PI + 90} opacity={0.85} />;
            })}
          </g>
          <g opacity={tailL}>
            <rect x={770} y={500} width={390} height={120} rx={60} fill="none" stroke={OIL} strokeWidth={3} strokeDasharray="8 6" strokeDashoffset={gT * 12} />
            <Label x={965} y={455} size={32} color={OIL} weight={700}>
              ekor: menghindari air
            </Label>
            <Label x={965} y={412} size={24} color={C.muted}>
              (hidrofobik)
            </Label>
          </g>
        </g>
        {/* penampang permukaan */}
        <g opacity={xsec}>
          <rect x={SX0} y={SY} width={SX1 - SX0} height={360} rx={12} fill={C.water} opacity={0.14} />
          <line x1={SX0} y1={SY} x2={SX1} y2={SY} stroke="#cfeaff" strokeWidth={2.5} opacity={0.7} />
          <Label x={SX0 + 10} y={SY - 30} size={24} color={C.muted} anchor="start">
            udara
          </Label>
          {/* ikatan hidrogen baris atas: putus saat surfaktan menyisip */}
          {Array.from({length: MCOL - 1}, (_, c) => {
            const k = SLOTS.indexOf(c);
            const broken = k >= 0 ? arrive[k] : 0;
            const [x1, y1] = molPos(c, 0);
            const [x2, y2] = molPos(c + 1, 0);
            const fl = 0.5 + 0.4 * Math.sin(gT * 2.2 + c);
            return <line key={c} x1={x1 + 24} y1={y1} x2={x2 - 24} y2={y2} stroke={C.cyan} strokeWidth={3} strokeDasharray="6 6" strokeDashoffset={-gT * 14} opacity={fl * (1 - broken)} />;
          })}
          {Array.from({length: MCOL}, (_, c) => {
            const [x1, y1] = molPos(c, 0);
            const [x2, y2] = molPos(c, 1);
            return <line key={c} x1={x1} y1={y1 + 24} x2={x2} y2={y2 - 24} stroke={C.cyan} strokeWidth={2.5} strokeDasharray="6 6" strokeDashoffset={-gT * 14} opacity={0.35} />;
          })}
          {[0, 1, 2].map((r) =>
            Array.from({length: MCOL}, (_, c) => {
              const [x, y] = molPos(c, r);
              return x < SX1 - 20 ? <WaterMolecule key={`${c}${r}`} x={x} y={y} s={0.62} rot={rand(c * 3 + r * 7) * 360 + 15 * Math.sin(gT + c)} opacity={r === 0 ? 1 : 0.6} /> : null;
            }),
          )}
          {SLOTS.map((c, k) => {
            const sx = SX0 + 50 + c * MSP + MSP / 2;
            const p = arrive[k];
            const x = mix(sx + 140, sx, p);
            const y = mix(290, SY + 14, p);
            return <Surfactant key={k} x={x} y={y} ang={mix(-50, 0, p) + 5 * Math.sin(gT * 1.3 + k)} s={1.1} gT={gT} seed={k} opacity={ramp(t, cue(3) + 0.2 + 0.75 * k, cue(3) + 0.7 + 0.75 * k)} />;
          })}
          {SLOTS.map((c, k) => (
            <Ripple key={k} x={SX0 + 50 + c * MSP + MSP / 2} y={SY} p={ramp(t, cue(3) + 2.0 + 0.75 * k, cue(3) + 3.0 + 0.75 * k, (q) => q)} r={60} color="gold" rings={2} />
          ))}
        </g>
        <Dial x={1480} y={640} g={g} opacity={ramp(t, cue(3) + 0.3, cue(3) + 1.1)} />
        <Motes x={960} y={540} rx={760} ry={260} n={18} color="gold" opacity={0.3} seed={7} />
      </Stage>
      <Note x={1480} y={300} p={ramp(t, wordOf(3, 'memutus') - 0.2, wordOf(3, 'memutus') + 0.6) * xsec} color={OIL} size={28}>
        tarikan antarmolekul terputus → <Tint c={C.cyan}>γ turun</Tint>
      </Note>
      <Note x={960} y={250} p={ramp(t, cue(2) + 0.2, cue(2) + 1.0) * close} color={C.water} size={30}>
        sabun & deterjen = <Tint c={OIL}>surfaktan</Tint>
      </Note>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* 3 — jarum tenggelam & kain dibasahi                                  */
/* ================================================================== */
const DX0 = 160;
const DX1 = 900;
const DS = 560;
const DB = 830;
const NDX = 650;
const NDL = 230;
const DROP_X = 330;

/** Tetesan pada permukaan datar dengan sudut kontak θ (luas tetap A). */
const cap = (cx: number, yb: number, thetaDeg: number, A: number) => {
  const th = (thetaDeg * Math.PI) / 180;
  const R = Math.sqrt(A / (th - Math.sin(th) * Math.cos(th)));
  const a = R * Math.sin(th);
  const large = thetaDeg > 90 ? 1 : 0;
  return {d: `M${(cx - a).toFixed(1)},${yb} A${R.toFixed(1)},${R.toFixed(1)} 0 ${large} 1 ${(cx + a).toFixed(1)},${yb} Z`, a, R, h: R * (1 - Math.cos(th))};
};
const thetaArc = (x: number, y: number, thetaDeg: number, r: number) => {
  const th = (thetaDeg * Math.PI) / 180;
  const ex = x + r * Math.cos(Math.PI + th);
  const ey = y + r * Math.sin(Math.PI + th);
  return `M${x - r},${y} A${r},${r} 0 0 1 ${ex.toFixed(1)},${ey.toFixed(1)}`;
};

const PhaseNeedle: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const dishIn = ramp(t, cue(4) - 0.4, cue(4) + 0.6);
  const tFall = wordOf(4, 'sabun') + 0.2;
  const tHit = tFall + 0.5;
  const dropY = mix(440, DS, ramp(t, tFall, tHit, EASE_IN));
  const dropOp = ramp(t, tFall - 0.6, tFall - 0.2) * (1 - ramp(t, tHit, tHit + 0.1));
  const spread = 560 * ramp(t, tHit, tHit + 1.8, EASE_IN_OUT);
  const tSink = tHit + 0.75;
  const dimple = 12 * (1 - ramp(t, tSink - 0.2, tSink + 0.3));
  const sink = ramp(t, tSink, tSink + 2.0, EASE_IN);
  const ny = mix(DS + dimple - 4, DB - 14, sink);
  const nrot = 7 * Math.sin(Math.PI * sink);
  const g = 0.072 - 0.04 * ramp(t, tHit, tHit + 1.5);
  const dimRight = win(t, cue(4) + 0.2, cue(5) - 0.2, 0.6, 0.6);
  const dishDim = 1 - ramp(t, cue(5) - 0.4, cue(5) + 0.4, EASE_IN_OUT);
  const wave = (x: number) => 1.5 * Math.sin(x * 0.03 + gT * 1.8);
  const surfY = (x: number) => DS + wave(x) + dimple * Math.exp(-((Math.max(0, Math.abs(x - NDX) - NDL / 2) / 30) ** 2));
  const top = Array.from({length: 63}, (_, i) => {
    const x = DX0 + 6 + (i / 62) * (DX1 - DX0 - 12);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${surfY(x).toFixed(1)}`;
  }).join(' ');
  // kain (baris 5)
  const fab = ramp(t, cue(5) - 0.2, cue(5) + 0.7);
  const wet = ramp(t, cue(5) + 1.2, cue(5) + 4.2, EASE_IN_OUT);
  const thR = mix(120, 22, wet);
  const thL = 120 + 3 * Math.sin(gT * 2);
  const FB = 676;
  const dl = cap(1210, FB, thL, 9000);
  const dr = cap(1600, FB, thR, 9000);
  const lift = ramp(t, cue(5) + 3.2, cue(5) + 6.5, EASE_IN_OUT);
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          <linearGradient id="sp-w" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.water} stopOpacity={0.55} />
            <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
          </linearGradient>
          <linearGradient id="sp-n" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f2f5ff" />
            <stop offset="100%" stopColor="#6b7698" />
          </linearGradient>
          <radialGradient id="sp-drop" cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#d8f0ff" stopOpacity={0.9} />
            <stop offset="45%" stopColor={C.water} stopOpacity={0.8} />
            <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
          </radialGradient>
        </defs>
        {/* cawan */}
        <g opacity={dishIn * dishDim}>
          <ellipse cx={(DX0 + DX1) / 2} cy={DB + 14} rx={420} ry={13} fill="#000" opacity={0.35} />
          <path d={`${top} L${DX1 - 6},${DB} L${DX0 + 6},${DB} Z`} fill="url(#sp-w)" />
          <path d={top} fill="none" stroke="#cfeaff" strokeOpacity={0.8} strokeWidth={2.5} />
          {/* lapisan sabun yang menyebar */}
          {spread > 1 ? <path d={`M${Math.max(DX0 + 8, DROP_X - spread)},${DS - 1} L${Math.min(DX1 - 8, DROP_X + spread)},${DS - 1}`} stroke={OIL} strokeWidth={5} strokeLinecap="round" opacity={0.8 * (1 - 0.4 * ramp(t, tHit + 2, tHit + 4))} /> : null}
          {Array.from({length: 12}, (_, i) => {
            const x = DROP_X + (i - 5.5) * 48;
            const on = 1 - ramp(Math.abs(x - DROP_X), spread - 40, spread);
            return x > DX0 + 14 && x < DX1 - 14 ? <line key={i} x1={x} y1={DS - 2} x2={x + 3 * Math.sin(gT * 3 + i)} y2={DS - 22} stroke={OIL} strokeWidth={3} strokeLinecap="round" opacity={on * 0.85} /> : null;
          })}
          {/* jarum */}
          <g transform={`rotate(${nrot} ${NDX} ${ny})`}>
            <rect x={NDX - NDL / 2} y={ny - 5} width={NDL} height={10} rx={5} fill="url(#sp-n)" stroke="#dfe6f6" strokeWidth={1} />
            <path d={`M${NDX + NDL / 2 - 2},${ny - 5} L${NDX + NDL / 2 + 24},${ny} L${NDX + NDL / 2 - 2},${ny + 5} Z`} fill="#cfd8f0" />
          </g>
          <path d={`M${DX0},${DS - 90} L${DX0},${DB + 6} L${DX1},${DB + 6} L${DX1},${DS - 90}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} strokeLinejoin="round" />
          {/* pipet sabun */}
          <g opacity={win(t, cue(4) - 0.2, tHit + 1.5, 0.6, 0.6)}>
            <path d={`M${DROP_X - 10},${300} L${DROP_X - 10},${410} L${DROP_X},${432} L${DROP_X + 10},${410} L${DROP_X + 10},${300}`} fill="#cfeaff" fillOpacity={0.2} stroke="#e8f4ff" strokeWidth={2.5} />
            <rect x={DROP_X - 18} y={240} width={36} height={64} rx={16} fill="#c84a5a" />
            <rect x={DROP_X - 7} y={360} width={14} height={48} fill={OIL} opacity={0.7} />
            <Label x={DROP_X + 30} y={300} size={24} color={OIL} anchor="start" weight={600}>
              sabun
            </Label>
          </g>
          <ellipse cx={DROP_X} cy={dropY} rx={7} ry={10} fill={OIL} opacity={dropOp} />
          <Ripple x={DROP_X} y={DS} p={ramp(t, tHit, tHit + 1.4, (q) => q)} r={180} color="gold" />
          <Ripple x={NDX} y={DS} p={ramp(t, tSink, tSink + 1.5, (q) => q)} r={200} color="cyan" />
          <Label x={NDX} y={DS - 60} size={26} color={C.muted} opacity={1 - ramp(t, tSink, tSink + 0.6)}>
            jarum mengapung
          </Label>
          <Label x={NDX} y={DB - 60} size={26} color={C.heat} weight={700} opacity={ramp(t, tSink + 1.6, tSink + 2.2)}>
            tenggelam!
          </Label>
        </g>
        <Dial x={1400} y={640} g={g} opacity={dimRight} />
        {/* kain: air saja vs air + sabun */}
        <g opacity={fab} transform="translate(960 690) scale(1.35) translate(-1400 -690)">
          {Array.from({length: 22}, (_, i) => (
            <g key={i}>
              <circle cx={1020 + i * 36} cy={FB + 14} r={14} fill="#7f89a8" stroke="#b6c0dc" strokeWidth={1.5} />
              <circle cx={1038 + i * 36} cy={FB + 36} r={14} fill="#5d6680" stroke="#9aa6c8" strokeWidth={1.5} />
            </g>
          ))}
          {/* air menyusup ke celah kain */}
          <rect x={1600 - dr.a} y={FB + 4} width={2 * dr.a} height={48} fill={C.water} opacity={0.45 * wet} />
          {/* kotoran */}
          {Array.from({length: 5}, (_, i) => {
            const bx = 1530 + i * 34;
            const up = i % 2 ? lift : lift * 0.85;
            const by = mix(FB + 26, FB - 22 - 12 * i, up) + 3 * Math.sin(gT * 2 + i) * up;
            return (
              <g key={i}>
                <circle cx={bx} cy={by} r={8} fill="#8a5a32" />
                {Array.from({length: 6}, (_, j) => {
                  const a = (j / 6) * 2 * Math.PI + gT * 0.5;
                  return <line key={j} x1={bx + 9 * Math.cos(a)} y1={by + 9 * Math.sin(a)} x2={bx + 17 * Math.cos(a)} y2={by + 17 * Math.sin(a)} stroke={OIL} strokeWidth={2} opacity={up} />;
                })}
              </g>
            );
          })}
          {[0, 1].map((i) => (
            <circle key={i} cx={1180 + i * 60} cy={FB + 26} r={8} fill="#8a5a32" />
          ))}
          <path d={dl.d} fill="url(#sp-drop)" stroke="#cfeaff" strokeWidth={2} />
          <path d={dr.d} fill="url(#sp-drop)" stroke="#cfeaff" strokeWidth={2} opacity={0.92} />
          <path d={thetaArc(1210 + dl.a, FB, thL, 30)} fill="none" stroke={C.gold} strokeWidth={3.5} />
          <path d={thetaArc(1600 + dr.a, FB, thR, 46)} fill="none" stroke={C.gold} strokeWidth={3.5} />
          <Label x={1210 + dl.a + 34} y={FB - 46} size={26} color={C.gold} anchor="start" weight={700} font="serif" italic>
            θ besar
          </Label>
          <Label x={1600 + dr.a - 10} y={FB - 52} size={26} color={C.gold} anchor="end" weight={700} font="serif" italic opacity={wet}>
            θ kecil
          </Label>
          <Label x={1210} y={FB + 92} size={26} color={C.ink} weight={600}>
            air saja
          </Label>
          <Label x={1600} y={FB + 92} size={26} color={C.ink} weight={600}>
            air + sabun
          </Label>
          <Twinkles x={1600} y={FB - 40} rx={160} ry={30} n={4} opacity={wet} seed={6} />
        </g>
        <Motes x={530} y={DS} rx={360} ry={180} n={14} color="gold" opacity={0.3} seed={9} />
      </Stage>
      <Note x={1400} y={330} p={dimRight} color={OIL} size={28}>
        sabun menurunkan <Tint c={C.cyan}>γ</Tint> → kulit air tak sanggup menahan jarum
      </Note>
      <Note x={960} y={300} p={ramp(t, cue(5) + 0.3, cue(5) + 1.1)} color={C.cyan} size={30}>
        <Tint c={C.cyan}>γ</Tint> rendah → air <Tint c={C.cyan}>membasahi</Tint> kain & menyusup ke celah
      </Note>
      <div style={{position: 'absolute', left: 960, top: 390, transform: 'translateX(-50%)', fontFamily: FONT.head, fontSize: 24, color: C.muted, opacity: ramp(t, cue(5) + 3.5, cue(5) + 4.3), whiteSpace: 'nowrap'}}>
        kotoran terbungkus surfaktan dan terangkat
      </div>
    </AbsoluteFill>
  );
};

export const Soap: React.FC = () => {
  const {t, cue} = useScene();
  const p1 = 1 - ramp(t, cue(2) - 0.6, cue(2) + 0.1, EASE_IN_OUT);
  const p2 = win(t, cue(2) - 0.5, cue(4) - 0.6, 0.7, 0.6);
  const p3 = ramp(t, cue(4) - 0.5, cue(4) + 0.3);
  return (
    <AbsoluteFill>
      <PhaseNet op={p1} />
      <PhaseSurf op={p2} />
      <PhaseNeedle op={p3} />
    </AbsoluteFill>
  );
};
