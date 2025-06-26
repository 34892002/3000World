/**
 * Vue 组合式函数 - 数据库操作
 * 提供响应式的数据库操作接口
 */

import { ref, computed, readonly } from 'vue'
import database from '@/utils/database.js'
import { VectorDB } from '@/utils/vector.js'
import { useAIApi } from '@/api/model'

export function useDatabase() {
  // 响应式状态
  const isConnected = ref(false)
  const currentWorld = ref('')
  const loading = ref(false)
  const error = ref(null)
  
  // VectorDB实例
  const vectorDB = ref(null)
  
  // 数据缓存
  const characters = ref([])
  const groups = ref([])
  const worldbooks = ref([])
  const config = ref({
    apiKey: '',
    apiUrl: '',
    model: ''
  })
  
  /**
   * 加载所有数据到缓存
   */
  const loadAllData = async () => {
    try {
      loading.value = true
      
      const [charsData, groupsData, worldbooksData, configData] = await Promise.all([
        database.getAllCharacters(),
        database.getAllGroups(),
        database.getAllWorldbooks(),
        database.loadWorldConfig()
      ])
      
      characters.value = charsData
      groups.value = groupsData
      worldbooks.value = worldbooksData
      
      // 调试配置加载
      console.log('加载的配置数据:', configData)
      config.value = { ...config.value, ...configData }
      console.log('合并后的配置:', config.value)
      
    } catch (err) {
      handleError(err, 'loadAllData')
    } finally {
      loading.value = false
    }
  }
  
  // 初始化检查 - 添加调试信息
  const dbInstance = database.getInstance()
  const dbName = database.dbName
  
  console.log('数据库初始化检查:')
  console.log('- database.getInstance():', dbInstance)
  console.log('- database.dbName:', dbName)
  console.log('- 检查结果:', !!(dbInstance && dbName))
  
  if (dbInstance && dbName) {
    isConnected.value = true
    currentWorld.value = dbName.replace(database.dbPrefix, '')
    console.log('✅ 数据库连接状态设置为true, 当前世界:', currentWorld.value)
    
    // 异步加载数据，不阻塞返回
    loadAllData().catch(err => {
      console.warn('初始化时加载数据失败:', err)
    })
  } else {
    console.log('❌ 数据库连接状态保持为false')
    console.log('- 可能原因: database.getInstance()或database.dbName为空')
  }
  
  // 计算属性
  const playerCharacter = computed(() => {
    return characters.value.find(char => char.isPlayer) || null
  })
  
  const availableCharacters = computed(() => {
    return characters.value.filter(char => !char.isPlayer)
  })
  
  // 错误处理
  const handleError = (err, operation = '') => {
    console.error(`Database error in ${operation}:`, err)
    error.value = err.message || err
    return null
  }
  
  const clearError = () => {
    error.value = null
  }
  
  // ==================== 数据库连接 ====================
  
  /**
   * 连接到指定世界的数据库
   * @param {string} worldName - 世界名称
   */
  const connectToWorld = async (worldName) => {
    try {
      loading.value = true
      clearError()
      
      console.log('🔄 开始连接数据库:', worldName)
      
      await database.initDB(worldName)
      
      // 重要：连接成功后立即更新状态
      currentWorld.value = worldName
      isConnected.value = true
      
      console.log('✅ 数据库连接成功，状态已更新:', {
        isConnected: isConnected.value,
        currentWorld: currentWorld.value,
        dbInstance: !!database.getInstance(),
        dbName: database.dbName
      })
      
      // 加载所有数据
      await loadAllData()
      
      // 初始化VectorDB实例
      await initVectorDB()
      
      console.log('🎉 数据库完全初始化完成')
      return true
    } catch (err) {
      console.error('❌ 数据库连接失败:', err)
      handleError(err, 'connectToWorld')
      // 确保失败时重置状态
      isConnected.value = false
      currentWorld.value = ''
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取所有可用的世界
   */
  const getAvailableWorlds = async () => {
    try {
      return await database.getAvailableWorlds()
    } catch (err) {
      handleError(err, 'getAvailableWorlds')
      return []
    }
  }
  
  // ==================== 角色管理 ====================
  
  /**
   * 创建或更新角色
   * @param {Object} characterData - 角色数据
   */
  const saveCharacter = async (characterData) => {
    try {
      loading.value = true
      clearError()
      
      const id = await database.saveCharacter(characterData)
      
      // 更新缓存
      const updatedChar = { ...characterData, id }
      const existingIndex = characters.value.findIndex(char => char.id === id)
      
      if (existingIndex >= 0) {
        characters.value[existingIndex] = updatedChar
      } else {
        characters.value.push(updatedChar)
      }
      
      // 如果设置为主角，更新其他角色的主角状态
      if (characterData.isPlayer) {
        characters.value.forEach(char => {
          if (char.id !== id) {
            char.isPlayer = false
          }
        })
      }
      
      return id
    } catch (err) {
      handleError(err, 'saveCharacter')
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 删除角色
   * @param {number} id - 角色ID
   */
  const deleteCharacter = async (id) => {
    try {
      loading.value = true
      clearError()
      
      await database.deleteCharacter(id)
      
      // 更新缓存
      characters.value = characters.value.filter(char => char.id !== id)
      
      // 删除包含该角色的群组
      groups.value = groups.value.filter(group => !group.characterIds.includes(id))
      
      return true
    } catch (err) {
      handleError(err, 'deleteCharacter')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取角色详情
   * @param {number} id - 角色ID
   */
  const getCharacter = async (id) => {
    try {
      // 先从缓存查找
      const cached = characters.value.find(char => char.id === id)
      if (cached) return cached
      
      // 从数据库获取
      return await database.getCharacterById(id)
    } catch (err) {
      handleError(err, 'getCharacter')
      return null
    }
  }
  
  // ==================== 群组管理 ====================
  
  /**
   * 创建或更新群组
   * @param {Object} groupData - 群组数据
   */
  const saveGroup = async (groupData) => {
    try {
      loading.value = true
      clearError()
      
      const id = await database.saveGroup(groupData)
      
      // 更新缓存
      const updatedGroup = { ...groupData, id }
      const existingIndex = groups.value.findIndex(group => group.id === id)
      
      if (existingIndex >= 0) {
        groups.value[existingIndex] = updatedGroup
      } else {
        groups.value.push(updatedGroup)
      }
      
      return id
    } catch (err) {
      handleError(err, 'saveGroup')
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 删除群组
   * @param {number} id - 群组ID
   */
  const deleteGroup = async (id) => {
    try {
      loading.value = true
      clearError()
      
      await database.deleteGroup(id)
      
      // 更新缓存
      groups.value = groups.value.filter(group => group.id !== id)
      
      return true
    } catch (err) {
      handleError(err, 'deleteGroup')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 获取群组详情
   * @param {number} id - 群组ID
   */
  const getGroup = async (id) => {
    try {
      // 先从缓存查找
      const cached = groups.value.find(group => group.id === id)
      if (cached) return cached
      
      // 从数据库获取
      return await database.getGroupById(id)
    } catch (err) {
      handleError(err, 'getGroup')
      return null
    }
  }
  
  /**
   * 获取群组中的角色列表
   * @param {number} groupId - 群组ID
   */
  const getGroupCharacters = async (groupId) => {
    try {
      const group = await getGroup(groupId)
      if (!group) return []
      
      return group.characterIds
        .map(charId => characters.value.find(char => char.id === charId))
        .filter(Boolean)
    } catch (err) {
      handleError(err, 'getGroupCharacters')
      return []
    }
  }
  
  // ==================== 世界设定管理 ====================
  
  /**
   * 创建或更新世界设定条目
   * @param {Object} worldbookData - 世界设定数据
   */
  const saveWorldbook = async (worldbookData) => {
    try {
      loading.value = true
      clearError()
      
      const id = await database.saveWorldbook(worldbookData)
      
      // 更新缓存
      const updatedEntry = { ...worldbookData, id }
      const existingIndex = worldbooks.value.findIndex(entry => entry.id === id)
      
      if (existingIndex >= 0) {
        worldbooks.value[existingIndex] = updatedEntry
      } else {
        worldbooks.value.push(updatedEntry)
      }
      
      return id
    } catch (err) {
      handleError(err, 'saveWorldbook')
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 删除世界设定条目
   * @param {number} id - 条目ID
   */
  const deleteWorldbook = async (id) => {
    try {
      loading.value = true
      clearError()
      
      await database.deleteWorldbook(id)
      
      // 更新缓存
      worldbooks.value = worldbooks.value.filter(entry => entry.id !== id)
      
      return true
    } catch (err) {
      handleError(err, 'deleteWorldbook')
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 根据关键词搜索相关的世界设定条目
   * @param {string} text - 搜索文本
   */
  const getTriggeredWorldbooks = (text) => {
    const lowerText = text.toLowerCase()
    return worldbooks.value.filter(entry => {
      const keywords = entry.keywords.split(/[,，]/).map(k => k.trim().toLowerCase())
      return keywords.some(keyword => lowerText.includes(keyword))
    })
  }
  
  // ==================== 配置管理 ====================
  
  /**
   * 保存世界配置
   * @param {Object} newConfig - 新配置
   */
  const saveConfig = async (newConfig) => {
    try {
      loading.value = true
      clearError()
      
      await database.saveWorldConfig(newConfig)
      config.value = { ...config.value, ...newConfig }
      
      return true
    } catch (err) {
      handleError(err, 'saveConfig')
      return false
    } finally {
      loading.value = false
    }
  }
  
  // ==================== 聊天历史管理 ====================
  
  /**
   * 获取会话聊天历史
   * @param {string} sessionId - 会话ID
   */
  const getChatHistory = async (sessionId) => {
    try {
      return await database.getChatHistory(sessionId)
    } catch (err) {
      handleError(err, 'getChatHistory')
      return []
    }
  }
  
  /**
   * 保存聊天消息
   * @param {Object} message - 消息对象
   * @returns {Promise<Object|null>} 保存的消息对象
   */
  const saveMessage = async (message) => {
    try {
      const savedMessage = await database.saveMessage(message)
      
      // 自动向量化保存聊天记录（异步执行，不阻塞主流程）
      if (savedMessage && savedMessage.content && savedMessage.content.trim()) {
        saveMessageToVector(savedMessage).catch(error => {
          console.warn('向量化保存失败:', error)
        })
      }
      
      return savedMessage
    } catch (err) {
      handleError(err, 'saveMessage')
      return null
    }
  }
  
  // VectorDB初始化状态锁
  let isInitializingVectorDB = false
  
  /**
   * 初始化VectorDB实例
   * @returns {Promise<boolean>} 初始化是否成功
   */
  const initVectorDB = async () => {
    // 防止重复初始化
    if (isInitializingVectorDB) {
      // 等待当前初始化完成
      while (isInitializingVectorDB) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      return vectorDB.value !== null
    }
    
    // 如果已经有有效实例，直接返回
    if (vectorDB.value && isConnected.value) {
      return true
    }
    
    if (!isConnected.value || !database.dbName) {
      vectorDB.value = null
      return false
    }
    
    isInitializingVectorDB = true
    
    try {
      vectorDB.value = new VectorDB({
        dbName: database.dbName,
        objectStore: 'vector_plugin',
        vectorPath: 'vector',
        version: database.dbVersion
      })
      console.log('VectorDB初始化成功')
      return true
    } catch (error) {
      console.error('VectorDB初始化失败:', error)
      vectorDB.value = null
      return false
    } finally {
      isInitializingVectorDB = false
    }
  }

  /**
   * 保存消息到向量数据库
   * @param {Object} message - 消息对象
   */
  const saveMessageToVector = async (message) => {
    try {
      // 确保VectorDB实例存在
      if (!vectorDB.value) {
        const initialized = await initVectorDB()
        if (!initialized) {
          console.log('VectorDB未初始化，跳过向量化保存')
          return
        }
      }
      
      // 使用AI API创建嵌入向量
      const { createEmbeddings } = useAIApi()
      
      // 创建嵌入向量
      const embedding = await createEmbeddings(message.content)
      
      // 准备向量化数据
      const vectorData = {
        messageId: message.id,
        content: message.content,
        characterName: message.characterName,
        role: message.role,
        timestamp: message.timestamp,
        sessionId: message.sessionId,
        vector: embedding
      }
      
      // 保存到向量数据库
      await vectorDB.value.insert(vectorData)
      console.log('消息向量化保存成功:', message.id)
      
    } catch (error) {
      console.warn('向量化保存失败:', error)
      // 不抛出错误，避免影响主流程
    }
  }
  
  /**
   * 删除会话聊天历史
   * @param {string} sessionId - 会话ID
   */
  const deleteChatHistory = async (sessionId) => {
    try {
      await database.deleteChatHistory(sessionId)
      return true
    } catch (err) {
      handleError(err, 'deleteChatHistory')
      return false
    }
  }
  
  // ==================== 数据导入导出 ====================
  
  /**
   * 导出当前世界数据
   */
  const exportWorld = async () => {
    try {
      loading.value = true
      clearError()
      
      return await database.exportWorld(currentWorld.value)
    } catch (err) {
      handleError(err, 'exportWorld')
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * 导入世界数据
   * @param {Object} worldData - 世界数据
   * @param {string} worldName - 世界名称
   */
  const importWorld = async (worldData, worldName) => {
    try {
      loading.value = true
      clearError()
      
      await database.importWorld(worldData, worldName)
      
      // 如果导入的是当前世界，重新加载数据
      if (worldName === currentWorld.value) {
        await loadAllData()
      }
      
      return true
    } catch (err) {
      handleError(err, 'importWorld')
      return false
    } finally {
      loading.value = false
    }
  }
  
  // ==================== 工具方法 ====================
  
  /**
   * 断开数据库连接
   */
  const disconnect = () => {
    database.close()
    isConnected.value = false
    currentWorld.value = ''
    vectorDB.value = null // 清理VectorDB实例
    characters.value = []
    groups.value = []
    worldbooks.value = []
    config.value = { apiKey: '', apiUrl: '', model: '' }
  }
  
  /**
   * 刷新所有数据
   */
  const refresh = async () => {
    if (isConnected.value) {
      await loadAllData()
    }
  }
  
  /**
   * 手动同步数据库连接状态
   * 用于解决状态不一致问题
   */
  const syncConnectionState = () => {
    const dbInstance = database.getInstance()
    const dbName = database.dbName
    
    const shouldBeConnected = !!(dbInstance && dbName)
    
    if (shouldBeConnected !== isConnected.value) {
      console.log('🔄 同步连接状态:', {
        from: isConnected.value,
        to: shouldBeConnected,
        dbInstance: !!dbInstance,
        dbName: dbName
      })
      
      isConnected.value = shouldBeConnected
      if (shouldBeConnected && dbName) {
        currentWorld.value = dbName.replace(database.dbPrefix, '')
      } else {
        currentWorld.value = ''
      }
    }
    
    return isConnected.value
  }

  return {
    // 数据库实例
    database,
    // 状态
    isConnected,
    currentWorld,
    loading,
    error,
    // 数据
    characters,
    groups,
    worldbooks,
    config,
    // 计算属性
    playerCharacter,
    availableCharacters,
    
    // VectorDB实例和方法
    vectorDB: readonly(vectorDB),
    initVectorDB,
    
    // 状态同步
    syncConnectionState,
    
    // 数据库连接
    connectToWorld,
    getAvailableWorlds,
    disconnect,
    refresh,
    
    // 角色管理
    saveCharacter,
    deleteCharacter,
    getCharacter,
    
    // 群组管理
    saveGroup,
    deleteGroup,
    getGroup,
    getGroupCharacters,
    
    // 世界设定管理
    saveWorldbook,
    deleteWorldbook,
    getTriggeredWorldbooks,
    
    // 配置管理
    saveConfig,
    
    // 聊天历史
    getChatHistory,
    saveMessage,
    deleteChatHistory,
    
    // 导入导出
    exportWorld,
    importWorld,
    
    // 工具方法
    clearError
  }
}