// MPA CHAT CONTINUITY - Session V2
const CHAT_SESSION_V2 = true; // Feature flag
let sessionId = null;
let socket = null;
let userId = null;
let anonId = null;

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateUserId() {
    let id = localStorage.getItem('userId');
    if (!id) {
        id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', id);
    }
    return id;
}

// MPA Session: Ensure anon_id
async function ensureAnonSession() {
    if (!CHAT_SESSION_V2) return generateUserId();
    
    // Check localStorage first
    let storedAnon = localStorage.getItem('hd_anon');
    if (storedAnon) {
        anonId = storedAnon;
        return anonId;
    }
    
    // Call session/ensure endpoint
    try {
        const response = await fetch('/api/session/ensure', {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.anon_id) {
            anonId = data.anon_id;
            localStorage.setItem('hd_anon', anonId);
            return anonId;
        }
    } catch (error) {
        console.error('Session ensure error:', error);
    }
    
    // Fallback
    return generateUserId();
}

// MPA Session: Load history
async function loadChatHistory() {
    if (!CHAT_SESSION_V2 || !anonId) return;
    
    try {
        const response = await fetch(`/api/chat/history/${anonId}?limit=50`);
        const data = await response.json();
        if (data.success && data.history && data.history.length > 0) {
            data.history.forEach(msg => {
                if (msg.sender === 'user') {
                    addMessage(msg.message, 'user');
                } else {
                    addMessage(msg.message, 'bot', msg.sender);
                }
            });
        }
    } catch (error) {
        console.error('History load error:', error);
    }
}

async function openChat() {
    document.getElementById('chat-widget').classList.remove('hidden');
    document.getElementById('chat-button').style.display = 'none';
    
    if (!sessionId) {
        sessionId = generateSessionId();
    }
    
    // MPA Session V2: Ensure anon_id
    if (!userId) {
        userId = await ensureAnonSession();
    }
    
    // MPA Session V2: Load history
    await loadChatHistory();
    
    // Socket.io bağlantısını kur
    if (!socket) {
        socket = io();
        
        socket.on('connect', () => {
            console.log('Socket bağlandı');
            // MPA Session V2: Join room with anon_id
            const roomId = CHAT_SESSION_V2 && anonId ? `user:${anonId}` : userId;
            socket.emit('user-connect', {
                userId: userId,
                username: 'Web Kullanıcısı',
                room: roomId
            });
        });
        
        socket.on('admin-reply', (data) => {
            addMessage(data.message, 'bot', 'admin');
        });
    }
}

function closeChat() {
    document.getElementById('chat-widget').classList.add('hidden');
    document.getElementById('chat-button').style.display = 'block';
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    // Socket.io ile mesajı gönder (admin'e bildirim için)
    if (socket) {
        socket.emit('user-message', {
            userId: userId,
            username: 'Web Kullanıcısı',
            message: message
        });
    }
    
    showTyping();
    
    try {
        // MPA Session V2: Add X-Chat-User header
        const headers = { 'Content-Type': 'application/json' };
        if (CHAT_SESSION_V2 && anonId) {
            headers['X-Chat-User'] = anonId;
        }
        
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: headers,
            credentials: 'include',
            body: JSON.stringify({
                userId: userId,
                username: 'Web Kullanıcısı',
                message: message
            })
        });
        
        const data = await response.json();
        
        removeTyping();
        
        if (data.success && data.response) {
            addMessage(data.response, 'bot');
        }
    } catch (error) {
        removeTyping();
        console.error('Mesaj gönderme hatası:', error);
        addMessage('Bağlantı hatası. Lütfen tekrar deneyin.', 'bot', 'bot');
    }
}

function addMessage(text, sender, senderType) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `display:flex;justify-content:${sender === 'user' ? 'flex-end' : 'flex-start'};margin-bottom:15px;`;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    let bgColor, textColor, emoji, senderLabel;
    
    if (sender === 'user') {
        bgColor = '#E3F2FD';
        textColor = '#1565C0';
        emoji = '👤';
        senderLabel = 'Siz';
    } else if (senderType === 'admin') {
        bgColor = '#FFF3E0';
        textColor = '#E65100';
        emoji = '👨💼';
        senderLabel = 'Admin';
    } else if (senderType === 'ai') {
        bgColor = '#F3E5F5';
        textColor = '#6A1B9A';
        emoji = '🧠';
        senderLabel = 'Yapay Zeka';
    } else {
        bgColor = '#E8F5E9';
        textColor = '#2E7D32';
        emoji = '🤖';
        senderLabel = 'Chatbot';
    }
    
    messageDiv.innerHTML = `
        ${sender === 'bot' ? `<div style="font-size:32px;margin-right:10px;">${emoji}</div>` : ''}
        <div style="max-width:70%;">
            <div style="font-size:11px;color:#666;margin-bottom:3px;${sender === 'bot' ? 'text-align:left;' : 'text-align:right;'}">
                ${emoji} ${senderLabel}
            </div>
            <div style="padding:12px 16px;background:${bgColor};color:${textColor};border-radius:12px;${sender === 'bot' ? 'border-bottom-left-radius:4px;' : 'border-bottom-right-radius:4px;'}font-weight:500;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                ${text.replace(/\n/g, '<br>')}
            </div>
            <div style="font-size:10px;color:#999;margin-top:3px;${sender === 'bot' ? 'text-align:left;' : 'text-align:right;'}">
                ${timeStr}
            </div>
        </div>
        ${sender === 'user' ? `<div style="font-size:32px;margin-left:10px;">${emoji}</div>` : ''}
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTyping() {
    const messagesContainer = document.getElementById('chat-messages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-message typing-indicator';
    typingDiv.id = 'typing';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = '🤖 Yazıyor...';
    
    typingDiv.appendChild(bubble);
    messagesContainer.appendChild(typingDiv);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById('typing');
    if (typing) {
        typing.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    sessionId = generateSessionId();
});


// ========== YENİ ÖZELLİKLER ==========

// Typing Indicator
function showTyping() {
    const messagesContainer = document.getElementById('chat-messages');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-message';
    typingDiv.id = 'typing';
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    
    typingDiv.appendChild(bubble);
    messagesContainer.appendChild(typingDiv);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function removeTyping() {
    const typing = document.getElementById('typing');
    if (typing) {
        typing.remove();
    }
}

// Scroll to Bottom Button
function checkScroll() {
    const messagesContainer = document.getElementById('chat-messages');
    const scrollBtn = document.getElementById('scroll-bottom');
    
    if (!scrollBtn) {
        const btn = document.createElement('button');
        btn.id = 'scroll-bottom';
        btn.className = 'scroll-bottom';
        btn.innerHTML = '↓';
        btn.onclick = () => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };
        document.getElementById('chat-widget').appendChild(btn);
    }
    
    const isScrolledUp = messagesContainer.scrollHeight - messagesContainer.scrollTop > messagesContainer.clientHeight + 100;
    document.getElementById('scroll-bottom').style.display = isScrolledUp ? 'flex' : 'none';
}

// Auto-scroll on new message
document.getElementById('chat-messages')?.addEventListener('scroll', checkScroll);

// Sound Notification
function playNotificationSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6OyrWBUIQ5zd8sFuJAUuhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFLoTP89uJNgYcarvs6aFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQhDnN3ywW4kBS6Ez/PbiTYGHGq77OmhUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBUIQ5zd8sFuJAUuhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFLoTP89uJNgYcarvs6aFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQhDnN3ywW4kBS6Ez/PbiTYGHGq77OmhUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBUIQ5zd8sFuJAUuhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFLoTP89uJNgYcarvs6aFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQhDnN3ywW4kBS6Ez/PbiTYGHGq77OmhUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBUIQ5zd8sFuJAUuhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFLoTP89uJNgYcarvs6aFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQhDnN3ywW4kBS6Ez/PbiTYGHGq77OmhUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBUIQ5zd8sFuJAUuhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFLoTP89uJNgYcarvs6aFQEQtMpeHxuWUcBTaN1e/OfSkFKH7M8NqPOwsSXLHo7atYFQhDnN3ywW4kBS6Ez/PbiTYGHGq77OmhUBELTKXh8bllHAU2jdXvzn0pBSh+zPDajzsKElyx6O2rWBUIQ5zd8sFuJAUuhM/z24k2Bhxqu+zpoVARC0yl4fG5ZRwFNo3V7859KQUofszw2o87ChJcsejtq1gVCEOc3fLBbiQFLoTP89uJNgYcarvsw==');
    audio.volume = 0.3;
    audio.play().catch(() => {});
}

// Message Counter
let messageCount = 0;
function updateMessageCount() {
    messageCount++;
    if (document.getElementById('chat-widget').classList.contains('hidden')) {
        let badge = document.querySelector('.notification-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'notification-badge';
            document.getElementById('chat-button').style.position = 'relative';
            document.getElementById('chat-button').appendChild(badge);
        }
        badge.textContent = messageCount;
    }
}

function clearMessageCount() {
    messageCount = 0;
    const badge = document.querySelector('.notification-badge');
    if (badge) badge.remove();
}

// Enhanced openChat
const originalOpenChat = openChat;
openChat = function() {
    originalOpenChat();
    clearMessageCount();
    checkScroll();
};

// Enhanced addMessage with sound
const originalAddMessage = addMessage;
addMessage = function(text, sender, senderType) {
    originalAddMessage(text, sender, senderType);
    if (sender === 'bot') {
        playNotificationSound();
        updateMessageCount();
    }
    checkScroll();
};

// Online Status Indicator
function updateOnlineStatus(isOnline) {
    const statusEl = document.getElementById('status');
    if (statusEl) {
        const indicator = '<span class="status-indicator' + (isOnline ? '' : ' offline') + '"></span>';
        statusEl.innerHTML = indicator + (isOnline ? 'Çevrimiçi' : 'Çevrimdışı');
    }
}

// Check online status
if (socket) {
    socket.on('connect', () => updateOnlineStatus(true));
    socket.on('disconnect', () => updateOnlineStatus(false));
}

// Auto-save draft
let draftTimer;
document.getElementById('user-input')?.addEventListener('input', (e) => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
        localStorage.setItem('chatDraft', e.target.value);
    }, 500);
});

// Load draft on open
const originalOpenChat2 = openChat;
openChat = function() {
    originalOpenChat2();
    const draft = localStorage.getItem('chatDraft');
    if (draft) {
        document.getElementById('user-input').value = draft;
    }
};

// Clear draft on send
const originalSendMessage = sendMessage;
sendMessage = async function() {
    await originalSendMessage();
    localStorage.removeItem('chatDraft');
};

// Quick Replies
function addQuickReplies() {
    const quickReplies = [
        '💰 Fiyat listesi',
        '📦 Teslimat süresi',
        '🎯 Popüler ürünler'
    ];
    
    const container = document.createElement('div');
    container.style.cssText = 'display:flex;gap:8px;padding:10px;overflow-x:auto;';
    
    quickReplies.forEach(reply => {
        const btn = document.createElement('button');
        btn.textContent = reply;
        btn.style.cssText = 'padding:8px 12px;background:#f0f0f0;border:1px solid #ddd;border-radius:20px;font-size:12px;cursor:pointer;white-space:nowrap;';
        btn.onclick = () => {
            document.getElementById('user-input').value = reply;
            sendMessage();
        };
        container.appendChild(btn);
    });
    
    const messagesContainer = document.getElementById('chat-messages');
    if (messagesContainer.children.length === 1) {
        messagesContainer.appendChild(container);
    }
}

// Initialize quick replies on first open
setTimeout(addQuickReplies, 1000);
