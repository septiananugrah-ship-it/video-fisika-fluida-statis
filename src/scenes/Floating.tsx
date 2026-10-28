import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {EASE_IN, EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Tank, Water, wavePath} from '../components/fluid';
import {Crate} from '../components/physics';
import {Arrow, Card, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Sub, TSub, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Terapung, melayang, tenggelam.
// A: tiga benda di tangki (ρ < ρf, = ρf, > ρf) + panah W & F_A pada benda terapung + fraksi tercelup.
// B: balok kayu ρ = 600, H = 20 cm → 12 cm tercelup, 8 cm di atas (osilasi teredam, gerak lambat ×¼).
// C: kapal baja (penampang: lambung berisi udara) vs baut, meter ρ rata-rata.
// D: rakit V = 0,50 m³, 200 kg → muatan maks 300 kg (6 peti × 50 kg, garis air naik).

/** Respons teredam: 1 di τ = 0 meluruh ke 0. */
const damp = (tau: number, w: number, z: number) => (tau <= 0 ? 1 : Math.exp(-z * w * tau) * Math.cos(w * Math.sqrt(1 - z * z) * tau));
/** Tinggi permukaan yang sama dengan komponen Water (amp 4). */
const surfAt = (x: number, y: number, gT: number, seed = 0) => y + 2.4 * Math.sin(x * 0.035 + gT * 2.2 + seed) + 1.6 * Math.sin(x * 0.0805 - gT * 3.1 + seed * 2);

/** Jatuh bebas di udara lalu tenggelam dengan kecepatan terminal (hambatan air). */
const fallSink = (tau: number, y0: number, yEnter: number, yBot: number, vt: number) => {
  const g = 900;
  const k = 3;
  if (tau <= 0) return y0;
  const t1 = Math.sqrt((2 * Math.max(1, yEnter - y0)) / g);
  if (tau < t1) return Math.min(yBot, y0 + 0.5 * g * tau * tau);
  const v1 = g * t1;
  const s = tau - t1;
  return Math.min(yBot, yEnter + vt * s + ((v1 - vt) / k) * (1 - Math.exp(-k * s)));
};
const landTime = (y0: number, yEnter: number, yBot: number, vt: number) => {
  let tt = 0;
  while (fallSink(tt, y0, yEnter, yBot, vt) < yBot - 0.5 && tt < 30) tt += 1 / 120;
  return tt;
};

/** Tangki dengan benda di dalamnya; lapisan air tipis di depan benda agar bagian tercelup tampak di bawah air. */
const TankWith: React.FC<{x: number; y: number; w: number; h: number; level: number; seed?: number; bubbles?: number; children?: React.ReactNode; overlay?: number}> = ({
  x,
  y,
  w,
  h,
  level,
  seed = 0,
  bubbles = 4,
  children,
  overlay = 0.4,
}) => (
  <g>
    <Tank x={x} y={y} w={w} h={h} level={level} seed={seed} bubbles={bubbles} />
    {children}
    <Water x={x + 6} y={y - 6 - level} w={w - 12} h={level} opacity={overlay} caustics={false} seed={seed} />
  </g>
);

/** Baris kartu yang tumbuh (tinggi & opasitas) agar kartu tidak menyisakan ruang kosong. */
const Grow: React.FC<{p: number; h: number; children: React.ReactNode; style?: React.CSSProperties}> = ({p, h, children, style}) => (
  <div style={{opacity: p, maxHeight: p < 0.999 ? p * h : undefined, overflow: p < 0.999 ? 'hidden' : undefined, ...style}}>{children}</div>
);

const useGT = () => {
  const f = useCurrentFrame();
  const {fps} = useScene();
  return f / fps;
};

/* ================================================================== */
/* A — tiga benda                                                       */
/* ================================================================== */
const TA = {x: 140, yb: 840, w: 860, h: 560, level: 450};
const SURF_A = TA.yb - 6 - TA.level; // 384
const S = 110;
const HOVER = 222;
const XS = [300, 570, 840];
const YBOT_A = TA.yb - 6 - S / 2;
const LAND_A = landTime(HOVER, SURF_A - S / 2 + 8, YBOT_A, 150);

const WoodCube: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={8} fill="url(#fl-wood)" stroke="#f0c48a" strokeWidth={3} />
    {[0.22, 0.45, 0.7].map((k, i) => (
      <path key={i} d={`M${-s / 2 + 8},${-s / 2 + s * k} q${s * 0.3},${-8 + i * 5} ${s * 0.55},0 t${s * 0.3},2`} fill="none" stroke="#7a4a22" strokeWidth={2.5} opacity={0.6} />
    ))}
    <rect x={-s / 2 + 6} y={-s / 2 + 5} width={s - 12} height={7} rx={3} fill="#fff" opacity={0.18} />
  </g>
);
const PlasticCube: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={14} fill="#e6ecff" fillOpacity={0.55} stroke="#ffffff" strokeWidth={3} />
    <rect x={-s / 2 + 10} y={-s / 2 + 10} width={s * 0.28} height={s * 0.5} rx={8} fill="#fff" opacity={0.35} />
  </g>
);
const SteelCube: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={6} fill="url(#fl-steel)" stroke="#b6c0dc" strokeWidth={3} />
    {[-1, 1].map((a) =>
      [-1, 1].map((b) => <circle key={`${a}${b}`} cx={a * s * 0.32} cy={b * s * 0.32} r={5} fill="#1d2440" stroke="#9aa6c8" strokeWidth={1.5} />),
    )}
    <path d={`M${-s / 2 + 8},${-s / 2 + 8} L${s / 2 - 22},${-s / 2 + 8}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const PhaseA: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const tk = [wordOf(1, 'terapung'), wordOf(1, 'melayang'), wordOf(1, 'tenggelam')];
  const appear = [0, 1, 2].map((k) => ramp(t, cue(0) + 0.2 + 0.25 * k, cue(0) + 1.0 + 0.25 * k));
  const hov = (k: number) => HOVER + 5 * Math.sin(t * 1.4 + k * 1.7);

  // benda 1 terapung (ρ = ½ ρf → setengah tercelup)
  const tau1 = t - tk[0];
  const set1 = ramp(tau1, 1.2, 3);
  const y1 = tau1 <= 0 ? hov(0) : SURF_A + (hov(0) - SURF_A) * damp(tau1, 2.4, 0.3) + (surfAt(XS[0], SURF_A, gT) - SURF_A) * set1;
  const rot1 = 2.5 * Math.sin(gT * 1.3) * set1;
  // benda 2 melayang
  const tau2 = t - tk[1];
  const drift = ramp(tau2, 0.8, 3);
  const y2 = tau2 <= 0 ? hov(1) : 610 + (hov(1) - 610) * damp(tau2, 1.5, 0.55) + 16 * Math.sin(t * 0.45) * drift;
  const x2 = XS[1] + 12 * Math.sin(t * 0.3) * drift;
  const rot2 = 4 * Math.sin(t * 0.37) * drift;
  // benda 3 tenggelam
  const tau3 = t - tk[2];
  const y3 = tau3 <= 0 ? hov(2) : fallSink(tau3, hov(2), SURF_A - S / 2 + 8, YBOT_A, 150);
  const v3 = Math.abs(y3 - (tau3 - 0.05 <= 0 ? hov(2) : fallSink(tau3 - 0.05, hov(2), SURF_A - S / 2 + 8, YBOT_A, 150))) / 0.05;
  const inWater3 = ramp(y3, SURF_A - 20, SURF_A + 40);

  const labels = [
    {rel: '<', word: 'terapung', c: C.buoy},
    {rel: '=', word: 'melayang', c: C.cyan},
    {rel: '>', word: 'tenggelam', c: C.force},
  ];

  // panah gaya pada benda terapung (baris 2) + kamera
  const forces = win(t, cue(2) + 0.3, cue(4) - 0.7, 0.6, 0.5);
  const vol = win(t, cue(2) + 1.6, cue(4) - 0.7, 0.6, 0.5);
  const cam = ramp(t, cue(2) - 0.2, cue(2) + 1.6, EASE_IN_OUT) * (1 - ramp(t, cue(4) - 1.8, cue(4) - 0.3, EASE_IN_OUT));
  const zs = 1 + 0.12 * cam;

  // timbangan (baris 0)
  const scaleOp = win(t, cue(0) + 0.8, cue(1) - 0.2, 0.6, 0.6);
  const tilt = 7 * Math.sin(t * 0.9);
  const cmp = win(t, cue(0) + 0.4, cue(2) - 0.4, 0.7, 0.6);
  const rowsOut = 1 - ramp(t, cue(2) - 0.4, cue(2) + 0.2, EASE_IN_OUT);
  const row = tk.map((tt) => ramp(t, tt - 0.2, tt + 0.5) * rowsOut);
  const eq1 = ramp(t, cue(2) + 0.4, cue(2) + 1.2);
  const eq2 = ramp(t, cue(3) + 0.3, cue(3) + 1.1);

  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          <linearGradient id="fl-wood" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d99a5b" />
            <stop offset="100%" stopColor="#8f5a2c" />
          </linearGradient>
          <linearGradient id="fl-steel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6b7698" />
            <stop offset="100%" stopColor="#2a3150" />
          </linearGradient>
        </defs>
        <g transform={`translate(420 470) scale(${zs}) translate(-420 -470)`}>
          <TankWith x={TA.x} y={TA.yb} w={TA.w} h={TA.h} level={TA.level} seed={1} bubbles={5}>
            {/* jejak gelembung benda tenggelam */}
            {Array.from({length: 7}, (_, i) => {
              const ph = (((t * 1.3 + i / 7) % 1) + 1) % 1;
              return (
                <circle
                  key={i}
                  cx={XS[2] + 18 * Math.sin(i * 2.3 + t * 3)}
                  cy={y3 - S / 2 - 10 - ph * 90}
                  r={2 + (i % 3)}
                  fill="none"
                  stroke="#d8f0ff"
                  strokeWidth={1.4}
                  opacity={cyc(ph) * inWater3 * Math.min(1, v3 / 120) * 0.8}
                />
              );
            })}
            <ellipse cx={XS[2]} cy={TA.yb - 8} rx={70} ry={8} fill="#000" opacity={0.35 * ramp(y3, YBOT_A - 120, YBOT_A)} />
            <g opacity={appear[2]}>
              <SteelCube x={XS[2]} y={y3} s={S} />
            </g>
            <g opacity={appear[1]}>
              <PlasticCube x={x2} y={y2} s={S} rot={rot2} />
            </g>
            <g opacity={appear[0]}>
              <WoodCube x={XS[0]} y={y1} s={S} rot={rot1} />
            </g>
          </TankWith>
          <Ripple x={XS[0]} y={SURF_A} p={ramp(t, tk[0] + 0.3, tk[0] + 1.6, (q) => q)} r={130} color="water" />
          <Ripple x={XS[1]} y={SURF_A} p={ramp(t, tk[1] + 0.4, tk[1] + 1.7, (q) => q)} r={130} color="water" />
          <Ripple x={XS[2]} y={SURF_A} p={ramp(t, tk[2] + 0.45, tk[2] + 1.75, (q) => q)} r={130} color="water" />
          <Ripple x={XS[2]} y={TA.yb - 8} p={ramp(t, tk[2] + LAND_A, tk[2] + LAND_A + 1.2, (q) => q)} r={110} color="force" rings={2} />
          {/* volume tercelup = air yang dipindahkan */}
          <g opacity={vol}>
            <rect x={XS[0] - S / 2 - 6} y={y1} width={S + 12} height={S / 2 + 6} rx={6} fill={C.buoy} fillOpacity={0.16} stroke={C.buoy} strokeWidth={3} strokeDasharray="10 7" strokeDashoffset={-t * 12} />
          </g>
          <g opacity={forces}>
            <Glow x={XS[0]} y={y1} r={150} color="buoy" opacity={0.5} />
            <Arrow x1={XS[0] + 20} y1={y1} x2={XS[0] + 20} y2={y1 + 100} color="force" width={6} />
            <Label x={XS[0] + 44} y={y1 + 90} size={28} color={C.force} anchor="start" weight={700}>
              W
            </Label>
            <Arrow x1={XS[0] - 20} y1={y1 + S / 4} x2={XS[0] - 20} y2={y1 + S / 4 - 100} color="buoy" width={6} />
            <Label x={XS[0] - 66} y={y1 - 30} size={28} color={C.buoy} anchor="end" weight={700}>
              F<TSub>A</TSub>
            </Label>
          </g>
          {labels.map((L, k) => {
            const p = ramp(t, tk[k] + 0.7, tk[k] + 1.4);
            return (
              <g key={k} opacity={p}>
                <Label x={XS[k]} y={238} size={28} color={C.spr} weight={600} font="serif" italic>
                  ρ<TSub>b</TSub> {L.rel} ρ<TSub>f</TSub>
                </Label>
                <Label x={XS[k]} y={276} size={26} color={L.c} weight={600}>
                  {L.word}
                </Label>
              </g>
            );
          })}
        </g>
        {/* timbangan pembanding */}
        <g opacity={scaleOp} transform="translate(1465 500)">
          <path d="M-60,250 L60,250 L22,232 L-22,232 Z" fill="#1a2550" stroke={C.muted} strokeWidth={2} />
          <line x1={0} y1={232} x2={0} y2={0} stroke={C.muted} strokeWidth={6} strokeLinecap="round" />
          <circle cx={0} cy={0} r={10} fill={C.gold} />
          <g transform={`rotate(${tilt})`}>
            <line x1={-190} y1={0} x2={190} y2={0} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
            {[-1, 1].map((sgn) => (
              <g key={sgn} transform={`translate(${sgn * 175} 0) rotate(${-tilt})`}>
                <line x1={0} y1={0} x2={-60} y2={110} stroke={C.muted} strokeWidth={2} />
                <line x1={0} y1={0} x2={60} y2={110} stroke={C.muted} strokeWidth={2} />
                <path d="M-80,110 Q0,150 80,110 Z" fill="#1a2550" stroke={C.ink} strokeWidth={3} />
                {sgn < 0 ? (
                  <rect x={-28} y={56} width={56} height={56} rx={6} fill="url(#fl-wood)" stroke="#f0c48a" strokeWidth={2} />
                ) : (
                  <path d={`M-40,110 Q-38,70 -10,62 Q20,${56 + 4 * Math.sin(gT * 3)} 40,70 Q44,90 40,110 Z`} fill={C.water} fillOpacity={0.7} stroke="#cfeaff" strokeWidth={2} />
                )}
                <Label x={0} y={180} size={30} color={sgn < 0 ? C.spr : C.water} weight={600} font="serif" italic>
                  {sgn < 0 ? 'ρ benda' : 'ρ fluida'}
                </Label>
              </g>
            ))}
          </g>
        </g>
        <Motes x={560} y={560} rx={420} ry={240} n={22} color="water" opacity={0.4} seed={2} />
      </Stage>
      <Formula x={1465} y={300} p={cmp} accent={C.spr} size={60}>
        <V color={C.spr}>ρ</V>
        <Sub>benda</Sub> <span style={{fontFamily: FONT.head, fontSize: 40, color: C.muted, margin: '0 18px'}}>vs</span> <V color={C.spr}>ρ</V>
        <Sub>fluida</Sub>
      </Formula>
      {labels.map((L, k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 1465,
            top: 480 + k * 100,
            transform: `translate(-50%, -50%) translateX(${(1 - row[k]) * 30}px)`,
            opacity: row[k],
            width: 560,
            height: 78,
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: '0 28px',
            boxSizing: 'border-box',
            borderRadius: 16,
            background: 'linear-gradient(90deg, rgba(20,34,72,0.92), rgba(14,22,50,0.88))',
            border: `1.5px solid ${L.c}88`,
            fontFamily: FONT.head,
            fontSize: 34,
            color: C.ink,
          }}
        >
          <span style={{fontFamily: FONT.serif, fontStyle: 'italic', color: C.spr, fontSize: 38, minWidth: 190}}>
            ρ<Sub>b</Sub> {L.rel} ρ<Sub>f</Sub>
          </span>
          <span style={{color: C.muted}}>→</span>
          <span style={{color: L.c, fontWeight: 600}}>{L.word}</span>
        </div>
      ))}
      <Card x={1465} y={500} opacity={Math.min(1, eq1 * 1.4)} accent={C.buoy} style={{padding: '22px 40px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.5, textAlign: 'center'}}>
          <div style={{opacity: eq1}}>
            <Tint c={C.buoy}>
              <V>ρ</V>
              <Sub>f</Sub> <V>V</V>
              <Sub>celup</Sub> <V>g</V>
            </Tint>{' '}
            ={' '}
            <Tint c={C.force}>
              <V>ρ</V>
              <Sub>b</Sub> <V>V</V>
              <Sub>b</Sub> <V>g</V>
            </Tint>
          </div>
          <div style={{fontFamily: FONT.sans, fontSize: 24, color: C.muted, opacity: eq1, marginTop: -6}}>berat air yang dipindahkan = berat benda</div>
          <Grow p={eq2} h={170} style={{marginTop: 12 * eq2}}>
            <Frac
              n={
                <>
                  <V>V</V>
                  <Sub>celup</Sub>
                </>
              }
              d={
                <>
                  <V>V</V>
                  <Sub>benda</Sub>
                </>
              }
            />{' '}
            ={' '}
            <Frac
              n={
                <>
                  <V color={C.spr}>ρ</V>
                  <Sub>benda</Sub>
                </>
              }
              d={
                <>
                  <V color={C.spr}>ρ</V>
                  <Sub>fluida</Sub>
                </>
              }
            />
          </Grow>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* B — balok kayu 20 cm                                                 */
/* ================================================================== */
const TB = {x: 220, yb: 860, w: 700, h: 560, level: 384};
const SURF_B = TB.yb - 6 - TB.level; // 470
const PX_CM = 16;
const BH = 20 * PX_CM; // 320
const BW = 230;
const BXC = 570;
const D_EQ = 12 * PX_CM; // 192

const PhaseB: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const tD = cue(4) + 0.5;
  const bob = 2 * Math.sin(gT * 1.6) * ramp(t, tD + 3, tD + 5);
  const dAt = (tt: number) => (tt < tD ? -50 * (1 - ramp(tt, cue(4) - 0.5, tD, EASE_IN_OUT)) : D_EQ * (1 - damp(tt - tD, 2.28, 0.2)));
  const d = dAt(t) + bob;
  const vel = Math.abs(dAt(t) - dAt(t - 0.05)) / 0.05;
  const top = SURF_B + d - BH;
  const bot = SURF_B + d;
  const pH = ramp(t, wordOf(4, 'puluh') - 0.1, wordOf(4, 'puluh') + 0.6);
  const p12 = ramp(t, wordOf(4, 'belas') - 0.1, wordOf(4, 'belas') + 0.6);
  const p8 = ramp(t, wordOf(4, 'Delapan') - 0.1, wordOf(4, 'Delapan') + 0.6);
  const slow = win(t, tD - 0.3, tD + 6.5, 0.4, 0.8);
  const rho = ramp(t, wordOf(4, 'enam') - 0.1, wordOf(4, 'enam') + 0.6);
  const f1 = ramp(t, cue(4) + 0.8, cue(4) + 1.6);
  const f2 = p12;
  const xR = BXC + BW / 2 + 46;
  const xL = BXC - BW / 2 - 46;
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          <linearGradient id="fl-wood2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dca266" />
            <stop offset="100%" stopColor="#8a552a" />
          </linearGradient>
        </defs>
        <TankWith x={TB.x} y={TB.yb} w={TB.w} h={TB.h} level={TB.level} seed={2} bubbles={4}>
          <g>
            <rect x={BXC - BW / 2} y={top} width={BW} height={BH} rx={10} fill="url(#fl-wood2)" stroke="#f3c88f" strokeWidth={3} />
            {[0.12, 0.3, 0.5, 0.68, 0.86].map((k, i) => (
              <path
                key={i}
                d={`M${BXC - BW / 2 + 10},${top + BH * k} C${BXC - 40},${top + BH * k - 14 + i * 4} ${BXC + 30},${top + BH * k + 12} ${BXC + BW / 2 - 10},${top + BH * k - 4}`}
                fill="none"
                stroke="#6e3f1a"
                strokeWidth={2.5}
                opacity={0.55}
              />
            ))}
            <ellipse cx={BXC + 40} cy={top + BH * 0.58} rx={16} ry={9} fill="none" stroke="#6e3f1a" strokeWidth={2.5} opacity={0.6} />
            <rect x={BXC - BW / 2 + 8} y={top + 6} width={BW - 16} height={8} rx={4} fill="#fff" opacity={0.2} />
          </g>
        </TankWith>
        <Label x={BXC} y={top + 58} size={30} color={C.ink} weight={600} opacity={rho} font="serif">
          <tspan fill={C.spr} fontStyle="italic">
            ρ
          </tspan>{' '}
          = 600 kg/m³
        </Label>
        {/* garis gerak saat terayun */}
        {[-70, 0, 70].map((dx, k) => (
          <line key={k} x1={BXC + dx} y1={top - 16} x2={BXC + dx} y2={top - 16 - Math.min(60, vel * 0.18)} stroke={C.ink} strokeOpacity={0.45 * Math.min(1, vel / 150)} strokeWidth={3} strokeLinecap="round" />
        ))}
        <Ripple x={BXC} y={SURF_B} p={ramp(t, tD + 0.2, tD + 1.6, (q) => q)} r={300} color="water" />
        <Ripple x={BXC} y={SURF_B} p={ramp(t, tD + 2.9, tD + 4.3, (q) => q)} r={220} color="water" rings={2} />
        <Label x={BXC} y={255} size={24} color={C.cyan} opacity={slow}>
          gerak lambat ×¼
        </Label>
        {/* ukuran */}
        <g opacity={pH}>
          <line x1={xL} y1={top} x2={xL} y2={bot} stroke={C.muted} strokeWidth={3} />
          <line x1={xL - 12} y1={top} x2={xL + 12} y2={top} stroke={C.muted} strokeWidth={3} />
          <line x1={xL - 12} y1={bot} x2={xL + 12} y2={bot} stroke={C.muted} strokeWidth={3} />
          <Label x={xL - 18} y={(top + bot) / 2} size={30} color={C.ink} anchor="end" weight={600}>
            H = 20 cm
          </Label>
        </g>
        <g opacity={p12}>
          <Glow x={BXC} y={(SURF_B + bot) / 2} r={170} color="buoy" opacity={0.45} />
          <line x1={xR} y1={SURF_B} x2={xR} y2={bot} stroke={C.buoy} strokeWidth={3.5} />
          <line x1={xR - 12} y1={bot} x2={xR + 12} y2={bot} stroke={C.buoy} strokeWidth={3.5} />
          <Label x={xR + 18} y={(SURF_B + bot) / 2} size={32} color={C.buoy} anchor="start" weight={700}>
            12 cm
          </Label>
          <Twinkles x={xR + 70} y={(SURF_B + bot) / 2} rx={60} ry={40} n={3} seed={5} />
        </g>
        <g opacity={p8}>
          <line x1={xR} y1={top} x2={xR} y2={SURF_B} stroke={C.gold} strokeWidth={3.5} />
          <line x1={xR - 12} y1={top} x2={xR + 12} y2={top} stroke={C.gold} strokeWidth={3.5} />
          <Label x={xR + 18} y={(top + SURF_B) / 2} size={32} color={C.gold} anchor="start" weight={700}>
            8 cm
          </Label>
        </g>
        <g opacity={p12}>
          <line x1={TB.x + 10} y1={SURF_B} x2={xR} y2={SURF_B} stroke={C.cyan} strokeWidth={2} strokeDasharray="8 8" strokeDashoffset={-t * 12} opacity={0.6} />
        </g>
        <Motes x={BXC} y={SURF_B} rx={260} ry={180} n={16} color="gold" opacity={0.4} seed={4} />
      </Stage>
      <Card x={1420} y={430} opacity={Math.min(1, f1 * 1.4)} accent={C.spr} style={{padding: '22px 42px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.5, textAlign: 'center'}}>
          <div style={{opacity: f1}}>
            <V>h</V>
            <Sub>celup</Sub> ={' '}
            <Frac
              n={
                <>
                  <V color={C.spr}>ρ</V>
                  <Sub>b</Sub>
                </>
              }
              d={
                <>
                  <V color={C.spr}>ρ</V>
                  <Sub>f</Sub>
                </>
              }
            />{' '}
            <V>H</V>
          </div>
          <Grow p={f2} h={140} style={{marginTop: 8 * f2}}>
            = <Frac n="600" d="1000" /> × 20 cm = <span style={{color: C.buoy, fontWeight: 600, textShadow: `0 0 ${16 * f2}px rgba(94,240,176,0.5)`}}>12 cm</span>
          </Grow>
        </div>
      </Card>
      <Note x={1420} y={700} p={p8} color={C.gold} size={32}>
        di atas air: 20 − 12 = <Tint c={C.gold}>8 cm</Tint>
      </Note>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* C — kapal baja vs baut                                               */
/* ================================================================== */
const TC = {x: 100, yb: 860, w: 1020, h: 420, level: 314};
const SURF_C = TC.yb - 6 - TC.level; // 540
const SX = 520;
const HULL_OUT = 'M-230,0 L230,0 C226,62 200,138 150,170 L-170,170 C-206,150 -226,90 -230,0 Z';
const HULL_IN = 'M-214,12 L212,12 C207,64 184,128 140,154 L-160,154 C-192,136 -210,86 -214,12 Z';
const BOLT_Y0 = 380;
const BOLT_BOT = TC.yb - 6 - 34;
const BOLT_LAND = landTime(BOLT_Y0, SURF_C, BOLT_BOT, 190);
const MX0 = 1200;
const MW = 560;
const MY = 640;
const mPos = (rho: number) => MX0 + ((Math.log10(rho) - 2) / 2) * MW;

const PhaseC: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const shipIn = ramp(t, cue(5) - 0.3, cue(5) + 0.8);
  const bob = (surfAt(SX, SURF_C, gT, 3) - SURF_C) * 0.8;
  const roll = 1.6 * Math.sin(gT * 0.7);
  const deck = SURF_C - 90 + bob;
  const air = ramp(t, wordOf(5, 'udara') - 0.2, wordOf(5, 'udara') + 0.6);
  const meter = ramp(t, cue(5) + 0.8, cue(5) + 1.8);
  const steelHi = win(t, wordOf(5, 'Baja') - 0.1, cue(6) + 0.5, 0.4, 0.8);
  const avg = ramp(t, wordOf(6, 'rata') - 0.4, wordOf(6, 'rata') + 1.4, EASE_IN_OUT);
  const shipNeedle = ramp(t, cue(6) + 0.2, cue(6) + 1.0);
  const needleX = mix(mPos(7850), mPos(380), avg);
  const forces = win(t, cue(6) + 1.2, cue(7) + 0.4, 0.6, 0.8);
  const note5 = win(t, cue(5) + 0.6, cue(6) - 0.2, 0.6, 0.5);
  const f6 = ramp(t, cue(6) + 0.3, cue(6) + 1.1);
  const tB = wordOf(7, 'Baut');
  const bTau = t - tB;
  const bIn = ramp(t, tB - 0.6, tB - 0.1);
  const by = bTau <= 0 ? BOLT_Y0 : fallSink(bTau, BOLT_Y0, SURF_C, BOLT_BOT, 190);
  const bMoving = bTau > 0 && bTau < BOLT_LAND ? 1 : 0;
  const bRot = 10 * Math.sin(bTau * 3) * bMoving * ramp(bTau, 0.4, 0.9);
  const boltNeedle = ramp(t, tB + 0.4, tB + 1.2);
  const n7 = ramp(t, cue(7) + 1.4, cue(7) + 2.2);
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          <linearGradient id="fl-hull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9aa6c8" />
            <stop offset="100%" stopColor="#4a5478" />
          </linearGradient>
          <clipPath id="fl-below">
            <rect x={0} y={SURF_C} width={1920} height={400} />
          </clipPath>
        </defs>
        <TankWith x={TC.x} y={TC.yb} w={TC.w} h={TC.h} level={TC.level} seed={3} bubbles={4}>
          {/* baut */}
          <g opacity={bIn} transform={`translate(930 ${by}) rotate(${bRot})`}>
            <path d="M-26,-34 L26,-34 L30,-24 L26,-14 L-26,-14 L-30,-24 Z" fill="url(#fl-hull)" stroke="#c9d2ea" strokeWidth={2} />
            <rect x={-11} y={-14} width={22} height={48} fill="#7a85a8" stroke="#c9d2ea" strokeWidth={2} />
            {[-6, 4, 14, 24].map((yy) => (
              <line key={yy} x1={-11} y1={yy} x2={11} y2={yy + 5} stroke="#2a3150" strokeWidth={2} />
            ))}
          </g>
          {Array.from({length: 6}, (_, i) => {
            const ph = (((t * 1.4 + i / 6) % 1) + 1) % 1;
            return <circle key={i} cx={930 + 12 * Math.sin(i * 2.1 + t * 3)} cy={by - 40 - ph * 80} r={2 + (i % 3)} fill="none" stroke="#d8f0ff" strokeWidth={1.4} opacity={cyc(ph) * bMoving * ramp(by, SURF_C, SURF_C + 60) * 0.8} />;
          })}
        </TankWith>
        <Ripple x={930} y={SURF_C} p={ramp(t, tB + 0.55, tB + 1.8, (q) => q)} r={120} color="water" />
        <Ripple x={930} y={TC.yb - 8} p={ramp(t, tB + BOLT_LAND, tB + BOLT_LAND + 1.2, (q) => q)} r={100} color="force" rings={2} />
        {/* kapal: penampang lambung */}
        <g opacity={shipIn} transform={`translate(${SX} ${deck}) rotate(${roll})`}>
          {/* asap cerobong */}
          {Array.from({length: 5}, (_, i) => {
            const ph = (((gT * 0.25 + i / 5) % 1) + 1) % 1;
            return <circle key={i} cx={57 - ph * 80 + 8 * Math.sin(ph * 6 + i)} cy={-140 - ph * 110} r={10 + ph * 22} fill="#9aa6c8" opacity={cyc(ph) * 0.35} />;
          })}
          <rect x={40} y={-134} width={34} height={56} rx={4} fill="#c84a5a" stroke="#ffb0bb" strokeWidth={2} />
          <rect x={-110} y={-80} width={190} height={80} rx={8} fill="#dfe6f6" stroke="#9aa6c8" strokeWidth={2} />
          {[-90, -50, -10, 30].map((wx) => (
            <rect key={wx} x={wx} y={-62} width={26} height={22} rx={4} fill="#3a5a8a" opacity={0.9} />
          ))}
          <path d={`${HULL_OUT} ${HULL_IN}`} fill="url(#fl-hull)" fillRule="evenodd" stroke="#dfe6f6" strokeWidth={2} />
          <path d={HULL_IN} fill="#0c1631" />
          <path d={HULL_IN} fill="#bfe0ff" fillOpacity={0.05 + 0.08 * air} />
          {/* molekul udara di dalam lambung */}
          <g opacity={0.35 + 0.65 * air}>
            {Array.from({length: 14}, (_, i) => {
              const ax = -150 + rand(i * 3.1) * 290 + 22 * Math.sin(gT * (0.6 + rand(i) * 0.8) + i);
              const ay = 34 + rand(i * 5.3) * 96 + 12 * Math.sin(gT * (0.5 + rand(i + 2) * 0.9) + i * 2);
              return <circle key={i} cx={ax} cy={ay} r={4} fill={C.cyan} opacity={0.75} />;
            })}
          </g>
          <Label x={-120} y={48} size={26} color={C.cyan} weight={600} opacity={air}>
            udara
          </Label>
          <Glow x={0} y={85} r={200} color="cyan" opacity={0.35 * air} />
          {/* badan baja disorot */}
          <path d={`${HULL_OUT} ${HULL_IN}`} fill="none" stroke={C.spr} strokeWidth={4} opacity={steelHi} />
        </g>
        {/* bagian lambung di bawah air sedikit kebiruan + garis air */}
        <g clipPath="url(#fl-below)" opacity={shipIn}>
          <path transform={`translate(${SX} ${deck}) rotate(${roll})`} d={`${HULL_OUT} ${HULL_IN}`} fillRule="evenodd" fill={C.water} opacity={0.3} />
        </g>
        <path d={wavePath(SX - 240, SX + 240, SURF_C, gT, 4, 0.035, 3)} fill="none" stroke="#cfeaff" strokeWidth={2.5} strokeDasharray="12 8" opacity={0.8 * shipIn} />
        <g opacity={forces}>
          <Arrow x1={SX + 30} y1={deck + 70} x2={SX + 30} y2={deck + 210} color="force" width={6} />
          <Label x={SX + 54} y={deck + 200} size={28} color={C.force} anchor="start" weight={700}>
            W
          </Label>
          <Arrow x1={SX + 90} y1={deck + 160} x2={SX + 90} y2={deck + 30} color="buoy" width={6} />
          <Label x={SX + 114} y={deck + 46} size={28} color={C.buoy} anchor="start" weight={700}>
            F<TSub>A</TSub>
          </Label>
        </g>
        {/* meter massa jenis rata-rata */}
        <g opacity={meter}>
          <Label x={MX0 + MW / 2} y={MY - 92} size={26} color={C.muted} weight={600} spacing={2}>
            MASSA JENIS RATA-RATA
          </Label>
          <rect x={MX0} y={MY - 9} width={mPos(1000) - MX0} height={18} rx={9} fill={C.buoy} opacity={0.22} />
          <rect x={mPos(1000)} y={MY - 9} width={MX0 + MW - mPos(1000)} height={18} rx={9} fill={C.force} opacity={0.18} />
          <line x1={MX0} y1={MY} x2={MX0 + MW} y2={MY} stroke={C.ink} strokeWidth={3} />
          {[100, 300, 1000, 3000, 10000].map((r) => (
            <line key={r} x1={mPos(r)} y1={MY - 10} x2={mPos(r)} y2={MY + 10} stroke={C.muted} strokeWidth={2} />
          ))}
          <line x1={mPos(1000)} y1={MY - 34} x2={mPos(1000)} y2={MY + 14} stroke={C.water} strokeWidth={4} />
          <Label x={mPos(1000)} y={MY - 50} size={24} color={C.water} weight={600}>
            air 1000
          </Label>
          <Label x={mPos(7850)} y={MY - 50} size={24} color={C.spr} weight={600}>
            baja
          </Label>
          <circle cx={mPos(7850)} cy={MY} r={9 + 5 * steelHi} fill={C.spr} />
          <Glow x={mPos(7850)} y={MY} r={60} color="spr" opacity={steelHi} />
          <Label x={MX0 + 90} y={MY - 30} size={20} color={C.buoy}>
            terapung
          </Label>
          <Label x={MX0 + MW - 170} y={MY - 30} size={20} color={C.force}>
            tenggelam
          </Label>
          <g opacity={shipNeedle}>
            <path d={`M${needleX},${MY + 12} l-12,30 h24 Z`} fill={C.buoy} />
            <Label x={needleX} y={MY + 66} size={24} color={C.buoy} weight={700}>
              kapal
            </Label>
            <Ripple x={needleX} y={MY} p={ramp(t, wordOf(6, 'rata') + 1.2, wordOf(6, 'rata') + 2.4, (q) => q)} r={70} color="buoy" rings={2} />
          </g>
          <g opacity={boltNeedle}>
            <path d={`M${mPos(7850)},${MY + 12} l-12,30 h24 Z`} fill={C.force} />
            <Label x={mPos(7850)} y={MY + 66} size={24} color={C.force} weight={700}>
              baut
            </Label>
          </g>
        </g>
        <Motes x={SX} y={SURF_C - 40} rx={360} ry={160} n={18} color="cyan" opacity={0.4} seed={6} />
      </Stage>
      <Note x={1480} y={300} p={note5} color={C.spr} size={30}>
        <Tint c={C.spr}>baja</Tint> tenggelam… tetapi lambung berisi <Tint c={C.cyan}>udara</Tint>
      </Note>
      <Formula
        x={1480}
        y={320}
        p={f6}
        accent={C.spr}
        size={58}
        caption={
          <span>
            rata-rata <Tint c={C.buoy}>&lt; 1000 kg/m³</Tint> → kapal terapung
          </span>
        }
      >
        <V color={C.spr}>ρ</V>
        <Sub>rata</Sub> ={' '}
        <Frac
          n={
            <>
              <V>m</V>
              <Sub>total</Sub>
            </>
          }
          d={
            <>
              <V>V</V>
              <Sub>luar</Sub>
            </>
          }
        />
      </Formula>
      <Note x={1480} y={800} p={n7} color={C.force} size={28}>
        baut tanpa rongga: <Tint c={C.spr}>ρ</Tint>
        <Sub>rata</Sub> = <Tint c={C.spr}>ρ</Tint>
        <Sub>baja</Sub> → tenggelam
      </Note>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* D — rakit & muatan maksimum                                          */
/* ================================================================== */
const TD = {x: 140, yb: 860, w: 960, h: 470, level: 300};
const SURF_D = TD.yb - 6 - TD.level; // 554
const RX = 620;
const RW = 440;
const RH = 130;
const CW = 92;
const CH = 66;
const SLOTS: [number, number][] = [
  [-150, 0],
  [-50, 0],
  [50, 0],
  [150, 0],
  [-50, 1],
  [50, 1],
];

const PhaseD: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const tk = SLOTS.map((_, k) => cue(8) + 2.2 + 1.2 * k);
  // fraksi tercelup f = (200 + m)/500 → kedalaman tercelup = f·RH; tiap peti 50 kg menambah 13 px (respons teredam)
  const dSub = 0.4 * RH + tk.reduce((s, tt) => s + (t > tt ? 13 * (1 - damp(t - tt, 6, 0.3)) : 0), 0);
  const bob = (surfAt(RX, SURF_D, gT, 4) - SURF_D) * 0.7;
  const rTop = SURF_D + dSub - RH + bob;
  const m = 50 * tk.reduce((s, tt) => s + ramp(t, tt, tt + 0.3), 0);
  const full = ramp(t, tk[5], tk[5] + 0.8);
  const given = ramp(t, cue(8) + 0.4, cue(8) + 1.2);
  const r1 = ramp(t, wordOf(8, 'kubik') + 0.2, wordOf(8, 'kubik') + 1.0);
  const r2 = ramp(t, wordOf(8, 'tiga') - 0.1, wordOf(8, 'tiga') + 0.7);
  const ctr = ramp(t, cue(8) + 1.2, cue(8) + 2.0);
  const barC = interpolateColors(full, [0, 1], [C.force, C.heat]);
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          <linearGradient id="fl-raft" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c98d52" />
            <stop offset="100%" stopColor="#7a4a22" />
          </linearGradient>
        </defs>
        <TankWith x={TD.x} y={TD.yb} w={TD.w} h={TD.h} level={TD.level} seed={4} bubbles={4}>
          <g>
            <rect x={RX - RW / 2} y={rTop} width={RW} height={RH} rx={14} fill="url(#fl-raft)" stroke="#f0c48a" strokeWidth={3} />
            {[0.25, 0.5, 0.75].map((k) => (
              <line key={k} x1={RX - RW / 2 + 6} y1={rTop + RH * k} x2={RX + RW / 2 - 6} y2={rTop + RH * k} stroke="#5a3415" strokeWidth={2.5} opacity={0.6} />
            ))}
            {[-0.32, 0.32].map((k) => (
              <rect key={k} x={RX + RW * k - 9} y={rTop - 2} width={18} height={RH + 4} rx={4} fill="#d8c08a" opacity={0.75} />
            ))}
          </g>
        </TankWith>
        <Label x={RX} y={rTop + RH / 2} size={26} color={C.ink} weight={600}>
          rakit 200 kg
        </Label>
        {/* peti-peti 50 kg */}
        {SLOTS.map(([dx, row], k) => {
          const target = rTop - row * CH;
          const yy = mix(220, target, ramp(t, tk[k] - 0.55, tk[k], EASE_IN));
          const o = ramp(t, tk[k] - 1.0, tk[k] - 0.6);
          return (
            <g key={k}>
              <Crate x={RX + dx} y={yy} w={CW} h={CH} label="50" color={C.force} opacity={o} />
              <Ripple x={RX + dx} y={target} p={ramp(t, tk[k], tk[k] + 0.9, (q) => q)} r={80} color="force" rings={2} />
            </g>
          );
        })}
        <Ripple x={RX} y={SURF_D} p={ramp(t, tk[5] + 0.2, tk[5] + 1.6, (q) => q)} r={300} color="heat" />
        <g opacity={full}>
          <line x1={RX - RW / 2 - 20} y1={SURF_D} x2={RX + RW / 2 + 20} y2={SURF_D} stroke={C.heat} strokeWidth={3} strokeDasharray="10 8" strokeDashoffset={-t * 14} />
          <Label x={RX} y={SURF_D + RH + 40} size={28} color={C.heat} weight={700}>
            tercelup penuh!
          </Label>
        </g>
        {/* penghitung muatan */}
        <g opacity={ctr}>
          <Label x={1180} y={690} size={24} color={C.muted} anchor="start" weight={600} spacing={2}>
            MUATAN
          </Label>
          <Label x={1740} y={712} size={60} color={C.ink} anchor="end" weight={600} font="mono">
            {Math.round(m)} kg
          </Label>
          <rect x={1180} y={760} width={560} height={24} rx={12} fill="#1a2550" stroke={C.line} strokeWidth={2} />
          <rect x={1180} y={760} width={Math.max(0.1, (560 * m) / 300)} height={24} rx={12} fill={barC} />
          <Label x={1740} y={812} size={22} color={C.muted} anchor="end">
            maks 300 kg
          </Label>
          <Twinkles x={1600} y={712} rx={150} ry={40} n={5} opacity={full} seed={8} />
        </g>
        <Motes x={RX} y={SURF_D - 60} rx={330} ry={160} n={18} color="force" opacity={0.35} seed={7} />
      </Stage>
      <Note x={1460} y={250} p={given} color={C.cyan} size={28}>
        <span style={{color: C.muted}}>Diketahui:</span> <V>V</V> = 0,50 m³ · <V>m</V>
        <Sub>rakit</Sub> = 200 kg
      </Note>
      <Card x={1460} y={470} opacity={Math.min(1, r1 * 1.4)} accent={C.buoy} style={{padding: '20px 40px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.45, textAlign: 'center'}}>
          <div style={{opacity: r1}}>
            <Tint c={C.buoy}>
              <V>F</V>
              <Sub>A</Sub>
            </Tint>{' '}
            = <V color={C.spr}>ρ</V>
            <V>Vg</V> = 5000 N
          </div>
          <Grow p={r2} h={100}>
            <V>m</V>
            <Sub>maks</Sub> = 500 − 200 = <span style={{color: C.force, fontWeight: 600, textShadow: `0 0 ${16 * r2}px rgba(255,210,74,0.5)`}}>300 kg</span>
          </Grow>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

export const Floating: React.FC = () => {
  const {t, cue} = useScene();
  const pA = 1 - ramp(t, cue(4) - 0.6, cue(4) + 0.2, EASE_IN_OUT);
  const pB = win(t, cue(4) - 0.4, cue(5) - 0.6, 0.7, 0.6);
  const pC = win(t, cue(5) - 0.4, cue(8) - 0.6, 0.7, 0.6);
  const pD = ramp(t, cue(8) - 0.4, cue(8) + 0.4);
  return (
    <AbsoluteFill>
      <PhaseA op={pA} />
      <PhaseB op={pB} />
      <PhaseC op={pC} />
      <PhaseD op={pD} />
    </AbsoluteFill>
  );
};
