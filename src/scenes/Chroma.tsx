import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, cyc, mix, ramp, rand, smoothPath, win} from '../anim';
import {Water} from '../components/fluid';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kromatografi kertas: pelarut merambat naik (kapilaritas, h ∝ √t), zat warna terpisah, nilai Rf diukur.
// Koordinat kertas (lokal) — seluruh kertas + tutup bergeser bersama (dy) saat dicelupkan/diangkat.
const SOL = 790; // permukaan pelarut
const SX = 470;
const SWD = 110;
const STOP = 262;
const SBOT = 812;
const ORG = 742; // garis awal (pensil), 48 px di atas pelarut
const HMAX = 468; // tinggi rambat akhir → jarak pelarut dari garis awal = 420 px = 8,4 cm
const PXCM = 50;
const TANK = {x0: 300, x1: 740, top: 232, bot: 850};
const DYES = [
  {rf: 0.8, c: '#ffd24a', name: 'kuning', rfTxt: '0,80'},
  {rf: 0.5, c: C.press, name: 'magenta', rfTxt: '0,50'},
  {rf: 0.25, c: '#5b86ff', name: 'biru', rfTxt: '0,25'},
];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const FIBERS = Array.from({length: 24}, (_, i) => {
  const x = SX + 6 + rand(i * 3.1 + 1) * (SWD - 12);
  const y = STOP + 16 + rand(i * 5.7 + 2) * (SBOT - STOP - 30);
  const L = 26 + rand(i * 1.3 + 3) * 44;
  const a = (rand(i * 2.2 + 4) - 0.5) * 1.3;
  return `M${x.toFixed(1)},${y.toFixed(1)} q${(Math.sin(a) * L * 0.5 + 4).toFixed(1)},${(L * 0.5).toFixed(1)} ${(Math.sin(a) * L).toFixed(1)},${L.toFixed(1)}`;
});

// Zoom: lingkaran perbesaran di panel kanan
const ZX = 1450;
const ZY = 505;
const ZR = 245;

/** Molekul zat warna yang berpindah-pindah antara fase gerak (pelarut) dan fase diam (serat). */
const dyeS = (rf: number, tau: number, w: number, ph: number) =>
  rf < 0.5 ? rf * (tau + Math.sin(w * tau + ph) / w) : rf * tau + ((1 - rf) * Math.sin(w * tau + ph)) / w;
const dyeV = (rf: number, tau: number, w: number, ph: number) => (rf < 0.5 ? rf * (1 + Math.cos(w * tau + ph)) : rf + (1 - rf) * Math.cos(w * tau + ph));

export const Chroma: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const appear = ramp(t, -0.3, 1.0);
  const tDip = wordOf(1, 'dicelupkan');
  const dip = ramp(t, tDip, tDip + 1.1, EASE_IN_OUT);
  const tWet = tDip + 0.6;
  const tFreeze = cue(5) + 0.2;
  const prog = (tt: number) => clamp01((tt - tWet) / (tFreeze - tWet));
  const hf = HMAX * Math.sqrt(prog(t)); // Lucas–Washburn: h ∝ √t (cepat di awal, lalu melambat)
  const wetOp = ramp(t, tWet - 0.1, tWet + 0.4);
  const lift = ramp(t, cue(5) + 0.3, cue(5) + 1.5, EASE_IN_OUT);
  const dy = -46 * (1 - dip) - 40 * lift;
  const frontL = SOL - hf;
  const ds = Math.max(0, hf - (SOL - ORG));

  // panel kanan
  const tlcOp = win(t, 0.9, cue(1) + 0.2, 0.8, 0.7);
  const plotOp = win(t, wordOf(1, 'merambat') - 0.4, cue(2) - 0.3, 0.8, 0.6);
  const zOp = win(t, cue(2) - 0.2, cue(4) + 0.1, 0.8, 0.7);
  const fibOp = 1 - ramp(t, cue(3) - 0.3, cue(3) + 0.7, EASE_IN_OUT);
  const molOp = ramp(t, cue(3) - 0.3, cue(3) + 0.7);
  const legOp = win(t, cue(4) + 0.1, cue(5) - 0.3, 0.7, 0.6);
  const fOp = ramp(t, cue(5) + 0.3, cue(5) + 1.2);
  const nOp = ramp(t, wordOf(5, 'nilai') - 0.2, wordOf(5, 'nilai') + 0.7);
  const kOp = ramp(t, wordOf(5, 'khas') - 0.2, wordOf(5, 'khas') + 0.6);
  const rulOp = ramp(t, cue(5) + 1.3, cue(5) + 2.2);
  const nameOp = win(t, cue(4) + 0.2, wordOf(5, 'khas') - 0.3, 0.6, 0.6);

  const fy = frontL + dy; // garis depan di layar
  const wavyFront = Array.from({length: 12}, (_, i) => {
    const x = SX + (SWD * i) / 11;
    return [x, frontL + 2.2 * Math.sin(x * 0.13 + t * 1.6) + 1.4 * Math.sin(x * 0.31 - t * 2.3)] as [number, number];
  });
  const wetD = `${smoothPath(wavyFront)} L${SX + SWD},${SBOT + 2} L${SX},${SBOT + 2} Z`;

  // plot h–t
  const X0 = 1170;
  const Y0 = 760;
  const PW = 560;
  const PH = 400;
  const curve = (u1: number) =>
    Array.from({length: 61}, (_, i) => {
      const u = (u1 * i) / 60;
      return [X0 + u * PW, Y0 - Math.sqrt(u) * PH] as [number, number];
    });
  const uNow = prog(t);

  return (
    <AbsoluteFill>
      <Stage>
        <Motes x={520} y={540} rx={300} ry={330} n={26} color="cyan" opacity={0.35 * appear} seed={3} />
        <Glow x={525} y={560} r={360} color="water" opacity={0.25 * appear} />
        {/* bejana kromatografi */}
        <g opacity={appear}>
          <ellipse cx={520} cy={TANK.bot + 12} rx={250} ry={14} fill="#000" opacity={0.35} />
          <rect x={TANK.x0} y={TANK.top} width={TANK.x1 - TANK.x0} height={TANK.bot - TANK.top} fill="#9fd4ff" opacity={0.04} />
          {/* uap pelarut (bejana jenuh) */}
          {[0, 1, 2, 3, 4].map((k) => {
            const ph = (((t * 0.11 + k * 0.21) % 1) + 1) % 1;
            const x = 340 + k * 85 + 14 * Math.sin(t * 0.7 + k);
            const y = SOL - 30 - ph * 360;
            return <path key={k} d={`M${x},${y} q10,-14 0,-28 q-10,-14 0,-28`} fill="none" stroke="#bfe3ff" strokeWidth={2} opacity={cyc(ph) * 0.16} />;
          })}
        </g>
        {/* kertas + tutup (bergerak bersama) */}
        <g transform={`translate(0 ${dy.toFixed(2)})`} opacity={appear}>
          <rect x={TANK.x0 - 12} y={TANK.top - 18} width={TANK.x1 - TANK.x0 + 24} height={18} rx={5} fill="#22305e" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={2} />
          <line x1={525} y1={TANK.top} x2={525} y2={STOP - 12} stroke="#9aa6c8" strokeWidth={3} />
          <defs>
            <clipPath id="chr-strip">
              <rect x={SX} y={STOP} width={SWD} height={SBOT - STOP} rx={3} />
            </clipPath>
          </defs>
          <rect x={SX + 6} y={STOP + 6} width={SWD} height={SBOT - STOP} rx={3} fill="#000" opacity={0.25} />
          <g clipPath="url(#chr-strip)">
            <rect x={SX} y={STOP} width={SWD} height={SBOT - STOP} fill="#e3e8f3" />
            {FIBERS.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#aab3cc" strokeWidth={1.1} opacity={0.55} />
            ))}
            <path d={wetD} fill="#7fb4ee" opacity={0.42 * wetOp} />
            <path d={smoothPath(wavyFront)} fill="none" stroke="#2f86e0" strokeWidth={2.6} opacity={0.85 * wetOp} />
            {/* garis awal pensil */}
            <line x1={SX + 4} y1={ORG} x2={SX + SWD - 4} y2={ORG} stroke="#6d7590" strokeWidth={1.6} strokeDasharray="5 4" />
            {/* titik tinta → pita-pita */}
            {DYES.map((d, i) => {
              const yb = ORG - d.rf * ds;
              const ry = 6 + 0.03 * d.rf * ds;
              const rx = 24 + 0.03 * ds + 1.5 * Math.sin(t * 1.3 + i);
              return (
                <g key={i}>
                  <rect x={SX + SWD / 2 - rx * 0.8} y={yb} width={rx * 1.6} height={Math.max(0, ORG - yb)} fill={d.c} opacity={0.08 * ramp(ds, 10, 80)} />
                  <ellipse cx={SX + SWD / 2} cy={yb} rx={rx + 6} ry={ry + 5} fill={d.c} opacity={0.22 * ramp(ds, 0, 40)} />
                  <ellipse cx={SX + SWD / 2} cy={yb} rx={rx} ry={ry} fill={d.c} opacity={0.82 * ramp(ds, 0, 40)} />
                </g>
              );
            })}
            <circle cx={SX + SWD / 2} cy={ORG} r={11} fill="#231a3a" opacity={1 - ramp(ds, 10, 140)} />
          </g>
          <rect x={SX + 34} y={STOP - 14} width={42} height={28} rx={4} fill="#8c97bb" stroke="#d6dcf0" strokeWidth={1.5} />
          {/* tetesan pelarut dari kertas yang diangkat */}
          {lift > 0.5
            ? [0, 1].map((k) => {
                const ph = (((t * 0.7 + k * 0.5) % 1) + 1) % 1;
                const y0 = SBOT + 4;
                const yy = y0 + 14 * ph * ph;
                return <circle key={k} cx={SX + 35 + k * 40} cy={yy} r={3} fill="#9fd0ff" opacity={cyc(ph) * ramp(lift, 0.5, 1)} />;
              })
            : null}
          {/* penggaris & ukuran (baris Rf) */}
          <g opacity={rulOp}>
            <rect x={596} y={ORG - 8.6 * PXCM} width={30} height={8.6 * PXCM + 12} rx={4} fill={C.force} opacity={0.14} stroke={C.force} strokeOpacity={0.5} strokeWidth={1.5} />
            {Array.from({length: 9}, (_, k) => (
              <g key={k}>
                <line x1={596} y1={ORG - k * PXCM} x2={612} y2={ORG - k * PXCM} stroke={C.force} strokeWidth={2} />
                <text x={632} y={ORG - k * PXCM} dominantBaseline="central" fontFamily={FONT.mono} fontSize={15} fill={C.force} opacity={0.85}>
                  {k}
                </text>
              </g>
            ))}
            {[frontL, ORG - 0.5 * (HMAX - (SOL - ORG)), ORG].map((y, k) => (
              <line key={k} x1={SX + SWD} y1={y} x2={870} y2={y} stroke={C.muted} strokeWidth={1.5} strokeDasharray="5 6" opacity={0.6} />
            ))}
            <Arrow x1={790} y1={ORG} x2={790} y2={ORG - 0.5 * (HMAX - (SOL - ORG))} color="press" width={4} both />
            <Arrow x1={835} y1={ORG} x2={835} y2={frontL} color="water" width={4} both />
            <Label x={858} y={(ORG + frontL) / 2 - 70} anchor="start" size={26} color={C.water} weight={600}>
              pelarut 8,4 cm
            </Label>
            <Label x={858} y={ORG - 0.25 * (HMAX - (SOL - ORG))} anchor="start" size={26} color={C.press} weight={600}>
              zat 4,2 cm
            </Label>
          </g>
          {/* nama pita lalu nilai Rf */}
          {DYES.map((d, i) => {
            const yb = ORG - d.rf * ds;
            return (
              <g key={d.name}>
                <Label x={452} y={yb} anchor="end" size={22} color={d.c} opacity={nameOp} weight={600}>
                  {d.name}
                </Label>
                <Label x={452} y={yb} anchor="end" size={24} color={d.c} opacity={kOp} weight={600} font="mono">
                  {d.rfTxt}
                </Label>
                <Glow x={SX + SWD / 2} y={yb} r={70} color={i === 1 ? 'press' : i === 0 ? 'force' : 'pot'} opacity={0.6 * Math.max(nameOp, kOp)} />
              </g>
            );
          })}
        </g>
        {/* pelarut di depan kertas */}
        <g opacity={appear}>
          <Water x={TANK.x0 + 5} y={SOL} w={TANK.x1 - TANK.x0 - 10} h={TANK.bot - SOL - 5} amp={2.2} seed={2} />
          <path d={`M${TANK.x0},${TANK.top} L${TANK.x0},${TANK.bot} L${TANK.x1},${TANK.bot} L${TANK.x1},${TANK.top}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={5} strokeLinejoin="round" />
          <line x1={TANK.x0 + 16} y1={TANK.top + 20} x2={TANK.x0 + 16} y2={TANK.bot - 24} stroke="#fff" strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" />
          <line x1={TANK.x1 - 16} y1={TANK.top + 60} x2={TANK.x1 - 16} y2={TANK.top + 260} stroke="#fff" strokeOpacity={0.08} strokeWidth={4} strokeLinecap="round" />
        </g>
        <Ripple x={525} y={SOL} p={(t - tWet + 0.1) / 1.3} r={120} color="water" rings={2} />
        <Twinkles x={525} y={ORG - 40 + dy} rx={70} ry={190} n={4} color="gold" opacity={kOp * 0.8} seed={4} />
        <Label x={520} y={878} size={25} color={C.muted} opacity={appear * (1 - ramp(t, cue(2), cue(2) + 0.8, EASE_IN_OUT))}>
          kromatografi kertas
        </Label>

        {/* ---- KLT (baris 0) ---- */}
        <TLC t={t} op={tlcOp} />

        {/* ---- plot h–t (baris 1) ---- */}
        <g opacity={plotOp}>
          <line x1={X0} y1={Y0} x2={X0 + PW + 20} y2={Y0} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
          <line x1={X0} y1={Y0} x2={X0} y2={Y0 - PH - 30} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
          <path d={smoothPath(curve(1))} fill="none" stroke={C.water} strokeWidth={2.5} strokeDasharray="6 8" opacity={0.35} />
          {uNow > 0.002 ? <path d={smoothPath(curve(uNow))} fill="none" stroke={C.water} strokeWidth={5} strokeLinecap="round" /> : null}
          <Spark x={X0 + uNow * PW} y={Y0 - Math.sqrt(uNow) * PH} r={7} color="water" />
          <Label x={X0 + 14} y={Y0 - PH - 34} anchor="start" size={24} color={C.water}>
            tinggi pelarut h
          </Label>
          <Label x={X0 + PW} y={Y0 + 34} anchor="end" size={24} color={C.muted}>
            waktu t
          </Label>
          <Label x={X0 + 60} y={Y0 - 50} anchor="start" size={24} color={C.cyan} opacity={ramp(t, wordOf(1, 'merambat') + 0.6, wordOf(1, 'merambat') + 1.4)}>
            cepat di awal
          </Label>
          <Label x={X0 + PW} y={Y0 - PH + 4} anchor="end" size={24} color={C.cyan} opacity={ramp(t, wordOf(1, 'celah') - 0.2, wordOf(1, 'celah') + 0.6)}>
            lalu melambat (h ∝ √t)
          </Label>
        </g>

        {/* ---- lensa perbesaran (baris 2–3) ---- */}
        {zOp > 0.001 ? (
          <g opacity={zOp}>
            <circle cx={525} cy={fy} r={30} fill="none" stroke={C.cyan} strokeWidth={2.5} />
            <line x1={540} y1={fy - 26} x2={ZX - 40} y2={ZY - ZR + 3} stroke={C.cyan} strokeWidth={1.5} strokeDasharray="6 7" opacity={0.45} />
            <line x1={540} y1={fy + 26} x2={ZX - 40} y2={ZY + ZR - 3} stroke={C.cyan} strokeWidth={1.5} strokeDasharray="6 7" opacity={0.45} />
            <defs>
              <clipPath id="chr-zoom">
                <circle cx={ZX} cy={ZY} r={ZR} />
              </clipPath>
            </defs>
            <circle cx={ZX} cy={ZY} r={ZR + 16} fill="url(#soft-cyan)" opacity={0.5} />
            <circle cx={ZX} cy={ZY} r={ZR} fill="#0a1230" />
            <g clipPath="url(#chr-zoom)">
              <FiberView t={t} t0={cue(2)} op={fibOp} />
              <MoleculeView t={t} op={molOp} />
            </g>
            <circle cx={ZX} cy={ZY} r={ZR} fill="none" stroke={C.cyan} strokeWidth={4} />
            <Label x={ZX} y={ZY + ZR + 46} size={27} color={C.cyan} opacity={fibOp}>
              celah sempit antar-serat = pipa kapiler
            </Label>
            <Label x={ZX} y={ZY + ZR + 40} size={24} color="#ffe07a" opacity={molOp * ramp(t, wordOf(3, 'tertarik', 0) - 0.2, wordOf(3, 'tertarik', 0) + 0.5)}>
              lebih tertarik ke pelarut → terbawa jauh
            </Label>
            <Label x={ZX} y={ZY + ZR + 80} size={24} color="#8fb0ff" opacity={molOp * ramp(t, wordOf(3, 'tertarik', 1) - 0.2, wordOf(3, 'tertarik', 1) + 0.5)}>
              lebih tertarik ke kertas → tertinggal
            </Label>
          </g>
        ) : null}

        {/* ---- tinta = campuran (baris 4) ---- */}
        <Legend t={t} op={legOp} />
        <Glow x={1450} y={340} r={380} color="cyan" opacity={0.3 * fOp} />
      </Stage>

      <Formula x={1450} y={330} p={fOp} accent={C.cyan} size={56}>
        <V>R</V>
        <Sub>f</Sub> ={' '}
        <Frac
          n={<span style={{fontFamily: FONT.sans, fontStyle: 'normal'}}>jarak tempuh zat</span>}
          d={<span style={{fontFamily: FONT.sans, fontStyle: 'normal'}}>jarak tempuh pelarut</span>}
          size={0.62}
        />
      </Formula>
      <Note x={1450} y={540} p={nOp} color={C.press} size={32}>
        magenta: <span style={{fontFamily: FONT.mono}}>4,2 cm ÷ 8,4 cm</span> = <b style={{color: C.press}}>0,50</b>
      </Note>
      <Note x={1450} y={680} p={kOp} color={C.gold} size={27}>
        khas tiap zat (pelarut & kertas sama)
      </Note>
    </AbsoluteFill>
  );
};

/** Pelat KLT di bejana kecil (baris 0). */
const TLC: React.FC<{t: number; op: number}> = ({t, op}) => {
  if (op <= 0.001) return null;
  const sol = 740;
  const h = 300 * Math.sqrt(clamp01((t - 1.0) / 13));
  const front = sol - h;
  const org = 715;
  const d = Math.max(0, h - (sol - org));
  return (
    <g opacity={op}>
      <Glow x={1450} y={560} r={300} color="spr" opacity={0.35} />
      <ellipse cx={1450} cy={812} rx={170} ry={12} fill="#000" opacity={0.35} />
      <rect x={1388} y={372} width={124} height={420} rx={3} fill="#eef2f8" />
      <rect x={1388} y={372} width={124} height={420} rx={3} fill="none" stroke="#9fb2d6" strokeWidth={2} />
      {Array.from({length: 26}, (_, i) => (
        <circle key={i} cx={1394 + rand(i * 4.1) * 112} cy={380 + rand(i * 2.9) * 400} r={1.2} fill="#b9c2d8" />
      ))}
      <rect x={1388} y={front} width={124} height={Math.max(0, 792 - front)} fill="#86b8ee" opacity={0.4} />
      <line x1={1388} y1={front + 1.5 * Math.sin(t * 2)} x2={1512} y2={front - 1.5 * Math.sin(t * 2)} stroke="#2f86e0" strokeWidth={2.4} />
      <line x1={1394} y1={org} x2={1506} y2={org} stroke="#6d7590" strokeWidth={1.4} strokeDasharray="4 4" />
      {[
        {rf: 0.7, c: '#4fe3a0'},
        {rf: 0.35, c: '#ff8a3d'},
      ].map((s, i) => (
        <ellipse key={i} cx={1450} cy={org - s.rf * d} rx={16 + 0.02 * d} ry={6 + 0.02 * d} fill={s.c} opacity={0.85} />
      ))}
      <circle cx={1450} cy={org} r={8} fill="#2b2240" opacity={1 - ramp(d, 5, 60)} />
      <Water x={1305} y={sol} w={290} h={52} amp={2} seed={5} />
      <path d="M1300,330 L1300,798 L1600,798 L1600,330" fill="none" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={5} strokeLinejoin="round" />
      <rect x={1288} y={314} width={324} height={16} rx={5} fill="#22305e" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={2} />
      <line x1={1316} y1={350} x2={1316} y2={780} stroke="#fff" strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" />
      <Label x={1450} y={878} size={25} color={C.spr}>
        kromatografi lapis tipis (KLT)
      </Label>
    </g>
  );
};

/** Serat kertas sebagai pipa kapiler: cairan naik di celah dengan meniskus cekung. */
const FiberView: React.FC<{t: number; t0: number; op: number}> = ({t, t0, op}) => {
  if (op <= 0.001) return null;
  const xs = [-215, -130, -50, 40, 120, 210].map((v) => ZX + v);
  const wav = (x0: number, k: number) =>
    smoothPath(
      Array.from({length: 9}, (_, i) => {
        const y = ZY - ZR - 10 + ((2 * ZR + 20) * i) / 8;
        return [x0 + 9 * Math.sin(y * 0.018 + k * 1.7), y] as [number, number];
      }),
    );
  return (
    <g opacity={op}>
      {xs.slice(0, -1).map((x, k) => {
        const xl = x + 18;
        const xr = xs[k + 1] - 18;
        const gap = xr - xl;
        const p = clamp01((t - t0 + 0.6 + k * 0.25) / (5.5 + gap * 0.05));
        const lvl = ZY + ZR - (40 + (ZR * 2 - 120) * (60 / gap) * 0.75) * Math.sqrt(p);
        const men = 12;
        const d = `M${xl},${lvl - men} Q${(xl + xr) / 2},${lvl + men} ${xr},${lvl - men} L${xr},${ZY + ZR + 10} L${xl},${ZY + ZR + 10} Z`;
        return (
          <g key={k}>
            <path d={d} fill={C.water} opacity={0.55} />
            <path d={`M${xl},${lvl - men} Q${(xl + xr) / 2},${lvl + men} ${xr},${lvl - men}`} fill="none" stroke="#cfeaff" strokeWidth={2.5} />
            {p < 0.98 ? <Arrow x1={(xl + xr) / 2} y1={lvl + 70} x2={(xl + xr) / 2} y2={lvl + 18} color="cyan" width={3} opacity={0.8 * (1 - p)} pulse={false} /> : null}
          </g>
        );
      })}
      {xs.map((x, k) => (
        <g key={k}>
          <path d={wav(x, k)} fill="none" stroke="#c9c2ee" strokeWidth={34} strokeLinecap="round" opacity={0.85} />
          <path d={wav(x - 8, k)} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.25} />
        </g>
      ))}
      <Label x={ZX - 215} y={ZY - ZR + 60} size={18} color="#e8e4ff" anchor="middle">
        serat
      </Label>
    </g>
  );
};

/** Tampilan molekuler: zat warna bergantian menempel ke serat dan terbawa pelarut (Rf = fraksi waktu bergerak). */
const MoleculeView: React.FC<{t: number; op: number}> = ({t, op}) => {
  if (op <= 0.001) return null;
  const wl = ZX - 195;
  const wr = ZX + 195;
  const v = 120;
  const w = 2 * Math.PI * 0.42;
  return (
    <g opacity={op}>
      {[-110, -40, 30, 100].map((x, k) => (
        <Stream
          key={k}
          pts={[
            [ZX + x, ZY + ZR],
            [ZX + x, ZY - ZR],
          ]}
          color="water"
          n={6}
          speed={0.24}
          r={3}
          jitter={2}
          seed={k}
          opacity={0.6}
        />
      ))}
      {[wl, wr].map((x, k) => (
        <rect key={k} x={x - 22} y={ZY - ZR} width={44} height={2 * ZR} rx={18} fill="#c9c2ee" opacity={0.75} />
      ))}
      <Label x={wl} y={ZY - ZR + 70} size={17} color="#2a2350" weight={600}>
        serat
      </Label>
      <Label x={wr} y={ZY - ZR + 70} size={17} color="#2a2350" weight={600}>
        serat
      </Label>
      {DYES.flatMap((d, di) =>
        [0, 1, 2, 3].map((j) => {
          const seed = di * 10 + j;
          const ph = rand(seed * 3.7) * 6.28;
          const s = dyeS(d.rf, t, w, ph);
          const u = (((s * v) / (2 * ZR) + rand(seed * 1.9)) % 1 + 1) % 1;
          const y = ZY + ZR - u * 2 * ZR;
          const lane = ZX - 140 + rand(seed * 5.3) * 280;
          const stuck = 1 - dyeV(d.rf, t, w, ph);
          const wall = lane < ZX ? wl + 30 : wr - 30;
          const x = mix(lane, wall, 0.9 * stuck * stuck);
          return (
            <g key={seed} opacity={cyc(u)}>
              <circle cx={x} cy={y} r={20} fill={d.c} opacity={0.18} />
              <circle cx={x} cy={y} r={9} fill={d.c} />
              <circle cx={x - 3} cy={y - 3} r={3} fill="#fff" opacity={0.7} />
            </g>
          );
        }),
      )}
    </g>
  );
};

/** Tinta hitam = campuran tiga zat warna (baris 4). */
const Legend: React.FC<{t: number; op: number}> = ({t, op}) => {
  if (op <= 0.001) return null;
  const ph = (((t / 3.2) % 1) + 1) % 1;
  const sp = ramp(ph, 0.1, 0.7, EASE_IN_OUT);
  return (
    <g opacity={op}>
      <Glow x={1450} y={500} r={320} color="spr" opacity={0.3} />
      <path d="M1250,420 C1290,480 1300,510 1300,535 A50,50 0 0 1 1200,535 C1200,510 1210,480 1250,420 Z" fill="#241b3c" stroke="#7a6ab0" strokeWidth={2.5} />
      <circle cx={1232} cy={525} r={8} fill="#fff" opacity={0.25} />
      <Label x={1250} y={630} size={26} color={C.muted}>
        tinta hitam
      </Label>
      <Arrow x1={1335} y1={520} x2={1445} y2={520} color="muted" width={4} />
      {DYES.map((d, i) => {
        const x = 1530 + i * 90;
        const y = 560 - d.rf * 200 * sp;
        return (
          <g key={i} opacity={cyc(ph) * 1.2}>
            <circle cx={x} cy={y} r={30} fill={d.c} opacity={0.2} />
            <circle cx={x} cy={y} r={18} fill={d.c} />
          </g>
        );
      })}
      <Label x={1620} y={630} size={26} color={C.ink}>
        3 zat warna
      </Label>
    </g>
  );
};
