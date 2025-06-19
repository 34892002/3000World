<template>
  <!-- 设置对话框 -->
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ t('chat.settings.title') }}</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div class="setting-group">
          <label>{{ t('chat.settings.language') }}</label>
          <select v-model="selectedLanguage" @change="handleLanguageChange">
            <option v-for="lang in languages" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>
        <div class="setting-group">
          <label class="switch-label">
            <input type="checkbox" v-model="isDarkTheme" @change="handleThemeChange" />
            <span class="switch"></span>
            {{ t('chat.settings.darkTheme') }}
          </label>
        </div>
        <!-- <div class="setting-group">
          <label class="switch-label">
            <input type="checkbox" v-model="notificationsEnabled" @change="handleNotificationChange" />
            <span class="switch"></span>
            {{ t('chat.settings.notifications') }}
          </label>
        </div> -->
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="$emit('close')">
          {{ t('chat.settings.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// 定义组件属性
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  modelLanguage: {
    type: String,
    default: 'zhHans'
  },
  modelDarkTheme: {
    type: Boolean,
    default: false
  },
  modelNotifications: {
    type: Boolean,
    default: true
  }
})

// 定义组件事件
const emit = defineEmits(['close', 'language-change', 'theme-change', 'notification-change'])

// 国际化
const { t } = useI18n()

// 响应式数据
const selectedLanguage = ref(props.modelLanguage)
const isDarkTheme = ref(props.modelDarkTheme)
const notificationsEnabled = ref(props.modelNotifications)

// 可用语言列表
const languages = ref([
  { code: 'zhHans', name: '简体中文' },
  { code: 'en', name: 'English' }
])

/**
 * 处理语言切换
 */
const handleLanguageChange = () => {
  emit('language-change', selectedLanguage.value)
}

/**
 * 处理主题切换
 */
const handleThemeChange = () => {
  emit('theme-change', isDarkTheme.value)
}

/**
 * 处理通知设置变更
 */
const handleNotificationChange = () => {
  emit('notification-change', notificationsEnabled.value)
}

// 监听属性变化，同步内部状态
watch(() => props.modelLanguage, (newVal) => {
  if (newVal !== selectedLanguage.value) {
    selectedLanguage.value = newVal
  }
}, { immediate: true })

watch(() => props.modelDarkTheme, (newVal) => {
  if (newVal !== isDarkTheme.value) {
    isDarkTheme.value = newVal
  }
}, { immediate: true })

watch(() => props.modelNotifications, (newVal) => {
  if (newVal !== notificationsEnabled.value) {
    notificationsEnabled.value = newVal
  }
}, { immediate: true })
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
  max-width: 400px;
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

.setting-group {
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
  
  select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: white;
    color: #374151;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: map.get($colors, primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
}

.switch-label {
  display: flex !important;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  
  input[type="checkbox"] {
    display: none;
  }
}

.switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: #d1d5db;
  border-radius: 12px;
  transition: background-color 0.2s;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

input[type="checkbox"]:checked + .switch {
  background: map.get($colors, primary);
  
  &::after {
    transform: translateX(20px);
  }
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid map.get(map.get($colors, light), border);
  display: flex;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 8px 16px;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: #e5e7eb;
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
  
  .setting-group {
    label {
      color: #e2e8f0;
    }
    
    select {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(71, 85, 105, 0.5);
      color: #f1f5f9;
      
      option {
        background: #1e293b;
        color: #f1f5f9;
      }
    }
  }
  
  .modal-footer {
    border-top: 1px solid rgba(71, 85, 105, 0.3);
  }
  
  .btn-secondary {
    background: rgba(71, 85, 105, 0.8);
    color: #f1f5f9;
    border: 1px solid rgba(71, 85, 105, 0.5);
    
    &:hover {
      background: rgba(71, 85, 105, 1);
    }
  }
  
  .switch {
    background: #475569;
  }
  
  input[type="checkbox"]:checked + .switch {
    background: #667eea;
  }
}
</style>