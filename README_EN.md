# 3000World

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue](https://img.shields.io/badge/Vue-3.5+-green.svg)
![Vuetify](https://img.shields.io/badge/Vuetify-3.8+-blue.svg)

[![English](https://img.shields.io/badge/English-Click-yellow)](README_EN.md)
[![中文文档](https://img.shields.io/badge/中文文档-点击查看-orange)](README.md)

Welcome to **3000World**, an innovative application based on role-playing and real-time group chat, designed to bring you an immersive interactive experience. Whether you're passionate about creating virtual characters, building worldviews, or eager to immerse yourself in creative conversations, 3000World is your best choice!

### Example World

The project includes an example world file `example_world.json`, showcasing the classic "Huaqiang Buying Melons" scenario. You can:

- Import the example world to quickly experience the features
- Reference the example data structure to create your own world
- Learn about character settings and worldview configuration methods

### Local Demo (only PC)

If you want to quickly experience the features, you can directly open the `local.html` file, which is a local demo page with complete functionality.

![local ui](doc/img/s_4_cn.png)

## 🖥️UI display (mobile & PC)
![display](doc/img/s_1_cn.png)
![display](doc/img/s_2_cn.png)
![display](doc/img/s_3_cn.png)

## 🎯 Project Features

- 🌍 **Multi-World Management System** - Support for creating and managing multiple virtual worlds
- 🎭 **Intelligent Character System** - AI-driven character dialogue and interaction
- 💬 **Real-time Group Chat** - Dynamic conversations with multiple characters participating simultaneously
- 🎨 **Modern UI Design** - Responsive interface based on Vuetify
- 💾 **Local Data Storage** - Using IndexedDB to ensure data security
- 🔧 **Highly Customizable** - Flexible worldview and character setting system

## ✨ Main Features

### 🌐 Multi-World Management

* **Easy Selection**: Easily choose from existing virtual worlds or create new ones with one click.
* **Free Creation**: Customize exclusive world settings and create your unique universe.

### 🎭 Character & Group Interaction

* **Character Creation**: Freely design character personalities, background stories, and opening lines.
* **Dynamic Group Chat**: Invite multiple characters to join conversations and experience rich group interactions.

### 💬 Intelligent Dialogue System

* **Real-time Interaction**: Powered by intelligent AI, characters have vivid and natural communication abilities.
* **Convenient Input**: Support @ mention functionality to quickly locate and interact with specific characters.

### 🖥️ Intuitive User Interface

* **Sidebar Navigation**: Quick access to characters, groups, and world settings with a clear and smooth interface.
* **Easy Editing**: Powerful built-in editor to update and maintain your virtual world anytime.

## 🛠️ Tech Stack

### Frontend Technologies
- **Vue 3.5+** - Modern frontend framework
- **Vuetify 3.8+** - Material Design component library
- **Vite** - Fast build tool
- **Pinia** - State management
- **Vue Router** - Routing management
- **Vue I18n** - Internationalization support

### Data Storage
- **IndexedDB** - Local data storage ensuring data privacy and security

## 📁 Project Structure

```
3000World/
├── web/                    # Vue.js frontend application
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── pages/         # Page components
│   │   ├── stores/        # Pinia state management
│   │   ├── router/        # Router configuration
│   │   └── ...
│   ├── package.json       # Dependencies configuration
│   └── vite.config.mjs    # Vite configuration
├── doc/                   # Project documentation
├── example_world.json     # Example world data
├── local.html            # Local demo page
└── README.md             # Project description
```

## 🚀 Quick Start

### Requirements

- Node.js 16.0+
- npm or yarn or bun

### Installation Steps

1. **Clone the project**
   ```bash
   git clone https://github.com/34892002/3000World.git
   cd 3000world
   ```

2. **Install dependencies**
   ```bash
   cd web
   npm install
   # or use yarn
   yarn install
   # or use bun
   bun install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

4. **Access the application**
   
   Open your browser and visit `http://localhost:3000`

### Build for Production

```bash
cd web
npm run build
```

## 📖 Usage Guide

### Basic Operations

1. **Select or Create World**: After launching the app, you can choose from existing worlds or create new ones.
2. **Build Characters and Groups**: Create character cards and chat groups, customize character personalities and interactions.
3. **Unfold Your Story**: Engage in real-time conversations in the central chat area, where AI will automatically generate dialogues based on character settings and worldview.

## 🔥 Use Cases

* 🎮 **Role-Playing Games**: Create immersive RPG game worlds and lead players through unique storylines.
* 📚 **Interactive Storytelling**: Authors or screenwriters can test character interactions in real-time to inspire more creativity.
* 🧠 **Creative Collaboration**: Teams or communities collaborate to build complex worldviews and jointly drive creative development.

## 🤝 Contributing

We welcome all forms of contributions! If you want to contribute to the project, please:

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Experience Now

Unleash your creativity and explore infinite possibilities.

🚩 **Start your 3000World now!**

## 📞 Contact Us

If you have any questions or suggestions, feel free to contact us through:

- Submit an [Issue](../../issues)
- Start a [Discussion](../../discussions)

---

⭐ If this project helps you, please give us a star!