<template>
  <div v-if="visible" class="vector-plugin-overlay" @click="closePlugin">
    <div class="vector-plugin-dialog" @click.stop>
      <div class="plugin-header">
        <h3>{{ t('plugins.vector.title') }}</h3>
        <button class="close-btn" @click="closePlugin">✕</button>
      </div>
      
      <div class="plugin-content">
        <!-- 配置区域 -->
        <div class="config-section">
          <h4>插件配置</h4>
          <div class="config-form">
            <div class="form-group">
              <label class="switch-label">
                <input type="checkbox" v-model="vectorConfig.enabled" @change="saveVectorConfig" />
                <span class="switch"></span>
                启用向量化保存
              </label>
            </div>
            <div class="form-group">
              <label>API密钥:</label>
              <input 
                v-model="vectorConfig.apiKey" 
                type="password" 
                placeholder="请输入API密钥"
                class="config-input"
                :disabled="!vectorConfig.enabled"
                @blur="saveVectorConfig"
              />
            </div>
            <div class="form-group">
              <label>API地址:</label>
              <input 
                v-model="vectorConfig.apiUrl" 
                type="text" 
                placeholder="API地址"
                class="config-input"
                :disabled="!vectorConfig.enabled"
                @blur="saveVectorConfig"
              />
            </div>
            <div class="form-group">
              <label>模型名称:</label>
              <input 
                v-model="vectorConfig.model" 
                type="text" 
                placeholder="模型名称"
                class="config-input"
                :disabled="!vectorConfig.enabled"
                @blur="saveVectorConfig"
              />
            </div>
          </div>
        </div>

        <!-- 搜索区域 -->
        <div class="search-section">
          <div class="search-input-group">
            <input 
              v-model="searchQuery" 
              :placeholder="t('plugins.vector.placeholders.search')"
              class="search-input"
              @keyup.enter="performSearch"
            />
            <button class="search-btn" @click="performSearch" :disabled="!searchQuery.trim() || !isConnected || !vectorConfig.apiKey || !vectorConfig.enabled">
              {{ t('plugins.vector.actions.search') }}
            </button>
          </div>
          
          <!-- 搜索结果 -->
          <div v-if="searchResults.length > 0" class="search-results">
            <h5>搜索结果</h5>
            <div class="result-list">
              <div v-for="result in searchResults" :key="result.id" class="result-item">
                <div class="result-meta">
                  <span class="result-character">{{ result.characterName || '用户' }}</span>
                  <span class="result-time">{{ formatTime(result.timestamp) }}</span>
                  <span class="result-score">相似度: {{ (result.similarity * 100).toFixed(1) }}%</span>
                </div>
                <div class="result-content">{{ result.content }}</div>
              </div>
            </div>
          </div>
          
          <div v-else-if="searchPerformed && searchResults.length === 0" class="no-results">
            {{ t('plugins.vector.messages.noResults') }}
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section pa-5">
        <div class="stats-grid">
          <div class="stat-item">
            <span :class="['status-value', isConnected ? 'connected' : 'disconnected']">
              {{ isConnected ? t('plugins.vector.status.connected') : t('plugins.vector.status.disconnected') }}
            </span>
            <!-- <span class="stat-value">{{ stats?.totalMessages || 0 }}</span> -->
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('plugins.vector.stats.vectorizedMessages') }}</span>
            <span class="stat-value">{{ stats?.vectorizedMessages || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最后更新</span>
            <span class="stat-value">{{ stats?.lastUpdate || '从未' }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDatabase } from '@/composables/useDatabase.js'
import { useAIApi } from '@/api/model'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentChat: {
    type: Object,
    default: () => ({ userId: null, chatType: '' })
  }
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const { isConnected, vectorDB, initVectorDB, getPluginConfig, savePluginConfig } = useDatabase()
const { createEmbeddings } = useAIApi()

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchPerformed = ref(false)
const stats = ref({
  totalMessages: 0,
  vectorizedMessages: 0,
  lastUpdate: null
})

// 向量插件配置
const vectorConfig = ref({
  enabled: false,
  apiKey: '',
  apiUrl: 'https://api.siliconflow.cn/v1/embeddings',
  model: 'Qwen/Qwen3-Embedding-4B'
})

/**
 * 加载向量插件配置
 */
const loadVectorConfig = async () => {
  try {
    const config = await getPluginConfig('vector')
    if (config) {
      vectorConfig.value = {
        ...vectorConfig.value,
        ...config
      }
    } else {
    }
  } catch (error) {
    console.error('加载向量插件配置失败:', error)
  }
}

/**
 * 保存向量插件配置
 */
const saveVectorConfig = async () => {
  try {
    const result = await savePluginConfig('vector', vectorConfig.value)
  } catch (error) {
    console.error('保存向量插件配置失败:', error)
  }
}

// 组件挂载时加载配置
onMounted(async () => {
  if (isConnected.value) {
    await loadVectorConfig()
  }
})

// 监听数据库连接状态
watch([isConnected], async () => {
  if (isConnected.value) {
    console.log('数据库已连接，开始加载向量插件配置')
    // 加载向量插件配置
    await loadVectorConfig()
    // 主动初始化VectorDB实例
    const initialized = await initVectorDB()
    if (initialized) {
      // 更新统计信息
      await updateStats()
    }
  }
}, { immediate: true })


/**
 * 检查向量数据库状态
 * @returns {Promise<boolean>} 是否可用
 */
const checkVectorDBStatus = async () => {
  if (!isConnected.value || !vectorConfig.value.enabled) {
    return false
  }

  if (!vectorDB.value) {
    const initialized = await initVectorDB()
    if (!initialized) {
      return false
    }

    // 初始化后再次检查实例是否真的创建了
    if (!vectorDB.value) {
      return false
    }
  }

  return true
}


/**
 * 执行搜索
 */
const performSearch = async () => {
  if (!searchQuery.value.trim() || !vectorConfig.value.enabled) {
    return
  }

  const isReady = await checkVectorDBStatus()
  if (!isReady) {
    return
  }

  loading.value = true
  searchPerformed.value = true

  try {
    // 创建查询向量
    const queryEmbedding = await createEmbeddings(searchQuery.value)

    // 搜索相似内容
    const results = await vectorDB.value.query(queryEmbedding, {
      limit: 10,
      threshold: 0.3
    })

    // 转换结果格式
    searchResults.value = results.map(result => ({
      id: result.object.messageId,
      content: result.object.content,
      characterName: result.object.characterName,
      role: result.object.role,
      timestamp: result.object.timestamp,
      similarity: result.similarity
    }))
  } catch (error) {
    console.error('搜索失败:', error.message)
  } finally {
    loading.value = false
  }
}

/**
 * 获取所有聊天会话ID
 * @returns {Promise<string[]>} 会话ID列表
 */
const getAllChatSessions = async () => {
  // TODO: 实现获取所有会话ID的逻辑
  // 可以通过查询数据库获取所有唯一的sessionId
  return []
}

/**
 * 更新统计信息
 */
const updateStats = async () => {
  if (!isConnected.value || !vectorConfig.value.enabled) return

  const isReady = await checkVectorDBStatus()
  if (!isReady) {
    return
  }

  try {
    // 再次确认 vectorDB 实例存在
    if (!vectorDB.value) {
      return
    }

    const statsData = await vectorDB.value.getStats()

    stats.value = {
      totalMessages: statsData.totalRecords,
      vectorizedMessages: statsData.totalRecords,
      lastUpdate: new Date().toLocaleString()
    }
  } catch (error) {
    console.error('统计信息更新失败:', error.message)
  }
}

/**
 * 格式化时间
 * @param {Date|string} timestamp - 时间戳
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString()
}

/**
 * 关闭插件
 */
const closePlugin = () => {
  emit('close')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use 'sass:map';
@use 'sass:color';

// 模态框样式
.vector-plugin-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

// 插件主容器
.vector-plugin-dialog {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
}

// 插件头部
.plugin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid map.get(map.get($colors, light), border);
  background: map.get(map.get($colors, light), bg-secondary);

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: map.get(map.get($colors, light), text-primary);
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  color: map.get(map.get($colors, light), text-muted);
  border-radius: 4px;
  transition: all $transition-base;

  &:hover {
    color: map.get(map.get($colors, light), text-primary);
    @include button-hover();
  }
}

// 插件内容区
.plugin-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  height: 550px;
  overflow-y: auto;
}

// 状态区域
.status-section {
  margin-bottom: 24px;
  padding: 16px;
  background: map.get(map.get($colors, light), bg-secondary);
  border-radius: $border-radius-md;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.status-label {
  font-weight: 500;
  color: map.get(map.get($colors, light), text-secondary);
}

.status-value {
  font-weight: 600;

  &.connected {
    color: map.get($colors, success);
  }

  &.disconnected {
    color: map.get($colors, danger);
  }
}

.reconnect-btn {
  margin-left: 12px;
  padding: 4px 12px;
  background: map.get($colors, primary);
  color: white;
  border: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  font-size: 12px;
  transition: all $transition-base;

  &:hover:not(:disabled) {
    background: color.adjust(map.get($colors, primary), $lightness: -10%);
  }

  &:disabled {
    background: map.get(map.get($colors, light), text-muted);
    cursor: not-allowed;
  }
}

// 配置区域
.config-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid map.get(map.get($colors, light), border);
  border-radius: $border-radius-md;
  background: map.get(map.get($colors, light), bg-secondary);

  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: map.get(map.get($colors, light), text-primary);
  }
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 14px;
    font-weight: 500;
    color: map.get(map.get($colors, light), text-secondary);
  }
}

.config-input {
  padding: 8px 12px;
  border: 1px solid map.get(map.get($colors, light), border);
  border-radius: $border-radius-sm;
  background: white;
  color: map.get(map.get($colors, light), text-primary);
  font-size: 14px;
  transition: all $transition-base;
  font-family: $font-family;

  &:focus {
    outline: none;
    border-color: map.get($colors, primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: map.get(map.get($colors, light), text-muted);
  }

  &:disabled {
    background: map.get(map.get($colors, light), bg-secondary);
    color: map.get(map.get($colors, light), text-muted);
    cursor: not-allowed;
  }
}

// Switch 组件样式
.switch-label {
  display: flex !important;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  
  input[type="checkbox"] {
    display: none;
  }
}

.switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  transition: background-color 0.2s;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

input[type="checkbox"]:checked + .switch {
  background: map.get($colors, primary);
  
  &::after {
    transform: translateX(20px);
  }
}

// 向量化区域
.vector-section {
  margin-bottom: 24px;

  h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: map.get(map.get($colors, light), text-primary);
  }
}

.section-description {
  color: map.get(map.get($colors, light), text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-btn {
  padding: 10px 20px;
  border: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  font-weight: 500;
  transition: all $transition-base;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.primary {
    background: map.get($colors, primary);
    color: white;

    &:hover:not(:disabled) {
      background: color.adjust(map.get($colors, primary), $lightness: -10%);
    }
  }

  &.secondary {
    background: map.get(map.get($colors, light), text-muted);
    color: white;

    &:hover:not(:disabled) {
      background: color.adjust(map.get(map.get($colors, light), text-muted), $lightness: -10%);
    }
  }
}

// 搜索区域
.search-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid map.get(map.get($colors, light), border);
  border-radius: $border-radius-md;
}

.search-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid map.get(map.get($colors, light), border);
  border-radius: $border-radius-sm;
  background: white;
  color: map.get(map.get($colors, light), text-primary);
  font-size: 14px;
  transition: all $transition-base;
  font-family: $font-family;

  &:focus {
    outline: none;
    border-color: map.get($colors, primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: map.get(map.get($colors, light), text-muted);
  }
}

.search-btn {
  padding: 8px 16px;
  background: map.get($colors, success);
  color: white;
  border: none;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all $transition-base;

  &:hover:not(:disabled) {
    background: color.adjust(map.get($colors, success), $lightness: -10%);
  }
}

.search-results {
  h5 {
    margin: 0 0 12px 0;
    color: map.get(map.get($colors, light), text-primary);
    font-size: 14px;
    font-weight: 600;
  }
}

.result-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 12px;
  border: 1px solid map.get(map.get($colors, light), border);
  border-radius: $border-radius-sm;
  margin-bottom: 8px;
  background: white;
}

.result-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: map.get(map.get($colors, light), text-muted);
}

.result-content {
  color: map.get(map.get($colors, light), text-primary);
  line-height: 1.4;
}

// 统计区域
.stats-section {
  border-top: 1px solid map.get(map.get($colors, light), border);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  background: map.get(map.get($colors, light), bg-secondary);
}

.stat-label {
  color: map.get(map.get($colors, light), text-secondary);
}

.stat-value {
  font-weight: 600;
  color: map.get(map.get($colors, light), text-primary);
}

.no-results {
  text-align: center;
  color: map.get(map.get($colors, light), text-muted);
  padding: 20px;
  font-style: italic;
}

// 响应式设计
@include mobile {
  .vector-plugin-dialog {
    width: 95%;
    max-height: 95vh;
  }

  .plugin-header,
  .plugin-content {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;

    .action-btn {
      width: 100%;
    }
  }

  .search-input-group {
    flex-direction: column;

    .search-btn {
      width: 100%;
    }
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

// 深色主题样式
:root.dark-theme {
  .vector-plugin-dialog {
    @include glass-effect(map.get(map.get($colors, dark), bg-primary));
    border: 1px solid map.get(map.get($colors, dark), border);
  }

  .plugin-header {
    border-bottom: 1px solid map.get(map.get($colors, dark), border);
    background: map.get(map.get($colors, dark), bg-secondary);

    h3 {
      color: map.get(map.get($colors, dark), text-primary);
    }
  }

  .close-btn {
    color: map.get(map.get($colors, dark), text-muted);

    &:hover {
      color: map.get(map.get($colors, dark), text-primary);
      background: rgba(71, 85, 105, 0.3);
    }
  }

  .status-section {
    background: map.get(map.get($colors, dark), bg-secondary);
  }

  .status-label {
    color: map.get(map.get($colors, dark), text-secondary);
  }

  .vector-section h4,
  .stats-section h4,
  .config-section h4 {
    color: map.get(map.get($colors, dark), text-primary);
  }

  .config-section {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid map.get(map.get($colors, dark), border);
  }

  .form-group label {
    color: map.get(map.get($colors, dark), text-secondary);
  }

  .config-input {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid map.get(map.get($colors, dark), border);
    color: map.get(map.get($colors, dark), text-primary);

    &::placeholder {
      color: map.get(map.get($colors, dark), text-muted);
    }

    &:focus {
      border-color: map.get($colors, primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    &:disabled {
      background: map.get(map.get($colors, dark), bg-primary);
      color: map.get(map.get($colors, dark), text-muted);
      cursor: not-allowed;
    }
  }

  .section-description {
    color: map.get(map.get($colors, dark), text-secondary);
  }

  .reconnect-btn {
    &:disabled {
      background: map.get(map.get($colors, dark), text-muted);
    }
  }

  .search-section {
    border: 1px solid map.get(map.get($colors, dark), border);
  }

  .search-input {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid map.get(map.get($colors, dark), border);
    color: map.get(map.get($colors, dark), text-primary);

    &::placeholder {
      color: map.get(map.get($colors, dark), text-muted);
    }

    &:focus {
      border-color: map.get($colors, primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    &:disabled {
      background: map.get(map.get($colors, dark), bg-primary);
      color: map.get(map.get($colors, dark), text-muted);
      cursor: not-allowed;
    }
  }

  .search-results h5 {
    color: map.get(map.get($colors, dark), text-primary);
  }

  .result-item {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid map.get(map.get($colors, dark), border);
  }

  .result-meta {
    color: map.get(map.get($colors, dark), text-muted);
  }

  .result-content {
    color: map.get(map.get($colors, dark), text-primary);
  }

  .stat-item {
    background: map.get(map.get($colors, dark), bg-secondary);
  }

  .stat-label {
    color: map.get(map.get($colors, dark), text-secondary);
  }

  .stat-value {
    color: map.get(map.get($colors, dark), text-primary);
  }

  .no-results {
    color: map.get(map.get($colors, dark), text-muted);
  }

  .switch {
    background: #475569;
  }

  input[type="checkbox"]:checked + .switch {
    background: #667eea;
  }
}
</style>