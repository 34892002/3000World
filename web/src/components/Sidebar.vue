<template>
  <div class="sidebar" :class="{ 'sidebar-mobile-open': sidebarOpen }">
    <!-- <p class="text-black">{{ activeTab }} {{ filteredPrivateChats }}</p> -->
    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-info">
        <div class="user-avatar">
          <img :src="userAvatar" :alt="t('chat.user.avatar')" />
          <div class="status-indicator online"></div>
        </div>
        <div class="user-details">
          <h3 class="user-name">{{ userName }}</h3>
          <p class="user-status">{{ t('chat.user.online') }}</p>
        </div>
      </div>
      <button class="settings-btn" @click="showSettings = true" :title="t('chat.settings.title')">
        <span class="icon">⚙️</span>
      </button>
    </div>

    <!-- 功能导航 -->
    <div class="nav-tabs">
      <button v-for="tab in navTabs" :key="tab.key" :class="['nav-tab', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key">
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ t(tab.label) }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input v-model="props.searchQuery" :placeholder="getSearchPlaceholder()" class="search-input" />
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="sidebar-content">
      <!-- 私聊列表 -->
      <div v-if="props.activeTab === 'private'" class="content-section">
        <div class="section-header">
          <h4>{{ t('chat.tabs.private') }}</h4>
          <button class="add-btn" @click="showCreateDialog('private')">
            <span>➕</span>
          </button>
        </div>
        <div class="chat-list">
          <div v-for="chat in filteredPrivateChats" :key="chat.id"
            :class="['chat-item', { active: selectedChatId === chat.id && chatType === 'private' }]"
            @click="selectChat(chat.id, 'private')">
            <div class="chat-avatar">
              <img :src="chat.avatar" :alt="chat.name" />
              <div v-if="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</div>
            </div>
            <div class="chat-info">
              <h5 class="chat-name">{{ chat.name }}</h5>
              <p class="chat-preview">{{ formatLastMessage(chat.lastMessage) }}</p>
            </div>
            <div class="chat-meta">
              <span class="chat-time">{{ formatTime(chat.lastMessageTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 群聊列表 -->
      <div v-if="activeTab === 'group'" class="content-section">
        <div class="section-header">
          <h4>{{ t('chat.tabs.group') }}</h4>
          <button class="add-btn" @click="showCreateDialog('group')">
            <span>➕</span>
          </button>
        </div>
        <div class="chat-list">
          <div v-for="chat in filteredGroupChats" :key="chat.id"
            :class="['chat-item', { active: selectedChatId === chat.id && chatType === 'group' }]"
            @click="selectChat(chat.id, 'group')">
            <div class="chat-avatar group-avatar">
              <img :src="chat.avatar" :alt="chat.name" />
              <div v-if="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</div>
            </div>
            <div class="chat-info">
              <h5 class="chat-name">{{ chat.name }}</h5>
              <p class="chat-preview">{{ formatLastMessage(chat.lastMessage) }}</p>
              <span class="member-count">{{ chat.memberCount }} {{ t('chat.group.membersLabel') }}</span>
            </div>
            <div class="chat-meta">
              <span class="chat-time">{{ formatTime(chat.lastMessageTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色卡片 -->
      <div v-if="activeTab === 'characters'" class="content-section">
        <div class="section-header">
          <h4>{{ t('chat.characters.title') }}</h4>
          <button class="add-btn" @click="openCharacterEditor()">
            <span>➕</span>
          </button>
        </div>
        <div class="character-grid">
          <div v-for="character in filteredCharacters" :key="character.id" class="character-card"
            @click="selectCharacter(character.id)">
            <div class="character-avatar">
              <img :src="character.avatar" :alt="character.name" />
            </div>
            <h5 class="character-name">{{ character.name }}</h5>
            <p class="character-desc">{{ character.description }}</p>
            <div class="character-actions">
              <button class="edit-btn" @click.stop="openCharacterEditor(character)">
                ✏️
              </button>
              <button class="delete-btn" @click.stop="deleteCharacter(character.id)">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 世界设定集 -->
      <div v-if="activeTab === 'worldbook'" class="content-section">
        <div class="section-header">
          <h4>{{ t('chat.worldbook.title') }}</h4>
          <button class="add-btn" @click="showCreateDialog('worldbook')">
            <span>➕</span>
          </button>
        </div>
        <div class="worldbook-list">
          <div v-for="entry in filteredWorldbook" :key="entry.id" class="worldbook-item"
            @click="selectWorldbookEntry(entry.id)">
            <div class="worldbook-icon">📖</div>
            <div class="worldbook-info">
              <h5 class="worldbook-title">{{ entry.title }}</h5>
              <p class="worldbook-desc">{{ entry.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 世界配置 -->
      <div v-if="activeTab === 'settings'" class="content-section">
        <div class="section-header">
          <h4>{{ t('chat.worldSettings.title') }}</h4>
        </div>
        <div class="settings-list">
          <div class="setting-item" @click="openWorldConfig">
            <div class="setting-icon">🌍</div>
            <div class="setting-info">
              <h5>{{ t('chat.worldSettings.config') }}</h5>
              <p>{{ t('chat.worldSettings.configDesc') }}</p>
            </div>
          </div>
          <div class="setting-item" @click="openApiConfig">
            <div class="setting-icon">🔧</div>
            <div class="setting-info">
              <h5>{{ t('chat.worldSettings.api') }}</h5>
              <p>{{ t('chat.worldSettings.apiDesc') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// 组件属性
const props = defineProps({
  sidebarOpen: {
    type: Boolean,
    default: false
  },
  activeTab: {
    type: String,
    default: 'private'
  },
  searchQuery: {
    type: String,
    default: ''
  },
  selectedChatId: {
    type: [String, Number],
    default: null
  },
  chatType: {
    type: String,
    default: 'private'
  },
  userName: {
    type: String,
    default: '用户名'
  },
  userAvatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
  },
  navTabs: {
    type: Array,
    default: () => []
  },
  privateChats: {
    type: Array,
    default: () => []
  },
  groupChats: {
    type: Array,
    default: () => []
  },
  characters: {
    type: Array,
    default: () => []
  },
  worldbookEntries: {
    type: Array,
    default: () => []
  }
})

// 组件事件
const emit = defineEmits([
  'open-settings',
  'tab-change',
  'search-change',
  'create-dialog',
  'select-chat',
  'select-character',
  'select-worldbook-entry',
  'open-character-editor',
  'delete-character',
  'open-world-config',
  'open-api-config'
])

// 响应式状态
const showSettings = ref(false)
const localSearchQuery = ref(props.searchQuery || '')
const isLoading = ref(false)

// 监听搜索查询变化
watch(() => props.searchQuery, (newValue) => {
  localSearchQuery.value = newValue
})

// 监听本地搜索查询变化并发出事件
watch(localSearchQuery, (newValue) => {
  emit('search-change', newValue)
})

/**
 * 处理设置按钮点击
 */
const handleSettingsClick = () => {
  showSettings.value = true
  emit('open-settings')
}

/**
 * 处理标签页切换
 * @param {string} tabKey - 标签页键值
 */
const handleTabChange = (tabKey) => {
  if (tabKey !== props.activeTab) {
    emit('tab-change', tabKey)
    // 切换标签页时清空搜索
    localSearchQuery.value = ''
  }
}

/**
 * 处理搜索输入
 * @param {Event} event - 输入事件
 */
const handleSearchInput = (event) => {
  localSearchQuery.value = event.target.value
}

/**
 * 显示创建对话框
 * @param {string} type - 创建类型
 */
const showCreateDialog = (type) => {
  emit('create-dialog', type)
}

/**
 * 选择聊天
 * @param {string|number} chatId - 聊天ID
 * @param {string} type - 聊天类型
 */
const selectChat = (chatId, type) => {
  if (chatId && type) {
    emit('select-chat', { chatId, type })
  }
}

/**
 * 选择角色
 * @param {string|number} characterId - 角色ID
 */
const selectCharacter = (characterId) => {
  if (characterId) {
    emit('select-character', characterId)
  }
}

/**
 * 选择世界设定条目
 * @param {string|number} entryId - 条目ID
 */
const selectWorldbookEntry = (entryId) => {
  if (entryId) {
    emit('select-worldbook-entry', entryId)
  }
}

/**
 * 打开角色编辑器
 * @param {Object} character - 角色对象（可选）
 */
const openCharacterEditor = (character = null) => {
  emit('open-character-editor', character)
}

/**
 * 删除角色
 * @param {string|number} characterId - 角色ID
 */
const deleteCharacter = (characterId) => {
  if (characterId && confirm(t('chat.characters.deleteConfirm'))) {
    emit('delete-character', characterId)
  }
}

/**
 * 打开世界配置
 */
const openWorldConfig = () => {
  emit('open-world-config')
}

/**
 * 打开API配置
 */
const openApiConfig = () => {
  emit('open-api-config')
}

/**
 * 获取搜索框占位符文本
 */
const getSearchPlaceholder = () => {
  const placeholders = {
    private: t('chat.search.private'),
    group: t('chat.search.group'),
    characters: t('chat.search.characters'),
    worldbook: t('chat.search.worldbook'),
    settings: t('chat.search.settings')
  }
  return placeholders[props.activeTab] || t('chat.search.default')
}

/**
 * 过滤后的私聊列表
 */
const filteredPrivateChats = computed(() => {
  if (!localSearchQuery.value) return props.privateChats
  const query = localSearchQuery.value.toLowerCase().trim()
  return props.privateChats.filter(chat => {
    if (!chat || !chat.name) return false
    return chat.name.toLowerCase().includes(query) ||
           (chat.lastMessage && chat.lastMessage.toLowerCase().includes(query))
  })
})

/**
 * 过滤后的群聊列表
 */
const filteredGroupChats = computed(() => {
  if (!localSearchQuery.value) return props.groupChats
  const query = localSearchQuery.value.toLowerCase().trim()
  return props.groupChats.filter(chat => {
    if (!chat || !chat.name) return false
    return chat.name.toLowerCase().includes(query) ||
           (chat.lastMessage && chat.lastMessage.toLowerCase().includes(query))
  })
})

/**
 * 过滤后的角色列表
 */
const filteredCharacters = computed(() => {
  if (!localSearchQuery.value) return props.characters
  const query = localSearchQuery.value.toLowerCase().trim()
  return props.characters.filter(character => {
    if (!character || !character.name) return false
    return character.name.toLowerCase().includes(query) ||
           (character.description && character.description.toLowerCase().includes(query))
  })
})

/**
 * 过滤后的世界设定条目列表
 */
const filteredWorldbook = computed(() => {
  if (!localSearchQuery.value) return props.worldbookEntries
  const query = localSearchQuery.value.toLowerCase().trim()
  return props.worldbookEntries.filter(entry => {
    if (!entry || !entry.title) return false
    return entry.title.toLowerCase().includes(query) ||
           (entry.description && entry.description.toLowerCase().includes(query))
  })
})

/**
 * 格式化最后一条消息
 * @param {string} message - 消息内容
 * @returns {string} 格式化后的消息
 */
const formatLastMessage = (message) => {
  if (!message || typeof message !== 'string') return ''
  const maxLength = 30
  return message.length > maxLength ? message.substring(0, maxLength) + '...' : message
}

/**
 * 格式化时间显示
 * @param {string|Date} time - 时间
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (time) => {
  if (!time) return ''
  
  try {
    const now = new Date()
    const messageTime = new Date(time)
    
    // 检查时间是否有效
    if (isNaN(messageTime.getTime())) return ''
    
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60))

    if (diffInMinutes < 1) return t('chat.time.justNow')
    if (diffInMinutes < 60) return t('chat.time.minutesAgo', { minutes: diffInMinutes })
    if (diffInMinutes < 1440) return t('chat.time.hoursAgo', { hours: Math.floor(diffInMinutes / 60) })
    
    // 超过一天显示日期
    return messageTime.toLocaleDateString()
  } catch (error) {
    console.warn('时间格式化错误:', error)
    return ''
  }
}

/**
 * 检查是否有未读消息
 * @param {Array} chats - 聊天列表
 * @returns {number} 未读消息总数
 */
const getTotalUnreadCount = (chats) => {
  if (!Array.isArray(chats)) return 0
  return chats.reduce((total, chat) => {
    return total + (chat?.unreadCount || 0)
  }, 0)
}

/**
 * 获取标签页徽章数量
 * @param {string} tabKey - 标签页键值
 * @returns {number} 徽章数量
 */
const getTabBadgeCount = (tabKey) => {
  switch (tabKey) {
    case 'private':
      return getTotalUnreadCount(props.privateChats)
    case 'group':
      return getTotalUnreadCount(props.groupChats)
    default:
      return 0
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use 'sass:map';
@use 'sass:color';

// 深色主题
:root.dark-theme {
  .sidebar {
    @include glass-effect(map.get(map.get($colors, dark), bg-primary));
    border: 1px solid map.get(map.get($colors, dark), border);
  }

  .nav-tab:hover {
    background: rgba(71, 85, 105, 0.3);
  }

  .user-name {
    color: map.get(map.get($colors, dark), text-primary);
    @include text-shadow-dark;
  }

  .user-status {
    color: map.get(map.get($colors, dark), text-secondary);
    @include text-shadow-dark;
  }
}


// 侧边栏样式
.sidebar {
  width: 320px;
  @include glass-effect();
  border-radius: $border-radius-lg 0 0 $border-radius-lg;
  display: flex;
  flex-direction: column;
  transition: transform $transition-slow ease;
  z-index: 100;
  margin: 20px 0 20px 20px;

  @media (max-width: 768px) {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 280px;
    border-radius: 0 $border-radius-lg $border-radius-lg 0;
    transform: translateX(-100%);
    margin: 0;
  }

  &-mobile-open {
    transform: translateX(0);
  }

  // 用户头部
  .user-header {
    padding: 20px;
    border-bottom: 1px solid map.get(map.get($colors, light), border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .user-avatar {
    position: relative;

    img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 3px solid map.get($colors, primary);
    }
  }

  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 16px;
  }

  .status-indicator {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;

    &.online {
      background: map.get($colors, success);
    }
  }

  .user-details {
    flex: 1;
  }

  .user-name {
    font-size: 16px;
    font-weight: 600;
    color: map.get(map.get($colors, light), text-primary);
    margin: 0;
    @include text-shadow-light;
  }

  .user-status {
    font-size: 12px;
    color: map.get(map.get($colors, light), text-secondary);
    margin: 0;
    @include text-shadow-light;
  }

  .settings-btn {
    @include button-hover();
    background: none;
    border: none;
    padding: 8px;
    border-radius: 50%;

    &:hover {
      background: rgba(71, 85, 105, 0.3);
    }
  }

  // 导航标签
  .nav-tabs {
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 4px;
  }

  .nav-tab {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: none;
    background: none;
    border-radius: $border-radius-md;
    cursor: pointer;
    transition: all $transition-base;
    text-align: left;
    position: relative;

    .nav-tab:hover {
    background: rgba(71, 85, 105, 0.3);
  }

    &:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    &.active {
      background: $primary-gradient;
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

      .tab-label {
        color: white;
      }
    }
  }

  .tab-icon {
    font-size: 18px;
  }

  .tab-label {
    font-size: 14px;
    font-weight: 500;
    flex: 1;
    color: map.get(map.get($colors, light), text-primary);
  }

  .tab-badge {
    background: map.get($colors, danger);
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
  }

  // 搜索框
  .search-container {
    padding: 0 16px 16px;
  }

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    color: map.get(map.get($colors, light), text-muted);
    z-index: 1;
  }

  .search-input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    border: 1px solid map.get(map.get($colors, light), border);
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    outline: none;
    transition: all $transition-base;

    &:focus {
      border-color: map.get($colors, primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
}
</style>