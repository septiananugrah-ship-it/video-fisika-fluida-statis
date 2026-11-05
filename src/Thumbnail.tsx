import React from 'react';
import {AbsoluteFill} from 'remotion';
import {BRAND} from './brand';
import {C, FONT} from './theme';

/** Gambar mini 2K untuk YouTube/LMS. */
export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{background: `radial-gradient(ellipse 80% 70% at 30% 40%, #20305e 0%, ${C.bg} 70%)`, fontFamily: FONT.head}}>
    <div style={{position: 'absolute', left: 140, top: 180, color: C.gold, fontSize: 54, letterSpacing: 10, fontWeight: 600}}>{BRAND.series.toUpperCase()}</div>
    <div style={{position: 'absolute', left: 130, top: 270, color: C.ink, fontSize: 200, fontWeight: 700, lineHeight: 0.95, letterSpacing: -6}}>
      Dorongan
      <br />
      <span style={{color: C.water}}>Tak Terlihat</span>
    </div>
    <div style={{position: 'absolute', left: 140, top: 760, color: C.muted, fontSize: 70, fontWeight: 500}}>{BRAND.subtitle}</div>
    <div style={{position: 'absolute', left: 140, bottom: 140, color: C.ink, fontSize: 44, letterSpacing: 8, fontWeight: 600}}>
      {BRAND.channel} <span style={{color: C.muted, letterSpacing: 2, fontWeight: 400}}>· {BRAND.tagline}</span>
    </div>
    <svg width={2560} height={1440} style={{position: 'absolute', inset: 0}}>
      <rect x={1640} y={420} width={760} height={700} fill={C.water} opacity={0.22} />
      <path d="M1640,420 Q1735,404 1830,420 T2020,420 T2210,420 T2400,420" fill="none" stroke={C.water} strokeWidth={6} />
      <path d="M1620,300 L1620,1140 L2420,1140 L2420,300" fill="none" stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
      {[540, 700, 860, 1020].map((y, i) => (
        <g key={y}>
          <line x1={1660} y1={y} x2={1660 + 50 + i * 40} y2={y} stroke={C.press} strokeWidth={9} strokeLinecap="round" />
          <path d={`M${1660 + 50 + i * 40 - 22},${y - 16} L${1660 + 50 + i * 40 + 6},${y} L${1660 + 50 + i * 40 - 22},${y + 16}`} fill={C.press} />
        </g>
      ))}
      <rect x={2060} y={360} width={200} height={170} rx={10} fill={C.gold} opacity={0.9} />
      <line x1={2160} y1={720} x2={2160} y2={560} stroke={C.buoy} strokeWidth={12} strokeLinecap="round" />
      <path d="M2134,580 L2160,540 L2186,580 Z" fill={C.buoy} />
    </svg>
  </AbsoluteFill>
);
