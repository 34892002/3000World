/**
 * 3000World 数据库工具类
 * 基于 IndexedDB 的数据存储和管理
 */

class Database {
  constructor() {
    this.db = null;
    this.dbName = null;
    this.dbVersion = 5;
    this.dbPrefix = '3000World_';
  }

  /**
   * 获取数据库实例
   * @returns {IDBDatabase} 数据库实例
   */
  getInstance() {
    return this.db;
  }

  /**
   * 验证世界名称是否合法
   * @param {string} worldName - 世界名称
   * @returns {Object} 验证结果 {valid: boolean, error: string}
   */
  validateWorldName(worldName) {
    // 检查是否为空或未定义
    if (!worldName || typeof worldName !== 'string') {
      return {
        valid: false,
        error: 'Must be a string'
      };
    }
    
    // 检查长度限制（最大20字符）
    if (worldName.length === 0) {
      return {
        valid: false,
        error: 'cannot be empty'
      };
    }
    
    if (worldName.length > 20) {
      return {
        valid: false,
        error: `Maximum 20 characters, length: ${worldName.length}`
      };
    }
    
    // 允许各国文字和数字，禁止所有符号
    // \p{L} 匹配所有Unicode字母字符（包括中文、英文、日文、韩文、阿拉伯文等）
    // \p{N} 匹配所有Unicode数字字符
    const validChars = /^[\p{L}\p{N}]+$/u;
    if (!validChars.test(worldName)) {
      return {
        valid: false,
        error: 'symbols or special characters'
      };
    }
    
    return {
      valid: true,
      error: null
    };
  }

  /**
   * 初始化数据库连接
   * @param {string} worldName - 世界名称
   * @returns {Promise<IDBDatabase>}
   */
  async initDB(worldName) {
    // 验证世界名称
    const validation = this.validateWorldName(worldName);
    if (!validation.valid) {
      throw new Error(`Name verification failed: ${validation.error}`);
    }
    
    const dbName = `${this.dbPrefix}${worldName}`;
    this.dbName = dbName;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, this.dbVersion);
      
      request.onerror = e => reject(`Database error: ${e.target.error}`);
      
      request.onupgradeneeded = e => {
        const db = e.target.result;
        
        // 创建角色表
        if (!db.objectStoreNames.contains('characters')) {
          db.createObjectStore('characters', { keyPath: 'id', autoIncrement: true });
        }
        
        // 创建世界设定表
        if (!db.objectStoreNames.contains('worldbooks')) {
          db.createObjectStore('worldbooks', { keyPath: 'id', autoIncrement: true });
        }
        
        // 创建群组表
        if (!db.objectStoreNames.contains('groups')) {
          db.createObjectStore('groups', { keyPath: 'id', autoIncrement: true });
        }
        
        // 创建配置表
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config');
        }
        
        // 重建聊天历史表（如果存在则删除重建）
        if (db.objectStoreNames.contains('chat_history')) {
          db.deleteObjectStore('chat_history');
        }
        const chatStore = db.createObjectStore('chat_history', { keyPath: 'id', autoIncrement: true });
        chatStore.createIndex('sessionId', 'sessionId', { unique: false });
        
        // 创建插件数据表
        if (!db.objectStoreNames.contains('vector_plugin')) {
          const vectorStore = db.createObjectStore('vector_plugin', { keyPath: 'id', autoIncrement: true });
          vectorStore.createIndex('messageId', 'messageId', { unique: true });
          vectorStore.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('Created vector_plugin table with indexes');
        }
        
        // 创建插件配置表
        if (!db.objectStoreNames.contains('plugins')) {
          const pluginsStore = db.createObjectStore('plugins', { keyPath: 'key' });
          console.log('Created plugins table');
        }
      };
      
      request.onsuccess = e => {
        this.db = e.target.result;
        console.log(`Successfully connected to world: ${dbName}`);
        resolve(this.db);
      };
    });
  }

  /**
   * 获取对象存储
   * @param {string} storeName - 存储名称
   * @param {string} mode - 访问模式 ('readonly' | 'readwrite')
   * @returns {IDBObjectStore}
   */
  getStore(storeName, mode = 'readonly') {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db.transaction(storeName, mode).objectStore(storeName);
  }

  /**
   * 获取所有可用的世界数据库
   * @returns {Promise<Array>}
   */
  async getAvailableWorlds() {
    if (!window.indexedDB.databases) {
      return [];
    }
    
    const databases = await window.indexedDB.databases();
    return databases
      .filter(db => db.name.startsWith(this.dbPrefix))
      .map(db => db.name.replace(this.dbPrefix, ''));
  }

  // ==================== 配置管理 ====================

  /**
   * 加载世界配置
   * @returns {Promise<Object>}
   */
  async loadWorldConfig() {
    const store = this.getStore('config', 'readonly');
    const [apiKeyReq, apiUrlReq, modelReq] = [
      store.get('apiKey'),
      store.get('apiUrl'),
      store.get('model')
    ];

    const apiKey = await new Promise(r => {
      apiKeyReq.onsuccess = () => r(apiKeyReq.result);
      apiKeyReq.onerror = () => r(undefined);
    });
    
    const apiUrl = await new Promise(r => {
      apiUrlReq.onsuccess = () => r(apiUrlReq.result);
      apiUrlReq.onerror = () => r(undefined);
    });
    
    const model = await new Promise(r => {
      modelReq.onsuccess = () => r(modelReq.result);
      modelReq.onerror = () => r(undefined);
    });

    if (apiKey === undefined || apiUrl === undefined || model === undefined) {
      const defaultConfig = {
        apiKey: '',
        apiUrl: 'https://text.pollinations.ai/openai',
        model: 'openai'
      };
      
      await this.saveWorldConfig(defaultConfig);
      return defaultConfig;
    }
    
    return { apiKey, apiUrl, model };
  }

  /**
   * 保存世界配置
   * @param {Object} config - 配置对象
   * @returns {Promise<void>}
   */
  async saveWorldConfig(config) {
    const store = this.getStore('config', 'readwrite');
    store.put(config.apiKey, 'apiKey');
    store.put(config.apiUrl, 'apiUrl');
    store.put(config.model, 'model');
    
    return new Promise(resolve => {
      store.transaction.oncomplete = resolve;
    });
  }

  // ==================== 角色管理 ====================

  /**
   * 获取所有角色
   * @returns {Promise<Array>}
   */
  async getAllCharacters() {
    return new Promise(resolve => {
      this.getStore('characters', 'readonly').getAll().onsuccess = e => {
        resolve(e.target.result);
      };
    });
  }

  /**
   * 根据ID获取角色
   * @param {number} id - 角色ID
   * @returns {Promise<Object|null>}
   */
  async getCharacterById(id) {
    return new Promise(resolve => {
      this.getStore('characters', 'readonly').get(id).onsuccess = e => {
        resolve(e.target.result || null);
      };
    });
  }

  /**
   * 保存角色
   * @param {Object} character - 角色数据
   * @returns {Promise<number>} 角色ID
   */
  async saveCharacter(character) {
    // 如果设置为主角，先清除其他主角设置
    if (character.isPlayer) {
      const allChars = await this.getAllCharacters();
      const playerChars = allChars.filter(char => 
        char.isPlayer && (!character.id || char.id !== character.id)
      );
      
      // 使用新的事务来更新其他角色
      for (const char of playerChars) {
        char.isPlayer = false;
        await new Promise(resolve => {
          const store = this.getStore('characters', 'readwrite');
          store.put(char).onsuccess = resolve;
        });
      }
    }
    
    // 使用新的事务来保存当前角色
    return new Promise(resolve => {
      const store = this.getStore('characters', 'readwrite');
      const request = character.id ? store.put(character) : store.add(character);
      request.onsuccess = e => {
        resolve(character.id || e.target.result);
      };
    });
  }

  /**
   * 删除角色
   * @param {number} id - 角色ID
   * @returns {Promise<void>}
   */
  async deleteCharacter(id) {
    // 删除角色
    await new Promise(resolve => {
      this.getStore('characters', 'readwrite').delete(id).onsuccess = resolve;
    });
    
    // 删除包含该角色的群组
    const groups = await this.getAllGroups();
    for (const group of groups.filter(g => g.characterIds.includes(id))) {
      await this.deleteGroup(group.id);
    }
    
    // 删除相关聊天历史
    await this.deleteChatHistory(`char_${id}`);
  }

  // ==================== 群组管理 ====================

  /**
   * 获取所有群组
   * @returns {Promise<Array>}
   */
  async getAllGroups() {
    return new Promise(resolve => {
      this.getStore('groups', 'readonly').getAll().onsuccess = e => {
        resolve(e.target.result);
      };
    });
  }

  /**
   * 根据ID获取群组
   * @param {number} id - 群组ID
   * @returns {Promise<Object|null>}
   */
  async getGroupById(id) {
    return new Promise(resolve => {
      this.getStore('groups', 'readonly').get(id).onsuccess = e => {
        resolve(e.target.result || null);
      };
    });
  }

  /**
   * 保存群组
   * @param {Object} group - 群组数据
   * @returns {Promise<number>} 群组ID
   */
  async saveGroup(group) {
    // 确保 characterIds 是普通数组而不是响应式对象
    const groupData = {
      ...group,
      characterIds: Array.isArray(group.characterIds) ? [...group.characterIds] : []
    };
    
    return new Promise(resolve => {
      const store = this.getStore('groups', 'readwrite');
      const request = groupData.id ? store.put(groupData) : store.add(groupData);
      request.onsuccess = e => {
        resolve(groupData.id || e.target.result);
      };
    });
  }

  /**
   * 删除群组
   * @param {number} id - 群组ID
   * @returns {Promise<void>}
   */
  async deleteGroup(id) {
    await new Promise(resolve => {
      this.getStore('groups', 'readwrite').delete(id).onsuccess = resolve;
    });
    
    // 删除相关聊天历史
    await this.deleteChatHistory(`group_${id}`);
  }

  // ==================== 世界设定管理 ====================

  /**
   * 获取所有世界设定条目
   * @returns {Promise<Array>}
   */
  async getAllWorldbooks() {
    return new Promise(resolve => {
      this.getStore('worldbooks', 'readonly').getAll().onsuccess = e => {
        resolve(e.target.result);
      };
    });
  }

  /**
   * 根据ID获取世界设定条目
   * @param {number} id - 条目ID
   * @returns {Promise<Object|null>}
   */
  async getWorldbookById(id) {
    return new Promise(resolve => {
      this.getStore('worldbooks', 'readonly').get(id).onsuccess = e => {
        resolve(e.target.result || null);
      };
    });
  }

  /**
   * 保存世界设定条目
   * @param {Object} worldbook - 世界设定数据
   * @returns {Promise<number>} 条目ID
   */
  async saveWorldbook(worldbook) {
    return new Promise(resolve => {
      const store = this.getStore('worldbooks', 'readwrite');
      const request = worldbook.id ? store.put(worldbook) : store.add(worldbook);
      request.onsuccess = e => {
        resolve(worldbook.id || e.target.result);
      };
    });
  }

  /**
   * 删除世界设定条目
   * @param {number} id - 条目ID
   * @returns {Promise<void>}
   */
  async deleteWorldbook(id) {
    return new Promise(resolve => {
      this.getStore('worldbooks', 'readwrite').delete(id).onsuccess = resolve;
    });
  }

  // ==================== 聊天历史管理 ====================

  /**
   * 获取会话聊天历史
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Array>}
   */
  async getChatHistory(sessionId) {
    return new Promise(resolve => {
      this.getStore('chat_history', 'readonly')
        .index('sessionId')
        .getAll(sessionId)
        .onsuccess = e => {
          resolve(e.target.result);
        };
    });
  }

  /**
   * 保存聊天消息
   * @param {Object} message - 消息对象
   * @returns {Promise<Object>} 完整的消息对象（包含ID）
   */
  async saveMessage(message) {
    const messageData = {
      ...message,
      timestamp: new Date()
    };
    
    return new Promise(resolve => {
      this.getStore('chat_history', 'readwrite').add(messageData).onsuccess = e => {
        const savedMessage = {
          ...messageData,
          id: e.target.result
        };
        resolve(savedMessage);
      };
    });
  }

  /**
   * 删除会话聊天历史
   * @param {string} sessionId - 会话ID
   * @returns {Promise<void>}
   */
  async deleteChatHistory(sessionId) {
    return new Promise(resolve => {
      const index = this.getStore('chat_history', 'readwrite').index('sessionId');
      const request = index.openCursor(IDBKeyRange.only(sessionId));
      
      request.onsuccess = e => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  }

  // ==================== 插件配置管理 ====================

  /**
   * 保存插件配置
   * @param {string} key - 插件配置键名
   * @param {Object} config - 插件配置对象
   * @returns {Promise<void>}
   */
  async savePluginConfig(key, config) {
    return new Promise(resolve => {
      this.getStore('plugins', 'readwrite').put({ key, ...config }).onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * 获取插件配置
   * @param {string} key - 插件配置键名
   * @returns {Promise<Object|null>}
   */
  async getPluginConfig(key) {
    return new Promise(resolve => {
      this.getStore('plugins', 'readonly').get(key).onsuccess = e => {
        const result = e.target.result;
        if (result) {
          const { key: configKey, ...config } = result;
          resolve(config);
        } else {
          resolve(null);
        }
      };
    });
  }

  /**
   * 获取所有插件配置
   * @returns {Promise<Object>}
   */
  async getAllPluginConfigs() {
    return new Promise(resolve => {
      this.getStore('plugins', 'readonly').getAll().onsuccess = e => {
        const configs = {};
        e.target.result.forEach(item => {
          const { key, ...config } = item;
          configs[key] = config;
        });
        resolve(configs);
      };
    });
  }

  /**
   * 删除插件配置
   * @param {string} key - 插件配置键名
   * @returns {Promise<void>}
   */
  async deletePluginConfig(key) {
    return new Promise(resolve => {
      this.getStore('plugins', 'readwrite').delete(key).onsuccess = () => {
        resolve();
      };
    });
  }

  // ==================== 数据导入导出 ====================

  /**
   * 导出世界数据
   * @param {string} worldName - 世界名称
   * @returns {Promise<Object>}
   */
  async exportWorld(worldName) {
    const [characters, groups, worldbooks, config] = await Promise.all([
      this.getAllCharacters(),
      this.getAllGroups(),
      this.getAllWorldbooks(),
      this.loadWorldConfig()
    ]);
    
    return {
      worldName,
      characters,
      groups,
      worldbooks,
      config,
      exportDate: new Date().toISOString()
    };
  }

  /**
   * 导入世界数据
   * @param {Object} worldData - 世界数据
   * @param {string} worldName - 世界名称
   * @returns {Promise<void>}
   */
  async importWorld(worldData, worldName) {
    // 初始化新数据库
    await this.initDB(worldName);
    
    // 导入角色数据
    if (worldData.characters && worldData.characters.length > 0) {
      const charStore = this.getStore('characters', 'readwrite');
      for (const char of worldData.characters) {
        const { id, ...charData } = char; // 移除原ID，让数据库自动生成新ID
        charStore.add(charData);
      }
    }
    
    // 导入群组数据
    if (worldData.groups && worldData.groups.length > 0) {
      const groupStore = this.getStore('groups', 'readwrite');
      for (const group of worldData.groups) {
        const { id, ...groupData } = group;
        groupStore.add(groupData);
      }
    }
    
    // 导入世界设定数据
    if (worldData.worldbooks && worldData.worldbooks.length > 0) {
      const worldStore = this.getStore('worldbooks', 'readwrite');
      for (const entry of worldData.worldbooks) {
        const { id, ...entryData } = entry;
        worldStore.add(entryData);
      }
    }
    
    // 导入配置数据
    if (worldData.config) {
      await this.saveWorldConfig(worldData.config);
    }
    
    // 等待所有操作完成
    return new Promise(resolve => {
      const transaction = this.db.transaction(['characters', 'groups', 'worldbooks', 'config'], 'readwrite');
      transaction.oncomplete = resolve;
    });
  }

  /**
   * 关闭数据库连接
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbName = null; // 重要：清理数据库名称，确保状态一致性
    }
  }
}

// 创建单例实例
const database = new Database();

export default database;

// 导出类以便需要时创建新实例
export { Database };