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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { travelApi } from '../api/travelApi';

export default function DetailScreen({ route, navigation }) {
  const { placeId } = route.params;
  const insets = useSafeAreaInsets();
  const topSafeArea = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? StatusBar.currentHeight || 28 : 20);
  const bottomSafeArea = insets.bottom > 0 ? insets.bottom : 12;

  const [place, setPlace] = useState(null);
  const [weather, setWeather] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Form gửi đánh giá
  const [userRating, setUserRating] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [placeId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const userStr = await AsyncStorage.getItem('user');
      let user = null;
      if (userStr) {
        user = JSON.parse(userStr);
        setCurrentUser(user);
      }

      const [placeData, weatherData, reviewsData] = await Promise.all([
        travelApi.getPlaceDetail(placeId),
        travelApi.getPlaceWeather(placeId).catch(() => null),
        travelApi.getReviews(placeId).catch(() => []),
      ]);

      setPlace(placeData);
      setWeather(weatherData);
      setReviews(reviewsData || []);

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

  const handleOpenGoogleMaps = () => {
    if (!place) return;
    const searchQuery = encodeURIComponent(`${place.name}, ${place.address || place.provinceName}`);
    const url = `https://www.google.com/maps/search/${searchQuery}/@${place.latitude},${place.longitude},16z`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Lỗi', 'Không thể khởi chạy ứng dụng Google Maps');
    });
  };

  const handleOpenBooking = async () => {
    if (!place?.bookingUrl) {
      Alert.alert('Thông báo', 'Địa điểm này hiện chưa mở bán vé trực tuyến');
      return;
    }
    await WebBrowser.openBrowserAsync(place.bookingUrl);
  };

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

      const [updatedReviews, updatedPlace] = await Promise.all([
        travelApi.getReviews(placeId),
        travelApi.getPlaceDetail(placeId),
      ]);
      setReviews(updatedReviews || []);
      setPlace(updatedPlace);
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi đánh giá');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Đặc sản ẩm thực tương thích theo tỉnh thành như bản Web
  const getLocalFoods = (prov, reg) => {
    const p = (prov || '').toLowerCase();
    if (p.includes('hà nội')) {
      return [
        { name: 'Phở Bò Gia Truyền', desc: 'Nước dùng ninh xương đậm đà, thơm thảo mộc quế hồi đặc trưng thủ đô.' },
        { name: 'Cà Phê Trứng Giảng', desc: 'Vị béo ngậy của kem trứng bông xốp hòa quyện cà phê đậm đà phố cổ.' },
        { name: 'Bún Chả Nem Rán', desc: 'Chả nướng than hoa thơm lừng chấm cùng nước mắm chua ngọt và rau sống.' },
      ];
    } else if (p.includes('đà lạt') || p.includes('lâm đồng')) {
      return [
        { name: 'Bánh Tráng Nướng Cầu Đất', desc: 'Được mệnh danh là "Pizza Việt Nam" giòn rụm với trứng, tép và bò khô.' },
        { name: 'Lẩu Gà Lá É Ép Gai', desc: 'Vị the the thơm nồng đặc trưng của lá é hòa cùng nước luộc gà ngọt thanh.' },
        { name: 'Sữa Đậu Nành Chợ Đêm', desc: 'Thức quà ấm nóng giữa khí trời se lạnh về đêm ở xứ ngàn hoa.' },
      ];
    } else if (p.includes('đà nẵng') || p.includes('quảng nam')) {
      return [
        { name: 'Mì Quảng Ếch & Tôm Thịt', desc: 'Sợi mì vàng óng ăn kèm nước nhưn đậm đà, bánh tráng nướng giòn tan.' },
        { name: 'Bánh Tráng Cuốn Thịt Heo', desc: 'Thịt ba chỉ hai đầu da cuốn ghém rau rừng chấm mắm nêm thơm nức.' },
      ];
    } else if (p.includes('quảng ninh') || p.includes('hạ long')) {
      return [
        { name: 'Chả Mực Giã Tay Hạ Long', desc: 'Đặc sản trứ danh giòn sần sật, thơm ngọt đậm đà hương vị biển cả.' },
        { name: 'Bún Cù Kỳ & Hải Sản', desc: 'Nước dùng chua thanh đậm vị gạch và thịt cù kỳ tươi ngon độc đáo.' },
      ];
    } else if (p.includes('hà giang')) {
      return [
        { name: 'Thắng Cố Chợ Phiên', desc: 'Món ăn truyền thống đậm đà của đồng bào vùng cao bên chén rượu ngô ấm lòng.' },
        { name: 'Bánh Tam Giác Mạch', desc: 'Bánh nướng bùi bùi thơm ngát hương hoa vùng cao nguyên đá.' },
      ];
    } else if (p.includes('hồ chí minh') || p.includes('sài gòn')) {
      return [
        { name: 'Cơm Tấm Sườn Bì Chả', desc: 'Hạt tấm thơm dẻo cùng sườn nướng mỡ hành đậm vị đất phương Nam.' },
        { name: 'Hủ Tiếu Nam Vang', desc: 'Nước lèo thanh ngọt với tôm tươi, gan heo và tóp mỡ giòn rụm.' },
      ];
    }
    return [
      { name: 'Đặc sản ẩm thực địa phương', desc: 'Thưởng thức các món ngon truyền thống tại các quán ăn gia truyền xung quanh.' },
      { name: 'Chè và thức uống giải nhiệt', desc: 'Trải nghiệm phong vị giải khát đường phố bản địa tươi mát.' },
    ];
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Đang chuẩn bị cẩm nang điểm đến...</Text>
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

  const localFoods = getLocalFoods(place.provinceName, place.region);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomSafeArea + 80 }}>
        {/* 1. Grand Hero Banner tràn viền */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: place.imageUrl }} style={styles.bannerImage} />
          <View style={styles.imageOverlay} />

          {/* Nút quay lại tự động hạ qua thanh trạng thái */}
          <TouchableOpacity
            style={[styles.floatingCircleBtn, { top: topSafeArea + 10, left: 16 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingBtnIcon}>←</Text>
          </TouchableOpacity>

          {/* Nút yêu thích tự động hạ qua thanh trạng thái */}
          <TouchableOpacity
            style={[styles.floatingCircleBtn, isFavorite && styles.favButtonActive, { top: topSafeArea + 10, right: 16 }]}
            onPress={handleToggleFavorite}
            activeOpacity={0.8}
          >
            <Text style={[styles.floatingBtnIcon, isFavorite ? styles.favIconActive : styles.favIconInactive]}>
              {isFavorite ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>

          {/* Thông tin trên Banner */}
          <View style={styles.headerInfo}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeRegion}>{place.provinceName || place.region}</Text>
              <Text style={styles.badgeCategory}>{place.categoryName}</Text>
              <Text style={styles.badgeStar}>★ {place.ratingAvg?.toFixed(1) || '5.0'}</Text>
            </View>
            <Text style={styles.title}>{place.name}</Text>
            <Text style={styles.address}>📍 {place.address}</Text>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* 2. Thẻ Đánh giá & Chi phí vé tham quan */}
          <View style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>ĐÁNH GIÁ CỘNG ĐỒNG</Text>
              <Text style={styles.statRating}>
                ★ {place.ratingAvg?.toFixed(1) || '5.0'}{' '}
                <Text style={styles.statSub}>({place.totalReviews || reviews.length} lượt)</Text>
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>CHI PHÍ THAM QUAN</Text>
              <Text style={styles.statPrice}>
                {place.ticketPriceAvg > 0
                  ? `${Number(place.ticketPriceAvg).toLocaleString('vi-VN')} đ`
                  : 'Miễn phí vé vào'}
              </Text>
            </View>
          </View>

          {/* 3. Bốn thông số bỏ túi nhanh (Quick Specs) */}
          <View style={styles.specsGrid}>
            <View style={styles.specItem}>
              <View style={[styles.specIconBox, { backgroundColor: '#ecfdf5' }]}>
                <Text style={styles.specEmoji}>⏱️</Text>
              </View>
              <View>
                <Text style={styles.specLabel}>Thời lượng</Text>
                <Text style={styles.specValue}>2 - 4 tiếng</Text>
              </View>
            </View>

            <View style={styles.specItem}>
              <View style={[styles.specIconBox, { backgroundColor: '#f0fdfa' }]}>
                <Text style={styles.specEmoji}>☀️</Text>
              </View>
              <View>
                <Text style={styles.specLabel}>Mùa lý tưởng</Text>
                <Text style={styles.specValue}>Mùa khô ráo</Text>
              </View>
            </View>

            <View style={styles.specItem}>
              <View style={[styles.specIconBox, { backgroundColor: '#fffbeb' }]}>
                <Text style={styles.specEmoji}>🛵</Text>
              </View>
              <View>
                <Text style={styles.specLabel}>Phương tiện</Text>
                <Text style={styles.specValue}>Xe máy, Ô tô</Text>
              </View>
            </View>

            <View style={styles.specItem}>
              <View style={[styles.specIconBox, { backgroundColor: '#eef2ff' }]}>
                <Text style={styles.specEmoji}>👕</Text>
              </View>
              <View>
                <Text style={styles.specLabel}>Trang phục</Text>
                <Text style={styles.specValue}>Thoải mái</Text>
              </View>
            </View>
          </View>

          {/* 4. Trạm Khí Tượng Thời Tiết Trực Tiếp */}
          {weather && (
            <View style={styles.weatherCard}>
              <View style={styles.weatherTopRow}>
                <View style={styles.weatherTag}>
                  <Text style={styles.weatherTagText}>📡 Trạm Khí Tượng Live</Text>
                </View>
                <Text style={styles.weatherSource}>OpenWeather</Text>
              </View>

              <View style={styles.weatherMain}>
                <Image source={{ uri: weather.iconUrl }} style={styles.weatherIcon} />
                <View>
                  <Text style={styles.weatherTemp}>{Math.round(weather.temperature)}°C</Text>
                  <Text style={styles.weatherCond}>{weather.condition}</Text>
                </View>
              </View>

              <View style={styles.weatherDetails}>
                <Text style={styles.weatherSubText}>💧 Độ ẩm: <Text style={styles.boldText}>{weather.humidity}%</Text></Text>
                <Text style={styles.weatherSubText}>💨 Gió: <Text style={styles.boldText}>{weather.windSpeed ?? 3.2} m/s</Text></Text>
              </View>

              {weather.recommendation ? (
                <Text style={styles.weatherRecommend}>💡 {weather.recommendation}</Text>
              ) : null}
            </View>
          )}

          {/* 5. Giới thiệu chi tiết & Điểm nhấn */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderIcon}>ℹ️</Text>
              <Text style={styles.sectionTitle}>Giới thiệu & Cảm hứng điểm đến</Text>
            </View>

            <Text style={styles.description}>
              {place.description ||
                `Khám phá vẻ đẹp kỳ thú tại ${place.name}, một trong những điểm đến tiêu biểu tại ${place.address}.`}
            </Text>

            <Text style={styles.subTitle}>Điểm nhấn không thể bỏ lỡ:</Text>
            <View style={styles.tagWrap}>
              <View style={[styles.highlightTag, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
                <Text style={[styles.highlightTagText, { color: '#047857' }]}>📸 Góc chụp ảnh triệu view</Text>
              </View>
              <View style={[styles.highlightTag, { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' }]}>
                <Text style={[styles.highlightTagText, { color: '#0f766e' }]}>🌿 Không gian thoáng đãng</Text>
              </View>
              <View style={[styles.highlightTag, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                <Text style={[styles.highlightTagText, { color: '#b45309' }]}>👨‍👩‍👦 Phù hợp gia đình & bạn bè</Text>
              </View>
            </View>
          </View>

          {/* 6. Gợi ý Lịch trình trải nghiệm (Itinerary 3 buổi) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderIcon}>🗓️</Text>
              <View>
                <Text style={styles.sectionTitle}>Gợi ý lịch trình trải nghiệm</Text>
                <Text style={styles.sectionSub}>Tối ưu thời gian cho chuyến đi trọn vẹn</Text>
              </View>
            </View>

            <View style={styles.timelineList}>
              <View style={styles.timelineItem}>
                <View style={[styles.timeBadge, { backgroundColor: '#059669' }]}>
                  <Text style={styles.timeBadgeText}>SÁNG</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>🌅 Đón bình minh & Check-in sớm</Text>
                  <Text style={styles.timelineDesc}>
                    Có mặt từ 7h00 - 8h30 sáng khi thời tiết mát mẻ và ánh sáng tự nhiên dịu nhất để chụp ảnh lưu niệm.
                  </Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={[styles.timeBadge, { backgroundColor: '#0d9488' }]}>
                  <Text style={styles.timeBadgeText}>CHIỀU</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>🌇 Thưởng lãm cảnh quan & Hoàng hôn</Text>
                  <Text style={styles.timelineDesc}>
                    Dành thời gian tìm hiểu nét văn hóa, ngắm nhìn ánh hoàng hôn buông xuống phủ ánh vàng lên toàn bộ cảnh sắc.
                  </Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={[styles.timeBadge, { backgroundColor: '#1e293b' }]}>
                  <Text style={styles.timeBadgeText}>TỐI</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>🌃 Thư giãn & Trải nghiệm ẩm thực đêm</Text>
                  <Text style={styles.timelineDesc}>
                    Thưởng thức món ngon đường phố ấm nóng gần điểm đến và dạo bước ngắm phố phường lên đèn.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 7. Khám phá Ẩm thực & Đặc sản lân cận */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderIcon}>🍲</Text>
              <View>
                <Text style={styles.sectionTitle}>Món ngon & Ẩm thực địa phương</Text>
                <Text style={styles.sectionSub}>Những phong vị đặc trưng tại {place.provinceName}</Text>
              </View>
            </View>

            <View style={styles.foodList}>
              {localFoods.map((f, idx) => (
                <View key={idx} style={styles.foodCard}>
                  <Text style={styles.foodName}>🍴 {f.name}</Text>
                  <Text style={styles.foodDesc}>{f.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 8. Mẹo du lịch bỏ túi */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderIcon}>💡</Text>
              <Text style={styles.sectionTitle}>Mẹo du lịch hữu ích bỏ túi</Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                <Text style={styles.boldText}>Chuẩn bị sẵn tiền mặt: </Text>Một số điểm gửi xe hoặc quầy lưu niệm truyền thống có thể không hỗ trợ quét mã QR chuyển khoản.
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                <Text style={styles.boldText}>Bảo vệ môi trường: </Text>Bỏ rác đúng nơi quy định để giữ gìn cảnh quan du lịch Việt Nam luôn sạch đẹp.
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                <Text style={styles.boldText}>Bảo quản tư trang: </Text>Luôn chú ý đến túi ví, điện thoại và máy ảnh khi ở những khu vực tập trung đông người.
              </Text>
            </View>
          </View>

          {/* 9. Đánh giá cộng đồng & Form gửi nhận xét */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderIcon}>💬</Text>
              <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>Đánh giá du khách ({reviews.length})</Text>
                <Text style={styles.reviewScoreBadge}>★ {place.ratingAvg?.toFixed(1) || '5.0'}</Text>
              </View>
            </View>

            {/* Form gửi đánh giá */}
            <View style={styles.addReviewCard}>
              <Text style={styles.addReviewTitle}>Chia sẻ trải nghiệm của bạn</Text>

              <View style={styles.starRow}>
                <Text style={styles.starRowLabel}>Chấm điểm sao:</Text>
                <View style={styles.starsBox}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setUserRating(star)} activeOpacity={0.7}>
                      <Text style={[styles.starBtn, star <= userRating ? styles.starGold : styles.starGray]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.starRatingVal}>{userRating}/5</Text>
              </View>

              <TextInput
                style={styles.reviewInput}
                placeholder={currentUser ? "Cảm nhận về cảnh quan, ẩm thực, con người nơi đây..." : "Vui lòng đăng nhập để gửi nhận xét..."}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={3}
                placeholderTextColor="#94a3b8"
                editable={!!currentUser}
              />

              <TouchableOpacity
                style={[styles.submitReviewBtn, (!currentUser || submittingReview) && styles.submitReviewBtnDisabled]}
                onPress={handleSubmitReview}
                disabled={!currentUser || submittingReview}
                activeOpacity={0.8}
              >
                {submittingReview ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitReviewText}>
                    {currentUser ? 'Gửi Đánh Giá Ngay' : 'Đăng Nhập Để Gửi Đánh Giá'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Danh sách bình luận */}
            {reviews.length === 0 ? (
              <Text style={styles.emptyReview}>Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận!</Text>
            ) : (
              reviews.map((rev) => (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewUserRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarLetter}>
                        {(rev.userFullname || rev.userEmail || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewUserName}>{rev.userFullname || rev.userEmail}</Text>
                      <Text style={styles.reviewStars}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reviewComment}>{rev.comment}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* 10. Thanh công cụ cố định đáy (Bottom Action Bar) */}
      <View style={[styles.bottomBar, { paddingBottom: bottomSafeArea, height: 60 + bottomSafeArea }]}>
        <TouchableOpacity style={styles.mapBtn} onPress={handleOpenGoogleMaps} activeOpacity={0.8}>
          <Text style={styles.mapBtnText}>🗺️ Chỉ đường Maps</Text>
        </TouchableOpacity>

        {place.bookingUrl ? (
          <TouchableOpacity style={styles.bookingBtn} onPress={handleOpenBooking} activeOpacity={0.8}>
            <Text style={styles.bookingBtnText}>🎟️ Đặt vé / phòng</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748b', fontWeight: '500' },
  emptyText: { fontSize: 15, color: '#94a3b8' },

  /* 1. Grand Hero Banner */
  imageContainer: { position: 'relative', width: '100%', height: 350, backgroundColor: '#0f172a' },
  bannerImage: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.45)' },

  floatingCircleBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  floatingBtnIcon: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  favButtonActive: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  favIconActive: { color: '#ffffff' },
  favIconInactive: { color: '#ffffff' },

  headerInfo: { position: 'absolute', bottom: 18, left: 16, right: 16 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'center' },
  badgeRegion: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  badgeCategory: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: '600', color: '#ffffff' },
  badgeStar: { backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  title: { fontSize: 25, fontWeight: '900', color: '#ffffff', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  address: { fontSize: 13, color: '#e2e8f0' },

  /* Body */
  bodyContent: { padding: 14, gap: 12 },

  /* Stats Card */
  statsCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6 },
  statCol: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#f1f5f9' },
  statLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '800', letterSpacing: 0.5, marginBottom: 4 },
  statRating: { fontSize: 16, fontWeight: '800', color: '#d97706' },
  statSub: { fontSize: 11, fontWeight: 'normal', color: '#94a3b8' },
  statPrice: { fontSize: 16, fontWeight: '800', color: '#059669' },

  /* Quick Specs */
  specsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specItem: { flex: 1, minWidth: '47%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
  specIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  specEmoji: { fontSize: 17 },
  specLabel: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' },
  specValue: { fontSize: 12, fontWeight: '800', color: '#1e293b', marginTop: 1 },

  /* Weather Widget */
  weatherCard: { backgroundColor: '#0f766e', borderRadius: 20, padding: 16, elevation: 3, shadowColor: '#0f766e', shadowOpacity: 0.2, shadowRadius: 8 },
  weatherTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  weatherTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  weatherTagText: { fontSize: 11, fontWeight: '800', color: '#ffffff' },
  weatherSource: { fontSize: 11, color: '#99f6e4', fontWeight: '600' },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherIcon: { width: 50, height: 50 },
  weatherTemp: { fontSize: 32, fontWeight: '900', color: '#ffffff' },
  weatherCond: { fontSize: 13, color: '#ccfbf1', fontWeight: '600' },
  weatherDetails: { flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)' },
  weatherSubText: { fontSize: 12, color: '#e0f2fe' },
  weatherRecommend: { fontSize: 12, color: '#ffffff', fontStyle: 'italic', marginTop: 10, lineHeight: 18, backgroundColor: 'rgba(0,0,0,0.15)', padding: 10, borderRadius: 12 },

  /* Section Cards */
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionHeaderIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sectionSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  subTitle: { fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginTop: 12, marginBottom: 6 },
  description: { fontSize: 13, lineHeight: 22, color: '#334155' },
  boldText: { fontWeight: '700', color: '#0f172a' },

  /* Highlight Tags */
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  highlightTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  highlightTagText: { fontSize: 11, fontWeight: '700' },

  /* Timeline */
  timelineList: { gap: 10 },
  timelineItem: { flexDirection: 'row', gap: 12, backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  timeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, height: 24, justifyContent: 'center' },
  timeBadgeText: { fontSize: 10, fontWeight: '900', color: '#ffffff' },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  timelineDesc: { fontSize: 12, color: '#64748b', lineHeight: 18, marginTop: 2 },

  /* Food */
  foodList: { gap: 8 },
  foodCard: { backgroundColor: '#fffbeb', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#fef3c7' },
  foodName: { fontSize: 13, fontWeight: '800', color: '#92400e', marginBottom: 2 },
  foodDesc: { fontSize: 12, color: '#78350f', lineHeight: 18 },

  /* Tips */
  tipItem: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tipBullet: { fontSize: 14, color: '#059669', fontWeight: 'bold' },
  tipText: { flex: 1, fontSize: 12, color: '#475569', lineHeight: 18 },

  /* Reviews */
  reviewScoreBadge: { fontSize: 13, fontWeight: '800', color: '#d97706', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  addReviewCard: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14 },
  addReviewTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  starRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  starRowLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  starsBox: { flexDirection: 'row', gap: 4 },
  starBtn: { fontSize: 24 },
  starGold: { color: '#f59e0b' },
  starGray: { color: '#cbd5e1' },
  starRatingVal: { fontSize: 12, fontWeight: '800', color: '#d97706' },
  reviewInput: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, padding: 12, fontSize: 12, color: '#0f172a', backgroundColor: '#ffffff', minHeight: 70, textAlignVertical: 'top', marginBottom: 10 },
  submitReviewBtn: { backgroundColor: '#059669', paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
  submitReviewBtnDisabled: { backgroundColor: '#94a3b8' },
  submitReviewText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  emptyReview: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 },
  reviewCard: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  reviewUserRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  avatarCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  reviewUserName: { fontSize: 12, fontWeight: '800', color: '#0f172a' },
  reviewStars: { fontSize: 12, color: '#f59e0b', marginTop: 1 },
  reviewComment: { fontSize: 12, color: '#475569', lineHeight: 18, marginLeft: 40 },

  /* Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
    gap: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  mapBtn: { flex: 1, height: 44, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  mapBtnText: { color: '#0f172a', fontWeight: '800', fontSize: 13 },
  bookingBtn: { flex: 1.2, height: 44, backgroundColor: '#059669', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  bookingBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
});