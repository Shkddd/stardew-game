import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TILE_SIZE, GRID_WIDTH, GRID_HEIGHT, CROPS, TILE_STATUS, SEASONS } from '../constants';

const STORAGE_KEY = '@stardew_game_data';

// ============ 类型定义 ============
interface Tile {
  status: number;
  cropId: string | null;
  daysToHarvest: number | null;
  isWatered: boolean;
}

interface GameData {
  tiles: Tile[];
  money: number;
  energy: number;
  day: number;
  season: string;
  year: number;
  inventory: any[];
}

// ============ 组件 ============
const GameScreen: React.FC = () => {
  // --- 状态 ---
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('hoe');
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const [money, setMoney] = useState(500);
  const [energy, setEnergy] = useState(100);
  const [day, setDay] = useState(1);
  const [season, setSeason] = useState<string>('spring');
  const [year, setYear] = useState(1);
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  // 背包物品
  const [inventory, setInventory] = useState([
    { id: 'seed_carrot', name: '胡萝卜种子', count: 10, emoji: '🥕' },
    { id: 'seed_tomato', name: '番茄种子', count: 5, emoji: '🍅' },
    { id: 'hoe', name: '锄头', count: 1, emoji: '🔨' },
    { id: 'water', name: '水壶', count: 1, emoji: '🚿' },
    { id: 'pumpkin', name: '南瓜', count: 2, emoji: '🎃' },
  ]);

  // --- 初始化 ---
  useEffect(() => {
    loadGame();
  }, []);

  // 保存游戏
  const saveGame = async () => {
    try {
      const data: GameData = {
        tiles,
        money,
        energy,
        day,
        season,
        year,
        inventory,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      Alert.alert('✅', '游戏已自动保存！');
    } catch (e) {
      Alert.alert('❌', '保存失败');
    }
  };

  // 加载游戏
  const loadGame = async () => {
    try {
      const dataStr = await AsyncStorage.getItem(STORAGE_KEY);
      if (dataStr) {
        const data: GameData = JSON.parse(dataStr);
        setTiles(data.tiles);
        setMoney(data.money);
        setEnergy(data.energy);
        setDay(data.day);
        setSeason(data.season);
        setYear(data.year);
        setInventory(data.inventory);
      } else {
        // 初始化新游戏
        initializeNewGame();
      }
    } catch (e) {
      initializeNewGame();
    }
  };

  // 初始化新游戏
  const initializeNewGame = () => {
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
  };

  // 重置游戏
  const resetGame = async () => {
    Alert.alert('🔄', '确定要重置游戏吗？所有数据将丢失！', [
      { text: '取消', style: 'cancel' },
      { 
        text: '确定', 
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          initializeNewGame();
          setMoney(500);
          setEnergy(100);
          setDay(1);
          setSeason('spring');
          setYear(1);
          setInventory([
            { id: 'seed_carrot', name: '胡萝卜种子', count: 10, emoji: '🥕' },
            { id: 'seed_tomato', name: '番茄种子', count: 5, emoji: '🍅' },
            { id: 'hoe', name: '锄头', count: 1, emoji: '🔨' },
            { id: 'water', name: '水壶', count: 1, emoji: '🚿' },
          ]);
        }
      },
    ]);
  };

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
      if (energy >= 2) {
        newTiles[index] = { ...tile, status: TILE_STATUS.SOIL };
        setTiles(newTiles);
        setEnergy(energy - 2);
      }
    } else if (selectedTool === 'water' && tile.status >= TILE_STATUS.SOIL) {
      if (energy >= 2 && !tile.isWatered) {
        newTiles[index] = { ...tile, isWatered: true };
        setTiles(newTiles);
        setEnergy(energy - 2);
      }
    } else if (selectedSeed && tile.status === TILE_STATUS.SOIL && !tile.cropId) {
      const seedItem = inventory.find(i => i.id === selectedSeed);
      if (seedItem && seedItem.count > 0 && energy >= 1) {
        const cropInfo = CROPS[selectedSeed.replace('seed_', '') as keyof typeof CROPS];
        if (cropInfo) {
          newTiles[index] = {
            status: TILE_STATUS.PLANTED,
            cropId: selectedSeed.replace('seed_', ''),
            daysToHarvest: cropInfo.days,
            isWatered: false,
          };
          setTiles(newTiles);
          setEnergy(energy - 1);
          setInventory(inventory.map(i => 
            i.id === selectedSeed ? { ...i, count: i.count - 1 } : i
          ));
        }
      }
    } else if (tile.status === TILE_STATUS.READY && tile.cropId) {
      const cropInfo = CROPS[tile.cropId as keyof typeof CROPS];
      if (cropInfo) {
        const earnings = cropInfo.sell;
        setMoney(money + earnings);
        
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
        
        Alert.alert('🎉 收获！', `获得 ${cropInfo.name}，卖出 +${earnings} 💰`);
      }
      
      newTiles[index] = {
        status: TILE_STATUS.SOIL,
        cropId: null,
        daysToHarvest: null,
        isWatered: false,
      };
      setTiles(newTiles);
      setEnergy(energy - 1);
    }
  };

  // 第二天
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
    
    const newDayNum = day + 1;
    setDay(newDayNum);
    setEnergy(100);
    
    if (newDayNum % 28 === 0) {
      const seasonIndex = ((newDayNum / 28) % 4);
      setSeason(SEASONS[seasonIndex]);
    }
    
    if (newDayNum % 112 === 0) {
      setYear(year + 1);
    }
    
    // 自动保存
    saveGame();
  };

  // --- 渲染 ---
  return (
    <View style={styles.container}>
      {/* 顶部状态栏 */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerText}>🌾 星露谷物语</Text>
          <TouchableOpacity onPress={saveGame}>
            <Text style={styles.saveBtn}>💾</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.stats}>
          <Text style={styles.stat}>💰 {money}</Text>
          <Text style={styles.stat}>⚡ {energy}/100</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.stat}>📅 Y{year} D{day}</Text>
          <Text style={styles.stat}>{getSeasonEmoji(season)} {season}</Text>
        </View>
      </View>

      {/* 快捷操作 */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={saveGame}>
          💾 保存
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={resetGame}>
          🔄 重置
        </TouchableOpacity>
      </View>

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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  saveBtn: { fontSize: 20 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
  stat: { color: '#fff', fontSize: 15 },
  
  quickActions: { flexDirection: 'row', justifyContent: 'center', padding: 8, backgroundColor: '#fff' },
  quickBtn: { paddingHorizontal: 20, paddingVertical: 8, marginHorizontal: 5, backgroundColor: COLORS.primaryLight, borderRadius: 8 },
  
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
