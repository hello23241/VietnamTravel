import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { travelApi } from '../api/travelApi';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    try {
      setLoading(true);
      const userData = await travelApi.login(username.trim(), password);
      
      // Lưu thông tin người dùng vào bộ nhớ máy
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Chuyển sang màn hình chính
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Đăng nhập thất bại', error.message || 'Sai tên đăng nhập hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cẩm Nang Du Lịch</Text>
      <Text style={styles.subtitle}>Khám phá vẻ đẹp Việt Nam</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Tên đăng nhập</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: kietho"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.guestButton} 
          onPress={() => navigation.replace('Home')}
        >
          <Text style={styles.guestText}>Bỏ qua, khám phá với tư cách Khách</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0f172a', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 4, marginBottom: 32 },
  form: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 15 },
  button: { backgroundColor: '#2563eb', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  guestButton: { marginTop: 16, alignItems: 'center' },
  guestText: { color: '#64748b', fontSize: 14, textDecorationLine: 'underline' },
});