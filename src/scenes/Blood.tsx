import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE_IN_OUT, mix, ramp, smoothPath, win} from '../anim';
import {PressureArrow, Water, wavePath} from '../components/fluid';
import {Arrow, Formula, Glow, Label, Motes, Note, Ripple, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Tekanan darah (mmHg) → barometer Torricelli (760 mm) → kolom air > 10 m → 120 mmHg ≈ 16 kPa ≈ 1,6 m air
// → lengan diangkat (ρgh) → infus.
const HG = '#d5dcec';
const SKIN = '#c99d82';

const pw = (t: number, ts: number[], vs: number[]) => {
  if (t <= ts[0]) return vs[0];
  for (let i = 1; i < ts.length; i++) {
    if (t <= ts[i]) {
      const u = (t - ts[i - 1]) / Math.max(1e-6, ts[i] - ts[i - 1]);
      return mix(vs[i - 1], vs[i], u);
    }
  }
  return vs[vs.length - 1];
};

const heartPath = (s: number) => `M0,${0.9 * s} C${-1.5 * s},${-0.1 * s} ${-0.7 * s},${-1.15 * s} 0,${-0.35 * s} C${0.7 * s},${-1.15 * s} ${1.5 * s},${-0.1 * s} 0,${0.9 * s} Z`;

/** Titik-titik tubuh (orang berdiri, tinggi H, kaki di feet). Sudut lengan: 0 = mendatar ke kanan, + = ke bawah. */
const bodyPts = (x: number, feet: number, H: number, arm: number) => {
  const sh = {x: x + 0.12 * H, y: feet - 0.8 * H};
  const a = (arm * Math.PI) / 180;
  const L = 0.38 * H;
  return {sh, hand: {x: sh.x + Math.cos(a) * L, y: sh.y + Math.sin(a) * L}, heart: {x: x - 0.035 * H, y: feet - 0.7 * H}, a, L};
};

const Body: React.FC<{x: number; feet: number; H: number; arm: number; t: number; op?: number}> = ({x, feet, H, arm, t, op = 1}) => {
  if (op <= 0.001) return null;
  const P = bodyPts(x, feet, H, arm);
  const hipY = feet - 0.47 * H;
  const fill = '#4a5890';
  const out = '#9aa8dc';
  const limb = (x1: number, y1: number, x2: number, y2: number, w: number) => (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={out} strokeWidth={w + 4} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={fill} strokeWidth={w} strokeLinecap="round" />
    </>
  );
  const la = (100 * Math.PI) / 180;
  const shL = {x: x - 0.12 * H, y: P.sh.y};
  const breath = 1 + 0.01 * Math.sin(t * 1.6);
  return (
    <g opacity={op}>
      <ellipse cx={x} cy={feet + 6} rx={0.16 * H} ry={10} fill="#000" opacity={0.35} />
      {limb(x - 0.05 * H, hipY, x - 0.075 * H, feet - 6, 0.075 * H)}
      {limb(x + 0.05 * H, hipY, x + 0.075 * H, feet - 6, 0.075 * H)}
      {limb(shL.x, shL.y, shL.x + Math.cos(la) * P.L, shL.y + Math.sin(la) * P.L, 0.058 * H)}
      <rect x={x - 0.13 * H} y={P.sh.y - 0.03 * H} width={0.26 * H * breath} height={hipY - P.sh.y + 0.05 * H} rx={0.06 * H} fill={fill} stroke={out} strokeWidth={2.5} />
      <rect x={x - 0.025 * H} y={feet - 0.88 * H} width={0.05 * H} height={0.07 * H} fill={fill} stroke={out} strokeWidth={2} />
      <circle cx={x} cy={feet - H + 0.068 * H} r={0.068 * H} fill={fill} stroke={out} strokeWidth={2.5} />
      {limb(P.sh.x, P.sh.y, P.hand.x, P.hand.y, 0.058 * H)}
    </g>
  );
};

/** Jantung berdenyut. */
const Heart: React.FC<{x: number; y: number; s: number; t: number; op?: number}> = ({x, y, s, t, op = 1}) => {
  const beat = 1 + 0.12 * Math.max(0, Math.sin(t * 2 * Math.PI * 1.2)) ** 6;
  return (
    <g opacity={op} transform={`translate(${x} ${y}) scale(${beat.toFixed(3)})`}>
      <circle r={s * 2} fill="url(#soft-heat)" />
      <path d={heartPath(s)} fill={C.heat} stroke="#ffb0bb" strokeWidth={1.5} />
    </g>
  );
};

export const Blood: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const appear = ramp(t, -0.3, 1.0);
  const p1 = appear * (1 - ramp(t, cue(1) - 0.4, cue(1) + 0.5, EASE_IN_OUT));
  const p2 = ramp(t, cue(1) - 0.2, cue(1) + 0.7) * (1 - ramp(t, cue(4) - 0.4, cue(4) + 0.4, EASE_IN_OUT));
  const p3 = ramp(t, cue(3) + 0.2, cue(3) + 1.2) * (1 - ramp(t, cue(4) - 0.4, cue(4) + 0.4, EASE_IN_OUT));
  const p4 = ramp(t, cue(4) - 0.1, cue(4) + 0.8) * (1 - ramp(t, cue(5) - 0.4, cue(5) + 0.4, EASE_IN_OUT));
  const p5 = ramp(t, cue(5) - 0.1, cue(5) + 0.8) * (1 - ramp(t, cue(6) - 0.4, cue(6) + 0.4, EASE_IN_OUT));
  const p6 = ramp(t, cue(6) - 0.1, cue(6) + 0.8);

  /* ---------- P1: sfigmomanometer ---------- */
  const tB = 3.6;
  const k1 = Math.max(tB + 0.8, wordOf(0, 'seratus'));
  const k2 = Math.max(k1 + 0.6, wordOf(0, 'delapan'));
  const beatPh = (((t * 1.2) % 1) + 1) % 1;
  const Lc = pw(t, [1.0, tB, tB + 0.4, k1, k2, k2 + 1.4], [0, 180, 180, 120, 80, 40]);
  const kor = ramp(120 - Lc, 0, 4) * ramp(Lc - 80, 0, 4);
  const Lshow = Lc + 2.5 * kor * Math.sin(beatPh * Math.PI * 2);
  const my = (mm: number) => 830 - mm * 1.9;
  const inflating = win(t, 1.0, tB, 0.2, 0.3);
  const bulbSq = inflating * Math.max(0, Math.sin(t * 2 * Math.PI * 1.4));
  const flow = 1 - ramp(Lc, 112, 124);

  /* ---------- P2: barometer Torricelli ---------- */
  const tFlip = wordOf(1, 'dibalik');
  const flip = ramp(t, tFlip - 0.2, tFlip + 1.6, EASE_IN_OUT);
  const rot = 180 * (1 - flip);
  const tcx = mix(420, 760, flip);
  const tRel = cue(2) + 0.3;
  const tau = Math.max(0, t - tRel);
  const topW = t < tRel ? 190 : 268 - 78 * Math.exp(-1.5 * tau) * Math.cos(3.4 * tau);
  const topL = topW - 512; // koordinat lokal tabung (pusat di 512)
  const sh = ramp(t, cue(3) - 0.1, cue(3) + 1.6, EASE_IN_OUT);
  const bs = mix(1, 0.0857, sh);
  const bx = mix(760, 720, sh);
  const by = mix(800, 828, sh);
  const steps = [cue(1) + 0.4, tFlip, cue(2) + 0.2];
  const stepOut = 1 - ramp(t, wordOf(2, 'diimbangi') - 0.8, wordOf(2, 'diimbangi') - 0.1, EASE_IN_OUT);
  const atmOp = ramp(t, wordOf(2, 'atmosfer') - 0.4, wordOf(2, 'atmosfer') + 0.4) * (1 - sh);
  const wOp = ramp(t, wordOf(2, 'berat') - 0.3, wordOf(2, 'berat') + 0.4) * (1 - sh);
  const mmOp = ramp(t, wordOf(2, 'milimeter') - 0.2, wordOf(2, 'milimeter') + 0.5) * (1 - sh);
  const vacOp = ramp(t, wordOf(2, 'hampa') - 0.3, wordOf(2, 'hampa') + 0.4) * (1 - sh);
  const f2 = ramp(t, wordOf(2, 'diimbangi') - 0.2, wordOf(2, 'diimbangi') + 0.7) * (1 - ramp(t, cue(3) - 0.3, cue(3) + 0.4, EASE_IN_OUT));

  /* ---------- P3: kolom air ---------- */
  const rise3 = ramp(t, cue(3) + 0.8, wordOf(3, 'sepuluh') + 0.4, EASE_IN_OUT);
  const hW3 = 618 * rise3;
  const n3 = ramp(t, wordOf(3, 'rapat') - 0.3, wordOf(3, 'rapat') + 0.5);

  /* ---------- P4: 120 mmHg ≈ 1,6 m air ---------- */
  const rise4 = ramp(t, cue(4) + 0.6, wordOf(4, 'kolom') + 0.6, EASE_IN_OUT);
  const lvl4 = 800 - 480 * rise4;
  const f4 = ramp(t, wordOf(4, 'enam') - 0.3, wordOf(4, 'enam') + 0.6);

  /* ---------- P5: lengan diangkat ---------- */
  const raise = ramp(t, wordOf(5, 'diangkat') - 0.3, wordOf(5, 'diangkat') + 1.4, EASE_IN_OUT);
  const armA = mix(36, -78, raise) + 1.5 * Math.sin(t * 1.3);
  const B5 = bodyPts(700, 860, 560, armA);
  const cuffU = 0.45;
  const cuff5 = {x: B5.sh.x + Math.cos(B5.a) * B5.L * cuffU, y: B5.sh.y + Math.sin(B5.a) * B5.L * cuffU};
  const f5 = ramp(t, wordOf(5, 'rho') - 0.3, wordOf(5, 'rho') + 0.6);
  const lvl5 = ramp(t, wordOf(5, 'jantung') - 0.4, wordOf(5, 'jantung') + 0.3);

  /* ---------- P6: infus ---------- */
  const tube: [number, number][] = [
    [560, 472],
    [560, 600],
    [600, 690],
    [720, 740],
    [880, 738],
    [990, 712],
  ];
  const f6 = ramp(t, wordOf(6, 'mengalahkan') - 0.3, wordOf(6, 'mengalahkan') + 0.6);
  const dripPh = (((t / 0.9) % 1) + 1) % 1;

  return (
    <AbsoluteFill>
      <Stage>
        {/* ======= P1 ======= */}
        {p1 > 0.001 ? (
          <g opacity={p1} transform={`translate(${(-60 * ramp(t, cue(1) - 0.4, cue(1) + 0.5, EASE_IN_OUT)).toFixed(2)} 0)`}>
            <Motes x={600} y={520} rx={520} ry={250} n={24} color="heat" opacity={0.3} seed={2} />
            {/* selang */}
            <path d="M330,448 C330,330 760,300 930,430 S1140,880 1180,846" fill="none" stroke="#3a4a7a" strokeWidth={8} strokeLinecap="round" />
            <path d="M420,572 C460,720 800,770 952,714" fill="none" stroke="#3a4a7a" strokeWidth={8} strokeLinecap="round" />
            {/* lengan */}
            <line x1={130} y1={500} x2={520} y2={516} stroke="#8a6a58" strokeWidth={100} strokeLinecap="round" />
            <line x1={130} y1={500} x2={520} y2={516} stroke={SKIN} strokeWidth={94} strokeLinecap="round" />
            <line x1={520} y1={516} x2={840} y2={536} stroke="#8a6a58" strokeWidth={80} strokeLinecap="round" />
            <line x1={520} y1={516} x2={840} y2={536} stroke={SKIN} strokeWidth={74} strokeLinecap="round" />
            <ellipse cx={890} cy={540} rx={52} ry={36} fill={SKIN} stroke="#8a6a58" strokeWidth={3} />
            <path d="M130,512 L840,546" stroke={C.heat} strokeWidth={6} strokeLinecap="round" opacity={0.75} />
            <Stream
              pts={[
                [140, 513],
                [480, 529],
                [840, 546],
              ]}
              color="heat"
              n={9}
              speed={0.5}
              r={4}
              jitter={0}
              opacity={flow * 0.9}
            />
            {/* manset */}
            {(() => {
              const g = 6 + 10 * (Lc / 180);
              return (
                <g>
                  <rect x={232} y={452 - g} width={230} height={128 + 2 * g} rx={22} fill="#2d4a8a" stroke="#8fb0ff" strokeWidth={2.5} />
                  {[0, 1, 2, 3, 4].map((k) => (
                    <line key={k} x1={256 + k * 44} y1={460 - g} x2={256 + k * 44} y2={572 + g} stroke="#8fb0ff" strokeWidth={1.5} opacity={0.3} />
                  ))}
                  <rect x={240} y={452 - g + 6} width={214} height={10} rx={5} fill="#fff" opacity={0.12} />
                </g>
              );
            })()}
            {/* bunyi Korotkoff (denyut lolos) */}
            <g opacity={kor}>
              <Ripple x={560} y={528} p={beatPh} r={70} color="heat" rings={2} />
            </g>
            {/* pompa */}
            <ellipse cx={1000} cy={714} rx={48 * (1 - 0.18 * bulbSq)} ry={32 * (1 + 0.12 * bulbSq)} fill="#2a2f55" stroke="#8f8fd8" strokeWidth={2.5} />
            {/* manometer raksa */}
            <rect x={1128} y={220} width={156} height={656} rx={14} fill="#121a3a" stroke="#a9b8e6" strokeWidth={2} />
            <text x={1206} y={244} textAnchor="middle" fontFamily={FONT.mono} fontSize={17} fill={C.muted}>
              mmHg
            </text>
            <rect x={1168} y={my(300) - 6} width={24} height={my(0) - my(300) + 10} rx={8} fill="none" stroke="#bfe3ff" strokeOpacity={0.6} strokeWidth={2.5} />
            <rect x={1150} y={830} width={60} height={36} rx={8} fill={HG} opacity={0.85} />
            <rect x={1172} y={my(Lshow)} width={16} height={Math.max(0, my(0) - my(Lshow) + 4)} fill={HG} />
            <path d={`M1172,${my(Lshow) + 3} Q1180,${my(Lshow) - 4} 1188,${my(Lshow) + 3}`} fill={HG} />
            {Array.from({length: 31}, (_, k) => (
              <g key={k}>
                <line x1={1196} y1={my(k * 10)} x2={k % 2 === 0 ? 1212 : 1204} y2={my(k * 10)} stroke={C.muted} strokeWidth={k % 2 === 0 ? 2 : 1.2} />
                {k % 4 === 0 ? (
                  <text x={1222} y={my(k * 10)} dominantBaseline="central" fontFamily={FONT.mono} fontSize={15} fill={C.muted}>
                    {k * 10}
                  </text>
                ) : null}
              </g>
            ))}
            {[
              {mm: 120, k: k1, txt: 'sistolik 120'},
              {mm: 80, k: k2, txt: 'diastolik 80'},
            ].map((m) => {
              const o = ramp(t, m.k - 0.2, m.k + 0.4);
              return (
                <g key={m.mm} opacity={o}>
                  <path d={`M1300,${my(m.mm)} l14,-9 l0,18 Z`} fill={C.heat} />
                  <Label x={1326} y={my(m.mm)} anchor="start" size={26} color={C.heat} weight={600}>
                    {m.txt}
                  </Label>
                  <Ripple x={1180} y={my(m.mm)} p={(t - m.k) / 1.2} r={60} color="heat" rings={2} />
                </g>
              );
            })}
            <Label x={1000} y={775} size={22} color={C.muted}>
              pompa
            </Label>
            <Label x={346} y={640} size={22} color={C.muted}>
              manset
            </Label>
          </g>
        ) : null}

        {/* ======= P2 + P3: barometer ======= */}
        {p2 > 0.001 ? (
          <g opacity={p2}>
            {/* langkah: atmosfer & molekul udara */}
            <Motes x={760} y={700} rx={240} ry={90} n={24} color="muted" opacity={0.6 * (1 - sh)} seed={6} />
            <g transform={`translate(${bx.toFixed(2)} ${by.toFixed(2)}) scale(${bs.toFixed(4)}) translate(-760 -800)`}>
              <ellipse cx={760} cy={866} rx={230} ry={14} fill="#000" opacity={0.35 * (1 - sh)} />
              {/* tabung */}
              <g transform={`translate(${tcx.toFixed(2)} 512) rotate(${rot.toFixed(2)})`}>
                <rect x={-18} y={topL} width={36} height={330 - topL} fill={HG} />
                <path d={`M-18,${topL + 4} Q0,${topL - 6} 18,${topL + 4}`} fill={HG} />
                <rect x={-12} y={topL + 6} width={6} height={Math.max(0, 320 - topL)} fill="#fff" opacity={0.35} />
                <path d="M-22,330 L-22,-312 A22,22 0 0 1 22,-312 L22,330" fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={4} />
                <ellipse cx={0} cy={338} rx={26} ry={12} fill={SKIN} opacity={1 - ramp(t, tRel - 0.4, tRel, EASE_IN_OUT)} />
              </g>
              {/* wadah raksa */}
              <path d={`M560,${800} L560,852 L960,852 L960,${800}`} fill="none" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={5} />
              <path d={`${wavePath(564, 956, 800, t, 1.2, 0.05)} L956,849 L564,849 Z`} fill={HG} opacity={0.9} />
              <rect x={742} y={800} width={36} height={30} fill={HG} />
            </g>
            {/* label baris 1–2 */}
            <g opacity={mmOp}>
              <line x1={815} y1={800} x2={815} y2={topW} stroke={C.ink} strokeWidth={2} />
              <line x1={805} y1={800} x2={825} y2={800} stroke={C.ink} strokeWidth={2} />
              <line x1={805} y1={268} x2={825} y2={268} stroke={C.ink} strokeWidth={2} />
              <Label x={836} y={530} anchor="start" size={30} color={C.ink} weight={700}>
                760 mm
              </Label>
            </g>
            <Label x={796} y={214} anchor="start" size={24} color={C.cyan} opacity={vacOp}>
              ≈ hampa
            </Label>
            <g opacity={wOp}>
              <Arrow x1={760} y1={410} x2={760} y2={640} color="force" width={5} />
              <Label x={730} y={520} anchor="end" size={24} color={C.force}>
                berat kolom raksa
              </Label>
            </g>
            <g opacity={atmOp}>
              {[600, 660, 870, 925].map((x) => (
                <PressureArrow key={x} x={x} y={798} nx={0} ny={-1} L={78} width={5} />
              ))}
              <Label x={950} y={690} size={26} color={C.press} weight={600}>
                tekanan atmosfer
              </Label>
            </g>
            <Glow x={780} y={268} r={70} color="cyan" opacity={vacOp * 0.6} />
          </g>
        ) : null}
        {p3 > 0.001 ? (
          <g opacity={p3}>
            <line x1={540} y1={840} x2={1500} y2={840} stroke={C.muted} strokeWidth={2.5} />
            {/* penggaris 0–11 m */}
            <line x1={640} y1={840} x2={640} y2={180} stroke={C.muted} strokeWidth={2} />
            {Array.from({length: 12}, (_, k) => (
              <g key={k}>
                <line x1={628} y1={840 - k * 60} x2={640} y2={840 - k * 60} stroke={C.muted} strokeWidth={2} />
                {k % 2 === 0 ? (
                  <Label x={620} y={840 - k * 60} anchor="end" size={18} color={C.muted} font="mono">
                    {k} m
                  </Label>
                ) : null}
              </g>
            ))}
            {/* barometer air */}
            <path d="M840,828 L840,846 L930,846 L930,828" fill="none" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={3} />
            <rect x={843} y={830} width={84} height={14} fill={C.water} opacity={0.7} />
            <rect x={877} y={828 - hW3} width={16} height={hW3} fill={C.water} opacity={0.85} />
            <Stream
              pts={[
                [885, 828],
                [885, 828 - hW3],
              ]}
              color="cyan"
              n={6}
              speed={0.6}
              r={3}
              jitter={1}
              opacity={rise3 > 0.01 && rise3 < 0.99 ? 0.9 : 0}
            />
            <path d="M873,840 L873,190 A12,12 0 0 1 897,190 L897,840" fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={3} />
            <Label x={912} y={828 - hW3} anchor="start" size={26} color={C.water} weight={600} opacity={ramp(rise3, 0.85, 1)}>
              air ≈ 10,3 m
            </Label>
            <Label x={720} y={762} size={22} color={HG} opacity={ramp(sh, 0.8, 1)}>
              raksa 76 cm
            </Label>
            {/* gedung 3 lantai & orang */}
            <g opacity={ramp(t, cue(3) + 0.6, cue(3) + 1.6)}>
              <rect x={1050} y={300} width={200} height={540} fill="#18224a" stroke="#6f7fb8" strokeWidth={2.5} />
              <path d="M1036,300 L1150,244 L1264,300 Z" fill="#1d2858" stroke="#6f7fb8" strokeWidth={2.5} />
              {[0, 1, 2].map((fl) => (
                <g key={fl}>
                  <line x1={1050} y1={840 - fl * 180} x2={1250} y2={840 - fl * 180} stroke="#6f7fb8" strokeWidth={1.5} />
                  {[0, 1].map((w) => (
                    <rect key={w} x={1078 + w * 90} y={840 - fl * 180 - 140} width={54} height={70} rx={4} fill={C.gold} opacity={0.25 + 0.2 * Math.sin(t * 0.9 + fl * 2 + w)} />
                  ))}
                </g>
              ))}
              <Label x={1150} y={870} size={20} color={C.muted}>
                ± 3 lantai
              </Label>
              <Body x={1370} feet={838} H={102} arm={80} t={t} />
              <Label x={1370} y={870} size={20} color={C.muted}>
                1,7 m
              </Label>
            </g>
          </g>
        ) : null}

        {/* ======= P4 ======= */}
        {p4 > 0.001 ? (
          <g opacity={p4}>
            <line x1={600} y1={840} x2={1250} y2={840} stroke={C.muted} strokeWidth={2.5} />
            <line x1={690} y1={800} x2={690} y2={260} stroke={C.muted} strokeWidth={2} />
            {Array.from({length: 10}, (_, k) => (
              <g key={k}>
                <line x1={k % 5 === 0 ? 674 : 680} y1={800 - k * 60} x2={690} y2={800 - k * 60} stroke={C.muted} strokeWidth={2} />
                {k % 5 === 0 ? (
                  <Label x={668} y={800 - k * 60} anchor="end" size={18} color={C.muted} font="mono">
                    {(k * 0.2).toFixed(0)} m
                  </Label>
                ) : null}
              </g>
            ))}
            <Label x={668} y={500} anchor="end" size={18} color={C.muted} font="mono">
              1 m
            </Label>
            <Label x={668} y={800 - 9 * 60} anchor="end" size={18} color={C.muted} font="mono">
              1,8 m
            </Label>
            {/* ruang bertekanan 120 mmHg */}
            <rect x={700} y={800} width={120} height={40} rx={6} fill="#3a1a3a" stroke={C.press} strokeWidth={2.5} />
            {[725, 760, 795].map((x) => (
              <PressureArrow key={x} x={x} y={801} nx={0} ny={1} L={30} width={3} />
            ))}
            <rect x={750} y={lvl4} width={20} height={800 - lvl4} fill={C.water} opacity={0.85} />
            <path d={`M750,${lvl4 + 3} Q760,${lvl4 - 5} 770,${lvl4 + 3}`} fill={C.water} />
            <Stream
              pts={[
                [760, 800],
                [760, lvl4],
              ]}
              color="cyan"
              n={6}
              speed={0.6}
              r={3}
              jitter={1}
              opacity={rise4 > 0.01 && rise4 < 0.99 ? 0.9 : 0}
            />
            <path d="M746,800 L746,262 A14,14 0 0 1 774,262 L774,800" fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={3} />
            <Label x={790} y={lvl4} anchor="start" size={26} color={C.water} weight={600} opacity={ramp(rise4, 0.8, 1)}>
              air ≈ 1,6 m
            </Label>
            <Label x={760} y={868} size={20} color={C.press}>
              120 mmHg
            </Label>
            {/* raksa 120 mm pembanding */}
            <rect x={880} y={800} width={40} height={40} rx={4} fill="#3a1a3a" stroke={C.press} strokeWidth={2} />
            <rect x={894} y={800 - 36} width={12} height={36} fill={HG} />
            <path d="M890,800 L890,700 A10,10 0 0 1 910,700 L910,800" fill="none" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={2.5} />
            <Label x={900} y={676} size={22} color={HG}>
              raksa 120 mm
            </Label>
            <Body x={1110} feet={838} H={510} arm={82} t={t} />
            <Label x={1110} y={870} size={20} color={C.muted}>
              orang ≈ 1,7 m
            </Label>
            <Motes x={760} y={520} rx={160} ry={300} n={18} color="water" opacity={0.4} seed={9} />
          </g>
        ) : null}

        {/* ======= P5 ======= */}
        {p5 > 0.001 ? (
          <g opacity={p5}>
            <line x1={520} y1={B5.heart.y} x2={1010} y2={B5.heart.y} stroke={C.heat} strokeWidth={2} strokeDasharray="8 8" opacity={0.6 * lvl5} />
            <Label x={1020} y={B5.heart.y} anchor="start" size={22} color={C.heat} opacity={lvl5}>
              setinggi jantung
            </Label>
            <Body x={700} feet={860} H={560} arm={armA} t={t} />
            <Heart x={B5.heart.x} y={B5.heart.y} s={16} t={t} />
            <Stream pts={[[B5.heart.x, B5.heart.y], [B5.sh.x, B5.sh.y], [B5.hand.x, B5.hand.y]]} color="heat" n={8} speed={0.55} r={4} jitter={0} opacity={0.9} />
            {/* manset kecil di lengan */}
            <g transform={`translate(${cuff5.x.toFixed(2)} ${cuff5.y.toFixed(2)}) rotate(${armA.toFixed(2)})`}>
              <rect x={-26} y={-24} width={52} height={48} rx={10} fill="#2d4a8a" stroke="#8fb0ff" strokeWidth={2} />
            </g>
            <g opacity={raise}>
              <Arrow x1={cuff5.x + 70} y1={B5.heart.y} x2={cuff5.x + 70} y2={cuff5.y} color="spr" width={4} both pulse={false} />
              <Label x={cuff5.x + 92} y={(B5.heart.y + cuff5.y) / 2} anchor="start" size={34} color={C.spr} font="serif" italic>
                h
              </Label>
            </g>
            {/* tekanan terukur */}
            <g>
              <Label x={1180} y={560} anchor="start" size={24} color={C.muted}>
                tekanan terukur di lengan
              </Label>
              <rect x={1180} y={590} width={460} height={34} rx={17} fill={C.press} opacity={0.12} />
              <rect x={1180} y={590} width={460 * (1 - 0.32 * raise)} height={34} rx={17} fill={C.press} opacity={0.85} />
              <rect x={1180 + 460 * (1 - 0.32 * raise)} y={590} width={460 * 0.32 * raise} height={34} rx={4} fill="none" stroke={C.press} strokeDasharray="6 5" opacity={0.6 * raise} />
              <Label x={1640 - 460 * 0.16 * raise} y={650} size={22} color={C.spr} opacity={raise}>
                − ρgh
              </Label>
            </g>
          </g>
        ) : null}

        {/* ======= P6: infus ======= */}
        {p6 > 0.001 ? (
          <g opacity={p6}>
            <Motes x={760} y={500} rx={500} ry={300} n={20} color="water" opacity={0.35} seed={14} />
            {/* tiang */}
            <line x1={560} y1={200} x2={560} y2={850} stroke="#8fa0d0" strokeWidth={6} />
            <line x1={500} y1={858} x2={620} y2={858} stroke="#8fa0d0" strokeWidth={6} strokeLinecap="round" />
            <path d="M560,200 L560,190 Q560,178 572,178 L590,178" fill="none" stroke="#8fa0d0" strokeWidth={4} />
            {/* kantong */}
            <rect x={510} y={214} width={100} height={150} rx={18} fill="#cfeaff" opacity={0.16} stroke="#bfe3ff" strokeWidth={2.5} />
            <Water x={514} y={254} w={92} h={106} amp={1.5} seed={7} caustics={false} />
            <path d="M548,364 L572,364 L566,388 L554,388 Z" fill="#bfe3ff" opacity={0.6} />
            {/* ruang tetes */}
            <rect x={543} y={390} width={34} height={82} rx={8} fill="#cfeaff" opacity={0.12} stroke="#bfe3ff" strokeWidth={2} />
            <rect x={546} y={452} width={28} height={18} rx={4} fill={C.water} opacity={0.75} />
            {(() => {
              const grow = Math.min(1, dripPh / 0.6);
              const fall = Math.max(0, (dripPh - 0.6) / 0.4);
              const y = 398 + 52 * fall * fall;
              return (
                <g>
                  <circle cx={560} cy={y} r={2 + 3.5 * grow} fill="#9fd0ff" opacity={fall < 0.98 ? 1 : 0.3} />
                  <Ripple x={560} y={453} p={(dripPh + 0.02) * 2.2 - 0.02} r={22} color="water" rings={1} width={2} />
                </g>
              );
            })()}
            {/* selang */}
            <path d={smoothPath(tube)} fill="none" stroke="#bfe3ff" strokeWidth={8} opacity={0.35} strokeLinecap="round" />
            <path d={smoothPath(tube)} fill="none" stroke={C.water} strokeWidth={3} opacity={0.6} strokeLinecap="round" />
            <Stream pts={tube} color="water" n={10} speed={0.3} r={4} jitter={0} />
            <rect x={548} y={560} width={24} height={30} rx={5} fill="#3a4a7a" stroke="#8fa0d0" strokeWidth={2} />
            {/* pasien berbaring */}
            <rect x={900} y={760} width={720} height={24} rx={8} fill="#26315c" stroke="#6f7fb8" strokeWidth={2} />
            {[930, 1590].map((x) => (
              <line key={x} x1={x} y1={784} x2={x} y2={860} stroke="#6f7fb8" strokeWidth={6} />
            ))}
            <rect x={1500} y={712} width={110} height={48} rx={20} fill="#e3e8f3" opacity={0.85} />
            <line x1={1160} y1={724} x2={1480} y2={720} stroke="#4a5890" strokeWidth={70} strokeLinecap="round" />
            <circle cx={1528} cy={704 + 1.5 * Math.sin(t * 1.4)} r={34} fill="#4a5890" stroke="#9aa8dc" strokeWidth={2.5} />
            <line x1={1180} y1={714} x2={990} y2={716} stroke="#8a6a58" strokeWidth={34} strokeLinecap="round" />
            <line x1={1180} y1={714} x2={990} y2={716} stroke={SKIN} strokeWidth={30} strokeLinecap="round" />
            <ellipse cx={968} cy={716} rx={26} ry={18} fill={SKIN} stroke="#8a6a58" strokeWidth={2} />
            <path d="M985,708 L1180,706" stroke="#5b86ff" strokeWidth={5} opacity={0.8} />
            <rect x={990} y={698} width={40} height={18} rx={4} fill="#e3e8f3" opacity={0.75} />
            <Label x={1100} y={672} size={22} color="#8fb0ff">
              pembuluh vena
            </Label>
            {/* tinggi h */}
            <Arrow x1={470} y1={714} x2={470} y2={256} color="spr" width={4} both pulse={false} />
            <line x1={460} y1={714} x2={990} y2={714} stroke={C.spr} strokeWidth={1.5} strokeDasharray="6 6" opacity={0.5} />
            <line x1={460} y1={256} x2={514} y2={256} stroke={C.spr} strokeWidth={1.5} strokeDasharray="6 6" opacity={0.5} />
            <Label x={446} y={485} anchor="end" size={36} color={C.spr} font="serif" italic>
              h
            </Label>
            <g opacity={f6}>
              <PressureArrow x={1004} y={704} nx={-1} ny={-0.6} L={70} width={5} />
              <PressureArrow x={1040} y={700} nx={1} ny={-0.6} L={30} width={3} color="#8fb0ff" />
              <Ripple x={1010} y={708} p={(((t * 0.7) % 1) + 1) % 1} r={50} color="press" rings={1} />
            </g>
            <Label x={560} y={880} size={20} color={C.muted}>
              kantong digantung tinggi
            </Label>
          </g>
        ) : null}
        <Glow x={1420} y={330} r={360} color="press" opacity={0.3 * Math.max(f2, f4 * p4, f5 * p5, f6 * p6)} />
        <Twinkles x={1450} y={330} rx={260} ry={60} n={4} color="gold" opacity={0.7 * f4 * p4} seed={5} />
      </Stage>

      {/* langkah barometer (baris 1–2) */}
      {['① tabung diisi penuh raksa', '② ditutup, lalu dibalik', '③ dibuka di dalam wadah raksa'].map((s, i) => (
        <Note key={s} x={1260} y={300 + i * 100} anchor="left" p={ramp(t, steps[i] - 0.2, steps[i] + 0.6) * stepOut * (1 - ramp(t, cue(3) - 0.3, cue(3) + 0.3))} color={C.cyan} size={28}>
          {s}
        </Note>
      ))}
      <Note x={1440} y={520} p={p1 * ramp(t, wordOf(0, 'seratus') - 0.2, wordOf(0, 'seratus') + 0.6)} color={C.heat} size={40}>
        120 / 80 <span style={{fontSize: 26, color: C.muted}}>mmHg</span>
      </Note>
      <Formula x={1420} y={330} p={f2} accent={C.press} size={60} caption="13 600 kg/m³ · 9,8 m/s² · 0,76 m ≈ 101 kPa">
        <V>p</V>
        <Sub>atm</Sub> = <V>ρ</V>
        <Sub>raksa</Sub> <V>g h</V>
      </Formula>
      <Note x={1610} y={300} p={p3 * n3} color={C.spr} size={26}>
        ρ raksa ≈ 13,6 × ρ air
        <br />→ kolomnya 13,6 × lebih pendek
      </Note>
      <Formula x={1400} y={245} p={f4 * Math.min(1, p4 * 1.5)} accent={C.press} size={60} caption="13 600 · 9,8 · 0,12 ≈ 16 000 Pa → kolom air ≈ 1,6 m">
        120 mmHg ≈ <b style={{color: C.press}}>16 kPa</b>
      </Formula>
      <Formula x={1410} y={330} p={f5 * Math.min(1, p5 * 1.5)} accent={C.spr} size={58}>
        <V>p</V>
        <Sub>lengan</Sub> = <V>p</V>
        <Sub>jantung</Sub> − <V>ρgh</V>
      </Formula>
      <Formula x={1340} y={330} p={f6} accent={C.water} size={60} caption="tekanan cairan di jarum mengalahkan tekanan vena">
        <V>ρgh</V> &gt; <V>p</V>
        <Sub>vena</Sub>
      </Formula>
    </AbsoluteFill>
  );
};
