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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { travelApi } from '../api/travelApi';

export default function HomeScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');

  // Tải thông tin người dùng từ máy
  useEffect(() => {
    AsyncStorage.getItem('user').then((val) => {
      if (val) setCurrentUser(JSON.parse(val));
    });
  }, []);

  // Tải danh mục ban đầu
  useEffect(() => {
    loadCategories();
  }, []);

  // Tải danh sách địa điểm khi đổi danh mục hoặc tìm kiếm
  useEffect(() => {
    loadPlaces();
  }, [selectedCategory]);

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
      const res = await travelApi.getPlaces({
        categoryId: selectedCategory || undefined,
        tuKhoa: keyword || undefined,
        pageSize: 20,
      });
      // Kết quả phân trang nằm trong mảng items của PagedResult
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
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardRating}>★ {item.ratingAvg.toFixed(1)}</Text>
        </View>
        <Text style={styles.cardAddress} numberOfLines={1}>📍 {item.address}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardTag}>{item.provinceName} • {item.categoryName}</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Xin chào,</Text>
          <Text style={styles.userNameText}>
            {currentUser ? currentUser.fullname : 'Khách du lịch'}
          </Text>
        </View>
        {currentUser ? (
          <TouchableOpacity onPress={handleLogout} style={styles.authBtn}>
            <Text style={styles.authBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.authBtn}>
            <Text style={styles.authBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm địa điểm, thành phố..."
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={loadPlaces}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={loadPlaces}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {/* Danh mục Bar */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCategoryItem}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Danh sách địa điểm */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPlaceCard}
          contentContainerStyle={styles.placeList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>Không tìm thấy địa điểm nào phù hợp</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  welcomeText: { fontSize: 13, color: '#64748b' },
  userNameText: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  authBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#e2e8f0', borderRadius: 20 },
  authBtnText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  searchBox: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  searchInput: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14 },
  searchBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 8, marginLeft: 8 },
  searchBtnText: { color: '#ffffff', fontWeight: 'bold' },
  categoryContainer: { height: 42, marginBottom: 8 },
  categoryList: { paddingHorizontal: 16, gap: 8 },
  catBadge: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#e2e8f0', borderRadius: 20, height: 34 },
  catBadgeActive: { backgroundColor: '#2563eb' },
  catText: { fontSize: 13, color: '#334155', fontWeight: '500' },
  catTextActive: { color: '#ffffff', fontWeight: 'bold' },
  placeList: { padding: 16, gap: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6 },
  cardImage: { width: '100%', height: 160, backgroundColor: '#cbd5e1' },
  cardContent: { padding: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  cardRating: { fontSize: 14, fontWeight: 'bold', color: '#eab308', marginLeft: 8 },
  cardAddress: { fontSize: 13, color: '#64748b', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8 },
  cardTag: { fontSize: 12, color: '#2563eb', fontWeight: '500' },
  cardPrice: { fontSize: 13, fontWeight: 'bold', color: '#059669' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#94a3b8', fontSize: 14 },
});