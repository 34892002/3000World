/**
 * Vue 组合式函数 - 数据库操作
 * 提供响应式的数据库操作接口
 */

import { ref, computed, shallowRef } from "vue";
import database from "@/utils/database.js";
import { VectorDB } from "@/utils/vector.js";
import { useAIApi } from "@/api/model";

// 全局共享的响应式状态 - 确保所有组件使用相同的状态实例
const globalState = {
  isConnected: ref(false),
  currentWorld: ref(""),
  loading: ref(false),
  error: ref(null),
  vectorDBInstance: shallowRef(null),
  characters: ref([]),
  groups: ref([]),
  worldbooks: ref([]),
  config: ref({
    apiKey: "",
    apiUrl: "",
    model: "",
  }),
  pluginConfigs: ref({}),
};

// 初始化标志，确保只初始化一次
let isInitialized = false;

export function useDatabase() {
  // ref属性解构赋值不会丢失响应式
  const {
    isConnected,
    currentWorld,
    loading,
    error,
    vectorDBInstance,
    characters,
    groups,
    worldbooks,
    config,
    pluginConfigs,
  } = globalState;

  /**
   * 加载所有数据到缓存
   */
  const loadAllData = async () => {
    try {
      loading.value = true;

      const [charsData, groupsData, worldbooksData, configData, pluginConfigsData] =
        await Promise.all([
          database.getAllCharacters(),
          database.getAllGroups(),
          database.getAllWorldbooks(),
          database.loadWorldConfig(),
          database.getAllPluginConfigs(),
        ]);

      characters.value = charsData;
      groups.value = groupsData;
      worldbooks.value = worldbooksData;
      pluginConfigs.value = pluginConfigsData;

      config.value = { ...config.value, ...configData };
    } catch (err) {
      handleError(err, "loadAllData");
    } finally {
      loading.value = false;
    }
  };

  // 初始化检查 - 只在第一次调用时执行
  if (!isInitialized) {
    isInitialized = true;

    // 自动检测现有连接状态
    const dbInstance = database.getInstance();
    const dbName = database.dbName;

    // 检查数据库实例是否有效且未关闭
    const isDbValid = dbInstance && dbInstance.objectStoreNames !== undefined;
    if (isDbValid && dbName) {
      isConnected.value = true;
      currentWorld.value = dbName.replace(database.dbPrefix, "");

      // 异步加载数据，不阻塞返回
      loadAllData().catch(err => {
        console.error("初始化时加载数据失败:", err);
        handleError(err, "初始化数据加载");
      });
    } else {
      // 确保状态一致性
      isConnected.value = false;
      currentWorld.value = "";
    }
  }

  // 计算属性
  const playerCharacter = computed(() => {
    return characters.value.find((char) => char.isPlayer) || null;
  });

  const availableCharacters = computed(() => {
    return characters.value.filter((char) => !char.isPlayer);
  });

  // 错误处理
  const handleError = (err, context = "") => {
    const errorMessage = err.message || err;
    error.value = context ? `${context}: ${errorMessage}` : errorMessage;
    console.error(`数据库操作错误${context ? ` (${context})` : ""}:`, err);
    return null;
  };

  const clearError = () => {
    error.value = null;
  };

  // ==================== 数据库连接 ====================

  /**
   * 连接到指定世界的数据库
   * @param {string} worldName - 世界名称
   */
  const connectToWorld = async (worldName) => {
    try {
      loading.value = true;
      clearError();

      await database.initDB(worldName);

      // 连接成功后立即更新全局状态
      currentWorld.value = worldName;
      isConnected.value = true;

      // 加载所有数据
      await loadAllData();

      // 初始化VectorDB实例（异步，不阻塞主流程）
      initVectorDB().catch(err => {
        console.warn("VectorDB初始化失败:", err);
      });

      return true;
    } catch (err) {
      handleError(err, "连接世界");
      // 确保失败时重置状态
      isConnected.value = false;
      currentWorld.value = "";
      vectorDBInstance.value = null;
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取所有可用的世界
   */
  const getAvailableWorlds = async () => {
    try {
      return await database.getAvailableWorlds();
    } catch (err) {
      handleError(err, "getAvailableWorlds");
      return [];
    }
  };

  // ==================== 角色管理 ====================

  /**
   * 创建或更新角色
   * @param {Object} characterData - 角色数据
   */
  const saveCharacter = async (characterData) => {
    try {
      loading.value = true;
      clearError();

      const id = await database.saveCharacter(characterData);

      // 更新缓存
      const updatedChar = { ...characterData, id };
      const existingIndex = characters.value.findIndex(
        (char) => char.id === id
      );

      if (existingIndex >= 0) {
        characters.value[existingIndex] = updatedChar;
      } else {
        characters.value.push(updatedChar);
      }

      // 如果设置为主角，更新其他角色的主角状态
      if (characterData.isPlayer) {
        characters.value.forEach((char) => {
          if (char.id !== id) {
            char.isPlayer = false;
          }
        });
      }

      return id;
    } catch (err) {
      handleError(err, "saveCharacter");
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除角色
   * @param {number} id - 角色ID
   */
  const deleteCharacter = async (id) => {
    try {
      loading.value = true;
      clearError();

      await database.deleteCharacter(id);

      // 更新缓存
      characters.value = characters.value.filter((char) => char.id !== id);

      // 删除包含该角色的群组
      groups.value = groups.value.filter(
        (group) => !group.characterIds.includes(id)
      );

      return true;
    } catch (err) {
      handleError(err, "deleteCharacter");
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取角色详情
   * @param {number} id - 角色ID
   */
  const getCharacter = async (id) => {
    try {
      // 先从缓存查找
      const cached = characters.value.find((char) => char.id === id);
      if (cached) return cached;

      // 从数据库获取
      return await database.getCharacterById(id);
    } catch (err) {
      handleError(err, "getCharacter");
      return null;
    }
  };

  // ==================== 群组管理 ====================

  /**
   * 创建或更新群组
   * @param {Object} groupData - 群组数据
   */
  const saveGroup = async (groupData) => {
    try {
      loading.value = true;
      clearError();

      const id = await database.saveGroup(groupData);

      // 更新缓存
      const updatedGroup = { ...groupData, id };
      const existingIndex = groups.value.findIndex((group) => group.id === id);

      if (existingIndex >= 0) {
        groups.value[existingIndex] = updatedGroup;
      } else {
        groups.value.push(updatedGroup);
      }

      return id;
    } catch (err) {
      handleError(err, "saveGroup");
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除群组
   * @param {number} id - 群组ID
   */
  const deleteGroup = async (id) => {
    try {
      loading.value = true;
      clearError();

      await database.deleteGroup(id);

      // 更新缓存
      groups.value = groups.value.filter((group) => group.id !== id);

      return true;
    } catch (err) {
      handleError(err, "deleteGroup");
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取群组详情
   * @param {number} id - 群组ID
   */
  const getGroup = async (id) => {
    try {
      // 先从缓存查找
      const cached = groups.value.find((group) => group.id === id);
      if (cached) return cached;

      // 从数据库获取
      return await database.getGroupById(id);
    } catch (err) {
      handleError(err, "getGroup");
      return null;
    }
  };

  /**
   * 获取群组中的角色列表
   * @param {number} groupId - 群组ID
   */
  const getGroupCharacters = async (groupId) => {
    try {
      const group = await getGroup(groupId);
      if (!group) return [];

      return group.characterIds
        .map((charId) => characters.value.find((char) => char.id === charId))
        .filter(Boolean);
    } catch (err) {
      handleError(err, "getGroupCharacters");
      return [];
    }
  };

  // ==================== 世界设定管理 ====================

  /**
   * 创建或更新世界设定条目
   * @param {Object} worldbookData - 世界设定数据
   */
  const saveWorldbook = async (worldbookData) => {
    try {
      loading.value = true;
      clearError();

      const id = await database.saveWorldbook(worldbookData);

      // 更新缓存
      const updatedEntry = { ...worldbookData, id };
      const existingIndex = worldbooks.value.findIndex(
        (entry) => entry.id === id
      );

      if (existingIndex >= 0) {
        worldbooks.value[existingIndex] = updatedEntry;
      } else {
        worldbooks.value.push(updatedEntry);
      }

      return id;
    } catch (err) {
      handleError(err, "saveWorldbook");
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除世界设定条目
   * @param {number} id - 条目ID
   */
  const deleteWorldbook = async (id) => {
    try {
      loading.value = true;
      clearError();

      await database.deleteWorldbook(id);

      // 更新缓存
      worldbooks.value = worldbooks.value.filter((entry) => entry.id !== id);

      return true;
    } catch (err) {
      handleError(err, "deleteWorldbook");
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根据关键词搜索相关的世界设定条目
   * @param {string} text - 搜索文本
   */
  const getTriggeredWorldbooks = (text) => {
    const lowerText = text.toLowerCase();
    return worldbooks.value.filter((entry) => {
      const keywords = entry.keywords
        .split(/[,，]/)
        .map((k) => k.trim().toLowerCase());
      return keywords.some((keyword) => lowerText.includes(keyword));
    });
  };

  // ==================== 配置管理 ====================

  /**
   * 保存世界配置
   * @param {Object} newConfig - 新配置
   */
  const saveConfig = async (newConfig) => {
    try {
      loading.value = true;
      clearError();

      await database.saveWorldConfig(newConfig);
      config.value = { ...config.value, ...newConfig };

      return true;
    } catch (err) {
      handleError(err, "saveConfig");
      return false;
    } finally {
      loading.value = false;
    }
  };

  // ==================== 聊天历史管理 ====================

  /**
   * 获取会话聊天历史
   * @param {string} sessionId - 会话ID
   */
  const getChatHistory = async (sessionId) => {
    try {
      return await database.getChatHistory(sessionId);
    } catch (err) {
      handleError(err, "getChatHistory");
      return [];
    }
  };

  /**
   * 保存聊天消息
   * @param {Object} message - 消息对象
   * @returns {Promise<Object|null>} 保存的消息对象
   */
  const saveMessage = async (message) => {
    try {
      const savedMessage = await database.saveMessage(message);

      // 自动向量化保存聊天记录（异步执行，不阻塞主流程）
      if (savedMessage && savedMessage.content && savedMessage.content.trim()) {
        saveMessageToVector(savedMessage).catch(() => {
          console.error("向量化保存聊天记录失败:", err);
          // 向量化保存失败，静默处理
        });
      }

      return savedMessage;
    } catch (err) {
      handleError(err, "saveMessage");
      return null;
    }
  };

  // VectorDB初始化Promise缓存
  let initVectorDBPromise = null;

  /**
   * 初始化VectorDB实例
   * @returns {Promise<boolean>} 初始化是否成功
   */
  const initVectorDB = async () => {
    // 如果已经有有效实例，直接返回
    if (vectorDBInstance.value && isConnected.value) {
      return true;
    }

    // 如果正在初始化，返回缓存的Promise
    if (initVectorDBPromise) {
      return await initVectorDBPromise;
    }

    if (!isConnected.value || !database.dbName) {
      vectorDBInstance.value = null;
      return false;
    }

    // 创建并缓存初始化Promise
    initVectorDBPromise = (async () => {
      try {
        // 检查数据库实例
        const dbInstance = database.getInstance();
        if (!dbInstance) {
          throw new Error("数据库实例获取失败");
        }

        // 检查对象存储是否存在
        if (!dbInstance.objectStoreNames.contains("vector_plugin")) {
          return false;
        }

        // 直接创建VectorDB实例，使用现有数据库连接
        vectorDBInstance.value = new VectorDB({
          objectStore: "vector_plugin",
          vectorPath: "vector",
          existingDB: dbInstance, // 复用现有数据库实例
        });

        return true;
      } catch (error) {
        vectorDBInstance.value = null;
        return false;
      } finally {
        // 清理Promise缓存，允许下次重新初始化
        initVectorDBPromise = null;
      }
    })();

    return await initVectorDBPromise;
  };

  /**
   * 保存消息到向量数据库
   * @param {Object} message - 消息对象
   */
  const saveMessageToVector = async (message) => {
    try {
      const vectorConfig = await getPluginConfig('vector');
      if (!vectorConfig?.enabled) return;
      // 确保VectorDB实例存在
      if (!vectorDBInstance.value) {
        const initialized = await initVectorDB();
        if (!initialized) {
          return;
        }
      }

      // 使用AI API创建嵌入向量
      const { createEmbeddings } = useAIApi();

      // 创建嵌入向量
      const embedding = await createEmbeddings(message.content);

      // 准备向量化数据
      const vectorData = {
        messageId: message.id,
        content: message.content,
        characterName: message.characterName,
        role: message.role,
        timestamp: message.timestamp,
        sessionId: message.sessionId,
        vector: embedding,
      };

      // 保存到向量数据库
      await vectorDBInstance.value.insert(vectorData);
    } catch (error) {
      // 向量化保存失败，静默处理
      // 不抛出错误，避免影响主流程
    }
  };

  /**
   * 删除会话聊天历史
   * @param {string} sessionId - 会话ID
   */
  const deleteChatHistory = async (sessionId) => {
    try {
      await database.deleteChatHistory(sessionId);
      return true;
    } catch (err) {
      handleError(err, "deleteChatHistory");
      return false;
    }
  };

  // ==================== 数据导入导出 ====================

  /**
   * 导出当前世界数据
   */
  const exportWorld = async () => {
    try {
      loading.value = true;
      clearError();

      return await database.exportWorld(currentWorld.value);
    } catch (err) {
      handleError(err, "exportWorld");
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 导入世界数据
   * @param {Object} worldData - 世界数据
   * @param {string} worldName - 世界名称
   */
  const importWorld = async (worldData, worldName) => {
    try {
      loading.value = true;
      clearError();

      await database.importWorld(worldData, worldName);

      // 如果导入的是当前世界，重新加载数据
      if (worldName === currentWorld.value) {
        await loadAllData();
      }

      return true;
    } catch (err) {
      handleError(err, "importWorld");
      return false;
    } finally {
      loading.value = false;
    }
  };

  // ==================== 插件配置管理 ====================

  /**
   * 保存插件配置
   * @param {string} key - 插件配置键名
   * @param {Object} config - 插件配置对象
   */
  const savePluginConfig = async (key, config) => {
    try {
      loading.value = true;
      clearError();

      await database.savePluginConfig(key, config);
      
      // 更新本地缓存
      pluginConfigs.value[key] = config;

      return true;
    } catch (err) {
      handleError(err, "savePluginConfig");
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取插件配置
   * @param {string} key - 插件配置键名
   * @returns {Object|null}
   */
  const getPluginConfig = async (key) => {
    try {
      clearError();

      // 先从缓存中获取
      if (pluginConfigs.value[key]) {
        return pluginConfigs.value[key];
      }

      // 从数据库获取
      const config = await database.getPluginConfig(key);
      if (config) {
        pluginConfigs.value[key] = config;
      }
      
      return config;
    } catch (err) {
      handleError(err, "getPluginConfig");
      return null;
    }
  };

  /**
   * 删除插件配置
   * @param {string} key - 插件配置键名
   */
  const deletePluginConfig = async (key) => {
    try {
      loading.value = true;
      clearError();

      await database.deletePluginConfig(key);
      
      // 从本地缓存中删除
      delete pluginConfigs.value[key];

      return true;
    } catch (err) {
      handleError(err, "deletePluginConfig");
      return false;
    } finally {
      loading.value = false;
    }
  };

  // ==================== 工具方法 ====================

  /**
   * 断开数据库连接
   */
  const disconnect = () => {
    database.close();
    isConnected.value = false;
    currentWorld.value = "";
    vectorDBInstance.value = null; // 清理VectorDB实例
    characters.value = [];
    groups.value = [];
    worldbooks.value = [];
    config.value = { apiKey: "", apiUrl: "", model: "" };
  };

  /**
   * 刷新所有数据
   */
  const refresh = async () => {
    if (isConnected.value) {
      await loadAllData();
    }
  };

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
    pluginConfigs,
    // 计算属性
    playerCharacter,
    availableCharacters,

    // 必须使用shallowRef，否则会报错
    // VectorDB实例和方法
    vectorDB: vectorDBInstance,
    initVectorDB,
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

    // 插件配置管理
    savePluginConfig,
    getPluginConfig,
    deletePluginConfig,

    // 聊天历史
    getChatHistory,
    saveMessage,
    deleteChatHistory,

    // 导入导出
    exportWorld,
    importWorld,

    // 工具方法
    clearError,
  };
}
