import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, EASE_IN_OUT, cyc, mix, ramp, rand} from '../anim';
import {Bubbles, Water, WaterMolecule, wavePath} from '../components/fluid';
import {Person} from '../components/physics';
import {Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Gunung es: 917/1025 ≈ 0,89 tercelup (garis air dihitung dari luas penampang poligon), kisi heksagonal es,
// Titanic 1912 menggores bagian tersembunyi, danau membeku dari atas.
type P = [number, number];
const ICE: P[] = [
  [-150, 0],
  [-120, -60],
  [-70, -92],
  [-40, -170],
  [0, -212],
  [30, -182],
  [62, -200],
  [95, -122],
  [130, -72],
  [160, 0],
  [175, 18],
  [395, 78],
  [380, 110],
  [300, 150],
  [380, 230],
  [400, 320],
  [330, 410],
  [200, 470],
  [40, 490],
  [-120, 470],
  [-260, 410],
  [-350, 320],
  [-370, 220],
  [-320, 130],
  [-240, 60],
  [-170, 15],
];
const FRAC = 917 / 1025;
const polyArea = (pts: P[]) => Math.abs(pts.reduce((s, p, i) => s + p[0] * pts[(i + 1) % pts.length][1] - pts[(i + 1) % pts.length][0] * p[1], 0)) / 2;
const clipBelow = (pts: P[], y0: number): P[] => {
  const out: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const prev = pts[(i + pts.length - 1) % pts.length];
    const cin = cur[1] >= y0;
    const pin = prev[1] >= y0;
    const cross = (): P => {
      const u = (y0 - prev[1]) / (cur[1] - prev[1]);
      return [prev[0] + (cur[0] - prev[0]) * u, y0];
    };
    if (cin) {
      if (!pin) out.push(cross());
      out.push(cur);
    } else if (pin) out.push(cross());
  }
  return out;
};
// garis air lokal: luas bagian bawah = 0,89 × luas total (penampang sebagai wakil volume)
const YW = (() => {
  const tot = polyArea(ICE);
  let lo = -212;
  let hi = 490;
  for (let k = 0; k < 50; k++) {
    const m = (lo + hi) / 2;
    if (polyArea(clipBelow(ICE, m)) > FRAC * tot) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
})();
const S = 0.9;
const WL = 420; // garis air di layar
const TY = WL - S * YW;
const ICE_D = ICE.map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ') + ' Z';
// titik sentuh lunas kapal dengan tonjolan bawah air (tepi [175,18]→[395,78])
const KEEL = 38;
const KEEL_L = YW + KEEL / S;
const XC_L = 175 + (220 * Math.max(0, Math.min(60, KEEL_L - 18))) / 60;

const FACETS = ['M-40,-170 L-10,-90 L30,-182', 'M-10,-90 L62,-200', 'M-10,-90 L-70,-92', 'M-10,-90 L40,-30 L95,-122', 'M40,-30 L130,-72', 'M-80,-30 L40,-30'];

/** Kapal Titanic (siluet), haluan di kiri, garis air y = 0. */
const Ship: React.FC<{t: number; gash: number}> = ({t, gash}) => (
  <g>
    {[30, 352].map((x) => (
      <line key={x} x1={x} y1={-34} x2={x + 4} y2={-150} stroke="#8a93b8" strokeWidth={2.5} />
    ))}
    <line x1={34} y1={-148} x2={356} y2={-148} stroke="#8a93b8" strokeWidth={1} opacity={0.6} />
    <rect x={60} y={-54} width={262} height={22} rx={3} fill="#e3e6ef" />
    <rect x={90} y={-66} width={200} height={14} rx={3} fill="#cfd4e4" />
    {[110, 160, 210, 260].map((x, i) => (
      <g key={x}>
        <path d={`M${x},-64 L${x + 24},-64 L${x + 34},-126 L${x + 10},-126 Z`} fill="#d9a441" />
        <path d={`M${x + 7},-114 L${x + 31},-114 L${x + 34},-126 L${x + 10},-126 Z`} fill="#141420" />
        {i < 3
          ? [0, 1, 2].map((k) => {
              const ph = (((t * 0.35 + k / 3 + i * 0.17) % 1) + 1) % 1;
              return <circle key={k} cx={x + 22 + ph * 110} cy={-134 - ph * 50} r={8 + ph * 20} fill="#9aa3c0" opacity={cyc(ph) * 0.35} />;
            })
          : null}
      </g>
    ))}
    <path d="M-6,-36 L380,-34 L376,6 L360,0 L26,0 L6,10 Z" fill="#11131f" stroke="#555d80" strokeWidth={1.5} />
    <path d="M6,0 L376,0 L360,38 L28,38 Z" fill="#7a2230" opacity={0.6} />
    {Array.from({length: 22}, (_, k) => (
      <circle key={k} cx={30 + k * 15} cy={-20} r={2.4} fill={C.gold} opacity={0.5 + 0.4 * Math.sin(t * 1.5 + k * 1.7)} />
    ))}
    {gash > 0 ? (
      <g>
        <line x1={8} y1={32} x2={8 + gash} y2={32} stroke={C.heat} strokeWidth={10} strokeLinecap="round" opacity={0.35} />
        <line x1={8} y1={32} x2={8 + gash} y2={32} stroke="#ffd0b0" strokeWidth={3} strokeLinecap="round" />
      </g>
    ) : null}
  </g>
);

/** Kisi es heksagonal: O di sudut segi enam, ikatan hidrogen putus-putus. */
const HEX_A = 86;
const LAT = (() => {
  const pts: P[] = [];
  const box = {x0: 200, x1: 860, y0: 230, y1: 810};
  const ax = Math.sqrt(3) * HEX_A;
  for (let r = -1; r < 9; r++) {
    for (let c = -1; c < 8; c++) {
      const x = box.x0 + 20 + c * ax + (r % 2 ? ax / 2 : 0);
      const y = box.y0 + 10 + r * 1.5 * HEX_A;
      pts.push([x, y], [x, y + HEX_A]);
    }
  }
  const inBox = pts.filter((p) => p[0] > box.x0 - 60 && p[0] < box.x1 + 60 && p[1] > box.y0 - 60 && p[1] < box.y1 + 60);
  const edges: [number, number][] = [];
  for (let i = 0; i < inBox.length; i++)
    for (let j = i + 1; j < inBox.length; j++) if (Math.abs(Math.hypot(inBox[i][0] - inBox[j][0], inBox[i][1] - inBox[j][1]) - HEX_A) < 2) edges.push([i, j]);
  return {pts: inBox, edges};
})();
const LIQ = Array.from({length: 64}, (_, i) => {
  const c = i % 8;
  const r = Math.floor(i / 8);
  return {x: 1060 + 42 + c * 82 + (rand(i * 3.1) - 0.5) * 40, y: 230 + 36 + r * 72 + (rand(i * 7.7) - 0.5) * 34, ph: rand(i * 1.9) * 6.28, rot: rand(i * 4.3) * 360, sp: (rand(i * 2.7) - 0.5) * 60};
});

export const Iceberg: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const appear = ramp(t, -0.3, 1.0);
  const sea0 = appear * (1 - ramp(t, cue(1) - 0.4, cue(1) + 0.5, EASE_IN_OUT));
  const sea3 = ramp(t, cue(3) - 0.3, cue(3) + 0.7) * (1 - ramp(t, cue(5) - 0.4, cue(5) + 0.4, EASE_IN_OUT));
  const sea = Math.max(sea0, sea3);
  const p1 = ramp(t, cue(1) - 0.2, cue(1) + 0.7) * (1 - ramp(t, cue(2) - 0.4, cue(2) + 0.4, EASE_IN_OUT));
  const p2 = ramp(t, cue(2) - 0.2, cue(2) + 0.7) * (1 - ramp(t, cue(3) - 0.4, cue(3) + 0.3, EASE_IN_OUT));
  const p5 = ramp(t, cue(5) - 0.2, cue(5) + 0.7);
  const cx = t < cue(2) ? 960 : 760;
  const bob = 3 * Math.sin(t * 0.8);
  const tilt = 0.5 * Math.sin(t * 0.5);
  const reveal = ramp(t, cue(4) + 0.2, cue(4) + 2.6, EASE_IN_OUT);
  const uw = mix(mix(0.12, 0.38, ramp(t, cue(3) + 0.4, cue(3) + 1.4)), 0.92, reveal);
  const brk = ramp(t, wordOf(3, 'fraksi') - 0.3, wordOf(3, 'fraksi') + 0.5) * sea3;
  const fOp = ramp(t, wordOf(3, 'sembilan') - 0.3, wordOf(3, 'sembilan') + 0.6) * (1 - ramp(t, cue(4) + 0.6, cue(4) + 1.4, EASE_IN_OUT));
  const tip = TY + S * -212;
  const bot = TY + S * 490;
  const leftX = cx + S * -370 - 40;

  // Titanic
  const tIn = cue(4) + 2.6;
  const tHit = Math.max(tIn + 4, wordOf(4, 'merobek'));
  const xcS = 760 + S * XC_L;
  const xStop = xcS - 55;
  // satu gerak melambat; titik sentuh (≈ 93 % lintasan) tercapai sekitar kata "merobek"
  const tStop = tIn + (tHit - tIn) / 0.7;
  const shipX = mix(1900, xStop, ramp(t, tIn, tStop, EASE));
  const gash = Math.max(0, xcS - shipX);
  const shipOp = ramp(t, tIn - 0.2, tIn + 0.8) * sea3;
  const scrape = ramp(gash, 0, 6) * (1 - ramp(t, tStop - 0.6, tStop + 0.4));

  // danau
  const iceH = 60 * ramp(t, cue(5) + 0.3, cue(5) + 3.2, EASE_IN_OUT);
  const lake = 'M200,400 C300,600 500,830 960,840 C1420,830 1620,600 1720,400 Z';

  return (
    <AbsoluteFill>
      <Stage>
        {/* ===== laut + gunung es ===== */}
        {sea > 0.001 ? (
          <g opacity={sea}>
            {Array.from({length: 30}, (_, k) => (
              <circle key={k} cx={90 + rand(k * 3.3) * 1740} cy={175 + rand(k * 5.1) * 200} r={0.8 + rand(k) * 1.6} fill="#fff" opacity={0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * (1 + rand(k * 2)) + k))} />
            ))}
            <circle cx={1640} cy={230} r={34} fill="#f2f0e0" opacity={0.85} />
            <circle cx={1640} cy={230} r={110} fill="url(#soft-white)" opacity={0.4} />
            <Water x={-40} y={WL} w={2000} h={700} amp={4} seed={3} />
            {[0, 1, 2, 3, 4].map((k) => (
              <rect key={k} x={1600 + 8 * Math.sin(t * 1.4 + k)} y={WL + 14 + k * 14} width={80 - k * 12} height={3} rx={1.5} fill="#fff" opacity={0.25 - k * 0.04} />
            ))}
            <Bubbles x={100} y={WL + 60} w={1700} h={400} n={8} seed={6} speed={0.6} />
            <defs>
              <clipPath id="ice-above">
                <rect x={0} y={0} width={1920} height={WL} />
              </clipPath>
              <clipPath id="ice-below">
                <rect x={0} y={WL} width={1920} height={700} />
              </clipPath>
              <linearGradient id="ice-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#a8dcff" />
              </linearGradient>
              <linearGradient id="ice-u" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8fd2ff" />
                <stop offset="100%" stopColor="#2f6fb8" />
              </linearGradient>
            </defs>
            <g clipPath="url(#ice-below)">
              <g transform={`translate(${cx} ${TY + bob}) rotate(${tilt}) scale(${S})`}>
                <path d={ICE_D} fill="url(#ice-u)" opacity={uw * 0.8} stroke="#d8f0ff" strokeWidth={2.5 / S} strokeOpacity={Math.min(1, uw * 1.6)} strokeDasharray={reveal < 1 ? `${mix(10, 1000, reveal)} ${mix(8, 0, reveal)}` : undefined} />
              </g>
              {/* sapuan cahaya */}
              <rect x={mix(cx - 560, cx + 560, reveal) - 80} y={WL} width={160} height={700} fill="#cfeaff" opacity={0.12 * Math.sin(Math.PI * reveal)} />
            </g>
            <g clipPath="url(#ice-above)">
              <g transform={`translate(${cx} ${TY + bob}) rotate(${tilt}) scale(${S})`}>
                <path d={ICE_D} fill="url(#ice-g)" stroke="#ffffff" strokeWidth={2 / S} />
                {FACETS.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#7fb8e6" strokeWidth={2 / S} opacity={0.6} />
                ))}
              </g>
            </g>
            <Glow x={cx} y={WL - 90} r={260} color="cyan" opacity={0.35} />
            <path d={wavePath(-40, 1960, WL, t, 4, 0.035, 3)} fill="none" stroke="#e6f6ff" strokeWidth={2.5} opacity={0.75} />
            <Motes x={cx} y={WL - 80} rx={300} ry={140} n={18} color="white" opacity={0.35} seed={4} />
            {/* kurung 11 % / 89 % */}
            <g opacity={brk}>
              <path d={`M${leftX + 14},${tip} L${leftX},${tip} L${leftX},${WL - 4} L${leftX + 14},${WL - 4}`} fill="none" stroke={C.ink} strokeWidth={2.5} />
              <path d={`M${leftX + 14},${WL + 4} L${leftX},${WL + 4} L${leftX},${bot} L${leftX + 14},${bot}`} fill="none" stroke={C.water} strokeWidth={2.5} />
              <Label x={leftX - 16} y={(tip + WL) / 2} anchor="end" size={38} color={C.ink} weight={700}>
                11 %
              </Label>
              <Label x={leftX - 16} y={(WL + bot) / 2} anchor="end" size={38} color={C.water} weight={700}>
                89 %
              </Label>
              <Label x={leftX - 16} y={(tip + WL) / 2 + 36} anchor="end" size={21} color={C.muted} opacity={ramp(t, cue(4), cue(4) + 0.8)}>
                terlihat
              </Label>
              <Label x={leftX - 16} y={(WL + bot) / 2 + 36} anchor="end" size={21} color={C.muted} opacity={ramp(t, cue(4), cue(4) + 0.8)}>
                tersembunyi
              </Label>
            </g>
            {/* Titanic */}
            {shipOp > 0.001 ? (
              <g opacity={shipOp}>
                <g transform={`translate(${shipX.toFixed(2)} ${(WL + 1.5 * Math.sin(t * 1.1)).toFixed(2)})`}>
                  <Ship t={t} gash={gash} />
                </g>
                <rect x={shipX} y={WL + 2} width={400} height={40} fill="#0b2f66" opacity={0.35} />
                <Label x={shipX + 190} y={WL - 190} size={28} color={C.gold} weight={600} opacity={ramp(t, wordOf(4, 'Titanic') - 0.3, wordOf(4, 'Titanic') + 0.5)}>
                  Titanic · 1912
                </Label>
                <g opacity={scrape}>
                  {[0, 1, 2, 3, 4, 5].map((k) => {
                    const ph = (((t * 2.2 + k / 6) % 1) + 1) % 1;
                    const a = -0.4 - rand(k) * 2.2;
                    return <Spark key={k} x={xcS + Math.cos(a) * 50 * ph} y={WL + KEEL + Math.sin(a) * 40 * ph + 30 * ph * ph} r={3} color="gold" opacity={cyc(ph)} />;
                  })}
                </g>
                <Ripple x={xcS} y={WL + KEEL} p={(t - tHit + 0.1) / 1.4} r={120} color="heat" />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ===== P1: padat mengapung vs tenggelam ===== */}
        {p1 > 0.001 ? (
          <g opacity={p1}>
            {[
              {x: 230, liq: C.water, fill: 'water'},
              {x: 640, liq: '#e0a440', fill: 'wax'},
            ].map((b, i) => (
              <g key={i}>
                <ellipse cx={b.x + 140} cy={792} rx={160} ry={12} fill="#000" opacity={0.35} />
                {i === 0 ? (
                  <Water x={b.x + 6} y={480} w={268} h={294} amp={2.5} seed={1} />
                ) : (
                  <g>
                    <Water x={b.x + 6} y={480} w={268} h={294} amp={1.5} color="#e0a440" seed={2} caustics={false} />
                    {[0, 1, 2].map((k) => {
                      const ph = (((t * 0.3 + k / 3) % 1) + 1) % 1;
                      return <path key={k} d={`M${b.x + 70 + k * 70},${760 - ph * 260} q8,-12 0,-24 q-8,-12 0,-24`} fill="none" stroke="#ffd9a0" strokeWidth={2} opacity={cyc(ph) * 0.35} />;
                    })}
                    <rect x={b.x + 90} y={690} width={100} height={80} rx={10} fill="#f0d39a" stroke="#fff3d6" strokeWidth={2} />
                    <rect x={b.x + 100} y={698} width={40} height={10} rx={5} fill="#fff" opacity={0.35} />
                  </g>
                )}
                {i === 0 ? (
                  <g transform={`translate(${b.x + 140} ${480 - 7.5 + 1.6 * Math.sin(t * 1.6)}) rotate(${2 * Math.sin(t * 0.9)})`}>
                    <rect x={-45} y={0} width={90} height={90} rx={12} fill="#e8f7ff" opacity={0.85} stroke="#fff" strokeWidth={2} />
                    <path d="M-30,14 L20,14" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
                  </g>
                ) : null}
                <path d={`M${b.x},400 L${b.x},780 L${b.x + 280},780 L${b.x + 280},400`} fill="none" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={5} strokeLinejoin="round" />
                <line x1={b.x + 18} y1={420} x2={b.x + 18} y2={760} stroke="#fff" strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" />
              </g>
            ))}
            <Label x={370} y={830} size={25} color={C.water}>
              es di air: mengapung
            </Label>
            <Label x={780} y={830} size={25} color="#e0a440">
              lilin padat di lilin cair: tenggelam
            </Label>
            <Twinkles x={370} y={480} rx={90} ry={30} n={4} color="cyan" opacity={ramp(t, wordOf(1, 'keanehan') - 0.2, wordOf(1, 'keanehan') + 0.5)} seed={2} />
            {/* batang massa jenis */}
            {[
              {x: 1240, v: 917, name: 'es'},
              {x: 1480, v: 1000, name: 'air'},
            ].map((b, i) => {
              const g = ramp(t, wordOf(1, 'sembilan') - 0.3 + i * 0.3, wordOf(1, 'sembilan') + 1.0 + i * 0.3, EASE);
              const h = b.v * 0.4 * g;
              return (
                <g key={b.name}>
                  <rect x={b.x} y={800 - 400} width={130} height={400} rx={10} fill={C.spr} opacity={0.08} />
                  <rect x={b.x} y={800 - h} width={130} height={h} rx={10} fill={C.spr} opacity={i ? 0.55 : 0.9} />
                  <rect x={b.x + 10} y={800 - h + 8} width={16} height={Math.max(0, h - 16)} rx={8} fill="#fff" opacity={0.15} />
                  <Label x={b.x + 65} y={800 - h - 26} size={30} color={C.spr} weight={700} font="mono" opacity={g}>
                    {b.v === 917 ? '917' : '1000'}
                  </Label>
                  <Label x={b.x + 65} y={834} size={26} color={C.ink}>
                    {b.name}
                  </Label>
                </g>
              );
            })}
            <line x1={1200} y1={800} x2={1650} y2={800} stroke={C.muted} strokeWidth={2.5} />
            <Label x={1425} y={872} size={20} color={C.muted}>
              massa jenis (kg/m³)
            </Label>
          </g>
        ) : null}

        {/* ===== P2: kisi heksagonal vs cair ===== */}
        {p2 > 0.001 ? (
          <g opacity={p2}>
            <defs>
              <clipPath id="ice-lat">
                <rect x={200} y={230} width={660} height={580} rx={18} />
              </clipPath>
              <clipPath id="ice-liq">
                <rect x={1060} y={230} width={660} height={580} rx={18} />
              </clipPath>
            </defs>
            <rect x={200} y={230} width={660} height={580} rx={18} fill="#0c1636" stroke={C.cyan} strokeOpacity={0.6} strokeWidth={2.5} />
            <rect x={1060} y={230} width={660} height={580} rx={18} fill="#0c1636" stroke={C.water} strokeOpacity={0.6} strokeWidth={2.5} />
            <g clipPath="url(#ice-lat)">
              {(() => {
                const pos = LAT.pts.map((p, i) => [p[0] + 1.6 * Math.sin(t * 7 + i * 1.3), p[1] + 1.6 * Math.cos(t * 6.3 + i * 0.7)] as P);
                const ring = ramp(t, wordOf(2, 'lapang') - 0.4, wordOf(2, 'lapang') + 0.4);
                return (
                  <g>
                    <Glow x={200 + 20 + 2 * Math.sqrt(3) * HEX_A + Math.sqrt(3) * HEX_A / 2} y={230 + 10 + 3 * HEX_A + HEX_A / 2} r={110} color="cyan" opacity={0.8 * ring} />
                    {LAT.edges.map(([i, j], k) => {
                      const a = rand(k * 2.3) > 0.5 ? pos[i] : pos[j];
                      const b = a === pos[i] ? pos[j] : pos[i];
                      const hx = mix(a[0], b[0], 0.3);
                      const hy = mix(a[1], b[1], 0.3);
                      return (
                        <g key={k}>
                          <line x1={a[0]} y1={a[1]} x2={hx} y2={hy} stroke="#dfe6ff" strokeWidth={4} />
                          <line x1={hx} y1={hy} x2={b[0]} y2={b[1]} stroke={C.cyan} strokeWidth={2.5} strokeDasharray="5 5" opacity={0.6 + 0.3 * Math.sin(t * 3 + k)} />
                          <circle cx={hx} cy={hy} r={6} fill="#f2f5ff" />
                        </g>
                      );
                    })}
                    {pos.map((p, i) => (
                      <circle key={i} cx={p[0]} cy={p[1]} r={12} fill="#ff5a6e" stroke="#ffb0bb" strokeWidth={1.2} />
                    ))}
                  </g>
                );
              })()}
            </g>
            <g clipPath="url(#ice-liq)">
              {LIQ.map((m, i) => (
                <WaterMolecule key={i} x={m.x + 16 * Math.sin(t * 1.3 + m.ph)} y={m.y + 14 * Math.cos(t * 1.1 + m.ph * 1.7)} s={0.62} rot={m.rot + t * m.sp} />
              ))}
            </g>
            <Label x={530} y={196} size={28} color={C.cyan} weight={600}>
              es: kisi heksagonal yang lapang
            </Label>
            <Label x={1390} y={196} size={28} color={C.water} weight={600}>
              air cair: molekul lebih rapat
            </Label>
            <Label x={530} y={848} size={22} color={C.muted}>
              - - - ikatan hidrogen
            </Label>
            <Label x={1390} y={848} size={22} color={C.muted}>
              luas sama, molekul lebih banyak
            </Label>
          </g>
        ) : null}

        {/* ===== P5: danau membeku ===== */}
        {p5 > 0.001 ? (
          <g opacity={p5}>
            <defs>
              <clipPath id="ice-lake">
                <path d={lake} />
              </clipPath>
              <linearGradient id="ice-lakeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7fd0ff" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#123a86" stopOpacity={0.95} />
              </linearGradient>
            </defs>
            {Array.from({length: 40}, (_, k) => {
              const ph = (((t * (0.06 + 0.05 * rand(k)) + rand(k * 2.1)) % 1) + 1) % 1;
              return <circle key={k} cx={100 + rand(k * 6.1) * 1720 + 14 * Math.sin(t * 0.8 + k)} cy={175 + ph * 220} r={1.5 + 2 * rand(k * 1.3)} fill="#fff" opacity={cyc(ph) * 0.7} />;
            })}
            <path d={lake} fill="url(#ice-lakeg)" />
            <g clipPath="url(#ice-lake)">
              {[0, 1, 2, 3].map((k) => {
                const sp = 0.035 + 0.015 * k;
                const ph = (((t * sp + rand(k * 3.7)) % 1) + 1) % 1;
                const x = 380 + ph * 1160;
                const y = 640 + k * 42 + 8 * Math.sin(t * 1.2 + k);
                const s = 0.32 + 0.06 * (k % 2);
                return (
                  <g key={k} opacity={cyc(ph)} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s})`}>
                    <path d={`M-112,0 L-170,${-40 + 8 * Math.sin(t * 5 + k)} L-160,0 L-170,${40 + 8 * Math.sin(t * 5 + k)} Z`} fill="#6f9ad8" />
                    <path d="M-122,0 C-100,-60 40,-76 112,-24 C130,-8 130,8 112,24 C40,76 -100,60 -122,0 Z" fill="#88b6f0" stroke="#d8ecff" strokeWidth={4} />
                    <circle cx={74} cy={-12} r={10} fill="#0b1126" />
                  </g>
                );
              })}
              <Bubbles x={400} y={460} w={1100} h={360} n={6} seed={9} speed={0.5} />
              <rect x={150} y={400} width={1620} height={iceH} fill="#e6f5ff" opacity={0.85} />
              {Array.from({length: 26}, (_, k) => {
                const x = 220 + k * 58;
                return <path key={k} d={`M${x},${400 + iceH} l10,${12 * ramp(iceH, 20, 60)} l10,${-12 * ramp(iceH, 20, 60)}`} fill="#e6f5ff" opacity={0.7} />;
              })}
              {Array.from({length: 14}, (_, k) => (
                <circle key={k} cx={260 + rand(k * 4.4) * 1400} cy={408 + rand(k * 2.2) * Math.max(0, iceH - 14)} r={2 + 2 * rand(k)} fill="none" stroke="#9fc8ef" strokeWidth={1.2} opacity={ramp(iceH, 20, 50)} />
              ))}
              <path d={`M520,400 L560,${400 + iceH * 0.6} L600,${400 + iceH * 0.4}`} fill="none" stroke="#9fc8ef" strokeWidth={2} opacity={ramp(iceH, 30, 60)} />
            </g>
            <path d="M80,392 L200,398 C300,600 500,830 960,840 C1420,830 1620,600 1720,398 L1840,392 L1840,880 L80,880 Z" fill="#1a1b30" stroke="#5c5f8a" strokeWidth={2.5} />
            <path d="M80,392 L200,398 M1720,398 L1840,392" stroke="#eef6ff" strokeWidth={8} strokeLinecap="round" opacity={0.85} />
            <Person x={mix(700, 1200, 0.5 + 0.5 * Math.sin(t * 0.45))} y={400 - 2} phase={t * 2.2} scale={0.42} color={C.ink} opacity={ramp(iceH, 40, 60)} />
            <Label x={960} y={340} size={26} color="#e6f5ff" opacity={ramp(iceH, 30, 60)}>
              lapisan es mengapung di atas
            </Label>
            <Label x={1440} y={490} size={24} color="#cfeaff" opacity={ramp(t, cue(5) + 2.4, cue(5) + 3.2)}>
              ≈ 0 °C
            </Label>
            <Label x={960} y={866} size={24} color={C.water} opacity={ramp(t, cue(5) + 3.0, cue(5) + 3.8)}>
              dasar ≈ 4 °C: air paling rapat
            </Label>
            <Motes x={960} y={640} rx={600} ry={150} n={20} color="cyan" opacity={0.4} seed={11} />
          </g>
        ) : null}
      </Stage>

      <Formula x={1420} y={290} p={p1 * ramp(t, wordOf(1, 'sembilan') - 0.2, wordOf(1, 'sembilan') + 0.7)} accent={C.spr} size={56}>
        <V>ρ</V>
        <Sub>es</Sub> ≈ 917 kg/m³ &lt; <V>ρ</V>
        <Sub>air</Sub>
      </Formula>
      <Formula x={1470} y={610} p={fOp} accent={C.water} size={56}>
        <V>f</V> = <Frac n={<span><V>ρ</V><Sub>es</Sub></span>} d={<span><V>ρ</V><Sub>laut</Sub></span>} /> = <Frac n="917" d="1025" /> ≈ <b style={{color: C.water}}>0,89</b>
      </Formula>
      <Note x={1440} y={250} p={p5 * ramp(t, wordOf(5, 'ikan') - 0.3, wordOf(5, 'ikan') + 0.5)} color={C.cyan} size={28}>
        es = selimut → ikan tetap hidup
      </Note>
    </AbsoluteFill>
  );
};
