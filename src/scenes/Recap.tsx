import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BACK, EASE_IN_OUT, cyc, ramp, rand, win} from '../anim';
import {Frac, Glow, Motes, Ripple, Stage, Stream, Sub, Twinkles, V} from '../components/primitives';
import {useScene} from '../SceneContext';
import {C, FONT} from '../theme';

// Enam kartu rangkuman (baris 1–5; baris 5 memuat dua kartu), lalu pertanyaan kunci.
// Tiap kartu punya animasi mini yang terus berulang di pita bawahnya.
const SW = 444;
const SH = 64;

const hex2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
const ph = (t: number, period: number, off = 0) => ((((t + off) / period) % 1) + 1) % 1;
const MONO = {fontFamily: FONT.mono, fontSize: 15, fill: C.muted} as const;

/** 01 · Massa jenis: tiga lapisan cairan; benda mengendap di lapisan yang sesuai ρ-nya. */
const MiniDensity: React.FC<{t: number}> = ({t}) => {
  const objs = [
    {y: 4, r: 7, c: '#c98a4a', off: 0},
    {y: 22, r: 6, c: '#e8ecf5', off: 1.3},
    {y: 40, r: 7, c: '#8f5bd8', off: 2.6},
  ];
  return (
    <g>
      <rect x={10} y={4} width={250} height={18} fill="#ffd24a" opacity={0.3} />
      <rect x={10} y={22} width={250} height={18} fill={C.water} opacity={0.45} />
      <rect x={10} y={40} width={250} height={20} fill={C.spr} opacity={0.5} />
      <path d={`M10,0 L10,60 L260,60 L260,0`} fill="none" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={2} />
      {objs.map((o, i) => {
        const p = ph(t, 4, o.off);
        const set = o.y - (o.y + 14) * Math.exp(-5 * p) * Math.cos(9 * p);
        return <circle key={i} cx={60 + i * 75} cy={set} r={o.r} fill={o.c} opacity={cyc(p) * 1.15} stroke="#fff" strokeOpacity={0.4} />;
      })}
      <text x={282} y={13} {...MONO} dominantBaseline="central">
        ρ kecil ↑
      </text>
      <text x={282} y={50} {...MONO} dominantBaseline="central">
        ρ besar ↓
      </text>
    </g>
  );
};

/** 02 · Tekanan: panah tekanan memanjang dengan kedalaman, grafik p–h lurus. */
const MiniPressure: React.FC<{t: number}> = ({t}) => {
  const p = ph(t, 3);
  return (
    <g>
      <rect x={12} y={10} width={156} height={50} fill={C.water} opacity={0.4} />
      <path d="M10,2 L10,62 L170,62 L170,2" fill="none" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={2} />
      {[18, 30, 42, 54].map((y, i) => {
        const L = 14 + (y - 10) * 1.6 * (1 + 0.06 * Math.sin(t * 4 + i));
        return (
          <g key={y}>
            <line x1={166 - L} y1={y} x2={160} y2={y} stroke={C.press} strokeWidth={3} strokeLinecap="round" />
            <path d={`M166,${y} l-8,-5 l0,10 Z`} fill={C.press} />
          </g>
        );
      })}
      <line x1={230} y1={6} x2={230} y2={60} stroke={C.muted} strokeWidth={2} />
      <line x1={230} y1={6} x2={420} y2={6} stroke={C.muted} strokeWidth={2} />
      <line x1={232} y1={8} x2={410} y2={58} stroke={C.press} strokeWidth={3} />
      <circle cx={232 + 178 * p} cy={8 + 50 * p} r={5} fill={C.press} opacity={cyc(p) * 1.2} />
      <text x={214} y={56} {...MONO} dominantBaseline="central">
        h
      </text>
      <text x={428} y={8} {...MONO} dominantBaseline="central">
        p
      </text>
    </g>
  );
};

/** 03 · Pascal: piston kecil turun jauh, piston besar naik sedikit mengangkat beban. */
const MiniPascal: React.FC<{t: number}> = ({t}) => {
  const s = 18 * (0.5 - 0.5 * Math.cos(t * 1.8));
  const yl = 14 + s;
  const yr = 26 - s / 5;
  return (
    <g>
      <path d={`M40,${yl} L64,${yl} L64,48 L230,48 L230,${yr} L360,${yr} L360,60 L40,60 Z`} fill={C.water} opacity={0.5} />
      <path d="M38,0 L38,62 L362,62 L362,0 M66,0 L66,46 L228,46 L228,0" fill="none" stroke="#bfe3ff" strokeOpacity={0.7} strokeWidth={2} />
      <rect x={40} y={yl - 6} width={24} height={6} fill="#8fa0d0" />
      <rect x={230} y={yr - 6} width={130} height={6} fill="#8fa0d0" />
      <rect x={262} y={yr - 30} width={66} height={24} rx={5} fill="url(#crate)" stroke={C.force} strokeWidth={1.5} />
      <line x1={52} y1={yl - 30} x2={52} y2={yl - 10} stroke={C.force} strokeWidth={3} markerEnd="url(#arrow-force)" />
      <text x={78} y={20} {...MONO} dominantBaseline="central">
        gaya kecil
      </text>
      <text x={376} y={yr - 18} {...MONO} dominantBaseline="central">
        beban
      </text>
    </g>
  );
};

/** 04 · Gaya apung: balok terapung bergoyang, F_A ke atas = berat ke bawah. */
const MiniBuoy: React.FC<{t: number}> = ({t}) => {
  const bob = 2.5 * Math.sin(t * 1.8);
  const wy = 32;
  const top = wy - 12 + bob;
  const p = ph(t, 2.2);
  return (
    <g>
      <path d={Array.from({length: 13}, (_, i) => `${i ? 'L' : 'M'}${10 + i * 20},${(wy + 1.5 * Math.sin(i * 0.8 + t * 2.4)).toFixed(1)}`).join(' ') + ' L250,62 L10,62 Z'} fill={C.water} opacity={0.45} />
      <circle cx={130} cy={wy} r={10 + 50 * p} fill="none" stroke="#cfeaff" strokeWidth={1.5} opacity={cyc(p) * 0.6} />
      <rect x={108} y={top} width={44} height={34} rx={4} fill="url(#crate)" stroke="#8fa0d0" strokeWidth={1.5} />
      <line x1={180} y1={top + 17} x2={180} y2={top - 10} stroke={C.buoy} strokeWidth={4} markerEnd="url(#arrow-buoy)" />
      <line x1={196} y1={top + 17} x2={196} y2={top + 44} stroke={C.force} strokeWidth={4} markerEnd="url(#arrow-force)" />
      <text x={266} y={14} {...MONO} fill={C.buoy} dominantBaseline="central">
        F<tspan baselineShift="sub" fontSize="0.7em">A</tspan> = berat fluida
      </text>
      <text x={266} y={34} {...MONO} dominantBaseline="central">
        yang dipindahkan
      </text>
    </g>
  );
};

/** 05 · Tegangan permukaan: lapisan sabun menarik batang geser kembali. */
const MiniFilm: React.FC<{t: number}> = ({t}) => {
  const xs = 210 + 50 * Math.sin(t * 1.4);
  return (
    <g>
      <defs>
        <linearGradient id="rc-film" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.cyan} stopOpacity={0.35} />
          <stop offset="50%" stopColor="#ff9be0" stopOpacity={0.25} />
          <stop offset="100%" stopColor={C.cyan} stopOpacity={0.35} />
        </linearGradient>
      </defs>
      <rect x={30} y={10} width={xs - 30} height={44} fill="url(#rc-film)" />
      {[0, 1, 2].map((k) => {
        const q = ph(t, 2.4, k * 0.8);
        return <path key={k} d={`M${30 + q * (xs - 40)},10 q10,22 0,44`} fill="none" stroke="#fff" strokeOpacity={0.2 * cyc(q)} strokeWidth={2} />;
      })}
      <path d="M330,10 L30,10 L30,54 L330,54" fill="none" stroke="#c9d2ee" strokeWidth={3} />
      <line x1={xs} y1={4} x2={xs} y2={60} stroke="#e8ecf5" strokeWidth={5} strokeLinecap="round" />
      <line x1={xs - 6} y1={32} x2={xs - 52} y2={32} stroke={C.cyan} strokeWidth={4} markerEnd="url(#arrow-cyan)" />
      <text x={350} y={32} {...MONO} fill={C.cyan} dominantBaseline="central">
        F = 2γL
      </text>
    </g>
  );
};

/** 06 · Kapilaritas: pipa makin sempit, air naik makin tinggi. */
const MiniCapillary: React.FC<{t: number}> = ({t}) => {
  const p = ph(t, 4);
  const rise = 1 - (1 - Math.min(1, p / 0.55)) ** 2;
  const tubes = [
    {x: 60, r: 3, h: 40},
    {x: 130, r: 5, h: 24},
    {x: 200, r: 8, h: 15},
  ];
  return (
    <g>
      <rect x={10} y={50} width={250} height={12} fill={C.water} opacity={0.5} />
      {tubes.map((b) => {
        const lv = 50 - b.h * rise;
        return (
          <g key={b.x}>
            <rect x={b.x - b.r} y={lv} width={2 * b.r} height={58 - lv} fill={C.water} opacity={0.85 * Math.min(1, cyc(p) * 1.4) + 0.15} />
            <rect x={b.x - b.r - 2} y={2} width={2 * b.r + 4} height={58} fill="none" stroke="#bfe3ff" strokeOpacity={0.75} strokeWidth={1.5} />
          </g>
        );
      })}
      <text x={282} y={18} {...MONO} dominantBaseline="central">
        r kecil →
      </text>
      <text x={282} y={40} {...MONO} dominantBaseline="central">
        h besar
      </text>
    </g>
  );
};

type HueK = 'spr' | 'press' | 'force' | 'buoy' | 'cyan' | 'water';
const ITEMS: {title: string; color: string; hue: HueK; body: React.ReactNode; Mini: React.FC<{t: number}>}[] = [
  {
    title: 'Massa jenis',
    color: C.spr,
    hue: 'spr',
    body: (
      <span>
        <V>ρ</V> = <Frac n={<V>m</V>} d={<V>V</V>} />
      </span>
    ),
    Mini: MiniDensity,
  },
  {
    title: 'Tekanan',
    color: C.press,
    hue: 'press',
    body: (
      <span>
        <V>p</V> = <Frac n={<V>F</V>} d={<V>A</V>} />, &nbsp;Δ<V>p</V> = <V>ρgh</V>
      </span>
    ),
    Mini: MiniPressure,
  },
  {
    title: 'Hukum Pascal',
    color: C.force,
    hue: 'force',
    body: (
      <span>
        <Frac
          n={
            <span>
              <V>F</V>
              <Sub>1</Sub>
            </span>
          }
          d={
            <span>
              <V>A</V>
              <Sub>1</Sub>
            </span>
          }
        />{' '}
        ={' '}
        <Frac
          n={
            <span>
              <V>F</V>
              <Sub>2</Sub>
            </span>
          }
          d={
            <span>
              <V>A</V>
              <Sub>2</Sub>
            </span>
          }
        />
      </span>
    ),
    Mini: MiniPascal,
  },
  {
    title: 'Gaya apung',
    color: C.buoy,
    hue: 'buoy',
    body: (
      <span>
        <V>F</V>
        <Sub>A</Sub> = <V>ρ</V>
        <Sub>f</Sub> <V>g V</V>
        <Sub>tercelup</Sub>
      </span>
    ),
    Mini: MiniBuoy,
  },
  {
    title: 'Tegangan permukaan',
    color: C.cyan,
    hue: 'cyan',
    body: (
      <span>
        <V>γ</V> = <Frac n={<V>F</V>} d={<span>2<V>L</V></span>} />
      </span>
    ),
    Mini: MiniFilm,
  },
  {
    title: 'Kapilaritas',
    color: C.water,
    hue: 'water',
    body: (
      <span>
        <V>h</V> = <Frac n={<span>2<V>γ</V> cos <V>θ</V></span>} d={<V>ρgr</V>} />
      </span>
    ),
    Mini: MiniCapillary,
  },
];

const COLS = [400, 960, 1520];
const ROWS = [326, 596];
const CH = 244;

export const Recap: React.FC = () => {
  const {t, cue, wordOf} = useScene();
  const starts = [cue(1), cue(2), cue(3), cue(4), cue(5), Math.max(cue(5) + 1.0, wordOf(5, 'kapilaritas') - 0.2)];
  const nextOf = (i: number) => (i < 5 ? starts[i + 1] : cue(6));
  const head = ramp(t, 0, 0.8);
  const q = ramp(t, cue(6) + 0.2, cue(6) + 1.2);
  const dim = 1 - 0.6 * ramp(t, cue(6), cue(6) + 1.0, EASE_IN_OUT);
  return (
    <AbsoluteFill>
      <Stage>
        <Motes x={960} y={470} rx={900} ry={330} n={40} color="cyan" opacity={0.35} seed={5} />
        {/* gelembung latar */}
        {Array.from({length: 14}, (_, k) => {
          const p = ph(t, 9 + 4 * rand(k), rand(k * 3.1) * 9);
          return <circle key={k} cx={120 + rand(k * 5.3) * 1680 + 10 * Math.sin(t + k)} cy={880 - p * 700} r={3 + 5 * rand(k * 1.7)} fill="none" stroke="#cfeaff" strokeWidth={1.3} opacity={cyc(p) * 0.25} />;
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const o = ramp(t, 0.2 + i * 0.12, 0.9 + i * 0.12) * (1 - ramp(t, starts[i] - 0.2, starts[i] + 0.4));
          const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 - i * 0.9);
          return o > 0.01 ? (
            <rect key={it.title} x={x - 250} y={y - CH / 2} width={500} height={CH} rx={20} fill={it.color} fillOpacity={0.03 + 0.03 * pulse} stroke={it.color} strokeOpacity={0.25 + 0.25 * pulse} strokeWidth={2} strokeDasharray="10 9" strokeDashoffset={-t * 16} opacity={o} />
          ) : null;
        })}
        {ITEMS.map((it, i) => {
          const x = COLS[i % 3];
          const y = ROWS[Math.floor(i / 3)];
          const act = win(t, starts[i], nextOf(i), 0.5, 0.6) * dim;
          return (
            <g key={it.title}>
              <Glow x={x} y={y} r={300} color={it.hue} opacity={0.35 * act} />
              <Ripple x={x} y={y} p={(t - starts[i] - 0.1) / 1.3} r={300} color={it.hue} rings={2} width={2} />
            </g>
          );
        })}
        <g opacity={q}>
          <Stream
            pts={[
              [100, 800],
              [200, 800],
              [300, 800],
            ]}
            color="press"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Stream
            pts={[
              [1820, 800],
              [1720, 800],
              [1620, 800],
            ]}
            color="buoy"
            n={6}
            speed={0.6}
            r={6}
            jitter={4}
          />
          <Twinkles x={960} y={800} rx={620} ry={40} n={7} color="gold" seed={7} />
        </g>
      </Stage>
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', fontFamily: FONT.head, fontSize: 30, letterSpacing: 8 + 2 * (1 - head), color: C.gold, fontWeight: 600, opacity: head}}>
        RANGKUMAN
      </div>
      {ITEMS.map((it, i) => {
        const p = ramp(t, starts[i] - 0.1, starts[i] + 0.7, BACK);
        const x = COLS[i % 3];
        const y = ROWS[Math.floor(i / 3)];
        const act = win(t, starts[i], nextOf(i), 0.5, 0.6);
        const mini = ramp(t, starts[i] + 0.4, starts[i] + 1.2);
        const bob = 3 * Math.sin(t * 1.1 + i * 1.3);
        const Mini = it.Mini;
        return (
          <div
            key={it.title}
            style={{
              position: 'absolute',
              left: x - 250,
              top: y - CH / 2,
              width: 500,
              height: CH,
              boxSizing: 'border-box',
              borderRadius: 20,
              background: 'linear-gradient(160deg, rgba(22,34,72,0.95), rgba(10,16,36,0.95))',
              border: `1.5px solid ${it.color}${hex2(0x55 + 0x44 * act)}`,
              borderLeft: `8px solid ${it.color}`,
              boxShadow: `0 16px 44px rgba(0,0,0,0.45), 0 0 ${30 + 30 * act}px ${it.color}${hex2(0x22 + 0x22 * act)}`,
              padding: '18px 28px 0',
              opacity: Math.min(1, p) * dim,
              scale: String(0.9 + 0.1 * p + 0.02 * act),
              translate: `0px ${bob - 6 * act}px`,
              color: C.ink,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(105deg, transparent ${-40 + p * 150 - 16}%, rgba(255,245,220,0.12) ${-40 + p * 150}%, transparent ${-40 + p * 150 + 16}%)`,
                pointerEvents: 'none',
              }}
            />
            <div style={{fontFamily: FONT.head, fontSize: 26, color: it.color, fontWeight: 600, letterSpacing: 1}}>
              {String(i + 1).padStart(2, '0')} · {it.title}
            </div>
            <div style={{fontFamily: FONT.serif, fontSize: 42, marginTop: 8, whiteSpace: 'nowrap', textAlign: 'center', height: 84, lineHeight: '84px'}}>{it.body}</div>
            <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{display: 'block', marginTop: 2, opacity: mini, overflow: 'visible'}}>
              <Mini t={t + rand(i) * 3} />
            </svg>
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 762,
          textAlign: 'center',
          fontFamily: FONT.head,
          fontSize: 50,
          fontWeight: 700,
          color: C.ink,
          opacity: q,
          translate: `0px ${(1 - q) * 20}px`,
        }}
      >
        Di mana tekanannya <span style={{color: C.press}}>lebih besar</span>, dan ke mana <span style={{color: C.buoy}}>dorongannya</span>?
      </div>
    </AbsoluteFill>
  );
};
