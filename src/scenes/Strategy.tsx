import React from 'react';
import {AbsoluteFill, interpolateColors, useCurrentFrame} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {Water} from '../components/fluid';
import {Arrow, Card, Glow, Label, Motes, Note, Ripple, Spark, Stage, Sub, Sup, TSub, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Cara berpikir: 5 langkah (gelas ukur terisi seperlima tiap langkah dicentang),
// lalu soal dua cairan: benda ρ = 900 di batas minyak (800) / air (1000) → f = 0,50.

const STEPS: React.ReactNode[] = [
  'Gambar wadah, cairan & titik; kedalaman vertikal',
  'Tekanan mutlak atau tekanan ukur?',
  <>
    Telusuri jalur cairan: +<i>ρgh</i> turun, −<i>ρgh</i> naik
  </>,
  'Diagram gaya: berat, gaya apung, tali/penopang',
  <>
    Periksa satuan: 1 cm² = 10<Sup>−4</Sup> m²
  </>,
];

const ROW0 = 262;
const CHIPS: {x: number; y: number; c: string; f: React.ReactNode}[] = [
  {x: 420, y: 360, c: C.press, f: <>p = p₀ + ρgh</>},
  {x: 860, y: 330, c: C.buoy, f: <>F<Sub>A</Sub> = ρ<Sub>f</Sub> V g</>},
  {x: 600, y: 520, c: C.spr, f: <>ρ = m / V</>},
  {x: 1040, y: 560, c: C.force, f: <>F₁/A₁ = F₂/A₂</>},
  {x: 470, y: 690, c: C.cyan, f: <>h = 2γ cos θ / ρgr</>},
  {x: 940, y: 740, c: C.press, f: <>p = F / A</>},
];
const RAIL_X = 250;
const LIST_X = 290;

const damp = (tau: number, w: number, z: number) => (tau <= 0 ? 1 : Math.exp(-z * w * tau) * Math.cos(w * Math.sqrt(1 - z * z) * tau));

/** Baris kartu yang tumbuh (tinggi & opasitas). */
const Grow: React.FC<{p: number; h: number; children: React.ReactNode; style?: React.CSSProperties}> = ({p, h, children, style}) => (
  <div style={{opacity: p, maxHeight: p < 0.999 ? p * h : undefined, overflow: p < 0.999 ? 'hidden' : undefined, ...style}}>{children}</div>
);

// gelas ukur langkah
const BK = {x: 1430, yb: 800, w: 300, h: 470};
// soal dua cairan
const BX0 = 260;
const BX1 = 760;
const BYB = 840;
const OIL_TOP = 440;
const IFACE = 610;
const CUBE = 140;
const CX = 560;
const OIL = '#e8b04a';

export const Strategy: React.FC = () => {
  const {t, cue, cueEnd, wordOf, fps} = useScene();
  const gT = useCurrentFrame() / fps;

  // ---------- daftar langkah ----------
  const listOut = 1 - ramp(t, cue(6) - 0.6, cue(6) + 0.2, EASE_IN_OUT);
  const head = ramp(t, cue(0) + 0.2, cue(0) + 1.0);
  const rows = STEPS.map((_, i) => ({
    p: ramp(t, cue(i + 1) - 0.1, cue(i + 1) + 0.6),
    tick: ramp(t, cueEnd(i + 1) - 0.4, cueEnd(i + 1) + 0.3),
    act: win(t, cue(i + 1) - 0.1, cueEnd(i + 1) + 0.3, 0.4, 0.6),
    y: ROW0 + i * 100 + 40,
  }));
  const railPos = [1, 2, 3, 4].reduce((s, i) => s + ramp(t, cue(i + 1) - 0.3, cue(i + 1) + 0.5, EASE_IN_OUT), 0);
  const railPrev = [1, 2, 3, 4].reduce((s, i) => s + ramp(t - 0.05, cue(i + 1) - 0.3, cue(i + 1) + 0.5, EASE_IN_OUT), 0);
  const railVel = Math.min(1, (railPos - railPrev) / 0.05 / 1.5);
  const railY = ROW0 + 40 + railPos * 100;
  // gelas ukur: tiap centang menambah seperlima, dengan riak & ayunan teredam
  const fill = rows.reduce((s, r, i) => s + ramp(t, cueEnd(i + 1) - 0.3, cueEnd(i + 1) + 0.9, EASE_IN_OUT) * (1 + 0.04 * damp(t - cueEnd(i + 1) - 0.9, 5, 0.25)), 0);
  const lvl = 30 + (fill / 5) * 360;
  const done = ramp(t, cueEnd(5) + 0.2, cueEnd(5) + 1.0);

  // ---------- soal dua cairan ----------
  const probIn = ramp(t, cue(6) - 0.2, cue(6) + 0.7);
  const tDrop = cue(6) + 1.6;
  const tau = t - tDrop;
  const cyHang = OIL_TOP - CUBE / 2 - 50 + 4 * Math.sin(t * 1.5);
  const cy = tau <= 0 ? cyHang : IFACE + (cyHang - IFACE) * damp(tau, 1.9, 0.28) + 3 * Math.sin(gT * 1.1) * ramp(tau, 3, 5);
  const cTop = cy - CUBE / 2;
  const cBot = cy + CUBE / 2;
  const oilPart = Math.max(0, Math.min(CUBE, IFACE - cTop));
  const settled = ramp(tau, 2.5, 4.5);
  const split = ramp(t, cue(6) + 5.5, cue(6) + 6.5) * settled;
  const given = ramp(t, cue(6) + 0.6, cue(6) + 1.4);
  const arr = ramp(t, cue(7) + 0.2, cue(7) + 1.0);
  const e1 = ramp(t, cue(7) + 0.4, cue(7) + 1.2);
  const tD = wordOf(7, 'delapan');
  const tS = wordOf(7, 'seribu');
  const e2 = ramp(t, tD - 0.2, tD + 0.6);
  const hiOil = win(t, tD - 0.2, tS - 0.1, 0.4, 0.4);
  const hiWat = win(t, tS - 0.2, cue(8) - 0.2, 0.4, 0.5);
  const e3 = ramp(t, cue(8) + 0.3, cue(8) + 1.1);
  const tH = wordOf(8, 'setengah');
  const e4 = ramp(t, tH - 0.2, tH + 0.6);
  const mid = ramp(t, wordOf(8, 'tengah', 1) - 0.4, wordOf(8, 'tengah', 1) + 0.6);
  const oilWave = (x: number) => OIL_TOP + 2.5 * Math.sin(x * 0.03 + gT * 1.6) + 1.2 * Math.sin(x * 0.07 - gT * 2.2);
  const oilTop = Array.from({length: 22}, (_, i) => {
    const x = BX0 + 6 + (i / 21) * (BX1 - BX0 - 12);
    return `${i ? 'L' : 'M'}${x.toFixed(1)},${oilWave(x).toFixed(1)}`;
  }).join(' ');

  return (
    <AbsoluteFill>
      {/* ===== daftar langkah ===== */}
      <AbsoluteFill style={{opacity: listOut}}>
        <Stage>
          <g opacity={rows[0].p}>
            <line x1={RAIL_X} y1={ROW0 + 40} x2={RAIL_X} y2={ROW0 + 440} stroke={C.line} strokeWidth={4} strokeLinecap="round" />
            <line x1={RAIL_X} y1={ROW0 + 40} x2={RAIL_X} y2={railY} stroke={C.cyan} strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" />
            {rows.map((r, i) => (
              <g key={i} opacity={Math.max(0.3, r.p)}>
                <circle cx={RAIL_X} cy={r.y} r={11} fill={C.bg} stroke={C.cyan} strokeWidth={3} />
                <circle cx={RAIL_X} cy={r.y} r={6 * r.tick} fill={C.cyan} />
                <Ripple x={LIST_X + 60} y={r.y} p={ramp(t, cueEnd(i + 1) - 0.1, cueEnd(i + 1) + 1.1, (q) => q)} r={70} color="cyan" rings={2} />
              </g>
            ))}
            <Spark x={RAIL_X} y={railY} r={7} color="cyan" trail={[1, 2, 3, 4, 5].map((k) => [RAIL_X, railY - k * 9 * railVel] as [number, number])} />
          </g>
          {/* gelas ukur yang terisi tiap langkah */}
          <g opacity={head}>
            <Glow x={BK.x + BK.w / 2} y={BK.yb - lvl / 2} r={260} color="water" opacity={0.25 + 0.5 * done} />
            <ellipse cx={BK.x + BK.w / 2} cy={BK.yb + 10} rx={BK.w * 0.6} ry={14} fill="#000" opacity={0.35} />
            <Water x={BK.x + 6} y={BK.yb - 6 - lvl} w={BK.w - 12} h={lvl} bubbles={5} seed={7} amp={3 + 3 * Math.max(0, railVel)} />
            <path d={`M${BK.x - 16},${BK.yb - BK.h} L${BK.x},${BK.yb - BK.h + 14} L${BK.x},${BK.yb} L${BK.x + BK.w},${BK.yb} L${BK.x + BK.w},${BK.yb - BK.h}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} strokeLinejoin="round" />
            <line x1={BK.x + 16} y1={BK.yb - BK.h + 30} x2={BK.x + 16} y2={BK.yb - 24} stroke="#fff" strokeOpacity={0.18} strokeWidth={5} strokeLinecap="round" />
            {[1, 2, 3, 4, 5].map((k) => {
              const y = BK.yb - 6 - 30 - k * 72;
              const on = rows[k - 1].tick;
              return (
                <g key={k}>
                  <line x1={BK.x + BK.w - 50} y1={y} x2={BK.x + BK.w} y2={y} stroke={interpolateColors(on, [0, 1], [C.muted, C.cyan])} strokeWidth={3} />
                  <Label x={BK.x + BK.w + 22} y={y} size={24} color={interpolateColors(on, [0, 1], [C.muted, C.cyan])} anchor="start" font="mono" weight={600}>
                    {k}
                  </Label>
                </g>
              );
            })}
            {rows.map((r, i) => (
              <Ripple key={i} x={BK.x + BK.w / 2} y={BK.yb - 6 - 30 - (i + 1) * 72} p={ramp(t, cueEnd(i + 1) + 0.5, cueEnd(i + 1) + 1.8, (q) => q)} r={170} color="cyan" rings={2} />
            ))}
            <Twinkles x={BK.x + BK.w / 2} y={BK.yb - lvl - 20} rx={150} ry={40} n={5} opacity={done} seed={9} />
          </g>
          <Motes x={900} y={540} rx={780} ry={300} n={22} color="cyan" opacity={0.35} seed={3} />
        </Stage>
        {CHIPS.map((c, i) => {
          const o = win(t, cue(0) + 0.3 + 0.25 * i, cue(1) - 0.4, 0.6, 0.6) * 0.9;
          const x = c.x + 18 * Math.sin(gT * 0.4 + i * 1.7);
          const y = c.y + 14 * Math.sin(gT * 0.55 + i * 2.3);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: `translate(-50%, -50%) rotate(${4 * Math.sin(gT * 0.3 + i)}deg)`,
                opacity: o,
                padding: '12px 26px',
                borderRadius: 14,
                background: 'rgba(14,22,50,0.85)',
                border: `1.5px solid ${c.c}88`,
                color: c.c,
                fontFamily: FONT.serif,
                fontSize: 40,
                whiteSpace: 'nowrap',
              }}
            >
              {c.f}
            </div>
          );
        })}
        <div style={{position: 'absolute', left: LIST_X + 480, top: 196, transform: 'translateX(-50%)', opacity: head, fontFamily: FONT.head, fontSize: 26, letterSpacing: 6, color: C.cyan, fontWeight: 600}}>
          URUTAN BERPIKIR
        </div>
        {STEPS.map((s, i) => {
          const {p, tick, act} = rows[i];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: LIST_X,
                top: ROW0 + i * 100,
                width: 960,
                height: 80,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                opacity: p,
                translate: `${(1 - p) * 30}px 0px`,
                scale: String(1 + 0.015 * act),
                fontFamily: FONT.head,
                fontSize: 32,
                fontWeight: 500,
                color: C.ink,
                padding: '0 24px',
                borderRadius: 16,
                background: `linear-gradient(90deg, rgba(20,34,72,${0.85 + 0.1 * act}), rgba(14,22,50,0.85))`,
                border: `1.5px solid ${interpolateColors(act, [0, 1], [C.line, C.cyan])}`,
                boxShadow: `0 0 ${28 * act}px rgba(79,214,255,${0.28 * act})`,
                whiteSpace: 'nowrap',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: `2.5px solid ${C.cyan}`,
                  background: `rgba(79,214,255,${0.15 * tick})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT.mono,
                  fontSize: 24,
                  color: C.cyan,
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <span style={{opacity: 1 - tick}}>{i + 1}</span>
                <svg width={48} height={48} viewBox="0 0 48 48" style={{position: 'absolute', left: -2.5, top: -2.5}}>
                  <path d="M12,25 L21,34 L37,15" fill="none" stroke={C.cyan} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 * (1 - tick)} />
                </svg>
              </div>
              <span>{s}</span>
            </div>
          );
        })}
      </AbsoluteFill>

      {/* ===== soal: benda di batas minyak / air ===== */}
      <AbsoluteFill style={{opacity: probIn}}>
        <Stage>
          <defs>
            <linearGradient id="st-oil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={OIL} stopOpacity={0.55} />
              <stop offset="100%" stopColor="#a8701e" stopOpacity={0.75} />
            </linearGradient>
            <linearGradient id="st-cube" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#b9a4ff" />
              <stop offset="100%" stopColor="#5a4a9a" />
            </linearGradient>
            <clipPath id="st-cube-c">
              <rect x={CX - CUBE / 2} y={cTop} width={CUBE} height={CUBE} rx={10} />
            </clipPath>
          </defs>
          <g transform="translate(510 590) scale(1.12) translate(-510 -590)">
          <ellipse cx={(BX0 + BX1) / 2} cy={BYB + 10} rx={290} ry={14} fill="#000" opacity={0.35} />
          {/* minyak di atas, air di bawah */}
          <path d={`${oilTop} L${BX1 - 6},${IFACE + 12} L${BX0 + 6},${IFACE + 12} Z`} fill="url(#st-oil)" />
          <path d={oilTop} fill="none" stroke="#ffe2a0" strokeOpacity={0.7} strokeWidth={2.5} />
          {Array.from({length: 6}, (_, i) => {
            const ph = (((gT * 0.18 + i / 6) % 1) + 1) % 1;
            return <circle key={i} cx={BX0 + 40 + ((i * 83) % 420)} cy={IFACE - 10 - ph * 150} r={3 + (i % 3)} fill={OIL} opacity={Math.min(1, ph * 6) * (1 - ph) * 0.6} />;
          })}
          <Water x={BX0 + 6} y={IFACE} w={BX1 - BX0 - 12} h={BYB - 6 - IFACE} bubbles={4} seed={8} amp={2.5} />
          {/* benda */}
          <g>
            <rect x={CX - CUBE / 2} y={cTop} width={CUBE} height={CUBE} rx={10} fill="url(#st-cube)" stroke="#dcd0ff" strokeWidth={3} />
            <g clipPath="url(#st-cube-c)" opacity={split}>
              <rect x={CX - CUBE / 2} y={cTop} width={CUBE} height={oilPart} fill={OIL} opacity={0.45 + 0.35 * hiOil} />
              <rect x={CX - CUBE / 2} y={cTop + oilPart} width={CUBE} height={CUBE - oilPart} fill={C.water} opacity={0.45 + 0.35 * hiWat} />
              <line x1={CX - CUBE / 2} y1={IFACE} x2={CX + CUBE / 2} y2={IFACE} stroke="#fff" strokeWidth={2} strokeDasharray="6 5" />
            </g>
            <rect x={CX - CUBE / 2 + 8} y={cTop + 6} width={CUBE - 16} height={8} rx={4} fill="#fff" opacity={0.2} />
            <Label x={CX - CUBE / 2 - 14} y={cy} size={26} color={C.ink} weight={600} font="serif" anchor="end">
              <tspan fill={C.spr} fontStyle="italic">
                ρ
              </tspan>{' '}
              = 900
            </Label>
          </g>
          <Glow x={CX} y={IFACE - 40} r={150} color="gold" opacity={hiOil * 0.6} />
          <Glow x={CX} y={IFACE + 40} r={150} color="water" opacity={hiWat * 0.6} />
          <Ripple x={CX} y={OIL_TOP} p={ramp(t, tDrop + 0.3, tDrop + 1.6, (q) => q)} r={200} color="gold" rings={2} />
          <Ripple x={CX} y={IFACE} p={ramp(t, tDrop + 0.9, tDrop + 2.2, (q) => q)} r={180} color="water" rings={2} />
          {/* gelas */}
          <path d={`M${BX0},${OIL_TOP - 130} L${BX0},${BYB} L${BX1},${BYB} L${BX1},${OIL_TOP - 130}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} strokeLinejoin="round" />
          <line x1={BX0 + 14} y1={OIL_TOP - 110} x2={BX0 + 14} y2={BYB - 20} stroke="#fff" strokeOpacity={0.18} strokeWidth={5} strokeLinecap="round" />
          <Label x={BX0 + 24} y={OIL_TOP + 40} size={26} color="#ffe2a0" anchor="start" weight={600}>
            minyak 800
          </Label>
          <Label x={BX0 + 24} y={IFACE + 60} size={26} color="#cfeaff" anchor="start" weight={600}>
            air 1000
          </Label>
          {/* fraksi */}
          <g opacity={split}>
            <line x1={CX + CUBE / 2 + 22} y1={cTop} x2={CX + CUBE / 2 + 22} y2={IFACE} stroke={OIL} strokeWidth={3.5} />
            <line x1={CX + CUBE / 2 + 22} y1={IFACE} x2={CX + CUBE / 2 + 22} y2={cBot} stroke={C.water} strokeWidth={3.5} />
            {[cTop, IFACE, cBot].map((y, i) => (
              <line key={i} x1={CX + CUBE / 2 + 12} y1={y} x2={CX + CUBE / 2 + 32} y2={y} stroke={C.ink} strokeWidth={2.5} />
            ))}
            <Label x={CX + CUBE / 2 + 40} y={(cTop + IFACE) / 2} size={28} color={OIL} anchor="start" weight={700} font="serif" italic>
              1 − f
            </Label>
            <Label x={CX + CUBE / 2 + 40} y={(IFACE + cBot) / 2} size={28} color={C.cyan} anchor="start" weight={700} font="serif" italic>
              f
            </Label>
          </g>
          {/* gaya */}
          <g opacity={arr}>
            <Arrow x1={CX - 36} y1={(cTop + IFACE) / 2} x2={CX - 36} y2={(cTop + IFACE) / 2 - 80 * (oilPart / (CUBE / 2))} color="buoy" width={5} pulse={false} />
            <Arrow x1={CX + 6} y1={(IFACE + cBot) / 2} x2={CX + 6} y2={(IFACE + cBot) / 2 - 100 * ((CUBE - oilPart) / (CUBE / 2))} color="buoy" width={5} pulse={false} />
            <Arrow x1={CX + 44} y1={cy} x2={CX + 44} y2={cy + 180} color="force" width={6} />
            <Label x={CX + 64} y={cy + 168} size={26} color={C.force} anchor="start" weight={700}>
              W
            </Label>
            <Label x={CX} y={OIL_TOP - 70} size={24} color={C.buoy} weight={700}>
              F<TSub>A</TSub> minyak + F<TSub>A</TSub> air
            </Label>
          </g>
          </g>
          {/* garis bilangan: 900 di tengah 800 dan 1000 */}
          <g opacity={mid}>
            {(() => {
              const x0 = 1150;
              const x1 = 1650;
              const y = 805;
              const mx = (x0 + x1) / 2;
              return (
                <g>
                  <line x1={x0} y1={y} x2={x1} y2={y} stroke={C.muted} strokeWidth={3} />
                  <line x1={x0} y1={y - 12} x2={x0} y2={y + 12} stroke={OIL} strokeWidth={4} />
                  <line x1={x1} y1={y - 12} x2={x1} y2={y + 12} stroke={C.water} strokeWidth={4} />
                  <Label x={x0} y={y + 36} size={24} color={OIL} weight={600}>
                    800
                  </Label>
                  <Label x={x1} y={y + 36} size={24} color={C.water} weight={600}>
                    1000
                  </Label>
                  <circle cx={mx} cy={y} r={9 + 2 * Math.sin(gT * 4)} fill={C.spr} />
                  <Glow x={mx} y={y} r={50} color="spr" />
                  <Label x={mx} y={y + 36} size={24} color={C.spr} weight={700}>
                    900
                  </Label>
                  <Label x={mx} y={y - 34} size={22} color={C.muted}>
                    tepat di tengah
                  </Label>
                </g>
              );
            })()}
          </g>
          <Ripple x={1400} y={650} p={ramp(t, tH, tH + 1.4, (q) => q)} r={200} color="gold" />
          <Twinkles x={1400} y={650} rx={200} ry={40} n={6} opacity={e4} seed={5} />
          <Motes x={CX} y={IFACE} rx={300} ry={220} n={16} color="gold" opacity={0.35} seed={6} />
        </Stage>
        <Note x={1400} y={250} p={given} color={C.cyan} size={28}>
          <V color={C.spr}>ρ</V>
          <Sub>b</Sub> = 900 · minyak 800 · air 1000 · <Tint c={C.gold}>bagian di air f = ?</Tint>
        </Note>
        <Card x={1400} y={500} opacity={Math.min(1, e1 * 1.4)} accent={C.buoy} style={{padding: '20px 44px'}}>
          <div style={{fontFamily: FONT.serif, fontSize: 56, lineHeight: 1.42, textAlign: 'center'}}>
            <div style={{opacity: e1}}>
              <Tint c={C.buoy}>
                <V>F</V>
                <Sub>A,m</Sub> + <V>F</V>
                <Sub>A,a</Sub>
              </Tint>{' '}
              = <Tint c={C.force}>W</Tint>
            </div>
            <Grow p={e2} h={90}>
              <Tint c={OIL}>800(1 − <V>f</V>)</Tint> + <Tint c={C.water}>1000 <V>f</V></Tint> = 900
            </Grow>
            <Grow p={e3} h={90}>
              200 <V>f</V> = 100
            </Grow>
            <Grow p={e4} h={90}>
              <span style={{color: C.gold, fontWeight: 600, textShadow: `0 0 ${18 * e4}px rgba(255,201,74,0.5)`}}>
                <V>f</V> = 0,50
              </span>
            </Grow>
          </div>
        </Card>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
