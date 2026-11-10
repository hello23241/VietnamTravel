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
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  // Tự động tính toán khoảng an toàn trên đỉnh theo từng thiết bị thực tế
  const topSafeArea = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 20);

  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);

  // Bộ lọc
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedSort, setSelectedSort] = useState('danhgia');

  // Trạng thái mở danh sách lựa chọn (Modal Bottom Sheet)
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

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
  }, [selectedRegion, selectedCategory, selectedProvince, selectedSort]);

  const loadCategories = async () => {
    try {
      const data = await travelApi.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.log('Lỗi tải danh mục:', err.message);
    }
  };

  const loadProvinces = async () => {
    try {
      const regionParam = selectedRegion === 'all' ? undefined : selectedRegion;
      const data = await travelApi.getProvinces(regionParam);
      setProvinces(data || []);
      setSelectedProvince(null);
    } catch (err) {
      console.log('Lỗi tải tỉnh thành:', err.message);
    }
  };

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const res = await travelApi.getPlaces({
        region: selectedRegion === 'all' ? undefined : selectedRegion,
        categoryId: selectedCategory || undefined,
        provinceId: selectedProvince || undefined,
        sortBy: selectedSort,
        tuKhoa: keyword.trim() || undefined,
        pageSize: 20,
      });
      setPlaces(res?.items || []);
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

  const selectedProvinceObj = provinces.find((p) => p.id === selectedProvince);
  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Cấu hình thanh trạng thái trong suốt, icon chữ màu tối */}
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* 1. Header bao phủ cả thanh trạng thái và hạ nội dung vào vùng an toàn (Safe Area) */}
      <View style={[styles.headerWrapper, { paddingTop: topSafeArea }]}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.headerLogo}
            />
            <View style={styles.brandTextContainer}>
              <Text style={styles.appName}>VietGuide</Text>
              <Text style={styles.welcomeText} numberOfLines={1} ellipsizeMode="tail">
                Xin chào, <Text style={styles.userName}>{currentUser ? currentUser.fullname : 'Khách du lịch'}</Text> 👋
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Favorites')} 
              style={styles.wishlistHeaderBtn}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>❤️</Text>
            </TouchableOpacity>

            {currentUser ? (
              <TouchableOpacity onPress={handleLogout} style={styles.authBtn} activeOpacity={0.7}>
                <Text style={styles.authBtnText}>Đăng xuất</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => navigation.replace('Login')} style={[styles.authBtn, styles.loginBtn]} activeOpacity={0.7}>
                <Text style={[styles.authBtnText, styles.loginBtnText]}>Đăng nhập</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* 2. Ô tìm kiếm */}
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
        <TouchableOpacity style={styles.searchBtn} onPress={loadPlaces} activeOpacity={0.8}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Bộ lọc Vùng miền (4 nút thanh thoát) */}
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
                activeOpacity={0.7}
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

      {/* 4. Cụm 2 nút danh sách chọn Tỉnh thành & Thể loại */}
      <View style={styles.dropdownRow}>
        <TouchableOpacity
          style={[styles.dropdownBtn, selectedProvince && styles.dropdownBtnActive]}
          onPress={() => setProvinceModalVisible(true)}
          activeOpacity={0.75}
        >
          <Text style={[styles.dropdownBtnText, selectedProvince && styles.dropdownBtnTextActive]} numberOfLines={1}>
            {selectedProvinceObj ? `📍 ${selectedProvinceObj.name}` : '📍 Tất cả Tỉnh thành'}
          </Text>
          <Text style={[styles.dropdownArrow, selectedProvince && styles.dropdownArrowActive]}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dropdownBtn, selectedCategory && styles.dropdownBtnActive]}
          onPress={() => setCategoryModalVisible(true)}
          activeOpacity={0.75}
        >
          <Text style={[styles.dropdownBtnText, selectedCategory && styles.dropdownBtnTextActive]} numberOfLines={1}>
            {selectedCategoryObj ? `🏷️ ${selectedCategoryObj.name}` : '🏷️ Tất cả Thể loại'}
          </Text>
          <Text style={[styles.dropdownArrow, selectedCategory && styles.dropdownArrowActive]}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Thanh Sắp xếp */}
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
                activeOpacity={0.7}
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

      {/* 6. Danh sách Địa điểm */}
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

      {/* MODAL 1: BẢNG CHỌN TỈNH THÀNH */}
      <Modal
        visible={provinceModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProvinceModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProvinceModalVisible(false)}
        >
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📍 Chọn Tỉnh / Thành Phố</Text>
              <TouchableOpacity onPress={() => setProvinceModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={[
                { id: null, name: 'Tất cả tỉnh thành', totalPlaces: provinces.reduce((acc, p) => acc + (p.totalPlaces || 0), 0) },
                ...provinces,
              ]}
              keyExtractor={(item) => (item.id === null ? 'all' : item.id.toString())}
              renderItem={({ item }) => {
                const isSelected = selectedProvince === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedProvince(item.id);
                      setProvinceModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {item.id ? `📍 ${item.name}` : `🌐 ${item.name}`}
                      {item.totalPlaces !== undefined && (
                        <Text style={styles.modalCountBadge}> ({item.totalPlaces})</Text>
                      )}
                    </Text>
                    {isSelected && <Text style={styles.modalCheckText}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL 2: BẢNG CHỌN THỂ LOẠI */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏷️ Chọn Thể Loại Trải Nghiệm</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={[{ id: null, name: 'Tất cả thể loại' }, ...categories]}
              keyExtractor={(item) => (item.id === null ? 'all' : item.id.toString())}
              renderItem={({ item }) => {
                const isSelected = selectedCategory === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => {
                      setSelectedCategory(item.id);
                      setCategoryModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}>
                      {item.id ? `🏷️ ${item.name}` : `✨ ${item.name}`}
                    </Text>
                    {isSelected && <Text style={styles.modalCheckText}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  /* Header Wrapper giải quyết khoảng trống thanh trạng thái */
  headerWrapper: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 14, 
    paddingVertical: 10,
  },
  brandRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    flex: 1, 
    marginRight: 6,
  },
  brandTextContainer: { 
    flex: 1,
  },
  headerLogo: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    backgroundColor: '#ffffff', 
    borderWidth: 1, 
    borderColor: '#e2e8f0',
  },
  appName: { 
    fontSize: 11, 
    fontWeight: '800', 
    color: '#059669', 
    textTransform: 'uppercase', 
    letterSpacing: 0.8,
  },
  welcomeText: { 
    fontSize: 13, 
    color: '#334155',
  },
  userName: { 
    fontWeight: '700', 
    color: '#0f172a',
  },
  headerActions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    flexShrink: 0,
  },
  wishlistHeaderBtn: { 
    width: 34, 
    height: 34, 
    borderRadius: 17, 
    backgroundColor: '#fef2f2', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#fecdd3',
  },
  authBtn: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    backgroundColor: '#f1f5f9', 
    borderRadius: 18,
  },
  authBtnText: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#475569',
  },
  loginBtn: { 
    backgroundColor: '#059669',
  },
  loginBtnText: { 
    color: '#ffffff',
    fontWeight: '700',
  },

  /* Search */
  searchContainer: { flexDirection: 'row', paddingHorizontal: 14, marginVertical: 8 },
  searchInput: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 14, height: 44, fontSize: 13, color: '#0f172a' },
  searchBtn: { backgroundColor: '#059669', paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginLeft: 8 },
  searchBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  /* Region Filter */
  filterSection: { marginBottom: 6 },
  horizontalList: { paddingHorizontal: 14, gap: 6 },
  regionPill: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#cbd5e1' },
  regionPillActive: { backgroundColor: '#059669', borderColor: '#059669' },
  regionText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  regionTextActive: { color: '#ffffff' },

  /* Dropdown Row */
  dropdownRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    marginVertical: 4,
  },
  dropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    elevation: 1,
  },
  dropdownBtnActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  dropdownBtnText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
    marginRight: 4,
  },
  dropdownBtnTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  dropdownArrow: {
    fontSize: 9,
    color: '#94a3b8',
  },
  dropdownArrowActive: {
    color: '#059669',
  },

  /* Modal Bottom Sheet */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 18,
    maxHeight: '70%',
    elevation: 10,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  modalItemActive: {
    backgroundColor: '#ecfdf5',
  },
  modalItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  modalItemTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  modalCheckText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  modalCountBadge: {
    fontSize: 11,
    color: '#94a3b8',
  },

  /* Sort */
  sortContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginVertical: 6 },
  sortLabel: { fontSize: 12, color: '#64748b', fontWeight: 'bold', marginRight: 8 },
  sortPill: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  sortPillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  sortText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  sortTextActive: { color: '#ffffff', fontWeight: 'bold' },

  /* Place Cards */
  placeList: { padding: 14, gap: 14 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8 },
  imageWrapper: { position: 'relative', width: '100%', height: 160, backgroundColor: '#e2e8f0' },
  cardImage: { width: '100%', height: '100%' },
  ratingBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(15, 23, 42, 0.75)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingText: { color: '#fbbf24', fontSize: 12, fontWeight: '700' },
  regionTag: { position: 'absolute', bottom: 10, left: 10, backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  regionTagText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  cardContent: { padding: 14 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  cardAddress: { fontSize: 12, color: '#64748b', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f8fafc', paddingTop: 8 },
  cardCategory: { fontSize: 12, color: '#64748b' },
  cardPrice: { fontSize: 13, fontWeight: 'bold', color: '#059669' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#334155' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 },
});