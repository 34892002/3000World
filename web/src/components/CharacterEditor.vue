<template>
  <!-- 角色编辑对话框 -->
  <div v-if="visible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ character ? t('chat.characters.editTitle') : t('chat.characters.createTitle') }}</h3>
        <button class="close-btn" @click="closeModal">×</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSave" class="character-form">
          <!-- 角色基本信息 -->
          <div class="form-section">
            <h4>{{ t('chat.characters.basicInfo') }}</h4>
            <div class="form-group">
              <label>{{ t('chat.characters.nameLabel') }}</label>
              <input 
                v-model="formData.name"
                type="text" 
                :placeholder="t('chat.characters.namePlaceholder')"
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label>{{ t('chat.characters.avatarLabel') }}</label>
              <div class="avatar-input-group">
                <input 
                  v-model="formData.avatar"
                  type="url" 
                  :placeholder="t('chat.characters.avatarPlaceholder')"
                  class="form-input"
                />
                <div class="avatar-preview">
                  <img :src="formData.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + formData.name" :alt="formData.name" />
                </div>
              </div>
            </div>
          </div>

          <!-- 角色设定 -->
          <div class="form-section">
            <h4>{{ t('chat.characters.personaTitle') }}</h4>
            <div class="form-group">
              <label>{{ t('chat.characters.personaLabel') }}</label>
              <textarea 
                v-model="formData.persona"
                :placeholder="t('chat.characters.personaPlaceholder')"
                class="form-textarea"
                rows="4"
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label>{{ t('chat.characters.greetingLabel') }}</label>
              <textarea 
                v-model="formData.greeting"
                :placeholder="t('chat.characters.greetingPlaceholder')"
                class="form-textarea"
                rows="1"
                required
              ></textarea>
            </div>
          </div>

          <!-- 性格特征 -->
          <!-- <div class="form-section">
            <h4>{{ t('chat.characters.personalityTitle') }}</h4>
            
            <div class="form-group">
              <label for="character-personality">{{ t('chat.characters.personalityLabel') }}</label>
              <textarea 
                id="character-personality"
                v-model="formData.personality" 
                class="form-textarea"
                :placeholder="t('chat.characters.personalityPlaceholder')"
                rows="4"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label for="character-background">{{ t('chat.characters.backgroundLabel') }}</label>
              <textarea 
                id="character-background"
                v-model="formData.background" 
                class="form-textarea"
                :placeholder="t('chat.characters.backgroundPlaceholder')"
                rows="4"
              ></textarea>
            </div>
          </div> -->

          <!-- 角色设置 -->
          <div class="form-section">
            <h4>{{ t('chat.characters.settingsTitle') }}</h4>
            
            <!-- <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.isPublic" />
                <span class="checkbox"></span>
                {{ t('chat.characters.isPublic') }}
              </label>
              <p class="help-text">{{ t('chat.characters.isPublicHelp') }}</p>
            </div> -->
            
            <!-- <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.allowEdit" />
                <span class="checkbox"></span>
                {{ t('chat.characters.allowEdit') }}
              </label>
              <p class="help-text">{{ t('chat.characters.allowEditHelp') }}</p>
            </div> -->
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="formData.isPlayer" />
                <span class="checkbox"></span>
                {{ t('chat.characters.isPlayer') }}
              </label>
              <p class="help-text">{{ t('chat.characters.isPlayerHelp') }}</p>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="closeModal">{{ t('chat.common.cancel') }}</button>
        <button 
          class="btn-primary" 
          @click="saveCharacter"
          :disabled="!formData.name.trim()"
        >
          {{ t('chat.common.save') }}
        </button>
        <button 
          v-if="character" 
          class="btn-danger" 
          @click="deleteCharacter"
        >
          {{ t('chat.common.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 国际化
const { t } = useI18n()

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  character: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close', 'save', 'delete'])

// 响应式数据
const form = ref({
  id: null,
  name: '',
  description: '',
  avatar: '',
  personality: '',
  background: ''
})

const formData = ref({
  name: '',
  description: '',
  avatar: '',
  persona: '',
  greeting: '',
  personality: '',
  background: '',
  isPublic: false,
  allowEdit: false,
  isPlayer: false
})

// 计算属性
/**
 * 是否为编辑模式
 */
const isEditing = computed(() => {
  return props.character && props.character.id
})

/**
 * 是否可以保存
 */
const canSave = computed(() => {
  return formData.value.name.trim().length > 0
})

// 方法

/**
 * 初始化表单数据
 */
const initFormData = (character = null) => {
  if (character) {
    form.value = {
      id: character.id,
      name: character.name || '',
      description: character.description || '',
      avatar: character.avatar || '',
      personality: character.personality || '',
      background: character.background || ''
    }
    formData.value = {
      name: character.name || '',
      avatar: character.avatar || '',
      persona: character.persona || '',
      greeting: character.greeting || '',
      personality: character.personality || '',
      background: character.background || '',
      isPublic: character.isPublic || false,
      allowEdit: character.allowEdit || false,
      isPlayer: character.isPlayer || false
    }
  } else {
    form.value = {
      id: null,
      name: '',
      description: '',
      avatar: '',
      personality: '',
      background: ''
    }
    formData.value = {
      name: '',
      avatar: '',
      persona: '',
      greeting: '',
      personality: '',
      background: '',
      isPublic: false,
      allowEdit: false,
      isPlayer: false
    }
  }
}

/**
 * 关闭模态框
 */
const closeModal = () => {
  emit('close')
}

/**
 * 保存角色
 */
const saveCharacter = () => {
  if (!canSave.value) {
    return
  }
  
  const characterData = {
    id: form.value.id,
    ...formData.value
  }
  
  emit('save', characterData)
}

/**
 * 删除角色
 */
const deleteCharacter = () => {
  if (isEditing.value) {
    emit('delete', form.value.id)
  }
}

// 监听器
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    initFormData(props.character)
  }
})

// 监听character属性变化
watch(() => props.character, (newCharacter) => {
  if (props.visible) {
    initFormData(newCharacter)
  }
}, { deep: true })
</script>

<style lang="scss" scoped>
@use 'sass:map';
@use 'sass:color';
@use '@/styles/variables.scss' as *;

// 模态框样式
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
  max-width: 600px;
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

// 表单样式
.character-form {
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
    color: map.get(map.get($colors, light), text-secondary);
    
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
    min-height: 50px;
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
  
  .help-text {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
    font-style: italic;
    color: map.get(map.get($colors, light), text-muted);
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
  
  .character-form {
    .form-section {
      border-bottom-color: rgba(71, 85, 105, 0.3);
      
      h4 {
        color: #f1f5f9;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
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