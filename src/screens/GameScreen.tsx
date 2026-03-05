import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { COLORS, TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, CROPS, TILE_STATUS, SEASONS } from '../constants';

// ============ 类型定义 ============
interface Tile {
  status: number;
  cropId: string | null;
  daysToHarvest: number | null;
  isWatered: boolean;
}

interface Item {
  id: string;
  name: string;
  count: number;
  emoji: string;
}

interface NPC {
  id: string;
  name: string;
  heart: number;
  location: string;
  likedGift: string[];
  emoji: string;
}

// ============ 常量 ============
const MAX_ENERGY = 100;
const ENERGY_COST = {
  hoe: 2,
  water: 2,
  harvest: 1,
  plant: 1,
};

const NPCS: NPC[] = [
  { id: 'abigail', name: 'Abigail', heart: 0, location: 'Pierre Store', likedGift: ['pumpkin', 'amethyst'], emoji: '👩‍🦰' },
  { id: 'sam', name: 'Sam', heart: 0, location: 'Community', likedGift: ['pizza', 'guitar'], emoji: '👱' },
  { id: 'sebastian', name: 'Sebastian', heart: 0, location: 'Mountain', likedGift: ['ice', 'frog'], emoji: '🧔' },
  { id: 'emily', name: 'Emily', heart: 0, location: 'Beach', likedGift: ['gem', 'cloth'], emoji: '👩' },
  { id: 'leah', name: 'Leah', heart: 0, location: 'Forest', likedGift: ['salad', 'goat_cheese'], emoji: '👩‍🦱' },
  { id: 'maru', name: 'Maru', heart: 0, location: 'Clinic', likedGift: ['strawberry', 'apple_pie'], emoji: '👩‍⚕️' },
  { id: 'penny', name: 'Penny', heart: 0, location: 'Trailer', likedGift: ['coconut', 'diamond'], emoji: '👩‍🏫' },
  { id: 'elliott', name: 'Elliott', heart: 0, location: 'Beach', likedGift: ['lobster', 'crab'], emoji: '👨' },
];

// ============ 组件 ============
const GameScreen: React.FC = () => {
  // --- 状态 ---
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('hoe');
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [money, setMoney] = useState(500);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [day, setDay] = useState(1);
  const [season, setSeason] = useState<typeof SEASONS[number]>('spring');
  const [year, setYear] = useState(1);
  const [showInventory, setShowInventory] = useState(false);
  const [showNPCs, setShowNPCs] = useState(false);
  const [npcs, setNpcs] = useState<NPC[]>(NPCS);
  
  // 背包物品
  const [inventory, setInventory] = useState<Item[]>([
    { id: 'seed_carrot', name: '胡萝卜种子', count: 10, emoji: '🥕' },
    { id: 'seed_tomato', name: '番茄种子', count: 5, emoji: '🍅' },
    { id: 'hoe', name: '锄头', count: 1, emoji: '🔨' },
    { id: 'water', name: '水壶', count: 1, emoji: '🚿' },
    { id: 'pumpkin', name: '南瓜', count: 2, emoji: '🎃' },
  ]);

  // --- 初始化 ---
  useEffect(() => {
    const initialTiles: Tile[] = [];
    for (let i = 0; i < GRID_WIDTH * GRID_HEIGHT; i++) {
      initialTiles.push({
        status: TILE_STATUS.GRASS,
        cropId: null,
        daysToHarvest: null,
        isWatered: false,
      });
    }
    setTiles(initialTiles);
  }, []);

  // --- 工具函数 ---
  const getSeasonEmoji = (s: string) => {
    switch(s) {
      case 'spring': return '🌸';
      case 'summer': return '☀️';
      case 'autumn': return '🍂';
      case 'winter': return '❄️';
      default: return '🌸';
    }
  };

  const getTileColor = (tile: Tile) => {
    if (tile.status === TILE_STATUS.GRASS) return COLORS.primary;
    if (tile.status === TILE_STATUS.SOIL) return tile.isWatered ? '#6D4C41' : COLORS.soil;
    if (tile.status === TILE_STATUS.PLANTED) return tile.isWatered ? '#6D4C41' : COLORS.soil;
    if (tile.status === TILE_STATUS.READY) return tile.isWatered ? '#5D4037' : COLORS.soil;
    return COLORS.soil;
  };

  const getCropEmoji = (tile: Tile) => {
    if (!tile.cropId) return '';
    if (tile.status === TILE_STATUS.READY) {
      return CROPS[tile.cropId as keyof typeof CROPS]?.emoji || '🌾';
    }
    if (tile.status === TILE_STATUS.PLANTED) {
      const days = tile.daysToHarvest || 1;
      const totalDays = CROPS[tile.cropId as keyof typeof CROPS]?.days || 3;
      const progress = totalDays - days;
      if (progress >= totalDays - 1) return '🌿';
      return '🌱';
    }
    return '';
  };

  // --- 操作 ---
  const handleTilePress = (index: number) => {
    if (energy <= 0) {
      Alert.alert('💤 体力不足！', '请休息到明天');
      return;
    }

    const newTiles = [...tiles];
    const tile = newTiles[index];

    if (selectedTool === 'hoe' && tile.status === TILE_STATUS.GRASS) {
      // 开垦
      if (energy >= ENERGY_COST.hoe) {
        newTiles[index] = { ...tile, status: TILE_STATUS.SOIL };
        setTiles(newTiles);
        setEnergy(energy - ENERGY_COST.hoe);
      }
    } else if (selectedTool === 'water' && tile.status >= TILE_STATUS.SOIL) {
      // 浇水
      if (energy >= ENERGY_COST.water && !tile.isWatered) {
        newTiles[index] = { ...tile, isWatered: true };
        setTiles(newTiles);
        setEnergy(energy - ENERGY_COST.water);
      }
    } else if (selectedSeed && tile.status === TILE_STATUS.SOIL && !tile.cropId) {
      // 种植
      const seedItem = inventory.find(i => i.id === selectedSeed);
      if (seedItem && seedItem.count > 0 && energy >= ENERGY_COST.plant) {
        const cropInfo = CROPS[selectedSeed.replace('seed_', '') as keyof typeof CROPS];
        if (cropInfo) {
          newTiles[index] = {
            status: TILE_STATUS.PLANTED,
            cropId: selectedSeed.replace('seed_', ''),
            daysToHarvest: cropInfo.days,
            isWatered: false,
          };
          setTiles(newTiles);
          setEnergy(energy - ENERGY_COST.plant);
          
          // 扣除种子
          setInventory(inventory.map(i => 
            i.id === selectedSeed ? { ...i, count: i.count - 1 } : i
          ));
        }
      }
    } else if (tile.status === TILE_STATUS.READY && tile.cropId) {
      // 收获
      const cropInfo = CROPS[tile.cropId as keyof typeof CROPS];
      if (cropInfo) {
        const earnings = cropInfo.sell;
        setMoney(money + earnings);
        
        // 添加到背包
        const cropItemId = tile.cropId;
        const existingItem = inventory.find(i => i.id === cropItemId);
        if (existingItem) {
          setInventory(inventory.map(i => 
            i.id === cropItemId ? { ...i, count: i.count + 1 } : i
          ));
        } else {
          setInventory([...inventory, { 
            id: cropItemId, 
            name: cropInfo.name, 
            count: 1, 
            emoji: cropInfo.emoji 
          }]);
        }
        
        Alert.alert('🎉 收获！', 
          `获得 ${cropInfo.name}，卖出 +${earnings} 💰`
        );
      }
      
      newTiles[index] = {
        status: TILE_STATUS.SOIL,
        cropId: null,
        daysToHarvest: null,
        isWatered: false,
      };
      setTiles(newTiles);
      setEnergy(energy - ENERGY_COST.harvest);
    }
  };

  // --- 第二天 ---
  const nextDay = () => {
    const newTiles = tiles.map(tile => {
      if (tile.status === TILE_STATUS.PLANTED && tile.daysToHarvest !== null) {
        const newDays = tile.daysToHarvest - 1;
        if (newDays <= 0) {
          return { ...tile, daysToHarvest: 0, status: TILE_STATUS.READY, isWatered: false };
        }
        return { ...tile, daysToHarvest: newDays, isWatered: false };
      }
      if (tile.status >= TILE_STATUS.SOIL) {
        return { ...tile, isWatered: false };
      }
      return tile;
    });
    setTiles(newTiles);
    
    // 新一天
    const newDay = day + 1;
    setDay(newDay);
    setEnergy(MAX_ENERGY); // 恢复体力
    
    // 季节
    if (newDay % 28 === 0) {
      const seasonIndex = ((newDay / 28) % 4);
      setSeason(SEASONS[seasonIndex]);
    }
    
    // 年份
    if (newDay % 112 === 0) {
      setYear(year + 1);
    }
  };

  // --- 渲染 ---
  return (
    <View style={styles.container}>
      {/* 顶部状态栏 */}
      <View style={styles.header}>
        <Text style={styles.headerText}>🌾 星露谷物语</Text>
        <View style={styles.stats}>
          <Text style={styles.stat}>💰 {money}</Text>
          <Text style={styles.stat}>⚡ {energy}/{MAX_ENERGY}</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.stat}>📅 Y{year} D{day}</Text>
          <Text style={styles.stat}>{getSeasonEmoji(season)} {season}</Text>
        </View>
      </View>

      {/* 快捷按钮 */}
      <View style={styles.quickButtons}>
        <TouchableOpacity 
          style={styles.quickBtn} 
          onPress={() => setShowInventory(!showInventory)}
        >
          🎒 背包
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.quickBtn}
          onPress={() => setShowNPCs(!showNPCs)}
        >
          👥 村民
        </TouchableOpacity>
      </View>

      {/* 背包面板 */}
      {showInventory && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>🎒 背包</Text>
          <ScrollView horizontal>
            {inventory.map((item, idx) => (
              <View key={idx} style={styles.invItem}>
                <Text style={styles.invEmoji}>{item.emoji}</Text>
                <Text style={styles.invName}>{item.name}</Text>
                <Text style={styles.invCount}>x{item.count}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* NPC 面板 */}
      {showNPCs && (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>👥 村民关系</Text>
          <ScrollView horizontal>
            {npcs.map((npc, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.npcItem}
                onPress={() => {
                  const newNpcs = [...npcs];
                  newNpcs[idx].heart += 20;
                  setNpcs(newNpcs);
                }}
              >
                <Text style={styles.npcEmoji}>{npc.emoji}</Text>
                <Text style={styles.npcName}>{npc.name}</Text>
                <Text style={styles.npcHeart}>❤️ {Math.floor(npc.heart / 50)}⭐</Text>
                <Text style={styles.npcLoc}>{npc.location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.panelHint}>点击 NPC 增加友谊</Text>
        </View>
      )}

      {/* 农场地图 */}
      <View style={styles.farmContainer}>
        <View style={styles.farm}>
          {tiles.map((tile, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tile,
                { backgroundColor: getTileColor(tile) },
              ]}
              onPress={() => handleTilePress(index)}
            >
              <Text style={styles.cropEmoji}>{getCropEmoji(tile)}</Text>
              {tile.isWatered && tile.status >= TILE_STATUS.SOIL && (
                <View style={styles.wateredIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 底部工具栏 */}
      <View style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* 工具 */}
          {[
            { id: 'hoe', emoji: '🔨', name: '锄头' },
            { id: 'water', emoji: '🚿', name: '水壶' },
          ].map(tool => (
            <TouchableOpacity
              key={tool.id}
              style={[
                styles.toolButton,
                selectedTool === tool.id && styles.toolButtonActive,
              ]}
              onPress={() => {
                setSelectedTool(tool.id);
                setSelectedSeed(null);
              }}
            >
              <Text style={styles.toolEmoji}>{tool.emoji}</Text>
              <Text style={styles.toolName}>{tool.name}</Text>
            </TouchableOpacity>
          ))}
          
          {/* 种子 */}
          <Text style={styles.divider}>|</Text>
          {inventory.filter(i => i.id.startsWith('seed_')).map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.toolButton,
                selectedSeed === item.id && styles.toolButtonActive,
              ]}
              onPress={() => {
                setSelectedSeed(item.id);
                setSelectedTool('');
              }}
            >
              <Text style={styles.toolEmoji}>{item.emoji}</Text>
              <Text style={styles.toolName}>x{item.count}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 结束今天 */}
      <TouchableOpacity style={styles.nextDayButton} onPress={nextDay}>
        <Text style={styles.nextDayText}>🌙 睡觉 (明天)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 10, paddingHorizontal: 16 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  stat: { color: '#fff', fontSize: 15 },
  
  quickButtons: { flexDirection: 'row', justifyContent: 'center', padding: 8, backgroundColor: '#fff' },
  quickBtn: { paddingHorizontal: 20, paddingVertical: 8, marginHorizontal: 5, backgroundColor: COLORS.primaryLight, borderRadius: 8 },
  
  panel: { backgroundColor: '#FFF8E1', padding: 10, borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  panelTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  panelHint: { fontSize: 12, color: '#888', marginTop: 5 },
  
  invItem: { alignItems: 'center', padding: 8, marginRight: 10, backgroundColor: '#fff', borderRadius: 8 },
  invEmoji: { fontSize: 24 },
  invName: { fontSize: 11, marginTop: 2 },
  invCount: { fontSize: 10, color: '#666' },
  
  npcItem: { alignItems: 'center', padding: 8, marginRight: 10, backgroundColor: '#fff', borderRadius: 8, width: 80 },
  npcEmoji: { fontSize: 28 },
  npcName: { fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  npcHeart: { fontSize: 11, color: '#E91E63' },
  npcLoc: { fontSize: 10, color: '#888' },
  
  farmContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  farm: { flexDirection: 'row', flexWrap: 'wrap', width: GRID_WIDTH * TILE_SIZE, height: GRID_HEIGHT * TILE_SIZE, borderWidth: 3, borderColor: COLORS.wood, backgroundColor: COLORS.primary },
  tile: { width: TILE_SIZE, height: TILE_SIZE, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  cropEmoji: { fontSize: 22 },
  wateredIndicator: { position: 'absolute', bottom: 2, right: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.water },
  
  toolbar: { backgroundColor: COLORS.surface, paddingVertical: 10, paddingHorizontal: 10, borderTopWidth: 2, borderTopColor: COLORS.wood },
  toolButton: { alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 5, borderRadius: 10, backgroundColor: COLORS.background },
  toolButtonActive: { backgroundColor: COLORS.primaryLight },
  toolEmoji: { fontSize: 24 },
  toolName: { fontSize: 12, marginTop: 2 },
  divider: { fontSize: 20, color: '#ccc', alignSelf: 'center', marginHorizontal: 5 },
  
  nextDayButton: { backgroundColor: COLORS.primary, padding: 15, margin: 10, borderRadius: 10, alignItems: 'center' },
  nextDayText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default GameScreen;
