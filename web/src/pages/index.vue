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
          {{ t('messages.language') }}: {{ currentLanguageLabel }}
        </button>
      </div>

      <!-- 应用标题 -->
      <div class="app-header d-flex justify-center align-center">
        <div class="logo w-33 h-33">
          <img class="w-100 h-100" src="@/assets/logo.png" alt="" srcset="">
        </div>
        <div class="info">
          <h1 class="app-title">{{ t('messages.appTitle') }}</h1>
          <p class="app-subtitle">{{ t('worldSelector.subtitle') }}</p>
        </div>
      </div>

      <!-- 世界选择卡片 -->
      <div class="world-selector-card">
        <!-- 数据库连接状态 -->
        <div v-if="isConnected" class="world-section status-section">
          <div class="connection-status connected">
            <span class="status-icon">✅</span>
            <span>{{ t('worldSelector.connectedTo') }}: {{ currentWorld }}</span>
          </div>
        </div>
        
        <div v-if="dbLoading" class="world-section status-section">
          <div class="connection-status loading">
            <span class="status-icon">⏳</span>
            <span>{{ t('worldSelector.loading') }}...</span>
          </div>
        </div>

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
              :disabled="!selectedWorldId || dbLoading"
              class="btn btn-primary"
            >
              <span class="btn-icon">🚀</span>
              {{ t('worldSelector.enterWorld') }}
            </button>
          </div>
          
          <!-- 世界管理按钮 -->
          <div v-if="selectedWorldId" class="world-actions">
            <button 
              @click="exportSelectedWorld" 
              :disabled="dbLoading"
              class="btn btn-outline btn-sm"
            >
              <span class="btn-icon">📤</span>
              {{ t('worldSelector.export') }}
            </button>
            <button 
              @click="deleteSelectedWorld" 
              :disabled="dbLoading"
              class="btn btn-danger btn-sm"
            >
              <span class="btn-icon">🗑️</span>
              {{ t('worldSelector.delete') }}
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
              :placeholder="t('worldSelector.worldName')"
              class="world-input"
              @keyup.enter="createWorld"
            />
            <button 
              @click="createWorld" 
              :disabled="!newWorldName.trim() || dbLoading"
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
          <a href="https://github.com/34892002/3000World" target="_blank" class="social-link">📖 {{ t('worldSelector.git') }}</a>
          <a href="#" class="social-link">💬 {{ t('worldSelector.community') }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useDatabase } from '@/composables/useDatabase'

// 国际化和路由
const { t, locale } = useI18n()
const router = useRouter()

// 数据库功能
const {
  isConnected,
  currentWorld,
  loading: dbLoading,
  error: dbError,
  connectToWorld,
  getAvailableWorlds,
  disconnect,
  exportWorld,
  importWorld,
  clearError
} = useDatabase()

// 响应式数据
const existingWorlds = ref([])
const selectedWorldId = ref('')
const newWorldName = ref('')
const importStatus = ref('')
const importStatusClass = ref('')
const fileInput = ref(null)
const showAdvancedOptions = ref(false)

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
    // 连接到选中的世界数据库
    const success = await connectToWorld(selectedWorldId.value)
    if (success) {
      // 保存当前世界ID到本地存储
      localStorage.setItem('current-world-id', selectedWorldId.value)
      
      // 跳转到聊天页面
      await router.push('/chat')
    } else {
      console.error('连接世界失败')
    }
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
    const worldName = newWorldName.value.trim()
    
    // 连接到新世界数据库（会自动创建）
    const success = await connectToWorld(worldName)
    if (success) {
      // 保存当前世界名称到本地存储
      localStorage.setItem('current-world-id', worldName)
      
      // 清空输入框
      newWorldName.value = ''
      
      // 重新加载世界列表
      await loadExistingWorlds()
      
      // 跳转到聊天页面
      await router.push('/chat')
    } else {
      console.error('创建世界失败')
    }
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
    if (!worldData.worldName && !worldData.name) {
      throw new Error('无效的世界文件格式')
    }
    
    const worldName = worldData.worldName || worldData.name
    
    // 使用数据库导入功能
    const success = await importWorld(worldData, worldName)
    
    if (success) {
      // 连接到导入的世界以确保数据正确加载
      await connectToWorld(worldName)
      
      // 保存当前世界名称到本地存储
      localStorage.setItem('current-world-id', worldName)
      
      // 重新加载世界列表
      await loadExistingWorlds()
      
      importStatus.value = t('worldSelector.importSuccess')
      importStatusClass.value = 'success'
      
      setTimeout(async () => {
        await router.push('/chat')
      }, 1500)
    } else {
      throw new Error('导入失败')
    }
    
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
const loadExistingWorlds = async () => {
  try {
    const worldNames = await getAvailableWorlds()
    existingWorlds.value = worldNames.map(name => ({
      id: name,
      name: name
    }))
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
onMounted(async () => {
  initializeLanguage()
  await loadExistingWorlds()
})

// 监听数据库错误
watch(dbError, (newError) => {
  if (newError) {
    importStatus.value = newError
    importStatusClass.value = 'error'
    // 3秒后清除错误
    setTimeout(() => {
      clearError()
      importStatus.value = ''
      importStatusClass.value = ''
    }, 3000)
  }
})

/**
 * 导出当前选中的世界
 */
const exportSelectedWorld = async () => {
  if (!selectedWorldId.value) return
  
  try {
    // 先连接到世界
    const success = await connectToWorld(selectedWorldId.value)
    if (success) {
      const data = await exportWorld()
      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedWorldId.value}_export.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    }
  } catch (error) {
    console.error('导出世界失败:', error)
  }
}

/**
 * 删除选中的世界
 */
const deleteSelectedWorld = async () => {
  if (!selectedWorldId.value) return
  
  if (confirm(t('worldSelector.confirmDelete', { worldName: selectedWorldId.value }))) {
    try {
      // 删除数据库
      await indexedDB.deleteDatabase(`3000World_${selectedWorldId.value}`)
      
      // 重新加载世界列表
      await loadExistingWorlds()
      
      // 清空选择
      selectedWorldId.value = ''
      
      importStatus.value = t('worldSelector.deleteSuccess')
      importStatusClass.value = 'success'
      
      setTimeout(() => {
        importStatus.value = ''
        importStatusClass.value = ''
      }, 2000)
    } catch (error) {
      console.error('删除世界失败:', error)
      importStatus.value = t('worldSelector.deleteError')
      importStatusClass.value = 'error'
    }
  }
}
</script>

<style scoped lang="scss">
@use 'sass:map';
@use '@/styles/variables.scss' as *;

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
  
  &.status-section {
    margin-bottom: 20px;
  }
}

// 连接状态
.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: $border-radius-md;
  font-weight: 500;
  
  &.connected {
    background: rgba(16, 185, 129, 0.1);
    color: map.get($colors, success);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  
  &.loading {
    background: rgba(59, 130, 246, 0.1);
    color: map.get($colors, info);
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
}

.status-icon {
  font-size: 16px;
}

// 世界管理按钮
.world-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  justify-content: flex-end;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: map.get(map.get($colors, light), text-primary);
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
  color: map.get(map.get($colors, light), text-primary);
  font-size: 16px;
  font-family: $font-family;
  transition: all $transition-base;
  
  &:focus {
    outline: none;
    border-color: map.get($colors, primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    background: white;
  }
  
  &::placeholder {
    color: map.get(map.get($colors, light), text-muted);
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
  
  &.btn-outline {
    background: transparent;
    color: map.get($colors, primary);
    border: 2px solid map.get($colors, primary);
    box-shadow: none;
    
    &:hover:not(:disabled) {
      background: map.get($colors, primary);
      color: white;
    }
  }
  
  &.btn-danger {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white;
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
  }
  
  &.btn-sm {
    padding: 8px 16px;
    font-size: 14px;
    
    .btn-icon {
      font-size: 14px;
    }
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
    color: map.get($colors, info);
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
  
  &.success {
    background: rgba(16, 185, 129, 0.1);
    color: map.get($colors, success);
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  
  &.error {
    background: rgba(239, 68, 68, 0.1);
    color: map.get($colors, danger);
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
    @include glass-effect(map.get(map.get($colors, dark), bg-primary));
    border: 1px solid map.get(map.get($colors, dark), border);
  }
  
  .section-title {
    color: map.get(map.get($colors, dark), text-primary);
  }
  
  .world-select,
  .world-input {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid map.get(map.get($colors, dark), border);
    color: map.get(map.get($colors, dark), text-primary);
    
    &::placeholder {
      color: map.get(map.get($colors, dark), text-muted);
    }
    
    &:focus {
      background: map.get(map.get($colors, dark), bg-primary);
      border-color: map.get($colors, primary);
    }
  }
  
  .world-section.border-top {
    border-top: 1px solid map.get(map.get($colors, dark), border);
  }
  
  .connection-status {
    &.connected {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    
    &.loading {
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
    }
  }
  
  .btn.btn-outline {
    color: map.get($colors, primary);
    border-color: map.get($colors, primary);
    
    &:hover:not(:disabled) {
      background: map.get($colors, primary);
      color: white;
    }
  }
}
</style>
