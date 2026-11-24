/* ============================================================
 * config.js —— 全部数值集中配置（唯一允许出现数值的地方）
 * 全局命名空间：NS.CONFIG
 * ============================================================ */
(function () {
'use strict';
window.NS = window.NS || {};

NS.CONFIG = {
  W: 480, H: 800,

  /* ---------- 4.1 配色表 ---------- */
  colors: {
    bg0:      '#050816',
    bg1:      '#0B1026',
    cyan:     '#00F0FF',
    magenta:  '#FF2E88',
    orange:   '#FF9500',
    shield:   '#4D7CFE',
    red:      '#FF3131',
    gold:     '#FFD700',
    purple:   '#B537F2',
    text:     '#E6F1FF',
    sub:      '#8B9DC3'
  },

  /* ---------- 8. 同屏上限 ---------- */
  caps: {
    ebullet: 400, pbullet: 120, particle: 500, enemy: 40, item: 30
  },

  /* ---------- 10.1/10.2 战机与武器 ---------- */
  // rate：每秒射击次数；spread：弹道方向角（弧度，0=向上）；dmg：单发伤害
  // laser 类用高速穿透弹模拟（kind:'laser'）
  // skill：机型独有技能 {name, type, dur, cd}
  ships: {
    A: {
      id:'A', name:'猎鹰', en:'FALCON', price:0, color:'#00F0FF',
      hp:100, speed:360, stars:[3,3,3], desc:'均衡泛用，五级解锁五向全角火力',
      weapons:[
        { rate:8,  shots:[{a:0, dmg:10}] },
        { rate:8,  shots:[{a:-0.07,dmg:10},{a:0.07,dmg:10}] },
        { rate:9,  shots:[{a:0,dmg:10},{a:-0.18,dmg:10},{a:0.18,dmg:10}] },
        { rate:9,  shots:[{a:0,dmg:12},{a:-0.18,dmg:12},{a:0.18,dmg:12},{a:Math.PI,dmg:8}] },
        { rate:10, shots:[{a:0,dmg:12},{a:-0.18,dmg:12},{a:0.18,dmg:12},{a:-0.38,dmg:12},{a:0.38,dmg:12}] }
      ]
    },
    B: {
      id:'B', name:'风暴', en:'TEMPEST', price:5000, color:'#FFB020',
      hp:120, speed:330, stars:[2,5,4], desc:'近战散弹爆发，贴脸伤害全游戏最高',
      weapons:[
        { rate:6,   shots:[{a:-0.12,dmg:7},{a:0,dmg:7},{a:0.12,dmg:7}] },
        { rate:6,   shots:[{a:-0.18,dmg:7},{a:-0.06,dmg:7},{a:0.06,dmg:7},{a:0.18,dmg:7}] },
        { rate:6.5, shots:[{a:-0.24,dmg:8},{a:-0.12,dmg:8},{a:0,dmg:8},{a:0.12,dmg:8},{a:0.24,dmg:8}] },
        { rate:7,   shots:[{a:-0.24,dmg:8},{a:-0.12,dmg:8},{a:0,dmg:8},{a:0.12,dmg:8},{a:0.24,dmg:8}], missile:1 },
        { rate:7,   shots:[{a:-0.34,dmg:9},{a:-0.22,dmg:9},{a:-0.11,dmg:9},{a:0,dmg:9},{a:0.11,dmg:9},{a:0.22,dmg:9},{a:0.34,dmg:9}], missile:1 }
      ]
    },
    C: {
      id:'C', name:'幽灵', en:'PHANTOM', price:8000, color:'#B537F2',
      hp:80, speed:330, stars:[4,4,3], desc:'穿透激光+虚化闪避：4秒无敌但无法开火',
      skill:{ name:'虚化闪避', type:'phase', dur:4, cd:20 },
      weapons:[
        { rate:20, shots:[{a:0,dmg:1.5, kind:'laser'}] },
        { rate:20, shots:[{a:0,dmg:2.25, kind:'laser'}] },
        { rate:20, shots:[{a:0,dmg:3, kind:'laser', pierce:99}] },
        { rate:20, shots:[{a:-0.05,dmg:2.25, kind:'laser', pierce:99},{a:0.05,dmg:2.25, kind:'laser', pierce:99}] },
        { rate:20, shots:[{a:-0.05,dmg:2.5, kind:'laser', pierce:99},{a:0.05,dmg:2.5, kind:'laser', pierce:99}], missile:1, homingSub:true }
      ]
    },
    D: {
      id:'D', name:'幻影', en:'MIRAGE', price:15000, color:'#7C3AED',
      hp:90, speed:350, stars:[4,3,4], desc:'时空锁定：5秒内全屏敌人与子弹减速50%，结束僵硬1秒',
      skill:{ name:'时空锁定', type:'timelock', dur:5, cd:22 },
      weapons:[
        { rate:8,  shots:[{a:0, dmg:9}] },
        { rate:8,  shots:[{a:-0.1,dmg:9},{a:0.1,dmg:9}] },
        { rate:8.5,shots:[{a:0,dmg:10},{a:-0.16,dmg:9},{a:0.16,dmg:9}] },
        { rate:9,  shots:[{a:0,dmg:11},{a:-0.16,dmg:10},{a:0.16,dmg:10},{a:Math.PI,dmg:7}] },
        { rate:9.5,shots:[{a:0,dmg:12},{a:-0.2,dmg:11},{a:0.2,dmg:11},{a:-0.4,dmg:10},{a:0.4,dmg:10}], homingSub:true }
      ]
    },
    E: {
      id:'E', name:'掠夺者', en:'RAIDER', price:30000, color:'#FFD700',
      hp:110, speed:340, stars:[3,4,5], desc:'贪婪磁场：被动30%双倍金币+主动吸金回血',
      skill:{ name:'贪婪磁场', type:'greed', dur:10, cd:25 },
      weapons:[
        { rate:7.5,shots:[{a:-0.14,dmg:8},{a:0,dmg:8},{a:0.14,dmg:8}] },
        { rate:7.5,shots:[{a:-0.2,dmg:8},{a:-0.07,dmg:8},{a:0.07,dmg:8},{a:0.2,dmg:8}] },
        { rate:8,  shots:[{a:-0.26,dmg:9},{a:-0.13,dmg:9},{a:0,dmg:9},{a:0.13,dmg:9},{a:0.26,dmg:9}] },
        { rate:8.5,shots:[{a:-0.26,dmg:10},{a:-0.13,dmg:10},{a:0,dmg:10},{a:0.13,dmg:10},{a:0.26,dmg:10}], missile:1 },
        { rate:9,  shots:[{a:-0.36,dmg:11},{a:-0.24,dmg:11},{a:-0.12,dmg:11},{a:0,dmg:11},{a:0.12,dmg:11},{a:0.24,dmg:11},{a:0.36,dmg:11}], missile:1 }
      ]
    }
  },

  /* ---------- 5.2 敌机 ---------- */
  // tiers: 0=普通(秒杀级) 1=精英(厚血条) 2=强化(超厚金色)
  enemies: {
    scout:    { hp:3,  speed:160, r:14, score:10, color:'#FF2E88', tiers:[{hpMul:0.35,rMul:1,color:null},{hpMul:2.5,rMul:1.2,color:'#FF5C9E'},{hpMul:5,rMul:1.4,color:'#FFD700'}] },
    striker:  { hp:6,  speed:140, r:14, score:20, color:'#FF5C9E', tiers:[{hpMul:0.35,rMul:1,color:null},{hpMul:2.5,rMul:1.2,color:'#FF80B0'},{hpMul:5,rMul:1.4,color:'#FFD700'}] },
    spreader: { hp:10, speed:100, r:18, score:30, color:'#FF2E88', tiers:[{hpMul:0.35,rMul:1,color:null},{hpMul:2.5,rMul:1.15,color:'#FF5C9E'},{hpMul:5,rMul:1.3,color:'#FFD700'}] },
    hunter:   { hp:8,  speed:180, r:13, score:40, color:'#C724B1', tiers:[{hpMul:0.35,rMul:1,color:null},{hpMul:2.5,rMul:1.2,color:'#D94BFF'},{hpMul:5,rMul:1.4,color:'#FFD700'}] },
    kamikaze: { hp:2,  speed:200, r:15, score:25, color:'#FF6A3D', tiers:[{hpMul:0.35,rMul:1,color:null},{hpMul:2.5,rMul:1.2,color:'#FF9A6D'},{hpMul:5,rMul:1.4,color:'#FFD700'}] },
    carrier:  { hp:40, speed:60,  r:34, score:120, color:'#E0407A', tiers:[{hpMul:0.6,rMul:1,color:null},{hpMul:2,rMul:1.1,color:'#FF6A9E'},{hpMul:3.5,rMul:1.2,color:'#FFD700'}] },
    guard:    { hp:25, speed:90,  r:20, score:80, color:'#B537F2', tiers:[{hpMul:0.6,rMul:1,color:null},{hpMul:2,rMul:1.2,color:'#D94BFF'},{hpMul:3.5,rMul:1.4,color:'#FFD700'}] }
  },

  /* ---------- 5.3 Boss 元数据（弹幕逻辑见 boss.js） ---------- */
  bosses: {
    sentinel: { name:'哨戒者 SENTINEL', hp:1200, score:5000, w:160, color:'#00F0FF' },
    weaver:   { name:'编织者 WEAVER',   hp:1800, score:8000, w:180, color:'#FF2E88', wingHp:200 },
    oblivion: { name:'湮灭核心 OBLIVION', hp:2600, score:15000, w:200, color:'#FFD700' }
  },

  /* ---------- 5.4 道具掉落（权重） ---------- */
  drop: {
    normal: 0.08, elite: 0.40, carrier: 1.0,
    table: [
      ['P', 30], ['coin', 50], ['S', 5], ['B', 5], ['M', 5], ['magnet', 5]
    ],
    coinValue: [10, 50, 100],
    fallSpeed: 80, itemLife: 8
  },

  /* ---------- 5.1 防御/暴走/连击 ---------- */
  player: {
    hitDmg: 34, invincible: 1.5, respawnInv: 2.5,
    bombDmg: 300, bombInv: 2.0, bombStart: 2, bombMax: 5,
    livesStart: 3, lifeScoreEvery: 100000,
    hitR: 3, grazeR: 16,
    hyperGainGraze: 1, hyperTime: 8,
    comboWindow: 2.5,
    comboTiers: [ {n:10, m:1.5}, {n:30, m:2}, {n:60, m:3} ]
  },

  /* ---------- 5.6 局外养成 ---------- */
  upgrades: [
    { id:'fire',   name:'初始火力', desc:'每级开局武器等级 +1', max:5, price:[500,1000,2000,3500,5000] },
    { id:'shield', name:'护盾上限', desc:'每级可携带护盾层数 +1', max:3, price:[800,1600,3000] },
    { id:'bomb',   name:'开局炸弹', desc:'每级开局多带 1 枚炸弹', max:3, price:[600,1200,2400] },
    { id:'magnet', name:'磁吸范围', desc:'扩大道具/金币拾取半径', max:3, price:[400,900,1800] }
  ],
  magnetRadii: [24, 36, 48, 64],

  /* ---------- 5.5 关卡（时间轴波次 [秒, 敌种, 编队, 数量]） ----------
     spawnRate: 刷怪时间压缩系数（<1 表示更快）；hpScale: 敌机血量倍率
     后期关卡不加速度，靠血量/数量/高级敌种提升强度 ---------- */
  levels: [
    { theme:'#00F0FF', name:'STAGE 1 · 星云外围', duration:65, boss:'sentinel', bossScale:1, spawnRate:0.85, hpScale:1.0, waves:[
      [1,'scout','line',3],[4,'scout','stream',4],[7,'scout','v',5],[10,'striker','line',3],
      [13,'scout','stream',6],[17,'striker','sides',4],[21,'scout','v',5],
      [28,'spreader','line',2],[35,'scout','v',6],[42,'striker','stream',5],
      [50,'spreader','sides',4],[57,'striker','v',5]
    ]},
    { theme:'#B537F2', name:'STAGE 2 · 碎星带', duration:70, boss:'weaver', bossScale:1, spawnRate:0.85, hpScale:1.1, eliteHp:1.25, waves:[
      [2,'scout','line',4],[7,'spreader','line',2],[12,'kamikaze','stream',5],[18,'striker','v',5],
      [24,'spreader','sides',4],[30,'kamikaze','line',5],[36,'striker','stream',6],[43,'spreader','v',4],
      [50,'kamikaze','sides',6],[57,'striker','line',5],[63,'spreader','v',5]
    ]},
    { theme:'#FF9500', name:'STAGE 3 · 空间站', duration:75, boss:'sentinel', bossScale:1.2, spawnRate:0.9, hpScale:1.2, eliteHp:1.25, waves:[
      [2,'hunter','sides',3],[7,'guard','line',1],[13,'striker','v',6],[19,'kamikaze','stream',6],
      [26,'carrier','line',1],[32,'hunter','sides',4],[39,'guard','line',2],[46,'spreader','v',6],
      [53,'carrier','sides',1],[59,'hunter','stream',5],[66,'guard','v',2],[70,'kamikaze','line',6]
    ]},
    { theme:'#FF3131', name:'STAGE 4 · 虫洞', duration:80, boss:'weaver', bossScale:1.3, spawnRate:0.95, hpScale:1.35, eliteHp:1.25, waves:[
      [2,'hunter','v',4],[7,'kamikaze','stream',7],[13,'guard','line',2],[19,'carrier','line',1],
      [25,'spreader','sides',6],[31,'hunter','stream',6],[37,'guard','v',3],[43,'kamikaze','line',7],
      [49,'carrier','sides',1],[55,'striker','v',8],[61,'hunter','sides',5],[67,'spreader','line',5],[73,'kamikaze','v',6]
    ]},
    { theme:'#FFD700', name:'STAGE 5 · 敌母舰核心', duration:85, boss:'oblivion', bossScale:1, spawnRate:1.0, hpScale:1.5, waves:[
      [2,'guard','line',2],[7,'hunter','v',5],[12,'kamikaze','stream',8],[18,'carrier','line',1],
      [24,'spreader','sides',7],[30,'guard','v',3],[36,'hunter','stream',7],[42,'carrier','sides',1],
      [48,'kamikaze','line',8],[54,'guard','sides',4],[60,'hunter','v',6],[66,'spreader','stream',7],
      [72,'guard','line',3],[78,'kamikaze','v',8]
    ]},
    { theme:'#7C3AED', name:'STAGE 6 · 深空雷区', duration:88, boss:'sentinel', bossScale:1.5, dualBoss:'weaver', spawnRate:1.0, hpScale:1.7, waves:[
      [2,'hunter','sides',4],[6,'striker','stream',6],[11,'guard','line',2],[16,'kamikaze','v',7],
      [22,'spreader','sides',6],[27,'carrier','line',1],[33,'hunter','stream',7],[39,'guard','v',3],
      [45,'kamikaze','line',8],[51,'striker','sides',6],[57,'spreader','v',6],[63,'carrier','sides',1],
      [69,'guard','line',3],[75,'hunter','v',7],[81,'kamikaze','stream',8]
    ]},
    { theme:'#06B6D4', name:'STAGE 7 · 引力井', duration:90, boss:'weaver', bossScale:1.5, spawnRate:1.0, hpScale:1.9, waves:[
      [2,'guard','sides',3],[6,'spreader','line',3],[11,'hunter','stream',7],[16,'carrier','line',1],
      [22,'kamikaze','v',8],[27,'striker','sides',6],[33,'guard','line',2],[39,'spreader','stream',7],
      [45,'hunter','v',6],[51,'carrier','sides',1],[57,'guard','v',3],[63,'kamikaze','line',8],
      [69,'hunter','sides',6],[75,'spreader','v',7],[81,'striker','stream',7]
    ]},
    { theme:'#EC4899', name:'STAGE 8 · 暗物质海', duration:92, boss:'oblivion', bossScale:1.3, spawnRate:1.0, hpScale:2.2, waves:[
      [2,'guard','line',3],[6,'hunter','v',6],[11,'carrier','line',1],[16,'kamikaze','stream',8],
      [22,'spreader','sides',7],[27,'guard','v',3],[33,'striker','stream',7],[39,'carrier','sides',1],
      [45,'hunter','sides',6],[51,'kamikaze','line',8],[57,'guard','line',3],[63,'spreader','v',7],
      [69,'hunter','stream',7],[75,'carrier','line',1],[81,'kamikaze','v',8],[87,'striker','sides',7]
    ]},
    { theme:'#F43F5E', name:'STAGE 9 · 奇点边缘', duration:95, boss:'sentinel', bossScale:1.8, dualBoss:'oblivion', spawnRate:1.0, hpScale:2.5, waves:[
      [2,'guard','sides',4],[6,'hunter','stream',8],[11,'carrier','line',1],[16,'kamikaze','v',8],
      [22,'spreader','sides',8],[27,'guard','v',4],[33,'striker','stream',8],[39,'carrier','sides',1],
      [45,'hunter','line',7],[51,'kamikaze','sides',8],[57,'guard','line',3],[63,'spreader','v',8],
      [69,'hunter','stream',8],[75,'carrier','line',1],[81,'guard','v',4],[87,'kamikaze','line',8],[91,'striker','sides',8]
    ]},
    { theme:'#A855F7', name:'STAGE 10 · 终焉之地', duration:100, boss:'oblivion', bossScale:1.6, spawnRate:1.0, hpScale:3.0, waves:[
      [2,'guard','line',4],[6,'hunter','sides',7],[11,'carrier','line',1],[16,'kamikaze','stream',9],
      [22,'spreader','v',8],[27,'guard','sides',4],[33,'striker','stream',9],[39,'carrier','sides',1],
      [45,'hunter','line',8],[51,'kamikaze','v',9],[57,'guard','line',4],[63,'spreader','sides',8],
      [69,'hunter','stream',9],[75,'carrier','line',1],[81,'guard','v',4],[87,'kamikaze','line',9],
      [92,'striker','sides',8],[96,'spreader','v',8]
    ]}
  ],

  /* ---------- 无尽模式 ---------- */
  endless: {
    difficulty: function (n) { return 1 + 0.08 * n; },
    waveLen: 18,           // 每波秒数
    groupEvery: 2.0,       // 基础刷怪间隔
    bossEvery: 10,         // 每 10 波一个 Boss
    bossCycle: ['sentinel','weaver','oblivion'],
    pool: ['scout','striker','spreader','hunter','kamikaze'],
    // 双世界：1=每25杀触发金币雨/双倍 2=金币掉落随时间递增
    worlds: {
      1: { name:'金币风暴', desc:'每击杀25个敌人触发一次金币雨或双倍掉落', killPerRain:25 },
      2: { name:'时之回廊', desc:'金币掉落随时间缓慢递增', growthRate:0.02 }
    }
  },

  /* ---------- 开局道具（每局只能携带一种） ---------- */
  shopItems: [
    { id:'talisman1', name:'保命符·初', desc:'血量见底时恢复 25% 生命值', price:300, effect:{type:'talisman', pct:0.25} },
    { id:'talisman2', name:'保命符·中', desc:'血量见底时恢复 50% 生命值', price:600, effect:{type:'talisman', pct:0.5} },
    { id:'talisman3', name:'保命符·极', desc:'血量见底时恢复 75% 生命值', price:1200, effect:{type:'talisman', pct:0.75} },
    { id:'cdcut',     name:'速射核心', desc:'本局攻击冷却缩短 20%', price:500, effect:{type:'cdcut', val:0.2} },
    { id:'coindouble',name:'金币翻倍券', desc:'本局金币掉落数量翻倍', price:800, effect:{type:'coindouble'} },
    { id:'coinrate',  name:'幸运星', desc:'本局金币掉落概率提升 50%', price:400, effect:{type:'coinrate', val:0.5} }
  ],

  /* ---------- 评价 ---------- */
  grade: function (deaths) {
    if (deaths === 0) return 'S';
    if (deaths <= 1) return 'A';
    if (deaths <= 2) return 'B';
    return 'C';
  }
};

/* ---------- localStorage 键名（附录 A） ---------- */
NS.KEYS = {
  coins:'ns_save_coins', upgrades:'ns_save_upgrades', unlocks:'ns_save_unlocks',
  selected:'ns_save_selected', highscore:'ns_save_highscore',
  rank:'ns_save_rank', settings:'ns_save_settings',
  cleared:'ns_save_cleared'
};

NS.DEFAULT_SAVE = {
  coins: 0,
  upgrades: { fire:0, shield:0, bomb:0, magnet:0 },
  unlocks: { A:true, B:false, C:false, D:false, E:false },
  selected: 'A',
  highscore: 0,
  rank: [],
  settings: { music:0.5, sfx:0.7, muted:false, quality:'high', tutorial:false },
  cleared: 0,            // 已通关的闯关关卡数：0=仅第1关解锁
  endlessWorld: 1        // 无尽模式所选世界
};
})();
