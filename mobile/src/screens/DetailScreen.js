import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
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

  // State cho Form gửi đánh giá
  const [userRating, setUserRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

      // 3. Kiểm tra xem user đã lưu địa điểm vào yêu thích chưa
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

  // Mở Google Maps chỉ đường theo tọa độ GPS
  const handleOpenGoogleMaps = () => {
    if (!place) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Lỗi', 'Không thể khởi chạy ứng dụng Google Maps');
    });
  };

  // Mở liên kết đặt vé / đặt phòng của đối tác
  const handleOpenBooking = async () => {
    if (!place?.bookingUrl) {
      Alert.alert('Thông báo', 'Địa điểm này hiện chưa mở bán vé trực tuyến');
      return;
    }
    await WebBrowser.openBrowserAsync(place.bookingUrl);
  };

  // Bật/tắt yêu thích (Toggle Favorite)
  const handleToggleFavorite = async () => {
    if (!currentUser) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để lưu địa điểm vào sổ tay yêu thích', [
        { text: 'Hủy' },
        { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    try {
      const res = await travelApi.toggleFavorite(currentUser.id, placeId);
      setIsFavorite(res.isFavorite);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật danh sách yêu thích');
    }
  };

  // Gửi đánh giá sao kèm nhận xét
  const handleSubmitReview = async () => {
    if (!currentUser) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập để gửi đánh giá', [
        { text: 'Hủy' },
        { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (!commentText.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập nội dung nhận xét của bạn');
      return;
    }

    try {
      setSubmittingReview(true);
      await travelApi.addReview(currentUser.id, placeId, userRating, commentText.trim());

      Alert.alert('Thành công', 'Cảm ơn bạn đã gửi đánh giá trải nghiệm!');
      setCommentText('');
      setUserRating(5);

      // Tải lại đánh giá và cập nhật lại điểm sao trung bình
      const [updatedReviews, updatedPlace] = await Promise.all([
        travelApi.getReviews(placeId),
        travelApi.getPlaceDetail(placeId),
      ]);
      setReviews(updatedReviews);
      setPlace(updatedPlace);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Đang tải chi tiết cẩm nang...</Text>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Không tìm thấy dữ liệu địa điểm</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner ảnh chính */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: place.imageUrl }} style={styles.bannerImage} />
          <View style={styles.imageOverlay} />

          {/* Nút quay lại */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Nút yêu thích */}
          <TouchableOpacity
            style={[styles.favButton, isFavorite && styles.favButtonActive]}
            onPress={handleToggleFavorite}
            activeOpacity={0.8}
          >
            <Text style={styles.favButtonText}>{isFavorite ? '♥' : '♡'}</Text>
          </TouchableOpacity>

          {/* Tiêu đề trên ảnh */}
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeRegion}>{place.provinceName}</Text>
              <Text style={styles.badgeCategory}>{place.categoryName}</Text>
            </View>
            <Text style={styles.title}>{place.name}</Text>
            <Text style={styles.address}>📍 {place.address}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Thông số đánh giá và giá vé */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Đánh giá chung</Text>
              <Text style={styles.statRating}>★ {place.ratingAvg?.toFixed(1) || '5.0'} <Text style={styles.statSub}>({place.totalReviews || reviews.length})</Text></Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Giá vé tham khảo</Text>
              <Text style={styles.statPrice}>
                {place.ticketPriceAvg > 0
                  ? `${Number(place.ticketPriceAvg).toLocaleString('vi-VN')} đ`
                  : 'Miễn phí'}
              </Text>
            </View>
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

          {/* Giới thiệu chi tiết */}
          <Text style={styles.sectionTitle}>Giới thiệu điểm đến</Text>
          <Text style={styles.description}>{place.description}</Text>

          {/* Phần Đánh giá cộng đồng */}
          <View style={styles.reviewSectionHeader}>
            <Text style={styles.sectionTitle}>Đánh giá & Nhận xét ({reviews.length})</Text>
          </View>

          {reviews.length === 0 ? (
            <Text style={styles.emptyReview}>Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận!</Text>
          ) : (
            reviews.map((rev) => (
              <View key={rev.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{rev.userFullname || rev.username}</Text>
                  <Text style={styles.reviewStar}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</Text>
                </View>
                <Text style={styles.reviewComment}>{rev.comment}</Text>
              </View>
            ))
          )}

          {/* Khung gửi đánh giá mới */}
          <View style={styles.addReviewCard}>
            <Text style={styles.addReviewTitle}>Chia sẻ trải nghiệm của bạn</Text>

            {/* Chọn số sao tương tác */}
            <View style={styles.starSelectorRow}>
              <Text style={styles.starSelectorLabel}>Chạm để chấm điểm:</Text>
              <View style={styles.starsWrapper}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                    <Text style={[styles.starBtn, star <= userRating ? styles.starSelected : styles.starUnselected]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Cảm nhận về cảnh quan, dịch vụ, con người nơi đây..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
              numberOfLines={3}
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={[styles.submitReviewBtn, submittingReview && styles.submitReviewBtnDisabled]}
              onPress={handleSubmitReview}
              disabled={submittingReview}
            >
              {submittingReview ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitReviewText}>Gửi Đánh Giá Ngay</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Thanh nút công cụ cố định đáy màn hình */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.mapBtn} onPress={handleOpenGoogleMaps} activeOpacity={0.8}>
          <Text style={styles.mapBtnText}>🗺️ Chỉ đường</Text>
        </TouchableOpacity>

        {place.bookingUrl && (
          <TouchableOpacity style={styles.bookingBtn} onPress={handleOpenBooking} activeOpacity={0.8}>
            <Text style={styles.bookingBtnText}>🎟️ Đặt vé / phòng</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b' },
  emptyText: { fontSize: 15, color: '#94a3b8' },

  imageContainer: { position: 'relative', width: '100%', height: 300, backgroundColor: '#0f172a' },
  bannerImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },

  backButton: { position: 'absolute', top: 44, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  backButtonText: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginTop: -2 },
  favButton: { position: 'absolute', top: 44, right: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  favButtonActive: { backgroundColor: '#ef4444' },
  favButtonText: { color: '#ffffff', fontSize: 22 },

  headerInfo: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badgeRegion: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  badgeCategory: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: '600', color: '#ffffff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  address: { fontSize: 13, color: '#e2e8f0' },

  content: { padding: 16, paddingBottom: 110 },
  statsCard: { flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginVertical: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#cbd5e1' },
  statLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  statRating: { fontSize: 17, fontWeight: 'bold', color: '#b45309' },
  statSub: { fontSize: 12, fontWeight: 'normal', color: '#94a3b8' },
  statPrice: { fontSize: 17, fontWeight: 'bold', color: '#059669' },

  weatherCard: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 16, padding: 14, marginBottom: 16 },
  weatherHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  weatherIcon: { width: 46, height: 46, marginRight: 8 },
  weatherTemp: { fontSize: 19, fontWeight: 'bold', color: '#065f46' },
  weatherCond: { fontSize: 13, color: '#047857' },
  weatherRecommend: { fontSize: 13, color: '#065f46', lineHeight: 18, fontStyle: 'italic', marginTop: 4 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginTop: 14, marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 22, color: '#334155', marginBottom: 16 },

  reviewSectionHeader: { marginTop: 10, marginBottom: 6 },
  emptyReview: { fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 },
  reviewItem: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9' },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewAuthor: { fontWeight: 'bold', fontSize: 13, color: '#0f172a' },
  reviewStar: { color: '#f59e0b', fontSize: 13 },
  reviewComment: { fontSize: 13, color: '#475569', lineHeight: 18 },

  addReviewCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 12 },
  addReviewTitle: { fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginBottom: 10 },
  starSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  starSelectorLabel: { fontSize: 13, color: '#64748b' },
  starsWrapper: { flexDirection: 'row', gap: 6 },
  starBtn: { fontSize: 26 },
  starSelected: { color: '#f59e0b' },
  starUnselected: { color: '#cbd5e1' },
  reviewInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 13, color: '#0f172a', minHeight: 70, textAlignVertical: 'top', marginBottom: 12 },
  submitReviewBtn: { backgroundColor: '#059669', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  submitReviewBtnDisabled: { backgroundColor: '#94a3b8' },
  submitReviewText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 74, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', paddingHorizontal: 16, alignItems: 'center', gap: 12 },
  mapBtn: { flex: 1, height: 48, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mapBtnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 15 },
  bookingBtn: { flex: 1.2, height: 48, backgroundColor: '#059669', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  bookingBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});