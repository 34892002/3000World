# 样式系统说明

本项目采用模块化的 SCSS 样式架构，将通用变量和混合宏集中管理，提高代码的可维护性和一致性。

## 文件结构

```
src/styles/
├── README.md          # 本说明文件
├── settings.scss      # Vuetify 配置
└── variables.scss     # 通用变量和混合宏
```

## variables.scss

包含项目中所有通用的 SCSS 变量和混合宏：

### 基础变量
- `$primary-gradient` - 主要渐变色
- `$dark-gradient` - 深色渐变色
- `$font-family` - 字体族

### 尺寸变量
- `$border-radius-lg/md/sm` - 边框圆角
- `$transition-base/slow` - 过渡动画时长
- `$shadow-base/hover` - 阴影效果

### 颜色系统
- `$colors` - 完整的颜色映射，包含主题色和明暗主题变量

### 混合宏
- `@mixin glass-effect()` - 玻璃效果
- `@mixin button-hover()` - 按钮悬停效果
- `@mixin text-shadow-light/dark()` - 文字阴影
- `@mixin card-style()` - 卡片样式
- `@mixin mobile/tablet/desktop()` - 响应式断点

## 使用方法

在组件的 `<style>` 标签中导入：

```scss
<style lang="scss" scoped>
// 导入通用变量和混合宏
@use '@/styles/variables.scss' as *;

// 使用变量
.my-component {
  background: map.get($colors, primary);
  border-radius: $border-radius-md;
  transition: all $transition-base;
}

// 使用混合宏
.glass-card {
  @include glass-effect();
  @include card-style();
}

// 响应式设计
.responsive-element {
  @include mobile {
    font-size: 14px;
  }
  
  @include desktop {
    font-size: 16px;
  }
}
</style>
```

## 优势

1. **一致性** - 所有组件使用相同的设计变量
2. **可维护性** - 修改变量即可全局更新样式
3. **可扩展性** - 易于添加新的变量和混合宏
4. **代码复用** - 避免重复定义相同的样式
5. **主题支持** - 统一的明暗主题切换

## 注意事项

- 新增通用变量时，请在 `variables.scss` 中定义
- 组件特有的样式变量可以在组件内部定义
- 修改通用变量时，请确保不会影响现有组件的显示效果
- 建议使用语义化的变量名，便于理解和维护
