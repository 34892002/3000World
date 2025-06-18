<template>
  <div class="chat-app">
    <!-- 移动端遮罩 -->
    <div v-if="sidebarOpen && isMobile" class="mobile-overlay" @click="sidebarOpen = false"></div>

    <!-- 侧边栏 -->
    <Sidebar :sidebarOpen="sidebarOpen" :currentChat="currentChat" :worldInfo="worldInfo"
      :characters="characters" :worldbook="worldbook" :privateChats="privateChats" @select-chat="selectChat"
      :groupChats="groupChats" @open-settings="showSettings = true" />

    <!-- 主聊天区域 -->
    <ChatArea :isMobile="isMobile" :currentChat="currentChat" :privateChats="privateChats" :groupChats="groupChats"
      @toggle-sidebar="sidebarOpen = !sidebarOpen" @send-message="sendMessage" />

    <!-- 群组编辑器组件 -->
    <GroupEditor :visible="showGroupEditor" :group="editingGroup" @close="closeGroupEditor" @save="saveGroup" />

    <!-- 角色编辑器 -->
    <CharacterEditor :visible="showCharacterEditor" :character="editingCharacter" @close="closeCharacterEditor"
      @save="saveCharacter" @delete="deleteCharacter" />

    <!-- 设置对话框 -->
    <SettingsDialog :visible="showSettings" :model-language="selectedLanguage" :model-dark-theme="isDarkTheme"
      :model-notifications="notificationsEnabled" @close="showSettings = false" @language-change="changeLanguage"
      @theme-change="toggleTheme" @notification-change="handleNotificationChange" />

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import Sidebar from '@/components/Sidebar.vue'
import ChatArea from '@/components/ChatArea.vue'
import GroupEditor from '@/components/GroupEditor.vue'
import CharacterEditor from '@/components/CharacterEditor.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'

// 国际化
const { t, locale } = useI18n()

// 响应式数据
const sidebarOpen = ref(false)
const showSettings = ref(false)
const messagesContainer = ref(null)
const isMobile = ref(false)
const currentChat = ref({ userId: null, chatType: '' })

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

// 设置相关
const selectedLanguage = ref('zhHans')
const isDarkTheme = ref(false)
const notificationsEnabled = ref(true)

// 世界信息
const worldInfo = ref({
  title: '青青世界',
  avatar: 'https://api.dicebear.com/9.x/icons/svg?seed=project',
  description: '一个充满幻想的虚拟世界等待着你去探险'
})

// 模拟数据
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

const characters = ref([
  {
    id: 1,
    name: '艾莉丝',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    description: '一个友善的AI助手'
  },
  {
    id: 2,
    name: '小明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ming',
    description: '热情的朋友'
  }
])

const privateChats = ref([
  {
    id: 1,
    name: '艾莉丝',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
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
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ming',
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

// 方法
/**
 * 检查是否为移动设备
 */
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

/**
 * 选择聊天
 * @param {number} chatId - 聊天ID
 * @param {string} type - 聊天类型
 */
const selectChat = (chatId, type) => {
  currentChat.value = { userId: chatId, chatType: type }
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

const sendMessage = (message) => {
  if (!message.trim()) return
  const messageData = {
    id: 1, // 可以扮演任何角色
    content: message,
    timestamp: new Date(),
    isSent: true,
    isRead: true
  }
  if (currentChat.value.chatType === 'private') {
    // 私聊
    // 查找私聊对象
    const privateChat = privateChats.value.find(chat => chat.id === currentChat.value.userId)
    if (privateChat) {
      privateChat.messages.push(messageData)
      privateChat.lastMessage = message
      privateChat.lastMessageTime = new Date()
    }
  } else if (currentChat.value.chatType === 'group') {
    // 群聊
    const groupChat = groupChats.value.find(chat => chat.id === currentChat.value.userId)
    if (groupChat) {
      groupChat.messages.push(messageData)
      groupChat.lastMessage = message
      groupChat.lastMessageTime = new Date()
    }
  }
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
    avatar: characterData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${characterData.name}`
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
 * 切换语言
 */
const changeLanguage = (newLanguage) => {
  if (newLanguage) {
    selectedLanguage.value = newLanguage
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

.mobile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
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

  // 滚动条深色主题
  ::-webkit-scrollbar-thumb {
    background: rgba(71, 85, 105, 0.5);

    &:hover {
      background: rgba(71, 85, 105, 0.7);
    }
  }
}
</style>