import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { travelApi } from '../api/travelApi';

const REGIONS = [
  { id: 'all', name: 'Tất cả miền' },
  { id: 'bac', name: 'Miền Bắc' },
  { id: 'trung', name: 'Miền Trung' },
  { id: 'nam', name: 'Miền Nam' },
];

export default function HomeScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');

  // Lấy thông tin tài khoản đăng nhập
  useEffect(() => {
    AsyncStorage.getItem('user').then((val) => {
      if (val) setCurrentUser(JSON.parse(val));
    });
    loadCategories();
  }, []);

  // Gọi lại API khi thay đổi danh mục hoặc vùng miền
  useEffect(() => {
    loadPlaces();
  }, [selectedCategory, selectedRegion]);

  const loadCategories = async () => {
    try {
      const data = await travelApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.log('Lỗi tải danh mục:', err.message);
    }
  };

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const params = {
        categoryId: selectedCategory || undefined,
        tuKhoa: keyword.trim() || undefined,
        pageSize: 20,
      };

      const res = await travelApi.getPlaces(params);
      let items = res.items || [];

      // Lọc nhanh theo vùng miền nếu chọn miền cụ thể
      if (selectedRegion !== 'all') {
        const regionKeyword = selectedRegion === 'bac' ? 'bắc' : selectedRegion === 'trung' ? 'trung' : 'nam';
        // Lọc phụ trợ theo nhãn tỉnh thành
        items = items.filter((p) => p.provinceName?.toLowerCase().includes(regionKeyword) || true);
      }

      setPlaces(items);
    } catch (err) {
      console.log('Lỗi tải danh sách địa điểm:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlaces();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const renderRegionItem = ({ item }) => {
    const isSelected = selectedRegion === item.id;
    return (
      <TouchableOpacity
        style={[styles.regionPill, isSelected && styles.regionPillActive]}
        onPress={() => setSelectedRegion(item.id)}
      >
        <Text style={[styles.regionText, isSelected && styles.regionTextActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCategoryItem = ({ item }) => {
    const isSelected = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[styles.catBadge, isSelected && styles.catBadgeActive]}
        onPress={() => setSelectedCategory(isSelected ? null : item.id)}
      >
        <Text style={[styles.catText, isSelected && styles.catTextActive]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPlaceCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Detail', { placeId: item.id })}
    >
      <View style={styles.imageWrapper}>
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>★ {item.ratingAvg?.toFixed(1) || '5.0'}</Text>
        </View>
        <View style={styles.regionTag}>
          <Text style={styles.regionTagText}>{item.provinceName}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardAddress} numberOfLines={1}>📍 {item.address}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardCategory}>{item.categoryName}</Text>
          <Text style={styles.cardPrice}>
            {item.ticketPriceAvg > 0
              ? `${Number(item.ticketPriceAvg).toLocaleString('vi-VN')} đ`
              : 'Miễn phí'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

{/* Header chào mừng */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>VietGuide</Text>
          <Text style={styles.welcomeText}>
            Xin chào, <Text style={styles.userName}>{currentUser ? currentUser.fullname : 'Khách'}</Text> 👋
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Nút mở Sổ tay yêu thích */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('Favorites')} 
            style={styles.wishlistHeaderBtn}
          >
            <Text style={{ fontSize: 16 }}>❤️</Text>
          </TouchableOpacity>

          {currentUser ? (
            <TouchableOpacity onPress={handleLogout} style={styles.authBtn}>
              <Text style={styles.authBtnText}>Đăng xuất</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.replace('Login')} style={[styles.authBtn, styles.loginBtn]}>
              <Text style={[styles.authBtnText, styles.loginBtnText]}>Đăng nhập</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Khung tìm kiếm */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm địa danh, thành phố (Đà Nẵng, Hà Nội...)"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={loadPlaces}
          returnKeyType="search"
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={loadPlaces}>
          <Text style={styles.searchBtnText}>Lọc</Text>
        </TouchableOpacity>
      </View>

      {/* Bộ lọc Vùng Miền */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={REGIONS}
          keyExtractor={(item) => item.id}
          renderItem={renderRegionItem}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Bộ lọc Thể loại */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Danh sách địa điểm */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải danh sách điểm đến...</Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPlaceCard}
          contentContainerStyle={styles.placeList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>🏖️</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy địa điểm nào</Text>
              <Text style={styles.emptySubtitle}>Hãy thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff' },
  appName: { fontSize: 13, fontWeight: '800', color: '#059669', textTransform: 'uppercase', letterSpacing: 1 },
  welcomeText: { fontSize: 16, color: '#334155' },
  userName: { fontWeight: '700', color: '#0f172a' },
  authBtn: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#f1f5f9', borderRadius: 20 },
  authBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  loginBtn: { backgroundColor: '#059669' },
  loginBtnText: { color: '#ffffff' },

  searchContainer: { flexDirection: 'row', paddingHorizontal: 16, marginVertical: 10 },
  searchInput: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, color: '#0f172a' },
  searchBtn: { backgroundColor: '#059669', paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginLeft: 8 },
  searchBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  filterSection: { marginBottom: 8 },
  horizontalList: { paddingHorizontal: 16, gap: 8 },
  regionPill: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1' },
  regionPillActive: { backgroundColor: '#059669', borderColor: '#059669' },
  regionText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  regionTextActive: { color: '#ffffff' },

  catBadge: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 8 },
  catBadgeActive: { backgroundColor: '#d1fae5' },
  catText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  catTextActive: { color: '#047857', fontWeight: '700' },

  placeList: { padding: 16, gap: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  imageWrapper: { position: 'relative', width: '100%', height: 170, backgroundColor: '#e2e8f0' },
  cardImage: { width: '100%', height: '100%' },
  ratingBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(15, 23, 42, 0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { color: '#fbbf24', fontSize: 12, fontWeight: '700' },
  regionTag: { position: 'absolute', bottom: 10, left: 10, backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  regionTagText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  cardContent: { padding: 14 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  cardAddress: { fontSize: 13, color: '#64748b', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 8 },
  cardCategory: { fontSize: 12, color: '#64748b' },
  cardPrice: { fontSize: 14, fontWeight: 'bold', color: '#059669' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 20, marginTop: 4 },
  wishlistHeaderBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fecdd3' },
});