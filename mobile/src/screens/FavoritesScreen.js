import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { travelApi } from '../api/travelApi';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadUserAndFavorites();
  }, []);

  const loadUserAndFavorites = async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) {
        setLoading(false);
        return;
      }
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      const data = await travelApi.getUserFavorites(user.id);
      setFavorites(data || []);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tải danh sách yêu thích');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (placeId) => {
    if (!currentUser) return;
    try {
      await travelApi.toggleFavorite(currentUser.id, placeId);
      // Cập nhật lại state trực tiếp
      setFavorites((prev) => prev.filter((item) => item.id !== placeId));
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể xóa khỏi sổ tay');
    }
  };

  // Tính tổng dự toán ngân sách vé tham quan (giống bản mẫu web)
  const totalBudget = favorites.reduce((acc, curr) => acc + (Number(curr.ticketPriceAvg) || 0), 0);

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Detail', { placeId: item.id })}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
          <TouchableOpacity onPress={() => handleRemoveFavorite(item.id)} style={styles.removeBtn}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardAddress} numberOfLines={1}>📍 {item.address}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardCategory}>{item.provinceName} • {item.categoryName}</Text>
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sổ Tay Điểm Đến ({favorites.length})</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Card Thống kê Tổng dự toán ngân sách */}
      <View style={styles.budgetCard}>
        <View>
          <Text style={styles.budgetLabel}>Dự toán kinh phí vé tham quan:</Text>
          <Text style={styles.budgetValue}>{totalBudget.toLocaleString('vi-VN')} VNĐ</Text>
        </View>
        <Text style={styles.budgetIcon}>🎟️</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải sổ tay du lịch...</Text>
        </View>
      ) : !currentUser ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyTitle}>Yêu cầu đăng nhập</Text>
          <Text style={styles.emptySubtitle}>Vui lòng đăng nhập để lưu và xem các điểm đến yêu thích của bạn</Text>
          <TouchableOpacity
            style={styles.loginNowBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginNowText}>Đăng Nhập Ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFavoriteItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>Sổ tay chưa có điểm đến</Text>
              <Text style={styles.emptySubtitle}>Bấm vào biểu tượng trái tim ở từng địa danh để gom vào lịch trình nhé!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },

  budgetCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecfdf5', margin: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#a7f3d0' },
  budgetLabel: { fontSize: 12, color: '#065f46', fontWeight: '500' },
  budgetValue: { fontSize: 20, fontWeight: '800', color: '#047857', marginTop: 2 },
  budgetIcon: { fontSize: 32 },

  listContainer: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  card: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  cardImage: { width: 100, height: 100, backgroundColor: '#cbd5e1' },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 14, color: '#94a3b8', fontWeight: 'bold' },
  cardAddress: { fontSize: 12, color: '#64748b' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardCategory: { fontSize: 11, color: '#059669', fontWeight: '600' },
  cardPrice: { fontSize: 13, fontWeight: '700', color: '#0f172a' },

  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  loginNowBtn: { marginTop: 16, backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  loginNowText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
});