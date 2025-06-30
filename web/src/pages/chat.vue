<template>
  <div class="chat-app">
    <!-- 移动端遮罩 -->
    <div v-if="sidebarOpen && isMobile" class="mobile-overlay" @click="sidebarOpen = false"></div>

    <!-- 侧边栏 -->
    <Sidebar :sidebarOpen="sidebarOpen" :currentChat="currentChat" :worldInfo="worldInfo" :characters="characters"
      :worldbook="worldbook" :privateChats="privateChats" @select-chat="selectChat" :groupChats="groupChats"
      @open-settings="showSettings = true" @create-dialog="showCreateDialog"
      @select-worldbook-entry="selectWorldbookEntry" @toggle-player-character="togglePlayerCharacter" 
      @open-api-config="openApiConfig" @open-vector-plugin="openVectorPlugin" @edit-group="editGroup" @delete-group="deleteGroup"
      @open-character-editor="openCharacterEditor" @select-character="selectCharacter" @delete-character="deleteCharacter" />

    <!-- 主聊天区域 -->
    <ChatArea :isMobile="isMobile" :currentChat="currentChat" :privateChats="privateChats" :groupChats="groupChats"
      :characters="characters" @toggle-sidebar="sidebarOpen = !sidebarOpen" @send-message="sendMessage" />

    <!-- 群组编辑器组件 -->
    <GroupEditor :visible="showGroupEditor" :group="editingGroup" :characters="dbCharacters" @close="closeGroupEditor" @save="saveGroup" />

    <!-- 角色编辑器 -->
    <CharacterEditor :visible="showCharacterEditor" :character="editingCharacter" @close="closeCharacterEditor"
      @save="saveCharacter" @delete="deleteCharacter" />

    <!-- 设置对话框 -->
    <SettingsDialog :visible="showSettings" :model-language="selectedLanguage" :model-dark-theme="isDarkTheme"
      :model-notifications="notificationsEnabled" @close="showSettings = false" @language-change="changeLanguage"
      @theme-change="toggleTheme" @notification-change="handleNotificationChange" />

    <!-- 世界之书编辑器 -->
    <WorldbookEditor :visible="showWorldbookEditor" :worldbook="editingWorldbook" 
      @close="closeWorldbookEditor" @saved="saveWorldbookEntry" @deleted="deleteWorldbookEntry" />

    <!-- Model配置对话框 -->
    <ModelConfigDialog :visible="showApiConfig" :config="config" 
      @close="closeApiConfig" @save="saveApiConfig" />

    <!-- 向量插件 -->
    <VectorPlugin :visible="showVectorPlugin" :currentChat="currentChat" 
      @close="closeVectorPlugin" />

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useDatabase } from '@/composables/useDatabase'
import { useAIApi } from '@/api/model'

import Sidebar from '@/components/Sidebar.vue'
import ChatArea from '@/components/ChatArea.vue'
import GroupEditor from '@/components/GroupEditor.vue'
import CharacterEditor from '@/components/CharacterEditor.vue'
import SettingsDialog from '@/components/SettingsDialog.vue'
import WorldbookEditor from '@/components/WorldbookEditor.vue'
import ModelConfigDialog from '@/components/ModelConfigDialog.vue'
import VectorPlugin from '@/components/VectorPlugin.vue'

// 国际化和路由
const { t, locale } = useI18n()
const router = useRouter()

// 数据库功能
const {
  currentWorld,
  error: dbError,
  characters: dbCharacters,
  groups: dbGroups,
  worldbooks: dbWorldbooks,
  config,
  connectToWorld,
  getChatHistory,
  saveMessage,
  saveCharacter: dbSaveCharacter,
  deleteCharacter: dbDeleteCharacter,
  saveGroup: dbSaveGroup,
  deleteGroup: dbDeleteGroup,
  saveConfig,
  refresh: refreshData,
} = useDatabase()

// 为了保持兼容性，创建 worldConfig 的引用
const worldConfig = config

// AI接口功能
const { isLoading: aiLoading, cleanAIResponse, getAIResponse } = useAIApi()

// 响应式数据
const sidebarOpen = ref(false)
const showSettings = ref(false)
const showApiConfig = ref(false)
const showVectorPlugin = ref(false)
const messagesContainer = ref(null)
const isMobile = ref(false)
const currentChat = ref({ userId: null, chatType: '' })

// 群组编辑器相关
const showGroupEditor = ref(false)
const editingGroup = ref({
  id: null,
  name: '',
  characterIds: []
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

// 世界之书编辑器相关
const showWorldbookEditor = ref(false)
const editingWorldbook = ref(null)

// 设置相关
const selectedLanguage = ref('zhHans')
const isDarkTheme = ref(false)
const notificationsEnabled = ref(true)

// 世界信息
const worldInfo = ref({
  title: currentWorld.value,
  avatar: '',
  description: '一个充满幻想的虚拟世界等待着你去探险'
})

// 直接使用数据库中的响应式数据
const worldbook = dbWorldbooks
const characters = dbCharacters

// 聊天会话缓存
const chatSessions = ref(new Map())

// 聊天数据（从数据库加载）
const privateChats = ref([])
const groupChats = ref([])

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
const selectChat = async (chatId, type) => {
  currentChat.value = { userId: chatId, chatType: type }

  // 加载聊天历史
  await loadChatHistory(chatId, type)

  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

/**
 * 选择角色（开始私聊）
 * @param {number} characterId - 角色ID
 */
const selectCharacter = async (characterId) => {
  // 选择角色相当于选择与该角色的私聊
  await selectChat(characterId, 'private')
}

/**
 * 加载聊天历史
 * @param {number} chatId - 聊天ID
 * @param {string} type - 聊天类型
 */
const loadChatHistory = async (chatId, type) => {
  try {
    const sessionId = `${type}_${chatId}`

    // 检查缓存
    if (chatSessions.value.has(sessionId)) {
      return chatSessions.value.get(sessionId)
    }

    // 从数据库加载
    const rawMessages = await getChatHistory(sessionId)

    // 为历史消息添加必要的显示属性
    const messages = rawMessages.map(msg => ({
      ...msg,
      isSent: msg.role === 'user' || (msg.role === 'char' && msg.characterId && dbCharacters.value.find(char => char.id === msg.characterId && char.isPlayer)),
      isRead: msg.role !== 'user'
    }))

    // 缓存聊天历史
    chatSessions.value.set(sessionId, messages)

    // 更新对应的聊天对象
    if (type === 'private') {
      const chat = privateChats.value.find(c => c.id === chatId)
      if (chat) {
        chat.messages = messages
      }
    } else if (type === 'group') {
      const chat = groupChats.value.find(c => c.id === chatId)
      if (chat) {
        chat.messages = messages
      }
    }

    return messages
  } catch (error) {
    console.error('加载聊天历史失败:', error)
    return []
  }
}

const sendMessage = async (message) => {
  if (!message.trim() || !currentChat.value.userId) return

  const sessionId = `${currentChat.value.chatType}_${currentChat.value.userId}`

  // 确定消息发送者角色
  const playerCharacter = dbCharacters.value.find(char => char.isPlayer)
  const isPlayerSpeaking = !!playerCharacter
  const role = isPlayerSpeaking ? 'char' : 'user'
  const characterName = isPlayerSpeaking ? playerCharacter.name : null
  const characterId = isPlayerSpeaking ? playerCharacter.id : null

  // 创建用户消息数据
  const userMessageData = {
    content: message,
    timestamp: new Date(),
    role: role,
    characterId: characterId,
    characterName: characterName,
    sessionId: sessionId,
    isSent: true,
    isRead: false
  }

  try {
    // 保存用户消息到数据库
    const savedUserMessage = await saveMessage(userMessageData)

    if (savedUserMessage) {
      // 更新本地缓存
      const cachedMessages = chatSessions.value.get(sessionId) || []
      cachedMessages.push(savedUserMessage)
      chatSessions.value.set(sessionId, cachedMessages)

      // 更新聊天列表
      updateChatList(sessionId, cachedMessages, message)

      // 添加"思考中..."状态消息
      const thinkingMessage = {
        id: 'thinking_' + Date.now(),
        content: t('messages.think'),
        timestamp: new Date(),
        role: 'char',
        characterId: null,
        characterName: 'Assistant',
        sessionId: sessionId,
        isSent: false,
        isRead: true,
        isThinking: true // 标记为思考状态消息
      }

      // 临时添加思考消息到缓存和界面
      const messagesWithThinking = [...cachedMessages, thinkingMessage]
      chatSessions.value.set(sessionId, messagesWithThinking)
      updateChatList(sessionId, messagesWithThinking, thinkingMessage.content)

      // 获取AI响应
      await generateAIResponse(message, sessionId)
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    alert(t('chat.sendMessageError'))
  }
}

// 更新聊天列表的辅助方法
const updateChatList = (sessionId, messages, lastMessage) => {
  if (currentChat.value.chatType === 'private') {
    const privateChat = privateChats.value.find(chat => chat.id === currentChat.value.userId)
    if (privateChat) {
      privateChat.messages = messages
      privateChat.lastMessage = lastMessage
      privateChat.lastMessageTime = new Date()
    }
  } else if (currentChat.value.chatType === 'group') {
    const groupChat = groupChats.value.find(chat => chat.id === currentChat.value.userId)
    if (groupChat) {
      groupChat.messages = messages
      groupChat.lastMessage = lastMessage
      groupChat.lastMessageTime = new Date()
    }
  }
}

// 获取会话参与者
const getSessionParticipants = async () => {
  if (!currentChat.value.userId) return []

  const chatType = currentChat.value.chatType
  const userId = currentChat.value.userId

  if (chatType === 'private') {
    // 私聊：返回对应的角色
    const character = dbCharacters.value.find(char => char.id === userId)
    return character ? [character] : []
  } else if (chatType === 'group') {
    // 群聊：返回群组中的所有角色
    const group = dbGroups.value.find(group => group.id === userId)
    if (group && group.characterIds) {
      return group.characterIds
        .map(charId => dbCharacters.value.find(char => char.id === charId))
        .filter(Boolean)
    }
  }

  return []
}

// 构建AI提示
const constructPrompt = async (targetCharacterName = null, sessionId) => {
  const participants = await getSessionParticipants()

  // 获取聊天历史（最近15条消息）
  const history = await getChatHistory(sessionId)
  const recentHistory = history.slice(-15)

  // 获取对话文本用于触发世界设定
  const convoText = recentHistory.map(h => h.content).join('\n')

  // 获取触发的世界设定
  const triggeredWorlds = dbWorldbooks.value.filter(w => {
    const keywords = w.keywords.split(/[,，]/).map(k => k.trim().toLowerCase())
    return keywords.some(keyword => convoText.toLowerCase().includes(keyword))
  })

  // 检查是否有主角角色
  const playerCharacter = dbCharacters.value.find(char => char.isPlayer)
  const hasPlayerCharacter = !!playerCharacter

  // 构建场景角色部分
  let prompt = `
  == 系统提示 ==
  - 这是一个角色扮演对话
  == 这个场景中的人物 ==
  `
  participants.forEach(p => {
    prompt += `Name: ${p.name}\nPersona: ${p.persona}\n\n`
  })

  // 添加世界设定
  if (triggeredWorlds.length > 0) {
    prompt += '== RELEVANT WORLDBOOK ENTRIES ==\n'
    triggeredWorlds.forEach(w => {
      prompt += `Content for "${w.keywords}": ${w.content}\n\n`
    })
  }

  // 添加对话历史
  prompt += '== RECENT CONVERSATION HISTORY ==\n'

  // 根据是否有主角角色，调整历史消息的显示方式
  recentHistory.forEach(msg => {
    let speakerName
    if (msg.role === 'user') {
      speakerName = hasPlayerCharacter ? (msg.characterName || 'User') : 'User'
    } else {
      speakerName = msg.characterName || '旁白'
    }
    prompt += `${speakerName}: ${msg.content}\n`
  })

  // 构建角色扮演指令
  let roleplayInstruction = ''
  const isGroup = currentChat.value.chatType === 'group' && participants.length > 1

  // 添加基础AI控制规则
  let aiControlRules = 'IMPORTANT: AI can only control the behaviors and dialogues of non-player characters, and must never speak or act on behalf of the player character.'
  if (hasPlayerCharacter) {
    aiControlRules += ` The player character is ${playerCharacter.name}, and the AI must never control this character.`
  }

  if (isGroup) {
    if (targetCharacterName) {
      // 如果有主角，调整提示以反映用户是以主角身份说话
      if (hasPlayerCharacter) {
        roleplayInstruction = `${aiControlRules} ${playerCharacter.name} speaks directly to ${targetCharacterName}. ${targetCharacterName} MUST respond. Format: '${targetCharacterName}: Their dialogue'.`
      } else {
        roleplayInstruction = `${aiControlRules} The User speaks directly to ${targetCharacterName}. ${targetCharacterName} MUST respond. Format: '${targetCharacterName}: Their dialogue'.`
      }
    } else {
      roleplayInstruction = `${aiControlRules} You are the roleplay master, responsible for driving the story forward. Based on the characters and world setting, you MUST decide who speaks next OR provide narration. Narration is crucial for describing the environment, introducing new events, or revealing challenges. For example, 'A cold wind blows through the trees, carrying the scent of decay.' Use narration to make the story dynamic and interesting. For character dialogue, use the format 'CharacterName: Their dialogue'. For narration, omit the prefix.`
    }
  } else {
    // 单角色对话
    if (hasPlayerCharacter && participants[0]?.name === playerCharacter.name) {
      roleplayInstruction = `${aiControlRules} Wait for the input from the player character ${playerCharacter.name}. The AI cannot speak on behalf of the player.`
    } else {
      roleplayInstruction = `${aiControlRules} Continue as ${participants[0]?.name}. Do not include your name as a prefix.`
    }
  }

  // 严格规则
  prompt += `\n[严格规则：玩家角色的发言包含过去式词汇（如：以前、上次、当初、想想、记得、想当初、还记得吗、之前）或 推测性提示词（如：你想想、是不是说过、应该提过），必须调用"chatHistory"工具搜索历史记录；`
  // 如果有主角，添加额外说明
  if (hasPlayerCharacter) {
    prompt += `玩家角色是 ${playerCharacter.name}，AI绝不能代替此角色说话或行动。剧情只能根据 ${playerCharacter.name} 的对话来推进。如果没有说明角色应该互相不认识，应该随着角色之间的对话来缓慢推进剧情。`
  }
  prompt += roleplayInstruction + ']'
  console.log('--- PROMPT SENT TO AI ---\n', prompt)
  return prompt
}

// 生成AI响应
const generateAIResponse = async (userMessage, sessionId) => {
  try {
    // 检查配置是否已加载
    if (!worldConfig.value || !worldConfig.value.apiUrl) {
      console.error('AI配置未加载，无法生成响应');
      throw new Error('AI配置未加载');
    }

    // 获取会话参与者
    const participants = await getSessionParticipants()
    if (participants.length === 0) return

    // 检查是否有@提及
    let mentionedChar = null
    const match = userMessage.match(/@([\p{L}\p{N}_]+)/u)
    if (match) {
      const mentionedName = match[1]
      mentionedChar = participants.find(p =>
        p.name === mentionedName || p.name.toLowerCase() === mentionedName.toLowerCase()
      )
    }

    // 构建提示并获取AI响应
    const prompt = await constructPrompt(mentionedChar ? mentionedChar.name : null, sessionId)
    console.log('@worldConfig.value: ', worldConfig.value);
    const responseText = await getAIResponse(prompt, worldConfig.value)

    // 清理AI响应
    let cleanedResponse = cleanAIResponse(responseText)

    // 解析响应中的角色名和内容
    let respCharName = null
    let content = cleanedResponse
    const parts = cleanedResponse.split(':')

    // 如果有@提及，优先让被@的角色回应
    if (mentionedChar && parts.length > 1) {
      const firstPart = parts[0].trim()
      if (firstPart === mentionedChar.name || firstPart.toLowerCase() === mentionedChar.name.toLowerCase()) {
        respCharName = mentionedChar.name
        content = parts.slice(1).join(':').trim()
      } else {
        respCharName = mentionedChar.name
        content = cleanedResponse
      }
    } else {
      // 没有@提及时，尝试解析角色名
      const speakingChar = participants.find(p => p.name === parts[0].trim())
      if (speakingChar && parts.length > 1) {
        respCharName = speakingChar.name
        content = parts.slice(1).join(':').trim()
      }
    }

    // 创建AI响应消息数据
    const finalCharId = respCharName ? participants.find(p => p.name === respCharName)?.id : null
    const displayName = respCharName || (mentionedChar ? mentionedChar.name : null)

    const aiMessageData = {
      content: content,
      timestamp: new Date(),
      role: 'char',
      characterId: finalCharId,
      characterName: displayName,
      sessionId: sessionId,
      isSent: false,
      isRead: true
    }

    // 保存AI响应到数据库
    const savedAIMessage = await saveMessage(aiMessageData)

    if (savedAIMessage) {
      // 获取当前缓存消息并移除"思考中..."消息
      const cachedMessages = chatSessions.value.get(sessionId) || []
      const filteredMessages = cachedMessages.filter(msg => !msg.isThinking)
      filteredMessages.push(savedAIMessage)
      chatSessions.value.set(sessionId, filteredMessages)

      // 更新聊天列表
      updateChatList(sessionId, filteredMessages, content)
    }

  } catch (error) {
    console.error('AI响应生成失败:', error)

    // 添加错误消息
    const errorMessageData = {
      content: `抱歉，我出错了: ${error.message}`,
      timestamp: new Date(),
      role: 'char',
      characterName: '系统',
      sessionId: sessionId,
      isSent: false,
      isRead: true
    }

    const savedErrorMessage = await saveMessage(errorMessageData)
    if (savedErrorMessage) {
      // 获取当前缓存消息并移除"思考中..."消息
      const cachedMessages = chatSessions.value.get(sessionId) || []
      const filteredMessages = cachedMessages.filter(msg => !msg.isThinking)
      filteredMessages.push(savedErrorMessage)
      chatSessions.value.set(sessionId, filteredMessages)
      updateChatList(sessionId, filteredMessages, errorMessageData.content)
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
  } else if (type === 'worldbook') {
    openWorldbookEditor()
  } else {
    // 其他类型的创建对话框逻辑
    console.log('创建:', type)
  }
}

/**
 * 选择世界设定条目
 * @param {number} entryId - 条目ID
 */
const selectWorldbookEntry = (entryId) => {
  const worldbookEntry = dbWorldbooks.value.find(entry => entry.id === entryId)
  if (worldbookEntry) {
    editingWorldbook.value = worldbookEntry
    showWorldbookEditor.value = true
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
      characterIds: [...(group.characterIds || [])]
    }
  } else {
    // 创建新群组
    editingGroup.value = {
      id: null,
      name: '',
      characterIds: []
    }
  }
  showGroupEditor.value = true
}

/**
 * 编辑群组
 * @param {Object} group - 群组对象
 */
const editGroup = (group) => {
  openGroupEditor(group)
}

/**
 * 删除群组
 * @param {string|number} groupId - 群组ID
 */
const deleteGroup = async (groupId) => {
  try {
    const success = await dbDeleteGroup(groupId)
    if (success) {
      // 更新群组列表
      await loadGroupChats()
      // 如果删除的是当前聊天，重置当前聊天
      if (currentChat.value && currentChat.value.chatType === 'group' && currentChat.value.userId === groupId) {
        currentChat.value = { userId: null, chatType: '' }
      }
    }
  } catch (error) {
    console.error('删除群组失败:', error)
  }
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
      characterIds: []
    }
  }, 300)
}

/**
 * 保存群组
 */
const saveGroup = async (groupData) => {
  if (!groupData || !groupData.name.trim()) {
    return
  }

  // 使用传递的数据，确保数据结构正确
  const saveData = {
    name: groupData.name.trim(),
    characterIds: groupData.characterIds || []
  }

  // 如果是编辑模式，添加 id
  if (groupData.id) {
    saveData.id = groupData.id
  }

  try {
    // 使用数据库保存群组
    const savedId = await dbSaveGroup(saveData)

    if (savedId) {
      // 更新群聊列表
      await loadGroupChats()
      closeGroupEditor()
    }
  } catch (error) {
    console.error('保存群组失败:', error)
    alert('保存群组失败')
  }
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
const saveCharacter = async (characterData) => {
  if (!characterData.name.trim()) {
    return
  }

  const processedData = {
    name: characterData.name.trim(),
    description: characterData.description || '',
    persona: characterData.persona || '',
    greeting: characterData.greeting || '',
    personality: characterData.personality || '',
    background: characterData.background || '',
    isPublic: characterData.isPublic || false,
    allowEdit: characterData.allowEdit || false,
    isPlayer: characterData.isPlayer || false,
    avatar: characterData.avatar
  }

  // 只有在编辑现有角色时才添加id字段
  if (characterData.id) {
    processedData.id = characterData.id
  }

  try {
    // 使用数据库保存角色
    const savedId = await dbSaveCharacter(processedData)

    if (savedId) {
      // 显示成功消息
      alert(t('chat.characters.saveSuccess'))
      closeCharacterEditor()

      // 更新私聊列表（如果需要）
      await loadPrivateChats()
    }
  } catch (error) {
    console.error('保存角色失败:', error)
    alert(t('chat.characters.saveError') || '保存角色失败')
  }
}

/**
 * 删除角色
 * @param {number} characterId - 角色ID
 */
const deleteCharacter = async (characterId) => {
  if (confirm(t('chat.characters.deleteConfirm'))) {
    try {
      // 使用数据库删除角色
      const success = await dbDeleteCharacter(characterId)

      if (success) {
        // 如果正在编辑这个角色，关闭编辑器
        if (editingCharacter.value && editingCharacter.value.id === characterId) {
          closeCharacterEditor()
        }

        // 更新私聊列表
        await loadPrivateChats()

        // 显示成功消息
        alert(t('chat.characters.deleteSuccess'))
      }
    } catch (error) {
      console.error('删除角色失败:', error)
      alert(t('chat.characters.deleteError') || '删除角色失败')
    }
  }
}

/**
 * 切换角色的主角状态
 * @param {number} characterId - 角色ID
 */
const togglePlayerCharacter = async (characterId) => {
  try {
    // 找到要切换的角色
    const character = dbCharacters.value.find(char => char.id === characterId)
    if (!character) {
      console.error('角色不存在:', characterId)
      return
    }

    // 如果要设置为主角，先取消其他角色的主角状态
    if (!character.isPlayer) {
      // 找到当前的主角并取消其主角状态
      const currentPlayer = dbCharacters.value.find(char => char.isPlayer)
      if (currentPlayer) {
        const updatedCurrentPlayer = {
          ...currentPlayer,
          isPlayer: false
        }
        await dbSaveCharacter(updatedCurrentPlayer)
      }
    }

    // 切换目标角色的主角状态
    const updatedCharacter = {
      ...character,
      isPlayer: !character.isPlayer
    }

    // 保存到数据库
    const success = await dbSaveCharacter(updatedCharacter)

    if (success) {
      // 重新加载角色数据
      await refreshData()

      // 显示成功消息
      const message = updatedCharacter.isPlayer
        ? t('chat.characters.setPlayerSuccess')
        : t('chat.characters.removePlayerSuccess')
      alert(message)
    }
  } catch (error) {
    console.error('切换主角状态失败:', error)
    alert(t('chat.characters.togglePlayerError'))
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
 * 打开 API 配置对话框
 */
const openApiConfig = () => {
  showApiConfig.value = true
}

/**
 * 关闭 API 配置对话框
 */
const closeApiConfig = () => {
  showApiConfig.value = false
}

/**
 * 打开向量插件
 */
const openVectorPlugin = () => {
  showVectorPlugin.value = true
}

/**
 * 关闭向量插件
 */
const closeVectorPlugin = () => {
  showVectorPlugin.value = false
}

/**
 * 保存 API 配置
 * @param {Object} configData - API 配置数据
 */
const saveApiConfig = async (configData) => {
  try {
    await saveConfig(configData)
    showApiConfig.value = false
    
    // 刷新数据以确保UI更新
    await refreshData()
    
    console.log('API配置保存成功')
  } catch (error) {
    console.error('保存API配置失败:', error)
  }
}

/**
 * 打开世界之书编辑器
 * @param {Object} worldbook - 要编辑的世界之书条目，如果为空则创建新条目
 */
const openWorldbookEditor = (worldbook = null) => {
  editingWorldbook.value = worldbook
  showWorldbookEditor.value = true
}

/**
 * 关闭世界之书编辑器
 */
const closeWorldbookEditor = () => {
  showWorldbookEditor.value = false
  editingWorldbook.value = null
}

/**
 * 保存世界之书条目
 * @param {Object} worldbookData - 世界之书数据
 */
const saveWorldbookEntry = async (worldbookData) => {
  try {
    // 刷新数据以确保UI更新
    await refreshData()
    
    // 显示成功消息
    console.log(t('chat.worldbook.saveSuccess'))
  } catch (error) {
    console.error('保存世界之书条目失败:', error)
    console.error(t('chat.worldbook.saveError'))
  }
}

/**
 * 删除世界之书条目
 * @param {number} entryId - 条目ID
 */
const deleteWorldbookEntry = async (entryId) => {
  try {
    // 刷新数据以确保UI更新
    await refreshData()
    
    // 显示成功消息
    console.log(t('chat.worldbook.deleteSuccess'))
  } catch (error) {
    console.error('删除世界之书条目失败:', error)
    console.error(t('chat.worldbook.deleteError'))
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

/**
 * 加载私聊列表
 */
const loadPrivateChats = async () => {
  try {
    // 基于角色创建私聊列表
    privateChats.value = dbCharacters.value
      .filter(char => !char.isPlayer)
      .map(char => ({
        id: char.id,
        name: char.name,
        avatar: char.avatar,
        lastMessage: '',
        lastMessageTime: new Date(),
        unreadCount: 0,
        messages: []
      }))
  } catch (error) {
    console.error('加载私聊列表失败:', error)
  }
}

/**
 * 加载群聊列表
 */
const loadGroupChats = async () => {
  try {
    // 基于群组创建群聊列表
    groupChats.value = dbGroups.value.map(group => ({
      id: group.id,
      name: group.name,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${group.name}`,
      lastMessage: '',
      lastMessageTime: new Date(),
      unreadCount: 0,
      memberCount: group.characterIds ? group.characterIds.length : 0,
      characterIds: group.characterIds || [], // 添加角色ID列表
      messages: []
    }))
  } catch (error) {
    console.error('加载群聊列表失败:', error)
  }
}

/**
 * 初始化数据库连接
 */
const initializeDatabase = async () => {
  try {
    // 从本地存储获取当前世界ID
    const worldId = localStorage.getItem('current-world-id')

    if (!worldId) {
      // 如果没有世界ID，跳转回首页
      await router.push('/')
      return
    }

    // 连接到数据库
    const success = await connectToWorld(worldId)

    console.log('数据库连接结果:', success)
    console.log('连接后 worldConfig:', worldConfig.value)

    if (success) {
      // 更新世界信息
      worldInfo.value.title = currentWorld.value

      // 加载聊天列表
      await loadPrivateChats()
      await loadGroupChats()

      // 默认选择第一个私聊
      if (privateChats.value.length > 0) {
        await selectChat(privateChats.value[0].id, 'private')
      }

      console.log('初始化完成后 worldConfig:', worldConfig.value)
    } else {
      console.error('连接数据库失败')
      await router.push('/')
    }
  } catch (error) {
    console.error('初始化数据库失败:', error)
    await router.push('/')
  }
}

// 组件挂载时的初始化
onMounted(async () => {
  checkMobile()
  window.addEventListener('resize', handleResize)

  console.log('组件挂载前 worldConfig:', worldConfig.value)

  // 初始化数据库连接
  await initializeDatabase()

  console.log('数据库初始化后 worldConfig:', worldConfig.value)
})

// 监听数据库错误
watch(dbError, (newError) => {
  if (newError) {
    console.error('数据库错误:', newError)
    // 可以显示错误提示
  }
})

// 监听角色变化，更新私聊列表
watch(dbCharacters, async () => {
  await loadPrivateChats()
}, { deep: true })

// 监听群组变化，更新群聊列表
watch(dbGroups, async () => {
  await loadGroupChats()
}, { deep: true })

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