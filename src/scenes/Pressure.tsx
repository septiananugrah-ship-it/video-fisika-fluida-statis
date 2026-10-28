import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, rand, win} from '../anim';
import {PressureArrow, Water, WaterMolecule} from '../components/fluid';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, TSup, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C} from '../theme';

// Tekanan: jempol menekan paku ke kayu (gaya F sama di kepala & ujung, luas berbeda),
// p = F/A, angka 2×10⁵ Pa vs 4×10⁷ Pa (200×) sebagai batang, lalu fluida: panah tekanan
// tegak lurus setiap permukaan benda tercelup (makin dalam makin panjang) dan zoom ke dinding:
// molekul memantul (lenting), setiap tabrakan = dorongan kecil.

const WOOD_Y = 640;
const NX = 740;
const NAIL_L = 262;

/** Paku + jempol. tipY = ujung paku. */
const NailThumb: React.FC<{tipY: number; t: number; xray: number}> = ({tipY, t, xray}) => {
  const headTop = tipY - NAIL_L;
  const nail = (
    <g>
      <rect x={NX - 7} y={headTop + 12} width={14} height={NAIL_L - 42} fill="#aeb8d2" stroke="#e6ecfa" strokeWidth={1.5} />
      <path d={`M${NX - 7},${tipY - 30} L${NX + 7},${tipY - 30} L${NX},${tipY} Z`} fill="#aeb8d2" stroke="#e6ecfa" strokeWidth={1.5} strokeLinejoin="round" />
      <rect x={NX - 46} y={headTop} width={92} height={13} rx={4} fill="#c3cce3" stroke="#e6ecfa" strokeWidth={1.5} />
      <rect x={NX - 4} y={headTop + 16} width={4} height={NAIL_L - 50} fill="#fff" opacity={0.35} />
    </g>
  );
  const tremble = 1.2 * Math.sin(t * 23) * Math.sin(t * 3.1);
  return (
    <g>
      <defs>
        <clipPath id="pr-above">
          <rect x={0} y={0} width={1920} height={WOOD_Y} />
        </clipPath>
        <clipPath id="pr-below">
          <rect x={0} y={WOOD_Y} width={1920} height={400} />
        </clipPath>
      </defs>
      <g clipPath="url(#pr-above)">{nail}</g>
      <g clipPath="url(#pr-below)" opacity={0.35 + 0.35 * xray}>
        {nail}
      </g>
      {/* jempol menekan kepala paku */}
      <g transform={`translate(${tremble} 0)`}>
        <defs>
          <linearGradient id="pr-skin" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="260">
            <stop offset="0%" stopColor="#c9967e" stopOpacity={0} />
            <stop offset="100%" stopColor="#c9967e" stopOpacity={1} />
          </linearGradient>
          <linearGradient id="pr-skinEdge" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="260">
            <stop offset="0%" stopColor="#7a4f3c" stopOpacity={0} />
            <stop offset="100%" stopColor="#7a4f3c" stopOpacity={1} />
          </linearGradient>
        </defs>
        <path
          d={`M${NX - 78},${Math.min(150, headTop - 200)} L${NX - 78},${headTop - 60} Q${NX - 78},${headTop} ${NX - 12},${headTop} L${NX + 12},${headTop} Q${NX + 78},${headTop} ${NX + 78},${headTop - 60} L${NX + 78},${Math.min(150, headTop - 200)}`}
          fill="url(#pr-skin)"
          stroke="url(#pr-skinEdge)"
          strokeWidth={3}
        />
        <path d={`M${NX + 30},${headTop - 150} Q${NX + 72},${headTop - 150} ${NX + 72},${headTop - 100} L${NX + 72},${headTop - 60} Q${NX + 50},${headTop - 40} ${NX + 30},${headTop - 70} Z`} fill="#efcfc2" opacity={0.85} />
        <path d={`M${NX - 60},${headTop - 210} q30,10 60,0`} fill="none" stroke="#7a4f3c" strokeWidth={2.5} opacity={0.6} />
        <path d={`M${NX - 60},${headTop - 240} q30,10 60,0`} fill="none" stroke="#7a4f3c" strokeWidth={2.5} opacity={0.5} />
        <rect x={NX - 70} y={Math.max(200, headTop - 260)} width={12} height={Math.max(0, headTop - 80 - Math.max(200, headTop - 260))} rx={6} fill="#fff" opacity={0.12} />
      </g>
    </g>
  );
};

const Wood: React.FC = () => (
  <g>
    <rect x={380} y={WOOD_Y} width={720} height={200} rx={8} fill="#6b4a2e" stroke="#c49a6c" strokeWidth={3} />
    {Array.from({length: 7}, (_, k) => (
      <path key={k} d={`M390,${WOOD_Y + 24 + k * 26} C560,${WOOD_Y + 14 + k * 26} 720,${WOOD_Y + 38 + k * 26} 1090,${WOOD_Y + 22 + k * 26}`} fill="none" stroke="#3e2a18" strokeOpacity={0.5} strokeWidth={2} />
    ))}
    <ellipse cx={960} cy={WOOD_Y + 120} rx={36} ry={14} fill="none" stroke="#3e2a18" strokeOpacity={0.6} strokeWidth={2} />
    <rect x={384} y={WOOD_Y + 4} width={712} height={8} fill="#fff" opacity={0.08} />
  </g>
);

// ---- molekul memantul di kotak zoom ----
const BOX = {x0: 1080, x1: 1800, y0: 260, y1: 770};
const NM = 26;
const MOL = Array.from({length: NM}, (_, i) => ({
  x0: rand(i * 3.1) * 2000,
  y0: rand(i * 5.7) * 2000,
  vx: (180 + 160 * rand(i * 7.3)) * (rand(i * 1.9) > 0.5 ? 1 : -1),
  vy: (150 + 150 * rand(i * 2.3)) * (rand(i * 4.4) > 0.5 ? 1 : -1),
  rot: rand(i * 6.6) * 360,
  w: (rand(i * 8.8) - 0.5) * 160,
}));
/** Gerak bolak-balik lenting di [a, a+L]: posisi + jarak-waktu ke tumbukan terdekat. */
const bounce = (u0: number, v: number, t: number, a: number, L: number) => {
  const u = u0 + v * t;
  const m = ((u % (2 * L)) + 2 * L) % (2 * L);
  const p = m < L ? m : 2 * L - m;
  const dLow = p;
  const dHigh = L - p;
  return {pos: a + p, tLow: dLow / Math.abs(v), tHigh: dHigh / Math.abs(v)};
};

// ---- benda tercelup tak beraturan (batu) ----
const ROCK: [number, number][] = [
  [-120, -40],
  [-60, -96],
  [40, -88],
  [118, -30],
  [100, 62],
  [10, 96],
  [-96, 70],
];

export const Pressure: React.FC = () => {
  const {t, cue, wordOf} = useScene();

  const act1 = 1 - ramp(t, cue(5) - 0.9, cue(5) - 0.3, EASE_IN_OUT);
  const act3 = ramp(t, cue(5) - 0.55, cue(5) + 0.3);
  const insets = win(t, cue(1) - 0.2, cue(2) - 0.2, 0.7, 0.6);
  const shrink = ramp(t, cue(2) - 0.4, cue(2) + 0.8, EASE_IN_OUT);

  // penetrasi paku
  const push = ramp(t, cue(0) + 1.6, wordOf(0, 'menancap') + 0.6, EASE_IN_OUT);
  const dep = 80 * push;
  const tipY = WOOD_Y + dep;
  const headTop = tipY - NAIL_L;
  const pushing = win(t, cue(0) + 1.6, wordOf(0, 'menancap') + 0.6, 0.3, 0.4);
  const fArrows = win(t, wordOf(1, 'sama') - 0.2, cue(5) - 0.6, 0.6, 0.5);
  const sNail = mix(1, 0.72, shrink);
  const dxNail = mix(0, -240, shrink);
  const nailTf = `translate(${380 + dxNail} 840) scale(${sNail}) translate(-380 -840)`;
  const hiHead = win(t, cue(3) - 0.1, cue(4) - 0.2, 0.5, 0.5);
  const hiTip = win(t, cue(4) - 0.1, cue(5) - 0.6, 0.5, 0.5);

  // p = F/A dan batang
  const formP = ramp(t, wordOf(2, 'gaya') - 0.3, wordOf(2, 'gaya') + 0.7) * act1;
  const BX = 800;
  const BW = 960;
  const PMAX = 4e7;
  const bHead = ramp(t, wordOf(3, 'ratus') - 0.2, wordOf(3, 'ratus') + 1.0, EASE_IN_OUT);
  const bTip = ramp(t, wordOf(4, 'empat') - 0.2, wordOf(4, 'empat') + 2.2, EASE_IN_OUT);
  const x200 = ramp(t, wordOf(4, 'kali') - 0.4, wordOf(4, 'kali') + 0.4);
  const rowHead = ramp(t, cue(3) - 0.1, cue(3) + 0.6);
  const rowTip = ramp(t, cue(4) - 0.1, cue(4) + 0.6);

  // fluida
  const rockA = 14 * Math.sin(t * 0.35);
  const RC = {x: 520, y: 560 + 6 * Math.sin(t * 0.8)};
  const Lp = (y: number) => 14 + 0.1 * (y - 250);
  const arrIn = ramp(t, cue(5) + 0.8, cue(5) + 3.0);
  const zoomIn = ramp(t, cue(6) - 0.4, cue(6) + 0.8, EASE_IN_OUT);
  const sumNote = ramp(t, wordOf(6, 'jumlah') - 0.2, wordOf(6, 'jumlah') + 0.6);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= Paku & jempol ================= */}
        {act1 > 0.001 ? (
          <g opacity={act1}>
            <g transform={nailTf}>
              <Glow x={NX} y={WOOD_Y} r={260} color="force" opacity={0.18 + 0.2 * pushing} />
              <ellipse cx={740} cy={850} rx={400} ry={16} fill="#000" opacity={0.3} />
              <Wood />
              {/* retak serat kayu di titik masuk */}
              {[-1, 1].map((s) => (
                <path key={s} d={`M${NX},${WOOD_Y + 2} l${s * 26 * push},${10 * push} l${s * 14 * push},${-4 * push}`} fill="none" stroke="#2a1a0c" strokeWidth={2.5} opacity={push} />
              ))}
              <NailThumb tipY={tipY} t={t} xray={fArrows} />
              {/* serpihan kayu saat menancap */}
              {Array.from({length: 8}, (_, k) => {
                const s = t - (cue(0) + 2.0 + k * 0.35);
                if (s < 0 || s > 0.9) return null;
                const dir = k % 2 ? 1 : -1;
                const vx = dir * (90 + 60 * rand(k));
                const vy = -(160 + 80 * rand(k + 3));
                return <rect key={k} x={NX + vx * s} y={WOOD_Y + vy * s + 0.5 * 700 * s * s} width={6} height={3} fill="#c49a6c" opacity={(1 - s / 0.9) * pushing} />;
              })}
              {/* gaya F yang sama besar di kepala & ujung */}
              <g opacity={fArrows}>
                <Arrow x1={NX} y1={headTop - 170} x2={NX} y2={headTop - 18} color="force" width={7} />
                <Label x={NX - 40} y={headTop - 110} size={44} font="serif" italic color={C.force} weight={600} anchor="end">
                  F
                </Label>
                <Arrow x1={NX} y1={tipY + 8} x2={NX} y2={tipY + 160} color="force" width={7} />
                <Label x={NX + 34} y={tipY + 90} size={44} font="serif" italic color={C.force} weight={600} anchor="start">
                  F
                </Label>
              </g>
              {/* sorotan luas */}
              <rect x={NX - 50} y={headTop - 4} width={100} height={20} rx={6} fill={C.press} opacity={0.55 * hiHead * (0.7 + 0.3 * Math.sin(t * 4))} />
              <Glow x={NX} y={headTop + 6} r={90} color="press" opacity={0.7 * hiHead} />
              <circle cx={NX} cy={tipY} r={9} fill={C.press} opacity={hiTip} />
              <Glow x={NX} y={tipY} r={70 + 8 * Math.sin(t * 5)} color="press" opacity={hiTip} />
            </g>

            {/* sisipan: gaya tersebar vs terpusat */}
            {insets > 0.001 ? (
              <g opacity={insets}>
                {[0, 1].map((k) => {
                  const cx = 1460;
                  const cy = k ? 680 : 320;
                  return (
                    <g key={k}>
                      <circle cx={cx} cy={cy} r={135} fill="#0a1230" stroke={C.press} strokeOpacity={0.6} strokeWidth={3} />
                      {k === 0 ? (
                        <g>
                          <rect x={cx - 105} y={cy + 10} width={210} height={26} rx={6} fill="#c3cce3" stroke="#e6ecfa" strokeWidth={1.5} />
                          <rect x={cx - 105} y={cy + 4} width={210} height={8} rx={3} fill={C.press} opacity={0.6} />
                          {Array.from({length: 9}, (_, j) => (
                            <PressureArrow key={j} x={cx - 96 + j * 24} y={cy + 4} nx={0} ny={-1} L={34} width={3} color={C.force} />
                          ))}
                        </g>
                      ) : (
                        <g>
                          <path d={`M${cx - 22},${cy - 100} L${cx + 22},${cy - 100} L${cx + 22},${cy - 20} L${cx},${cy + 30} L${cx - 22},${cy - 20} Z`} fill="#aeb8d2" stroke="#e6ecfa" strokeWidth={1.5} />
                          <circle cx={cx} cy={cy + 30} r={7} fill={C.press} />
                          <Glow x={cx} y={cy + 30} r={60 + 6 * Math.sin(t * 6)} color="press" />
                          {Array.from({length: 7}, (_, j) => {
                            const a = Math.PI / 2 + (j - 3) * 0.32;
                            return <line key={j} x1={cx + Math.cos(a) * 20} y1={cy + 30 + Math.sin(a) * 20} x2={cx + Math.cos(a) * (60 + 10 * Math.sin(t * 6 + j))} y2={cy + 30 + Math.sin(a) * (60 + 10 * Math.sin(t * 6 + j))} stroke={C.press} strokeWidth={3} strokeLinecap="round" opacity={0.7} />;
                          })}
                        </g>
                      )}
                      <Label x={cx} y={cy - 160} size={28} color={C.ink} weight={600}>
                        {k ? 'ujung: luas kecil' : 'kepala: luas besar'}
                      </Label>
                      <Label x={cx} y={cy + 92} size={24} color={k ? C.press : C.muted}>
                        {k ? 'gaya terpusat' : 'gaya tersebar'}
                      </Label>
                    </g>
                  );
                })}
              </g>
            ) : null}

            {/* batang tekanan */}
            {[
              {k: 0, y: 560, row: rowHead, p: bHead, val: 2e5, txt1: '20 N ÷ 1 cm²', txt2: ['2 × 10', '5'], name: 'kepala paku'},
              {k: 1, y: 750, row: rowTip, p: bTip, val: 4e7, txt1: '20 N ÷ 0,5 mm²', txt2: ['4 × 10', '7'], name: 'ujung paku'},
            ].map((r) => {
              const w = Math.max(3, (r.val / PMAX) * BW * r.p);
              const shine = (((t * 0.35 + r.k * 0.4) % 1) + 1) % 1;
              return r.row > 0.001 ? (
                <g key={r.k} opacity={r.row}>
                  <Label x={BX} y={r.y - 62} size={28} color={C.ink} anchor="start" weight={600}>
                    {r.name}
                  </Label>
                  <Label x={BX + 230} y={r.y - 62} size={26} color={C.muted} anchor="start" font="mono">
                    {r.txt1}
                  </Label>
                  <rect x={BX} y={r.y - 22} width={BW} height={44} rx={10} fill="none" stroke={C.line} strokeWidth={2} />
                  <rect x={BX} y={r.y - 22} width={w} height={44} rx={10} fill={C.press} opacity={0.85} />
                  {w > 60 ? <rect x={BX + w * shine - 20} y={r.y - 22} width={40} height={44} fill="#fff" opacity={0.2 * Math.sin(Math.PI * shine)} /> : null}
                  <Label x={r.k ? BX + BW - 10 : BX + 30} y={r.y + 50} size={32} color={C.press} anchor={r.k ? 'end' : 'start'} font="mono" weight={600} opacity={ramp(r.p, 0.5, 1)}>
                    {`= ${r.txt2[0]}`}
                    <TSup>{r.txt2[1]}</TSup>
                    {' Pa'}
                  </Label>
                  <Ripple x={BX + w} y={r.y} p={(r.p - 0.9) * 6} r={70} color="press" rings={2} />
                </g>
              ) : null;
            })}
            <g opacity={x200 * act1}>
              <Label x={BX + BW / 2} y={865} size={40} color={C.gold} weight={700}>
                200 × lebih besar
              </Label>
              <Twinkles x={BX + BW / 2} y={865} rx={200} ry={24} n={5} color="gold" seed={3} />
            </g>
          </g>
        ) : null}

        {/* ================= Fluida: ke segala arah, tegak lurus ================= */}
        {act3 > 0.001 ? (
          <g opacity={act3}>
            <Water x={130} y={250} w={780} h={600} bubbles={6} seed={7} />
            <path d="M124,240 L124,856 L916,856 L916,240" fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} strokeLinejoin="round" />
            {/* tekanan pada dinding & dasar */}
            {[340, 460, 580, 700, 800].map((y, k) => (
              <g key={y} opacity={ramp(arrIn, 0.5 + k * 0.08, 0.8 + k * 0.08)}>
                <PressureArrow x={132} y={y} nx={1} ny={0} L={Lp(y)} width={3.5} />
                <PressureArrow x={908} y={y} nx={-1} ny={0} L={Lp(y)} width={3.5} />
              </g>
            ))}
            {[220, 380, 660, 820].map((x) => (
              <PressureArrow key={x} x={x} y={848} nx={0} ny={-1} L={Lp(848)} width={3.5} opacity={ramp(arrIn, 0.7, 1)} />
            ))}
            {/* batu tercelup: panah tegak lurus setiap sisi, panjang ∝ kedalaman */}
            {(() => {
              const a = (rockA * Math.PI) / 180;
              const P = ROCK.map(([x, y]) => [RC.x + x * Math.cos(a) - y * Math.sin(a), RC.y + x * Math.sin(a) + y * Math.cos(a)] as [number, number]);
              const d = P.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
              const arrows: React.ReactNode[] = [];
              let n = 0;
              P.forEach((p, i) => {
                const q = P[(i + 1) % P.length];
                const len = Math.hypot(q[0] - p[0], q[1] - p[1]);
                // normal ke luar (poligon searah jarum jam di layar)
                const nx = (q[1] - p[1]) / len;
                const ny = -(q[0] - p[0]) / len;
                const m = Math.max(1, Math.round(len / 62));
                for (let j = 0; j < m; j++) {
                  const u = (j + 0.5) / m;
                  const x = mix(p[0], q[0], u);
                  const y = mix(p[1], q[1], u);
                  const o = ramp(arrIn, (n % 12) * 0.05, (n % 12) * 0.05 + 0.4);
                  arrows.push(<PressureArrow key={`${i}-${j}`} x={x + nx * 2} y={y + ny * 2} nx={nx} ny={ny} L={Lp(y) * 1.15 * o} width={4} opacity={o} />);
                  n++;
                }
              });
              return (
                <g>
                  <Glow x={RC.x} y={RC.y} r={260} color="press" opacity={0.25 * arrIn} />
                  <path d={d} fill="#5a5f78" stroke="#c4cce4" strokeWidth={3} strokeLinejoin="round" transform={`translate(8 10)`} opacity={0.3} />
                  <path d={d} fill="#5a5f78" stroke="#c4cce4" strokeWidth={3} strokeLinejoin="round" />
                  <circle cx={RC.x - 30} cy={RC.y - 30} r={18} fill="#fff" opacity={0.12} />
                  {arrows}
                </g>
              );
            })()}
            <Label x={520} y={294} size={30} color={C.press} weight={600} opacity={ramp(t, wordOf(5, 'segala') - 0.2, wordOf(5, 'segala') + 0.6)}>
              ke segala arah
            </Label>
            <Label x={520} y={340} size={26} color={C.press} opacity={ramp(t, wordOf(5, 'tegak') - 0.2, wordOf(5, 'tegak') + 0.6)}>
              selalu tegak lurus permukaan
            </Label>

            {/* zoom ke dinding: molekul memantul */}
            {zoomIn > 0.001 ? (
              <g opacity={zoomIn}>
                <rect x={884} y={560} width={30} height={90} fill="none" stroke={C.gold} strokeWidth={2.5} />
                <line x1={914} y1={560} x2={BOX.x0} y2={BOX.y0} stroke={C.gold} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="5 6" />
                <line x1={914} y1={650} x2={BOX.x0} y2={BOX.y1} stroke={C.gold} strokeOpacity={0.5} strokeWidth={2} strokeDasharray="5 6" />
                <rect x={BOX.x0} y={BOX.y0} width={BOX.x1 - BOX.x0} height={BOX.y1 - BOX.y0} rx={14} fill="#0a1636" stroke={C.gold} strokeOpacity={0.6} strokeWidth={2.5} />
                {/* dinding kanan = dinding wadah */}
                <rect x={BOX.x1 - 26} y={BOX.y0 + 2} width={24} height={BOX.y1 - BOX.y0 - 4} fill="#3b4a72" stroke="#bfe3ff" strokeWidth={2} />
                {MOL.map((m, i) => {
                  const r = 16;
                  const bx = bounce(m.x0, m.vx, t, BOX.x0 + r + 4, BOX.x1 - 26 - BOX.x0 - 2 * r - 6);
                  const by = bounce(m.y0, m.vy, t, BOX.y0 + r + 4, BOX.y1 - BOX.y0 - 2 * r - 8);
                  const fl = Math.exp(-((bx.tHigh / 0.1) ** 2));
                  return (
                    <g key={i}>
                      <WaterMolecule x={bx.pos} y={by.pos} s={0.62} rot={m.rot + m.w * t} />
                      {fl > 0.04 ? (
                        <g opacity={fl}>
                          <circle cx={BOX.x1 - 26} cy={by.pos} r={10 + 14 * fl} fill="url(#soft-press)" />
                          <PressureArrow x={BOX.x1 - 26} y={by.pos} nx={-1} ny={0} L={30} width={3} />
                        </g>
                      ) : null}
                    </g>
                  );
                })}
                <Label x={(BOX.x0 + BOX.x1) / 2} y={BOX.y0 - 30} size={26} color={C.muted}>
                  dilihat sangat dekat: molekul air
                </Label>
              </g>
            ) : null}
            <Motes x={520} y={560} rx={360} ry={280} n={16} color="water" opacity={0.35} seed={3} />
          </g>
        ) : null}
      </Stage>
      <Formula x={1290} y={300} p={formP} accent={C.press} size={66} caption="satuan: pascal (Pa) = N/m²">
        <V color="press">p</V> = <Frac n={<V color="force">F</V>} d={<V>A</V>} />
      </Formula>
      <Note x={1440} y={838} p={sumNote * act3} color={C.press} size={27}>
        <Tint c="press">tekanan</Tint> = jumlah dorongan per satuan luas
      </Note>
    </AbsoluteFill>
  );
};
