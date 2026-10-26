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
  { id: 'Bắc', name: 'Miền Bắc' },
  { id: 'Trung', name: 'Miền Trung' },
  { id: 'Nam', name: 'Miền Nam' },
];

const SORT_OPTIONS = [
  { id: 'danhgia', name: '★ Đánh giá cao' },
  { id: 'giatang', name: '💵 Giá thấp → cao' },
  { id: 'giagiam', name: '💎 Giá cao → thấp' },
  { id: 'ten', name: '🔤 Tên (A-Z)' },
];

export default function HomeScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);

  // Bộ lọc
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedSort, setSelectedSort] = useState('danhgia');

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('user').then((val) => {
      if (val) setCurrentUser(JSON.parse(val));
    });
    loadCategories();
  }, []);

  // Tải lại danh sách tỉnh khi thay đổi vùng miền
  useEffect(() => {
    loadProvinces();
  }, [selectedRegion]);

  // Tải danh sách địa điểm khi thay đổi bộ lọc hoặc tiêu chí sắp xếp
  useEffect(() => {
    loadPlaces();
  }, [selectedCategory, selectedProvince, selectedSort]);

  const loadCategories = async () => {
    try {
      const data = await travelApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.log('Lỗi tải danh mục:', err.message);
    }
  };

  const loadProvinces = async () => {
    try {
      const regionParam = selectedRegion === 'all' ? undefined : selectedRegion;
      const data = await travelApi.getProvinces(regionParam);
      setProvinces(data);
      setSelectedProvince(null); // Reset tỉnh khi đổi miền
    } catch (err) {
      console.log('Lỗi tải tỉnh thành:', err.message);
    }
  };

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const res = await travelApi.getPlaces({
        categoryId: selectedCategory || undefined,
        provinceId: selectedProvince || undefined,
        sortBy: selectedSort,
        tuKhoa: keyword.trim() || undefined,
        pageSize: 20,
      });
      setPlaces(res.items || []);
    } catch (err) {
      console.log('Lỗi tải địa điểm:', err.message);
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>VietGuide</Text>
          <Text style={styles.welcomeText}>
            Xin chào, <Text style={styles.userName}>{currentUser ? currentUser.fullname : 'Khách du lịch'}</Text> 👋
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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

      {/* Ô tìm kiếm */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm địa danh, thành phố..."
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={loadPlaces}
          returnKeyType="search"
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={loadPlaces}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {/* Bộ lọc Vùng miền */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={REGIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
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
          }}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Danh sách Tỉnh thành tương ứng từ Backend */}
      {provinces.length > 0 && (
        <View style={styles.filterSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={provinces}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const isSelected = selectedProvince === item.id;
              return (
                <TouchableOpacity
                  style={[styles.provincePill, isSelected && styles.provincePillActive]}
                  onPress={() => setSelectedProvince(isSelected ? null : item.id)}
                >
                  <Text style={[styles.provinceText, isSelected && styles.provinceTextActive]}>
                    📍 {item.name} ({item.totalPlaces})
                  </Text>
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      )}

      {/* Bộ lọc Danh mục */}
      <View style={styles.filterSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
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
          }}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* Thanh Sắp xếp */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sắp xếp:</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SORT_OPTIONS}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selectedSort === item.id;
            return (
              <TouchableOpacity
                style={[styles.sortPill, isSelected && styles.sortPillActive]}
                onPress={() => setSelectedSort(item.id)}
              >
                <Text style={[styles.sortText, isSelected && styles.sortTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ gap: 6 }}
        />
      </View>

      {/* Danh sách Địa điểm */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải điểm đến...</Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.placeList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
          }
          renderItem={({ item }) => (
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
          )}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>🏖️</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy địa điểm nào</Text>
              <Text style={styles.emptySubtitle}>Hãy thử chọn tiêu chí lọc khác</Text>
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
  welcomeText: { fontSize: 15, color: '#334155' },
  userName: { fontWeight: '700', color: '#0f172a' },
  wishlistHeaderBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#fecdd3' },
  authBtn: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: '#f1f5f9', borderRadius: 20 },
  authBtnText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  loginBtn: { backgroundColor: '#059669' },
  loginBtnText: { color: '#ffffff' },

  searchContainer: { flexDirection: 'row', paddingHorizontal: 16, marginVertical: 8 },
  searchInput: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 14, color: '#0f172a' },
  searchBtn: { backgroundColor: '#059669', paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginLeft: 8 },
  searchBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  filterSection: { marginBottom: 6 },
  horizontalList: { paddingHorizontal: 16, gap: 6 },
  regionPill: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1' },
  regionPillActive: { backgroundColor: '#059669', borderColor: '#059669' },
  regionText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  regionTextActive: { color: '#ffffff' },

  provincePill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f1f5f9', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  provincePillActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  provinceText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  provinceTextActive: { color: '#ffffff', fontWeight: 'bold' },

  catBadge: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#f1f5f9', borderRadius: 8 },
  catBadgeActive: { backgroundColor: '#d1fae5' },
  catText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  catTextActive: { color: '#047857', fontWeight: '700' },

  sortContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginVertical: 6 },
  sortLabel: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginRight: 8 },
  sortPill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  sortPillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  sortText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  sortTextActive: { color: '#ffffff', fontWeight: 'bold' },

  placeList: { padding: 16, gap: 14 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  imageWrapper: { position: 'relative', width: '100%', height: 160, backgroundColor: '#e2e8f0' },
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

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
});