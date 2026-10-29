import { useCallback, useEffect, useRef, useState } from 'react';
import { advance, createGame, DURATION, move, score, REWARDS, multiplier, type RewardKind } from './game';
import { Arrow, Obstacle, Office, Runner } from './Art';

type Phase = 'ready' | 'playing' | 'paused' | 'result';
const BEST_KEY = 'premium-friday-best-v2';
function readBest() {
  try { const value = Number(localStorage.getItem(BEST_KEY)); return Number.isFinite(value) && value > 0 ? value : 0; }
  catch { return 0; }
}

export default function App() {
  const [game, setGame] = useState(createGame);
  const [phase, setPhase] = useState<Phase>('ready');
  const [best, setBest] = useState(readBest);
  const [copied, setCopied] = useState(false);
  const [help, setHelp] = useState(false);
  const touchX = useRef<number | null>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const start = useCallback(() => { setGame(createGame()); setCopied(false); setPhase('playing'); }, []);
  const steer = useCallback((direction: number) => { if (phase === 'playing') setGame(previous => move(previous, direction)); }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    let frame = 0;
    let previous = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(.05, (now - previous) / 1000);
      previous = now;
      setGame(current => advance(current, dt));
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const pause = () => setPhase('paused');
    const visibility = () => { if (document.hidden) pause(); };
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', visibility); };
  }, [phase]);

  useEffect(() => {
    if (game.outcome === 'playing') return;
    setPhase('result');
    const value = score(game);
    if (value > best) {
      setBest(value);
      try { localStorage.setItem(BEST_KEY, String(value)); } catch { /* 保存できない環境でもプレイを継続する。 */ }
    }
  }, [game, best]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) {
        if (phase !== 'playing') return;
        event.preventDefault(); steer(['ArrowLeft', 'a', 'A'].includes(event.key) ? -1 : 1);
      }
      if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        if (event.repeat) return;
        if (phase === 'ready' || phase === 'result') start();
        else setPhase(phase === 'playing' ? 'paused' : 'playing');
      }
      if (event.key === 'Escape') {
        if (phase === 'playing') setPhase('paused');
        else if (phase === 'paused') setPhase('playing');
      }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [phase, steer, start]);

  useEffect(() => { if (phase === 'result' || phase === 'paused') primary.current?.focus({ preventScroll: true }); }, [phase]);

  const minutes = Math.min(60, 55 + Math.floor(game.elapsed / DURATION * 5));
  const clock = minutes === 60 ? '15:00' : `14:${minutes}`;
  const remaining = Math.ceil(DURATION - game.elapsed);
  const won = game.outcome === 'won';
  const copyResult = async () => {
    const text = `【15:00 退社チャレンジ】${won ? 'プレミアム退社、成功！' : '本日も残業です。'} ${score(game).toLocaleString()}pt / 最大回収コンボ ${game.maxCombo}連続 / ×${multiplier(game.maxCombo)}\nhttps://games.furutahss.com/premium-friday/`;
    try { await navigator.clipboard.writeText(text); setCopied(true); }
    catch { setCopied(false); window.prompt('結果をコピーしてください', text); }
  };

  return <div className="site-shell">
    <header className="site-header">
      <a className="brand" href="./" aria-label="プレミアムフライデー トップ"><span className="brand-icon"><Arrow /></span><span>PREMIUM<br />FRIDAY<span className="brand-dot">®</span></span></a>
      <div className="header-caption">月末金曜、自由への小さな抵抗。</div>
      <button className={`help-button ${help ? 'selected' : ''}`} onClick={() => setHelp(!help)} aria-expanded={help} aria-controls="how-to"><span>?</span> 遊び方</button>
    </header>

    <main>
      <section className="hero" aria-labelledby="game-title">
        <div><div className="eyebrow"><span className="tiny-square" /> THE GREAT OFFICE ESCAPE <span className="edition">VOL. 01</span></div>
          <h1 id="game-title"><span className="hero-time">15:00</span><span>退社チャレンジ<span className="title-period">。</span></span></h1>
          <p className="hero-copy">帰れる空気は、待つな。<strong>かわして、帰れ。</strong></p>
        </div>
        <div className="premium-stamp" aria-label="月末金曜 早帰り推奨"><span>毎月さいごの金曜日</span><strong>早帰り<br />推奨</strong><span>LEAVE EARLY. LIVE MORE.</span></div>
      </section>

      {help && <section className="help-panel" id="how-to"><strong>目指せ、15時退社。</strong><p>左右に移動して「会議」「差し戻し」「至急」をかわそう。3回当たると残業確定。45秒逃げ切れば退社成功！ 12秒以降は2レーンをふさぐ案件も出現。 アイテムを連続回収すると4個目から2倍、7個目から3倍、10個目から4倍、13個目から5倍！ 取り逃し・案件に接触するとコンボはリセット。案件回避は30pt。クリア時は残った気力×200ptが加算されます。</p><p>操作：← → / A D、スマホは下の矢印または画面をスワイプ。Space / Escで一時停止。別のタブに移ると自動で一時停止します。</p></section>}

      <div className="game-layout">
        <section className="game-machine" aria-label="退社チャレンジ ゲーム">
          <div className="machine-top"><span><i className={phase === 'playing' ? 'live-dot active' : 'live-dot'} />{phase === 'playing' ? '脱出中' : phase === 'paused' ? 'ひと休み中' : phase === 'result' ? '本日の勤務終了' : '退社準備、ヨシ。'}</span><span>株式会社 カエレナイ <span className="floor-label">3F / 営業部</span></span></div>
          <div className="game-hud"><div><span className="hud-label">社内時計</span><strong className={game.elapsed > 36 ? 'hurry' : ''}>{clock}<span className="seconds-dot">:</span><small>{String(Math.floor((game.elapsed / DURATION * 300) % 60)).padStart(2, '0')}</small></strong></div><div className="health"><span className="hud-label">帰る気力</span><div aria-label={`残り気力 ${game.health} / 3`}>{[0, 1, 2].map(i => <span key={i} className={i < game.health ? 'battery full' : 'battery'} />)}</div></div><div className="score-display"><span className="hud-label">SCORE</span><strong>{String(score(game)).padStart(5, '0')}</strong></div></div>
          <div className={`combo-bar ${game.combo >= 3 ? 'combo-active' : ''}`} aria-label={`回収コンボ ${game.combo}、次の回収は${multiplier(game.combo + 1)}倍`}>
            <span>回収 COMBO <strong>{game.combo}</strong></span><span className="combo-factor">次の回収 ×{multiplier(game.combo + 1)}</span><small>{game.elapsed >= 12 ? '案件ラッシュ中！' : '取り逃し・接触でリセット'}</small>
          </div>
          <div className={`playfield ${phase === 'playing' ? 'is-playing' : ''} ${game.invincible > 0 ? 'hit' : ''}`} onPointerDown={e => { touchX.current = e.clientX; }} onPointerUp={e => { if (touchX.current !== null && Math.abs(e.clientX - touchX.current) > 24) steer(e.clientX > touchX.current ? 1 : -1); touchX.current = null; }} onPointerCancel={() => { touchX.current = null; }}>
            <svg className="office-scene" viewBox="0 0 640 540" role="img" aria-label="3つのレーンを左右に移動し、近づいてくる案件を避けるオフィスの廊下">
              <Office elapsed={game.elapsed} />
              {phase === 'ready' && <><g transform="translate(160 240) rotate(-8)"><Obstacle kind="meeting" /></g><g transform="translate(480 315) rotate(8)"><Obstacle kind="revision" /></g><g transform="translate(320 187)"><Obstacle kind="coffee" /></g></>}
              {game.items.map(item => <g key={item.id} data-kind={item.kind} transform={`translate(${160 + item.lane * 160} ${120 + item.y * 400})`}><Obstacle kind={item.kind} /></g>)}
              <g className={`player ${game.invincible > 0 ? 'invincible' : ''}`} style={{ transform: `translate(${160 + game.lane * 160}px, 440px)` }}><Runner happy={won} /></g>
              {game.pickup && <g className={`coffee-pickup pickup-${game.pickup.kind}`} transform={`translate(${160 + game.pickup.lane * 160} 420)`} opacity={Math.min(1, game.pickup.remaining / .3)} aria-hidden="true">
                <g className="pickup-burst" style={{ transform: `scale(${1 + (1 - game.pickup.remaining / .9) * .7})` }}>
                  <circle r="39" fill={REWARDS[game.pickup.kind].color} fillOpacity=".18" stroke={REWARDS[game.pickup.kind].color} strokeWidth="3" />
                  <path d="M0-57v-10M0 57v10M-57 0h-10M57 0h10M-40-40l-7-7M40-40l7-7M-40 40l-7 7M40 40l7 7" stroke={REWARDS[game.pickup.kind].color} strokeWidth="4" strokeLinecap="round" />
                </g>
                <g className="pickup-label" style={{ transform: `translateY(${-83 - (1 - game.pickup.remaining / .9) * 35}px)` }}>
                  <rect x="-76" y="-28" width="152" height="64" rx="9" fill="#fffcf1" stroke={REWARDS[game.pickup.kind].color} strokeWidth="2" />
                  <text textAnchor="middle" fill={REWARDS[game.pickup.kind].color} fontSize="27" fontWeight="900">+{game.pickup.points.toLocaleString()}<tspan fontSize="16">pt</tspan></text>
                  <text y="18" textAnchor="middle" fill={REWARDS[game.pickup.kind].color} fontSize="11" fontWeight="800">{REWARDS[game.pickup.kind].label} GET!</text>
                  <text y="30" textAnchor="middle" fill={REWARDS[game.pickup.kind].color} fontSize="9" fontWeight="800">{game.pickup.multiplier > 1 ? `COMBO ×${game.pickup.multiplier}` : REWARDS[game.pickup.kind].rarity}</text>
                </g>
              </g>}
              <g fill="#59715a" opacity=".6" fontSize="10" letterSpacing="2" textAnchor="middle"><text x="160" y="523">LEFT</text><text x="320" y="523">KEEP GOING</text><text x="480" y="523">RIGHT</text></g>
            </svg>
            {phase === 'ready' && <div className="start-overlay"><div className="intro-card"><span className="card-kicker">本日のミッション</span><h2>その仕事、<br />月曜でよくない？</h2><p>レアなお宝と回収コンボで、退社力を極めろ。</p><button className="primary-button" onClick={start}>お先に失礼します！<Arrow /></button><span className="start-hint">45秒生存でクリア <span>／</span> ← →・タップで移動</span></div></div>}
            {phase === 'paused' && <div className="modal-backdrop"><div className="result-card pause-card"><span className="card-kicker">TAKE A LITTLE BREAK</span><h2>ちょっと、ひと息。</h2><p>会社は逃げない。あなたは逃げよう。</p><button ref={primary} className="primary-button" onClick={() => setPhase('playing')}>退社を再開する<Arrow /></button><button className="text-button" onClick={start}>最初からやり直す</button></div></div>}
            {phase === 'playing' && <div className="time-left">退社まで <strong>{remaining}</strong> 秒</div>}
          </div>
          <div className="game-controls"><button aria-label="左に移動" disabled={phase !== 'playing'} onClick={() => steer(-1)}><Arrow direction="left" /><kbd>←</kbd></button><div className="control-caption"><span>案件は、華麗にスルー。</span><small>← → / A D / SWIPE</small></div><button aria-label="右に移動" disabled={phase !== 'playing'} onClick={() => steer(1)}><kbd>→</kbd><Arrow /></button><button className="pause-button" aria-label={phase === 'paused' ? 'ゲーム再開' : '一時停止'} disabled={phase === 'ready' || phase === 'result'} onClick={() => setPhase(phase === 'playing' ? 'paused' : 'playing')}>{phase === 'paused' ? '▶' : 'Ⅱ'}</button></div>
          <div className="message-strip" role="status"><span>社内通信</span><p>{game.message}</p></div>
            {phase === 'result' && <div className="modal-backdrop result-overlay"><div className={`result-card ${won ? 'success' : ''}`}><span className="result-stamp">{won ? '退社承認' : '残業確定'}</span><span className="card-kicker">{won ? 'HAVE A PREMIUM WEEKEND.' : 'NOT SO PREMIUM FRIDAY.'}</span><h2>{won ? <>お先に、<br />失礼しました。</> : <>金曜、<br />延長戦です。</>}</h2><p>{won ? '週末は、もうあなたのもの。' : '「帰るところ悪いんだけどさ……」'}</p><div className="final-score"><span>退社力</span><strong>{score(game).toLocaleString()}<small>pt</small></strong></div><div className="result-stats">案件回避 {game.dodged}件 <span>·</span> 最大 {game.maxCombo}連続回収 <span>·</span> {Math.floor(game.elapsed)}秒生存</div><div className="result-loot">{(Object.keys(REWARDS) as RewardKind[]).map(kind => <span key={kind}><svg viewBox="-48 -48 96 96" aria-hidden="true"><Obstacle kind={kind} /></svg><span>{REWARDS[kind].label}<strong>×{game.collected[kind]}</strong></span></span>)}</div><button ref={primary} className="primary-button" onClick={start}>もう一度、退社する<Arrow /></button><button className="text-button" onClick={copyResult}>{copied ? '✓ 結果をコピーしました' : '結果をコピーして自慢する ↗'}</button></div></div>}
        </section>

        <aside className="sidebar">
          <section className="ticket"><div className="ticket-top"><span>本日限り有効</span><span>NO. 001500</span></div><span className="ticket-label">あなたの週末への片道切符</span><div className="ticket-time">15:00<Arrow /></div><div className="ticket-route"><span>会社</span><span className="route-line" /><strong>自由</strong></div><div className="ticket-divider" /><div className="ticket-record"><span>BEST 退社力</span><strong>{best.toLocaleString()}<small>pt</small></strong></div><div className="barcode" aria-hidden="true" /><span className="ticket-bottom">FRIDAY IS A STATE OF MIND.</span></section>
          <section className="rules"><div className="section-label"><span>退社の心得</span><span>HOW TO ESCAPE</span></div><div className="rule"><span className="rule-number">01</span><div><h3>仕事は、かわす。</h3><p>会議・差し戻し・至急案件。<br />3回つかまると残業確定。</p></div><span className="mini-item"><svg viewBox="-45 -40 90 80"><Obstacle kind="urgent" /></svg></span></div><div className="rule"><span className="rule-number">02</span><div><h3>お宝は、つなぐ。</h3><p>連続回収で得点が最大5倍。<br />取り逃し・接触でリセット。</p></div><span className="mini-item"><svg viewBox="-45 -40 90 80"><Obstacle kind="coffee" /></svg></span></div><div className="rule"><span className="rule-number">03</span><div><h3>15時には、いない。</h3><p>45秒逃げ切ればクリア。<br />あとは、最高の週末を。</p></div><span className="mini-clock">15<small>:00</small></span></div></section>
          <section className="loot-guide" aria-label="アイテムの得点と出現率">
            <div className="section-label"><span>週末のお宝</span><span>COLLECT & COMBO</span></div>
            {(Object.entries(REWARDS) as [RewardKind, typeof REWARDS[RewardKind]][]).map(([kind, reward]) => <div className="loot-row" key={kind}>
              <svg viewBox="-48 -48 96 96" aria-hidden="true"><Obstacle kind={kind} /></svg>
              <div><strong>{reward.label}</strong><small style={{color: reward.color}}>{reward.rarity} · {reward.rate}%</small></div><b>{reward.points.toLocaleString()}<small>pt</small></b>
            </div>)}
            <p>出現率はアイテム同士の割合。<br />コンボ5倍なら、有休届1枚で <strong>7,500pt!</strong></p>
          </section>
          <div className="office-note"><span className="note-pin" /><span className="note-kicker">総務部より</span><p>「帰っていい」と<br />「帰れる」は、<br /><strong>ちょっと違う。</strong></p><span className="note-sign"># プレミアムフライデーの現実</span></div>
        </aside>
      </div>
      <div className="bottom-caption"><span>※ このゲームはフィクションです。実在する上司との類似は、たぶん気のせいです。</span><span>MADE FOR YOUR FRIDAY ↗</span></div>
    </main>
    <footer><span>PREMIUM FRIDAY <span className="footer-cross">×</span> A LITTLE FREEDOM.</span><span>働くあなたに、おつかれさま。</span></footer>
  </div>;
}
