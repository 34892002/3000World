<template>
  <!-- 群组编辑对话框 -->
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content editor-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? t('chat.group.editTitle') : t('chat.group.createTitle') }}</h3>
        <button class="close-btn" @click="handleClose">✕</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSave" class="group-form">
          <!-- 群组基本信息 -->
          <div class="form-section">
            <h4>{{ t('chat.group.basicInfo') }}</h4>
            <div class="form-group">
              <label>{{ t('chat.group.nameLabel') }}</label>
              <input 
                v-model="formData.name"
                type="text" 
                :placeholder="t('chat.group.namePlaceholder')"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label>{{ t('chat.group.descriptionLabel') }}</label>
              <textarea 
                v-model="formData.description"
                :placeholder="t('chat.group.descriptionPlaceholder')"
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>
            <div class="form-group">
              <label>{{ t('chat.group.avatarLabel') }}</label>
              <div class="avatar-input-group">
                <input 
                  v-model="formData.avatar"
                  type="url" 
                  :placeholder="t('chat.group.avatarPlaceholder')"
                  class="form-input"
                />
                <div class="avatar-preview">
                  <img :src="formData.avatar || 'https://api.dicebear.com/7.x/identicon/svg?seed=group'" :alt="formData.name" />
                </div>
              </div>
            </div>
          </div>

          <!-- 群组成员 -->
          <div class="form-section">
            <h4>{{ t('chat.group.membersTitle') }}</h4>
            <div class="members-selector">
              <div class="available-characters">
                <h5>{{ t('chat.group.availableCharacters') }}</h5>
                <div class="character-list">
                  <div 
                    v-for="character in availableCharacters" 
                    :key="character.id"
                    class="character-item"
                    @click="toggleCharacterSelection(character)"
                    :class="{ selected: isCharacterSelected(character.id) }"
                  >
                    <img :src="character.avatar" :alt="character.name" class="character-avatar" />
                    <span class="character-name">{{ character.name }}</span>
                    <span class="selection-indicator">{{ isCharacterSelected(character.id) ? '✓' : '+' }}</span>
                  </div>
                </div>
              </div>
              <div class="selected-members">
                <h5>{{ t('chat.group.selectedMembers') }} ({{ formData.members.length }})</h5>
                <div class="member-list">
                  <div 
                    v-for="member in selectedMembers" 
                    :key="member.id"
                    class="member-item"
                  >
                    <img :src="member.avatar" :alt="member.name" class="member-avatar" />
                    <span class="member-name">{{ member.name }}</span>
                    <button 
                      type="button"
                      class="remove-member-btn"
                      @click="removeMember(member.id)"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 群组设置 -->
          <div class="form-section">
            <h4>{{ t('chat.group.settingsTitle') }}</h4>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.isPrivate" />
                <span class="checkbox"></span>
                {{ t('chat.group.privateGroup') }}
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.allowInvites" />
                <span class="checkbox"></span>
                {{ t('chat.group.allowInvites') }}
              </label>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" @click="handleClose">
          {{ t('chat.common.cancel') }}
        </button>
        <button type="button" class="btn-primary" @click="handleSave" :disabled="!canSave">
          {{ isEditing ? t('chat.common.save') : t('chat.common.create') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  group: {
    type: Object,
    default: null
  },
  characters: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['close', 'save'])

// 表单数据
const formData = ref({
  id: null,
  name: '',
  description: '',
  avatar: '',
  members: [],
  isPrivate: false,
  allowInvites: true
})

// 计算属性
const isEditing = computed(() => !!formData.value.id)

/**
 * 获取可选角色列表
 */
const availableCharacters = computed(() => {
  return props.characters || []
})

/**
 * 获取已选成员列表
 */
const selectedMembers = computed(() => {
  return availableCharacters.value.filter(character => 
    formData.value.members.includes(character.id)
  )
})

/**
 * 检查是否可以保存
 */
const canSave = computed(() => {
  return formData.value.name.trim().length > 0
})

// 方法

/**
 * 初始化表单数据
 */
const initFormData = (group = null) => {
  if (group) {
    formData.value = {
      id: group.id,
      name: group.name || '',
      description: group.description || '',
      avatar: group.avatar || '',
      members: [...(group.members || [])],
      isPrivate: group.isPrivate || false,
      allowInvites: group.allowInvites !== false
    }
  } else {
    formData.value = {
      id: null,
      name: '',
      description: '',
      avatar: '',
      members: [],
      isPrivate: false,
      allowInvites: true
    }
  }
}

/**
 * 切换角色选择状态
 */
const toggleCharacterSelection = (character) => {
  const index = formData.value.members.indexOf(character.id)
  if (index > -1) {
    formData.value.members.splice(index, 1)
  } else {
    formData.value.members.push(character.id)
  }
}

/**
 * 检查角色是否已选择
 */
const isCharacterSelected = (characterId) => {
  return formData.value.members.includes(characterId)
}

/**
 * 移除成员
 */
const removeMember = (memberId) => {
  const index = formData.value.members.indexOf(memberId)
  if (index > -1) {
    formData.value.members.splice(index, 1)
  }
}

/**
 * 处理关闭事件
 */
const handleClose = () => {
  emit('close')
}

/**
 * 处理遮罩层点击事件
 */
const handleOverlayClick = () => {
  handleClose()
}

/**
 * 处理保存事件
 */
const handleSave = () => {
  if (!canSave.value) {
    return
  }
  
  emit('save', { ...formData.value })
}

// 监听器
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    initFormData(props.group)
  }
})

watch(() => props.group, (newGroup) => {
  if (props.visible) {
    initFormData(newGroup)
  }
})
</script>

<style lang="scss" scoped>
// 导入通用变量和混合宏
@use 'sass:map';
@use '@/styles/variables.scss' as *;

// 模态框
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid map.get(map.get($colors, light), border);
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: map.get(map.get($colors, light), text-primary);
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  color: map.get(map.get($colors, light), text-secondary);
  border-radius: 4px;
  transition: all $transition-base;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    color: map.get(map.get($colors, light), text-primary);
  }
}

.modal-body {
  padding: 20px;
  max-height: calc(90vh - 140px);
  overflow-y: auto;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid map.get(map.get($colors, light), border);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 群组表单
.group-form {
  .form-section {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    
    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: map.get(map.get($colors, light), text-primary);
      text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
    }
    
    h5 {
      font-size: 14px;
      font-weight: 500;
      margin: 0 0 8px 0;
      color: map.get(map.get($colors, light), text-secondary);
    }
  }
  
  .form-group {
    margin-bottom: 16px;
    
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 6px;
      color: map.get(map.get($colors, light), text-secondary);
    }
  }
  
  .form-input, .form-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid map.get(map.get($colors, light), border);
    border-radius: $border-radius-sm;
    font-size: 14px;
    outline: none;
    transition: all $transition-base;
    background: rgba(255, 255, 255, 0.8);
    
    &:focus {
      border-color: map.get($colors, primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      background: rgba(255, 255, 255, 0.95);
    }
    
    &::placeholder {
      color: map.get(map.get($colors, light), text-muted);
    }
  }
  
  .form-textarea {
    resize: vertical;
    min-height: 80px;
  }
  
  .avatar-input-group {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    
    .form-input {
      flex: 1;
    }
  }
  
  .avatar-preview {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid map.get(map.get($colors, light), border);
    flex-shrink: 0;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  
  .checkbox-label {
    display: flex !important;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: map.get(map.get($colors, light), text-secondary);
    
    input[type="checkbox"] {
      display: none;
    }
    
    .checkbox {
      width: 18px;
      height: 18px;
      border: 2px solid map.get(map.get($colors, light), border);
      border-radius: 3px;
      position: relative;
      transition: all $transition-base;
      background: rgba(255, 255, 255, 0.8);
      
      &::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        opacity: 0;
        transition: opacity $transition-base;
      }
    }
    
    input[type="checkbox"]:checked + .checkbox {
      background: map.get($colors, primary);
      border-color: map.get($colors, primary);
      
      &::after {
        opacity: 1;
      }
    }
  }
}

// 成员选择器
.members-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
  .available-characters, .selected-members {
    .character-list, .member-list {
      border: 1px solid map.get(map.get($colors, light), border);
      border-radius: $border-radius-sm;
      max-height: 200px;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.5);
    }
  }
  
  .character-item, .member-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: background-color $transition-base;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
    
    &.selected {
      background: rgba(102, 126, 234, 0.1);
    }
    
    .character-avatar, .member-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 8px;
      border: 1px solid map.get(map.get($colors, light), border);
      object-fit: cover;
    }
    
    .character-name, .member-name {
      flex: 1;
      font-size: 14px;
      color: map.get(map.get($colors, light), text-primary);
    }
    
    .selection-indicator {
      font-size: 16px;
      color: map.get(map.get($colors, light), text-muted);
    }
    
    .remove-member-btn {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all $transition-base;
      
      &:hover {
        background: rgba(239, 68, 68, 0.1);
      }
    }
  }
}

// 按钮样式
.btn-primary, .btn-secondary {
  padding: 10px 20px;
  border-radius: $border-radius-sm;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-base;
  border: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: map.get($colors, primary);
  color: white;
  
  &:hover:not(:disabled) {
    background: #5a6fd8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
}

.btn-secondary {
  background: rgba(107, 114, 128, 0.1);
  color: map.get(map.get($colors, light), text-secondary);
  border: 1px solid map.get(map.get($colors, light), border);
  
  &:hover {
    background: rgba(107, 114, 128, 0.2);
  }
}

// 深色主题
:root.dark-theme {
  .modal-content {
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(71, 85, 105, 0.3);
    backdrop-filter: blur(20px);
  }
  
  .modal-header {
    border-bottom: 1px solid rgba(71, 85, 105, 0.3);
    
    h3 {
      color: #f1f5f9;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }
  }
  
  .close-btn {
    color: #cbd5e1;
    
    &:hover {
      color: #f1f5f9;
      background: rgba(71, 85, 105, 0.3);
    }
  }
  
  .modal-footer {
    border-top: 1px solid rgba(71, 85, 105, 0.3);
  }
  
  .group-form {
    .form-section {
      border-bottom-color: rgba(71, 85, 105, 0.3);
      
      h4 {
        color: #f1f5f9;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
      }
      
      h5 {
        color: #e2e8f0;
      }
    }
    
    .form-group label {
      color: #e2e8f0;
    }
    
    .form-input, .form-textarea {
      border-color: rgba(71, 85, 105, 0.5);
      background: rgba(30, 41, 59, 0.8);
      color: #f1f5f9;
      
      &:focus {
        background: rgba(30, 41, 59, 0.95);
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
      }
      
      &::placeholder {
        color: #94a3b8;
      }
    }
    
    .avatar-preview {
      border-color: rgba(71, 85, 105, 0.5);
    }
    
    .checkbox-label {
      color: #e2e8f0;
      
      .checkbox {
        border-color: rgba(71, 85, 105, 0.5);
        background: rgba(30, 41, 59, 0.8);
        
        &::after {
          color: white;
        }
      }
      
      input[type="checkbox"]:checked + .checkbox {
        background: #667eea;
        border-color: #667eea;
      }
    }
  }
  
  .members-selector {
    .available-characters, .selected-members {
      .character-list, .member-list {
        border-color: rgba(71, 85, 105, 0.3);
        background: rgba(30, 41, 59, 0.5);
      }
    }
    
    .character-item, .member-item {
      border-bottom-color: rgba(71, 85, 105, 0.2);
      
      &:hover {
        background: rgba(71, 85, 105, 0.3);
      }
      
      &.selected {
        background: rgba(102, 126, 234, 0.2);
      }
      
      .character-avatar, .member-avatar {
        border-color: rgba(71, 85, 105, 0.3);
      }
      
      .character-name, .member-name {
        color: #f1f5f9;
      }
      
      .selection-indicator {
        color: #94a3b8;
      }
      
      .remove-member-btn {
        color: #f87171;
        
        &:hover {
          background: rgba(248, 113, 113, 0.2);
        }
      }
    }
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