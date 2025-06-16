### 快速使用
import { useNotification } from '@/composables/useNotification'

notification.success('操作成功！')
notification.error('操作失败！')
notification.warning('请注意！')
notification.info('提示信息')
### 1. 基础用法

```vue
<script setup>
import { useNotification } from '@/composables/useNotification'

const notification = useNotification()

// 显示不同类型的通知
function handleSuccess() {
  notification.success('操作成功！')
}

function handleError() {
  notification.error('操作失败！')
}

function handleWarning() {
  notification.warning('请注意！')
}

function handleInfo() {
  notification.info('提示信息')
}
</script>
```

### 2. 带选项的通知

```javascript
// 自定义超时时间
notification.success('数据保存成功', {
  timeout: 5000 // 5秒后自动关闭
})
```

### 3. 组件外

```javascript
import { useNotification } from '@/composables/useNotification'

// 延迟初始化通知实例，避免在Pinia未激活时调用
let notification = null

/**
 * 获取通知实例（延迟初始化）
 * @returns {Object} 通知实例
 */
function getNotification() {
  if (!notification) {
    notification = useNotification()
  }
  return notification
}

getNotification().error(message)
```

### 4. API错误处理
自动弹出
```
