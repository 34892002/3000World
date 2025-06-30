<template>
  <div class="sidebar" :class="{ 'sidebar-mobile-open': sidebarOpen }">
    <!-- 用户信息头部 -->
    <div class="user-header">
      <div class="user-info">
        <div class="user-avatar">
          <img :src="worldInfo.avatar || `https://api.dicebear.com/9.x/icons/svg?seed=${worldInfo.title}`" :alt="t('chat.user.avatar')" />
          <div class="status-indicator online"></div>
        </div>
        <div class="user-details">
          <h3 class="user-name">{{ worldInfo.title }}</h3>
          <p class="user-status text-truncate">{{ worldInfo.description }}</p>
        </div>
      </div>
      <button class="settings-btn" @click="emit('open-settings')" :title="t('chat.settings.title')">
        <span class="icon">⚙️</span>
        <!-- <v-icon icon="mdi-cog" /> -->
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
        <input v-model="searchQuery" :placeholder="getSearchPlaceholder()" class="search-input" />
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="sidebar-content">
      <!-- 私聊列表 -->
      <div v-if="activeTab === 'private'" class="content-section">
        <div class="section-header">
          <h4>{{ t('chat.tabs.private') }}</h4>
          <button class="add-btn" @click="showCreateDialog('private')">
            <span>➕</span>
          </button>
        </div>
        <div class="chat-list">
          <div v-for="chat in filteredPrivateChats" :key="chat.id"
            :class="['chat-item', { active: currentChat && currentChat.userId === chat.id && currentChat.chatType === 'private' }]"
            @click="selectChat(chat.id, 'private')">
            <div class="chat-avatar">
              <img :src="chat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.name}`" :alt="chat.name" />
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
            :class="['chat-item', { active: currentChat && currentChat.userId === chat.id && currentChat.chatType === 'group' }]"
            @click="selectChat(chat.id, 'group')">
            <div class="chat-avatar group-avatar">
              <img :src="chat.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.name}`" :alt="chat.name" />
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
            <div class="group-actions">
              <button class="edit-btn" @click.stop="editGroup(chat)">
                ✏️
              </button>
              <button class="delete-btn" @click.stop="deleteGroup(chat.id)">
                🗑️
              </button>
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
          <div v-for="character in filteredCharacters" :key="character.id" class="character-card">
            <div class="character-avatar">
              <img :src="character.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}`" :alt="character.name" />
              <!-- 主角皇冠标识 -->
              <div v-if="character.isPlayer" class="player-crown" :title="t('chat.characters.playerCharacter')">
                👑
              </div>
            </div>
            <h5 class="character-name">{{ character.name }}</h5>
            <p class="character-desc">{{ character.description }}</p>
            <div class="character-actions">
              <button class="edit-btn" @click.stop="openCharacterEditor(character)">
                ✏️
              </button>
              <button 
                class="player-btn" 
                @click.stop="togglePlayerCharacter(character.id)"
                :class="{ active: character.isPlayer }"
                :title="character.isPlayer ? t('chat.characters.removePlayer') : t('chat.characters.setPlayer')"
              >
                👑
              </button>
              <button class="delete-btn" @click.stop="deleteCharacter(character.id)">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 世界之书 -->
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
            <div class="worldbook-info overflow-hidden">
              <h5 class="worldbook-title text-truncate">{{ entry.title }}</h5>
              <p class="worldbook-desc line-3-ellipsis">{{ entry.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 插件列表 -->
      <div v-if="activeTab === 'plugins'" class="content-section">
        <div class="section-header">
          <h4>{{ t('chat.tabs.plugins') }}</h4>
        </div>
        <div class="plugins-list">
          <div class="plugin-item" @click="openVectorPlugin">
            <div class="plugin-icon">🔍</div>
            <div class="plugin-info">
              <h5>{{ t('plugins.vector.title') }}</h5>
              <p>{{ t('plugins.vector.description') }}</p>
            </div>
            <div class="plugin-status">
              <span class="status-dot active"></span>
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
          <!-- <div class="setting-item" @click="openWorldConfig">
            <div class="setting-icon">🌍</div>
            <div class="setting-info">
              <h5>{{ t('chat.worldSettings.config') }}</h5>
              <p>{{ t('chat.worldSettings.configDesc') }}</p>
            </div>
          </div> -->
          <div class="setting-item" @click="openApiConfig">
            <div class="setting-icon">🔧</div>
            <div class="setting-info">
              <h5>{{ t('chat.worldSettings.model.title') }}</h5>
              <p>{{ t('chat.worldSettings.model.desc') }}</p>
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
  currentChat: {
    type: Object,
    default: () => ({ userId: null, chatType: '' })
  },
  worldInfo: {
    type: Object,
    default: () => ({})
  },
  characters: {
    type: Array,
    default: () => []
  },
  worldbook: {
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
  'toggle-player-character',
  'open-world-config',
  'open-api-config',
  'open-vector-plugin',
  'edit-group',
  'delete-group'
])

// 响应式状态
const searchQuery = ref('')
const activeTab = ref('private')

// 导航标签
const navTabs = ref([
  { key: 'private', icon: '💬', label: 'chat.tabs.private', badge: null },
  { key: 'group', icon: '👥', label: 'chat.tabs.group', badge: null },
  { key: 'characters', icon: '🎭', label: 'chat.tabs.characters', badge: null },
  { key: 'worldbook', icon: '📚', label: 'chat.tabs.worldbook', badge: null },
  { key: 'plugins', icon: '🔌', label: 'chat.tabs.plugins', badge: null },
  { key: 'settings', icon: '⚙️', label: 'chat.tabs.settings', badge: null }
])

/**
 * 获取搜索框占位符
 */
const getSearchPlaceholder = () => {
  const placeholders = {
    private: t('chat.search.private'),
    group: t('chat.search.group'),
    characters: t('chat.search.characters'),
    worldbook: t('chat.search.worldbook'),
    plugins: t('chat.search.plugins'),
    settings: t('chat.search.settings')
  }
  return placeholders[activeTab.value] || t('chat.search.placeholder')
}

// 计算属性
/**
 * 根据搜索查询过滤私聊列表
 */
const filteredPrivateChats = computed(() => {
  const validChats = props.privateChats.filter(chat => chat && chat.id && chat.name)
  if (!searchQuery.value) return validChats
  return validChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

/**
 * 根据搜索查询过滤群聊列表
 */
const filteredGroupChats = computed(() => {
  const validChats = props.groupChats.filter(chat => chat && chat.id && chat.name)
  if (!searchQuery.value) return validChats
  return validChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

/**
 * 根据搜索查询过滤角色列表
 */
const filteredCharacters = computed(() => {
  if (!searchQuery.value) return props.characters
  return props.characters.filter(char =>
    char.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

/**
 * 根据搜索查询过滤世界设定列表
 * 将数据库格式{keywords, content, id}映射为模板期望的{title, description, id}
 */
const filteredWorldbook = computed(() => {
  // 首先映射数据结构
  const mappedWorldbook = props.worldbook.map(entry => ({
    id: entry.id,
    title: entry.keywords || '未命名条目',
    description: entry.content || '暂无描述'
  }))
  
  // 然后进行搜索过滤
  if (!searchQuery.value) return mappedWorldbook
  return mappedWorldbook.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

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
    emit('select-chat', chatId, type)
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
 * 切换角色的主角状态
 * @param {string|number} characterId - 角色ID
 */
const togglePlayerCharacter = (characterId) => {
  if (characterId) {
    emit('toggle-player-character', characterId)
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
 * 打开向量插件
 */
const openVectorPlugin = () => {
  emit('open-vector-plugin')
}

/**
 * 编辑群组
 * @param {Object} group - 群组对象
 */
const editGroup = (group) => {
  if (group) {
    emit('edit-group', group)
  }
}

/**
 * 删除群组
 * @param {string|number} groupId - 群组ID
 */
const deleteGroup = (groupId) => {
  if (groupId && confirm(t('chat.group.deleteConfirm'))) {
    emit('delete-group', groupId)
  }
}

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
   * @param {Date} time - 时间对象
   * @returns {string} 格式化后的时间字符串
   */
const formatTime = (time) => {
  const now = new Date()
  const diff = now - time
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return t('chat.time.now')
  if (minutes < 60) return t('chat.time.minutes', { count: minutes })
  if (hours < 24) return t('chat.time.hours', { count: hours })
  if (days < 7) return t('chat.time.days', { count: days })

  return time.toLocaleDateString()
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

  // 文本颜色
  .section-header h4,
  .chat-name,
  .character-name,
  .worldbook-title,
  .setting-info h5 {
    color: map.get(map.get($colors, dark), text-primary);
    @include text-shadow-dark;
  }

  .chat-preview,
  .member-count,
  .character-desc,
  .worldbook-desc,
  .setting-info p {
    color: map.get(map.get($colors, dark), text-secondary);
    @include text-shadow-dark;
  }

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

  .search-icon {
    color: map.get(map.get($colors, dark), text-muted);
  }

  .search-input {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid rgba(71, 85, 105, 0.5);
    color: map.get(map.get($colors, dark), text-primary);

    &::placeholder {
      color: map.get(map.get($colors, dark), text-muted);
    }

    &:focus {
      border-color: map.get($colors, primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }
  }

  .chat-item {
    background: map.get(map.get($colors, dark), bg-tertiary);
    border: 1px solid map.get(map.get($colors, dark), border);

    &:hover {
      background: rgba(71, 85, 105, 0.4);
    }
  }

  .character-card {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid map.get(map.get($colors, dark), border);

    &:hover {
      background: rgba(71, 85, 105, 0.4);
    }
  }

  .worldbook-item {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid map.get(map.get($colors, dark), border);

    &:hover {
      background: rgba(71, 85, 105, 0.4);
    }
  }

  .worldbook-icon {
    color: map.get(map.get($colors, dark), text-secondary);
  }

  .chat-time {
    color: #94a3b8;
  }

  // 导航标签
  .tab-label {
    color: map.get(map.get($colors, dark), text-secondary);
  }

  .setting-item {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid map.get(map.get($colors, dark), border);

    &:hover {
      background: rgba(71, 85, 105, 0.4);
    }
  }

  .setting-icon {
    color: map.get(map.get($colors, dark), text-secondary);
  }

  // 深色主题下的群组操作按钮
  .group-actions {
    .edit-btn,
    .delete-btn {
      background: rgba(30, 41, 59, 0.9);
      color: map.get(map.get($colors, dark), text-primary);
      border: 1px solid rgba(71, 85, 105, 0.5);
    }

    .edit-btn:hover {
      background: rgba(59, 130, 246, 0.9);
      color: white;
      border-color: rgba(59, 130, 246, 0.9);
    }

    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.9);
      color: white;
      border-color: rgba(239, 68, 68, 0.9);
    }
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
    max-width: 12em;
  }

  .settings-btn {
    @include button-hover();
    background: none;
    border: none;
    padding: 8px;
    border-radius: 50%;
    color: map.get(map.get($colors, light), text-secondary);

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
    color: map.get(map.get($colors, light), text-primary);

    &:focus {
      border-color: map.get($colors, primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }

  .content-section {
    margin-bottom: 24px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    h4 {
      font-size: 16px;
      font-weight: 600;
      color: map.get(map.get($colors, light), text-primary);
      margin: 0;
      @include text-shadow-light;
    }
  }

  .add-btn {
    background: $primary-gradient;
    border: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform $transition-base;
    font-size: 13px;

    &:hover {
      transform: scale(1.1);
    }
  }

  // 聊天列表
  .chat-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .chat-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: $border-radius-md;
    cursor: pointer;
    transition: all $transition-base;
    border: 1px solid rgba(0, 0, 0, 0.1);
    color: map.get(map.get($colors, light), text-secondary);

    &:hover {
      background: rgba(102, 126, 234, 0.1);
      transform: translateY(-1px);
      
      .group-actions {
        opacity: 1;
      }
    }

    &.active {
      background: $primary-gradient;
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
  }

  .chat-avatar {
    position: relative;
    flex-shrink: 0;

    img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
  }

  .group-avatar,
  .chat-avatar {
    img {
      border: 1px solid map.get($colors, gray);
    }
  }

  .unread-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: map.get($colors, danger);
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 16px;
    text-align: center;
  }

  .chat-info {
    flex: 1;
    min-width: 0;
  }

  .chat-name {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-preview {
    font-size: 12px;
    opacity: 0.8;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .member-count {
    font-size: 11px;
    opacity: 0.7;
    color: map.get(map.get($colors, light), text-secondary);
  }

  .chat-meta {
    text-align: right;
    flex-shrink: 0;
  }

  .chat-time {
    font-size: 11px;
    opacity: 0.7;
  }

  // 角色网格
  .character-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }

  .character-card {
    @include card-style;
    padding: 16px;
    text-align: center;
    cursor: pointer;
    position: relative;

    &:hover {
      transform: translateY(-2px);

      .character-actions {
        opacity: 1;
      }
    }
  }

  .character-avatar {
    position: relative;
    display: inline-block;
    
    img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin-bottom: 8px;
      border: 1px solid map.get($colors, gray);
    }
  }

  .player-crown {
    position: absolute;
    top: -4px;
    right: -4px;
    font-size: 16px;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    z-index: 1;
  }

  .character-name {
    font-size: 12px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: map.get(map.get($colors, light), text-primary);
    @include text-shadow-light;
  }

  .character-desc {
    font-size: 10px;
    margin: 0;
    color: map.get(map.get($colors, light), text-secondary);
    @include text-shadow-light;
  }

  .character-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;

    .edit-btn,
    .player-btn,
    .delete-btn {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }
    }

    .edit-btn:hover {
      background: rgba(59, 130, 246, 0.9);
      color: white;
    }

    .player-btn {
      &:hover {
        background: rgba(251, 191, 36, 0.9);
        color: white;
      }

      &.active {
        background: rgba(251, 191, 36, 0.9);
        color: white;
        box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3);
      }
    }

    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.9);
      color: white;
    }
  }

  // 群组操作按钮
  .group-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;

    .edit-btn,
    .delete-btn {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.1);
      }
    }

    .edit-btn:hover {
      background: rgba(59, 130, 246, 0.9);
      color: white;
    }

    .delete-btn:hover {
      background: rgba(239, 68, 68, 0.9);
      color: white;
    }
  }

  // 世界设定列表
  .worldbook-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .worldbook-item {
    @include card-style;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    cursor: pointer;
  }

  .worldbook-icon {
    font-size: 20px;
    color: map.get(map.get($colors, light), text-primary);
  }

  .worldbook-info {
    flex: 1;
  }

  .worldbook-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: map.get(map.get($colors, light), text-primary);
    @include text-shadow-light;
  }

  .worldbook-desc {
    font-size: 12px;
    margin: 0;
    color: map.get(map.get($colors, light), text-secondary);
    @include text-shadow-light;
  }

  // 插件列表
  .plugins-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .plugin-item {
    @include card-style;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  .plugin-icon {
    font-size: 20px;
    color: map.get(map.get($colors, light), text-primary);
  }

  .plugin-info {
    flex: 1;

    h5 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: map.get(map.get($colors, light), text-primary);
      @include text-shadow-light;
    }

    p {
      font-size: 12px;
      color: map.get(map.get($colors, light), text-secondary);
      margin: 0;
      line-height: 1.3;
    }
  }

  .plugin-status {
    display: flex;
    align-items: center;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ccc;

    &.active {
      background: #28a745;
      box-shadow: 0 0 4px rgba(40, 167, 69, 0.4);
    }
  }

  // 设置列表
  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .setting-item {
    @include card-style;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    cursor: pointer;
  }

  .setting-icon {
    font-size: 20px;
    color: map.get(map.get($colors, light), text-primary);
  }

  .setting-info {
    flex: 1;

    h5 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: map.get(map.get($colors, light), text-primary);
      @include text-shadow-light;
    }

    p {
      font-size: 12px;
      margin: 0;
      color: map.get(map.get($colors, light), text-secondary);
      @include text-shadow-light;
    }
  }
}
</style>