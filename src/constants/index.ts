// 🌾 星露谷风格游戏 - 常量配置

export const COLORS = {
  primary: '#5D8C3C',      // 草地绿
  primaryLight: '#7CB342',
  background: '#F5F5DC',   // 米色背景
  surface: '#FFFFFF',
  soil: '#8B4513',         // 土壤棕
  water: '#4FC3F7',        // 水蓝色
  sky: '#87CEEB',          // 天空蓝
  wood: '#A0522D',        // 木头
  stone: '#808080',        // 石头灰
  
  // 季节颜色
  spring: '#90EE90',
  summer: '#FFD700',
  autumn: '#FF8C00',
  winter: '#E0F7FA',
};

export const TILE_SIZE = 40; // 格子大小

export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 15;

// 季节
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type Season = typeof SEASONS[number];

// 作物类型
export const CROPS = {
  carrot: { name: '胡萝卜', cost: 10, sell: 30, days: 3, emoji: '🥕' },
  tomato: { name: '番茄', cost: 20, sell: 50, days: 4, emoji: '🍅' },
  corn: { name: '玉米', cost: 30, sell: 80, days: 5, emoji: '🌽' },
  pumpkin: { name: '南瓜', cost: 50, sell: 150, days: 7, emoji: '🎃' },
  strawberry: { name: '草莓', cost: 100, sell: 300, days: 5, emoji: '🍓' },
};

// 物品类型
export const ITEMS = {
  hoe: { name: '锄头', cost: 0, emoji: '🔨' },
  water: { name: '水壶', cost: 0, emoji: '🚿' },
  seed_carrot: { name: '胡萝卜种子', cost: 10, emoji: '🥕' },
  seed_tomato: { name: '番茄种子', cost: 20, emoji: '🍅' },
};

// 地块状态
export const TILE_STATUS = {
  GRASS: 0,    // 草地
  SOIL: 1,     // 已开垦
  PLANTED: 2,  // 已种植
  WATERED: 3,  // 已浇水
  READY: 4,    // 可收获
};
