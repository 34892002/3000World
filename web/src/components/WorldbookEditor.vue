<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="worldbook-editor" @click.stop>
      <div class="editor-header">
        <h3>{{ isEditing ? $t('chat.worldbook.editTitle') : $t('chat.worldbook.createTitle') }}</h3>
        <button @click="closeEditor" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="editor-content">
        <div class="form-group">
          <label>{{ $t('chat.worldbook.keywordsLabel') }}</label>
          <input 
            v-model="formData.keywords" 
            type="text" 
            :placeholder="$t('chat.worldbook.keywordsPlaceholder')"
            class="form-input"
          />
        </div>
        
        <div class="form-group">
          <label>{{ $t('chat.worldbook.contentLabel') }}</label>
          <textarea 
            v-model="formData.content" 
            :placeholder="$t('chat.worldbook.contentPlaceholder')"
            class="form-textarea"
            rows="8"
          ></textarea>
        </div>
      </div>
      
      <div class="editor-footer">
        <button @click="closeEditor" class="btn btn-secondary">
          {{ $t('chat.common.cancel') }}
        </button>
        <button 
          @click="saveWorldbook" 
          class="btn btn-primary"
          :disabled="!isFormValid"
        >
          {{ $t('chat.common.save') }}
        </button>
        <button 
          v-if="isEditing" 
          @click="deleteWorldbook" 
          class="btn btn-danger"
        >
          {{ $t('chat.common.delete') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDatabase } from '@/composables/useDatabase'

const { t } = useI18n()
const { saveWorldbook: dbSaveWorldbook, deleteWorldbook: dbDeleteWorldbook, worldbooks } = useDatabase()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  worldbook: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved', 'deleted'])

const formData = ref({
  keywords: '',
  content: ''
})

const isEditing = computed(() => !!props.worldbook)

const isFormValid = computed(() => {
  return formData.value.keywords.trim() && formData.value.content.trim()
})

// 监听 worldbook prop 变化，初始化表单数据
watch(() => props.worldbook, (newWorldbook) => {
  if (newWorldbook) {
    formData.value = {
      keywords: newWorldbook.keywords || '',
      content: newWorldbook.content || ''
    }
  } else {
    formData.value = {
      keywords: '',
      content: ''
    }
  }
}, { immediate: true })

const closeEditor = () => {
  emit('close')
}

const saveWorldbook = async () => {
  if (!isFormValid.value) {
    // 显示验证错误提示
    alert(t('chat.worldbook.validationError'))
    return
  }
  
  try {
    const worldbookData = {
      ...formData.value
    }
    
    // 只有在编辑现有条目时才包含id字段
    if (isEditing.value) {
      worldbookData.id = props.worldbook.id
    }
    
    const result = await dbSaveWorldbook(worldbookData)
    
    if (result) {
      // 显示成功消息
      console.log(t('chat.worldbook.saveSuccess'))
      
      emit('saved', { ...worldbookData, id: result })
      emit('close')
    } else {
      // 保存失败
      alert(t('chat.worldbook.saveError'))
    }
  } catch (error) {
    console.error('保存世界之书失败:', error)
    // 显示错误消息
    alert(t('chat.worldbook.saveError'))
  }
}

const deleteWorldbook = async () => {
  if (!confirm(t('chat.worldbook.deleteConfirm'))) {
    return
  }
  
  try {
    await dbDeleteWorldbook(props.worldbook.id)
    
    // 显示成功消息
    console.log(t('chat.worldbook.deleteSuccess'))
    
    emit('deleted', props.worldbook.id)
    emit('close')
  } catch (error) {
    console.error('删除世界之书失败:', error)
    // 显示错误消息
    console.error(t('chat.worldbook.deleteError'))
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use 'sass:map';
@use 'sass:color';

// 模态框样式
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

// 编辑器主容器
.worldbook-editor {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
}

// 编辑器头部
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid map.get(map.get($colors, light), border);
  background: map.get(map.get($colors, light), bg-secondary);
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: map.get(map.get($colors, light), text-primary);
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  color: map.get(map.get($colors, light), text-muted);
  border-radius: 4px;
  transition: all $transition-base;
  
  &:hover {
    color: map.get(map.get($colors, light), text-primary);
    @include button-hover();
  }
}

// 编辑器内容区
.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.section {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 16px;
    font-weight: 600;
    color: map.get(map.get($colors, light), text-primary);
    border-bottom: 1px solid map.get(map.get($colors, light), border);
    padding-bottom: 8px;
  }
}

// 表单组件
.form-group {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    font-weight: 500;
    color: map.get(map.get($colors, light), text-secondary);
    margin-bottom: 8px;
    font-size: 14px;
  }
  
  small {
    display: block;
    margin-top: 4px;
    color: map.get(map.get($colors, light), text-muted);
    font-size: 12px;
  }
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid map.get(map.get($colors, light), border);
  border-radius: $border-radius-sm;
  background: white;
  color: map.get(map.get($colors, light), text-primary);
  font-size: 14px;
  transition: all $transition-base;
  box-sizing: border-box;
  font-family: $font-family;
  
  &:focus {
    outline: none;
    border-color: map.get($colors, primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: map.get(map.get($colors, light), text-muted);
  }
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

// 编辑器底部
.editor-footer {
  padding: 20px;
  border-top: 1px solid map.get(map.get($colors, light), border);
  background: map.get(map.get($colors, light), bg-secondary);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 按钮样式
.btn {
  padding: 8px 16px;
  border-radius: $border-radius-sm;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all $transition-base;
  min-width: 80px;
  border: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: #f3f4f6;
  color: map.get(map.get($colors, light), text-secondary);
  border: 1px solid map.get(map.get($colors, light), border);
  
  &:hover:not(:disabled) {
    background: #e5e7eb;
  }
}

.btn-primary {
  background: map.get($colors, primary);
  color: white;
  
  &:hover:not(:disabled) {
    background: color.adjust(map.get($colors, primary), $lightness: -10%);
  }
}

.btn-danger {
  background: map.get($colors, danger);
  color: white;
  
  &:hover:not(:disabled) {
    background: color.adjust(map.get($colors, danger), $lightness: -10%);
  }
}

// 响应式设计
@include mobile {
  .editor-header,
  .editor-content,
  .editor-footer {
    padding: 16px;
  }
  
  .editor-footer {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
  
  .section {
    margin-bottom: 20px;
  }
}

// 深色主题样式
:root.dark-theme {
  .worldbook-editor {
    @include glass-effect(map.get(map.get($colors, dark), bg-primary));
    border: 1px solid map.get(map.get($colors, dark), border);
  }
  
  .editor-header {
    border-bottom: 1px solid map.get(map.get($colors, dark), border);
    background: map.get(map.get($colors, dark), bg-secondary);
    
    h3 {
      color: map.get(map.get($colors, dark), text-primary);
    }
  }
  
  .close-btn {
    color: map.get(map.get($colors, dark), text-muted);
    
    &:hover {
      color: map.get(map.get($colors, dark), text-primary);
      background: rgba(71, 85, 105, 0.3);
    }
  }
  
  .section h4 {
    color: map.get(map.get($colors, dark), text-primary);
    border-bottom: 1px solid map.get(map.get($colors, dark), border);
  }
  
  .form-group {
    label {
      color: map.get(map.get($colors, dark), text-secondary);
    }
    
    small {
      color: map.get(map.get($colors, dark), text-muted);
    }
  }
  
  .form-input,
  .form-textarea {
    background: map.get(map.get($colors, dark), bg-secondary);
    border: 1px solid map.get(map.get($colors, dark), border);
    color: map.get(map.get($colors, dark), text-primary);
    
    &::placeholder {
      color: map.get(map.get($colors, dark), text-muted);
    }
    
    &:focus {
      border-color: map.get($colors, primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }
  }
  

  
  .editor-footer {
    border-top: 1px solid map.get(map.get($colors, dark), border);
    background: map.get(map.get($colors, dark), bg-secondary);
  }
  
  .btn-secondary {
    background: rgba(71, 85, 105, 0.8);
    color: map.get(map.get($colors, dark), text-primary);
    border: 1px solid map.get(map.get($colors, dark), border);
    
    &:hover:not(:disabled) {
      background: rgba(71, 85, 105, 1);
    }
  }
}
</style>