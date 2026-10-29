export const DURATION = 45;
export const REWARDS = {
  coffee: { label: 'コーヒー', points: 150, rate: 62, color: '#b78327', rarity: 'COMMON' },
  donut: { label: 'ドーナツ', points: 300, rate: 25, color: '#bf6680', rarity: 'UNCOMMON' },
  ticket: { label: '週末切符', points: 700, rate: 10, color: '#397c9b', rarity: 'RARE' },
  leave: { label: '有休届', points: 1500, rate: 3, color: '#8c59ad', rarity: 'SUPER RARE' },
} as const;
export type RewardKind = keyof typeof REWARDS;
export type HazardKind = 'meeting' | 'revision' | 'urgent';
export type Kind = HazardKind | RewardKind;
export type Item = { id: number; lane: number; y: number; kind: Kind };
export type Game = {
  elapsed: number; lane: number; health: number; points: number;
  collected: Record<RewardKind, number>; combo: number; maxCombo: number;
  dodged: number; invincible: number; spawnIn: number; nextId: number;
  items: Item[]; outcome: 'playing' | 'won' | 'lost'; message: string;
  pickup: { id: number; lane: number; remaining: number; kind: RewardKind; points: number; multiplier: number } | null;
};
export const isReward = (kind: Kind): kind is RewardKind => kind in REWARDS;
export const multiplier = (combo: number) => Math.min(5, 1 + Math.floor(Math.max(0, combo - 1) / 3));
export function pickReward(roll: number): RewardKind {
  if (roll < .62) return 'coffee';
  if (roll < .87) return 'donut';
  if (roll < .97) return 'ticket';
  return 'leave';
}
export function createGame(): Game {
  return { elapsed: 0, lane: 1, health: 3, points: 0,
    collected: { coffee: 0, donut: 0, ticket: 0, leave: 0 }, combo: 0, maxCombo: 0, dodged: 0,
    invincible: 0, spawnIn: .8, nextId: 1, items: [], outcome: 'playing', message: 'お先に失礼します！', pickup: null };
}
export function move(game: Game, direction: number): Game {
  return { ...game, lane: Math.max(0, Math.min(2, game.lane + direction)) };
}
export function advance(game: Game, dt: number, random = Math.random): Game {
  if (game.outcome !== 'playing') return game;
  const next: Game = { ...game, elapsed: Math.min(DURATION, game.elapsed + dt),
    collected: { ...game.collected }, invincible: Math.max(0, game.invincible - dt), spawnIn: game.spawnIn - dt, items: [],
    pickup: game.pickup && game.pickup.remaining > dt ? { ...game.pickup, remaining: game.pickup.remaining - dt } : null };
  const progress = next.elapsed / DURATION;
  const speed = .32 + progress * .30;
  for (const item of game.items) {
    const y = item.y + dt * speed;
    if (item.y < .8 && y >= .8) {
      if (isReward(item.kind)) {
        if (item.lane === next.lane) {
          next.combo++;
          next.maxCombo = Math.max(next.maxCombo, next.combo);
          const factor = multiplier(next.combo);
          const points = REWARDS[item.kind].points * factor;
          next.points += points;
          next.collected[item.kind]++;
          next.message = `${REWARDS[item.kind].label} GET! +${points.toLocaleString()}pt / ${next.combo}連続回収`;
          next.pickup = { id: item.id, lane: item.lane, remaining: .9, kind: item.kind, points, multiplier: factor };
          continue;
        }
        if (next.combo > 0) next.message = '取り逃し！回収コンボが途切れた。';
        next.combo = 0;
      } else if (item.lane === next.lane) {
        next.combo = 0;
        if (next.invincible === 0) {
          next.health--; next.invincible = 1.4;
          next.message = { meeting: '「5分だけ会議いい？」……よくない。', revision: '「やっぱり最初の案で」……はい？', urgent: '「今日中で！」……今、言う？' }[item.kind];
        }
      } else {
        next.dodged++; next.points += 30;
      }
    }
    if (y < 1.15) next.items.push({ ...item, y });
  }
  if (next.spawnIn <= 0) {
    const lane = Math.floor(random() * 3);
    const kinds: HazardKind[] = ['meeting', 'revision', 'urgent'];
    const blocked = [lane];
    next.items.push({ id: next.nextId++, lane, y: -.08, kind: kinds[Math.floor(random() * 3)] });
    if (next.elapsed >= 12 && random() < .25 + progress * .35) {
      const second = (lane + 1 + Math.floor(random() * 2)) % 3;
      blocked.push(second);
      next.items.push({ id: next.nextId++, lane: second, y: -.08, kind: kinds[Math.floor(random() * 3)] });
    }
    if (random() < .72) {
      const open = [0, 1, 2].filter(candidate => !blocked.includes(candidate));
      next.items.push({ id: next.nextId++, lane: open[Math.floor(random() * open.length)], y: -.08, kind: pickReward(random()) });
    }
    next.spawnIn = .95 - progress * .45;
  }
  if (next.health <= 0) next.outcome = 'lost';
  else if (next.elapsed >= DURATION) next.outcome = 'won';
  return next;
}
export const score = (game: Game) => Math.floor(game.elapsed * 20) + game.points + (game.outcome === 'won' ? game.health * 200 : 0);
