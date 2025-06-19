<template>
    <div class="chat-app">
      <!-- 移动端遮罩 -->
      <div v-if="sidebarOpen && isMobile" class="mobile-overlay" @click="sidebarOpen = false"></div>
      
      <!-- 侧边栏 -->
      <div class="sidebar" :class="{ 'sidebar-mobile-open': sidebarOpen }">
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
          <button 
            v-for="tab in navTabs" 
            :key="tab.key"
            :class="['nav-tab', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ t(tab.label) }}</span>
            <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
          </button>
        </div>
  
        <!-- 搜索框 -->
        <div class="search-container">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery"
              :placeholder="getSearchPlaceholder()"
              class="search-input"
            />
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
              <div 
                v-for="chat in filteredPrivateChats" 
                :key="chat.id"
                :class="['chat-item', { active: selectedChatId === chat.id && chatType === 'private' }]"
                @click="selectChat(chat.id, 'private')"
              >
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
              <div 
                v-for="chat in filteredGroupChats" 
                :key="chat.id"
                :class="['chat-item', { active: selectedChatId === chat.id && chatType === 'group' }]"
                @click="selectChat(chat.id, 'group')"
              >
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
              <div 
                v-for="character in filteredCharacters" 
                :key="character.id"
                class="character-card"
                @click="selectCharacter(character.id)"
              >
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
  
          <!-- 世界之书 -->
          <div v-if="activeTab === 'worldbook'" class="content-section">
            <div class="section-header">
              <h4>{{ t('chat.worldbook.title') }}</h4>
              <button class="add-btn" @click="showCreateDialog('worldbook')">
                <span>➕</span>
              </button>
            </div>
            <div class="worldbook-list">
              <div 
                v-for="entry in filteredWorldbook" 
                :key="entry.id"
                class="worldbook-item"
                @click="selectWorldbookEntry(entry.id)"
              >
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
  
      <!-- 主聊天区域 -->
      <div class="main-content">
        <!-- 移动端顶部栏 -->
        <div v-if="isMobile" class="mobile-header">
          <button class="menu-btn" @click="sidebarOpen = !sidebarOpen">
            <span class="hamburger">☰</span>
          </button>
          <div v-if="selectedChat" class="header-chat-info">
            <img :src="selectedChat.avatar" :alt="selectedChat.name" class="header-avatar" />
            <div class="header-details">
              <h3>{{ selectedChat.name }}</h3>
              <p v-if="chatType === 'group'">{{ selectedChat.memberCount }} {{ t('chat.group.membersLabel') }}</p>
            </div>
          </div>
          <div class="header-actions">
            <button class="action-btn">📞</button>
            <button class="action-btn">📹</button>
          </div>
        </div>
  
        <!-- 聊天内容区域 -->
        <div class="chat-container">
          <!-- 桌面端聊天头部 -->
          <div v-if="!isMobile && selectedChat" class="chat-header">
            <div class="chat-header-info">
              <img :src="selectedChat.avatar" :alt="selectedChat.name" class="chat-header-avatar" />
              <div class="chat-header-details">
                <h2>{{ selectedChat.name }}</h2>
                <p v-if="chatType === 'group'" class="member-info">
                  {{ selectedChat.memberCount }} {{ t('chat.group.membersLabel') }}
                </p>
                <p v-else class="status-info">{{ t('chat.user.online') }}</p>
              </div>
            </div>
            <div class="chat-header-actions">
              <button class="header-action-btn">📞</button>
              <button class="header-action-btn">📹</button>
              <button class="header-action-btn">⋯</button>
            </div>
          </div>
  
          <!-- 消息列表 -->
          <div class="messages-container" ref="messagesContainer" v-if="selectedChat">
            <div 
              v-for="message in selectedChat.messages" 
              :key="message.id"
              :class="['message-wrapper', { 'message-sent': message.isSent, 'message-received': !message.isSent }]"
            >
              <div v-if="!message.isSent && chatType === 'group'" class="message-sender">
                {{ message.sender }}
              </div>
              <div class="message-bubble">
                <div class="message-content">{{ message.content }}</div>
                <div class="message-time">
                  {{ formatMessageTime(message.timestamp) }}
                  <span v-if="message.isSent" class="message-status">
                    {{ message.isRead ? '✓✓' : '✓' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
  
          <!-- 空状态 -->
          <div v-else class="empty-state">
            <div class="empty-icon">💬</div>
            <h3>{{ t('chat.empty.title') }}</h3>
            <p>{{ t('chat.empty.subtitle') }}</p>
          </div>
  
          <!-- 消息输入区域 -->
          <div v-if="selectedChat" class="message-input-container">
            <div class="input-wrapper">
              <button class="input-action-btn">😊</button>
              <input 
                v-model="newMessage"
                :placeholder="t('chat.input.placeholder')"
                class="message-input"
                @keyup.enter="sendMessage"
                @keyup.enter.shift.exact.prevent
              />
              <button class="input-action-btn">📎</button>
              <button 
                class="send-btn" 
                @click="sendMessage"
                :disabled="!newMessage.trim()"
              >
                <span>🚀</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- 群组编辑器组件 -->
      <GroupEditor
        :visible="showGroupEditor"
        :group="editingGroup"
        :characters="characters"
        @close="closeGroupEditor"
        @save="saveGroup"
      />
  
      <!-- 角色编辑器 -->
      <CharacterEditor
        :visible="showCharacterEditor"
        :character="editingCharacter"
        @close="closeCharacterEditor"
        @save="saveCharacter"
        @delete="deleteCharacter"
      />
  
      <!-- 设置对话框 -->
      <SettingsDialog
        :visible="showSettings"
        :model-language="selectedLanguage"
        :model-dark-theme="isDarkTheme"
        :model-notifications="notificationsEnabled"
        @close="showSettings = false"
        @language-change="changeLanguage"
        @theme-change="toggleTheme"
        @notification-change="handleNotificationChange"
      />
      
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  
  import GroupEditor from '@/components/GroupEditor.vue'
  import CharacterEditor from '@/components/CharacterEditor.vue'
  import SettingsDialog from '@/components/SettingsDialog.vue'
  
  // 国际化
  const { t, locale } = useI18n()
  
  // 响应式数据
  const sidebarOpen = ref(false)
  const activeTab = ref('private')
  const searchQuery = ref('')
  const selectedChatId = ref(null)
  const chatType = ref('private')
  const newMessage = ref('')
  const showSettings = ref(false)
  const messagesContainer = ref(null)
  const isMobile = ref(false)
  
  // 群组编辑器相关
  const showGroupEditor = ref(false)
  const editingGroup = ref({
    id: null,
    name: '',
    description: '',
    avatar: '',
    members: [],
    isPrivate: false,
    allowInvites: true
  })
  
  // 角色编辑器相关
  const showCharacterEditor = ref(false)
  const editingCharacter = ref({
    id: null,
    name: '',
    persona: '',
    greeting: '',
    isPlayer: false
  })
  
  // 用户信息
  const userName = ref('用户名')
  const userAvatar = ref('https://api.dicebear.com/9.x/miniavs/svg?seed=user')
  
  // 设置相关
  const selectedLanguage = ref('zhHans')
  const isDarkTheme = ref(false)
  const notificationsEnabled = ref(true)
  
  // 导航标签
  const navTabs = ref([
    { key: 'private', icon: '💬', label: 'chat.tabs.private', badge: null },
    { key: 'group', icon: '👥', label: 'chat.tabs.group', badge: null },
    { key: 'characters', icon: '🎭', label: 'chat.characters.title', badge: null },
    { key: 'worldbook', icon: '📚', label: 'chat.worldbook.title', badge: null },
    { key: 'settings', icon: '⚙️', label: 'chat.worldSettings.title', badge: null }
  ])
  
  // 模拟数据
  const privateChats = ref([
    {
      id: 1,
      name: '艾莉丝',
      avatar: 'https://api.dicebear.com/9.x/miniavs/svg?seed=alice',
      lastMessage: '你好，最近怎么样？',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
      unreadCount: 2,
      messages: [
        {
          id: 1,
          content: '你好！很高兴认识你！',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          isSent: false,
          isRead: true
        },
        {
          id: 2,
          content: '你好，最近怎么样？',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          isSent: false,
          isRead: false
        }
      ]
    },
    {
      id: 2,
      name: '小明',
      avatar: 'https://api.dicebear.com/9.x/miniavs/svg?seed=ming',
      lastMessage: '明天见面吧',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
      unreadCount: 0,
      messages: [
        {
          id: 1,
          content: '明天有空吗？',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
          isSent: true,
          isRead: true
        },
        {
          id: 2,
          content: '明天见面吧',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          isSent: false,
          isRead: true
        }
      ]
    }
  ])
  
  const groupChats = ref([
    {
      id: 3,
      name: '项目讨论组',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=project',
      lastMessage: '王五: 会议安排在下午3点',
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
      unreadCount: 5,
      memberCount: 8,
      messages: [
        {
          id: 1,
          content: '大家好，今天的会议安排在下午3点',
          timestamp: new Date(Date.now() - 1000 * 60 * 20),
          isSent: false,
          isRead: true,
          sender: '王五'
        },
        {
          id: 2,
          content: '收到，我会准时参加',
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          isSent: true,
          isRead: true
        }
      ]
    }
  ])
  
  const characters = ref([
    {
      id: 1,
      name: '艾莉丝',
      avatar: 'https://api.dicebear.com/9.x/miniavs/svg?seed=alice',
      description: '一个友善的AI助手'
    },
    {
      id: 2,
      name: '小明',
      avatar: 'https://api.dicebear.com/9.x/miniavs/svg?seed=ming',
      description: '热情的朋友'
    }
  ])
  
  const worldbook = ref([
    {
      id: 1,
      title: '世界背景',
      description: '这是一个科幻世界的设定'
    },
    {
      id: 2,
      title: '角色关系',
      description: '主要角色之间的关系网'
    }
  ])
  
  // 计算属性
  /**
   * 根据搜索查询过滤私聊列表
   */
  const filteredPrivateChats = computed(() => {
    if (!searchQuery.value) return privateChats.value
    return privateChats.value.filter(chat => 
      chat.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })
  
  /**
   * 根据搜索查询过滤群聊列表
   */
  const filteredGroupChats = computed(() => {
    if (!searchQuery.value) return groupChats.value
    return groupChats.value.filter(chat => 
      chat.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })
  
  /**
   * 根据搜索查询过滤角色列表
   */
  const filteredCharacters = computed(() => {
    if (!searchQuery.value) return characters.value
    return characters.value.filter(char => 
      char.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })
  
  /**
   * 根据搜索查询过滤世界设定列表
   */
  const filteredWorldbook = computed(() => {
    if (!searchQuery.value) return worldbook.value
    return worldbook.value.filter(entry => 
      entry.title.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  })
  
  
  /**
   * 获取当前选中的聊天
   */
  const selectedChat = computed(() => {
    const chats = chatType.value === 'private' ? privateChats.value : groupChats.value
    return chats.find(chat => chat.id === selectedChatId.value)
  })
  
  // 方法
  /**
   * 检查是否为移动设备
   */
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }
  
  /**
   * 获取搜索框占位符
   */
  const getSearchPlaceholder = () => {
    const placeholders = {
      private: t('chat.search.private'),
      group: t('chat.search.group'),
      characters: t('chat.search.characters'),
      worldbook: t('chat.search.worldbook'),
      settings: t('chat.search.settings')
    }
    return placeholders[activeTab.value] || t('chat.search.placeholder')
  }
  
  /**
   * 选择聊天
   * @param {number} chatId - 聊天ID
   * @param {string} type - 聊天类型
   */
  const selectChat = (chatId, type) => {
    selectedChatId.value = chatId
    chatType.value = type
    if (isMobile.value) {
      sidebarOpen.value = false
    }
    nextTick(() => {
      scrollToBottom()
    })
  }
  
  /**
   * 选择角色
   * @param {number} characterId - 角色ID
   */
  const selectCharacter = (characterId) => {
    // 实现角色选择逻辑
    console.log('选择角色:', characterId)
  }
  
  /**
   * 选择世界设定条目
   * @param {number} entryId - 条目ID
   */
  const selectWorldbookEntry = (entryId) => {
    // 实现世界设定选择逻辑
    console.log('选择世界设定:', entryId)
  }
  
  /**
   * 显示创建对话框
   * @param {string} type - 对话框类型
   */
  const showCreateDialog = (type) => {
    if (type === 'group') {
      openGroupEditor()
    } else if (type === 'character') {
      openCharacterEditor()
    } else {
      // 其他类型的创建对话框逻辑
      console.log('创建:', type)
    }
  }
  
  /**
   * 打开群组编辑器
   * @param {Object} group - 要编辑的群组对象，如果为空则创建新群组
   */
  const openGroupEditor = (group = null) => {
    if (group) {
      // 编辑现有群组
      editingGroup.value = {
        id: group.id,
        name: group.name,
        description: group.description || '',
        avatar: group.avatar,
        members: [...group.members] || [],
        isPrivate: group.isPrivate || false,
        allowInvites: group.allowInvites !== false
      }
    } else {
      // 创建新群组
      editingGroup.value = {
        id: null,
        name: '',
        description: '',
        avatar: '',
        members: [],
        isPrivate: false,
        allowInvites: true
      }
    }
    showGroupEditor.value = true
  }
  
  /**
   * 关闭群组编辑器
   */
  const closeGroupEditor = () => {
    showGroupEditor.value = false
    // 重置编辑状态
    setTimeout(() => {
      editingGroup.value = {
        id: null,
        name: '',
        description: '',
        avatar: '',
        members: [],
        isPrivate: false,
        allowInvites: true
      }
    }, 300)
  }
  
  /**
   * 保存群组
   */
  const saveGroup = () => {
    if (!editingGroup.value.name.trim()) {
      return
    }
  
    const groupData = {
      name: editingGroup.value.name.trim(),
      description: editingGroup.value.description.trim(),
      avatar: editingGroup.value.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${editingGroup.value.name}`,
      members: editingGroup.value.members,
      memberCount: editingGroup.value.members.length,
      isPrivate: editingGroup.value.isPrivate,
      allowInvites: editingGroup.value.allowInvites,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      messages: []
    }
  
    if (editingGroup.value.id) {
      // 更新现有群组
      const index = groupChats.value.findIndex(g => g.id === editingGroup.value.id)
      if (index !== -1) {
        groupChats.value[index] = { ...groupChats.value[index], ...groupData }
      }
    } else {
      // 创建新群组
      const newGroup = {
        id: Date.now(),
        ...groupData
      }
      groupChats.value.push(newGroup)
    }
  
    closeGroupEditor()
  }
  
  /**
   * 打开角色编辑器
   * @param {Object} character - 要编辑的角色对象，如果为空则创建新角色
   */
  const openCharacterEditor = (character = null) => {
    if (character) {
      // 编辑现有角色
      editingCharacter.value = {
        id: character.id,
        name: character.name,
        persona: character.persona || '',
        greeting: character.greeting || '',
        isPlayer: character.isPlayer || false
      }
    } else {
      // 创建新角色
      editingCharacter.value = {
        id: null,
        name: '',
        persona: '',
        greeting: '',
        isPlayer: false
      }
    }
    showCharacterEditor.value = true
  }
  
  /**
   * 关闭角色编辑器
   */
  const closeCharacterEditor = () => {
    showCharacterEditor.value = false
    // 重置编辑状态
    setTimeout(() => {
      editingCharacter.value = {
        id: null,
        name: '',
        persona: '',
        greeting: '',
        isPlayer: false
      }
    }, 300)
  }
  
  /**
   * 保存角色
   */
  const saveCharacter = (characterData) => {
    if (!characterData.name.trim()) {
      return
    }
  
    const processedData = {
      name: characterData.name.trim(),
      description: characterData.description || '',
      personality: characterData.personality || '',
      background: characterData.background || '',
      isPublic: characterData.isPublic || false,
      allowEdit: characterData.allowEdit || false,
      avatar: characterData.avatar || `https://api.dicebear.com/9.x/miniavs/svg?seed=${characterData.name}`
    }
  
    if (characterData.id) {
      // 更新现有角色
      const index = characters.value.findIndex(c => c.id === characterData.id)
      if (index !== -1) {
        characters.value[index] = { ...characters.value[index], ...processedData }
      }
    } else {
      // 创建新角色
      const newCharacter = {
        id: Date.now(),
        ...processedData
      }
      characters.value.push(newCharacter)
    }
  
    // 这里可以添加API调用来保存到服务器
    console.log('Character saved:', processedData)
    
    // 显示成功消息
    alert(t('chat.characters.saveSuccess'))
    
    closeCharacterEditor()
  }
  
  /**
   * 删除角色
   * @param {number} characterId - 角色ID
   */
  const deleteCharacter = (characterId) => {
    if (confirm(t('chat.characters.deleteConfirm'))) {
      const index = characters.value.findIndex(c => c.id === characterId)
      if (index !== -1) {
        characters.value.splice(index, 1)
        // 这里可以添加API调用来删除服务器上的角色
        console.log('Character deleted:', characterId)
        // 如果正在编辑这个角色，关闭编辑器
        if (editingCharacter.value && editingCharacter.value.id === characterId) {
          closeCharacterEditor()
        }
        // 显示成功消息
        alert(t('chat.characters.deleteSuccess'))
      }
    }
  }
  
  /**
   * 打开世界配置
   */
  const openWorldConfig = () => {
    console.log('打开世界配置')
  }
  
  /**
   * 打开API配置
   */
  const openApiConfig = () => {
    console.log('打开API配置')
  }
  
  /**
   * 发送消息
   */
  const sendMessage = () => {
    if (!newMessage.value.trim() || !selectedChat.value) return
    
    const message = {
      id: Date.now(),
      content: newMessage.value,
      timestamp: new Date(),
      isSent: true,
      isRead: false
    }
    
    selectedChat.value.messages.push(message)
    selectedChat.value.lastMessage = newMessage.value
    selectedChat.value.lastMessageTime = new Date()
    
    newMessage.value = ''
    
    nextTick(() => {
      scrollToBottom()
    })
  }
  
  /**
   * 滚动消息到底部
   */
  const scrollToBottom = () => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }
  
  /**
   * 格式化最后一条消息
   * @param {string} message - 消息内容
   * @returns {string} 格式化后的消息
   */
  const formatLastMessage = (message) => {
    return message.length > 30 ? message.substring(0, 30) + '...' : message
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
   * 格式化消息时间
   * @param {Date} time - 时间对象
   * @returns {string} 格式化后的时间字符串
   */
  const formatMessageTime = (time) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  /**
   * 切换语言
   */
  const changeLanguage = (newLanguage) => {
    if (newLanguage) {
      selectedLanguage.value = newLanguage
      // 映射语言代码到i18n格式
      const localeMap = {
        'zhHans': 'zhHans',
        'en': 'en'
      }
      locale.value = localeMap[newLanguage] || newLanguage
    }
  }
  
  /**
   * 切换主题
   */
  const toggleTheme = (newTheme) => {
    if (typeof newTheme === 'boolean') {
      isDarkTheme.value = newTheme
    }
    document.documentElement.classList.toggle('dark-theme', isDarkTheme.value)
  }
  
  /**
   * 处理通知设置变更
   */
  const handleNotificationChange = (enabled) => {
    notificationsEnabled.value = enabled
    // 这里可以添加实际的通知权限请求逻辑
    if (enabled && 'Notification' in window) {
      Notification.requestPermission()
    }
  }
  
  // 监听窗口大小变化
  const handleResize = () => {
    checkMobile()
  }
  
  // 组件挂载时的初始化
  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', handleResize)
    
    // 默认选择第一个私聊
    if (privateChats.value.length > 0) {
      selectChat(privateChats.value[0].id, 'private')
    }
  })
  
  // 组件卸载时清理
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })
  </script>
  
  <style scoped lang="scss">
  // 导入通用变量和混合宏
  @use 'sass:map';
  @use 'sass:color';
  @use '@/styles/variables.scss' as *;
  
  // 全局样式
  .chat-app {
    display: flex;
    height: 100vh;
    background: $primary-gradient;
    font-family: $font-family;
    overflow: hidden;
    gap: 0;
  }
  
  .btn-primary, .btn-secondary {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: $border-radius-sm;
    font-weight: 600;
    cursor: pointer;
    transition: all $transition-base;
    font-size: 0.9rem;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .btn-primary {
    background: map.get($colors, primary);
    color: white;
    
    &:hover:not(:disabled) {
      background: color.scale(map.get($colors, primary), $lightness: -10%);
      transform: translateY(-1px);
      box-shadow: $shadow-hover;
    }
  }
  
  .btn-secondary {
    background: rgba(255, 255, 255, 0.8);
    color: map.get(map.get($colors, light), text-secondary);
    border: 1px solid map.get(map.get($colors, light), border);
    
    &:hover {
      background: rgba(255, 255, 255, 0.95);
      transform: translateY(-1px);
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
  }
  
  .mobile-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
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
  
  // 侧边栏内容
  .sidebar-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 16px;
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
    width: 28px;
    height: 28px;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform $transition-base;
    
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
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: $border-radius-md;
    cursor: pointer;
    transition: all $transition-base;
    background: map.get(map.get($colors, light), bg-tertiary);
    
    &:hover {
      background: rgba(102, 126, 234, 0.1);
      transform: translateY(-1px);
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
  
  .group-avatar {
    img {
      border: 2px solid map.get($colors, success);
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
    color: map.get(map.get($colors, light), text-primary);
    @include text-shadow-light;
  }
  
  .chat-preview {
    font-size: 12px;
    opacity: 0.8;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: map.get(map.get($colors, light), text-secondary);
    @include text-shadow-light;
  }
  
  .member-count {
    font-size: 11px;
    opacity: 0.7;
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
    img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      margin-bottom: 8px;
    }
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
    
    .edit-btn, .delete-btn {
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
  
  // 主内容区域
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    @include glass-effect();
    margin: 20px 20px 20px 0;
    border-radius: 0 $border-radius-lg $border-radius-lg 0;
    overflow: hidden;
    
    @media (max-width: 768px) {
      margin: 0;
      border-radius: 0;
      height: 100vh;
      position: relative;
    }
  }
  
  // 移动端头部
  .mobile-header {
    display: flex;
    align-items: center;
    padding: 16px;
    background: $primary-gradient;
    color: white;
  }
  
  .menu-btn {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    padding: 8px;
    margin-right: 12px;
    cursor: pointer;
  }
  
  .header-chat-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
  }
  
  .header-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
  
  .header-details {
    h3 {
      font-size: 16px;
      margin: 0;
    }
    
    p {
      font-size: 12px;
      opacity: 0.8;
      margin: 0;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    padding: 8px;
    border-radius: 50%;
    cursor: pointer;
  }
  
  // 聊天容器
  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    
    @media (max-width: 768px) {
      height: calc(100vh - 80px); // 减去移动端头部高度
      position: relative;
    }
  }
  
  // 桌面端聊天头部
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid map.get(map.get($colors, light), border);
    
    &-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    &-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }
    
    &-details {
      h2 {
        font-size: 18px;
        font-weight: 600;
        margin: 0;
        color: map.get(map.get($colors, light), text-primary);
        @include text-shadow-light;
      }
    }
    
    &-actions {
      display: flex;
      gap: 8px;
    }
  }
  
  .member-info, .status-info {
    font-size: 12px;
    color: map.get(map.get($colors, light), text-secondary);
    margin: 4px 0 0 0;
    @include text-shadow-light;
  }
  
  .header-action-btn {
    @include button-hover();
    background: none;
    border: none;
    padding: 8px;
    border-radius: 50%;
  }
  
  // 消息容器
  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    
    @media (max-width: 768px) {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      // 确保消息容器不会超出可用空间
      max-height: calc(100vh - 80px - 100px); // 减去头部和输入框高度
    }
  }
  
  .message-wrapper {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    
    &.message-sent {
      align-items: flex-end;
    }
    
    &.message-received {
      align-items: flex-start;
    }
  }
  
  .message-sender {
    font-size: 12px;
    color: map.get(map.get($colors, light), text-muted);
    margin-bottom: 4px;
    padding: 0 12px;
  }
  
  .message-bubble {
    max-width: 70%;
    padding: 12px 16px;
    border-radius: 18px;
    margin-bottom: 8px;
    word-wrap: break-word;
    box-shadow: $shadow-base;
    transition: all $transition-base ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: $shadow-hover;
    }
    
    &.sent {
      background: $primary-gradient;
      color: white;
      align-self: flex-end;
      margin-left: auto;
    }
    
    &.received {
      background: rgba(255, 255, 255, 0.95);
      color: map.get(map.get($colors, light), text-primary);
      align-self: flex-start;
      border: 1px solid map.get(map.get($colors, light), border);
    }
  }
  
  .message-sent .message-bubble {
    background: $primary-gradient;
    color: white;
  }
  
  .message-received .message-bubble {
    background: white;
    color: #1f2937;
  }
  
  .message-content {
    margin-bottom: 4px;
    line-height: 1.4;
  }
  
  .message-time {
    font-size: 11px;
    opacity: 0.7;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .message-status {
    color: map.get($colors, success);
  }
  
  // 空状态
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: map.get(map.get($colors, light), text-muted);
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: map.get(map.get($colors, light), text-primary);
      margin: 0 0 8px 0;
      @include text-shadow-light;
    }
    
    p {
      font-size: 14px;
      color: map.get(map.get($colors, light), text-secondary);
      margin: 0;
      line-height: 1.5;
      @include text-shadow-light;
    }
  }
  
  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  // 消息输入区域
  .message-input-container {
    padding: 20px;
    border-top: 1px solid map.get(map.get($colors, light), border);
    background: white;
    
    @media (max-width: 768px) {
      position: sticky;
      bottom: 0;
      padding: 16px;
      background: white;
      border-top: 1px solid map.get(map.get($colors, light), border);
      z-index: 10;
      // 确保输入框始终可见
      flex-shrink: 0;
    }
  }
  
  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f8fafc;
    border-radius: 24px;
    padding: 8px;
  }
  
  .input-action-btn {
    @include button-hover();
    background: none;
    border: none;
    padding: 8px;
    border-radius: 50%;
  }
  
  .message-input {
    flex: 1;
    border: none;
    background: none;
    padding: 8px 12px;
    font-size: 14px;
    outline: none;
    resize: none;
  }
  
  .send-btn {
    background: $primary-gradient;
    border: none;
    color: white;
    padding: 10px;
    border-radius: 50%;
    cursor: pointer;
    transition: all $transition-base;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover:not(:disabled) {
      transform: scale(1.1);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    color: #1f2937;
  }
  
  .modal-footer {
    padding: 20px;
    border-top: 1px solid map.get(map.get($colors, light), border);
    text-align: right;
  }
  
  .btn-secondary {
    background: #6b7280;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: $border-radius-sm;
    cursor: pointer;
    font-size: 14px;
  }
  
  // 滚动条样式
  ::-webkit-scrollbar {
    width: 6px;
    
    &-track {
      background: transparent;
    }
    
    &-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
      
      &:hover {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  }
  
  // 深色主题
  :root.dark-theme {
    .chat-app {
      background: $dark-gradient;
    }
    
    .sidebar {
      @include glass-effect(map.get(map.get($colors, dark), bg-primary));
      border: 1px solid map.get(map.get($colors, dark), border);
    }
    
    .main-content {
      @include glass-effect(map.get(map.get($colors, dark), bg-primary));
      border: 1px solid map.get(map.get($colors, dark), border);
    }
  
    // 文本颜色
    .user-name,
    .section-header h4,
    .chat-header-details h2,
    .chat-name,
    .character-name,
    .worldbook-title,
    .setting-info h5,
    .empty-state h3 {
      color: map.get(map.get($colors, dark), text-primary);
      @include text-shadow-dark;
    }
    
    .user-status,
    .member-info,
    .status-info,
    .chat-preview,
    .character-desc,
    .worldbook-desc,
    .setting-info p,
    .empty-state p {
      color: map.get(map.get($colors, dark), text-secondary);
      @include text-shadow-dark;
    }
  
    // 导航标签
    .tab-label {
      color: map.get(map.get($colors, dark), text-secondary);
    }
    
    .nav-tab:hover {
      background: rgba(71, 85, 105, 0.3);
    }
    
    // 搜索框
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
    
    .search-icon {
      color: map.get(map.get($colors, dark), text-muted);
    }
    
    // 组件样式
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
  
    // 消息区域
    .messages-container {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    }
    
    .message-received .message-bubble {
      background: rgba(30, 41, 59, 0.9);
      color: #f1f5f9;
      border: 1px solid rgba(71, 85, 105, 0.3);
    }
    
    .message-sender {
      color: #94a3b8;
    }
    
    // 输入区域
    .message-input-container {
      background: rgba(15, 23, 42, 0.95);
      border-top: 1px solid rgba(71, 85, 105, 0.3);
    }
    
    .input-wrapper {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(71, 85, 105, 0.3);
    }
    
    .message-input {
      color: #f1f5f9;
      
      &::placeholder {
        color: #94a3b8;
      }
    }
    
    .close-btn {
      color: #cbd5e1;
      
      &:hover {
        color: #f1f5f9;
        background: rgba(71, 85, 105, 0.3);
        border-radius: 4px;
      }
    }
    
    .btn-secondary {
      background: rgba(71, 85, 105, 0.8);
      color: #f1f5f9;
      border: 1px solid rgba(71, 85, 105, 0.5);
      
      &:hover {
        background: rgba(71, 85, 105, 1);
      }
    }
    
    // 按钮悬停效果
    .settings-btn:hover,
    .header-action-btn:hover,
    .input-action-btn:hover {
      background: rgba(71, 85, 105, 0.3);
    }
    
    // 聊天时间
    .chat-time {
      color: #94a3b8;
    }
    
    // 滚动条深色主题
    ::-webkit-scrollbar-thumb {
      background: rgba(71, 85, 105, 0.5);
      
      &:hover {
        background: rgba(71, 85, 105, 0.7);
      }
    }
    
    // 移动端头部
    .mobile-header {
      background: linear-gradient(135deg, #0f172a, #1e293b);
    }
    
    .btn-secondary {
      background: rgba(71, 85, 105, 0.8);
      color: #f1f5f9;
      border-color: rgba(71, 85, 105, 0.5);
      
      &:hover {
        background: rgba(71, 85, 105, 1);
      }
    }
  }
  </style>