import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { travelApi } from '../api/travelApi';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '32498559750-0ioqcs2esc4v7jrjem3d67h4vf92s4q3.apps.googleusercontent.com';

const BACKEND_CALLBACK_URI = 'http://localhost:5128/api/Auth/google-callback';

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      // 1. Tạo mã phiên duy nhất và đường dẫn Deep Link chuẩn của Expo Go (exp://...)
      const sessionId = `vg_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const appReturnUrl = Linking.createURL('google-auth');
      const stateParam = `${sessionId}|${appReturnUrl}`;
      const nonce = Math.random().toString(36).substring(2, 15);

      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth` +
        `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(BACKEND_CALLBACK_URI)}` +
        `&response_type=id_token` +
        `&scope=${encodeURIComponent('openid profile email')}` +
        `&nonce=${encodeURIComponent(nonce)}` +
        `&state=${encodeURIComponent(stateParam)}` +
        `&prompt=select_account`;

      // 2. Mở trình duyệt xác thực Google OAuth
      await WebBrowser.openAuthSessionAsync(authUrl, appReturnUrl);

      // 3. Lấy thông tin User đã được Backend xác thực thông qua sessionId
      const userData = await travelApi.getGoogleSession(sessionId);
      if (userData && userData.email) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        navigation.replace('Home');
      }
    } catch (error) {
      if (!error.message?.includes('Phiên đăng nhập chưa hoàn tất')) {
        Alert.alert('Đăng nhập thất bại', error.message || 'Không thể xác thực với Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" translucent={true} />

      <View style={styles.card}>
        {/* Logo VietGuide */}
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.title}>Đăng Nhập VietGuide</Text>
        <Text style={styles.subtitle}>
          Sử dụng tài khoản Google để đồng bộ sổ tay chuyến đi và đánh giá điểm đến
        </Text>

        {/* Nút đăng nhập Google với logo chữ G 4 màu chính hãng */}
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
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleLogo}
                resizeMode="contain"
              />
              <Text style={styles.googleBtnText}>Đăng nhập bằng Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Nút vào xem nhanh ở chế độ Khách */}
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => navigation.replace('Home')}
          disabled={loading}
          activeOpacity={0.7}
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
    backgroundColor: '#f8fafc',
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
    borderColor: '#e2e8f0',
    borderRadius: 26,
    paddingHorizontal: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  googleLogo: {
    width: 22,
    height: 22,
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