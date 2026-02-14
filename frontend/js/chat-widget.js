/**
 * Chat Widget Functionality
 * AI Newsletter Assistant Integration
 */

// Initialize Chat Widget
function initializeChatWidget() {
    const chatFab = document.getElementById('chatFabButton');
    const chatWidget = document.getElementById('chatWidget');
    const chatClose = document.querySelector('.chat-close');
    const chatMinimize = document.querySelector('.chat-minimize');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const quickQueryBtns = document.querySelectorAll('.quick-query-btn');

    if (!chatFab || !chatWidget) return;

    // Open chat widget
    chatFab.addEventListener('click', () => {
        chatWidget.classList.add('active');
        chatWidget.setAttribute('aria-hidden', 'false');
        chatInput.focus();
    });

    // Close chat widget
    chatClose?.addEventListener('click', () => {
        chatWidget.classList.remove('active');
        chatWidget.setAttribute('aria-hidden', 'true');
    });

    // Minimize chat widget
    chatMinimize?.addEventListener('click', () => {
        chatWidget.classList.toggle('minimized');
    });

    // Send message on button click
    chatSendBtn?.addEventListener('click', () => {
        sendChatMessage();
    });

    // Send message on Enter key (Shift+Enter for new line)
    chatInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // Quick query buttons
    quickQueryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.dataset.query;
            chatInput.value = query;
            sendChatMessage();
        });
    });

    // Make chat draggable (optional)
    makeElementDraggable(chatWidget, document.querySelector('.chat-widget-header'));
}

// Send chat message
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatSendBtn = document.getElementById('chatSendBtn');

    const message = chatInput.value.trim();
    if (!message) return;

    // Disable input while processing
    chatInput.disabled = true;
    chatSendBtn.disabled = true;

    // Add user message to chat
    addChatMessage(message, 'user');

    // Clear input
    chatInput.value = '';

    // Show typing indicator
    const typingIndicator = addTypingIndicator();

    try {
        // Send request to backend
        const response = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: message })
        });

        if (!response.ok) throw new Error('Failed to get response');

        const data = await response.json();

        // Remove typing indicator
        typingIndicator.remove();

        // Add bot response to chat
        addChatMessage(data.answer, 'bot');

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        console.error('Chat error:', error);
        typingIndicator.remove();
        addChatMessage('Sorry, I encountered an error. Please try again.', 'bot');
    } finally {
        // Re-enable input
        chatInput.disabled = false;
        chatSendBtn.disabled = false;
        chatInput.focus();
    }
}

// Add message to chat
function addChatMessage(message, type = 'bot') {
    const chatMessages = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${type}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

    const content = document.createElement('div');
    content.className = 'message-content';

    if (type === 'bot') {
        // Parse HTML for bot messages (tables, formatting)
        if (typeof marked !== 'undefined' && marked.parse) {
            marked.setOptions({
                breaks: true,
                gfm: true,
                tables: true,
                headerIds: false,
                mangle: false,
                sanitize: false
            });
            content.innerHTML = marked.parse(message);
        } else {
            content.innerHTML = message;
        }
    } else {
        // Plain text for user messages
        const p = document.createElement('p');
        p.textContent = message;
        content.appendChild(p);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add typing indicator
function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');

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

// Make element draggable
function makeElementDraggable(element, handle) {
    if (!element || !handle) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        element.style.bottom = 'auto';
        element.style.right = 'auto';
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Clear chat history
function clearChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    // Keep only the welcome message
    const welcomeMessage = chatMessages.querySelector('.bot-message');
    chatMessages.innerHTML = '';
    if (welcomeMessage) {
        chatMessages.appendChild(welcomeMessage.cloneNode(true));
    }
}

// Export chat history
function exportChatHistory() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messages = chatMessages.querySelectorAll('.chat-message');
    let chatText = 'VSK Newsletter AI Assistant - Chat History\n';
    chatText += '='.repeat(50) + '\n\n';

    messages.forEach(msg => {
        const isUser = msg.classList.contains('user-message');
        const content = msg.querySelector('.message-content').textContent.trim();
        chatText += `${isUser ? 'You' : 'AI Assistant'}: ${content}\n\n`;
    });

    chatText += '='.repeat(50) + '\n';
    chatText += `Exported: ${new Date().toLocaleString()}\n`;

    // Download as text file
    downloadFile(chatText, 'vsk-chat-history.txt', 'text/plain');
    showNotification('Chat history exported successfully!', 'success');
}

console.log('✅ Chat widget initialized');
