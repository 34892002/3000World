<template>
  <div v-if="visible" class="vector-plugin-overlay" @click="closePlugin">
    <div class="vector-plugin-dialog" @click.stop>
      <div class="plugin-header">
        <h3>{{ t('plugins.vector.title') }}</h3>
        <button class="close-btn" @click="closePlugin">✕</button>
      </div>
      
      <div class="plugin-content">
        <!-- 连接状态 -->
        <div class="status-section">
          <div class="status-item">
            <span class="status-label">状态:</span>
            <span :class="['status-value', isConnected ? 'connected' : 'disconnected']">
              {{ isConnected ? t('plugins.vector.status.connected') : t('plugins.vector.status.disconnected') }}
            </span>
          </div>
        </div>

        <!-- 向量化操作 -->
        <div class="vector-section">
          <h4>{{ t('plugins.vector.description') }}</h4>
          
          <div class="action-buttons">
            <button 
              class="action-btn primary" 
              @click="vectorizeChatHistory" 
              :disabled="loading || !isConnected"
            >
              <span v-if="loading">处理中...</span>
              <span v-else>{{ t('plugins.vector.actions.vectorize') }}</span>
            </button>
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
            <button class="search-btn" @click="performSearch" :disabled="!searchQuery.trim() || !isConnected">
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
                  <span class="result-score">相似度: {{ (result.score * 100).toFixed(1) }}%</span>
                </div>
                <div class="result-content">{{ result.content }}</div>
              </div>
            </div>
          </div>
          
          <div v-else-if="searchPerformed && searchResults.length === 0" class="no-results">
            {{ t('plugins.vector.messages.noResults') }}
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-section">
          <h4>统计信息</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">{{ t('plugins.vector.stats.totalMessages') }}</span>
              <span class="stat-value">{{ stats?.totalMessages || 0 }}</span>
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

        <!-- 操作日志 -->
        <div v-if="logs.length > 0" class="logs-section">
          <div class="logs-header">
            <h4>操作日志</h4>
            <button class="clear-logs-btn" @click="clearLogs">{{ t('plugins.vector.actions.clear') }}</button>
          </div>
          <div class="logs-container">
            <div v-for="log in logs" :key="log.id" :class="['log-item', log.type]">
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
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
const { database, isConnected, getChatHistory, config, vectorDB, initVectorDB } = useDatabase()
const { createEmbeddings } = useAIApi()

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const searchPerformed = ref(false)
const logs = ref([])
const stats = ref({
  totalMessages: 0,
  vectorizedMessages: 0,
  lastUpdate: null
})

// 监听数据库连接状态
watch([isConnected], async () => {
  if (isConnected.value) {
    addLog('success', '数据库连接成功，正在初始化向量搜索功能...')
    // 主动初始化VectorDB实例
    const initialized = await initVectorDB()
    if (initialized) {
      addLog('success', '向量搜索功能已启用')
    } else {
      addLog('error', '向量搜索功能初始化失败')
    }
  } else {
    addLog('warning', '数据库连接断开，向量搜索功能不可用')
  }
})



/**
 * 向量化聊天记录
 */
const vectorizeChatHistory = async () => {
  if (!isConnected.value) {
    addLog('error', '数据库未连接')
    return
  }
  
  if (!vectorDB.value) {
    addLog('info', '正在初始化向量数据库...')
    const initialized = await initVectorDB()
    if (!initialized) {
      addLog('error', '向量数据库初始化失败')
      return
    }
  }

  loading.value = true

  try {
    // 获取所有聊天会话
    const sessions = await getAllChatSessions()
    let processedCount = 0

    for (const sessionId of sessions) {
      const messages = await getChatHistory(sessionId)
      
      addLog('info', `开始向量化 ${messages.length} 条消息`)
      
      for (const message of messages) {
        try {
          // 创建嵌入向量
          const embedding = await createEmbeddings(message.content)
          
          // 使用VectorDB存储向量数据
          await vectorDB.value.insert({
            messageId: message.id.toString(),
            sessionId: message.sessionId,
            characterName: message.characterName,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
            vector: embedding
          })
          
          processedCount++
        } catch (error) {
          // 如果是重复数据错误，跳过；其他错误记录日志
          if (!error.message.includes('duplicate') && !error.message.includes('重复')) {
            addLog('warning', `消息 ${message.id} 向量化失败: ${error.message}`)
          }
        }
      }
    }

    addLog('success', `向量化完成，处理了 ${processedCount} 条消息`)
    await updateStats()
  } catch (error) {
    addLog('error', `向量化失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}



/**
 * 执行搜索
 */
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    addLog('warning', '请输入搜索关键词')
    return
  }
  
  if (!isConnected.value) {
    addLog('error', '数据库未连接')
    return
  }
  
  if (!vectorDB.value) {
    addLog('info', '正在初始化向量数据库...')
    const initialized = await initVectorDB()
    if (!initialized) {
      addLog('error', '向量数据库初始化失败')
      return
    }
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
      score: result.score
    }))
    
    addLog('success', `搜索完成，找到 ${results.length} 条相关记录`)
  } catch (error) {
    addLog('error', `搜索失败: ${error.message}`)
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
  if (!isConnected.value) return
  
  if (!vectorDB.value) {
    const initialized = await initVectorDB()
    if (!initialized) {
      addLog('warning', '向量数据库未初始化，无法获取统计信息')
      return
    }
  }
  
  try {
    const statsData = await vectorDB.value.getStats()
    
    stats.value = {
      totalMessages: statsData.totalRecords,
      vectorizedMessages: statsData.totalRecords,
      lastUpdate: new Date().toLocaleString()
    }
  } catch (error) {
    console.error('Failed to update stats:', error)
    addLog('error', `统计信息更新失败: ${error.message}`)
  }
}

/**
 * 添加日志
 * @param {string} type - 日志类型
 * @param {string} message - 日志消息
 */
const addLog = (type, message) => {
  logs.value.unshift({
    id: Date.now(),
    type,
    message,
    timestamp: new Date()
  })
  
  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
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
 * 清空日志
 */
const clearLogs = () => {
  logs.value = []
}

/**
 * 关闭插件
 */
const closePlugin = () => {
  emit('close')
}
</script>

<style scoped>
.vector-plugin-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.vector-plugin-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.plugin-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 5px;
}

.close-btn:hover {
  color: #333;
}

.plugin-content {
  padding: 20px;
}

.status-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  font-weight: 500;
  color: #666;
}

.status-value {
  font-weight: 600;
}

.status-value.connected {
  color: #28a745;
}

.status-value.disconnected {
  color: #dc3545;
}

.reconnect-btn {
  margin-left: 12px;
  padding: 4px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.reconnect-btn:hover:not(:disabled) {
  background: #0056b3;
}

.reconnect-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.vector-section {
  margin-bottom: 24px;
}

.vector-section h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.section-description {
  color: #666;
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
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.primary {
  background: #007bff;
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: #0056b3;
}

.action-btn.secondary {
  background: #6c757d;
  color: white;
}

.action-btn.secondary:hover:not(:disabled) {
  background: #545b62;
}

.search-section {
  margin-bottom: 24px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.search-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-btn {
  padding: 8px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-btn:hover:not(:disabled) {
  background: #218838;
}

.search-results h5 {
  margin: 0 0 12px 0;
  color: #333;
}

.result-list {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 8px;
}

.result-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.result-content {
  color: #333;
  line-height: 1.4;
}

.stats-section {
  margin-bottom: 24px;
}

.stats-section h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #333;
}

.logs-section {
  margin-bottom: 24px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.logs-header h4 {
  margin: 0;
  color: #333;
}

.clear-logs-btn {
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.clear-logs-btn:hover {
  background: #c82333;
}

.no-results {
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
}

.logs-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 6px;
}

.log-item {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.info {
  background: #e7f3ff;
}

.log-item.success {
  background: #e8f5e8;
}

.log-item.error {
  background: #ffe6e6;
}

.log-time {
  color: #666;
  white-space: nowrap;
}

.log-message {
  color: #333;
}
</style>