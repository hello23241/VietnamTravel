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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { travelApi } from '../api/travelApi';

export default function FavoritesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const topSafeArea = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 20);

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
      setFavorites((prev) => prev.filter((item) => item.id !== placeId));
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể xóa khỏi sổ tay');
    }
  };

  // Tính tổng dự toán ngân sách vé tham quan
  const totalBudget = favorites.reduce((acc, curr) => acc + (Number(curr.ticketPriceAvg) || 0), 0);

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Detail', { placeId: item.id })}
    >
      {/* Cột ảnh bên trái kèm badge Tỉnh thành */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        {item.provinceName ? (
          <View style={styles.provinceBadge}>
            <Text style={styles.provinceBadgeText} numberOfLines={1}>
              {item.provinceName}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Cột thông tin bên phải */}
      <View style={styles.cardContent}>
        {/* Hàng 1: Tên địa danh & Nút gỡ */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity
            onPress={() => handleRemoveFavorite(item.id)}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Hàng 2: Địa chỉ chi tiết */}
        <Text style={styles.cardAddress} numberOfLines={1}>
          📍 {item.address || item.provinceName || 'Việt Nam'}
        </Text>

        {/* Hàng 3: Thể loại & Giá vé bảo đảm không va chạm */}
        <View style={styles.cardFooter}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {item.categoryName || 'Điểm đến'}
            </Text>
          </View>

          <Text style={styles.cardPrice} numberOfLines={1}>
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

      {/* Header hạ xuống dưới thanh trạng thái */}
      <View style={[styles.headerWrapper, { paddingTop: topSafeArea }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sổ Tay Điểm Đến ({favorites.length})</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      {/* Card Thống kê Tổng dự toán ngân sách vé */}
      <View style={styles.budgetCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.budgetLabel}>Dự toán kinh phí vé tham quan:</Text>
          <Text style={styles.budgetValue}>{totalBudget.toLocaleString('vi-VN')} VNĐ</Text>
        </View>
        <View style={styles.budgetIconBox}>
          <Text style={styles.budgetIcon}>🎟️</Text>
        </View>
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
          <Text style={styles.emptySubtitle}>
            Vui lòng đăng nhập để lưu và xem các điểm đến yêu thích của bạn
          </Text>
          <TouchableOpacity
            style={styles.loginNowBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
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
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={styles.emptyTitle}>Sổ tay chưa có điểm đến</Text>
              <Text style={styles.emptySubtitle}>
                Bấm vào biểu tượng trái tim ở từng địa danh để gom vào lịch trình nhé!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  /* Header Wrapper xử lý tai thỏ / status bar */
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backBtnText: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },

  /* Card Dự toán Ngân sách */
  budgetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    elevation: 1,
  },
  budgetLabel: { fontSize: 12, color: '#065f46', fontWeight: '600' },
  budgetValue: { fontSize: 20, fontWeight: '900', color: '#047857', marginTop: 2 },
  budgetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  budgetIcon: { fontSize: 22 },

  /* Danh sách Cards */
  listContainer: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 30, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  imageContainer: {
    width: 105,
    height: 105,
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  cardImage: { width: '100%', height: '100%' },
  provinceBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 90,
  },
  provinceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Nội dung bên phải thẻ */
  cardContent: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
    marginRight: 6,
  },
  removeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  cardAddress: {
    fontSize: 12,
    color: '#64748b',
    marginVertical: 4,
  },

  /* Footer thẻ: Phân chia không gian chống nuốt chữ */
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryBadge: {
    maxWidth: '56%',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  cardPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
    flexShrink: 0,
    textAlign: 'right',
  },

  /* States */
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  loginNowBtn: { marginTop: 16, backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  loginNowText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
});