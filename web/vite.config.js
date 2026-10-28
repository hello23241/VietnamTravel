import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: false, // Ngăn quét ổ đĩa liên tục gây xung đột reload
    },
    hmr: {
      overlay: true, // Hiển thị thông báo lỗi rõ ràng nếu có lỗi biên dịch
    },
  },
})