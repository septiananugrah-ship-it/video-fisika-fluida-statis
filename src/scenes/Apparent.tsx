import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, ramp, win} from '../anim';
import {wavePath} from '../components/fluid';
import {SpringV, fmt} from '../components/physics';
import {Arrow, Badge, Formula, Frac, Glow, Label, Motes, Ripple, Stage, Stream, Sub, Sup, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Neraca pegas + aluminium 1 kg (ρ = 2700 → V = 3,70×10⁻⁴ m³). Di udara T = 10 N; tercelup fraksi f:
// F_A = ρ_air g V f = 3,70·f N, T = 10 − 3,70·f → 6,30 N saat tercelup penuh.
// Pegas: 22 px per newton, jadi balok ikut naik 81 px saat T turun (fisis: pegas memendek).
// Gelas di atas dongkrak gunting naik; tinggi gelas tidak menentukan T (hanya fraksi tercelup).

const HX = 600; // sumbu neraca
const KPX = 22; // px per N
const BW = 110; // sisi balok
const BKW = 260; // lebar dalam gelas
const DEPTH = 190; // kedalaman air gelas (tanpa balok)
const JBASE = 860;

/** Dongkrak gunting: lengan sepanjang L, lebar menyesuaikan tinggi (geometri nyata). */
const Jack: React.FC<{top: number}> = ({top}) => {
  const L = 150;
  const H = Math.max(16, JBASE - 14 - top - 12);
  const h = H / 2;
  const w = Math.sqrt(Math.max(0, L * L - h * h));
  const y0 = top + 12;
  return (
    <g>
      <rect x={HX - 170} y={JBASE - 14} width={340} height={16} rx={5} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
      {[0, 1].map((k) => {
        const ya = y0 + k * h;
        const yb = ya + h;
        return (
          <g key={k} stroke="#5d6a93" strokeWidth={8} strokeLinecap="round">
            <line x1={HX - w} y1={ya} x2={HX + w} y2={yb} />
            <line x1={HX + w} y1={ya} x2={HX - w} y2={yb} />
          </g>
        );
      })}
      <circle cx={HX} cy={y0 + h / 2} r={6} fill={C.muted} />
      <circle cx={HX} cy={y0 + 1.5 * h} r={6} fill={C.muted} />
      <rect x={HX - 150} y={top} width={300} height={12} rx={4} fill="#3b466e" stroke={C.muted} strokeWidth={2} />
    </g>
  );
};

/** Ikon benda berbentuk rumit (batu, mahkota) untuk trik massa jenis. */
const Odd: React.FC<{x: number; y: number; kind: 'rock' | 'crown'; t: number; opacity: number}> = ({x, y, kind, t, opacity}) =>
  opacity <= 0.001 ? null : (
    <g opacity={opacity} transform={`translate(${x} ${y + 4 * Math.sin(t * 1.5 + x)}) rotate(${3 * Math.sin(t * 1.1 + x)})`}>
      {kind === 'rock' ? (
        <path d="M-50,10 L-38,-28 L-8,-44 L30,-34 L52,-6 L40,30 L4,42 L-34,34 Z" fill="#6f7a99" stroke="#c9d2ee" strokeWidth={3} strokeLinejoin="round" />
      ) : (
        <path d="M-52,30 L-52,-10 L-30,12 L-14,-34 L0,8 L14,-34 L30,12 L52,-10 L52,30 Z" fill={C.gold} stroke="#fff1c4" strokeWidth={3} strokeLinejoin="round" />
      )}
      <circle cx={-14} cy={-6} r={6} fill="#fff" opacity={0.25} />
    </g>
  );

export const Apparent: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  // ---------- gerak celup ----------
  const inA = ramp(t, -0.5, 0.8);
  const dip1 = ramp(t, cue(1) + 0.2, cueEnd(1) + 0.6, EASE_IN_OUT);
  // baris 5: timbang di udara (gelas turun) lalu di air (gelas naik lagi)
  const out5 = ramp(t, wordOf(5, 'udara') - 0.6, wordOf(5, 'udara') + 0.6, EASE_IN_OUT);
  const in5 = ramp(t, wordOf(5, 'air') - 0.6, wordOf(5, 'air') + 0.6, EASE_IN_OUT);
  const u = -0.3 + 1.55 * dip1 - 1.55 * out5 + 1.55 * in5;
  const f = Math.max(0, Math.min(1, u));
  const FA = 3.7 * f;
  const T = 10 - FA;
  const ptrY = 200 + KPX * T; // penunjuk neraca
  const hookY = ptrY + 56;
  const sway = (1.6 - 1.2 * f) * Math.sin(t * 1.15);
  const bTop = hookY + 34;
  const bBot = bTop + BW;
  const ys = bBot - BW * u - 2; // permukaan air relatif balok
  const rise = (BW * BW * f) / BKW;
  const glassBot = ys + rise + DEPTH;
  const glassTop = Math.min(ys - 40, glassBot - DEPTH - 70);
  const contact = cue(1) + 0.2 + (cueEnd(1) + 0.4 - cue(1)) * (0.3 / 1.55);

  // ---------- narasi ----------
  const wLab = win(t, cue(0) + 0.6, cue(2), 0.6, 0.6);
  const read10 = ramp(t, wordOf(0, 'sepuluh') - 0.3, wordOf(0, 'sepuluh') + 0.4);
  const f0 = win(t, wordOf(0, 'sepuluh') - 0.2, cue(2) - 0.2, 0.6, 0.5);
  const buoyVis = ramp(t, contact, contact + 0.4);
  const f2 = win(t, cue(2) + 0.2, cue(4) - 0.2, 0.6, 0.5);
  const f2b = ramp(t, wordOf(2, 'gaya') - 0.3, wordOf(2, 'gaya') + 0.5);
  const semu = win(t, wordOf(3, 'enam') - 0.3, cue(5) - 0.2, 0.5, 0.5);
  const semuB = ramp(t, wordOf(3, 'semu') - 0.3, wordOf(3, 'semu') + 0.4);
  const fbd = win(t, cue(4) + 0.1, cue(5) - 0.1, 0.7, 0.5);
  const massB = ramp(t, wordOf(4, 'Massanya') - 0.3, wordOf(4, 'Massanya') + 0.5);
  const help = ramp(t, wordOf(4, 'membantu') - 0.4, wordOf(4, 'membantu') + 0.5);
  const f5 = ramp(t, cue(5) + 0.2, cue(5) + 0.9);
  const f5b = ramp(t, wordOf(5, 'selisihnya') - 0.3, wordOf(5, 'selisihnya') + 0.5);
  const odd = ramp(t, wordOf(5, 'rumit') - 0.4, wordOf(5, 'rumit') + 0.5);
  const chipAir = ramp(t, wordOf(5, 'udara') - 0.2, wordOf(5, 'udara') + 0.5);
  const chipWater = ramp(t, wordOf(5, 'air') + 0.2, wordOf(5, 'air') + 0.9);
  const glassIn = ramp(t, cue(0) + 1.2, cue(0) + 2.2);

  return (
    <AbsoluteFill>
      <Stage>
        <g opacity={inA}>
          {/* statif */}
          <rect x={250} y={JBASE - 12} width={180} height={18} rx={6} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
          <rect x={330} y={170} width={14} height={JBASE - 180} rx={5} fill="#3b466e" />
          <rect x={330} y={170} width={HX - 330 + 30} height={14} rx={5} fill="#3b466e" />
          <circle cx={HX} cy={186} r={8} fill={C.muted} />

          {/* neraca pegas */}
          <rect x={HX - 38} y={192} width={76} height={268} rx={14} fill="#16224a" stroke={C.ink} strokeOpacity={0.55} strokeWidth={3} />
          <rect x={HX - 30} y={196} width={10} height={256} rx={5} fill="#fff" opacity={0.07} />
          <SpringV x={HX} ya={198} yb={ptrY} coils={11} amp={14} width={3.5} color={C.spr} />
          {Array.from({length: 11}, (_, k) => (
            <g key={k}>
              <line x1={HX - 38} y1={200 + KPX * k} x2={HX - 38 + (k % 5 === 0 ? 16 : 9)} y2={200 + KPX * k} stroke={C.ink} strokeWidth={2} />
              {k % 2 === 0 ? (
                <Label x={HX - 50} y={200 + KPX * k} size={20} font="mono" color={C.muted} anchor="end">
                  {String(k)}
                </Label>
              ) : null}
            </g>
          ))}
          <Label x={HX - 50} y={174 + 0} size={18} font="mono" color={C.muted} anchor="end">
            N
          </Label>
          <rect x={HX - 34} y={ptrY - 3} width={68} height={6} rx={3} fill={C.press} />
          <circle cx={HX + 30} cy={ptrY} r={12} fill="url(#soft-press)" />
          <line x1={HX} y1={ptrY} x2={HX} y2={hookY - 10} stroke={C.muted} strokeWidth={5} />
          <path d={`M${HX},${hookY - 10} q0,14 -10,14 q-10,0 -10,-8`} fill="none" stroke={C.muted} strokeWidth={4} />
          {/* pembacaan digital */}
          <g>
            <rect x={690} y={222} width={230} height={84} rx={14} fill="rgba(10,16,36,0.85)" stroke={C.press} strokeOpacity={0.7} strokeWidth={2} />
            <Label x={805} y={250} size={18} color={C.muted}>
              neraca membaca
            </Label>
            <Label x={805} y={282} size={36} font="mono" color={C.press} weight={600}>
              {`${fmt(T, 2)} N`}
            </Label>
            <line x1={690} y1={264} x2={HX + 40} y2={ptrY} stroke={C.press} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="4 6" />
          </g>
          <Glow x={805} y={264} r={160} color="press" opacity={0.5 * Math.max(semu, read10 * (1 - dip1))} />
          <Twinkles x={805} y={264} rx={130} ry={50} n={4} color="press" opacity={semu} />

          {/* gelas + air (di belakang/menyelubungi balok) */}
          <g opacity={glassIn}>
            <Jack top={glassBot + 6} />
            <path d={`${wavePath(HX - BKW / 2, HX + BKW / 2, ys, t, 2.5 + 2 * ramp(t, contact, contact + 0.3) * (1 - ramp(t, contact + 0.8, contact + 2.5)), 0.05, 1)} L${HX + BKW / 2},${glassBot} L${HX - BKW / 2},${glassBot} Z`} fill={C.water} opacity={0.32} />
          </g>

          {/* balok aluminium (berayun halus) */}
          <g transform={`rotate(${sway} ${HX} ${hookY})`}>
            <line x1={HX} y1={hookY} x2={HX} y2={bTop} stroke="#c9d2ee" strokeWidth={2.5} />
            <rect x={HX - BW / 2} y={bTop} width={BW} height={BW} rx={8} fill="#aeb8cf" stroke="#eef3ff" strokeWidth={3} />
            <rect x={HX - BW / 2 + 8} y={bTop + 8} width={BW - 16} height={14} rx={6} fill="#fff" opacity={0.35} />
            <path d={`M${HX - BW / 2 + 10},${bTop + BW - 14} L${HX + BW / 2 - 10},${bTop + BW - 14}`} stroke="#6f7a99" strokeWidth={3} opacity={0.5} />
            <Label x={HX} y={bTop + BW / 2 + 6} size={24} color="#1a2550" weight={700}>
              Al
            </Label>
          </g>

          {/* air di depan balok (bagian tercelup tampak di dalam air) */}
          <g opacity={glassIn}>
            <defs>
              <linearGradient id="app-w" gradientUnits="userSpaceOnUse" x1="0" y1={ys} x2="0" y2={glassBot}>
                <stop offset="0%" stopColor={C.water} stopOpacity={0.45} />
                <stop offset="100%" stopColor={C.deep} stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <path d={`${wavePath(HX - BKW / 2, HX + BKW / 2, ys, t, 2.5, 0.05, 1)} L${HX + BKW / 2},${glassBot} L${HX - BKW / 2},${glassBot} Z`} fill="url(#app-w)" />
            <path d={wavePath(HX - BKW / 2, HX + BKW / 2, ys, t, 2.5, 0.05, 1)} fill="none" stroke="#cfeaff" strokeWidth={2.5} strokeOpacity={0.85} />
            {Array.from({length: 5}, (_, k) => {
              const ph = (((t * (0.2 + 0.04 * k) + k * 0.29) % 1) + 1) % 1;
              const bx = HX - BKW / 2 + 20 + ((k * 0.618) % 1) * (BKW - 40) + 4 * Math.sin(t * 2 + k);
              return <circle key={k} cx={bx} cy={glassBot - 8 - ph * (glassBot - ys - 16)} r={2.5 + (k % 2)} fill="#fff" opacity={0.35 * Math.min(1, ph * 6) * (1 - ph)} />;
            })}
            <path d={`M${HX - BKW / 2 - 4},${glassTop} L${HX - BKW / 2 - 4},${glassBot + 4} L${HX + BKW / 2 + 4},${glassBot + 4} L${HX + BKW / 2 + 4},${glassTop}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={5} strokeLinejoin="round" />
            <line x1={HX - BKW / 2 + 10} y1={glassTop + 14} x2={HX - BKW / 2 + 10} y2={glassBot - 10} stroke="#fff" strokeOpacity={0.12} strokeWidth={5} strokeLinecap="round" />
            <Ripple x={HX} y={ys} p={ramp(t, contact - 0.05, contact + 1.1)} r={150} color="water" />
          </g>

          {/* gaya pada balok */}
          <g opacity={wLab}>
            <Arrow x1={HX + 80} y1={bTop + BW / 2} x2={HX + 80} y2={bTop + BW / 2 + 10 * 10} color="force" width={6} />
            <Label x={HX + 100} y={bTop + BW / 2 + 70} size={26} color={C.force} weight={600} anchor="start">
              <tspan fontFamily={FONT.serif} fontStyle="italic">mg</tspan> = 10 N
            </Label>
          </g>
          <g opacity={buoyVis * (1 - fbd)}>
            <Arrow x1={HX - 80} y1={bTop + BW / 2 + 40} x2={HX - 80} y2={bTop + BW / 2 + 40 - FA * 26} color="buoy" width={7} />
            <Label x={HX - 100} y={bTop + BW / 2 + 10 - FA * 13} size={26} color={C.buoy} weight={600} anchor="end">
              <tspan fontFamily={FONT.serif} fontStyle="italic">F</tspan>
              <tspan baselineShift="sub" fontSize="0.65em">A</tspan>
              {` ${fmt(FA, 2)} N`}
            </Label>
          </g>
          <Stream
            pts={[
              [HX - 110, glassBot - 20],
              [HX - 80, bBot + 6],
              [HX, bBot + 4],
            ]}
            color="buoy"
            n={6}
            speed={0.5}
            r={4}
            jitter={3}
            opacity={help * fbd * f}
          />
          <Motes x={HX} y={bTop + BW / 2} rx={170} ry={150} n={12} color="cyan" opacity={0.35} seed={9} />

          {/* diagram benda bebas */}
          <g opacity={fbd}>
            <rect x={1250} y={460} width={400} height={400} rx={18} fill="rgba(10,16,36,0.78)" stroke={C.line} strokeWidth={2} />
            <Label x={1450} y={490} size={22} color={C.muted}>
              diagram benda bebas
            </Label>
            <rect x={1405} y={600} width={90} height={90} rx={8} fill="#aeb8cf" stroke="#eef3ff" strokeWidth={3} />
            <Arrow x1={1430} y1={600} x2={1430} y2={600 - 6.3 * 20} color="ink" width={6} />
            <Label x={1414} y={540} size={26} font="serif" italic color={C.ink} anchor="end">
              T
            </Label>
            <Arrow x1={1475} y1={645} x2={1475} y2={645 - 3.7 * 20} color="buoy" width={6} />
            <Label x={1492} y={590} size={26} font="serif" italic color={C.buoy} anchor="start">
              <tspan>F</tspan>
              <tspan baselineShift="sub" fontSize="0.65em">A</tspan>
            </Label>
            <Arrow x1={1450} y1={690} x2={1450} y2={690 + 10 * 14} color="force" width={6} />
            <Label x={1470} y={800} size={26} font="serif" italic color={C.force} anchor="start">
              mg
            </Label>
            <Label x={1300} y={640} size={22} font="mono" color={C.ink} anchor="start">
              6,30 N
            </Label>
            <Label x={1610} y={640} size={22} font="mono" color={C.buoy} anchor="end">
              3,70 N
            </Label>
            <Label x={1580} y={800} size={22} font="mono" color={C.force} anchor="start">
              10 N
            </Label>
          </g>
          <Odd x={1250} y={720} kind="rock" t={t} opacity={odd} />
          <Odd x={1420} y={720} kind="crown" t={t} opacity={odd} />
          <Label x={1335} y={800} size={24} color={C.muted} opacity={odd}>
            bentuk rumit? volumenya tetap terukur
          </Label>
        </g>
      </Stage>

      <Badge x={330} y={300} text="aluminium 1 kg" color={C.ink} size={24} opacity={inA * ramp(t, cue(0) + 0.4, cue(0) + 1.0) * (1 - massB)} />
      <Badge x={330} y={300} text="massa tetap 1 kg" color={C.gold} size={26} opacity={massB} scale={0.9 + 0.1 * ramp(t, wordOf(4, 'Massanya') - 0.3, wordOf(4, 'Massanya') + 0.4, BACK)} />
      <Formula x={1400} y={300} p={f0} accent={C.force} size={60}>
        <V>W</V> = <V>mg</V> = 1 · 10 = <span style={{color: C.force}}>10 N</span>
      </Formula>
      <Formula x={1400} y={310} p={f2} accent={C.buoy} size={56}>
        <V>V</V> = <Frac n="1" d="2700" /> m³ ≈ 3,70×10<Sup>−4</Sup> m³
        <div style={{fontSize: 46, opacity: f2b, marginTop: 6}}>
          <V color="buoy">F</V>
          <Sub color={C.buoy}>A</Sub> = 1000 · 10 · <V>V</V> = <span style={{color: C.buoy}}>3,70 N</span>
        </div>
      </Formula>
      <Badge x={1400} y={560} text={<span>berat semu = 10 − 3,70 = 6,30 N</span>} color={C.press} size={30} opacity={semuB * semu} scale={0.92 + 0.08 * semuB} />
      <Formula x={1450} y={300} p={fbd} accent={C.ink} size={60}>
        <V>T</V> + <V color="buoy">F</V>
        <Sub color={C.buoy}>A</Sub> = <V color="force">mg</V>
      </Formula>
      <Badge x={1180} y={600} text="air ikut menopang" color={C.buoy} size={24} opacity={help * fbd} />
      <Formula x={1400} y={330} p={f5} accent={C.spr} size={56}>
        <V>V</V> = <Frac n={<span>W<Sub>udara</Sub> − W<Sub>air</Sub></span>} d={<span>ρ<Sub>air</Sub> g</span>} />
        <div style={{fontSize: 40, fontFamily: FONT.mono, opacity: f5b, marginTop: 6}}>
          <span style={{fontFamily: FONT.serif, fontStyle: 'italic'}}>ρ</span> = <Frac n="m" d="V" /> = <span style={{color: C.spr}}>2700 kg/m³</span>
        </div>
      </Formula>
      <Badge x={1150} y={590} text="udara: 10 N" color={C.force} size={24} opacity={chipAir * f5} />
      <Badge x={1400} y={590} text="air: 6,30 N" color={C.press} size={24} opacity={chipWater * f5} />
      <Badge x={1650} y={590} text="selisih 3,70 N" color={C.buoy} size={24} opacity={f5b * f5} />
    </AbsoluteFill>
  );
};
