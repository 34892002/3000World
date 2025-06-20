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
              <input v-model="formData.name" type="text" :placeholder="t('chat.group.namePlaceholder')"
                class="form-input" required />
            </div>
          </div>

          <!-- 群组成员 -->
          <div class="form-section">
            <h4>{{ t('chat.group.membersTitle') }}</h4>
            <div class="members-selector">
              <div class="available-characters">
                <h5>{{ t('chat.group.availableCharacters') }}</h5>
                <div class="character-list">
                  <div v-for="character in availableCharacters" :key="character.id" class="character-item" :class="{ selected: isCharacterSelected(character.id) }" @click="toggleCharacterSelection(character)">
                    <!-- Checkbox removed as selection indicator is sufficient -->
                    <img :src="character.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.name}`" 
                         :alt="character.name" class="character-avatar" />
                    <span class="character-name">{{ character.name }}</span>
                    <span v-if="isCharacterSelected(character.id)" class="selection-indicator">✓</span>
                  </div>
                </div>
              </div>
              <div class="selected-members">
                <h5>{{ t('chat.group.selectedMembers') }} ({{ formData.characterIds.length }})</h5>
                <div class="member-list">
                  <div v-for="member in selectedMembers" :key="member.id" class="member-item">
                    <img :src="member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`" 
                         :alt="member.name" class="member-avatar" />
                    <span class="member-name">{{ member.name }}</span>
                    <button type="button" class="remove-member-btn" @click="removeMember(member.id)">
                      ✕
                    </button>
                  </div>
                </div>
              </div>
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
  characterIds: [] // 改为 characterIds 以匹配 index.html 的数据结构
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
    formData.value.characterIds.includes(character.id)
  )
})

/**
 * 检查是否可以保存
 */
const canSave = computed(() => {
  return formData.value.name.trim().length > 0 && formData.value.characterIds.length >= 1
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
      characterIds: [...(group.characterIds || [])]
    }
  } else {
    formData.value = {
      id: null,
      name: '',
      characterIds: []
    }
  }
}

/**
 * 切换角色选择状态
 */
const toggleCharacterSelection = (character) => {
  const index = formData.value.characterIds.indexOf(character.id)
  if (index > -1) {
    formData.value.characterIds.splice(index, 1)
  } else {
    formData.value.characterIds.push(character.id)
  }
}

/**
 * 检查角色是否已选择
 */
const isCharacterSelected = (characterId) => {
  return formData.value.characterIds.includes(characterId)
}

/**
 * 移除成员
 */
const removeMember = (memberId) => {
  const index = formData.value.characterIds.indexOf(memberId)
  if (index > -1) {
    formData.value.characterIds.splice(index, 1)
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
  // 验证群组名称
  const name = formData.value.name.trim()
  if (!name) {
    // 可以添加错误提示
    return
  }

  // 验证至少选择一个角色
  if (formData.value.characterIds.length < 1) {
    // 可以添加错误提示
    return
  }

  // 准备保存数据，只包含必要字段
  const saveData = {
    name: name,
    characterIds: [...formData.value.characterIds]
  }

  // 如果是编辑模式，包含 id
  if (formData.value.id) {
    saveData.id = formData.value.id
  }

  emit('save', saveData)
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

  .form-input {
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


}

// 成员选择器
.members-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  .available-characters,
  .selected-members {
    h5 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: map.get(map.get($colors, light), text-primary);
    }

    .character-list,
    .member-list {
      border: 1px solid map.get(map.get($colors, light), border);
      border-radius: $border-radius-md;
      max-height: 240px;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.8);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }
  }

  .character-item,
  .member-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: background-color $transition-base;
    position: relative;
    overflow: hidden;
    min-width: 0;
    width: 100%;
    box-sizing: border-box;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba(102, 126, 234, 0.05);
    }

    &.selected {
      background: rgba(102, 126, 234, 0.1);
      border-left: 3px solid map.get($colors, primary);
      padding-left: 13px;
    }

    .character-checkbox {
      width: 18px;
      height: 18px;
      margin-right: 12px;
      accent-color: map.get($colors, primary);
      cursor: pointer;
    }

    .character-avatar,
    .member-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      margin-right: 12px;
      border: 2px solid map.get(map.get($colors, light), border);
      object-fit: cover;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all $transition-base;
    }

    .character-name,
    .member-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: map.get(map.get($colors, light), text-primary);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .selection-indicator {
      font-size: 16px;
      color: map.get($colors, primary);
      font-weight: bold;
      margin-left: 8px;
    }

    .remove-member-btn {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 6px;
      transition: all $transition-base;
      font-size: 14px;
      font-weight: bold;
      margin-left: 8px;

      &:hover {
        background: rgba(239, 68, 68, 0.1);
        transform: scale(1.1);
      }
    }
  }

  .member-item {
    &:hover {
      .member-avatar {
        transform: scale(1.05);
        border-color: map.get($colors, primary);
      }
    }
  }

  .character-item {
    &:hover {
      .character-avatar {
        transform: scale(1.05);
        border-color: map.get($colors, primary);
      }
    }

    &.selected {
      .character-avatar {
        border-color: map.get($colors, primary);
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }
    }
  }
}

// 按钮样式
.btn-primary,
.btn-secondary {
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

// 暗色主题
:global(.dark) {
  .modal-content {
    background: map.get(map.get($colors, dark), bg-primary);
    color: map.get(map.get($colors, dark), text-primary);
  }

  .modal-header {
    border-bottom-color: map.get(map.get($colors, dark), border);

    h3 {
      color: map.get(map.get($colors, dark), text-primary);
      text-shadow: none;
    }
  }

  .close-btn {
    color: map.get(map.get($colors, dark), text-secondary);

    &:hover {
      color: map.get(map.get($colors, dark), text-primary);
      background: rgba(map.get(map.get($colors, dark), text-primary), 0.1);
    }
  }

  .modal-footer {
    border-top-color: map.get(map.get($colors, dark), border);
  }

  .form-section h4 {
    color: map.get(map.get($colors, dark), text-primary);
    border-bottom-color: map.get($colors, primary);
  }

  .form-group label {
    color: map.get(map.get($colors, dark), text-primary);
  }

  .form-input {
    background: map.get(map.get($colors, dark), bg-secondary);
    border-color: map.get(map.get($colors, dark), border);
    color: map.get(map.get($colors, dark), text-primary);

    &:focus {
      border-color: map.get($colors, primary);
      box-shadow: 0 0 0 3px rgba(map.get($colors, primary), 0.2);
    }

    &::placeholder {
      color: map.get(map.get($colors, dark), text-muted);
    }
  }

  .character-list,
  .member-list {
    background: rgba(map.get(map.get($colors, dark), bg-tertiary), 0.5);
    border-color: map.get(map.get($colors, dark), border);
  }

  .character-item {
    &:hover {
      background: rgba(map.get($colors, primary), 0.1);
    }
  }

  .character-checkbox {
    accent-color: map.get($colors, primary);
  }

  .character-name,
  .member-name {
    color: map.get(map.get($colors, dark), text-primary);
  }

  .member-item {
    background: rgba(map.get($colors, primary), 0.1);
    border-color: map.get($colors, primary);
  }

  .remove-member-btn {
    color: map.get($colors, danger);

    &:hover {
      background: rgba(map.get($colors, danger), 0.1);
    }
  }
}
</style>