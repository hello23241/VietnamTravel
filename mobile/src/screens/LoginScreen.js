import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { travelApi } from '../api/travelApi';

export default function LoginScreen({ navigation }) {
  const [isRegister, setIsRegister] = useState(false);
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim() || (isRegister && !fullname.trim())) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ các thông tin yêu cầu');
      return;
    }

    if (isRegister && username.trim().length < 4) {
      Alert.alert('Thông báo', 'Tên đăng nhập phải có ít nhất 4 ký tự');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setLoading(true);
      if (isRegister) {
        const newUser = await travelApi.register(username.trim(), password, fullname.trim());
        Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
        await AsyncStorage.setItem('user', JSON.stringify(newUser));
        navigation.replace('Home');
      } else {
        const userData = await travelApi.login(username.trim(), password);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        navigation.replace('Home');
      }
    } catch (error) {
      Alert.alert(isRegister ? 'Đăng ký thất bại' : 'Đăng nhập thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brandTitle}>VietGuide</Text>
          <Text style={styles.subtitle}>Cẩm Nang Hướng Dẫn Du Lịch Việt Nam</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, !isRegister && styles.tabBtnActive]}
              onPress={() => setIsRegister(false)}
            >
              <Text style={[styles.tabText, !isRegister && styles.tabTextActive]}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, isRegister && styles.tabBtnActive]}
              onPress={() => setIsRegister(true)}
            >
              <Text style={[styles.tabText, isRegister && styles.tabTextActive]}>Đăng ký mới</Text>
            </TouchableOpacity>
          </View>

          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Phạm Văn Hiếu"
                value={fullname}
                onChangeText={setFullname}
                placeholderTextColor="#94a3b8"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên đăng nhập (từ 4 ký tự)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: HDKiet"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu (từ 6 ký tự)</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Nhập mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.6}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>{isRegister ? 'Tạo Tài Khoản' : 'Đăng Nhập'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => navigation.replace('Home')}
          >
            <Text style={styles.guestText}>Bỏ qua, khám phá với tư cách Khách</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 28 },
  brandTitle: { fontSize: 32, fontWeight: '800', color: '#059669', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  formCard: { backgroundColor: '#ffffff', padding: 22, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#059669', fontWeight: '700' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },

  passwordWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#f8fafc' },
  passwordInput: { flex: 1, paddingHorizontal: 14, height: 46, fontSize: 14, color: '#0f172a' },
  eyeBtn: { paddingHorizontal: 14, height: 46, justifyContent: 'center', alignItems: 'center' },

  submitBtn: { backgroundColor: '#059669', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitBtnDisabled: { backgroundColor: '#94a3b8' },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  guestBtn: { marginTop: 16, alignItems: 'center' },
  guestText: { color: '#64748b', fontSize: 13, textDecorationLine: 'underline' },
});