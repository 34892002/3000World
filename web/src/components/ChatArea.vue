<template>
  <div class="main-content">
    <!-- 移动端顶部栏 -->
    <div v-if="isMobile" class="mobile-header">
      <button class="menu-btn" @click="emit('toggle-sidebar')">
        <span class="hamburger">☰</span>
      </button>
      <div v-if="selectedChat" class="header-chat-info">
        <img :src="selectedChat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.name}`" :alt="selectedChat.name" class="header-avatar" />
        <div class="header-details">
          <h3>{{ selectedChat.name }}</h3>
          <p v-if="currentChat && currentChat.chatType === 'group'">{{ selectedChat.memberCount }} {{ t('chat.group.membersLabel') }}
          </p>
        </div>
      </div>
      <div class="header-actions">
        <button class="header-action-btn">⋯</button>
      </div>
    </div>

    <!-- 聊天内容区域 -->
    <div class="chat-container">
      <!-- 桌面端聊天头部 -->
      <div v-if="!isMobile && selectedChat" class="chat-header">
        <div class="chat-header-info w-50">
          <img v-if="currentChat && currentChat.chatType === 'group'" :src="selectedChat.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${selectedChat.name}`" :alt="selectedChat.name" class="chat-header-avatar" />
          <img v-else :src="selectedChat.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.name}`" :alt="selectedChat.name" class="chat-header-avatar" />
          <div class="chat-header-details w-100">
            <h2>{{ selectedChat.name }}</h2>
            <p v-if="currentChat && currentChat.chatType === 'group'" class="member-info">
              {{ selectedChat.memberCount }} {{ t('chat.group.membersLabel') }}
            </p>
            <p v-else class="status-info text-truncate">{{ currentUser?.persona }}</p>
          </div>
        </div>
        <div class="chat-header-actions">
          <!-- <button class="header-action-btn">📞</button>
          <button class="header-action-btn">📹</button> -->
          <button class="header-action-btn">⋯</button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div class="messages-container" ref="messagesContainer" v-if="selectedChat">
        <div v-for="message in selectedChat.messages" :key="message.id"
          :class="['message-wrapper', { 'message-sent': message.isSent, 'message-received': !message.isSent, 'message-thinking': message.isThinking }]">
          <div v-if="!message.isSent && currentChat && currentChat.chatType === 'group'" class="message-sender">
            {{ message.sender }}
          </div>
          <div class="message-bubble text-pre-wrap" :class="{ 'thinking-bubble': message.isThinking }">
            <div class="message-content">
              {{ message.content }}
              <span v-if="message.isThinking" class="thinking-dots">...</span>
            </div>
            <div class="message-time" v-if="!message.isThinking">
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
        <!-- @提及建议 -->
        <div v-if="showMentionSuggestions" class="mention-suggestions">
          <div v-for="character in filteredSuggestions" :key="character.id" 
               class="mention-item" 
               @mousedown.prevent="selectMention(character.name)">
            {{ character.name }}
          </div>
        </div>
        <div class="input-wrapper">
          <button class="input-action-btn">😊</button>
          <input ref="messageInput" v-model="inputMessage" :placeholder="t('chat.input.placeholder')" class="message-input"
            @keyup.enter="sendMessage" @keyup.enter.shift.exact.prevent 
            @input="handleMentionInput" @click="handleMentionInput" 
            @keydown="handleKeyDown" @blur="hideMentionSuggestions" />
          <button class="input-action-btn">📎</button>
          <button class="send-btn" @click="sendMessage" :disabled="!inputMessage.trim()">
            <span>🚀</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// 组件属性
const props = defineProps({
  isMobile: {
    type: Boolean,
    default: false
  },
  groupChats: {
    type: Array,
    default: () => []
  },
  privateChats: {
    type: Array,
    default: () => []
  },
  currentChat: {
    type: Object,
    default: () => ({ userId: null, chatType: '' })
  },
  messages: {
    type: Array,
    default: () => []
  },
  isTyping: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  userAvatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
  },
  defaultAiAvatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai'
  },
  characters: {
    type: Array,
    default: () => []
  },
})

// 组件事件
const emit = defineEmits([
  'toggle-sidebar',
  'send-message',
])

// 响应式数据
const inputMessage = ref('')
const uploadedFiles = ref([])
const messagesContainer = ref(null)
const messageInput = ref(null)
const fileInput = ref(null)

// @提及功能相关
const showMentionSuggestions = ref(false)
const mentionStartIndex = ref(-1)
const filteredSuggestions = ref([])

const currentUser = computed(() => {
  if (!props.currentChat || !props.currentChat.userId) return null
  const userId = props.currentChat.userId
  return props.characters.find(character => character.id === userId)
})

/**
 * 是否可以发送消息
 */
const canSend = computed(() => {
  return (inputMessage.value.trim() || uploadedFiles.value.length > 0) && !props.isLoading
})

/**
 * 获取当前选中的聊天
 */
const selectedChat = computed(() => {
  if (!props.currentChat || !props.currentChat.chatType || !props.currentChat.userId) return null
  const chats = props.currentChat.chatType === 'private' ? props.privateChats : props.groupChats
  return chats.find(chat => chat.id === props.currentChat.userId)
})

/**
 * 获取输入框占位符文本
 */
const getInputPlaceholder = () => {
  if (props.isLoading) return t('chat.input.loading')
  if (!props.currentChat) return t('chat.input.selectChat')
  return t('chat.input.placeholder', { name: props.currentChat?.name || '' })
}

/**
 * 格式化消息时间
 */
const formatMessageTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * 格式化消息内容（支持Markdown等）
 */
const formatMessageContent = (content) => {
  if (!content) return ''
  // 简单的Markdown支持
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // 斜体
    .replace(/`(.*?)`/g, '<code>$1</code>') // 行内代码
    .replace(/\n/g, '<br>') // 换行
  return formatted
}

/**
 * 复制消息内容
 */
const copyMessage = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
    // 这里可以添加成功提示
  } catch (err) {
    console.error('复制失败:', err)
  }
}

/**
 * 处理键盘事件
 */
const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (canSend.value) {
      sendMessage()
    }
    hideMentionSuggestions()
  }
  if (event.key === 'Escape') {
    hideMentionSuggestions()
  }
}

/**
 * 处理输入事件（自动调整高度）
 */
const handleInput = () => {
  const textarea = messageInput.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }
}

/**
 * 发送消息
 */
const sendMessage = () => {
  if (!canSend.value) return

  // const messageData = {
  //   content: inputMessage.value.trim(),
  //   attachments: uploadedFiles.value.map(file => ({
  //     name: file.name,
  //     type: file.type,
  //     url: file.preview || URL.createObjectURL(file)
  //   }))
  // }
  const messageData = inputMessage.value.trim()
  // 发送消息事件
  emit('send-message', messageData)

  // 清空输入
  inputMessage.value = ''
  uploadedFiles.value = []
  
  // 发送消息后滚动到底部
  scrollToBottom()
}

/**
 * 触发文件上传
 */
const triggerFileUpload = () => {
  fileInput.value?.click()
}

/**
 * 处理文件上传
 */
const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)

  files.forEach(file => {
    // 检查文件大小（限制为10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert(t('chat.upload.fileTooLarge'))
      return
    }

    const fileData = {
      name: file.name,
      type: file.type,
      size: file.size,
      file: file
    }

    // 如果是图片，生成预览
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        fileData.preview = e.target.result
      }
      reader.readAsDataURL(file)
    }

    uploadedFiles.value.push(fileData)
  })

  // 清空文件输入
  event.target.value = ''
}

/**
 * 移除上传的文件
 */
const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1)
}

/**
 * 滚动到底部
 */
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

/**
 * 获取当前会话的参与者
 */
const getSessionParticipants = () => {
  if (!selectedChat.value) {
    return []
  }
  
  // 如果是群聊，返回群聊中的所有角色
  if (props.currentChat && props.currentChat.chatType === 'group') {
    // 获取群聊的角色ID列表
    const characterIds = selectedChat.value.characterIds || selectedChat.value.members || []
    
    // 根据ID查找实际的角色对象
    const participants = characterIds
      .map(charId => props.characters.find(char => char.id === charId))
      .filter(Boolean) // 过滤掉undefined的结果
    
    return participants
  }
  
  // 如果是私聊，返回对话的角色
  if (props.currentChat && props.currentChat.chatType === 'private') {
    const character = selectedChat.value.character || selectedChat.value.user || selectedChat.value
    return character ? [character] : []
  }
  
  return []
}

/**
 * 处理@提及输入
 */
const handleMentionInput = () => {
  // 私聊模式下不启用@提及功能
  if (!props.currentChat || props.currentChat.chatType !== 'group') {
    showMentionSuggestions.value = false
    return
  }
  
  const input = messageInput.value
  if (!input) return
  
  const inputText = input.value
  const cursorPosition = input.selectionStart || 0
  const textBeforeCursor = inputText.substring(0, cursorPosition)
  
  // 检查是否有@提及
  const mentionMatch = textBeforeCursor.match(/@([^\s]*)$/)
  
  if (mentionMatch) {
    mentionStartIndex.value = mentionMatch.index
    const searchTerm = mentionMatch[1].toLowerCase()
    
    // 获取会话参与者
    const participants = getSessionParticipants()
    
    if (participants.length > 0) {
      // 过滤匹配的角色
      filteredSuggestions.value = participants.filter(p =>
        p.name && p.name.toLowerCase().includes(searchTerm)
      )
      
      showMentionSuggestions.value = filteredSuggestions.value.length > 0
    } else {
      showMentionSuggestions.value = false
    }
  } else {
    showMentionSuggestions.value = false
  }
}

/**
 * 隐藏@提及建议
 */
const hideMentionSuggestions = () => {
  setTimeout(() => {
    showMentionSuggestions.value = false
    mentionStartIndex.value = -1
    filteredSuggestions.value = []
  }, 150)
}

/**
 * 选择@提及
 */
const selectMention = (name) => {
  const input = messageInput.value
  if (!input || mentionStartIndex.value === -1) return
  
  const currentText = inputMessage.value
  const textBefore = currentText.substring(0, mentionStartIndex.value)
  const textAfter = currentText.substring(input.selectionStart)
  
  inputMessage.value = `${textBefore}@${name} ${textAfter}`
  hideMentionSuggestions()
  
  // 重新聚焦输入框并设置光标位置
  nextTick(() => {
    input.focus()
    const newCursorPos = (textBefore + `@${name} `).length
    input.setSelectionRange(newCursorPos, newCursorPos)
  })
}

// 监听消息变化，自动滚动到底部
watch(() => selectedChat.value?.messages, () => {
  scrollToBottom()
}, { deep: true })

// 监听正在输入状态，自动滚动到底部
watch(() => props.isTyping, (newVal) => {
  if (newVal) {
    scrollToBottom()
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use 'sass:map';
@use 'sass:color';

// 深色主题
:root.dark-theme {

  .chat-header-details h2,
  .status-info {
    color: map.get(map.get($colors, dark), text-primary);
    @include text-shadow-dark;
  }

  .mobile-header {
    background: linear-gradient(135deg, #0f172a, #1e293b);
  }

  .main-content {
    @include glass-effect(map.get(map.get($colors, dark), bg-primary));
    border: 1px solid map.get(map.get($colors, dark), border);
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

  .header-action-btn:hover,
  .input-action-btn:hover {
    background: rgba(71, 85, 105, 0.3);
  }

  // @提及建议深色主题样式
  .mention-suggestions {
    @include glass-effect(map.get(map.get($colors, dark), bg-secondary));
    border: 1px solid map.get(map.get($colors, dark), border);
    
    .mention-item {
      color: map.get(map.get($colors, dark), text-primary);
      
      &:hover {
        background: rgba(59, 130, 246, 0.3);
        color: map.get($colors, primary);
      }
    }
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

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22.5px;
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
    border: 1px solid map.get($colors, gray);
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

.member-info,
.status-info {
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
  width: 40px;
  height: 40px;
  color: map.get(map.get($colors, light), text-secondary);
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

// 思考中消息样式
.message-thinking .message-bubble {
  opacity: 0.8;
  animation: pulse 1.5s ease-in-out infinite;
}

.thinking-bubble {
  background: #f3f4f6 !important;
  color: #6b7280 !important;
  font-style: italic;
}

.thinking-dots {
  animation: thinking 1.4s ease-in-out infinite;
  font-weight: bold;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

@keyframes thinking {
  0%, 20% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  80%, 100% {
    opacity: 0;
  }
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
  position: relative; // 为绝对定位的mention-suggestions提供定位上下文
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
  width: 40px;
  height: 40px;
}

.message-input {
  flex: 1;
  border: none;
  background: none;
  padding: 8px 12px;
  font-size: 14px;
  outline: none;
  resize: none;
  color: map.get(map.get($colors, light), text-primary);
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

// @提及建议样式
.mention-suggestions {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  margin-bottom: 0px;
  @include glass-effect(map.get(map.get($colors, light), bg-secondary));
  border: 1px solid map.get(map.get($colors, light), border);
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  
  .mention-item {
    padding: 12px 16px;
    cursor: pointer;
    color: map.get(map.get($colors, light), text-primary);
    font-size: 14px;
    transition: all 0.2s ease;
    border-radius: 6px;
    margin: 4px;
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
      color: map.get($colors, primary);
      transform: translateX(2px);
    }
    
    &:first-child {
      margin-top: 4px;
    }
    
    &:last-child {
      margin-bottom: 4px;
    }
  }
}
</style>