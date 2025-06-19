export default {
    messages: { // 页面通用部分
        appTitle: '3000World',
        language: 'Language',
        welcome: 'Welcome to this application！'
    },
    chat: {
        user: {
            avatar: 'User Avatar',
            online: 'Online',
        },
        settings: {
            title: 'Settings',
            language: 'Language',
            darkTheme: 'Dark Theme',
            notifications: 'Notifications',
            close: 'Close'
        },
        tabs: {
            private: 'Private',
            group: 'Group',
            characters: 'Characters',
            worldbook: 'Worldbook',
            settings: 'Settings',
        },
        search: {
            private: 'Search private chats',
            group: 'Search group chats',
            characters: 'Search characters',
            worldbook: 'Search worldbook entries',
            settings: 'Search settings',
            placeholder: 'Search...',
        },
        group: {
            membersLabel: 'members',
            createTitle: 'Create Group',
            editTitle: 'Edit Group',
            basicInfo: 'Basic Information',
            nameLabel: 'Group Name',
            namePlaceholder: 'Enter group name',
            descriptionLabel: 'Group Description',
            descriptionPlaceholder: 'Enter group description',
            avatarLabel: 'Group Avatar',
            avatarPlaceholder: 'Enter avatar URL',
            membersTitle: 'Member Management',
            availableCharacters: 'Available Characters',
            selectedMembers: 'Selected Members',
            settingsTitle: 'Group Settings',
            privateGroup: 'Private Group',
            allowInvites: 'Allow Invites'
        },
        characters: {
            title: 'Characters',
            createTitle: 'Create Character',
            editTitle: 'Edit Character',
            basicInfo: 'Basic Information',
            nameLabel: 'Character Name',
            namePlaceholder: 'Enter character name',
            descriptionLabel: 'Character Description',
            descriptionPlaceholder: 'Enter character description',
            avatarLabel: 'Character Avatar',
            avatarPlaceholder: 'Enter avatar URL',
            personalityTitle: 'Personality Traits',
            personalityLabel: 'Personality',
            personalityPlaceholder: 'Describe the character\'s personality traits...',
            backgroundLabel: 'Background Story',
            backgroundPlaceholder: 'Describe the character\'s background story...',
            personaTitle: 'Character Setup',
            personaLabel: 'Character Persona',
            personaPlaceholder: 'Describe the character\'s personality, background, speaking style, etc...',
            greetingLabel: 'Greeting',
            greetingPlaceholder: 'The character\'s first words or greeting...',
            settingsTitle: 'Character Settings',
            isPublic: 'Public Character',
            isPublicHelp: 'Allow other users to use this character',
            allowEdit: 'Allow Editing',
            allowEditHelp: 'Allow other users to modify this character',
            deleteConfirm: 'Are you sure you want to delete this character?',
            deleteSuccess: 'Character deleted successfully',
            saveSuccess: 'Character saved successfully'
        },
        worldbook: {
            title: 'Worldbook'
        },
        worldSettings: {
            title: 'World Settings',
            config: 'World Configuration',
            configDesc: 'Manage general settings for the current world.',
            api: 'API Configuration',
            apiDesc: 'Configure API keys and endpoints for integrations.'
        },
        empty: {
            title: 'Select a chat to start messaging',
            subtitle: 'Or create a new chat from the sidebar.'
        },
        input: {
            placeholder: 'Type a message...'
        },
        time: {
            minutes: 'minutes ago',
            now: 'just now',
            hours: 'hours ago',
            days: 'days ago',
        },
        common: {
            save: 'Save',
            cancel: 'Cancel',
            create: 'Create',
            edit: 'Edit',
            delete: 'Delete',
            confirm: 'Confirm'
        }
    },
    worldSelector: {
        subtitle: 'Choose or create a world to start your adventure',
        version: 'Version',
        git: 'Github',
        community: 'Join Community',
        selectWorld: 'Select World',
        createWorld: 'Create New World',
        importWorld: 'Import World',
        worldName: 'World Name',
        worldDescription: 'World Description',
        create: 'Create',
        cancel: 'Cancel',
        import: 'Import',
        selectFile: 'Select File',
        fileSelected: 'File Selected',
        creating: 'Creating...',
        importing: 'Importing...',
        success: 'Success',
        error: 'Error',
        worldCreated: 'World created successfully!',
        worldImported: 'World imported successfully!',
        createFailed: 'Creation failed',
        importFailed: 'Import failed',
        invalidFile: 'Invalid file format',
        enterWorld: 'Enter World',
        chooseWorld: 'Choose world...',
        connectedTo: 'Connected to world',
        loading: 'Loading',
        export: 'Export',
        delete: 'Delete',
        confirmDelete: 'Are you sure you want to delete world "{worldName}"? This action cannot be undone!',
        deleteSuccess: 'World deleted successfully',
        deleteError: 'Failed to delete world',
        importSuccess: 'World imported successfully!',
        importError: 'Failed to import world'
    },
    api: {
        error: {
            unknown: "Unknown error occurred",
            network: "Network connection failed",
            badRequest: "Invalid request",
            unauthorized: "Authentication required",
            forbidden: "Access denied",
            notFound: "Resource not found",
            serverError: "Server internal error",
            badGateway: "Bad gateway",
            serviceUnavailable: "Service unavailable",
            gatewayTimeout: "Gateway timeout"
        }
    }
}