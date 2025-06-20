# 3000World

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.5+-green.svg)
![Vuetify](https://img.shields.io/badge/Vuetify-3.8+-blue.svg)

[![English](https://img.shields.io/badge/English-Click-yellow)](README_EN.md)
[![中文文档](https://img.shields.io/badge/中文文档-点击查看-orange)](README.md)

欢迎来到 **3000World**，一个基于角色扮演与实时群聊的创新应用，旨在为你带来沉浸式的互动体验。无论你是热衷于创建虚拟角色、构建世界观，还是渴望沉浸于富有创意的对话中，3000World 都将是你最佳的选择！

### 示例世界

项目包含一个示例世界文件 `example_world.json`，展示了经典的"华强买瓜"场景，你可以：

- 导入示例世界快速体验功能
- 参考示例数据结构创建自己的世界
- 了解角色设定和世界观配置方法

### 本地演示(PC)

如果你想快速体验功能，可以直接打开 `local.html` 文件，这是一个包含完整功能的本地演示页面。

![local ui](doc/img/s_4_cn.png)

## 🖥️界面展示(手机 & PC)
![界面展示](doc/img/s_1_cn.png)
![界面展示](doc/img/s_2_cn.png)
![界面展示](doc/img/s_3_cn.png)

## 🎯 项目特色

- 🌍 **多世界管理系统** - 支持创建和管理多个虚拟世界
- 🎭 **智能角色系统** - AI驱动的角色对话与互动
- 💬 **实时群聊功能** - 多角色同时参与的动态对话
- 🎨 **现代化UI设计** - 基于Vuetify的响应式界面
- 💾 **本地数据存储** - 使用IndexedDB确保数据安全
- 🔧 **高度可定制** - 灵活的世界观和角色设定系统

## ✨ 主要功能

### 🌐 多世界管理

* **轻松选择**：从已有的虚拟世界中轻松选择，或者一键创建全新的世界。
* **自由创造**：定制专属世界设定，打造属于你的独特宇宙。

### 🎭 角色与群组互动

* **角色塑造**：自由设计角色性格、背景故事与开场白。
* **动态群聊**：邀请多个角色加入对话，体验丰富多彩的群组互动。

### 💬 智能对话系统

* **即时互动**：智能AI驱动，角色拥有生动自然的交流能力。
* **便捷输入**：支持 @ 提及功能，快速定位并互动特定角色。

### 🖥️ 直观的用户界面

* **侧边栏导航**：快速访问角色、群组与世界设定，界面清晰流畅。
* **编辑便捷**：强大的内置编辑器，随时更新和维护你的虚拟世界。

### 基本操作

1. **选择或创建世界**：启动应用后，你可以从已有的世界中选择或创建新的世界。
2. **构建角色和群组**：创建角色卡片和群聊群组，定制角色的个性和互动。
3. **展开你的故事**：在中央的聊天区域进行实时对话，AI将自动根据角色设定与世界观生成对话。

## 🔥 应用场景

* 🎮 **角色扮演游戏**：创建沉浸式RPG游戏世界，带领玩家体验独特剧情。
* 📚 **互动叙事**：小说作者或编剧可以实时测试角色互动，激发更多灵感。
* 🧠 **创意协作**：团队或社区协作打造复杂世界观，共同推动创意发展。

## 🛠️ 技术栈

### 前端技术
- **Vue 3.5+** - 现代化的前端框架
- **Vuetify 3.8+** - Material Design组件库
- **Vite** - 快速的构建工具
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Vue I18n** - 国际化支持

### 数据存储
- **IndexedDB** - 本地数据存储，确保数据私密性与安全性

## 📁 项目结构

```
3000World/
├── web/                    # Vue.js前端应用
│   ├── src/
│   │   ├── components/     # Vue组件
│   │   ├── pages/         # 页面组件
│   │   ├── stores/        # Pinia状态管理
│   │   ├── router/        # 路由配置
│   │   └── ...
│   ├── package.json       # 依赖配置
│   └── vite.config.mjs    # Vite配置
├── doc/                   # 项目文档
├── example_world.json     # 示例世界数据
├── local.html            # 本地演示页面
└── README.md             # 项目说明
```

## 🚀 快速开始

### 环境要求

- Node.js 16.0+
- npm 或 yarn 或 bun

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/34892002/3000World.git
   cd 3000world
   ```

2. **安装依赖**
   ```bash
   cd web
   npm install
   # 或者使用 yarn
   yarn install
   # 或者使用 bun
   bun install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 或者
   yarn dev
   # 或者
   bun dev
   ```

4. **访问应用**
   
   打开浏览器访问 `http://localhost:3000`

### 构建生产版本

```bash
cd web
npm run build
```

## 📖 使用指南

## 🤝 贡献指南

我们欢迎所有形式的贡献！如果你想为项目做出贡献，请：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🌟 立即体验

释放你的创造力，探索无限可能性。

🚩 **现在就启动你的3000World！**

## 📞 联系我们

如果你有任何问题或建议，欢迎通过以下方式联系我们：

- 提交 [Issue](../../issues)
- 发起 [Discussion](../../discussions)

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！
