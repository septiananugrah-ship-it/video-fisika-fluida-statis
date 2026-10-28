import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, smoothPath, win} from '../anim';
import {Bubbles, PressureArrow, wavePath} from '../components/fluid';
import {DrawPath, Glow, Motes, Ripple, Spark, Stage, Stream, pointAlong} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT, type Hue} from '../theme';

// Peta video: tiga kartu bagian dengan ikon yang terus bergerak
// (manometer U berayun, hidrometer naik-turun + kromatografi, kapal selam berlayar)
// dihubungkan oleh lintasan emas tempat sebutir cahaya merambat.
const PARTS = [
  {
    n: '1',
    title: 'Konsep & cara berpikir',
    color: C.cyan,
    hue: 'cyan' as Hue,
    items: ['Massa jenis', 'Tekanan', 'Hidrostatika', 'Hukum Pascal', 'Hukum Archimedes', 'Tegangan permukaan', 'Kapilaritas'],
  },
  {n: '2', title: 'Fluida di lab kimia', color: C.spr, hue: 'spr' as Hue, items: ['Hidrometer', 'Sabun', 'Kromatografi']},
  {n: '3', title: 'Penerapan', color: C.work, hue: 'work' as Hue, items: ['Kapal selam', 'Tekanan darah', 'Gunung es']},
];
// kata kunci di narasi untuk memunculkan tiap butir
const KEYS = [
  ['massa', 'tekanan', 'hidrostatika', 'pascal', 'archimedes', 'tegangan', 'kapilaritas'],
  ['hidrometer', 'sabun', 'kromatografi'],
  ['kapal', 'darah', 'gunung'],
];
const CX = [380, 960, 1540];
const TOP = 196;
const CW = 500;
const CH = 600;
const PY = TOP + CH + 40;
const ICON_Y = TOP + 212;

const X0P = CX[0] - 200;
const X1P = CX[2] + 200;
const PTS: [number, number][] = Array.from({length: 61}, (_, i) => {
  const u = i / 60;
  const x = X0P + (X1P - X0P) * u;
  const y = PY + 9 * (1 - Math.cos(((x - CX[0]) / (CX[1] - CX[0])) * Math.PI * 2)) * (x > CX[0] && x < CX[2] ? 1 : 0.3);
  return [x, y];
});
const PTS_D = smoothPath(PTS);
const UX = CX.map((x) => (x - X0P) / (X1P - X0P));

const fr = (v: number) => ((v % 1) + 1) % 1;

/** Ikon tiap bagian (SVG, selalu bergerak). */
const Icon: React.FC<{i: number; x: number; y: number; t: number; act: number}> = ({i, x, y, t, act}) => {
  if (i === 0) {
    // manometer U: cairan berayun bolak-balik (osilasi kolom cairan), udara menekan kaki kiri
    const s = 24 * Math.sin(t * 2.1) * (0.65 + 0.35 * Math.sin(t * 0.37));
    const base = y - 10;
    const yl = base + s;
    const yr = base - s;
    const r = 58;
    const tube = `M${x - r},${y - 92} L${x - r},${y + 34} A${r},${r} 0 0 0 ${x + r},${y + 34} L${x + r},${y - 92}`;
    const liq = `M${x - r},${yl} L${x - r},${y + 34} A${r},${r} 0 0 0 ${x + r},${y + 34} L${x + r},${yr}`;
    return (
      <g>
        <Glow x={x} y={y} r={150} color="cyan" opacity={0.25 + 0.3 * act} />
        <path d={tube} fill="none" stroke="#cfe6ff" strokeOpacity={0.35} strokeWidth={40} strokeLinecap="round" />
        <path d={tube} fill="none" stroke="#0a1230" strokeWidth={32} strokeLinecap="round" />
        <path d={liq} fill="none" stroke={C.water} strokeWidth={30} />
        <path d={liq} fill="none" stroke="#bfe6ff" strokeOpacity={0.35} strokeWidth={6} transform="translate(-7 0)" />
        <ellipse cx={x - r} cy={yl} rx={15} ry={4} fill="#e0f4ff" opacity={0.7} />
        <ellipse cx={x + r} cy={yr} rx={15} ry={4} fill="#e0f4ff" opacity={0.7} />
        {[-8, 8].map((o) => (
          <PressureArrow key={o} x={x - r + o} y={yl - 4} nx={0} ny={-1} L={24 + 0.6 * s} width={3} />
        ))}
        <line x1={x + r + 34} y1={yl} x2={x + r + 34} y2={yr} stroke={C.gold} strokeWidth={2.5} opacity={Math.min(1, Math.abs(s) / 8)} />
        <text x={x + r + 46} y={(yl + yr) / 2} dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={26} fill={C.gold} opacity={Math.min(1, Math.abs(s) / 8)}>
          Δh
        </text>
      </g>
    );
  }
  if (i === 1) {
    // hidrometer bergoyang di gelas ukur + kertas kromatografi dengan muka pelarut yang naik
    const hy = y - 18 + 9 * Math.sin(t * 1.9) * (0.6 + 0.4 * Math.sin(t * 0.5));
    const gx = x - 95;
    const ph = fr(t * 0.16);
    const front = y + 70 - ph * 150;
    const k = cyc(ph);
    return (
      <g>
        <Glow x={x} y={y} r={150} color="spr" opacity={0.25 + 0.3 * act} />
        {/* gelas ukur */}
        <path d={`${wavePath(gx - 40, gx + 40, y - 40, t, 2, 0.12, 1)} L${gx + 40},${y + 88} L${gx - 40},${y + 88} Z`} fill={C.water} opacity={0.4} />
        <path d={`M${gx - 44},${y - 100} L${gx - 44},${y + 92} L${gx + 44},${y + 92} L${gx + 44},${y - 100}`} fill="none" stroke="#cfe6ff" strokeOpacity={0.8} strokeWidth={4} />
        <rect x={gx - 6} y={hy - 92} width={12} height={78} rx={5} fill="#e6ecfa" stroke="#8fa0cc" strokeWidth={1.5} />
        {[0, 1, 2, 3, 4].map((m) => (
          <line key={m} x1={gx - 6} y1={hy - 84 + m * 14} x2={gx + 1} y2={hy - 84 + m * 14} stroke="#334" strokeWidth={1.5} />
        ))}
        <ellipse cx={gx} cy={hy + 14} rx={20} ry={34} fill="#d7deef" stroke="#8fa0cc" strokeWidth={2} />
        <ellipse cx={gx} cy={hy + 36} rx={11} ry={10} fill={C.spr} opacity={0.8} />
        {/* kromatografi */}
        <rect x={x + 30} y={y - 92} width={128} height={184} rx={10} fill="none" stroke="#cfe6ff" strokeOpacity={0.6} strokeWidth={3} />
        <rect x={x + 34} y={y + 66} width={120} height={22} fill={C.water} opacity={0.4} />
        <rect x={x + 62} y={y - 104} width={64} height={178} fill="#eef1f8" opacity={0.85} />
        <rect x={x + 62} y={front} width={64} height={y + 74 - front} fill={C.water} opacity={0.22 * k + 0.05} />
        <line x1={x + 62} y1={front} x2={x + 126} y2={front} stroke={C.water} strokeWidth={2} opacity={0.6 * k} />
        <line x1={x + 66} y1={y + 52} x2={x + 122} y2={y + 52} stroke="#667" strokeWidth={1} strokeDasharray="3 3" />
        {[
          {f: 0.32, c: '#e2c13a'},
          {f: 0.6, c: '#3fb07a'},
          {f: 0.85, c: '#4a7bff'},
        ].map((sp, j) => {
          const yy = y + 52 - sp.f * (y + 52 - front);
          return <ellipse key={j} cx={x + 94} cy={yy} rx={11} ry={7 + 3 * ph} fill={sp.c} opacity={0.85 * (0.4 + 0.6 * k)} />;
        })}
      </g>
    );
  }
  // kapal selam berlayar di bawah permukaan: baling-baling berputar, sonar, gelembung
  const sx = x + 30 * Math.sin(t * 0.45);
  const sy = y + 8 * Math.sin(t * 0.9);
  const vx = Math.cos(t * 0.45);
  const face = Math.tanh(4 * vx);
  const prop = Math.sin(t * 14);
  return (
    <g>
      <Glow x={x} y={y} r={150} color="work" opacity={0.25 + 0.3 * act} />
      <path d={`${wavePath(x - 200, x + 200, y - 92, t, 3, 0.05, 2)} L${x + 200},${y + 96} L${x - 200},${y + 96} Z`} fill={C.water} opacity={0.22} />
      <path d={wavePath(x - 200, x + 200, y - 92, t, 3, 0.05, 2)} fill="none" stroke="#cfeaff" strokeOpacity={0.6} strokeWidth={2} />
      <Bubbles x={x - 190} y={y - 80} w={380} h={170} n={6} seed={5} />
      <Ripple x={sx + 80 * face} y={sy} p={fr(t * 0.4)} r={110} color="work" rings={2} width={2} />
      <g transform={`translate(${sx} ${sy}) scale(${face.toFixed(3)} 1)`}>
        <ellipse cx={0} cy={0} rx={92} ry={30} fill="#3b4a72" stroke="#a9b6d6" strokeWidth={2.5} />
        <path d="M-18,-26 L-12,-56 L24,-56 L30,-26 Z" fill="#3b4a72" stroke="#a9b6d6" strokeWidth={2.5} strokeLinejoin="round" />
        <line x1={4} y1={-56} x2={4} y2={-76} stroke="#a9b6d6" strokeWidth={3} />
        {[-40, -10, 20, 50].map((wx) => (
          <circle key={wx} cx={wx} cy={-2} r={6} fill={C.gold} opacity={0.55 + 0.35 * Math.sin(t * 2 + wx)} />
        ))}
        <path d="M-92,0 L-110,-20 L-110,20 Z" fill="#2a3658" stroke="#a9b6d6" strokeWidth={2} />
        <ellipse cx={-116} cy={0} rx={4} ry={18 * Math.abs(prop) + 3} fill={C.work} opacity={0.85} />
      </g>
    </g>
  );
};

export const Roadmap: React.FC = () => {
  const {t, cue, dur, wordOf} = useScene();
  const head = ramp(t, 0, 0.8);
  const ps = [ramp(t, cue(1) - 0.2, cue(1) + 0.7, BACK), ramp(t, cue(2) - 0.2, cue(2) + 0.7, BACK), ramp(t, cue(3) - 0.2, cue(3) + 0.7, BACK)];
  const act = [win(t, cue(1) - 0.2, cue(2) - 0.3, 0.6, 0.8), win(t, cue(2) - 0.2, cue(3) - 0.3, 0.6, 0.8), win(t, cue(3) - 0.2, dur, 0.6, 0.8)];
  const pathP =
    UX[0] * ramp(t, 0.6, cue(1), EASE_IN_OUT) +
    (UX[1] - UX[0]) * ramp(t, cue(2) - 0.6, cue(2) + 0.6, EASE_IN_OUT) +
    (UX[2] - UX[1]) * ramp(t, cue(3) - 0.6, cue(3) + 0.6, EASE_IN_OUT) +
    (1 - UX[2]) * ramp(t, cue(3) + 0.6, cue(3) + 2.2, EASE_IN_OUT);
  const [lx, ly] = pointAlong(PTS, pathP);
  const lead: [number, number][] = [1, 2, 3, 4, 5].map((k) => pointAlong(PTS, Math.max(0, pathP - k * 0.008)));
  const loop = ramp(t, cue(3) + 1.6, cue(3) + 2.6);
  const ghost = win(t, 0.4, cue(3) + 0.6, 0.8, 0.8);
  // item bagian 1 muncul mengikuti kata yang diucapkan
  const itemAt = (i: number, k: number) => wordOf(i + 1, KEYS[i][k]) - 0.15;

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: FONT.head, fontSize: 50, fontWeight: 700, color: C.ink, opacity: head, translate: `0px ${(1 - head) * 14}px`}}>
        Peta perjalanan: <span style={{color: C.water}}>fluida yang diam</span>
      </div>
      <Stage>
        <Motes x={960} y={520} rx={900} ry={340} n={36} color="water" opacity={0.4} seed={11} />
        <Bubbles x={80} y={200} w={1760} h={680} n={10} seed={21} speed={0.7} />
        {PARTS.map((p, i) => (
          <rect
            key={`gh${i}`}
            x={CX[i] - CW / 2}
            y={TOP}
            width={CW}
            height={CH}
            rx={24}
            fill="none"
            stroke={p.color}
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeDasharray="10 12"
            strokeDashoffset={-t * 24}
            opacity={ghost * (1 - Math.min(1, ps[i]))}
          />
        ))}
        {PARTS.map((p, i) => (
          <Glow key={`gl${i}`} x={CX[i]} y={TOP + CH / 2} r={420} color={p.hue} opacity={0.35 * act[i]} />
        ))}
        <path d={PTS_D} fill="none" stroke={C.line} strokeWidth={4} strokeDasharray="4 12" strokeLinecap="round" opacity={head} />
        <DrawPath d={PTS_D} p={pathP} stroke="water" width={3} halo opacity={0.85} />
        <Spark x={lx} y={ly} r={7} color="water" trail={lead} opacity={(1 - loop) * ramp(t, 0.6, 1.0)} />
        <Stream pts={PTS} color="water" n={5} speed={0.12} r={5} jitter={2} opacity={loop} />
        {PARTS.map((p, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <Ripple x={CX[i]} y={PY} p={ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 1.4, (x) => x)} r={90} color={p.hue} />
            <circle cx={CX[i]} cy={PY} r={20 + 4 * Math.sin(t * 2.4 + i)} fill={`url(#soft-${p.hue})`} />
            <circle cx={CX[i]} cy={PY} r={11} fill={p.color} />
            <circle cx={CX[i]} cy={PY} r={4.5} fill="#fff" opacity={0.8} />
          </g>
        ))}
      </Stage>
      {PARTS.map((p, i) => {
        const q0 = Math.min(1, ps[i]);
        return (
          <div
            key={p.n}
            style={{
              position: 'absolute',
              left: CX[i] - CW / 2,
              top: TOP,
              width: CW,
              height: CH,
              borderRadius: 24,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.94), rgba(10,16,36,0.94))',
              border: `1.5px solid ${p.color}55`,
              borderTop: `8px solid ${p.color}`,
              boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 ${40 + 40 * act[i]}px ${p.color}${Math.round(0x22 + 0x30 * act[i]).toString(16).padStart(2, '0')}`,
              opacity: Math.min(1, ps[i] * 1.3) * (0.35 + 0.65 * q0),
              translate: `0px ${(1 - q0) * 40 - 6 * act[i]}px`,
              scale: String(0.9 + 0.1 * ps[i]),
              fontFamily: FONT.head,
              color: C.ink,
              padding: '24px 34px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(105deg, transparent ${-40 + 150 * q0 - 16}%, rgba(220,240,255,0.12) ${-40 + 150 * q0}%, transparent ${-40 + 150 * q0 + 16}%)`,
              }}
            />
            <div style={{fontFamily: FONT.mono, fontSize: 22, color: p.color, letterSpacing: 4}}>BAGIAN {p.n}</div>
            <div style={{fontSize: 36, fontWeight: 700, marginTop: 4, letterSpacing: -0.5}}>{p.title}</div>
            <div style={{height: 214}} />
            <div>
              {p.items.map((it, k) => {
                const q = ramp(t, itemAt(i, k), itemAt(i, k) + 0.6);
                return (
                  <div key={it} style={{fontSize: i === 0 ? 24 : 27, color: C.muted, lineHeight: i === 0 ? 1.4 : 1.62, opacity: q, translate: `${(1 - q) * 14}px 0px`, whiteSpace: 'nowrap'}}>
                    <span style={{color: p.color, marginRight: 8}}>—</span>
                    {it}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <Stage>
        {PARTS.map((_, i) => (
          <g key={i} opacity={Math.min(1, ps[i])}>
            <g transform={`translate(${CX[i]} ${ICON_Y}) scale(0.84) translate(${-CX[i]} ${-ICON_Y})`}>
              <Icon i={i} x={CX[i]} y={ICON_Y} t={t} act={act[i]} />
            </g>
          </g>
        ))}
      </Stage>
    </AbsoluteFill>
  );
};
