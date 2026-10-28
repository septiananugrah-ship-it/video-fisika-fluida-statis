import React from 'react';
import {AbsoluteFill, interpolateColors} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, mix, ramp, win} from '../anim';
import {PressureArrow, Water, wavePath} from '../components/fluid';
import {fmt} from '../components/physics';
import {Arrow, Formula, Glow, Label, Motes, Note, Ripple, Spark, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Fase 1 (baris 0): Archimedes di bak mandi — air naik & tumpah, "Eureka!".
// Fase 2 (1–7): balok kubus 0,20 m (V = 0,008 m³, A = 0,04 m²) di tangki air, skala 750 px/m.
// F_atas = ρ g h A = 400·h N, F_bawah = 400·(h + 0,2) N → selisih selalu 80 N = ρ g V.
// Panjang panah tekanan = 16 + 0,35·F px; panah apung (mint) 1,6 px/N.

type P = [number, number];
const WS = 250; // permukaan air tangki
const TB = 850; // dasar dalam tangki
const TX0 = 280;
const TX1 = 920;
const PXM = 750;
const BS = 150; // sisi balok (0,20 m)
const BX = 600; // pusat balok
const TUB = 'M300,540 L1000,540 L980,760 Q975,800 935,800 L365,800 Q325,800 320,760 Z';

const pressL = (F: number) => 16 + 0.35 * F;

export const Archimedes: React.FC = () => {
  const {t, cue, cueEnd, wordOf} = useScene();

  const ph1 = 1 - ramp(t, cue(1) - 0.3, cue(1) + 0.5, EASE_IN_OUT);
  const ph2 = ramp(t, cue(1) + 0.1, cue(1) + 0.9);

  // ---------- fase 1: bak mandi ----------
  const tubIn = ramp(t, -0.5, 0.7);
  const tEu = wordOf(0, 'eureka');
  const sink = ramp(t, cue(0) + 0.1, tEu - 0.2, EASE_IN_OUT);
  const wl = 640 - 94 * sink + 2 * Math.sin(t * 2.3) * sink;
  const spill = ramp(t, cue(0) + 0.1 + (tEu - cue(0) - 0.3) * 0.7, tEu, (x) => x) * (1 - ramp(t, cueEnd(0), cueEnd(0) + 0.8));
  const puddle = ramp(t, tEu - 1.0, cueEnd(0) + 0.5);
  const eu = ramp(t, tEu - 0.15, tEu + 0.35, BACK);
  const arms = ramp(t, tEu - 0.25, tEu + 0.3, EASE_IN_OUT);
  const hop = 10 * Math.sin(Math.PI * ramp(t, tEu - 0.1, tEu + 0.5));
  const bodyTop = 372 + 150 * sink - hop;
  const disp = ramp(t, wordOf(0, 'memindahkan') - 0.3, wordOf(0, 'memindahkan') + 0.5);

  // ---------- fase 2: balok di tangki ----------
  const tankIn = ramp(t, cue(1) + 0.2, cue(1) + 1.0);
  const lowerA = cue(1) + 0.6;
  const lowerB = wordOf(1, 'atas') + 0.3;
  const hDeep = ramp(t, cue(7) + 0.5, cueEnd(7) - 0.4, EASE_IN_OUT);
  const hTop = mix(-0.32, 0.15, ramp(t, lowerA, lowerB, EASE_IN_OUT)) + 0.3 * hDeep + 0.004 * Math.sin(t * 1.4); // m
  const yTop = WS + hTop * PXM;
  const yBot = yTop + BS;
  const sub = Math.max(0, Math.min(1, (yBot - WS) / BS));
  const splash = ramp(t, lowerA + (lowerB - lowerA) * 0.45, lowerA + (lowerB - lowerA) * 0.45 + 1.1);
  const qMark = win(t, lowerB - 0.4, cue(2) + 0.3, 0.5, 0.6);
  const depthMk = win(t, cue(2) + 0.3, cue(4), 0.6, 0.6);
  const pTop = ramp(t, cue(3) - 0.2, cue(3) + 0.6);
  const pBot = ramp(t, wordOf(3, 'bawah') - 0.3, wordOf(3, 'bawah') + 0.5);
  const pSide = ramp(t, wordOf(3, 'kiri') - 0.4, wordOf(3, 'kiri') + 0.4);
  const cancel = ramp(t, wordOf(3, 'meniadakan') - 0.4, wordOf(3, 'meniadakan') + 0.5);
  const sideOp = pSide * (1 - 0.6 * cancel);
  const buoy = ramp(t, wordOf(4, 'Selisihnya') - 0.2, wordOf(4, 'Selisihnya') + 0.6);
  const f4 = win(t, wordOf(4, 'gaya') - 0.3, cue(5) - 0.1, 0.6, 0.5);
  const f5 = win(t, wordOf(5, 'berat') - 0.4, cue(6) - 0.1, 0.6, 0.5);
  const ghostA = cue(5) + 0.2;
  const ghostB = wordOf(5, 'dipindahkan') + 0.3;
  const ghost = ramp(t, ghostA, ghostB, EASE_IN_OUT);
  const beaker = win(t, cue(5) - 0.1, cue(6) + 0.6, 0.6, 0.6);
  const pour = ramp(t, ghostB - 0.4, ghostB + 1.0, EASE_IN_OUT);
  const wArrow = ramp(t, ghostB + 0.6, ghostB + 1.3);
  const f6 = ramp(t, cue(6) + 0.1, cue(6) + 0.8) * (1 - ramp(t, cue(7) - 0.2, cue(7) + 0.4, EASE_IN_OUT));
  const matCycle = ramp(t, cue(6) + 0.6, cue(6) + 2.2, EASE_IN_OUT) - ramp(t, cue(6) + 3.4, cue(6) + 5.0, EASE_IN_OUT);
  const mat = cue(6) < t && t < cue(7) + 1 ? matCycle : 0;
  const matLab = win(t, cue(6) + 0.4, cue(7) - 0.1, 0.5, 0.5);
  const panel = ramp(t, cue(7) + 0.1, cue(7) + 0.8);

  const hNow = Math.max(0, hTop);
  const Ftop = 400 * hNow;
  const Fbot = 400 * Math.max(0, hTop + 0.2);
  const FA = 80 * sub;
  const blockCol = interpolateColors(mat, [0, 0.5, 1], ['#c08a4a', '#8f8aa0', '#7c8796']);
  const arrowsVis = ph2 * sub;

  return (
    <AbsoluteFill>
      <Stage>
        {/* =================== FASE 1: bak mandi Archimedes =================== */}
        {ph1 > 0.001 ? (
          <g opacity={ph1 * tubIn}>
            <defs>
              <clipPath id="arc-tub">
                <path d={TUB} />
              </clipPath>
            </defs>
            {/* lantai ubin */}
            <line x1={160} y1={842} x2={1240} y2={842} stroke={C.muted} strokeOpacity={0.6} strokeWidth={3} />
            {Array.from({length: 10}, (_, i) => (
              <line key={i} x1={200 + i * 110} y1={842} x2={180 + i * 110} y2={872} stroke={C.faint} strokeWidth={2} />
            ))}
            <ellipse cx={1080} cy={842} rx={150 * puddle} ry={10 * puddle} fill={C.water} opacity={0.5} />
            {/* bak */}
            <path d={TUB} fill="#16224a" />
            {/* Archimedes */}
            <g transform={`translate(0 ${-hop})`}>
              {[-1, 1].map((k) => {
                const sx = 620 + k * 52;
                const sy = bodyTop + 30 + hop;
                const ang = mix(0.35, -1.25, arms) * k;
                const ex = sx + k * 70 * Math.cos(ang * k) * 1;
                const ey = sy + 80 * Math.sin(ang * k + (k > 0 ? 0 : 0)) * 1;
                return <path key={k} d={`M${sx},${sy} L${ex},${ey}`} stroke="#e7c39b" strokeWidth={18} strokeLinecap="round" />;
              })}
              <rect x={560} y={bodyTop + hop} width={120} height={200} rx={50} fill="#e7c39b" />
              <circle cx={620} cy={bodyTop + hop - 40} r={36} fill="#e7c39b" />
              <path d={`M590,${bodyTop + hop - 30} Q620,${bodyTop + hop + 22} 650,${bodyTop + hop - 30} Q620,${bodyTop + hop - 10} 590,${bodyTop + hop - 30} Z`} fill="#d9d4cc" />
              <path d={`M584,${bodyTop + hop - 52} Q620,${bodyTop + hop - 96} 656,${bodyTop + hop - 52}`} fill="none" stroke="#d9d4cc" strokeWidth={10} strokeLinecap="round" />
              <circle cx={607} cy={bodyTop + hop - 46} r={4} fill="#1a1430" />
              <circle cx={633} cy={bodyTop + hop - 46} r={4} fill="#1a1430" />
              <path d={`M610,${bodyTop + hop - 24} Q620,${bodyTop + hop - 16 + 6 * eu} 630,${bodyTop + hop - 24}`} fill="none" stroke="#7a3b2e" strokeWidth={3} />
            </g>
            {/* air (di atas tubuh, tembus pandang) */}
            <g clipPath="url(#arc-tub)">
              <path d={`${wavePath(300, 1000, wl, t, 4 + 4 * sink, 0.03, 1)} L1000,820 L300,820 Z`} fill={C.water} opacity={0.55} />
              <path d={wavePath(300, 1000, wl, t, 4 + 4 * sink, 0.03, 1)} fill="none" stroke="#cfeaff" strokeWidth={3} strokeOpacity={0.8} />
              <rect x={300} y={wl} width={700} height={Math.max(0, 640 - wl)} fill={C.cyan} opacity={0.18 * disp} />
            </g>
            <path d={TUB} fill="none" stroke="#e8eefc" strokeOpacity={0.85} strokeWidth={6} strokeLinejoin="round" />
            <rect x={288} y={530} width={724} height={18} rx={9} fill="#e8eefc" opacity={0.9} />
            {[360, 940].map((x) => (
              <path key={x} d={`M${x - 16},800 L${x + 16},800 L${x + 8},836 L${x - 8},836 Z`} fill="#e8eefc" opacity={0.85} />
            ))}
            {/* garis muka air awal → naik */}
            <g opacity={disp}>
              <line x1={1010} y1={640} x2={1110} y2={640} stroke={C.cyan} strokeWidth={2} strokeDasharray="6 6" />
              <Arrow x1={1080} y1={636} x2={1080} y2={Math.min(600, wl + 6)} color="cyan" width={4} pulse={false} />
              <Label x={1120} y={640} size={24} color={C.cyan} anchor="start">
                air naik
              </Label>
            </g>
            {/* tumpah */}
            <Stream
              pts={[
                [995, 542],
                [1025, 580],
                [1045, 700],
                [1060, 836],
              ]}
              color="water"
              n={9}
              speed={1.1}
              r={5}
              jitter={4}
              opacity={spill}
            />
            <Ripple x={1060} y={838} p={((t * 1.2) % 1) * (spill > 0.05 ? 1 : 0)} r={60} color="water" rings={2} />
            {/* Eureka! */}
            <g opacity={eu} transform={`translate(1330 360) scale(${0.6 + 0.4 * eu}) translate(-1330 -360)`}>
              <Glow x={1330} y={360} r={260} color="gold" />
              <path d="M1110,300 Q1110,240 1180,240 L1480,240 Q1550,240 1550,300 L1550,410 Q1550,470 1480,470 L1000,470 L1050,430 Q1110,440 1110,410 Z" fill="rgba(10,16,36,0.88)" stroke={C.gold} strokeWidth={4} />
              <Label x={1330} y={350} size={76} color={C.gold} weight={700} font="head">
                Eureka!
              </Label>
              <Label x={1330} y={420} size={26} color={C.muted}>
                (aku menemukannya!)
              </Label>
            </g>
            <Twinkles x={1330} y={350} rx={260} ry={120} n={7} color="gold" opacity={eu} />
            <Ripple x={620} y={wl} p={ramp(t, tEu - 0.1, tEu + 1.0)} r={240} color="water" />
          </g>
        ) : null}

        {/* =================== FASE 2: tangki & balok =================== */}
        {ph2 > 0.001 ? (
          <g opacity={ph2 * tankIn}>
            <ellipse cx={600} cy={TB + 26} rx={360} ry={14} fill="#000" opacity={0.35} />
            {/* tali penahan */}
            <line x1={BX} y1={168} x2={BX} y2={yTop} stroke={C.muted} strokeWidth={3} />
            <rect x={BX - 40} y={160} width={80} height={12} rx={5} fill="#3b466e" />
            {/* balok */}
            <g>
              <rect x={BX - BS / 2} y={yTop} width={BS} height={BS} rx={8} fill={blockCol} stroke="#f1dfc4" strokeOpacity={0.6} strokeWidth={3} />
              <rect x={BX - BS / 2 + 10} y={yTop + 10} width={BS - 20} height={10} rx={5} fill="#fff" opacity={0.15} />
              {[0, 1, 2].map((k) => (
                <path key={k} d={`M${BX - 60},${yTop + 45 + k * 34} q30,${-8 + k * 3} 60,0 t60,0`} fill="none" stroke="#000" strokeOpacity={0.15 * (1 - mat)} strokeWidth={3} />
              ))}
            </g>
            <Water x={TX0} y={WS} w={TX1 - TX0} h={TB - WS} amp={4} bubbles={6} seed={3} opacity={0.82} />
            <path d={`M${TX0 - 6},200 L${TX0 - 6},${TB + 6} L${TX1 + 6},${TB + 6} L${TX1 + 6},200`} fill="none" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={8} strokeLinejoin="round" />
            <line x1={TX0 + 12} y1={220} x2={TX0 + 12} y2={TB - 20} stroke="#fff" strokeOpacity={0.12} strokeWidth={6} strokeLinecap="round" />
            {/* garis bentuk balok di dalam air agar tetap jelas */}
            <rect x={BX - BS / 2} y={yTop} width={BS} height={BS} rx={8} fill="none" stroke="#f1dfc4" strokeOpacity={0.75} strokeWidth={3} />
            <Label x={BX} y={yTop + BS / 2} size={30} color="#fff3e0" weight={600} opacity={matLab * (1 - mat)}>
              kayu
            </Label>
            <Label x={BX} y={yTop + BS / 2} size={30} color="#fff3e0" weight={600} opacity={matLab * mat}>
              besi
            </Label>
            <Ripple x={BX} y={WS} p={splash} r={220} color="water" />

            {/* kedalaman h₁, h₂ */}
            <g opacity={depthMk}>
              <line x1={340} y1={yTop} x2={BX - BS / 2} y2={yTop} stroke={C.ink} strokeWidth={2} strokeDasharray="6 6" />
              <line x1={400} y1={yBot} x2={BX - BS / 2} y2={yBot} stroke={C.ink} strokeWidth={2} strokeDasharray="6 6" />
              <Arrow x1={340} y1={WS + 4} x2={340} y2={yTop} color="ink" width={3.5} both pulse={false} />
              <Arrow x1={400} y1={WS + 4} x2={400} y2={yBot} color="ink" width={3.5} both pulse={false} />
              <Label x={318} y={(WS + yTop) / 2} size={30} font="serif" italic color={C.ink} anchor="end">
                <tspan>h</tspan>
                <tspan baselineShift="sub" fontSize="0.65em">1</tspan>
              </Label>
              <Label x={422} y={(WS + yBot) / 2 + 30} size={30} font="serif" italic color={C.ink} anchor="start">
                <tspan>h</tspan>
                <tspan baselineShift="sub" fontSize="0.65em">2</tspan>
              </Label>
            </g>

            {/* panah tekanan */}
            <g opacity={arrowsVis}>
              {[-62, -30, 30, 62].map((dx) => (
                <PressureArrow key={`t${dx}`} x={BX + dx} y={yTop - 2} nx={0} ny={-1} L={pressL(Ftop)} width={5} opacity={pTop} />
              ))}
              {[-62, -30, 30, 62].map((dx) => (
                <PressureArrow key={`b${dx}`} x={BX + dx} y={yBot + 2} nx={0} ny={1} L={pressL(Fbot)} width={5} opacity={pBot} />
              ))}
              {[0.15, 0.5, 0.85].map((f) => {
                const y = yTop + f * BS;
                const L = pressL(400 * Math.max(0, hTop + f * 0.2)) * 0.8;
                return (
                  <g key={f} opacity={sideOp}>
                    <PressureArrow x={BX - BS / 2 - 2} y={y} nx={-1} ny={0} L={L} width={4} />
                    <PressureArrow x={BX + BS / 2 + 2} y={y} nx={1} ny={0} L={L} width={4} />
                  </g>
                );
              })}
              <g opacity={cancel * (1 - buoy)}>
                <Label x={BX - BS / 2 - 70} y={yBot + 34} size={24} color={C.press} anchor="middle">
                  ←→ saling meniadakan
                </Label>
              </g>
              <Label x={BX + BS / 2 + 30} y={yTop - 34} size={26} color={C.press} weight={600} anchor="start" opacity={pTop * (1 - panel)}>
                kecil
              </Label>
              <Label x={BX + BS / 2 + 30} y={yBot + 40} size={26} color={C.press} weight={600} anchor="start" opacity={pBot * (1 - panel)}>
                besar
              </Label>
            </g>
            {/* gaya apung bersih */}
            <g opacity={ph2 * Math.max(buoy, qMark)}>
              <Glow x={BX} y={yTop + BS / 2 - 40} r={120} color="buoy" opacity={0.7 * buoy} />
              <Arrow x1={BX} y1={yTop + BS / 2 + 10} x2={BX} y2={yTop + BS / 2 + 10 - 1.6 * Math.max(FA, 50 * qMark * (1 - buoy))} color="buoy" width={9} />
              <Label x={BX + 34} y={yTop + BS / 2 - 90} size={44} color={C.buoy} weight={700} anchor="start" opacity={qMark * (1 - buoy)}>
                ?
              </Label>
              <Label x={BX - 36} y={yTop - 64} size={30} color={C.buoy} weight={600} anchor="end" opacity={buoy}>
                <tspan fontFamily={FONT.serif} fontStyle="italic">F</tspan>
                <tspan baselineShift="sub" fontSize="0.65em">A</tspan>
                {`  ${fmt(FA)} N`}
              </Label>
            </g>
            <Motes x={BX} y={yTop + BS / 2} rx={200} ry={170} n={14} color="buoy" opacity={0.35 * buoy} seed={4} />

            {/* air yang dipindahkan → gelas ukur */}
            <g opacity={beaker}>
              {/* "hantu" balok air yang keluar dari tangki */}
              {(() => {
                const gx = mix(BX, 1440, ghost);
                const gy = mix(yTop + BS / 2, 420, ghost) - 120 * Math.sin(Math.PI * ghost);
                const op = Math.min(1, ghost * 5) * (1 - pour);
                return (
                  <g opacity={op}>
                    <rect x={gx - BS / 2} y={gy - BS / 2} width={BS} height={BS} rx={8} fill={C.water} opacity={0.6} stroke="#cfeaff" strokeWidth={3} strokeDasharray="8 6" strokeDashoffset={-t * 14} />
                    <Label x={gx} y={gy} size={22} color="#e8f6ff">
                      air pindahan
                    </Label>
                  </g>
                );
              })()}
              {/* gelas ukur di atas timbangan */}
              <rect x={1300} y={800} width={280} height={22} rx={6} fill="#1a2550" stroke={C.muted} strokeWidth={2} />
              <path d="M1340,540 L1340,790 Q1340,798 1348,798 L1532,798 Q1540,798 1540,790 L1540,540" fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={5} />
              {(() => {
                const lev = (BS * BS) / 200; // luas penampang sama → tinggi air
                const top = 796 - lev * pour;
                return (
                  <g>
                    {pour > 0.001 ? (
                      <>
                        <path d={`${wavePath(1343, 1537, top, t, 2.5, 0.06, 2)} L1537,796 L1343,796 Z`} fill={C.water} opacity={0.65} />
                        <path d={wavePath(1343, 1537, top, t, 2.5, 0.06, 2)} fill="none" stroke="#cfeaff" strokeWidth={2.5} />
                      </>
                    ) : null}
                    <Stream pts={[[1440, 470], [1440, top]]} color="water" n={6} speed={1.3} r={5} jitter={2} opacity={win(t, ghostB - 0.5, ghostB + 0.8, 0.2, 0.3)} />
                  </g>
                );
              })()}
              {Array.from({length: 6}, (_, i) => (
                <line key={i} x1={1340} y1={760 - i * 40} x2={1360} y2={760 - i * 40} stroke={C.muted} strokeWidth={2} />
              ))}
              {/* berat air pindahan = gaya apung */}
              <g opacity={wArrow}>
                <Arrow x1={1600} y1={630} x2={1600} y2={630 + 1.6 * 80} color="force" width={9} />
                <Label x={1622} y={680} size={28} color={C.force} weight={600} anchor="start">
                  berat
                </Label>
                <Label x={1622} y={714} size={26} font="mono" color={C.force} anchor="start">
                  80 N
                </Label>
                <Arrow x1={1250} y1={758} x2={1250} y2={758 - 1.6 * 80} color="buoy" width={9} />
                <Label x={1228} y={690} size={28} color={C.buoy} weight={600} anchor="end">
                  <tspan fontFamily={FONT.serif} fontStyle="italic">F</tspan>
                  <tspan baselineShift="sub" fontSize="0.65em">A</tspan>
                </Label>
                <Label x={1425} y={588} size={34} color={C.ink} weight={700} opacity={ramp(t, ghostB + 1.0, ghostB + 1.6)}>
                  =
                </Label>
                <Twinkles x={1440} y={700} rx={160} ry={90} n={5} color="buoy" />
              </g>
            </g>

            {/* lebih dalam: atas & bawah naik bersama */}
            <g opacity={panel}>
              <rect x={1080} y={500} width={660} height={300} rx={18} fill="rgba(10,16,36,0.82)" stroke={C.line} strokeWidth={2} />
              <Label x={1410} y={534} size={22} color={C.muted}>
                {`kedalaman atas balok h₁ = ${fmt(hNow, 2)} m`}
              </Label>
              {[
                {y: 600, l: 'F atas', v: Ftop, c: C.press},
                {y: 660, l: 'F bawah', v: Fbot, c: C.press},
              ].map((r) => (
                <g key={r.l}>
                  <Label x={1110} y={r.y} size={26} color={r.c} anchor="start">
                    {r.l}
                  </Label>
                  <rect x={1250} y={r.y - 12} width={360 * (r.v / 320)} height={24} rx={8} fill={r.c} opacity={0.8} />
                  <Label x={1260 + 360 * (r.v / 320)} y={r.y} size={26} font="mono" color={r.c} anchor="start" weight={600}>
                    {`${fmt(r.v)} N`}
                  </Label>
                </g>
              ))}
              <line x1={1110} y1={700} x2={1710} y2={700} stroke={C.line} strokeWidth={2} />
              <Label x={1110} y={748} size={30} color={C.buoy} weight={700} anchor="start">
                selisih
              </Label>
              <rect x={1250 + 360 * (Ftop / 320)} y={736} width={360 * (80 / 320)} height={24} rx={8} fill={C.buoy} opacity={0.85} />
              <Label x={1270 + 360 * (Fbot / 320)} y={748} size={30} font="mono" color={C.buoy} weight={700} anchor="start">
                80 N
              </Label>
            </g>
            <Twinkles x={1640} y={748} rx={60} ry={30} n={3} color="buoy" opacity={ramp(hDeep, 0.6, 1) * panel} />
            <Spark x={BX} y={WS} r={5} color="water" opacity={0} />
          </g>
        ) : null}
      </Stage>

      <Formula x={1420} y={300} p={f4 * ph2} accent={C.buoy} size={64}>
        <V color="buoy">F</V>
        <Sub color={C.buoy}>A</Sub> = <V color="spr">ρ</V>
        <Sub color={C.spr}>f</Sub>
        <V>g</V>
        <V>V</V>
        <Sub>tercelup</Sub>
      </Formula>
      <Formula x={1420} y={300} p={f5 * ph2} accent={C.buoy} size={60} caption="berat fluida yang dipindahkan">
        <V color="buoy">F</V>
        <Sub color={C.buoy}>A</Sub> = <V color="spr">ρ</V>
        <Sub color={C.spr}>f</Sub>
        <V>V</V>
        <V>g</V> = <V>m</V>
        <Sub>f</Sub>
        <V>g</V>
      </Formula>
      <Formula
        x={1420}
        y={300}
        p={f6 * ph2}
        accent={C.spr}
        size={64}
        caption={
          <span>
            <span style={{color: C.spr}}>ρ fluida</span>, bukan ρ benda
          </span>
        }
      >
        <V color="buoy">F</V>
        <Sub color={C.buoy}>A</Sub> = <span style={{color: C.spr, textShadow: `0 0 18px ${C.spr}`}}>
          <V>ρ</V>
          <Sub>f</Sub>
        </span>
        <V>g</V>
        <V>V</V>
      </Formula>
      <Note x={1420} y={620} p={matLab * ph2} color={C.buoy} size={28}>
        benda diganti, <V>V</V> sama → <span style={{color: C.buoy}}>F</span>
        <Sub color={C.buoy}>A</Sub> tetap
      </Note>
      <Formula x={1420} y={300} p={panel * ph2} accent={C.buoy} size={56}>
        <V color="buoy">F</V>
        <Sub color={C.buoy}>A</Sub> = <V>F</V>
        <Sub>bawah</Sub> − <V>F</V>
        <Sub>atas</Sub> = 80 N
      </Formula>
      <Note x={1330} y={620} p={0} color={C.cyan}>
        {''}
      </Note>
    </AbsoluteFill>
  );
};
