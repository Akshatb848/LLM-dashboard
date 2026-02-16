/**
 * Chat Widget — Base Functionality
 * Handles open/close/minimize and basic message plumbing.
 * Language selection and enhanced features are layered on by enhanced-chat.js
 */

function initializeChatWidget() {
    const chatFab = document.getElementById('chatFabButton');
    const chatWidget = document.getElementById('chatWidget');
    const chatClose = document.querySelector('.chat-close');
    const chatMinimize = document.querySelector('.chat-minimize');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');

    if (!chatFab || !chatWidget) return;

    // Open chat widget
    chatFab.addEventListener('click', () => {
        openChatWidget();
    });

    // Close chat widget
    chatClose?.addEventListener('click', () => {
        closeChatWidget();
    });

    // Minimize chat widget
    chatMinimize?.addEventListener('click', () => {
        chatWidget.classList.toggle('minimized');
    });

    // Send message on button click
    chatSendBtn?.addEventListener('click', () => {
        if (typeof sendChatMessage === 'function') sendChatMessage();
    });

    // Send message on Enter key (Shift+Enter for new line)
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (typeof sendChatMessage === 'function') sendChatMessage();
        }
    });
}

/** Open the chat widget and show the correct inner view */
function openChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    if (!chatWidget) return;

    chatWidget.classList.add('active');
    chatWidget.setAttribute('aria-hidden', 'false');

    // Delegate to enhanced-chat.js to decide what to show
    if (typeof _showCorrectChatView === 'function') {
        _showCorrectChatView();
    }
}

/** Close the chat widget cleanly */
function closeChatWidget() {
    const chatWidget = document.getElementById('chatWidget');
    if (!chatWidget) return;

    chatWidget.classList.remove('active');
    chatWidget.classList.remove('minimized');
    chatWidget.setAttribute('aria-hidden', 'true');

    // Reset any dragged position so it opens in the normal spot next time
    chatWidget.style.top = '';
    chatWidget.style.left = '';
    chatWidget.style.bottom = '';
    chatWidget.style.right = '';
}

/** Add a typing indicator and return the element for later removal */
function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return document.createElement('div');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message bot-message typing-message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<i class="fas fa-robot"></i>';

    const content = document.createElement('div');
    content.className = 'message-content';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    content.appendChild(typingDiv);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageDiv;
}
