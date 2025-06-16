<template>
  <div class="world-selector-page">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="floating-orb orb-1"></div>
      <div class="floating-orb orb-2"></div>
      <div class="floating-orb orb-3"></div>
    </div>

    <!-- 主要内容 -->
    <div class="main-container">
      <!-- 语言切换按钮 -->
      <div class="language-switcher">
        <button @click="toggleLanguage" class="lang-btn">
          {{ t('worldSelector.language') }}: {{ currentLanguageLabel }}
        </button>
      </div>

      <!-- 应用标题 -->
      <div class="app-header">
        <h1 class="app-title">{{ t('worldSelector.appTitle') }}</h1>
        <p class="app-subtitle">{{ t('worldSelector.subtitle') }}</p>
      </div>

      <!-- 世界选择卡片 -->
      <div class="world-selector-card">
        <!-- 选择现有世界 -->
        <div v-if="existingWorlds.length > 0" class="world-section">
          <h3 class="section-title">
            <span class="section-icon">🌍</span>
            {{ t('worldSelector.selectWorld') }}
          </h3>
          <div class="world-select-container">
            <select v-model="selectedWorldId" class="world-select">
              <option value="" disabled>{{ t('worldSelector.chooseWorld') }}</option>
              <option v-for="world in existingWorlds" :key="world.id" :value="world.id">
                {{ world.name }}
              </option>
            </select>
            <button 
              @click="enterWorld" 
              :disabled="!selectedWorldId"
              class="btn btn-primary"
            >
              <span class="btn-icon">🚀</span>
              {{ t('worldSelector.enterWorld') }}
            </button>
          </div>
        </div>

        <!-- 创建新世界 -->
        <div class="world-section">
          <h3 class="section-title">
            <span class="section-icon">✨</span>
            {{ t('worldSelector.createWorld') }}
          </h3>
          <div class="world-create-container">
            <input 
              v-model="newWorldName" 
              :placeholder="t('worldSelector.newWorldPlaceholder')"
              class="world-input"
              @keyup.enter="createWorld"
            />
            <button 
              @click="createWorld" 
              :disabled="!newWorldName.trim()"
              class="btn btn-secondary"
            >
              <span class="btn-icon">🎨</span>
              {{ t('worldSelector.create') }}
            </button>
          </div>
        </div>

        <!-- 导入世界 -->
        <div class="world-section border-top">
          <h3 class="section-title">
            <span class="section-icon">📁</span>
            {{ t('worldSelector.importWorld') }}
          </h3>
          <div class="world-import-container">
            <input 
              ref="fileInput"
              type="file" 
              accept=".json" 
              @change="handleFileSelect"
              class="file-input"
            />
            <button @click="$refs.fileInput.click()" class="btn btn-success full-width">
              <span class="btn-icon">📤</span>
              {{ t('worldSelector.selectFile') }}
            </button>
            <div v-if="importStatus" class="import-status" :class="importStatusClass">
              {{ importStatus }}
            </div>
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="footer-info">
        <p class="version-info">{{ t('worldSelector.version') }} 1.0.0</p>
        <div class="social-links">
          <a href="#" class="social-link">📖 {{ t('worldSelector.docs') }}</a>
          <a href="#" class="social-link">💬 {{ t('worldSelector.community') }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

// 国际化和路由
const { t, locale } = useI18n()
const router = useRouter()

// 响应式数据
const existingWorlds = ref([])
const selectedWorldId = ref('')
const newWorldName = ref('')
const importStatus = ref('')
const importStatusClass = ref('')
const fileInput = ref(null)

// 语言选项
const languages = ref([
  { name: '中文', code: 'zhHans' },
  { name: 'English', code: 'en' }
])

/**
 * 当前语言标签
 */
const currentLanguageLabel = computed(() => {
  const lang = languages.value.find(l => l.code === locale.value)
  return lang ? lang.name : '中文'
})

/**
 * 切换语言
 */
const toggleLanguage = () => {
  const currentIndex = languages.value.findIndex(l => l.code === locale.value)
  const nextIndex = (currentIndex + 1) % languages.value.length
  locale.value = languages.value[nextIndex].code
  
  // 保存语言设置到本地存储
  localStorage.setItem('preferred-language', locale.value)
}

/**
 * 进入选中的世界
 */
const enterWorld = async () => {
  if (!selectedWorldId.value) return
  
  try {
    // 保存当前世界ID到本地存储
    localStorage.setItem('current-world-id', selectedWorldId.value)
    
    // 跳转到聊天页面
    await router.push('/chat')
  } catch (error) {
    console.error('进入世界失败:', error)
  }
}

/**
 * 创建新世界
 */
const createWorld = async () => {
  if (!newWorldName.value.trim()) return
  
  try {
    const newWorld = {
      id: Date.now().toString(),
      name: newWorldName.value.trim(),
      createdAt: new Date(),
      characters: [],
      groups: [],
      worldbook: [],
      config: {
        language: locale.value,
        theme: 'light'
      }
    }
    
    // 保存到本地存储
    const worlds = JSON.parse(localStorage.getItem('worlds') || '[]')
    worlds.push(newWorld)
    localStorage.setItem('worlds', JSON.stringify(worlds))
    
    // 设置为当前世界
    localStorage.setItem('current-world-id', newWorld.id)
    
    // 跳转到聊天页面
    await router.push('/chat')
  } catch (error) {
    console.error('创建世界失败:', error)
  }
}

/**
 * 处理文件选择
 */
const handleFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    importStatus.value = t('worldSelector.importing')
    importStatusClass.value = 'importing'
    
    const text = await file.text()
    const worldData = JSON.parse(text)
    
    // 验证世界数据格式
    if (!worldData.name) {
      throw new Error('无效的世界文件格式')
    }
    
    const importedWorld = {
      id: Date.now().toString(),
      name: worldData.name,
      data: worldData,
      createdAt: new Date()
    }
    
    // 保存到本地存储
    const worlds = JSON.parse(localStorage.getItem('worlds') || '[]')
    worlds.push(importedWorld)
    localStorage.setItem('worlds', JSON.stringify(worlds))
    
    // 设置为当前世界
    localStorage.setItem('current-world-id', importedWorld.id)
    
    importStatus.value = t('worldSelector.importSuccess')
    importStatusClass.value = 'success'
    
    setTimeout(async () => {
      await router.push('/chat')
    }, 1500)
    
  } catch (error) {
    console.error('导入世界失败:', error)
    importStatus.value = t('worldSelector.importError')
    importStatusClass.value = 'error'
  }
  
  // 清空文件输入
  event.target.value = ''
}

/**
 * 加载现有世界
 */
const loadExistingWorlds = () => {
  try {
    const worlds = JSON.parse(localStorage.getItem('worlds') || '[]')
    existingWorlds.value = worlds
  } catch (error) {
    console.error('加载世界列表失败:', error)
    existingWorlds.value = []
  }
}

/**
 * 初始化语言设置
 */
const initializeLanguage = () => {
  const savedLanguage = localStorage.getItem('preferred-language')
  if (savedLanguage && languages.value.some(l => l.code === savedLanguage)) {
    locale.value = savedLanguage
  }
}

// 组件挂载时初始化
onMounted(() => {
  initializeLanguage()
  loadExistingWorlds()
})
</script>

<style scoped lang="scss">
// SCSS变量定义
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
$success-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
$dark-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
$font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
$border-radius-lg: 24px;
$border-radius-md: 16px;
$border-radius-sm: 12px;
$transition-base: 0.3s;
$transition-slow: 0.5s;
$shadow-base: 0 20px 60px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 8px 25px rgba(0, 0, 0, 0.15);
$backdrop-blur: blur(20px);

// 颜色变量
$colors: (
  primary: #667eea,
  secondary: #764ba2,
  success: #10b981,
  danger: #ef4444,
  warning: #f59e0b,
  info: #3b82f6,
  light: (
    bg-primary: rgba(255, 255, 255, 0.95),
    bg-secondary: rgba(255, 255, 255, 0.8),
    bg-tertiary: rgba(255, 255, 255, 0.6),
    text-primary: #111827,
    text-secondary: #374151,
    text-muted: #6b7280,
    border: rgba(0, 0, 0, 0.08)
  ),
  dark: (
    bg-primary: rgba(15, 23, 42, 0.95),
    bg-secondary: rgba(30, 41, 59, 0.8),
    bg-tertiary: rgba(30, 41, 59, 0.6),
    text-primary: #f1f5f9,
    text-secondary: #e2e8f0,
    text-muted: #94a3b8,
    border: rgba(71, 85, 105, 0.3)
  )
);

// 混合宏
@mixin glass-effect($bg-color: rgba(255, 255, 255, 0.95)) {
  background: $bg-color;
  backdrop-filter: $backdrop-blur;
  box-shadow: $shadow-base;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@mixin button-hover {
  transition: all $transition-base ease;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: $shadow-hover;
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

// 主容器
.world-selector-page {
  min-height: 100vh;
  background: $primary-gradient;
  font-family: $font-family;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

// 背景装饰
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

.floating-orb {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  animation: float 6s ease-in-out infinite;
  
  &.orb-1 {
    width: 200px;
    height: 200px;
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }
  
  &.orb-2 {
    width: 150px;
    height: 150px;
    top: 60%;
    right: 15%;
    animation-delay: 2s;
  }
  
  &.orb-3 {
    width: 100px;
    height: 100px;
    bottom: 20%;
    left: 20%;
    animation-delay: 4s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

// 主要内容
.main-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 500px;
}

// 语言切换
.language-switcher {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.lang-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: $border-radius-sm;
  font-size: 14px;
  @include button-hover;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

// 应用头部
.app-header {
  text-align: center;
  margin-bottom: 40px;
}

.app-title {
  font-size: 48px;
  font-weight: 800;
  color: white;
  margin: 0 0 12px 0;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
}

.app-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  font-weight: 400;
}

// 世界选择卡片
.world-selector-card {
  @include glass-effect();
  border-radius: $border-radius-lg;
  padding: 32px;
  margin-bottom: 24px;
}

.world-section {
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.border-top {
    border-top: 1px solid rgba(0, 0, 0, 0.08);
    padding-top: 32px;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: map-get(map-get($colors, light), text-primary);
}

.section-icon {
  font-size: 24px;
}

// 表单控件
.world-select-container,
.world-create-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.world-select,
.world-input {
  flex: 1;
  padding: 16px 20px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: $border-radius-md;
  background: rgba(255, 255, 255, 0.8);
  color: map-get(map-get($colors, light), text-primary);
  font-size: 16px;
  font-family: $font-family;
  transition: all $transition-base;
  
  &:focus {
    outline: none;
    border-color: map-get($colors, primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    background: white;
  }
  
  &::placeholder {
    color: map-get(map-get($colors, light), text-muted);
  }
}

.world-import-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-input {
  display: none;
}

// 按钮样式
.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border: none;
  border-radius: $border-radius-md;
  font-weight: 600;
  font-size: 16px;
  font-family: $font-family;
  @include button-hover;
  white-space: nowrap;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
  
  &.btn-primary {
    background: $primary-gradient;
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
  
  &.btn-secondary {
    background: $secondary-gradient;
    color: white;
    box-shadow: 0 4px 15px rgba(118, 75, 162, 0.3);
  }
  
  &.btn-success {
    background: $success-gradient;
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }
  
  &.full-width {
    width: 100%;
    justify-content: center;
  }
}

.btn-icon {
  font-size: 18px;
}

// 导入状态
.import-status {
  padding: 12px 16px;
  border-radius: $border-radius-sm;
  text-align: center;
  font-weight: 500;
  
  &.importing {
    background: rgba(59, 130, 246, 0.1);
    color: map-get($colors, info);
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  
  &.success {
    background: rgba(16, 185, 129, 0.1);
    color: map-get($colors, success);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.1);
    color: map-get($colors, danger);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
}

// 底部信息
.footer-info {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.version-info {
  font-size: 14px;
  margin-bottom: 12px;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.social-link {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 14px;
  transition: color $transition-base;
  
  &:hover {
    color: white;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .world-selector-page {
    padding: 16px;
  }
  
  .app-title {
    font-size: 36px;
  }
  
  .app-subtitle {
    font-size: 16px;
  }
  
  .world-selector-card {
    padding: 24px;
  }
  
  .world-select-container,
  .world-create-container {
    flex-direction: column;
    
    .btn {
      width: 100%;
      justify-content: center;
    }
  }
}

// 深色主题
:root.dark-theme {
  .world-selector-page {
    background: $dark-gradient;
  }
  
  .world-selector-card {
    @include glass-effect(map-get(map-get($colors, dark), bg-primary));
    border: 1px solid map-get(map-get($colors, dark), border);
  }
  
  .section-title {
    color: map-get(map-get($colors, dark), text-primary);
  }
  
  .world-select,
  .world-input {
    background: map-get(map-get($colors, dark), bg-secondary);
    border: 1px solid map-get(map-get($colors, dark), border);
    color: map-get(map-get($colors, dark), text-primary);
    
    &::placeholder {
      color: map-get(map-get($colors, dark), text-muted);
    }
    
    &:focus {
      background: map-get(map-get($colors, dark), bg-primary);
      border-color: map-get($colors, primary);
    }
  }
  
  .world-section.border-top {
    border-top: 1px solid map-get(map-get($colors, dark), border);
  }
}
</style>
