import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 状态
  const isDark = ref(localStorage.getItem('theme') === 'dark' || false)

  // CSS 变量映射
  const lightTheme = {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#333333',
    textSecondary: '#666666',
    border: '#e0e0e0',
  }

  const darkTheme = {
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#0dcaf0',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    border: '#404040',
  }

  // 方法：切换主题
  function toggleTheme() {
    isDark.value = !isDark.value
    applyTheme()
  }

  // 方法：设置主题
  function setTheme(dark) {
    isDark.value = dark
    applyTheme()
  }

  // 方法：应用主题
  function applyTheme() {
    const theme = isDark.value ? darkTheme : lightTheme
    const root = document.documentElement

    // 设置 CSS 变量
    Object.entries(theme).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    // 保存偏好
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')

    // 应用到 body
    if (isDark.value) {
      document.body.classList.add('dark-theme')
      document.body.classList.remove('light-theme')
    } else {
      document.body.classList.add('light-theme')
      document.body.classList.remove('dark-theme')
    }
  }

  // 初始化主题
  function initTheme() {
    applyTheme()
  }

  return {
    isDark,
    lightTheme,
    darkTheme,
    toggleTheme,
    setTheme,
    applyTheme,
    initTheme,
  }
})
