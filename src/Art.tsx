import type { Kind } from './game';

export function Arrow({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: direction === 'left' ? 'rotate(180deg)' : undefined }}><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="square" /></svg>;
}
export function Runner({ happy = false }: { happy?: boolean }) {
  return <g stroke="#24372e" strokeWidth="3" strokeLinejoin="round">
    <ellipse cx="0" cy="42" rx="33" ry="8" fill="#24372e" opacity=".13" stroke="none" />
    <g className="runner-legs"><path d="m-7 15-11 22-12 2 2 6h19L3 18" fill="#24372e" /><path d="m6 15 14 15 10-6 5 6-17 11L0 24" fill="#385548" /></g>
    <path d="m-14-16-16 15 7 12 7-3-4-9 10-6M13-14l16 12-7 16-7-4 6-10-12-7" fill="#f4c5a2" />
    <rect x="-41" y="3" width="20" height="19" rx="2" fill="#d2a55e" transform="rotate(-12 -31 12)" /><path d="M-36 3v-5h10v5" fill="none" />
    <path d="m-13-20 25 1 5 36-32 1Z" fill="#faf9ed" /><path d="m-3-19 7 0-2 8 5 15-7 5-5-5 4-16Z" fill="#e96849" strokeWidth="2" />
    <path d="m-15-47 30 0 2 23-12 10-16-7Z" fill="#f4c5a2" />
    <path d="m-16-38-2-12 8-7 23 3 6 13-10-1-2-7-14 10Z" fill="#24372e" />
    <path d="M-4-34v2m13-2v2" strokeLinecap="round" /><path d={happy ? 'm-3-27 5 4 6-5' : 'm0-26 7-1'} fill="none" strokeWidth="2" />
  </g>;
}
export function Obstacle({ kind }: { kind: Kind }) {
  if (kind === 'coffee') return <g stroke="#24372e" strokeWidth="2.5"><ellipse cy="23" rx="23" ry="5" fill="#24372e" opacity=".12" stroke="none" /><circle r="26" fill="#e7edb1" strokeDasharray="3 4" /><path d="M11-8h7q10 8-2 15h-4" fill="none" /><path d="m-14-12 3 29h22l3-29Z" fill="#fffdf2" /><path d="M-17-12h34v-5h-34Z" fill="#24372e" /><path d="M-12-1h24v11h-24" fill="#e5b942" stroke="none" /><path d="M-5-25q-4-4 0-8m11 8q-4-4 0-8" fill="none" /></g>;
  if (kind === 'donut') return <g stroke="#8e485e" strokeWidth="2.5"><circle r="30" fill="#ffe2d5" strokeDasharray="4 4" /><circle r="22" fill="#dbaa65" /><path d="M-20-7q1-16 20-16t21 17l-5 9-8-4-7 7-8-7-9 3Z" fill="#ef9fba" /><circle r="7" fill="#f8ead7" /><path d="m-12-12 4-3m17 2 5 2m-12-8 2 3m-15 25 4 2m19-5 2-4" stroke="#fff4c6" strokeWidth="3" /></g>;
  if (kind === 'ticket' || kind === 'leave') {
    const color = kind === 'leave' ? '#8c59ad' : '#397c9b';
    return <g stroke={color} strokeWidth="2.5">
      <path d="M0-45v7M0 38v7M-45 0h7M38 0h7m-72-32 5 5m59-5-5 5m-59 59 5-5m59 5-5-5" strokeWidth="3" />
      <circle r="36" fill={kind === 'leave' ? '#edddf5' : '#d7eef5'} strokeDasharray="3 5" />
      {kind === 'ticket' ? <><path d="M-29-20h58v12q-10 8 0 16v12h-58v-12q10-8 0-16Z" fill="#f3fcff" /><path d="M14-17v34" strokeDasharray="3 3" /><text x="-6" y="-5" textAnchor="middle" fill={color} stroke="none" fontSize="9" fontWeight="800">WEEKEND</text><path d="M-22 7H5m-6-5 6 5-6 5" fill="none" /></> : <><path d="M-23-27h32l15 15v39h-47Z" fill="#fff8fc" /><path d="M9-27v15h15" fill="#d7b8e7" /><text y="2" textAnchor="middle" fill={color} stroke="none" fontSize="15" fontWeight="900">有休届</text><rect x="-12" y="10" width="26" height="12" rx="1" fill="#8c59ad" /><text x="1" y="19" textAnchor="middle" fill="#fff" stroke="none" fontSize="8" fontWeight="800">承認済</text></>}
    </g>;
  }
  const label = { meeting: '会議', revision: '差し戻し', urgent: '至急' }[kind];
  return <g stroke="#24372e" strokeWidth="2"><ellipse cy="31" rx="41" ry="7" fill="#24372e" opacity=".12" stroke="none" /><rect x="-36" y="-26" width="72" height="54" rx="3" fill={kind === 'urgent' ? '#f18a6b' : kind === 'revision' ? '#e6d6ed' : '#fcfaf0'} transform="rotate(-5)" /><path d="M-25-14h25m-25 7h17" opacity=".4" /><text y="16" textAnchor="middle" fill="#24372e" stroke="none" fontSize={kind === 'revision' ? 15 : 22} fontWeight="900">{label}</text><circle cx="26" cy="-23" r="12" fill="#f4cc4c" /><text x="26" y="-18" textAnchor="middle" stroke="none" fill="#24372e" fontSize="16" fontWeight="900">!</text></g>;
}
export function Office({ elapsed }: { elapsed: number }) {
  return <g>
    <rect width="640" height="540" fill="#e8eadd" />
    <path d="M0 0h640v128H0" fill="#d9dfd0" />
    <path d="M0 128h640M0 0l110 128m530-128L530 128" stroke="#b7c1b0" strokeWidth="2" />
    <g fill="#f7f6e9" stroke="#aab8a4" strokeWidth="2"><rect x="15" y="29" width="90" height="77" /><rect x="535" y="29" width="90" height="77" /></g>
    <path d="M60 30v75m-43-38h86m477-37v75m-43-38h86" stroke="#c1cbb9" strokeWidth="3" />
    <path d="m15 105 90-45v45m430 0 90-45v45" fill="#c2cfb8" />
    <rect x="240" y="25" width="160" height="103" fill="#91a48b" stroke="#526e55" strokeWidth="3" />
    <rect x="252" y="37" width="136" height="91" fill="#bdcfb0" /><path d="M320 37v91" stroke="#738d6c" strokeWidth="2" />
    <rect x="262" y="4" width="116" height="26" rx="2" fill="#28553e" />
    <text x="320" y="23" fill="#f8f8e8" textAnchor="middle" fontSize="17" fontWeight="800" letterSpacing="3">EXIT →</text>
    <g stroke="#bcc5b1" strokeWidth="1"><path d="M110 128 55 540m420 0-45-412M0 230h640M0 380h640" /><path d="M216 128 200 540m224-412 16 412" strokeDasharray="8 11" strokeWidth="2" /></g>
    {[0, 1, 2].map(i => <g key={i} transform={`translate(${160 + i * 160} ${195 + (elapsed * 90 % 240)})`} opacity=".22" fill="none" stroke="#527356" strokeWidth="5"><path d="m-12 9 12-12 12 12m-24 14 12-12 12 12" /></g>)}
    <g fill="#697e5a" stroke="#354e39" strokeWidth="2"><path d="M31 164q-34-39-8-39 15 1 15 30-12-61 10-53 21 7-6 53 35-40 37-15 0 15-38 31" /><path d="m23 164 5 36h29l5-36Z" fill="#d5b07c" /><path d="M587 187q-30-38-8-38 16 0 16 27-7-62 13-49 16 9-8 48 29-31 34-15 4 15-35 32" /><path d="m578 186 5 30h28l5-30Z" fill="#d5b07c" /></g>
    <g transform="translate(40 330) rotate(-9)"><rect width="65" height="89" fill="#efe9d2" stroke="#c9c4ad" strokeWidth="2" /><text x="32" y="28" textAnchor="middle" fill="#6c7964" fontSize="10">今月の標語</text><text x="32" y="49" textAnchor="middle" fill="#4e6350" fontSize="12" fontWeight="800">定時退社</text><text x="32" y="67" textAnchor="middle" fill="#4e6350" fontSize="12" fontWeight="800">ヨシ！</text></g>
    <path d="M0 490h640v50H0" fill="#d3d6c3" opacity=".5" />
  </g>;
}
