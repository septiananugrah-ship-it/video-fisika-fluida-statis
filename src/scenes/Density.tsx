import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Bubbles, wavePath} from '../components/fluid';
import {fmt} from '../components/physics';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Stream, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Massa jenis: neraca 1 kg besi vs 1 kg kapas (seimbang setelah berayun teredam),
// kepadatan partikel (besi rapat, kapas renggang), ρ = m/V, 1 L air = 1 kg di timbangan,
// skala massa jenis (minyak ≈ 920, air 1000, besi ≈ 7874, raksa ≈ 13 534 kg/m³),
// lalu kolom cairan yang menyusun diri (madu tenggelam menembus air & minyak).

const PIV = {x: 960, y: 250};
const ARM = 360;
const HANG = 250;

const IronCube: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 64}) => (
  <g>
    <path d={`M${x - s / 2},${y - s} l${s * 0.28},${-s * 0.22} h${s} l${-s * 0.28},${s * 0.22} Z`} fill="#8b95b3" stroke="#d3dbef" strokeWidth={1.5} />
    <path d={`M${x + s / 2},${y - s} l${s * 0.28},${-s * 0.22} v${s} l${-s * 0.28},${s * 0.22} Z`} fill="#4c5675" stroke="#d3dbef" strokeWidth={1.5} />
    <rect x={x - s / 2} y={y - s} width={s} height={s} fill="#6b7695" stroke="#d3dbef" strokeWidth={1.5} />
    <rect x={x - s / 2 + 6} y={y - s + 6} width={s * 0.3} height={5} fill="#fff" opacity={0.35} />
  </g>
);

/** Gumpalan kapas: lingkaran-lingkaran putih bergoyang halus. (x, y) = dasar tengah. */
const Cotton: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => (
  <g>
    {Array.from({length: 13}, (_, i) => {
      const a = (i / 13) * Math.PI * 2;
      const r = 46 + 14 * rand(i * 3.3);
      const cx = x + Math.cos(a) * 82 * (0.7 + 0.3 * rand(i));
      const cy = y - 100 + Math.sin(a) * 62 * (0.7 + 0.3 * rand(i + 2));
      return <circle key={i} cx={cx + 2 * Math.sin(t * 1.2 + i)} cy={cy + 2 * Math.cos(t * 1.1 + i)} r={r} fill="#eef2fb" stroke="#c4cde6" strokeWidth={1.5} />;
    })}
    <circle cx={x} cy={y - 100} r={70} fill="#f7f9ff" />
    {Array.from({length: 6}, (_, i) => (
      <path key={i} d={`M${x - 60 + i * 22},${y - 60 - 30 * rand(i)} q12,-14 24,0`} fill="none" stroke="#c4cde6" strokeWidth={1.5} />
    ))}
  </g>
);

const LIQ = [
  {key: 'honey', label: 'madu', color: '#e0a030', h: 120},
  {key: 'water', label: 'air', color: C.water, h: 170},
  {key: 'oil', label: 'minyak', color: '#f2d45c', h: 140},
];
const GL = {x0: 790, x1: 1110, bot: 842, top: 300};

export const Density: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  const act1 = 1 - ramp(t, cue(2) - 0.5, cue(2) + 0.1, EASE_IN_OUT);
  const act2 = win(t, cue(2) - 0.3, cue(4) - 0.5, 0.7, 0.6);
  const act3 = win(t, cue(4) - 0.3, cue(5) - 0.5, 0.7, 0.6);
  const act4 = ramp(t, cue(5) - 0.3, cue(5) + 0.5);

  // ---- neraca: besi diletakkan → miring; kapas diletakkan → berayun teredam → seimbang ----
  const tI = cue(0) + 2.2;
  const tC = wordOf(0, 'kapas') - 0.2;
  const th = t < tC ? -8 * ramp(t, tI, tI + 0.7, EASE_IN_OUT) : -8 * Math.exp(-(t - tC) / 1.3) * Math.cos(2.6 * (t - tC));
  const rad = (th * Math.PI) / 180;
  const endL = {x: PIV.x - ARM * Math.cos(rad), y: PIV.y - ARM * Math.sin(rad)};
  const endR = {x: PIV.x + ARM * Math.cos(rad), y: PIV.y + ARM * Math.sin(rad)};
  const ironIn = ramp(t, tI - 0.6, tI);
  const cotIn = ramp(t, tC - 0.6, tC);
  const dense = ramp(t, cue(1) + 1.0, cue(1) + 2.2);
  const balanced = ramp(t, wordOf(1, 'sama') - 0.2, wordOf(1, 'sama') + 0.6);

  // ---- 1 L air di timbangan ----
  const fill = ramp(t, cue(3) + 0.4, wordOf(3, 'liter') + 0.6, EASE_IN_OUT);
  const kg = fill * 1.0;
  const formP = ramp(t, wordOf(2, 'massa') - 0.2, wordOf(2, 'massa') + 0.8);
  const rhoWater = ramp(t, cue(3) + 0.2, cue(3) + 1.0);

  // ---- skala massa jenis ----
  const BX = 600;
  const SCL = 1080 / 14000;
  const rows = [
    {name: 'minyak goreng', v: 920, txt: '≈ 920', color: '#f2d45c', at: wordOf(4, 'minyak')},
    {name: 'air', v: 1000, txt: '1000', color: C.water, at: cue(4) - 0.1},
    {name: 'besi', v: 7874, txt: '≈ 7874', color: '#8b95b3', at: wordOf(4, 'besi')},
    {name: 'raksa', v: 13534, txt: '≈ 13 534', color: '#d7deef', at: wordOf(4, 'raksa')},
  ];

  // ---- kolom cairan: air → minyak → madu (madu menembus ke dasar) ----
  const t5 = cue(5) + 0.3;
  const pours = [
    {liq: 1, a: t5, b: t5 + 1.9},
    {liq: 2, a: t5 + 2.2, b: t5 + 4.0},
    {liq: 0, a: t5 + 4.3, b: t5 + 6.6},
  ];
  const hOf = (liq: number, tt: number) => {
    const pr = pours.find((p) => p.liq === liq)!;
    return LIQ[liq].h * ramp(tt, pr.a + 0.35, pr.b + 0.5, (x) => x);
  };
  const hh = hOf(0, t);
  const hw = hOf(1, t);
  const ho = hOf(2, t);
  const yHoney = GL.bot - hh;
  const yWater = yHoney - hw;
  const yOil = yWater - ho;
  const SPOUT = {x: 950, y: 230};
  const keyIn = ramp(t, cue(6) + 0.2, cue(6) + 1.0);

  return (
    <AbsoluteFill>
      <Stage>
        {/* ================= Babak 1: neraca ================= */}
        {act1 > 0.001 ? (
          <g opacity={act1}>
            <Glow x={PIV.x} y={PIV.y + 200} r={520} color="spr" opacity={0.25} />
            {/* tiang */}
            <rect x={PIV.x - 12} y={PIV.y} width={24} height={600} fill="#2b3760" stroke="#7d8fbf" strokeWidth={2} />
            <path d={`M${PIV.x - 120},${PIV.y + 620} L${PIV.x + 120},${PIV.y + 620} L${PIV.x + 80},${PIV.y + 590} L${PIV.x - 80},${PIV.y + 590} Z`} fill="#2b3760" stroke="#7d8fbf" strokeWidth={2} />
            {/* jarum penunjuk */}
            <g transform={`rotate(${th} ${PIV.x} ${PIV.y})`}>
              <line x1={PIV.x} y1={PIV.y} x2={PIV.x} y2={PIV.y + 90} stroke={C.gold} strokeWidth={4} />
            </g>
            <path d={`M${PIV.x - 40},${PIV.y + 100} A110,110 0 0 0 ${PIV.x + 40},${PIV.y + 100}`} fill="none" stroke={C.muted} strokeWidth={2} />
            <line x1={PIV.x} y1={PIV.y + 96} x2={PIV.x} y2={PIV.y + 112} stroke={C.buoy} strokeWidth={3} opacity={0.4 + 0.6 * balanced} />
            {/* lengan */}
            <line x1={endL.x} y1={endL.y} x2={endR.x} y2={endR.y} stroke="#c4d2f2" strokeWidth={9} strokeLinecap="round" />
            <circle cx={PIV.x} cy={PIV.y} r={14} fill={C.gold} />
            {[endL, endR].map((e, k) => (
              <g key={k}>
                <line x1={e.x} y1={e.y} x2={e.x - 90} y2={e.y + HANG} stroke={C.muted} strokeWidth={2} />
                <line x1={e.x} y1={e.y} x2={e.x + 90} y2={e.y + HANG} stroke={C.muted} strokeWidth={2} />
                <path d={`M${e.x - 110},${e.y + HANG} Q${e.x},${e.y + HANG + 40} ${e.x + 110},${e.y + HANG} Z`} fill="#3b4a72" stroke="#c4d2f2" strokeWidth={2.5} />
                <circle cx={e.x} cy={e.y} r={6} fill="#c4d2f2" />
              </g>
            ))}
            <g opacity={ironIn} transform={`translate(0 ${(1 - ironIn) * -40})`}>
              <IronCube x={endL.x} y={endL.y + HANG + 2} />
              <Label x={endL.x - 120} y={endL.y + HANG - 40} size={30} weight={600} color={C.ink} anchor="end">
                1 kg besi
              </Label>
            </g>
            <g opacity={cotIn} transform={`translate(0 ${(1 - cotIn) * -40})`}>
              <Cotton x={endR.x} y={endR.y + HANG + 6} t={t} />
              <Label x={endR.x + 150} y={endR.y + HANG - 60} size={30} weight={600} color={C.ink} anchor="start">
                1 kg kapas
              </Label>
            </g>
            <Ripple x={PIV.x} y={PIV.y} p={(t - wordOf(1, 'sama')) / 1.4} r={140} color="buoy" />
            <Label x={PIV.x} y={PIV.y - 50} size={32} color={C.buoy} weight={600} opacity={balanced}>
              sama berat
            </Label>
            {/* kepadatan: zoom partikel */}
            {[0, 1].map((k) => {
              const cx = k ? 1500 : 420;
              const cy = 700;
              return (
                <g key={k} opacity={dense}>
                  <circle cx={cx} cy={cy} r={110} fill="#0a1230" stroke={C.spr} strokeOpacity={0.7} strokeWidth={3} />
                  {k === 0
                    ? Array.from({length: 49}, (_, i) => {
                        const gx = (i % 7) - 3;
                        const gy = Math.floor(i / 7) - 3;
                        const px = cx + gx * 26 + (gy % 2 ? 13 : 0) + 2 * Math.sin(t * 9 + i);
                        const py = cy + gy * 23 + 2 * Math.cos(t * 8 + i * 1.7);
                        if (Math.hypot(px - cx, py - cy) > 98) return null;
                        return <circle key={i} cx={px} cy={py} r={11} fill="#8b95b3" stroke="#d3dbef" strokeWidth={1} />;
                      })
                    : Array.from({length: 7}, (_, i) => {
                        const a0 = rand(i * 4.1) * Math.PI * 2 + 0.2 * Math.sin(t * 0.6 + i);
                        const r0 = 30 + 50 * rand(i * 2.7);
                        const px = cx + Math.cos(a0) * r0;
                        const py = cy + Math.sin(a0) * r0;
                        return <path key={i} d={`M${px - 30},${py} q15,${-18 + 8 * Math.sin(t + i)} 30,0 t30,0`} fill="none" stroke="#eef2fb" strokeWidth={4} strokeLinecap="round" />;
                      })}
                  <Label x={cx + (k ? -150 : 150)} y={cy - 40} size={28} color={C.spr} weight={600} anchor={k ? 'end' : 'start'}>
                    {k ? 'renggang' : 'rapat'}
                  </Label>
                  <Label x={cx + (k ? -150 : 150)} y={cy + 4} size={26} color={C.muted} anchor={k ? 'end' : 'start'}>
                    {k ? 'volume besar' : 'volume kecil'}
                  </Label>
                  <line x1={cx + (k ? -60 : 60)} y1={cy - 100} x2={k ? endR.x : endL.x} y2={(k ? endR.y : endL.y) + HANG + 20} stroke={C.spr} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="4 6" />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* ================= Babak 2: ρ = m/V dan 1 L air ================= */}
        {act2 > 0.001 ? (
          <g opacity={act2}>
            <Glow x={560} y={360} r={360} color="spr" opacity={0.4 * formP} />
            {/* contoh mini: massa sama, volume beda */}
            <g opacity={ramp(t, cue(2) + 1.6, cue(2) + 2.4)}>
              <IronCube x={360} y={760} s={56} />
              <Label x={385} y={800} size={24} color={C.muted}>
                V kecil → ρ besar
              </Label>
              <g transform="translate(700 772) scale(0.55) translate(-700 -772)">
                <Cotton x={700} y={772} t={t} />
              </g>
              <Label x={700} y={800} size={24} color={C.muted}>
                V besar → ρ kecil
              </Label>
            </g>
            {/* timbangan digital + kubus 1 L */}
            <g>
              <ellipse cx={1360} cy={830} rx={230} ry={18} fill="#000" opacity={0.3} />
              <rect x={1150} y={760} width={420} height={64} rx={14} fill="#26315a" stroke="#7d8fbf" strokeWidth={2.5} />
              <rect x={1170} y={746} width={380} height={16} rx={6} fill="#3b4a72" stroke="#7d8fbf" strokeWidth={2} />
              <rect x={1280} y={774} width={160} height={38} rx={6} fill="#071018" stroke={C.buoy} strokeOpacity={0.5} strokeWidth={1.5} />
              <text x={1430} y={794} textAnchor="end" dominantBaseline="central" fontFamily={FONT.mono} fontSize={26} fill={C.buoy}>
                {`${kg.toFixed(2).replace('.', ',')} kg`}
              </text>
              {/* kubus kaca 10 cm (perspektif) dengan air naik */}
              {(() => {
                const s = 240;
                const x0 = 1240;
                const yb = 744;
                const dx = 60;
                const dy = -40;
                const lvl = yb - s * fill;
                return (
                  <g>
                    <path d={`M${x0},${lvl} L${x0 + s},${lvl} L${x0 + s},${yb} L${x0},${yb} Z`} fill={C.water} opacity={0.5} />
                    <path d={`M${x0 + s},${lvl} l${dx},${dy} L${x0 + s + dx},${yb + dy} L${x0 + s},${yb} Z`} fill={C.deep} opacity={0.7 * Math.min(1, fill * 4)} />
                    <path d={`M${x0},${lvl} l${dx},${dy} h${s} l${-dx},${-dy} Z`} fill="#8fd0ff" opacity={0.45 * Math.min(1, fill * 4)} />
                    <path d={`M${x0},${yb - s} h${s} v${s} h${-s} Z M${x0},${yb - s} l${dx},${dy} h${s} l${-dx},${-dy} M${x0 + s + dx},${yb - s + dy} v${s}`} fill="none" stroke="#cfe6ff" strokeOpacity={0.8} strokeWidth={3} strokeLinejoin="round" />
                    <Bubbles x={x0 + 10} y={lvl + 10} w={s - 20} h={Math.max(0, yb - lvl - 20)} n={5} seed={4} />
                    <Label x={x0 + s / 2} y={yb - s - 70} size={28} color={C.ink} weight={600}>
                      1 liter = 1000 cm³
                    </Label>
                    <Label x={x0 - 40} y={yb - s / 2} size={24} color={C.muted} anchor="end">
                      10 cm
                    </Label>
                  </g>
                );
              })()}
              {/* aliran tuangan */}
              <Stream
                pts={[
                  [1360, 300],
                  [1360, 744 - 240 * fill],
                ]}
                color="water"
                n={8}
                speed={1.4}
                r={5}
                jitter={1.5}
                opacity={win(t, cue(3) + 0.3, wordOf(3, 'liter') + 0.4, 0.3, 0.4)}
              />
              <Twinkles x={1360} y={794} rx={110} ry={20} n={4} color="buoy" opacity={ramp(t, wordOf(3, 'kilogram', 1) - 0.2, wordOf(3, 'kilogram', 1) + 0.6)} seed={3} />
            </g>
          </g>
        ) : null}

        {/* ================= Babak 3: skala massa jenis ================= */}
        {act3 > 0.001 ? (
          <g opacity={act3}>
            <Label x={BX} y={226} size={24} color={C.muted} anchor="start" font="mono">
              massa jenis (kg/m³)
            </Label>
            {[0, 2000, 4000, 6000, 8000, 10000, 12000, 14000].map((v) => (
              <g key={v}>
                <line x1={BX + v * SCL} y1={260} x2={BX + v * SCL} y2={800} stroke={C.line} strokeWidth={1.5} />
                <Label x={BX + v * SCL} y={826} size={20} color={C.muted} font="mono">
                  {fmt(v)}
                </Label>
              </g>
            ))}
            {rows.map((r, k) => {
              const y = 320 + k * 130;
              const p = ramp(t, r.at - 0.1, r.at + 1.3, EASE_IN_OUT);
              const w = r.v * SCL * p;
              const shine = (((t * 0.4 + k * 0.3) % 1) + 1) % 1;
              return (
                <g key={r.name} opacity={ramp(t, r.at - 0.3, r.at + 0.2)}>
                  <Label x={BX - 30} y={y} size={30} color={C.ink} anchor="end" weight={600}>
                    {r.name}
                  </Label>
                  <rect x={BX} y={y - 26} width={Math.max(2, w)} height={52} rx={10} fill={r.color} opacity={0.85} />
                  <rect x={BX + 6} y={y - 20} width={Math.max(0, w - 12)} height={8} rx={4} fill="#fff" opacity={0.25} />
                  {w > 40 ? <rect x={BX + w * shine - 20} y={y - 26} width={40} height={52} fill="#fff" opacity={0.18 * cyc(shine)} /> : null}
                  {k === 3 ? <ellipse cx={BX + w} cy={y} rx={10 + 3 * Math.sin(t * 5)} ry={26} fill={r.color} opacity={0.85} /> : null}
                  <Label x={BX + w + 24} y={y} size={30} color={r.color} anchor="start" font="mono" weight={600}>
                    {r.txt}
                  </Label>
                  <Ripple x={BX + w} y={y} p={(t - r.at - 1.2) / 1.0} r={60} color="spr" rings={2} />
                </g>
              );
            })}
            {/* garis acuan air */}
            <line x1={BX + 1000 * SCL} y1={270} x2={BX + 1000 * SCL} y2={800} stroke={C.water} strokeWidth={2} strokeDasharray="5 6" opacity={0.6} />
            <Twinkles x={BX + 13534 * SCL - 60} y={710} rx={90} ry={30} n={4} color="white" opacity={ramp(t, wordOf(4, 'raksa') + 1.2, wordOf(4, 'raksa') + 1.8)} seed={2} />
          </g>
        ) : null}

        {/* ================= Babak 4: kolom cairan ================= */}
        {act4 > 0.001 ? (
          <g opacity={act4}>
            <Glow x={(GL.x0 + GL.x1) / 2} y={620} r={380} color="spr" opacity={0.3} />
            <ellipse cx={(GL.x0 + GL.x1) / 2} cy={GL.bot + 14} rx={200} ry={14} fill="#000" opacity={0.3} />
            {/* lapisan (dari bawah): madu, air, minyak */}
            {[
              {y0: yHoney, y1: GL.bot, c: LIQ[0].color, op: 0.85, h: hh, s: 0},
              {y0: yWater, y1: yHoney, c: LIQ[1].color, op: 0.6, h: hw, s: 1},
              {y0: yOil, y1: yWater, c: LIQ[2].color, op: 0.55, h: ho, s: 2},
            ].map((L, k) =>
              L.h > 0.5 ? (
                <path key={k} d={`${wavePath(GL.x0 + 6, GL.x1 - 6, L.y0, t, k === 2 || L.y0 <= yOil + 0.5 ? 3 : 1.2, 0.04, L.s)} L${GL.x1 - 6},${L.y1} L${GL.x0 + 6},${L.y1} Z`} fill={L.c} opacity={L.op} />
              ) : null,
            )}
            {hw > 20 ? <Bubbles x={GL.x0 + 20} y={yWater + 6} w={GL.x1 - GL.x0 - 40} h={Math.max(0, hw - 12)} n={4} seed={9} speed={0.6} /> : null}
            {/* tetesan yang dituang */}
            {pours.map((pr, pk) =>
              Array.from({length: 7}, (_, i) => {
                const tr = pr.a + (i / 7) * (pr.b - pr.a);
                const tau = t - tr;
                if (tau < 0 || tau > 4) return null;
                const surf = yOil;
                const yHitTau = Math.sqrt(Math.max(0, (2 * (surf - SPOUT.y)) / 1800));
                const xx = SPOUT.x + 26 * (rand(i * 3 + pk) - 0.5);
                let yy = SPOUT.y + 0.5 * 1800 * tau * tau;
                let op = 1;
                if (tau > yHitTau) {
                  if (pr.liq === 0) {
                    // madu tenggelam menembus minyak & air sampai lapisannya
                    const tgt = yHoney + 6;
                    yy = surf + 140 * (tau - yHitTau);
                    const tArr = yHitTau + Math.max(0, tgt - surf) / 140;
                    if (tau > tArr) {
                      yy = tgt;
                      op = 1 - Math.min(1, (tau - tArr) / 0.3);
                    }
                  } else {
                    yy = surf;
                    op = 1 - Math.min(1, (tau - yHitTau) / 0.18);
                  }
                }
                if (op <= 0.001) return null;
                const c = LIQ[pr.liq].color;
                return (
                  <g key={`${pk}-${i}`} opacity={op}>
                    <path d={`M${xx},${yy - 16} Q${xx + 11},${yy} ${xx},${yy + 9} Q${xx - 11},${yy} ${xx},${yy - 16} Z`} fill={c} stroke="#fff" strokeOpacity={0.4} strokeWidth={1.2} />
                  </g>
                );
              }),
            )}
            {/* teko tuang */}
            {pours.map((pr, pk) => {
              const o = win(t, pr.a - 0.5, pr.b, 0.5, 0.4);
              const c = LIQ[pr.liq].color;
              // gelas kimia miring: bibir di bawah-kiri (cerat), dasar di atas-kanan
              const tilt = ((20 + 18 * o) * Math.PI) / 180;
              const u: [number, number] = [-Math.cos(tilt), Math.sin(tilt)];
              const v: [number, number] = [Math.sin(tilt), Math.cos(tilt)];
              const w = 46;
              const L = 130;
              const R: [number, number] = [SPOUT.x - v[0] * w + 30 * (1 - o), SPOUT.y - 4 - v[1] * w - 30 * (1 - o)];
              const B: [number, number] = [R[0] - u[0] * L, R[1] - u[1] * L];
              const P = [
                [R[0] + v[0] * w, R[1] + v[1] * w],
                [B[0] + v[0] * w * 0.9, B[1] + v[1] * w * 0.9],
                [B[0] - v[0] * w * 0.9, B[1] - v[1] * w * 0.9],
                [R[0] - v[0] * w, R[1] - v[1] * w],
              ];
              const Lq = [
                P[0],
                [mix(P[0][0], P[1][0], 0.75), mix(P[0][1], P[1][1], 0.75)],
                [mix(P[3][0], P[2][0], 0.25), mix(P[3][1], P[2][1], 0.25)] ,
              ];
              const d = P.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');
              const dl = Lq.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ') + ' Z';
              return (
                <g key={`b${pk}`} opacity={o}>
                  <path d={dl} fill={c} opacity={0.8} />
                  <path d={d} fill="#cfe6ff" fillOpacity={0.08} stroke="#cfe6ff" strokeWidth={3} strokeLinejoin="round" />
                </g>
              );
            })}
            {/* gelas */}
            <path d={`M${GL.x0},${GL.top} L${GL.x0},${GL.bot} L${GL.x1},${GL.bot} L${GL.x1},${GL.top}`} fill="none" stroke="#cfe6ff" strokeOpacity={0.85} strokeWidth={6} strokeLinejoin="round" />
            <line x1={GL.x0 + 16} y1={GL.top + 20} x2={GL.x0 + 16} y2={GL.bot - 20} stroke="#fff" strokeOpacity={0.15} strokeWidth={6} strokeLinecap="round" />
            {/* label lapisan */}
            {[
              {y: (yHoney + GL.bot) / 2, l: 'madu', c: LIQ[0].color, h: hh},
              {y: (yWater + yHoney) / 2, l: 'air', c: C.water, h: hw},
              {y: (yOil + yWater) / 2, l: 'minyak', c: LIQ[2].color, h: ho},
            ].map((L) => {
              const o = Math.min(1, L.h / 50);
              return (
                <g key={L.l} opacity={o}>
                  <line x1={GL.x1 + 10} y1={L.y} x2={GL.x1 + 60} y2={L.y} stroke={L.c} strokeWidth={2.5} />
                  <Label x={GL.x1 + 72} y={L.y} size={30} anchor="start" color={L.c} weight={600}>
                    {L.l}
                  </Label>
                </g>
              );
            })}
            {/* panah ρ makin besar ke bawah */}
            <g opacity={ramp(t, wordOf(5, 'paling') - 0.3, wordOf(5, 'paling') + 0.5)}>
              <Arrow x1={GL.x0 - 70} y1={GL.top + 120} x2={GL.x0 - 70} y2={GL.bot - 30} color="spr" width={6} />
              <Label x={GL.x0 - 100} y={GL.top + 90} size={30} anchor="end" color={C.spr} weight={600}>
                ρ kecil
              </Label>
              <Label x={GL.x0 - 100} y={GL.bot - 40} size={30} anchor="end" color={C.spr} weight={600}>
                ρ besar
              </Label>
            </g>
            <Ripple x={SPOUT.x} y={yOil} p={(t - t5 - 0.4) / 1.2} r={120} color="water" rings={2} />
            <Motes x={950} y={560} rx={260} ry={280} n={18} color="spr" opacity={0.35} seed={4} />
            {/* kunci teka-teki kapal */}
            <g opacity={keyIn}>
              <g transform={`translate(1560 ${330 + 5 * Math.sin(t * 0.9)}) rotate(${1.2 * Math.sin(t * 0.7)}) scale(0.42)`}>
                <path d="M-260,-60 L240,-60 L300,-90 Q280,30 220,80 L-240,80 Q-280,40 -270,0 Z" fill="#3b4a72" stroke="#a9b6d6" strokeWidth={4} />
                <rect x={-230} y={-150} width={90} height={90} fill="#d7deef" />
                {[0, 1, 2, 3, 4, 5].map((c) => (
                  <rect key={c} x={-110 + c * 52} y={-112} width={50} height={52} fill={['#c9584f', '#3f78c9', '#d9a23a'][c % 3]} opacity={0.8} />
                ))}
              </g>
              <path d={wavePath(1380, 1760, 360, t, 3, 0.05, 1)} fill="none" stroke="#cfeaff" strokeOpacity={0.6} strokeWidth={2.5} />
              {/* kunci bertanda ρ */}
              <g transform={`translate(${mix(1350, 1520, ramp(t, cue(6) + 0.8, cueEnd(6), EASE_IN_OUT))} 600) rotate(${-20 + 10 * Math.sin(t * 1.3)})`}>
                <circle cx={0} cy={0} r={46} fill="none" stroke={C.gold} strokeWidth={12} />
                <rect x={40} y={-8} width={130} height={16} rx={6} fill={C.gold} />
                <rect x={130} y={8} width={14} height={26} fill={C.gold} />
                <rect x={156} y={8} width={14} height={20} fill={C.gold} />
                <text x={0} y={2} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.serif} fontStyle="italic" fontSize={44} fill={C.spr}>
                  ρ
                </text>
              </g>
              <Glow x={1440} y={600} r={170} color="gold" opacity={0.4} />
              <Stream
                pts={[
                  [1460, 560],
                  [1520, 470],
                  [1560, 400],
                ]}
                color="gold"
                n={5}
                speed={0.6}
                r={4}
                jitter={2}
              />
              <Twinkles x={1560} y={330} rx={120} ry={50} n={4} color="gold" seed={7} />
            </g>
          </g>
        ) : null}
      </Stage>
      <Formula x={560} y={360} p={formP * act2} accent={C.spr} size={68} caption="massa jenis = massa ÷ volume">
        <V color="spr">ρ</V> = <Frac n={<V>m</V>} d={<V>V</V>} />
      </Formula>
      <Note x={560} y={590} p={rhoWater * act2} color={C.water}>
        ρ<sub style={{fontSize: '0.62em', verticalAlign: '-0.32em', lineHeight: 0}}>air</sub> = 1000 kg/m³
      </Note>
      <Note x={1560} y={760} p={keyIn * act4 * ramp(t, cue(6) + 0.6, cue(6) + 1.4)} color={C.gold} size={28}>
        kunci pertama
      </Note>
    </AbsoluteFill>
  );
};
