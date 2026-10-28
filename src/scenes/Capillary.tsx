import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {EASE_IN_OUT, ramp, win} from '../anim';
import {Tank, WaterMolecule} from '../components/fluid';
import {Arrow, Formula, Frac, Glow, Label, Motes, Note, Ripple, Stage, Tint, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Kapilaritas: tiga pipa kaca dengan jari-jari berbeda di bak air (h ∝ 1/r), meniskus cekung,
// kaca pembesar: adhesi vs kohesi, sudut kontak θ, lalu diagram gaya (γ sepanjang 2πr vs berat kolom).
// h = 2γ cos θ/(ρ g r); r = 0,5 mm → h ≈ 2,9 cm. Raksa: θ > 90°, meniskus cembung, turun.

const useGT = () => {
  const f = useCurrentFrame();
  const {fps} = useScene();
  return f / fps;
};

const TK = {x: 140, yb: 850, w: 960, h: 210, level: 124};
const SURF = TK.yb - 6 - TK.level; // 720
const TUBE_TOP = 300;
const TUBE_BOT = 800;
const TUBES = [
  {x: 330, a: 9, h: 300, tau: 2.2},
  {x: 570, a: 18, h: 150, tau: 1.5},
  {x: 830, a: 34, h: 80, tau: 1.0},
];
const WALL = 6;

/** Busur meniskus antara (cx−a, yW) dan (cx+a, yW) dengan sudut kontak θ (derajat). */
const meniscus = (cx: number, a: number, yW: number, thetaDeg: number) => {
  const th = (thetaDeg * Math.PI) / 180;
  const c = Math.cos(th);
  if (Math.abs(c) < 0.02) return `M${cx - a},${yW} L${cx + a},${yW}`;
  const R = a / Math.abs(c);
  const sweep = c > 0 ? 0 : 1; // cekung (lewat bawah) vs cembung (lewat atas)
  return `M${cx - a},${yW} A${R.toFixed(2)},${R.toFixed(2)} 0 0 ${sweep} ${cx + a},${yW}`;
};
/** Titik terendah/tertinggi meniskus relatif yW (positif = ke bawah). */
const menDepth = (a: number, thetaDeg: number) => {
  const th = (thetaDeg * Math.PI) / 180;
  const c = Math.cos(th);
  if (Math.abs(c) < 0.02) return 0;
  const R = a / Math.abs(c);
  return Math.sign(c) * (R - R * Math.sin(th));
};

const GlassTube: React.FC<{x: number; a: number; y0: number; y1: number; opacity?: number}> = ({x, a, y0, y1, opacity = 1}) => (
  <g opacity={opacity}>
    <rect x={x - a - WALL} y={y0} width={WALL} height={y1 - y0} fill="#bfe3ff" fillOpacity={0.22} stroke="#cfeaff" strokeOpacity={0.8} strokeWidth={1.5} />
    <rect x={x + a} y={y0} width={WALL} height={y1 - y0} fill="#bfe3ff" fillOpacity={0.22} stroke="#cfeaff" strokeOpacity={0.8} strokeWidth={1.5} />
    <ellipse cx={x} cy={y0} rx={a + WALL} ry={Math.max(3, (a + WALL) * 0.25)} fill="none" stroke="#cfeaff" strokeOpacity={0.7} strokeWidth={1.5} />
    <line x1={x - a - WALL / 2} y1={y0 + 14} x2={x - a - WALL / 2} y2={y1 - 30} stroke="#fff" strokeOpacity={0.35} strokeWidth={2} />
  </g>
);

export const Capillary: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const gT = useGT();

  // pipa dicelupkan lalu air naik sendiri
  const dip = ramp(t, cue(0) + 0.2, cue(0) + 1.4, EASE_IN_OUT);
  const dy = -140 * (1 - dip);
  const tRise = wordOf(0, 'naik');
  const rise = (k: number) => {
    const tau = t - tRise;
    return tau <= 0 ? 0 : 1 - Math.exp(-tau / TUBES[k].tau);
  };
  const dimAll = 1 - 0.35 * ramp(t, cue(6) - 0.3, cue(6) + 0.6);

  // kaca pembesar (baris 1–3)
  const mag = win(t, cue(1) - 0.2, cue(4) - 0.3, 0.8, 0.7);
  const molV = win(t, cue(1) + 0.4, cue(3) - 0.2, 0.7, 0.6);
  const adh = ramp(t, wordOf(1, 'kaca') - 0.2, wordOf(1, 'kaca') + 0.6);
  const thetaP = win(t, cue(2) + 0.3, cue(3) - 0.2, 0.7, 0.6);
  const fbd = ramp(t, cue(3) + 0.1, cue(3) + 1.0);
  const ring = ramp(t, wordOf(3, 'keliling') - 0.2, wordOf(3, 'keliling') + 0.6);
  const up = ramp(t, wordOf(3, 'Komponen') - 0.2, wordOf(3, 'Komponen') + 0.6);
  const wcol = ramp(t, wordOf(3, 'berat') - 0.2, wordOf(3, 'berat') + 0.6);

  // rumus & angka (baris 4–5)
  const fOp = win(t, cue(4) + 0.2, cue(6) - 0.3, 0.8, 0.6);
  const hBr = win(t, cue(4) + 1.2, cue(6) - 0.3, 0.6, 0.6);
  const num = win(t, cue(5) + 0.3, cue(6) - 0.3, 0.7, 0.6);
  const plot = win(t, wordOf(5, 'sempit') - 0.4, cue(6) - 0.3, 0.7, 0.6);

  // raksa (baris 6)
  const hg = ramp(t, cue(6) - 0.1, cue(6) + 0.8);
  const hgDip = ramp(t, cue(6) + 0.5, cue(6) + 1.6, EASE_IN_OUT);
  const hgFall = ramp(t, cue(6) + 1.6, cue(6) + 3.4, EASE_IN_OUT);
  const hgTheta = ramp(t, wordOf(6, 'sudut') - 0.2, wordOf(6, 'sudut') + 0.6);
  const hgNote = ramp(t, cue(6) + 0.4, cue(6) + 1.2);

  // geometri sisipan
  const IX = 1480;
  const IY = 480;
  const IR = 220;
  const IA = 150;
  const IW = 430;
  const TH = 25;
  const thr = (TH * Math.PI) / 180;

  return (
    <AbsoluteFill>
      <Stage>
        <defs>
          <linearGradient id="cp-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.water} stopOpacity={0.75} />
            <stop offset="100%" stopColor={C.deep} stopOpacity={0.95} />
          </linearGradient>
          <linearGradient id="cp-hg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef2fa" />
            <stop offset="45%" stopColor="#a9b3c8" />
            <stop offset="100%" stopColor="#5d6680" />
          </linearGradient>
          <clipPath id="cp-inset">
            <circle cx={IX} cy={IY} r={IR} />
          </clipPath>
        </defs>

        {/* ===== bak air & pipa ===== */}
        <g opacity={dimAll}>
          <Tank x={TK.x} y={TK.yb} w={TK.w} h={TK.h} level={TK.level} seed={5} bubbles={4} />
          {TUBES.map((tb, k) => {
            const hh = tb.h * rise(k) + 2 * Math.sin(gT * 2 + k) * rise(k);
            const md = menDepth(tb.a, 8);
            const yW = SURF - hh - md * 0.3;
            const colTop = yW;
            return (
              <g key={k} transform={`translate(0 ${dy})`}>
                {/* kolom air di dalam pipa */}
                <path d={`${meniscus(tb.x, tb.a, colTop, 8)} L${tb.x + tb.a},${TUBE_BOT} L${tb.x - tb.a},${TUBE_BOT} Z`} fill="url(#cp-water)" />
                <path d={meniscus(tb.x, tb.a, colTop, 8)} fill="none" stroke="#cfeaff" strokeWidth={2} />
                {/* meniskus luar kecil di dinding */}
                <path d={`M${tb.x - tb.a - WALL - 16},${SURF - dy} Q${tb.x - tb.a - WALL - 3},${SURF - dy - 1} ${tb.x - tb.a - WALL},${SURF - dy - 9}`} fill="none" stroke="#cfeaff" strokeWidth={2} opacity={dip} />
                <path d={`M${tb.x + tb.a + WALL + 16},${SURF - dy} Q${tb.x + tb.a + WALL + 3},${SURF - dy - 1} ${tb.x + tb.a + WALL},${SURF - dy - 9}`} fill="none" stroke="#cfeaff" strokeWidth={2} opacity={dip} />
                <GlassTube x={tb.x} a={tb.a} y0={TUBE_TOP} y1={TUBE_BOT} />
                <Glow x={tb.x} y={colTop} r={50 + tb.a} color="cyan" opacity={0.5 * rise(k) * (1 - rise(k)) * 4 * 0.6} />
              </g>
            );
          })}
          <Ripple x={570} y={SURF} p={ramp(t, cue(0) + 1.0, cue(0) + 2.4, (q) => q)} r={340} color="water" />
          {/* panah naik saat air memanjat */}
          {TUBES.map((tb, k) => {
            const v = rise(k) * (1 - rise(k)) * 4;
            return (
              <g key={k} opacity={Math.min(1, v) * dip}>
                <Arrow x1={tb.x + tb.a + 34} y1={SURF - tb.h * rise(k) + 70} x2={tb.x + tb.a + 34} y2={SURF - tb.h * rise(k) + 10} color="cyan" width={4} pulse={false} />
              </g>
            );
          })}
          <Label x={TUBES[0].x} y={TUBE_TOP - 34} size={24} color={C.muted} opacity={dip * (1 - num)}>
            sempit
          </Label>
          <Label x={TUBES[2].x} y={TUBE_TOP - 34} size={24} color={C.muted} opacity={dip}>
            lebar
          </Label>
          {/* tinggi h pada pipa sempit */}
          <g opacity={hBr}>
            <line x1={TUBES[0].x - 46} y1={SURF} x2={TUBES[0].x - 46} y2={SURF - TUBES[0].h} stroke={C.gold} strokeWidth={3} />
            <line x1={TUBES[0].x - 58} y1={SURF} x2={TUBES[0].x - 34} y2={SURF} stroke={C.gold} strokeWidth={3} />
            <line x1={TUBES[0].x - 58} y1={SURF - TUBES[0].h} x2={TUBES[0].x - 34} y2={SURF - TUBES[0].h} stroke={C.gold} strokeWidth={3} />
            <Label x={TUBES[0].x - 66} y={SURF - TUBES[0].h / 2} size={30} color={C.gold} anchor="end" weight={700} font="serif" italic>
              h
            </Label>
            <Label x={TUBES[0].x - 66} y={SURF - TUBES[0].h / 2 + 42} size={26} color={C.gold} anchor="end" weight={700} opacity={num / Math.max(0.001, hBr)}>
              ≈ 2,9 cm
            </Label>
          </g>
          <Label x={TUBES[0].x} y={TUBE_TOP - 34} size={24} color={C.cyan} weight={700} opacity={num}>
            r = 0,5 mm · θ ≈ 0
          </Label>
          <Twinkles x={TUBES[0].x - 110} y={SURF - TUBES[0].h / 2 + 30} rx={50} ry={50} n={3} opacity={num} seed={3} />
          {/* lingkar sumber kaca pembesar */}
          <g opacity={mag}>
            <circle cx={TUBES[0].x} cy={SURF - TUBES[0].h + dy} r={40} fill="none" stroke={C.gold} strokeWidth={3} />
            <line x1={TUBES[0].x + 40} y1={SURF - TUBES[0].h + dy} x2={IX - IR} y2={IY} stroke={C.gold} strokeWidth={2} strokeDasharray="8 8" strokeDashoffset={-t * 14} opacity={0.7} />
          </g>
        </g>

        {/* ===== sisipan perbesaran ===== */}
        <g opacity={mag}>
          <circle cx={IX} cy={IY} r={IR + 6} fill="#0a1228" stroke={C.gold} strokeWidth={4} />
          <g clipPath="url(#cp-inset)">
            <path d={`${meniscus(IX, IA, IW, TH)} L${IX + IA},${IY + IR + 10} L${IX - IA},${IY + IR + 10} Z`} fill="url(#cp-water)" />
            <path d={meniscus(IX, IA, IW, TH)} fill="none" stroke="#cfeaff" strokeWidth={3} />
            {/* dinding kaca */}
            {[-1, 1].map((sgn) => (
              <g key={sgn}>
                <rect x={sgn < 0 ? IX - IA - 70 : IX + IA} y={IY - IR - 10} width={70} height={2 * IR + 20} fill="#bfe3ff" fillOpacity={0.16} />
                <line x1={IX + sgn * IA} y1={IY - IR} x2={IX + sgn * IA} y2={IY + IR} stroke="#cfeaff" strokeWidth={3} />
                {Array.from({length: 9}, (_, i) => (
                  <line key={i} x1={IX + sgn * (IA + 8)} y1={IY - IR + 20 + i * 50} x2={IX + sgn * (IA + 40)} y2={IY - IR + 50 + i * 50} stroke="#cfeaff" strokeOpacity={0.3} strokeWidth={2} />
                ))}
              </g>
            ))}
            <Label x={IX + IA + 36} y={IY - 150} size={22} color={C.muted}>
              kaca
            </Label>
            {/* molekul: adhesi (ke kaca) vs kohesi (ke sesama) */}
            <g opacity={molV}>
              {[
                [IX - 60, 560],
                [IX + 40, 590],
                [IX - 110, 640],
                [IX + 90, 650],
                [IX - 10, 660],
              ].map(([x, y], i) => (
                <WaterMolecule key={i} x={x + 5 * Math.sin(gT * 2 + i)} y={y + 4 * Math.sin(gT * 1.7 + i * 2)} s={0.75} rot={25 * Math.sin(gT * 1.1 + i)} opacity={0.75} />
              ))}
              <WaterMolecule x={IX + IA - 34} y={IW + 44 + 3 * Math.sin(gT * 2.4)} s={0.85} rot={-60 + 10 * Math.sin(gT * 1.5)} />
              <g opacity={adh}>
                <Arrow x1={IX + IA - 20} y1={IW + 44} x2={IX + IA + 50} y2={IW + 44} color="gold" width={6} pulse={false} />
                <Label x={IX + IA - 50} y={IW - 26} size={24} color={C.gold} weight={700}>
                  adhesi
                </Label>
                <Arrow x1={IX + IA - 50} y1={IW + 50} x2={IX + IA - 86} y2={IW + 62} color="cyan" width={5} pulse={false} />
                <Label x={IX + IA - 120} y={IW + 92} size={24} color={C.cyan} weight={700}>
                  kohesi
                </Label>
              </g>
            </g>
            {/* sudut kontak θ */}
            <g opacity={thetaP}>
              <line x1={IX + IA} y1={IW} x2={IX + IA - Math.sin(thr) * 170} y2={IW + Math.cos(thr) * 170} stroke={C.ink} strokeWidth={2.5} strokeDasharray="8 6" />
              <path
                d={`M${IX + IA},${IW + 90} A90,90 0 0 1 ${IX + IA - Math.sin(thr) * 90},${IW + Math.cos(thr) * 90}`}
                fill="none"
                stroke={C.gold}
                strokeWidth={4}
              />
              <Label x={IX + IA - 26} y={IW + 122} size={34} color={C.gold} weight={700} font="serif" italic>
                θ
              </Label>
              <circle cx={IX + IA} cy={IW} r={6} fill={C.gold} />
            </g>
            {/* diagram gaya: γ sepanjang keliling 2πr vs berat kolom */}
            <g opacity={fbd}>
              <ellipse cx={IX} cy={IW} rx={IA} ry={26} fill="none" stroke={C.cyan} strokeWidth={5} opacity={ring} />
              <ellipse cx={IX} cy={IW} rx={IA} ry={26} fill="none" stroke={C.cyan} strokeOpacity={0.25} strokeWidth={16} opacity={ring} />
              {Array.from({length: 8}, (_, i) => {
                const ph = (((gT * 0.25 + i / 8) % 1) + 1) % 1;
                const ang = ph * 2 * Math.PI;
                return <circle key={i} cx={IX + IA * Math.cos(ang)} cy={IW + 26 * Math.sin(ang)} r={5} fill="#fff" opacity={ring * (0.4 + 0.6 * (Math.sin(ang) > 0 ? 1 : 0.4))} />;
              })}
              <Label x={IX} y={IW - 60} size={30} color={C.cyan} weight={700} opacity={ring}>
                keliling 2πr
              </Label>
              {[-1, 1].map((sgn) => (
                <g key={sgn} opacity={up}>
                  <Arrow x1={IX + sgn * IA} y1={IW} x2={IX + sgn * (IA + Math.sin(thr) * 20)} y2={IW - 110} color="cyan" width={6} pulse={false} />
                  <Label x={IX + sgn * (IA - 40)} y={IW - 100} size={30} color={C.cyan} weight={700} font="serif" italic>
                    γ
                  </Label>
                </g>
              ))}
              <g opacity={wcol}>
                <Glow x={IX} y={IY + 140} r={130} color="force" opacity={0.4} />
                <Arrow x1={IX} y1={IY + 70} x2={IX} y2={IY + 190} color="force" width={7} />
                <Label x={IX - 24} y={IY + 130} size={26} color={C.force} anchor="end" weight={700}>
                  berat kolom
                </Label>
              </g>
            </g>
          </g>
          <circle cx={IX} cy={IY} r={IR} fill="none" stroke="#fff" strokeOpacity={0.15} strokeWidth={10} />
        </g>

        {/* ===== grafik h terhadap r ===== */}
        <g opacity={plot}>
          {(() => {
            const ox = 1250;
            const oy = 850;
            const pw = 480;
            const ph = 190;
            const hx = (r: number) => ox + (r / 4) * pw;
            const hy = (h: number) => oy - (h / 3) * ph;
            const pts: string[] = [];
            for (let i = 0; i <= 60; i++) {
              const r = 0.34 + (i / 60) * 3.6;
              pts.push(`${i ? 'L' : 'M'}${hx(r).toFixed(1)},${hy(1 / r).toFixed(1)}`);
            }
            const rm = 1.6 + 1.3 * Math.sin(gT * 0.7);
            return (
              <g>
                <line x1={ox} y1={oy} x2={ox + pw + 20} y2={oy} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
                <line x1={ox} y1={oy} x2={ox} y2={oy - ph - 20} stroke={C.muted} strokeWidth={2.5} markerEnd="url(#arrow-muted)" />
                <Label x={ox + pw + 30} y={oy} size={26} color={C.ink} anchor="start" font="serif" italic>
                  r
                </Label>
                <Label x={ox - 18} y={oy - ph - 10} size={26} color={C.gold} anchor="end" font="serif" italic>
                  h
                </Label>
                <path d={pts.join(' ')} fill="none" stroke={C.gold} strokeWidth={4} />
                {[1, 2, 3.8].map((r, i) => (
                  <circle key={i} cx={hx(r)} cy={hy(1 / r)} r={7} fill={C.cyan} stroke="#fff" strokeWidth={1.5} />
                ))}
                <circle cx={hx(rm)} cy={hy(1 / rm)} r={14} fill="url(#soft-gold)" />
                <circle cx={hx(rm)} cy={hy(1 / rm)} r={5} fill="#fff" />
                <Label x={ox + pw - 10} y={oy - ph + 20} size={22} color={C.muted} anchor="end">
                  makin sempit → makin tinggi
                </Label>
              </g>
            );
          })()}
        </g>

        {/* ===== raksa ===== */}
        <g opacity={hg}>
          {(() => {
            const dx0 = 1230;
            const dw = 520;
            const ys = 650;
            const yb = 850;
            const cx = 1490;
            const a = 60;
            const tubeDy = -60 * (1 - hgDip);
            const depress = 90 * hgFall;
            const yW = ys + depress + 4 * Math.sin(gT * 1.5) * hgFall * 0.3;
            const th = 140;
            const thR = (th * Math.PI) / 180;
            const tanx = -Math.sin(thR);
            const tany = Math.cos(thR);
            const ang0 = Math.PI / 2;
            const ang1 = Math.atan2(tany, tanx) + 2 * Math.PI; // ≈ 230°
            const rA = 46;
            const p0 = [cx + a + rA * Math.cos(ang0), yW + rA * Math.sin(ang0)];
            const p1 = [cx + a + rA * Math.cos(ang1), yW + rA * Math.sin(ang1)];
            const wave = (x: number) => ys + 1.5 * Math.sin(x * 0.04 + gT * 2);
            const surf = Array.from({length: 23}, (_, i) => {
              const x = dx0 + (i / 22) * dw;
              const near = Math.max(0, 1 - Math.abs(Math.abs(x - cx) - a - 6) / 26) * hgDip;
              return `${i ? 'L' : 'M'}${x.toFixed(1)},${(wave(x) + 7 * near).toFixed(1)}`;
            }).join(' ');
            return (
              <g>
                <ellipse cx={dx0 + dw / 2} cy={yb + 8} rx={dw * 0.55} ry={12} fill="#000" opacity={0.35} />
                <path d={`${surf} L${dx0 + dw},${yb} L${dx0},${yb} Z`} fill="url(#cp-hg)" />
                <path d={surf} fill="none" stroke="#fff" strokeOpacity={0.7} strokeWidth={2} />
                {[0, 1, 2].map((i) => {
                  const xx = dx0 + 40 + ((((gT * 0.04 + i * 0.33) % 1) + 1) % 1) * (dw - 80);
                  return <ellipse key={i} cx={xx} cy={ys + 40 + i * 22} rx={40} ry={4} fill="#fff" opacity={0.18} />;
                })}
                <path d={`M${dx0 - 6},${ys - 70} L${dx0 - 6},${yb + 6} L${dx0 + dw + 6},${yb + 6} L${dx0 + dw + 6},${ys - 70}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={6} strokeLinejoin="round" />
                <g transform={`translate(0 ${tubeDy})`}>
                  {/* raksa di dalam pipa: lebih rendah, meniskus cembung */}
                  <rect x={cx - a} y={380} width={2 * a} height={Math.max(0, Math.min(yb - 6 - 380, yW - tubeDy - 380 + 30))} fill="#0a1228" opacity={0.92} />
                  <path d={`${meniscus(cx, a, yW - tubeDy, th)} L${cx + a},${yb - tubeDy - 4} L${cx - a},${yb - tubeDy - 4} Z`} fill="url(#cp-hg)" />
                  <path d={meniscus(cx, a, yW - tubeDy, th)} fill="none" stroke="#fff" strokeWidth={2} />
                  <GlassTube x={cx} a={a} y0={380} y1={yb - 6} />
                </g>
                {/* level luar sebagai acuan */}
                <g opacity={hgFall}>
                  <line x1={cx - a - 40} y1={ys} x2={cx + a + 40} y2={ys} stroke={C.ink} strokeWidth={2} strokeDasharray="8 6" strokeDashoffset={-t * 10} />
                  <Arrow x1={cx - 20} y1={ys + 4} x2={cx - 20} y2={yW - 22} color="heat" width={5} pulse={false} />
                  <Label x={cx - a - 24} y={ys - 34} size={28} color={C.heat} anchor="end" weight={700}>
                    turun ↓
                  </Label>
                </g>
                <g opacity={hgTheta}>
                  <line x1={cx + a} y1={yW} x2={cx + a + tanx * 80} y2={yW + tany * 80} stroke={C.ink} strokeWidth={2.5} strokeDasharray="6 5" />
                  <path d={`M${p0[0].toFixed(1)},${p0[1].toFixed(1)} A${rA},${rA} 0 0 1 ${p1[0].toFixed(1)},${p1[1].toFixed(1)}`} fill="none" stroke={C.gold} strokeWidth={4} />
                  <circle cx={cx + a} cy={yW} r={5} fill={C.gold} />
                  <Label x={cx + a + 24} y={ys - 110} size={30} color={C.gold} anchor="start" weight={700} font="serif">
                    θ &gt; 90°
                  </Label>
                  <line x1={cx + a + 40} y1={ys - 92} x2={cx + a - 14} y2={yW + 26} stroke={C.gold} strokeWidth={2} opacity={0.6} />
                </g>
                <text x={dx0 + dw - 30} y={yb - 26} textAnchor="end" fontFamily={FONT.head} fontWeight={700} fontSize={28} fill="#1a2236">
                  raksa
                </text>
              </g>
            );
          })()}
        </g>
        <Motes x={600} y={520} rx={460} ry={260} n={22} color="cyan" opacity={0.35} seed={4} />
      </Stage>

      <Formula
        x={1480}
        y={330}
        p={fOp}
        accent={C.cyan}
        size={64}
        caption={
          <span>
            dari keseimbangan: <Tint c={C.cyan}>γ cos θ · 2πr</Tint> = <Tint c={C.force}>ρ g πr²h</Tint>
          </span>
        }
      >
        <V>h</V> ={' '}
        <Frac
          n={
            <>
              2<V color={C.cyan}>γ</V> cos <V>θ</V>
            </>
          }
          d={
            <>
              <V color={C.spr}>ρ</V>
              <V>g</V> <V>r</V>
            </>
          }
        />
      </Formula>
      <Note x={1480} y={545} p={num} color={C.gold} size={34}>
        <span style={{fontFamily: FONT.serif}}>
          <V>h</V> = <Frac n="2 · 0,072" d="1000 · 10 · 0,0005" size={0.78} /> ≈ <Tint c={C.gold}>2,9 cm</Tint>
        </span>
      </Note>
      <Note x={1480} y={290} p={hgNote} color="#c9d2e6" size={28}>
        raksa: lebih tertarik pada <Tint c={C.cyan}>sesamanya</Tint>
      </Note>
    </AbsoluteFill>
  );
};

