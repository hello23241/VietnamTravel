import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { travelApi } from '../api/travelApi';

export default function DetailScreen({ route, navigation }) {
  const { placeId } = route.params;

  const [place, setPlace] = useState(null);
  const [weather, setWeather] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, [placeId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // 1. Lấy thông tin user hiện tại
      const userStr = await AsyncStorage.getItem('user');
      let user = null;
      if (userStr) {
        user = JSON.parse(userStr);
        setCurrentUser(user);
      }

      // 2. Tải song song thông tin địa điểm, thời tiết và đánh giá
      const [placeData, weatherData, reviewsData] = await Promise.all([
        travelApi.getPlaceDetail(placeId),
        travelApi.getPlaceWeather(placeId).catch(() => null),
        travelApi.getReviews(placeId).catch(() => []),
      ]);

      setPlace(placeData);
      setWeather(weatherData);
      setReviews(reviewsData);

      // 3. Kiểm tra xem user này đã lưu địa điểm vào yêu thích chưa
      if (user) {
        const userFavs = await travelApi.getUserFavorites(user.id).catch(() => []);
        setIsFavorite(userFavs.some((fav) => fav.id === placeId));
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể tải thông tin địa điểm');
    } finally {
      setLoading(false);
    }
  };

  // Nút mở Google Maps chỉ đường theo tọa độ GPS (UC06)
  const handleOpenGoogleMaps = () => {
    if (!place) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Lỗi', 'Không thể khởi chạy ứng dụng Google Maps');
    });
  };

  // Nút chuyển hướng sang web đối tác đặt vé/phòng (UC07)
  const handleOpenBooking = async () => {
    if (!place?.bookingUrl) {
      Alert.alert('Thông báo', 'Địa điểm này hiện chưa hỗ trợ đặt vé trực tuyến');
      return;
    }
    await WebBrowser.openBrowserAsync(place.bookingUrl);
  };

  // Bật/tắt yêu thích (UC08)
  const handleToggleFavorite = async () => {
    if (!currentUser) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để lưu địa điểm yêu thích', [
        { text: 'Hủy' },
        { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    try {
      const res = await travelApi.toggleFavorite(currentUser.id, placeId);
      setIsFavorite(res.isFavorite);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật yêu thích');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.centerContainer}>
        <Text>Không tìm thấy dữ liệu địa điểm</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner ảnh chính */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: place.imageUrl }} style={styles.bannerImage} />
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.favButton, isFavorite && styles.favButtonActive]} 
            onPress={handleToggleFavorite}
          >
            <Text style={styles.favButtonText}>{isFavorite ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Tiêu đề & Địa chỉ */}
          <Text style={styles.title}>{place.name}</Text>
          <Text style={styles.address}>📍 {place.address}</Text>

          <View style={styles.badgeRow}>
            <Text style={styles.badge}>{place.provinceName}</Text>
            <Text style={styles.badge}>{place.categoryName}</Text>
            <Text style={styles.ratingBadge}>★ {place.ratingAvg.toFixed(1)} ({place.totalReviews} đánh giá)</Text>
          </View>

          {/* Widget Thời tiết thời gian thực */}
          {weather && (
            <View style={styles.weatherCard}>
              <View style={styles.weatherHeader}>
                <Image source={{ uri: weather.iconUrl }} style={styles.weatherIcon} />
                <View>
                  <Text style={styles.weatherTemp}>{weather.temperature}°C</Text>
                  <Text style={styles.weatherCond}>{weather.condition}</Text>
                </View>
              </View>
              <Text style={styles.weatherRecommend}>💡 {weather.recommendation}</Text>
            </View>
          )}

          {/* Giá vé tham khảo */}
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Giá vé tham khảo:</Text>
            <Text style={styles.priceValue}>
              {place.ticketPriceAvg > 0 
                ? `${Number(place.ticketPriceAvg).toLocaleString('vi-VN')} đ` 
                : 'Miễn phí'}
            </Text>
          </View>

          {/* Cẩm nang giới thiệu */}
          <Text style={styles.sectionTitle}>Giới thiệu điểm đến</Text>
          <Text style={styles.description}>{place.description}</Text>

          {/* Đánh giá cộng đồng */}
          <Text style={styles.sectionTitle}>Đánh giá ({reviews.length})</Text>
          {reviews.length === 0 ? (
            <Text style={styles.emptyReview}>Chưa có đánh giá nào cho địa điểm này</Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{rev.userFullname || rev.username}</Text>
                  <Text style={styles.reviewStar}>{'★'.repeat(rev.rating)}</Text>
                </View>
                <Text style={styles.reviewComment}>{rev.comment}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Thanh nút hành động cố định ở đáy màn hình */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.mapBtn} onPress={handleOpenGoogleMaps}>
          <Text style={styles.mapBtnText}>🗺️ Chỉ đường</Text>
        </TouchableOpacity>

        {place.bookingUrl && (
          <TouchableOpacity style={styles.bookingBtn} onPress={handleOpenBooking}>
            <Text style={styles.bookingBtnText}>🎟️ Đặt vé / phòng</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { position: 'relative', width: '100%', height: 260 },
  bannerImage: { width: '100%', height: '100%', backgroundColor: '#cbd5e1' },
  backButton: { position: 'absolute', top: 44, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginTop: -2 },
  favButton: { position: 'absolute', top: 44, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  favButtonActive: { backgroundColor: '#ef4444' },
  favButtonText: { color: '#ffffff', fontSize: 20 },
  content: { padding: 16, paddingBottom: 100 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  address: { fontSize: 14, color: '#64748b', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, color: '#334155' },
  ratingBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, color: '#b45309', fontWeight: 'bold' },
  weatherCard: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 12, padding: 12, marginBottom: 16 },
  weatherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  weatherIcon: { width: 44, height: 44 },
  weatherTemp: { fontSize: 18, fontWeight: 'bold', color: '#166534' },
  weatherCond: { fontSize: 13, color: '#15803d' },
  weatherRecommend: { fontSize: 13, color: '#166534', fontStyle: 'italic', lineHeight: 18 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9', marginBottom: 16 },
  priceLabel: { fontSize: 15, color: '#475569' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#059669' },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', marginTop: 12, marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 22, color: '#334155', marginBottom: 16 },
  emptyReview: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 },
  reviewItem: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewAuthor: { fontWeight: 'bold', fontSize: 13, color: '#1e293b' },
  reviewStar: { color: '#eab308', fontSize: 12 },
  reviewComment: { fontSize: 13, color: '#475569' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 70, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', paddingHorizontal: 16, alignItems: 'center', gap: 12 },
  mapBtn: { flex: 1, height: 46, backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  mapBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 15 },
  bookingBtn: { flex: 1.2, height: 46, backgroundColor: '#2563eb', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  bookingBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});