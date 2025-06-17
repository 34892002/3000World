<template>
  <div class="chat-area">
    <!-- 移动端顶部栏 -->
    <div class="mobile-header" v-if="isMobile">
      <button class="menu-btn" @click="$emit('toggle-sidebar')">
        <span class="hamburger"></span>
      </button>
      <div class="chat-title">
        <h3 v-if="currentChat">{{ currentChat.name }}</h3>
        <span v-else>{{ t('chat.selectChat') }}</span>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="$emit('open-settings')">
          <span>⚙️</span>
        </button>
      </div>
    </div>

    <!-- 聊天内容区域 -->
    <div class="chat-content" ref="chatContent">
      <!-- 消息列表 -->
      <div v-if="currentChat && messages.length > 0" class="messages-container">
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', message.sender === 'user' ? 'user-message' : 'ai-message']"
        >
          <div class="message-avatar">
            <img 
              :src="message.sender === 'user' ? userAvatar : (currentChat.avatar || defaultAiAvatar)" 
              :alt="message.sender === 'user' ? t('chat.user.avatar') : currentChat.name"
            />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender-name">
                {{ message.sender === 'user' ? userName : currentChat.name }}
              </span>
              <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
            </div>
            <div class="message-text" v-html="formatMessageContent(message.content)"></div>
            <div v-if="message.attachments && message.attachments.length > 0" class="message-attachments">
              <div 
                v-for="attachment in message.attachments" 
                :key="attachment.id"
                class="attachment"
              >
                <img v-if="attachment.type === 'image'" :src="attachment.url" :alt="attachment.name" />
                <div v-else class="file-attachment">
                  <span class="file-icon">📎</span>
                  <span class="file-name">{{ attachment.name }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="message-actions">
            <button class="action-btn" @click="copyMessage(message.content)" :title="t('chat.actions.copy')">
              📋
            </button>
            <button class="action-btn" @click="$emit('regenerate-message', message.id)" :title="t('chat.actions.regenerate')">
              🔄
            </button>
            <button class="action-btn" @click="$emit('delete-message', message.id)" :title="t('chat.actions.delete')">
              🗑️
            </button>
          </div>
        </div>
        
        <!-- 正在输入指示器 -->
        <div v-if="isTyping" class="typing-indicator">
          <div class="message ai-message">
            <div class="message-avatar">
              <img :src="currentChat.avatar || defaultAiAvatar" :alt="currentChat.name" />
            </div>
            <div class="message-content">
              <div class="typing-animation">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>{{ t('chat.empty.title') }}</h3>
        <p>{{ t('chat.empty.description') }}</p>
        <div v-if="suggestedPrompts.length > 0" class="suggested-prompts">
          <h4>{{ t('chat.empty.suggestions') }}</h4>
          <div class="prompt-grid">
            <button 
              v-for="prompt in suggestedPrompts" 
              :key="prompt.id"
              class="prompt-card"
              @click="$emit('use-prompt', prompt.text)"
            >
              <span class="prompt-icon">{{ prompt.icon }}</span>
              <span class="prompt-text">{{ prompt.text }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 消息输入区域 -->
    <div class="input-area" v-if="currentChat">
      <!-- 文件上传预览 -->
      <div v-if="uploadedFiles.length > 0" class="file-preview">
        <div 
          v-for="(file, index) in uploadedFiles" 
          :key="index"
          class="file-preview-item"
        >
          <img v-if="file.type.startsWith('image/')" :src="file.preview" :alt="file.name" />
          <div v-else class="file-info">
            <span class="file-icon">📎</span>
            <span class="file-name">{{ file.name }}</span>
          </div>
          <button class="remove-file" @click="removeFile(index)">
            ❌
          </button>
        </div>
      </div>

      <!-- 输入框容器 -->
      <div class="input-container">
        <div class="input-wrapper">
          <!-- 文件上传按钮 -->
          <button class="attach-btn" @click="triggerFileUpload" :title="t('chat.input.attach')">
            📎
          </button>
          <input 
            ref="fileInput"
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            @change="handleFileUpload"
            style="display: none;"
          />

          <!-- 消息输入框 -->
          <textarea
            ref="messageInput"
            v-model="inputMessage"
            :placeholder="getInputPlaceholder()"
            class="message-input"
            :disabled="isLoading"
            @keydown="handleKeyDown"
            @input="handleInput"
            rows="1"
          ></textarea>

          <!-- 发送按钮 -->
          <button 
            class="send-btn"
            :disabled="!canSend"
            @click="sendMessage"
            :title="t('chat.input.send')"
          >
            <span v-if="isLoading" class="loading-spinner">⏳</span>
            <span v-else>🚀</span>
          </button>
        </div>

        <!-- 输入提示 -->
        <div class="input-hints">
          <span class="hint">{{ t('chat.input.hint') }}</span>
          <div class="input-actions">
            <button class="hint-btn" @click="$emit('open-prompt-library')">
              {{ t('chat.input.promptLibrary') }}
            </button>
            <button class="hint-btn" @click="$emit('open-character-selector')">
              {{ t('chat.input.selectCharacter') }}
            </button>
          </div>
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
  currentChat: {
    type: Object,
    default: null
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
  userName: {
    type: String,
    default: '用户名'
  },
  userAvatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'
  },
  defaultAiAvatar: {
    type: String,
    default: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai'
  },
  suggestedPrompts: {
    type: Array,
    default: () => []
  }
})

// 组件事件
defineEmits([
  'toggle-sidebar',
  'open-settings',
  'regenerate-message',
  'delete-message',
  'use-prompt',
  'send-message',
  'open-prompt-library',
  'open-character-selector'
])

// 响应式数据
const inputMessage = ref('')
const uploadedFiles = ref([])
const chatContent = ref(null)
const messageInput = ref(null)
const fileInput = ref(null)

/**
 * 是否可以发送消息
 */
const canSend = computed(() => {
  return (inputMessage.value.trim() || uploadedFiles.value.length > 0) && !props.isLoading
})

/**
 * 获取输入框占位符文本
 */
const getInputPlaceholder = () => {
  if (props.isLoading) return t('chat.input.loading')
  if (!props.currentChat) return t('chat.input.selectChat')
  return t('chat.input.placeholder', { name: props.currentChat.name })
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
  
  const messageData = {
    content: inputMessage.value.trim(),
    attachments: uploadedFiles.value.map(file => ({
      name: file.name,
      type: file.type,
      url: file.preview || URL.createObjectURL(file)
    }))
  }
  
  // 发送消息事件
  $emit('send-message', messageData)
  
  // 清空输入
  inputMessage.value = ''
  uploadedFiles.value = []
  
  // 重置输入框高度
  nextTick(() => {
    if (messageInput.value) {
      messageInput.value.style.height = 'auto'
    }
  })
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
    if (chatContent.value) {
      chatContent.value.scrollTop = chatContent.value.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动到底部
watch(() => props.messages, () => {
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

.chat-area {
  flex: 1;
  @include glass-effect();
  border-radius: 0 $border-radius-lg $border-radius-lg 0;
  display: flex;
  flex-direction: column;
  margin: 20px 20px 20px 0;
  height: calc(100vh - 40px);
  overflow: hidden;
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid map.get(map.get($colors, light), border);
  
  @media (min-width: map.get($breakpoints, mobile)) {
    display: none;
  }
}

.menu-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  
  .hamburger {
    display: block;
    width: 20px;
    height: 2px;
    background: map.get(map.get($colors, light), text-primary);
    position: relative;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      background: map.get(map.get($colors, light), text-primary);
      transition: all $transition-base;
    }
    
    &::before {
      top: -6px;
    }
    
    &::after {
      bottom: -6px;
    }
  }
}

.chat-title {
  flex: 1;
  text-align: center;
  
  h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: map.get(map.get($colors, light), text-primary);
  }
  
  span {
    color: map.get(map.get($colors, light), text-secondary);
    font-size: 0.9rem;
  }
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: $border-radius-sm;
  cursor: pointer;
  transition: all $transition-base;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  scroll-behavior: smooth;
}

.messages-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  
  &.user-message {
    flex-direction: row-reverse;
    
    .message-content {
      background: $primary-gradient;
      color: white;
      border-radius: 18px 18px 4px 18px;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }
    
    .message-header {
      text-align: right;
    }
  }
  
  &.ai-message {
    .message-content {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 18px 18px 18px 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

.message-content {
  flex: 1;
  padding: 0.75rem 1rem;
  max-width: 70%;
  word-wrap: break-word;
  
  @media (max-width: map.get($breakpoints, mobile)) {
    max-width: 85%;
  }
}

.message-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
  
  .sender-name {
    font-size: 0.8rem;
    font-weight: 600;
    opacity: 0.8;
  }
  
  .message-time {
    font-size: 0.7rem;
    opacity: 0.6;
  }
}

.message-text {
  line-height: 1.5;
  
  :deep(strong) {
    font-weight: 600;
  }
  
  :deep(em) {
    font-style: italic;
  }
  
  :deep(code) {
    background: rgba(0, 0, 0, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: $border-radius-sm;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }
}

.message-attachments {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.attachment {
  img {
    max-width: 200px;
    max-height: 200px;
    border-radius: $border-radius-sm;
    object-fit: cover;
  }
}

.file-attachment {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: $border-radius-sm;
  
  .file-icon {
    font-size: 1.2rem;
  }
  
  .file-name {
    font-size: 0.9rem;
    color: map.get(map.get($colors, light), text-secondary);
  }
}

.message-actions {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity $transition-base;
  
  .action-btn {
    font-size: 0.8rem;
    padding: 0.25rem;
    width: 32px;
    height: 32px;
  }
}

.message:hover .message-actions {
  opacity: 1;
}

.typing-indicator {
  .typing-animation {
    display: flex;
    gap: 0.25rem;
    padding: 0.75rem 1rem;
    
    span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: map.get(map.get($colors, light), text-secondary);
      animation: typing 1.4s infinite ease-in-out;
      
      &:nth-child(1) { animation-delay: -0.32s; }
      &:nth-child(2) { animation-delay: -0.16s; }
    }
  }
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: map.get(map.get($colors, light), text-primary);
  }
  
  p {
    margin: 0 0 2rem 0;
    color: map.get(map.get($colors, light), text-secondary);
    max-width: 400px;
    line-height: 1.6;
  }
}

.suggested-prompts {
  width: 100%;
  max-width: 600px;
  
  h4 {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: map.get(map.get($colors, light), text-primary);
  }
}

.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.prompt-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid map.get(map.get($colors, light), border);
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-base;
  text-align: left;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-hover;
    border-color: map.get($colors, primary);
  }
  
  .prompt-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }
  
  .prompt-text {
    flex: 1;
    font-size: 0.9rem;
    color: map.get(map.get($colors, light), text-primary);
    line-height: 1.4;
  }
}

.input-area {
  @include glass-effect();
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px;
  margin: 0;
}

.file-preview {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.file-preview-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: $border-radius-sm;
  
  img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: $border-radius-sm;
  }
  
  .file-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .file-icon {
      font-size: 1.2rem;
    }
    
    .file-name {
      font-size: 0.9rem;
      color: map.get(map.get($colors, light), text-secondary);
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  
  .remove-file {
    position: absolute;
    top: -5px;
    right: -5px;
    background: map.get($colors, danger);
    color: white;
    border: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.input-container {
  max-width: 800px;
  margin: 0 auto;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  padding: 8px;
  transition: all $transition-base;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:focus-within {
    border-color: map.get($colors, primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.attach-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all $transition-base;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 0.9rem;
  line-height: 1.5;
  padding: 0.5rem;
  min-height: 20px;
  max-height: 120px;
  font-family: inherit;
  
  &::placeholder {
    color: map.get(map.get($colors, light), text-secondary);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.send-btn {
  background: $primary-gradient;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all $transition-base;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  
  &:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.input-hints {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: map.get(map.get($colors, light), text-secondary);
  
  @media (max-width: map.get($breakpoints, mobile)) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}

.input-actions {
  display: flex;
  gap: 1rem;
}

.hint-btn {
  background: none;
  border: none;
  color: map.get($colors, primary);
  cursor: pointer;
  font-size: 0.8rem;
  transition: all $transition-base;
  
  &:hover {
    text-decoration: underline;
  }
}

// 深色主题样式
:root.dark-theme {
  .chat-area {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
  
  .mobile-header {
    background: rgba(30, 41, 59, 0.95);
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
  
  .chat-title h3 {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .chat-title span {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .hamburger,
  .hamburger::before,
  .hamburger::after {
    background: rgba(255, 255, 255, 0.9);
  }
  
  .action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .message.ai-message .message-content {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
  }
  
  .message-header .sender-name,
  .message-header .message-time {
    color: inherit;
  }
  
  .message-text :deep(code) {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .file-attachment {
    background: rgba(255, 255, 255, 0.1);
    
    .file-name {
      color: rgba(255, 255, 255, 0.6);
    }
  }
  
  .typing-animation span {
    background: rgba(255, 255, 255, 0.6);
  }
  
  .empty-state {
    h3 {
      color: rgba(255, 255, 255, 0.9);
    }
    
    p {
      color: rgba(255, 255, 255, 0.6);
    }
  }
  
  .suggested-prompts h4 {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .prompt-card {
    background: rgba(30, 41, 59, 0.9);
    border-color: rgba(255, 255, 255, 0.2);
    
    .prompt-text {
      color: rgba(255, 255, 255, 0.9);
    }
  }
  
  .input-area {
    background: rgba(30, 41, 59, 0.95);
    border-top-color: rgba(255, 255, 255, 0.1);
  }
  
  .file-preview-item {
    background: rgba(255, 255, 255, 0.1);
    
    .file-name {
      color: rgba(255, 255, 255, 0.6);
    }
  }
  
  .input-wrapper {
    background: rgba(15, 23, 42, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .message-input {
    color: rgba(255, 255, 255, 0.9);
    
    &::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }
  }
  
  .attach-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .input-hints {
    color: rgba(255, 255, 255, 0.6);
  }
}
</style>