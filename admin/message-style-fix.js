// Mesaj render fonksiyonunu override et
function renderChatMessages(chat) {
    const container = document.getElementById('chat-messages');
    
    if (!chat.messages || chat.messages.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">💬 Henüz mesaj yok</div>';
        return;
    }
    
    container.innerHTML = chat.messages.map(msg => {
        let bgColor, textColor, emoji, senderLabel;
        
        if (msg.sender === 'user') {
            bgColor = '#E3F2FD';
            textColor = '#1565C0';
            emoji = '👤';
            senderLabel = 'Müşteri';
        } else if (msg.sender === 'bot' || msg.sender === 'chatbot') {
            bgColor = '#E8F5E9';
            textColor = '#2E7D32';
            emoji = '🤖';
            senderLabel = 'Chatbot';
        } else if (msg.sender === 'ai') {
            bgColor = '#F3E5F5';
            textColor = '#6A1B9A';
            emoji = '🧠';
            senderLabel = 'Yapay Zeka';
        } else if (msg.sender === 'admin') {
            bgColor = '#FFF3E0';
            textColor = '#E65100';
            emoji = '👨💼';
            senderLabel = 'Admin';
        } else {
            bgColor = '#F5F5F5';
            textColor = '#424242';
            emoji = '💬';
            senderLabel = 'Sistem';
        }
        
        return `
        <div style="display:flex;justify-content:${msg.sender === 'user' ? 'flex-start' : 'flex-end'};margin-bottom:15px;">
            ${msg.sender === 'user' ? `<div style="font-size:32px;margin-right:10px;">${emoji}</div>` : ''}
            <div style="max-width:70%;">
                <div style="font-size:11px;color:#666;margin-bottom:3px;${msg.sender === 'user' ? 'text-align:left;' : 'text-align:right;'}">
                    ${emoji} ${senderLabel}
                </div>
                <div style="padding:12px 16px;background:${bgColor};color:${textColor};border-radius:12px;${msg.sender === 'user' ? 'border-bottom-left-radius:4px;' : 'border-bottom-right-radius:4px;'}font-weight:500;box-shadow:0 1px 2px rgba(0,0,0,0.1);">
                    ${msg.text}
                </div>
                <div style="font-size:10px;color:#999;margin-top:3px;${msg.sender === 'user' ? 'text-align:left;' : 'text-align:right;'}">
                    ${new Date(msg.timestamp).toLocaleTimeString('tr-TR')}
                </div>
            </div>
            ${msg.sender !== 'user' ? `<div style="font-size:32px;margin-left:10px;">${emoji}</div>` : ''}
        </div>
    `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}
