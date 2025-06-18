/**
 * Vue 组合式函数 - 数据库操作
 * 提供响应式的数据库操作接口
 */

import { ref, reactive, computed } from 'vue'
import database from '@/utils/database'

export function useDatabase() {
  // 响应式状态
  const isConnected = ref(false)
  const currentWorld = ref('')
  const loading = ref(false)
  const error = ref(null)
  
  // 数据缓存
  const characters = ref([])
  const groups = ref([])
  const worldbooks = ref([])
  const config = reactive({
    apiKey: '',
    apiUrl: '',
    model: ''
  })
  
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
      
      await database.initDB(worldName)
      currentWorld.value = worldName
      isConnected.value = true
      
      // 加载所有数据
      await loadAllData()
      
      return true
    } catch (err) {
      handleError(err, 'connectToWorld')
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
      Object.assign(config, configData)
      
    } catch (err) {
      handleError(err, 'loadAllData')
    } finally {
      loading.value = false
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
      Object.assign(config, newConfig)
      
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
   */
  const saveMessage = async (message) => {
    try {
      return await database.saveMessage(message)
    } catch (err) {
      handleError(err, 'saveMessage')
      return null
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
    characters.value = []
    groups.value = []
    worldbooks.value = []
    Object.assign(config, { apiKey: '', apiUrl: '', model: '' })
  }
  
  /**
   * 刷新所有数据
   */
  const refresh = async () => {
    if (isConnected.value) {
      await loadAllData()
    }
  }
  
  return {
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