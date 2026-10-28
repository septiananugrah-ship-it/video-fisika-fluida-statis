import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {EASE_IN, EASE_IN_OUT, cyc, mix, ramp, rand, win} from '../anim';
import {Arrow, Card, Glow, Label, Motes, Note, Ripple, Stage, Stream, Sub, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Massa jenis di laboratorium.
// A: tiga gelas ukur (cairan kurang rapat / air / lebih rapat) + hidrometer yang terayun teredam lalu diam:
//    makin rapat cairan → makin sedikit tercelup (V_celup = m/ρ). Sidik jari, Archimedes, aplikasi (nira, fermentasi, aki),
//    gula dilarutkan → ρ naik → hidrometer naik.
// B: corong pisah: tetes-tetes memisah, lapisan rapat di bawah, keran dibuka menguras lapisan bawah.

const useGT = () => {
  const f = useCurrentFrame();
  const {fps} = useScene();
  return f / fps;
};
const damp = (tau: number, w: number, z: number) => (tau <= 0 ? 1 : Math.exp(-z * w * tau) * Math.cos(w * Math.sqrt(1 - z * z) * tau));

/* hidrometer: bola + pemberat setinggi 130 px, batang berskala di atasnya.
   Volume tercelup (dalam satuan panjang batang) = M/ρ = 200 (bola) + s → s = M/ρ − 200. */
const HM = 276;
const BULB = 130;
const STEM = 190;
const sOf = (rho: number) => HM / rho - 200;
const MARKS = [0.8, 0.9, 1.0, 1.1, 1.2];

const Hydro: React.FC<{x: number; yb: number; rot?: number; surf?: number; showRead?: number}> = ({x, yb, rot = 0, surf, showRead = 0}) => (
  <g transform={`translate(${x} ${yb}) rotate(${rot})`}>
    {/* pemberat */}
    <path d="M-22,-18 Q-22,0 0,0 Q22,0 22,-18 L22,-34 L-22,-34 Z" fill="#3a4466" stroke="#e8f4ff" strokeWidth={2} />
    {[-12, 0, 12, -6, 6].map((dx, i) => (
      <circle key={i} cx={dx} cy={i < 3 ? -12 : -24} r={5} fill="#8a94b0" />
    ))}
    {/* bola */}
    <path d={`M-22,-34 C-34,-60 -34,-110 -8,${-BULB + 2} L8,${-BULB + 2} C34,-110 34,-60 22,-34 Z`} fill="#cfeaff" fillOpacity={0.2} stroke="#e8f4ff" strokeWidth={2.5} />
    <path d="M-18,-50 C-24,-70 -22,-95 -10,-112" fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />
    {/* batang */}
    <rect x={-8} y={-BULB - STEM} width={16} height={STEM} rx={8} fill="#f4f0dc" fillOpacity={0.85} stroke="#e8f4ff" strokeWidth={2} />
    {MARKS.map((m) => {
      const y = -BULB - sOf(m);
      return (
        <g key={m}>
          <line x1={-8} y1={y} x2={4} y2={y} stroke="#1a2236" strokeWidth={2} />
          <text x={12} y={y + 5} fontFamily={FONT.mono} fontSize={15} fill={C.ink} opacity={0.85}>
            {m.toFixed(1).replace('.', ',')}
          </text>
        </g>
      );
    })}
    {[0.85, 0.95, 1.05, 1.15].map((m) => (
      <line key={m} x1={-8} y1={-BULB - sOf(m)} x2={0} y2={-BULB - sOf(m)} stroke="#1a2236" strokeWidth={1.2} />
    ))}
    {surf !== undefined && showRead > 0 ? <line x1={-16} y1={surf - yb} x2={16} y2={surf - yb} stroke={C.gold} strokeWidth={3} opacity={showRead} /> : null}
  </g>
);

/* gelas ukur */
const CYL_TOP = 330;
const CYL_BOT = 840;
const CW = 150;
const SURF = 430;
const CYLS = [
  {x: 280, rho: 0.8, col: '#d9c27a', name: 'kurang rapat'},
  {x: 520, rho: 1.0, col: C.water, name: 'air'},
  {x: 760, rho: 1.2, col: '#2bb59a', name: 'lebih rapat'},
];

const liquidTop = (x0: number, x1: number, y: number, gT: number, seed: number) =>
  Array.from({length: 9}, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / 8;
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${(y + 2 * Math.sin(x * 0.05 + gT * 2 + seed)).toFixed(1)}`;
  }).join(' ');
const liquidPath = (x0: number, x1: number, y: number, yb: number, gT: number, seed: number) => `${liquidTop(x0, x1, y, gT, seed)} L${x1},${yb} L${x0},${yb} Z`;

const PhaseA: React.FC<{op: number}> = ({op}) => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const cylIn = ramp(t, cue(0) - 0.4, cue(0) + 0.8);
  // gula di gelas tengah (baris 4)
  const sugar = ramp(t, cue(4) + 1.0, cue(4) + 4.6, EASE_IN_OUT);
  const rhos = CYLS.map((c, k) => (k === 1 ? c.rho + 0.15 * sugar : c.rho));
  const dropT = [0, 1, 2].map((k) => cue(1) + 0.3 + 0.6 * k);
  const ybOf = (k: number) => {
    const yeq = SURF + BULB + sOf(rhos[k]);
    const y0 = SURF - 70;
    const tau = t - dropT[k];
    const bob = 1.5 * Math.sin(gT * 1.3 + k * 2);
    return tau <= 0 ? y0 : yeq + (y0 - (SURF + BULB + sOf(CYLS[k].rho))) * damp(tau, 2.4, 0.2) + bob * ramp(tau, 2, 4);
  };
  const hIn = (k: number) => ramp(t, dropT[k] - 0.8, dropT[k] - 0.2);
  const settled = (k: number) => ramp(t, dropT[k] + 2.5, dropT[k] + 3.5);
  const deep = win(t, wordOf(1, 'dalam') - 0.2, cue(2) - 0.2, 0.5, 0.6);
  const high = win(t, wordOf(1, 'tinggi') - 0.2, cue(2) - 0.2, 0.5, 0.6);
  const arch = win(t, cue(2) + 0.3, cue(3) - 0.2, 0.7, 0.6);
  const f1 = win(t, cue(2) + 0.4, cue(3) - 0.2, 0.8, 0.6);
  const fp = win(t, cue(0) + 0.4, cue(1) - 0.1, 0.8, 0.6);
  const apps = win(t, cue(3) + 0.3, cue(4) - 0.2, 0.7, 0.6);
  const appK = [wordOf(3, 'gula'), wordOf(3, 'alkohol'), wordOf(3, 'asam')].map((tt) => ramp(t, tt - 0.4, tt + 0.4) * apps);
  const noRx = ramp(t, wordOf(3, 'tanpa') - 0.2, wordOf(3, 'tanpa') + 0.6) * apps;
  const sug = ramp(t, cue(4) - 0.2, cue(4) + 0.6);
  const dimOthers = 1 - 0.55 * win(t, cue(4) - 0.2, cue(5), 0.6, 0.4);
  const midCol = interpolateColors(sugar, [0, 1], [C.water, '#6fb8e8']);
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        <defs>
          {CYLS.map((c, k) => (
            <linearGradient key={k} id={`hy-liq${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={k === 1 ? midCol : c.col} stopOpacity={0.55} />
              <stop offset="100%" stopColor={C.deep} stopOpacity={0.9} />
            </linearGradient>
          ))}
        </defs>
        {CYLS.map((c, k) => {
          const x0 = c.x - CW / 2;
          const x1 = c.x + CW / 2;
          const yb = ybOf(k);
          const liq = liquidPath(x0 + 5, x1 - 5, SURF, CYL_BOT - 5, gT, k * 2);
          const dim = k === 1 ? 1 : dimOthers;
          const read = settled(k);
          return (
            <g key={k} opacity={cylIn * dim}>
              <ellipse cx={c.x} cy={CYL_BOT + 22} rx={CW * 0.75} ry={10} fill="#000" opacity={0.35} />
              <path d={liq} fill={`url(#hy-liq${k})`} />
              {/* gula larut (gelas tengah) */}
              {k === 1
                ? Array.from({length: 22}, (_, i) => {
                    const u = ramp(t, cue(4) + 1.0 + rand(i) * 1.2, cue(4) + 4.8 + rand(i + 3) * 1.0, EASE_IN_OUT);
                    const px = c.x + (rand(i * 5.1) - 0.5) * (CW - 30) + 6 * Math.sin(gT * 1.3 + i);
                    const py = mix(CYL_BOT - 20, SURF + 30 + rand(i * 2.7) * (CYL_BOT - SURF - 60), u) + 4 * Math.sin(gT * 1.7 + i * 2);
                    return <circle key={i} cx={px} cy={py} r={2.4} fill="#fff" opacity={0.7 * Math.min(1, u * 4) * sug} />;
                  })
                : null}
              {k === 1
                ? [0, 1, 2].map((j) => {
                    const t0 = cue(4) + 0.1 + 0.35 * j;
                    const fall = ramp(t, t0, t0 + 1.1, EASE_IN);
                    const sz = 22 * (1 - ramp(t, t0 + 1.2, t0 + 4.0));
                    const sx = c.x - 30 + 30 * j;
                    const sy = mix(250, CYL_BOT - 8 - sz, fall);
                    return sz > 0.5 ? <rect key={j} x={sx - sz / 2} y={sy - sz / 2} width={sz} height={sz} rx={3} fill="#fbfbff" stroke="#c9d2e6" strokeWidth={1.5} opacity={ramp(t, t0 - 0.4, t0)} /> : null;
                  })
                : null}
              <g opacity={hIn(k)}>
                <Hydro x={c.x + 2 * Math.sin(gT * 0.7 + k)} yb={yb} rot={1.2 * Math.sin(gT * 0.9 + k)} surf={SURF} showRead={read} />
              </g>
              {/* lapisan cairan tipis di depan bagian tercelup */}
              <path d={liq} fill={k === 1 ? midCol : c.col} opacity={0.18} />
              <path d={liquidTop(x0 + 5, x1 - 5, SURF, gT, k * 2)} fill="none" stroke="#e8f4ff" strokeOpacity={0.6} strokeWidth={2} />
              {/* kaca */}
              <path d={`M${x0 - 8},${CYL_TOP - 6} L${x0},${CYL_TOP} L${x0},${CYL_BOT} L${x1},${CYL_BOT} L${x1},${CYL_TOP} L${x1 + 8},${CYL_TOP - 6}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={5} strokeLinejoin="round" />
              <rect x={c.x - CW * 0.7} y={CYL_BOT} width={CW * 1.4} height={14} rx={5} fill="#1a2550" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={2} />
              {Array.from({length: 9}, (_, i) => (
                <line key={i} x1={x0} y1={CYL_BOT - 40 - i * 50} x2={x0 + (i % 2 ? 12 : 22)} y2={CYL_BOT - 40 - i * 50} stroke="#bfe3ff" strokeOpacity={0.45} strokeWidth={2} />
              ))}
              <Ripple x={c.x} y={SURF} p={ramp(t, dropT[k] + 0.1, dropT[k] + 1.3, (q) => q)} r={90} color="water" rings={2} />
              <Label x={c.x} y={CYL_BOT + 48} size={24} color={C.ink} weight={600} opacity={ramp(t, cue(1) + 0.4, cue(1) + 1.2)}>
                {c.name}
              </Label>
              <Label x={c.x} y={CYL_TOP - 105} size={30} color={C.gold} weight={600} font="mono" opacity={read}>
                {rhos[k].toFixed(k === 1 && sugar > 0 ? 2 : 1).replace('.', ',')}
              </Label>
            </g>
          );
        })}
        {/* sorotan: tercelup dalam vs menyembul tinggi */}
        <g opacity={deep}>
          <Glow x={CYLS[0].x} y={SURF + 60} r={130} color="gold" opacity={0.6} />
          <Arrow x1={CYLS[0].x - CW / 2 - 30} y1={SURF - 20} x2={CYLS[0].x - CW / 2 - 30} y2={SURF + 120} color="gold" width={5} />
        </g>
        <g opacity={high}>
          <Glow x={CYLS[2].x} y={SURF - 120} r={130} color="cyan" opacity={0.6} />
          <Arrow x1={CYLS[2].x + CW / 2 + 30} y1={SURF + 20} x2={CYLS[2].x + CW / 2 + 30} y2={SURF - 120} color="cyan" width={5} />
        </g>
        {/* Archimedes pada hidrometer tengah */}
        <g opacity={arch}>
          {(() => {
            const yb = ybOf(1);
            const x = CYLS[1].x;
            return (
              <g>
                <path
                  d={`M${x - 26},${yb - 34} C${x - 38},${yb - 60} ${x - 38},${yb - 112} ${x - 12},${yb - BULB} L${x - 12},${SURF} L${x + 12},${SURF} L${x + 12},${yb - BULB} C${x + 38},${yb - 112} ${x + 38},${yb - 60} ${x + 26},${yb - 34} Q${x + 26},${yb + 6} ${x},${yb + 6} Q${x - 26},${yb + 6} ${x - 26},${yb - 34} Z`}
                  fill={C.buoy}
                  fillOpacity={0.15}
                  stroke={C.buoy}
                  strokeWidth={3}
                  strokeDasharray="9 6"
                  strokeDashoffset={-t * 12}
                />
                <Arrow x1={x - 46} y1={yb - 70} x2={x - 46} y2={yb - 200} color="buoy" width={6} />
                <Label x={x - 58} y={yb - 190} size={26} color={C.buoy} anchor="end" weight={700}>
                  F<tspan baselineShift="sub" fontSize="0.65em">A</tspan>
                </Label>
                <Arrow x1={x + 46} y1={yb - 30} x2={x + 46} y2={yb + 100} color="force" width={6} />
                <Label x={x + 58} y={yb + 90} size={26} color={C.force} anchor="start" weight={700}>
                  W
                </Label>
              </g>
            );
          })()}
        </g>
        {/* sidik jari massa jenis */}
        <g opacity={fp}>
          {(() => {
            const cx = 1460;
            const cy = 470;
            return (
              <g>
                <Glow x={cx} y={cy} r={260} color="spr" opacity={0.5} />
                {Array.from({length: 10}, (_, k) => {
                  const rx = 18 + k * 15;
                  const ry = 24 + k * 19;
                  return (
                    <ellipse
                      key={k}
                      cx={cx + 3 * Math.sin(k)}
                      cy={cy + k * 2}
                      rx={rx}
                      ry={ry}
                      fill="none"
                      stroke={C.spr}
                      strokeWidth={4}
                      strokeLinecap="round"
                      strokeDasharray={`${40 + k * 18} ${10 + (k % 3) * 8}`}
                      strokeDashoffset={k * 23}
                      opacity={0.75}
                    />
                  );
                })}
                {(() => {
                  const sy = cy + 175 * Math.sin(gT * 1.3);
                  const half = 160 * Math.sqrt(Math.max(0, 1 - ((sy - cy) / 200) ** 2));
                  return (
                    <g>
                      <line x1={cx - half} y1={sy} x2={cx + half} y2={sy} stroke={C.cyan} strokeOpacity={0.3} strokeWidth={14} strokeLinecap="round" />
                      <line x1={cx - half} y1={sy} x2={cx + half} y2={sy} stroke={C.cyan} strokeWidth={3} strokeLinecap="round" />
                    </g>
                  );
                })()}
              </g>
            );
          })()}
        </g>
        {/* aplikasi: nira, fermentasi, aki */}
        {(() => {
          const xs = [1220, 1470, 1720];
          const cy = 560;
          return (
            <g>
              {/* nira: tabung bambu dengan tetesan */}
              <g opacity={appK[0]}>
                <rect x={xs[0] - 40} y={cy - 90} width={80} height={170} rx={14} fill="#6b8f3a" stroke="#b9d68a" strokeWidth={2.5} />
                {[cy - 30, cy + 30].map((y) => (
                  <line key={y} x1={xs[0] - 40} y1={y} x2={xs[0] + 40} y2={y} stroke="#3e5a1e" strokeWidth={4} />
                ))}
                <rect x={xs[0] - 30} y={cy - 70} width={60} height={140} rx={8} fill="#f2e2a8" opacity={0.35} />
                {[0, 1, 2].map((i) => {
                  const ph = (((gT * 0.7 + i / 3) % 1) + 1) % 1;
                  return <ellipse key={i} cx={xs[0]} cy={cy - 150 + ph * 60} rx={5} ry={7} fill="#f2e2a8" opacity={cyc(ph)} />;
                })}
                <path d={`M${xs[0] - 60},${cy - 165} Q${xs[0]},${cy - 175} ${xs[0] + 10},${cy - 155}`} fill="none" stroke="#8a6e52" strokeWidth={6} strokeLinecap="round" />
              </g>
              {/* fermentasi: labu dengan gelembung CO₂ */}
              <g opacity={appK[1]}>
                <path d={`M${xs[1] - 18},${cy - 110} L${xs[1] - 18},${cy - 40} L${xs[1] - 70},${cy + 70} Q${xs[1] - 74},${cy + 82} ${xs[1] - 60},${cy + 82} L${xs[1] + 60},${cy + 82} Q${xs[1] + 74},${cy + 82} ${xs[1] + 70},${cy + 70} L${xs[1] + 18},${cy - 40} L${xs[1] + 18},${cy - 110}`} fill="#cfeaff" fillOpacity={0.12} stroke="#e8f4ff" strokeWidth={2.5} />
                <path d={`M${xs[1] - 52},${cy + 30} L${xs[1] + 52},${cy + 30} L${xs[1] + 68},${cy + 74} L${xs[1] - 68},${cy + 74} Z`} fill="#e8c46a" opacity={0.6} />
                {Array.from({length: 6}, (_, i) => {
                  const ph = (((gT * 0.5 + i / 6) % 1) + 1) % 1;
                  return <circle key={i} cx={xs[1] + (rand(i) - 0.5) * 60 * (1 - ph * 0.7)} cy={cy + 70 - ph * 170} r={3 + (i % 3)} fill="none" stroke="#fff" strokeWidth={1.5} opacity={cyc(ph) * 0.8} />;
                })}
              </g>
              {/* aki */}
              <g opacity={appK[2]}>
                <rect x={xs[2] - 80} y={cy - 50} width={160} height={130} rx={10} fill="#2a3150" stroke="#9aa6c8" strokeWidth={2.5} />
                <rect x={xs[2] - 56} y={cy - 74} width={24} height={24} rx={3} fill={C.heat} />
                <rect x={xs[2] + 32} y={cy - 74} width={24} height={24} rx={3} fill="#9aa6c8" />
                <Label x={xs[2] - 44} y={cy - 100} size={26} color={C.heat} weight={700}>
                  +
                </Label>
                <Label x={xs[2] + 44} y={cy - 100} size={26} color={C.muted} weight={700}>
                  −
                </Label>
                <rect x={xs[2] - 66} y={cy - 6 + 2 * Math.sin(gT * 2)} width={132} height={74 - 2 * Math.sin(gT * 2)} rx={6} fill={C.cyan} opacity={0.3} />
                <path d={`M${xs[2] - 8},${cy - 30} L${xs[2] - 22},${cy + 6} L${xs[2] - 2},${cy + 6} L${xs[2] - 14},${cy + 44} L${xs[2] + 22},${cy - 4} L${xs[2] + 2},${cy - 4} L${xs[2] + 14},${cy - 30} Z`} fill={C.gold} opacity={0.6 + 0.4 * Math.sin(gT * 3) ** 2} />
              </g>
              {[
                ['nira', 'kadar gula'],
                ['fermentasi', 'kadar alkohol'],
                ['aki', 'kepekatan asam'],
              ].map(([a, b], i) => (
                <g key={i} opacity={appK[i]}>
                  <Label x={xs[i]} y={cy + 125} size={28} color={C.ink} weight={600}>
                    {a}
                  </Label>
                  <Label x={xs[i]} y={cy + 160} size={22} color={C.muted}>
                    {b}
                  </Label>
                </g>
              ))}
            </g>
          );
        })()}
        <Twinkles x={1470} y={650} rx={200} ry={40} n={5} opacity={win(t, cue(4) + 4.0, cue(5) - 0.2, 0.5, 0.5)} seed={4} />
        <Motes x={520} y={560} rx={380} ry={260} n={18} color="cyan" opacity={0.35} seed={2} />
      </Stage>
      <Note x={1460} y={790} p={fp} color={C.spr} size={30}>
        massa jenis = <Tint c={C.spr}>sidik jari</Tint> larutan
      </Note>
      <Note x={1460} y={330} p={win(t, wordOf(1, 'dalam') - 0.2, cue(2) - 0.3, 0.6, 0.5)} color={C.gold} size={28}>
        tenggelam lebih dalam → cairan <Tint c={C.gold}>kurang rapat</Tint>
      </Note>
      <Note x={1460} y={440} p={win(t, wordOf(1, 'tinggi') - 0.2, cue(2) - 0.3, 0.6, 0.5)} color={C.cyan} size={28}>
        menyembul lebih tinggi → cairan <Tint c={C.cyan}>lebih rapat</Tint>
      </Note>
      <Card x={1440} y={420} opacity={f1} accent={C.buoy} style={{padding: '22px 40px'}}>
        <div style={{fontFamily: FONT.serif, fontSize: 58, lineHeight: 1.45, textAlign: 'center'}}>
          <div>
            <Tint c={C.buoy}>
              <V color={C.spr}>ρ</V>
              <Sub>cair</Sub> <V>V</V>
              <Sub>celup</Sub> <V>g</V>
            </Tint>{' '}
            = <Tint c={C.force}>m g</Tint>
          </div>
          <div style={{fontFamily: FONT.sans, fontSize: 24, color: C.muted, marginTop: -4}}>berat cairan yang dipindahkan = berat hidrometer</div>
          <div style={{opacity: ramp(t, cue(2) + 2.5, cue(2) + 3.3), marginTop: 10}}>
            <V>V</V>
            <Sub>celup</Sub> = <V>m</V> / <V color={C.spr}>ρ</V>
            <Sub>cair</Sub>
          </div>
        </div>
      </Card>
      <Note x={1470} y={320} p={noRx} color={C.buoy} size={30}>
        tanpa reaksi kimia apa pun <Tint c={C.buoy}>✓</Tint>
      </Note>
      <Note x={1470} y={420} p={win(t, cue(4) + 0.3, cue(5), 0.7, 0.4)} color={C.gold} size={30}>
        gula larut → <Tint c={C.spr}>ρ naik</Tint> → hidrometer <Tint c={C.cyan}>naik</Tint>
      </Note>
      <Card x={1470} y={600} opacity={win(t, cue(4) + 0.8, cue(5), 0.7, 0.4)} accent={C.spr} style={{padding: '18px 40px'}}>
        <div style={{fontFamily: FONT.mono, fontSize: 52, textAlign: 'center'}}>
          <span style={{fontFamily: FONT.serif, fontStyle: 'italic', color: C.spr}}>ρ</span> = {rhos[1].toFixed(2).replace('.', ',')}
          <span style={{fontSize: 26, color: C.muted}}> g/mL</span>
        </div>
      </Card>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* B — corong pisah                                                     */
/* ================================================================== */
const FX = 820;
const Y_TOP = 250;
const Y_CONE = 690;
const hw = (y: number) => {
  if (y < 300) return 26;
  if (y < 450) return 26 + (170 - 26) * Math.sin(((y - 300) / 150) * (Math.PI / 2));
  if (y <= Y_CONE) return 10 + (170 - 10) * (1 - (y - 450) / (Y_CONE - 450)) ** 1.15;
  return 10;
};
// luas kumulatif dari dasar kerucut ke atas
const AREA: {y: number; a: number}[] = (() => {
  const out: {y: number; a: number}[] = [];
  let a = 0;
  for (let y = Y_CONE; y >= Y_TOP; y -= 2) {
    out.push({y, a});
    a += 2 * hw(y) * 2;
  }
  return out;
})();
const yAtArea = (a: number) => {
  for (let i = 1; i < AREA.length; i++) {
    if (AREA[i].a >= a) {
      const p = (a - AREA[i - 1].a) / (AREA[i].a - AREA[i - 1].a);
      return mix(AREA[i - 1].y, AREA[i].y, p);
    }
  }
  return Y_TOP;
};
const areaAt = (y: number) => {
  const e = AREA.find((q) => q.y <= y);
  return e ? e.a : AREA[AREA.length - 1].a;
};
const A_LOW0 = areaAt(560);
const A_UP = areaAt(360) - A_LOW0;
const bodyBetween = (y1: number, y2: number) => {
  // y1 atas, y2 bawah
  const n = 24;
  const L: string[] = [];
  const R: string[] = [];
  for (let i = 0; i <= n; i++) {
    const y = y1 + ((y2 - y1) * i) / n;
    L.push(`${(FX - hw(y) + 4).toFixed(1)},${y.toFixed(1)}`);
    R.push(`${(FX + hw(y) - 4).toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${L.join(' L')} L${R.reverse().join(' L')} Z`;
};

const PhaseB: React.FC<{op: number}> = ({op}) => {
  const {t, cue, dur} = useScene();
  const gT = useGT();
  if (op <= 0.001) return null;
  const sep = ramp(t, cue(5) + 0.2, cue(5) + 4.2);
  const tOpen = cue(5) + 4.4;
  const open = ramp(t, tOpen, tOpen + 0.6, EASE_IN_OUT);
  const drain = 0.82 * ramp(t, tOpen + 0.4, dur - 0.3, (q) => q);
  const aLow = A_LOW0 * (1 - drain);
  const yI = yAtArea(aLow);
  const yT = yAtArea(aLow + A_UP);
  const flow = ramp(t, tOpen + 0.3, tOpen + 0.7) * (1 - ramp(t, dur - 0.6, dur, EASE_IN_OUT));
  const BKX = FX;
  const BKY = 870;
  const bkLvl = 6 + 70 * (drain / 0.82);
  const wobble = 2 * Math.sin(gT * 1.6);
  const outline = (() => {
    const n = 40;
    const L: string[] = [];
    const R: string[] = [];
    for (let i = 0; i <= n; i++) {
      const y = Y_TOP + ((Y_CONE - Y_TOP) * i) / n;
      L.push(`${(FX - hw(y)).toFixed(1)},${y.toFixed(1)}`);
      R.push(`${(FX + hw(y)).toFixed(1)},${y.toFixed(1)}`);
    }
    return `M${L.join(' L')} L${FX - 10},${Y_CONE + 14} M${R.join(' L')} L${FX + 10},${Y_CONE + 14}`;
  })();
  const labels = ramp(t, cue(5) + 2.0, cue(5) + 2.8);
  return (
    <AbsoluteFill style={{opacity: op}}>
      <Stage>
        {/* statif */}
        <rect x={500} y={200} width={12} height={668} rx={5} fill="#5d6680" />
        <rect x={430} y={862} width={180} height={14} rx={5} fill="#3a4466" />
        <rect x={506} y={286} width={FX - 506 - 30} height={10} rx={4} fill="#5d6680" />
        <ellipse cx={FX} cy={440} rx={180} ry={14} fill="none" stroke="#5d6680" strokeWidth={8} />
        {/* lapisan cairan */}
        <path d={bodyBetween(yI, Y_CONE)} fill={C.water} opacity={0.75} />
        <path d={`M${FX - 6},${Y_CONE} L${FX + 6},${Y_CONE} L${FX + 6},${Y_CONE + 40} L${FX - 6},${Y_CONE + 40} Z`} fill={C.water} opacity={0.75} />
        <path d={bodyBetween(yT, yI)} fill="#e8b04a" opacity={0.7} />
        <line x1={FX - hw(yT) + 6} y1={yT + wobble * 0.5} x2={FX + hw(yT) - 6} y2={yT - wobble * 0.5} stroke="#ffe2a0" strokeWidth={2.5} />
        <line x1={FX - hw(yI) + 6} y1={yI} x2={FX + hw(yI) - 6} y2={yI} stroke="#fff" strokeOpacity={0.4 + 0.4 * sep} strokeWidth={2} strokeDasharray={`${4 + 20 * sep} ${10 - 6 * sep}`} />
        {/* tetes yang memisah: minyak naik, air turun */}
        {Array.from({length: 16}, (_, i) => {
          const isOil = i % 2 === 0;
          const y0 = isOil ? 600 + rand(i) * 80 : 380 + rand(i) * 150;
          const tgt = isOil ? yI - 10 : yI + 12;
          const u = ramp(sep, rand(i + 7) * 0.4, 0.55 + rand(i + 3) * 0.45, EASE_IN_OUT);
          const y = mix(y0, tgt, u);
          const x = FX + (rand(i * 3.3) - 0.5) * 1.2 * hw(y) + 4 * Math.sin(gT * 2 + i);
          return <circle key={i} cx={x} cy={y} r={5 + (i % 3) * 2} fill={isOil ? '#e8b04a' : C.water} stroke="#fff" strokeOpacity={0.4} strokeWidth={1} opacity={(1 - u) * 0.95} />;
        })}
        {/* corong kaca */}
        <path d={outline} fill="none" stroke="#e8f4ff" strokeOpacity={0.85} strokeWidth={4} strokeLinejoin="round" />
        <path d={`M${FX - hw(330) + 14},${360} Q${FX - 150},${440} ${FX - 120},${520}`} fill="none" stroke="#fff" strokeOpacity={0.3} strokeWidth={5} strokeLinecap="round" />
        <rect x={FX - 20} y={Y_TOP - 30} width={40} height={30} rx={6} fill="#3a4466" stroke="#9aa6c8" strokeWidth={2} />
        {/* keran */}
        <rect x={FX - 10} y={Y_CONE + 14} width={20} height={44} fill="none" stroke="#e8f4ff" strokeWidth={3} />
        <circle cx={FX} cy={Y_CONE + 36} r={16} fill="#3a4466" stroke="#9aa6c8" strokeWidth={2} />
        <g transform={`rotate(${90 * open} ${FX} ${Y_CONE + 36})`}>
          <rect x={FX - 40} y={Y_CONE + 31} width={80} height={10} rx={5} fill="#c9d2e6" />
        </g>
        <rect x={FX - 6} y={Y_CONE + 58} width={12} height={60} fill="none" stroke="#e8f4ff" strokeWidth={3} />
        {/* aliran ke gelas */}
        <g opacity={flow}>
          <line x1={FX} y1={Y_CONE + 118} x2={FX} y2={BKY - bkLvl} stroke={C.water} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
          <Stream pts={[[FX, Y_CONE + 118], [FX, BKY - bkLvl]]} color="water" n={4} speed={1.4} r={4} jitter={0} />
        </g>
        {/* gelas penampung */}
        <rect x={BKX - 80} y={BKY - bkLvl} width={160} height={bkLvl} fill={C.water} opacity={0.7} />
        <path d={`M${BKX - 86},${BKY - 100} L${BKX - 80},${BKY} L${BKX + 80},${BKY} L${BKX + 86},${BKY - 100}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.8} strokeWidth={4} strokeLinejoin="round" />
        <Ripple x={FX} y={Y_CONE + 36} p={ramp(t, tOpen, tOpen + 1.2, (q) => q)} r={90} color="cyan" rings={2} />
        {/* label */}
        <g opacity={labels}>
          <line x1={FX + hw((yT + yI) / 2) + 10} y1={(yT + yI) / 2} x2={1160} y2={(yT + yI) / 2} stroke="#e8b04a" strokeWidth={2} strokeDasharray="6 6" />
          <Label x={1180} y={(yT + yI) / 2 - 18} size={30} color="#ffe2a0" anchor="start" weight={700}>
            kurang rapat → atas
          </Label>
          <Label x={1180} y={(yT + yI) / 2 + 20} size={24} color={C.muted} anchor="start">
            mis. pelarut organik
          </Label>
          <line x1={FX + hw((yI + Y_CONE) / 2 - 20) + 10} y1={(yI + Y_CONE) / 2 - 20} x2={1160} y2={(yI + Y_CONE) / 2 - 20} stroke={C.water} strokeWidth={2} strokeDasharray="6 6" />
          <Label x={1180} y={(yI + Y_CONE) / 2 - 38} size={30} color="#cfeaff" anchor="start" weight={700}>
            lebih rapat → bawah
          </Label>
          <Label x={1180} y={(yI + Y_CONE) / 2} size={24} color={C.muted} anchor="start">
            mis. lapisan air
          </Label>
        </g>
        <Label x={1180} y={Y_CONE + 80} size={26} color={C.cyan} anchor="start" weight={600} opacity={ramp(t, tOpen + 0.2, tOpen + 1.0)}>
          keran dibuka: lapisan bawah keluar dulu
        </Label>
        <Motes x={FX} y={470} rx={260} ry={260} n={16} color="cyan" opacity={0.35} seed={9} />
      </Stage>
      <Note x={1440} y={250} p={ramp(t, cue(5) + 0.3, cue(5) + 1.1)} color={C.cyan} size={30}>
        corong pisah: cairan yang <Tint c={C.cyan}>tidak bercampur</Tint>
      </Note>
    </AbsoluteFill>
  );
};

export const Hydrometer: React.FC = () => {
  const {t, cue} = useScene();
  const pA = 1 - ramp(t, cue(5) - 0.5, cue(5) + 0.2, EASE_IN_OUT);
  const pB = ramp(t, cue(5) - 0.4, cue(5) + 0.4);
  return (
    <AbsoluteFill>
      <PhaseA op={pA} />
      <PhaseB op={pB} />
    </AbsoluteFill>
  );
};
