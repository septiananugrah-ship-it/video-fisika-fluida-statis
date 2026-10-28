import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Bubbles, PressureArrow, Water, wavePath} from '../components/fluid';
import {Arrow, Formula, Glow, Label, Motes, Note, Ripple, Spark, Stage, Sub, Sup, TSub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kapal selam: tangki pemberat diisi air (turun) / dihembus udara (naik); tekanan di 100 m; palung 11 km; ikan laut dalam.
const HL = 320; // setengah panjang lambung
const HR = 74; // jari-jari lambung
const PX = 9; // piksel per meter (bagian dekat)
const SURF = 250;
const atmAt = (d: number) => 1 + (1025 * 9.8 * d) / 101325;

const capsule = (L: number, R: number) => `M${-L + R},${-R} L${L - R},${-R} A${R},${R} 0 0 1 ${L - R},${R} L${-L + R},${R} A${R},${R} 0 0 1 ${-L + R},${-R} Z`;

/** Titik & normal luar pada lambung (untuk panah tekanan). */
const HULL_PTS: {x: number; y: number; nx: number; ny: number}[] = [
  ...[-235, -150, 140, 230].map((x) => ({x, y: -HR, nx: 0, ny: -1})),
  ...[-240, -120, 0, 120, 240].map((x) => ({x, y: HR, nx: 0, ny: 1})),
  {x: -5, y: -HR - 72, nx: 0, ny: -1},
  ...[-55, -25, 0, 25, 55].map((a) => {
    const r = (a * Math.PI) / 180;
    return {x: HL - HR + HR * Math.cos(r), y: HR * Math.sin(r), nx: Math.cos(r), ny: Math.sin(r)};
  }),
  ...[-55, -25, 0, 25, 55].map((a) => {
    const r = (a * Math.PI) / 180;
    return {x: -(HL - HR + HR * Math.cos(r)), y: HR * Math.sin(r), nx: -Math.cos(r), ny: Math.sin(r)};
  }),
];

const SubBoat: React.FC<{t: number; f: number; flood: number; blow: number; pL: number; pOp: number; labels: number; airLab: number}> = ({t, f, flood, blow, pL, pOp, labels, airLab}) => {
  const tanks = [
    {x0: -HL, x1: -HL + 150, vent: -HL + 80},
    {x0: HL - 150, x1: HL, vent: HL - 80},
  ];
  const wy = HR - f * 2 * HR;
  const prop = Math.sin(t * 9);
  return (
    <g>
      <defs>
        <clipPath id="sub-hull">
          <path d={capsule(HL, HR)} />
        </clipPath>
        <linearGradient id="sub-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a6a9c" />
          <stop offset="55%" stopColor="#2a3666" />
          <stop offset="100%" stopColor="#151c3c" />
        </linearGradient>
      </defs>
      {/* baling-baling & kemudi */}
      <path d={`M${-HL + 20},-8 L${-HL - 40},-46 L${-HL - 52},-46 L${-HL - 30},0 L${-HL - 52},46 L${-HL - 40},46 L${-HL + 20},8 Z`} fill="#2a3666" stroke="#8fa0d0" strokeWidth={1.5} />
      <ellipse cx={-HL - 18} cy={0} rx={6} ry={8 + 30 * Math.abs(prop)} fill="#9aa6c8" opacity={0.75} />
      <ellipse cx={-HL - 18} cy={0} rx={6} ry={8 + 30 * Math.abs(Math.cos(t * 9))} fill="#9aa6c8" opacity={0.45} />
      {/* menara */}
      <path d={`M-70,${-HR + 4} L-52,${-HR - 72} L42,${-HR - 72} L66,${-HR + 4} Z`} fill="url(#sub-body)" stroke="#8fa0d0" strokeWidth={2} />
      <line x1={10} y1={-HR - 72} x2={10} y2={-HR - 104} stroke="#8fa0d0" strokeWidth={4} />
      <line x1={10} y1={-HR - 104} x2={26} y2={-HR - 104} stroke="#8fa0d0" strokeWidth={4} />
      <path d={`M-30,${-HR - 40} L-80,${-HR - 34} L-80,${-HR - 28} L-30,${-HR - 30} Z`} fill="#2a3666" />
      <path d={capsule(HL, HR)} fill="url(#sub-body)" />
      <g clipPath="url(#sub-hull)">
        {tanks.map((k, i) => (
          <g key={i}>
            <rect x={k.x0} y={-HR} width={k.x1 - k.x0} height={2 * HR} fill="#cfe4ff" opacity={0.14} />
            {f > 0.003 ? (
              <path d={`${wavePath(k.x0, k.x1, wy, t, 2.4, 0.08, i)} L${k.x1},${HR + 2} L${k.x0},${HR + 2} Z`} fill={C.water} opacity={0.85} />
            ) : null}
          </g>
        ))}
        <rect x={-HL + 150} y={-HR} width={4} height={2 * HR} fill="#8fa0d0" />
        <rect x={HL - 154} y={-HR} width={4} height={2 * HR} fill="#8fa0d0" />
      </g>
      {/* lambung tekan (ruang awak) */}
      <rect x={-HL + 166} y={-HR + 14} width={2 * HL - 332} height={2 * HR - 28} rx={46} fill="#24315e" stroke="#7d8cc0" strokeWidth={2} />
      {[-110, -55, 0, 55, 110].map((x, i) => (
        <circle key={i} cx={x} cy={-22} r={9} fill={C.gold} opacity={0.55 + 0.3 * Math.sin(t * 1.7 + i * 1.3)} />
      ))}
      {/* tabung udara bertekanan + pipa */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s < 0 ? -78 : 12} y={14} width={66} height={26} rx={13} fill="#1d4a6a" stroke={C.cyan} strokeWidth={2} />
          <path d={`M${s * 45},27 L${s * 150},27 L${s * 172},${-HR + 18} L${s * 240},${-HR + 18}`} fill="none" stroke="#8fa0d0" strokeWidth={3} />
        </g>
      ))}
      {blow > 0.01
        ? [-1, 1].map((s) => (
            <SparkLine
              key={s}
              t={t}
              op={blow}
              pts={[
                [s * 45, 27],
                [s * 150, 27],
                [s * 172, -HR + 18],
                [s * 240, -HR + 18],
              ]}
            />
          ))
        : null}
      <path d={capsule(HL, HR)} fill="none" stroke="#a9b8e6" strokeWidth={3} />
      <path d={`M${-HL + HR},${-HR + 8} L${HL - HR},${-HR + 8}`} stroke="#fff" strokeOpacity={0.18} strokeWidth={5} strokeLinecap="round" />
      {/* katup ventilasi & lubang banjir */}
      {tanks.map((k, i) => (
        <g key={i}>
          <rect x={k.vent - 10} y={-HR - 8} width={20} height={9} rx={2} fill="#8fa0d0" />
          {[-40, 0, 40].map((dx) => (
            <rect key={dx} x={k.vent + dx - 9} y={HR - 4} width={18} height={6} rx={2} fill="#0b1126" />
          ))}
          {/* udara keluar dari ventilasi saat tangki dibanjiri */}
          {[0, 1, 2, 3, 4, 5].map((j) => {
            const ph = (((t * 0.9 + j / 6) % 1) + 1) % 1;
            const r = 4 + 4 * rand(j + i * 7);
            return <circle key={j} cx={k.vent + 9 * Math.sin(t * 3 + j)} cy={-HR - 12 - ph * 150} r={r} fill="none" stroke="#e0f2ff" strokeWidth={1.6} opacity={cyc(ph) * flood} />;
          })}
          {/* air masuk (banjir) / keluar (dihembus) */}
          {[-40, 40].map((dx) => (
            <g key={dx}>
              <Arrow x1={k.vent + dx} y1={HR + 46} x2={k.vent + dx} y2={HR + 8} color="water" width={4} opacity={flood} pulse={false} />
              <Arrow x1={k.vent + dx} y1={HR + 6} x2={k.vent + dx} y2={HR + 44} color="water" width={4} opacity={blow} pulse={false} />
            </g>
          ))}
          {[0, 1, 2, 3].map((j) => {
            const ph = (((t * 0.8 + j / 4 + i * 0.1) % 1) + 1) % 1;
            return <circle key={j} cx={k.vent - 30 + 60 * rand(j * 3 + i)} cy={HR + 30 - ph * 40 + 30 * ph * ph} r={5} fill="none" stroke="#e0f2ff" strokeWidth={1.5} opacity={cyc(ph) * blow * 0.8} />;
          })}
        </g>
      ))}
      {/* panah tekanan pada lambung */}
      {pOp > 0.001 ? HULL_PTS.map((p, i) => <PressureArrow key={i} x={p.x + p.nx * 3} y={p.y + p.ny * 3} nx={p.nx} ny={p.ny} L={pL} width={4} opacity={pOp} />) : null}
      <Label x={-HL + 75} y={HR + 70} size={22} color={C.water} opacity={labels}>
        tangki pemberat
      </Label>
      <Label x={HL - 75} y={HR + 70} size={22} color={C.water} opacity={labels}>
        tangki pemberat
      </Label>
      <Label x={0} y={HR + 34} size={20} color={C.cyan} opacity={airLab}>
        udara bertekanan
      </Label>
    </g>
  );
};

/** Butir udara mengalir di pipa. */
const SparkLine: React.FC<{t: number; op: number; pts: [number, number][]}> = ({t, op, pts}) => {
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const tot = seg.reduce((a, b) => a + b, 0);
  return (
    <g opacity={op}>
      {[0, 1, 2, 3, 4].map((j) => {
        const ph = (((t * 0.9 + j / 5) % 1) + 1) % 1;
        let d = ph * tot;
        let k = 0;
        while (k < seg.length - 1 && d > seg[k]) {
          d -= seg[k];
          k++;
        }
        const u = seg[k] ? d / seg[k] : 0;
        const x = mix(pts[k][0], pts[k + 1][0], u);
        const y = mix(pts[k][1], pts[k + 1][1], u);
        return (
          <g key={j} opacity={cyc(ph)}>
            <circle cx={x} cy={y} r={10} fill="url(#soft-cyan)" />
            <circle cx={x} cy={y} r={3} fill="#fff" />
          </g>
        );
      })}
    </g>
  );
};

/** Pengukur tekanan (atm) + kedalaman digital. */
const Gauge: React.FC<{x: number; y: number; d: number; op: number; t: number}> = ({x, y, d, op, t}) => {
  if (op <= 0.001) return null;
  const r = 100;
  const p = atmAt(d);
  const ang = (v: number) => ((-225 + (v / 12) * 270) * Math.PI) / 180;
  const a = ang(Math.min(12.4, p) + 0.04 * Math.sin(t * 6));
  return (
    <g opacity={op}>
      <circle cx={x} cy={y} r={r + 16} fill="url(#soft-press)" opacity={0.5} />
      <circle cx={x} cy={y} r={r} fill="#0d1534" stroke="#a9b8e6" strokeWidth={4} />
      {Array.from({length: 13}, (_, k) => {
        const aa = ang(k);
        const big = k % 2 === 0;
        return (
          <g key={k}>
            <line x1={x + Math.cos(aa) * (r - (big ? 18 : 10))} y1={y + Math.sin(aa) * (r - (big ? 18 : 10))} x2={x + Math.cos(aa) * (r - 4)} y2={y + Math.sin(aa) * (r - 4)} stroke={k >= 10 ? C.press : C.muted} strokeWidth={big ? 3 : 2} />
            {big ? (
              <text x={x + Math.cos(aa) * (r - 34)} y={y + Math.sin(aa) * (r - 34)} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={16} fill={C.muted}>
                {k}
              </text>
            ) : null}
          </g>
        );
      })}
      <text x={x} y={y + 38} textAnchor="middle" fontFamily={FONT.mono} fontSize={17} fill={C.press}>
        atm
      </text>
      <line x1={x - Math.cos(a) * 14} y1={y - Math.sin(a) * 14} x2={x + Math.cos(a) * (r - 22)} y2={y + Math.sin(a) * (r - 22)} stroke={C.press} strokeWidth={5} strokeLinecap="round" />
      <circle cx={x} cy={y} r={9} fill={C.press} />
      <rect x={x - 80} y={y + r + 16} width={160} height={46} rx={10} fill="#0d1534" stroke="#a9b8e6" strokeWidth={2} />
      <text x={x} y={y + r + 40} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontSize={28} fill={C.ink}>
        {Math.round(d)} m
      </text>
    </g>
  );
};

const FLOOR: [number, number][] = [
  [80, -0.45],
  [170, -0.12],
  [230, 0.12],
  [420, 0.22],
  [520, 1.6],
  [640, 3.6],
  [780, 4.3],
  [930, 4.6],
  [1005, 6.6],
  [1045, 10.9],
  [1115, 10.9],
  [1160, 7.4],
  [1260, 5.4],
  [1460, 4.7],
  [1700, 4.4],
  [1840, 4.2],
];
const PS = 210;
const KM = 56;

/** Ikan laut dalam (lokal, menghadap kanan). */
const Fish: React.FC<{t: number}> = ({t}) => {
  const tail = 12 * Math.sin(t * 4.5);
  return (
    <g>
      <g transform={`rotate(${tail.toFixed(2)} -118 0)`}>
        <path d="M-112,0 L-178,-50 L-162,0 L-178,50 Z" fill="#3b3f7a" stroke="#8f8fd8" strokeWidth={2} />
      </g>
      <path d="M-30,-62 Q0,-100 40,-66 Z" fill="#3b3f7a" stroke="#8f8fd8" strokeWidth={2} />
      <path d="M-122,0 C-100,-72 40,-92 112,-30 C134,-10 134,12 112,32 C40,92 -100,72 -122,0 Z" fill="#2b2f5e" stroke="#9a9ae6" strokeWidth={2.5} opacity={0.9} />
      <path d="M-60,-40 C-10,-62 50,-56 92,-26" fill="none" stroke="#fff" strokeOpacity={0.14} strokeWidth={8} strokeLinecap="round" />
      <circle cx={70} cy={-18} r={13} fill="#e8f0ff" />
      <circle cx={73} cy={-18} r={6} fill="#0b1126" />
      <path d="M88,24 L98,14 L104,26 L112,16 L118,28" fill="none" stroke="#e8f0ff" strokeWidth={2} />
      {/* umpan cahaya */}
      <path d={`M80,-50 Q120,-${120 + 6 * Math.sin(t * 1.3)} ${170 + 6 * Math.sin(t * 1.1)},-${96 + 6 * Math.sin(t * 1.3)}`} fill="none" stroke="#8f8fd8" strokeWidth={3} />
      <circle cx={170 + 6 * Math.sin(t * 1.1)} cy={-96 - 6 * Math.sin(t * 1.3)} r={40} fill="url(#soft-cyan)" opacity={0.8 + 0.2 * Math.sin(t * 3)} />
      <circle cx={170 + 6 * Math.sin(t * 1.1)} cy={-96 - 6 * Math.sin(t * 1.3)} r={8} fill="#c9f4ff" />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <circle key={k} cx={-80 + k * 30} cy={30 + 6 * Math.sin(k)} r={3.5} fill={C.cyan} opacity={0.4 + 0.4 * Math.sin(t * 2.5 + k)} />
      ))}
    </g>
  );
};

export const Submarine: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();
  const tFl = wordOf(1, 'diisi');
  const tBl = wordOf(2, 'udara');
  const f1 = ramp(t, tFl, tFl + 3.5, EASE_IN_OUT);
  const blowP = ramp(t, tBl, tBl + 3.2, EASE_IN_OUT);
  const refl = ramp(t, cue(3), cue(3) + 2, EASE_IN_OUT);
  const trim = ramp(t, cue(3) + 3.5, cue(3) + 5, EASE_IN_OUT);
  const f = Math.max(0, Math.min(1, f1 - 0.85 * blowP + 0.55 * refl - 0.1 * trim));
  const flood = win(t, tFl, tFl + 3.3, 0.3, 0.6) + 0.7 * win(t, cue(3), cue(3) + 1.8, 0.3, 0.5);
  const blow = win(t, tBl, tBl + 3.0, 0.3, 0.6);
  const r3 = ramp(t, cue(3) + 0.2, cue(3) + 4.2, EASE_IN_OUT);
  const Dc = 4.4 + 40.6 * ramp(t, tFl + 1.3, cueEnd(1) + 0.6, EASE_IN_OUT) - 33 * ramp(t, tBl + 1.0, cueEnd(2) + 0.6, EASE_IN_OUT) + 88 * r3;
  const cam = 74.4 * r3;
  const surfY = SURF - cam * PX;
  const sx0 = 960 - 200 * ramp(t, cue(3) + 0.2, cue(3) + 3.5, EASE_IN_OUT);
  const nearSurf = 1 - ramp(Dc, 4.4, 9);
  const sy0 = SURF + (Dc - cam) * PX + 2 * Math.sin(t * 0.9) + 3 * nearSurf * Math.sin(t * 1.3);
  const pitch =
    6 * win(t, tFl + 1.0, cueEnd(1) + 0.1, 1.2, 1.2) - 6 * win(t, tBl + 0.8, cueEnd(2) + 0.1, 1.2, 1.2) + 4 * win(t, cue(3) + 0.2, cue(3) + 3.4, 1.2, 1.2) + 1.2 * nearSurf * Math.sin(t * 1.1);
  const appear = ramp(t, -0.3, 1.0);
  const aOut = ramp(t, cue(4) - 0.4, cue(4) + 1.0, EASE_IN_OUT);
  const bOp = ramp(t, cue(4) - 0.1, cue(4) + 1.0) * (1 - ramp(t, cue(5) - 0.4, cue(5) + 0.6, EASE_IN_OUT));
  const cOp = ramp(t, cue(5) - 0.2, cue(5) + 0.9);
  // zoom-keluar: adegan dekat mengecil menuju posisi kapal di profil laut
  const zs = mix(1, 0.06, aOut);
  const zx = mix(sx0, 430, aOut);
  const zy = mix(sy0, PS + 0.1 * KM, aOut);
  const W = 100 + 50 * f;
  const FA = 100 + 30 * Math.max(0, Math.min(1, (Dc - 4.4) / 7.6));
  const arOp = win(t, 2.2, cue(3) - 0.1, 0.8, 0.6);
  const pOp = ramp(t, cue(3) + 1.0, cue(3) + 2.4) * (1 - aOut);
  const pL = 10 + 0.5 * Math.max(0, Dc - 10);
  const n1 = win(t, wordOf(1, 'massa') - 0.2, cue(2) - 0.3, 0.6, 0.5);
  const n2 = win(t, wordOf(2, 'ringan') - 0.6, cue(3) + 0.3, 0.6, 0.5);
  const fOp = ramp(t, wordOf(3, 'sebelas') - 0.3, wordOf(3, 'sebelas') + 0.6) * (1 - aOut);
  const mOp = ramp(t, wordOf(3, 'juta') - 0.8, wordOf(3, 'juta') + 0.2) * (1 - aOut);
  const dark = 0.6 * (cam / 74.4);

  // profil laut
  const tProbe = ramp(t, cue(4) + 0.6, cue(4) + 6.0, EASE_IN_OUT);
  const dm = 10900 * tProbe;
  const probeY = PS + (dm / 1000) * KM;
  const f4 = ramp(t, wordOf(4, 'tekanannya') - 0.3, wordOf(4, 'tekanannya') + 0.6) * (1 - ramp(t, cue(5) - 0.4, cue(5) + 0.4, EASE_IN_OUT));
  const floorD = FLOOR.map(([x, k], i) => `${i ? 'L' : 'M'}${x},${(PS + k * KM).toFixed(1)}`).join(' ') + ' L1840,862 L80,862 Z';

  // ikan & balon
  const pBal = 1 + 999 * ramp(t, cue(5) + 0.8, cue(5) + 5.6, EASE_IN_OUT);
  const rBal = 85 * Math.pow(1 / pBal, 1 / 3);
  const fx = 1170 + 22 * Math.sin(t * 0.4);
  const fyy = 520 + 12 * Math.sin(t * 0.7);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===== A: dekat (baris 0–3) ===== */}
        <g opacity={appear * (1 - aOut)} transform={`translate(${zx.toFixed(2)} ${zy.toFixed(2)}) scale(${zs.toFixed(4)}) translate(${(-sx0).toFixed(2)} ${(-sy0).toFixed(2)})`}>
          <Water x={-60} y={surfY} w={2040} h={1200 - surfY} amp={5} seed={1} />
          <rect x={-60} y={-200} width={2040} height={1400} fill="#020611" opacity={dark} />
          {/* berkas cahaya dari permukaan */}
          {[0, 1, 2, 3].map((k) => {
            const x = 300 + k * 420 + 40 * Math.sin(t * 0.3 + k);
            return <path key={k} d={`M${x},${surfY} L${x + 90},${surfY} L${x + 260},${surfY + 700} L${x + 120},${surfY + 700} Z`} fill="#bfe3ff" opacity={(0.05 + 0.025 * Math.sin(t * 0.8 + k)) * (1 - cam / 74.4)} />;
          })}
          <Bubbles x={80} y={Math.max(surfY, 170) + 20} w={1760} h={700} n={10} seed={4} speed={0.8} />
          <Motes x={sx0} y={sy0} rx={700} ry={320} n={30} color="cyan" opacity={0.35} seed={8} />
          {/* penggaris kedalaman (kanan) */}
          <g>
            <line x1={1792} y1={170} x2={1792} y2={880} stroke={C.muted} strokeWidth={2} opacity={0.5} />
            {Array.from({length: 13}, (_, k) => {
              const d = k * 10;
              const y = SURF + (d - cam) * PX;
              const o = ramp(y, 175, 215) * (1 - ramp(y, 835, 875));
              return o > 0.001 ? (
                <g key={k} opacity={o}>
                  <line x1={1778} y1={y} x2={1806} y2={y} stroke={C.muted} strokeWidth={2.5} />
                  {[1, 2, 3, 4].map((j) => (
                    <line key={j} x1={1786} y1={y + j * 18} x2={1798} y2={y + j * 18} stroke={C.muted} strokeWidth={1.5} opacity={0.6} />
                  ))}
                  <Label x={1766} y={y} anchor="end" size={20} color={C.muted} font="mono">
                    {d} m
                  </Label>
                </g>
              ) : null;
            })}
          </g>
          <g transform={`translate(${sx0.toFixed(2)} ${sy0.toFixed(2)}) rotate(${pitch.toFixed(3)})`}>
            <ellipse cx={-HL - 70} cy={0} rx={60} ry={14} fill="#cfeaff" opacity={0.06} />
            <SubBoat t={t} f={f} flood={Math.min(1, flood)} blow={blow} pL={pL} pOp={pOp} labels={win(t, 1.0, cue(1) + 0.4, 0.8, 0.6)} airLab={win(t, tBl - 0.6, cueEnd(2), 0.6, 0.6)} />
          </g>
          {/* permukaan riak di dekat kapal yang mengapung */}
          <Ripple x={sx0 + 40} y={surfY} p={(t - tFl - 0.3) / 1.6} r={240} color="water" rings={3} />
          {/* gaya: berat & gaya apung */}
          <g opacity={arOp}>
            <circle cx={sx0} cy={sy0} r={7} fill={C.ink} />
            <Arrow x1={sx0 + 200} y1={sy0 + 6} x2={sx0 + 200} y2={sy0 + W} color="force" width={6} />
            <Arrow x1={sx0 + 200} y1={sy0 - 6} x2={sx0 + 200} y2={sy0 - FA} color="buoy" width={6} />
            <Label x={sx0 + 230} y={sy0 + W - 12} anchor="start" size={30} color={C.force} font="serif" italic>
              W
            </Label>
            <Label x={sx0 + 230} y={sy0 - FA + 14} anchor="start" size={30} color={C.buoy} font="serif" italic>
              F<TSub>A</TSub>
            </Label>
          </g>
        </g>
        <Gauge x={1600} y={318} d={Dc} op={appear * (1 - aOut)} t={t} />
        {/* pelat 1 m² */}
        {mOp > 0.001 ? (
          <g opacity={mOp}>
            <line x1={sx0 + 160} y1={sy0 + HR + 10} x2={1450} y2={700} stroke={C.press} strokeWidth={1.5} strokeDasharray="6 6" opacity={0.5} />
            <circle cx={sx0 + 160} cy={sy0 + HR + 4} r={10} fill="none" stroke={C.press} strokeWidth={2} />
            <Glow x={1570} y={700} r={200} color="press" opacity={0.4} />
            <path d="M1480,712 L1660,712 L1690,742 L1510,742 Z" fill="#45507e" stroke="#a9b8e6" strokeWidth={2} />
            {[0, 1, 2, 3, 4].map((k) => (
              <PressureArrow key={k} x={1500 + k * 40 + 10} y={712} nx={0} ny={-1} L={70} width={5} />
            ))}
            <Label x={1585} y={772} size={24} color={C.muted}>
              1 m² lambung
            </Label>
            <Label x={1585} y={598} size={32} color={C.press} weight={700}>
              ≈ 1 000 000 N
            </Label>
            <Label x={1585} y={812} size={22} color={C.muted}>
              (setara berat ≈ 100 ton)
            </Label>
          </g>
        ) : null}

        {/* ===== B: profil laut (baris 4) ===== */}
        {bOp > 0.001 ? (
          <g opacity={bOp}>
            <defs>
              <linearGradient id="sub-ocean" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2e8fe0" stopOpacity={0.75} />
                <stop offset="18%" stopColor="#0f3d7a" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#030a1f" stopOpacity={1} />
              </linearGradient>
            </defs>
            <rect x={80} y={PS} width={1760} height={650} fill="url(#sub-ocean)" />
            <path d={wavePath(80, 1840, PS, t, 3)} fill="none" stroke="#cfeaff" strokeWidth={2.5} opacity={0.7} />
            <Motes x={1000} y={640} rx={800} ry={180} n={30} color="cyan" opacity={0.4} seed={12} />
            <path d={floorD} fill="#17142c" stroke="#6b5c94" strokeWidth={2.5} strokeLinejoin="round" />
            {/* sumbu kedalaman */}
            <line x1={1840} y1={PS} x2={1840} y2={PS + 11 * KM} stroke={C.muted} strokeWidth={2} />
            {Array.from({length: 12}, (_, k) => (
              <g key={k}>
                <line x1={1828} y1={PS + k * KM} x2={1840} y2={PS + k * KM} stroke={C.muted} strokeWidth={2} />
                {k % 2 === 0 ? (
                  <Label x={1820} y={PS + k * KM} anchor="end" size={19} color={C.muted} font="mono">
                    {k} km
                  </Label>
                ) : null}
              </g>
            ))}
            {/* kapal selam di 100 m */}
            <ellipse cx={430} cy={PS + 0.1 * KM} rx={16} ry={5} fill="#8fa0d0" />
            <Label x={452} y={PS + 30} anchor="start" size={21} color={C.ink}>
              kapal selam · 100 m
            </Label>
            {/* wahana menuju dasar palung */}
            <line x1={1080} y1={PS} x2={1080} y2={probeY} stroke="#cfeaff" strokeWidth={1.5} strokeDasharray="4 6" opacity={0.4} />
            {Array.from({length: 8}, (_, k) => {
              const a = (k / 8) * Math.PI * 2;
              return <PressureArrow key={k} x={1080 + Math.cos(a) * 14} y={probeY + Math.sin(a) * 14} nx={Math.cos(a)} ny={Math.sin(a)} L={6 + 34 * tProbe} width={3} opacity={ramp(tProbe, 0.02, 0.1)} />;
            })}
            <Spark x={1080} y={probeY} r={8} color="gold" />
            <Label x={1056} y={probeY - 8} anchor="end" size={22} color={C.ink} font="mono" opacity={ramp(tProbe, 0.01, 0.05)}>
              {Math.round(dm / 10) * 10} m
            </Label>
            <Label x={1056} y={probeY + 20} anchor="end" size={22} color={C.press} font="mono" opacity={ramp(tProbe, 0.01, 0.05)}>
              {Math.round(atmAt(dm))} atm
            </Label>
            <Ripple x={1080} y={PS + 10.9 * KM} p={(t - cue(4) - 6.0) / 1.4} r={130} color="press" />
            <Twinkles x={1080} y={PS + 10.9 * KM} rx={60} ry={20} n={4} color="press" opacity={ramp(tProbe, 0.95, 1)} seed={3} />
            <Label x={1080} y={850} size={22} color={C.gold}>
              Palung Mariana · Challenger Deep
            </Label>
          </g>
        ) : null}

        {/* ===== C: ikan laut dalam (baris 5) ===== */}
        {cOp > 0.001 ? (
          <g opacity={cOp}>
            <rect x={-60} y={-60} width={2040} height={1200} fill="#030817" opacity={0.92} />
            {Array.from({length: 34}, (_, k) => {
              const ph = (((t * (0.025 + 0.02 * rand(k)) + rand(k * 3.3)) % 1) + 1) % 1;
              return <circle key={k} cx={100 + rand(k * 7.7) * 1720 + 10 * Math.sin(t * 0.5 + k)} cy={170 + ph * 720} r={1.4 + rand(k) * 1.6} fill="#cfd8ff" opacity={cyc(ph) * 0.45} />;
            })}
            <Motes x={1170} y={520} rx={420} ry={260} n={26} color="cyan" opacity={0.5} seed={19} />
            <Glow x={fx + 170} y={fyy - 96} r={180} color="cyan" opacity={0.5} />
            <g transform={`translate(${fx.toFixed(2)} ${fyy.toFixed(2)})`}>
              <Fish t={t} />
              {Array.from({length: 10}, (_, k) => {
                const a = (k / 10) * Math.PI * 2 + 0.3;
                const ex = Math.cos(a) * 128;
                const ey = Math.sin(a) * 70;
                const nl = Math.hypot(Math.cos(a) / 128, Math.sin(a) / 70);
                const nx = Math.cos(a) / 128 / nl;
                const ny = Math.sin(a) / 70 / nl;
                return (
                  <g key={k}>
                    <PressureArrow x={ex + nx * 4} y={ey + ny * 4} nx={nx} ny={ny} L={50} width={4} />
                    <PressureArrow x={ex * 0.92 - nx * 6} y={ey * 0.92 - ny * 6} nx={-nx} ny={-ny} L={34} width={3} color="#ffb6d6" opacity={ramp(t, wordOf(5, 'Tekanan') - 0.3, wordOf(5, 'Tekanan') + 0.5)} />
                  </g>
                );
              })}
            </g>
            <Label x={1170} y={292} size={26} color={C.ink}>
              tubuh hampir tanpa rongga udara
            </Label>
            {/* pembanding: kantong udara mengerut */}
            <Glow x={420} y={520} r={180} color="water" opacity={0.3} />
            <circle cx={420} cy={520} r={rBal} fill="#cfeaff" opacity={0.25} stroke="#e0f2ff" strokeWidth={2.5} />
            <circle cx={420 - rBal * 0.35} cy={520 - rBal * 0.35} r={rBal * 0.18} fill="#fff" opacity={0.6} />
            {Array.from({length: 8}, (_, k) => {
              const a = (k / 8) * Math.PI * 2;
              return <PressureArrow key={k} x={420 + Math.cos(a) * (rBal + 3)} y={520 + Math.sin(a) * (rBal + 3)} nx={Math.cos(a)} ny={Math.sin(a)} L={44} width={4} />;
            })}
            <Label x={420} y={330} size={26} color={C.water}>
              kantong udara
            </Label>
            <Label x={420} y={690} size={28} color={C.press} font="mono">
              {Math.round(pBal)} atm
            </Label>
            <Label x={420} y={735} size={22} color={C.muted}>
              volumenya menyusut
            </Label>
          </g>
        ) : null}
      </Stage>

      <Note x={440} y={842} p={n1} color={C.force} size={28}>
        ρ̄ kapal &gt; ρ air laut → <b style={{color: C.force}}>turun</b>
      </Note>
      <Note x={440} y={842} p={n2} color={C.buoy} size={28}>
        ρ̄ kapal &lt; ρ air laut → <b style={{color: C.buoy}}>naik</b>
      </Note>
      <Formula x={760} y={826} p={fOp} accent={C.press} size={56} caption="ρ air laut ≈ 1025 kg/m³ · h = 100 m">
        <V>p</V> = <V>p</V>
        <Sub>0</Sub> + <V>ρgh</V> ≈ 1,1 MPa ≈ <b style={{color: C.press}}>11 atm</b>
      </Formula>
      <Formula x={1450} y={330} p={f4} accent={C.press} size={56} caption="Challenger Deep ≈ 10 900 m">
        <V>p</V> ≈ 1,1 × 10<Sup>8</Sup> Pa &gt; <b style={{color: C.press}}>1000 atm</b>
      </Formula>
      <Note x={1170} y={790} p={cOp * ramp(t, wordOf(5, 'seimbang') - 0.4, wordOf(5, 'seimbang') + 0.4)} color={C.press} size={30}>
        <V>p</V>
        <Sub>dalam</Sub> = <V>p</V>
        <Sub>luar</Sub> → tidak remuk
      </Note>
    </AbsoluteFill>
  );
};
