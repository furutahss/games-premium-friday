import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance, move, score, DURATION, REWARDS, pickReward, multiplier, isReward } from './game.ts';

test('左右の壁を越えずにレーン移動できる', () => {
  const game = createGame();
  assert.equal(move(move(game, -1), -1).lane, 0);
  assert.equal(move(move(game, 1), 1).lane, 2);
});
test('案件に当たると体力が減り、直後の連続被弾を防ぐ', () => {
  const game = createGame();
  game.items = [{ id: 1, lane: 1, y: .78, kind: 'meeting' }];
  const hit = advance(game, .1, () => .5);
  assert.equal(hit.health, 2);
  hit.items = [{ id: 2, lane: 1, y: .78, kind: 'urgent' }];
  assert.equal(advance(hit, .1, () => .5).health, 2);
});
test('別レーンの案件には当たらず、コーヒーを取ると加点', () => {
  const game = createGame();
  game.items = [{ id: 1, lane: 0, y: .78, kind: 'meeting' }, { id: 2, lane: 1, y: .78, kind: 'coffee' }];
  const next = advance(game, .1, () => .5);
  assert.equal(next.health, 3);
  assert.equal(next.collected.coffee, 1);
  assert.ok(next.points >= 150);
});
test('体力ゼロで残業、45秒生存で退社、終了後は状態が進まない', () => {
  const game = createGame();
  game.health = 1;
  game.items = [{ id: 1, lane: 1, y: .78, kind: 'revision' }];
  const lost = advance(game, .1, () => .5);
  assert.equal(lost.outcome, 'lost');
  assert.deepEqual(advance(lost, 1), lost);
  const ready = createGame();
  ready.elapsed = DURATION - .01;
  assert.equal(advance(ready, .02).outcome, 'won');
});
test('終盤は2レーンの案件が出るが、全レーンをふさがずアイテムを安全なレーンに置く', () => {
  const game = createGame();
  game.elapsed = 35;
  game.spawnIn = 0;
  const next = advance(game, .05, () => 0);
  const hazards = next.items.filter(item => !isReward(item.kind));
  const rewards = next.items.filter(item => isReward(item.kind));
  assert.equal(hazards.length, 2);
  assert.equal(new Set(hazards.map(item => item.lane)).size, 2);
  assert.equal(rewards.length, 1);
  assert.ok(hazards.every(item => item.lane !== rewards[0].lane));
});
test('45秒を通してプレイでき、クリア時の体力ボーナスを加算する', () => {
  let game = move(createGame(), -1);
  for (let i = 0; i < 901; i++) game = advance(game, .05, () => .99);
  assert.equal(game.outcome, 'won');
  assert.equal(game.health, 3);
  assert.equal(game.elapsed, 45);
  assert.ok(game.dodged > 30);
  assert.equal(score(game), 900 + game.points + 600);
});
test('通過した案件やコーヒーは同じものを二度カウントしない', () => {
  const game = createGame();
  game.items = [{ id: 1, lane: 1, y: .79, kind: 'coffee' }];
  const first = advance(game, .05, () => .5);
  const second = advance(first, .05, () => .5);
  assert.equal(second.collected.coffee, 1);
  assert.equal(second.points, 150);
  assert.equal(game.collected.coffee, 0);
  assert.equal(game.items[0].y, .79);
});
test('コーヒー取得位置に演出を出し、取得アイテムを消して一定時間後に演出を消す', () => {
  const game = createGame();
  game.items = [{ id: 7, lane: 1, y: .79, kind: 'coffee' }];
  const picked = advance(game, .05, () => .5);
  assert.deepEqual(picked.pickup, { id: 7, lane: 1, remaining: .9, kind: 'coffee', points: 150, multiplier: 1 });
  assert.ok(!picked.items.some(item => item.id === 7));
  const moved = advance(move(picked, 1), .2, () => .5);
  assert.equal(moved.pickup?.lane, 1);
  assert.ok(moved.pickup!.remaining < .9);
  assert.equal(advance(moved, .8, () => .5).pickup, null);
});
test('別レーンのコーヒーを通過しても取得演出は出さない', () => {
  const game = createGame();
  game.items = [{ id: 7, lane: 0, y: .79, kind: 'coffee' }];
  assert.equal(advance(game, .05, () => .5).pickup, null);
});

test('レア度に応じた出現率で4種類のアイテムを選ぶ', () => {
  assert.equal(pickReward(0), 'coffee');
  assert.equal(pickReward(.61999), 'coffee');
  assert.equal(pickReward(.62), 'donut');
  assert.equal(pickReward(.86999), 'donut');
  assert.equal(pickReward(.87), 'ticket');
  assert.equal(pickReward(.96999), 'ticket');
  assert.equal(pickReward(.97), 'leave');
  assert.equal(pickReward(.9999), 'leave');
});
test('3回収ごとに次の回収の倍率が上がり、最大5倍になる', () => {
  assert.deepEqual([1, 3, 4, 6, 7, 10, 13, 50].map(multiplier), [1, 1, 2, 2, 3, 4, 5, 5]);
  let game = createGame();
  for (let i = 0; i < 4; i++) {
    game.items = [{ id: 100 + i, lane: 1, y: .79, kind: 'donut' }];
    game = advance(game, .05, () => .99);
  }
  assert.equal(game.combo, 4);
  assert.equal(game.maxCombo, 4);
  assert.equal(game.points, 300 * 3 + 300 * 2);
  assert.equal(game.pickup?.points, 600);
  assert.equal(game.pickup?.multiplier, 2);
});
test('レアアイテムの点数と回収数を記録する', () => {
  for (const kind of ['coffee', 'donut', 'ticket', 'leave'] as const) {
    const game = createGame();
    game.combo = 12;
    game.items = [{ id: 100, lane: 1, y: .79, kind }];
    const next = advance(game, .05, () => .99);
    assert.equal(next.points, REWARDS[kind].points * 5);
    assert.equal(next.collected[kind], 1);
    assert.equal(next.pickup?.kind, kind);
    assert.equal(game.collected[kind], 0);
  }
});
test('取り逃し・被弾で回収コンボが途切れ、最高コンボは残る', () => {
  for (const item of [{ id: 1, lane: 0, y: .79, kind: 'ticket' as const }, { id: 1, lane: 1, y: .79, kind: 'meeting' as const }]) {
    const game = createGame();
    game.combo = 8; game.maxCombo = 8; game.items = [item];
    const next = advance(game, .05, () => .99);
    assert.equal(next.combo, 0);
    assert.equal(next.maxCombo, 8);
  }
});
test('終盤は序盤より案件が速く、出現間隔も短い', () => {
  const early = createGame();
  early.spawnIn = 0;
  early.items = [{id: 100, lane: 0, y: .1, kind: 'urgent'}];
  const late = { ...early, elapsed: 40 };
  const a = advance(early, .05, () => .99);
  const b = advance(late, .05, () => .99);
  assert.ok(b.items[0].y > a.items[0].y);
  assert.ok(b.spawnIn < a.spawnIn);
});

test('アイテムの抽選比率と画面に表示する出現率が一致する', () => {
  const counts = { coffee: 0, donut: 0, ticket: 0, leave: 0 };
  for (let i = 0; i < 100; i++) counts[pickReward((i + .5) / 100)]++;
  for (const kind of Object.keys(counts) as (keyof typeof counts)[]) assert.equal(counts[kind], REWARDS[kind].rate);
});
test('多数の終盤出現パターンでも同じ列に案件とアイテムが重ならず、必ず逃げ道がある', () => {
  let seed = 7;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 300; i++) {
    const game = createGame(); game.elapsed = 40; game.spawnIn = 0;
    const next = advance(game, .05, random);
    const blocked = next.items.filter(item => !isReward(item.kind)).map(item => item.lane);
    assert.ok(blocked.length >= 1 && blocked.length <= 2);
    assert.equal(new Set(blocked).size, blocked.length);
    for (const item of next.items.filter(item => isReward(item.kind))) assert.ok(!blocked.includes(item.lane));
  }
});
