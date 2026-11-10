import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { travelApi } from '../api/travelApi';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '32498559750-0ioqcs2esc4v7jrjem3d67h4vf92s4q3.apps.googleusercontent.com';

// Địa chỉ callback đã đăng ký trong Google Cloud Console
const BACKEND_CALLBACK_URI = 'http://localhost:5128/api/Auth/google-callback';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
try {
  setLoading(true);

  // 1. Tạo đường dẫn Deep Link (Chỉ định chính xác scheme của Expo Go)
  const appReturnUrl = Linking.createURL('google-auth');
  const nonce = Math.random().toString(36).substring(2, 15);

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(BACKEND_CALLBACK_URI)}` +
    `&response_type=id_token` +
    `&scope=${encodeURIComponent('openid profile email')}` +
    `&nonce=${encodeURIComponent(nonce)}` +
    `&state=${encodeURIComponent(appReturnUrl)}` +
    `&prompt=select_account`;

  // 2. Mở trình duyệt và chờ trình duyệt chủ động đóng
  const result = await WebBrowser.openAuthSessionAsync(authUrl, appReturnUrl);

  // 3. Phân tích dữ liệu trả về sau khi ứng dụng mở lại thành công
  if (result.type === 'success' && result.url) {
    // Phân tích URL theo chuẩn Query Parameter
    const parsedUrl = Linking.parse(result.url);
    const idToken = parsedUrl.queryParams?.id_token;

    if (!idToken) {
      throw new Error('Đăng nhập thành công nhưng không tìm thấy dữ liệu định danh (Token).');
    }

    // 4. Gửi Token về Backend để hoàn tất đăng nhập
    const userData = await travelApi.loginWithGoogle(idToken);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    navigation.replace('Home');
  } else if (result.type === 'cancel') {
    console.log('Người dùng đã hủy đăng nhập');
  }
} catch (error) {
  Alert.alert('Đăng nhập thất bại', error.message || 'Không thể xác thực với Google');
} finally {
  setLoading(false);
}
};

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.title}>Đăng Nhập VietGuide</Text>
        <Text style={styles.subtitle}>
          Sử dụng tài khoản Google để đồng bộ sổ tay chuyến đi và đánh giá điểm đến
        </Text>

        <TouchableOpacity
          style={styles.googleBtn}
          activeOpacity={0.85}
          onPress={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#059669" />
          ) : (
            <>
              <View style={styles.googleIconBox}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Đăng nhập bằng Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => navigation.replace('Home')}
          disabled={loading}
        >
          <Text style={styles.guestText}>Bỏ qua, khám phá với tư cách Khách</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 14,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 26,
    paddingHorizontal: 16,
    gap: 12,
    elevation: 1,
  },
  googleIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  guestBtn: {
    marginTop: 20,
    paddingVertical: 6,
  },
  guestText: {
    color: '#64748b',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});