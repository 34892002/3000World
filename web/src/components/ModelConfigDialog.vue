<template>
  <!-- API配置对话框 -->
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ t('chat.worldSettings.model.title') }}</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <form @submit.prevent="handleSave">
          <div class="form-group">
            <label for="api-key">{{ t('chat.worldSettings.model.apiKey') }}</label>
            <input
              id="api-key"
              v-model="formData.apiKey"
              type="password"
              :placeholder="t('chat.worldSettings.model.apiKeyPlaceholder')"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label for="api-url">{{ t('chat.worldSettings.model.apiUrl') }}</label>
            <input
              id="api-url"
              v-model="formData.apiUrl"
              type="url"
              :placeholder="t('chat.worldSettings.model.apiUrlPlaceholder')"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label for="model">{{ t('chat.worldSettings.model.model') }}</label>
            <input
              id="model"
              v-model="formData.model"
              type="text"
              :placeholder="t('chat.worldSettings.model.modelPlaceholder')"
              class="form-input"
              required
            />
          </div>
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="$emit('close')">
              {{ t('chat.common.cancel') }}
            </button>
            <button type="submit" class="btn-primary" :disabled="!isFormValid">
              {{ t('chat.common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  config: {
    type: Object,
    default: () => ({
      apiKey: '',
      apiUrl: '',
      model: ''
    })
  }
})

// 定义组件事件
const emit = defineEmits(['close', 'save'])

// 国际化
const { t } = useI18n()

// 表单数据
const formData = ref({
  apiKey: '',
  apiUrl: '',
  model: ''
})

// 表单验证
const isFormValid = computed(() => {
  return formData.value.apiUrl.trim() !== '' && formData.value.model.trim() !== ''
})

/**
 * 处理保存
 */
const handleSave = () => {
  if (isFormValid.value) {
    emit('save', { ...formData.value })
    emit('close')
  }
}

// 监听配置变化，同步到表单
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    formData.value = {
      apiKey: newConfig.apiKey || '',
      apiUrl: newConfig.apiUrl || '',
      model: newConfig.model || ''
    }
  }
}, { immediate: true, deep: true })

// 监听对话框显示状态，重置表单
watch(() => props.visible, (visible) => {
  if (visible && props.config) {
    formData.value = {
      apiKey: props.config.apiKey || '',
      apiUrl: props.config.apiUrl || '',
      model: props.config.model || ''
    }
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;
@use 'sass:map';

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

.modal-content {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid map.get(map.get($colors, light), border);
  color: #1f2937;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 8px;
  }
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 14px;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: map.get($colors, primary);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-secondary {
  padding: 10px 20px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: #e5e7eb;
  }
}

.btn-primary {
  padding: 10px 20px;
  background: map.get($colors, primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: map.get($colors, primary);
  }
  
  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
  }
}

// 深色主题样式
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
  
  .form-group {
    label {
      color: #e2e8f0;
    }
  }
  
  .form-input {
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(71, 85, 105, 0.5);
    color: #f1f5f9;
    
    &::placeholder {
      color: #64748b;
    }
    
    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
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
  
  .btn-primary {
    &:disabled {
      background: #475569;
    }
  }
}
</style>