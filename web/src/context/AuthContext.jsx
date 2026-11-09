import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Hàm đăng nhập phát tín hiệu tức thì toàn app
  const login = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Hàm đăng xuất làm sạch phiên làm việc
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  // Kiểm tra tên miền email trường DNTU (nhận diện cả @dntu.edu.vn và các subdomain như @st.dntu.edu.vn)
  const userEmail = currentUser?.email?.toLowerCase().trim() || '';
  const isDntuEmail =
    userEmail.endsWith('@dntu.edu.vn') || userEmail.endsWith('.dntu.edu.vn');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        // Chỉ duy nhất tài khoản có role Admin hoặc có email đuôi dntu.edu.vn mới được xem là Admin
        isAdmin: currentUser?.role === 'Admin' || isDntuEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}