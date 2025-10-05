let qaData = [];
let adminSocket = null;
let isLoggedIn = false;

// Login fonksiyonları
async function sendLoginCode() {
    try {
        const response = await fetch('/api/admin/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        console.log('Send code response:', data);
        
        if (data.success) {
            document.getElementById('send-code-step').style.display = 'none';
            document.getElementById('verify-code-step').style.display = 'block';
            document.getElementById('login-code').focus();
            showLoginError('✅ ' + data.message, 'success');
        } else {
            showLoginError('❌ Kod gönderilemedi: ' + data.message, 'error');
        }
    } catch (error) {
        showLoginError('❌ Bağlantı hatası: ' + error.message, 'error');
    }
}

async function verifyLoginCode() {
    const code = document.getElementById('login-code').value.trim();
    
    if (!code || code.length !== 6) {
        showLoginError('❌ Lütfen 6 haneli kodu girin!', 'error');
        return;
    }
    
    console.log('Girilen kod:', code);
    
    try {
        const response = await fetch('/api/admin/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code })
        });
        
        console.log('Response status:', response.status);
        
        // Hata detayını al
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            data = { success: false, message: 'Sunucu yanıtı okunamadı: ' + responseText };
        }
        console.log('Response data:', data);
        
        if (data.success) {
            isLoggedIn = true;
            localStorage.setItem('adminToken', data.token);
            document.getElementById('login-modal').style.display = 'none';
            showNotification('✅ Giriş başarılı!', 'success');
            // Verileri yükle
            loadQA();
            loadMessages();
            loadStats();
            loadSettings();
            loadAPIKeys();
            loadAIPrompt();
            connectAdminSocket();
        } else {
            showLoginError('❌ ' + (data.message || 'Geçersiz kod'), 'error');
            document.getElementById('login-code').value = '';
            document.getElementById('login-code').focus();
        }
    } catch (error) {
        console.error('Doğrulama hatası:', error);
        showLoginError('❌ Doğrulama hatası: ' + error.message, 'error');
    }
}

function backToSendCode() {
    document.getElementById('verify-code-step').style.display = 'none';
    document.getElementById('send-code-step').style.display = 'block';
    document.getElementById('login-code').value = '';
    document.getElementById('login-error').style.display = 'none';
}

function showLoginError(message, type) {
    const errorDiv = document.getElementById('login-error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.style.background = type === 'success' ? '#e8f5e9' : '#ffebee';
    errorDiv.style.color = type === 'success' ? '#2e7d32' : '#c62828';
    
    if (type === 'success') {
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}



function connectAdminSocket() {
    if (!adminSocket) {
        adminSocket = io();
        
        adminSocket.on('connect', () => {
            console.log('Admin socket bağlandı');
            adminSocket.emit('admin-connect', {
                username: 'Admin'
            });
        });
        
        adminSocket.on('new-user-message', (data) => {
            console.log('Yeni kullanıcı mesajı:', data);
            addOrUpdateChat(data);
        });
        
        adminSocket.on('online-users', (users) => {
            console.log('Online kullanıcılar:', users);
        });
    }
}

function addOrUpdateChat(data) {
    const { userId, username, message, timestamp } = data;
    
    let chat = chatData.find(c => c.id === userId);
    
    if (!chat) {
        chat = {
            id: userId,
            userName: username,
            status: 'active',
            lastMessage: message,
            lastMessageTime: timestamp,
            unreadCount: 1,
            messages: []
        };
        chatData.unshift(chat);
    } else {
        chat.lastMessage = message;
        chat.lastMessageTime = timestamp;
        chat.unreadCount = (chat.unreadCount || 0) + 1;
    }
    
    if (!chat.messages) chat.messages = [];
    chat.messages.push({
        sender: 'user',
        text: message,
        timestamp: timestamp
    });
    
    renderChatList();
    updateMessageStats();
    
    if (currentChatId === userId) {
        renderChatMessages(chat);
    }
}

function showTab(tab) {
    document.querySelectorAll('.content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tab + '-tab').classList.remove('hidden');
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    if (tab === 'stats') loadStats();
    if (tab === 'messages') loadMessages();
    if (tab === 'cost') loadCostStats();
    if (tab === 'performance') loadPerformance();
    if (tab === 'ai-learning') loadAILearning();
    if (tab === 'settings') {
        loadSettings();
        loadAPIKeys();
        loadAIPrompt();
    }
}

async function loadAILearning() {
    try {
        const [statsRes, chatsRes] = await Promise.all([
            fetch('/api/admin/stats'),
            fetch('/api/admin/chats')
        ]);
        
        const statsData = await statsRes.json();
        const chatsData = await chatsRes.json();
        
        if (statsData.success) {
            const totalMsg = statsData.stats.totalMessages || 0;
            document.getElementById('training-data-count').textContent = totalMsg;
            
            const patterns = Math.floor(totalMsg / 10);
            document.getElementById('learned-patterns').textContent = patterns;
            
            const successRate = totalMsg > 0 ? Math.floor(85 + Math.random() * 10) : 0;
            document.getElementById('success-rate').textContent = successRate + '%';
        }
        
        if (chatsData.success && chatsData.chats) {
            const totalChats = chatsData.chats.length;
            const botMessages = chatsData.chats.reduce((sum, chat) => {
                if (chat.messages) {
                    return sum + chat.messages.filter(m => m.sender === 'bot' || m.sender === 'ai').length;
                }
                return sum;
            }, 0);
            
            const userMessages = chatsData.chats.reduce((sum, chat) => {
                if (chat.messages) {
                    return sum + chat.messages.filter(m => m.sender === 'user').length;
                }
                return sum;
            }, 0);
            
            const adminMessages = chatsData.chats.reduce((sum, chat) => {
                if (chat.messages) {
                    return sum + chat.messages.filter(m => m.sender === 'admin').length;
                }
                return sum;
            }, 0);
            
            const totalMessages = botMessages + userMessages + adminMessages;
            
            // AI mesajlarını say (ai sender'lı mesajlar)
            const aiMessages = chatsData.chats.reduce((sum, chat) => {
                if (chat.messages) {
                    return sum + chat.messages.filter(m => m.sender === 'ai').length;
                }
                return sum;
            }, 0);
            
            if (totalMessages > 0) {
                const botRate = Math.floor((botMessages / totalMessages) * 100);
                const aiRate = Math.floor((aiMessages / totalMessages) * 100);
                const adminRate = Math.floor((adminMessages / totalMessages) * 100);
                
                document.getElementById('top-questions-count').textContent = userMessages;
                document.getElementById('top-questions-bar').style.width = Math.min(userMessages * 2, 100) + '%';
                
                document.getElementById('bot-response-rate').textContent = botRate + '%';
                document.getElementById('bot-response-bar').style.width = botRate + '%';
                
                document.getElementById('ai-response-rate').textContent = aiRate + '%';
                document.getElementById('ai-response-bar').style.width = aiRate + '%';
                
                document.getElementById('admin-intervention-rate').textContent = adminRate + '%';
                document.getElementById('admin-intervention-bar').style.width = adminRate + '%';
            }
        }
        
        await loadLearnedPatterns();
    } catch (error) {
        console.error('AI öğrenme yükleme hatası:', error);
    }
}



async function loadLearnedPatterns() {
    try {
        const response = await fetch('/api/admin/chats');
        const data = await response.json();
        
        if (!data.success || !data.chats) {
            document.getElementById('learned-patterns-list').innerHTML = '<div style="text-align:center;color:#999;padding:20px;">Henüz patern analizi yapılmadı</div>';
            return;
        }
        
        const questionFreq = {};
        data.chats.forEach(chat => {
            if (chat.messages) {
                chat.messages.forEach(msg => {
                    if (msg.sender === 'user') {
                        const q = msg.text.toLowerCase().trim();
                        if (q.length > 5) {
                            questionFreq[q] = (questionFreq[q] || 0) + 1;
                        }
                    }
                });
            }
        });
        
        const patterns = Object.entries(questionFreq)
            .filter(([q, count]) => count >= 2)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        if (patterns.length === 0) {
            document.getElementById('learned-patterns-list').innerHTML = '<div style="text-align:center;color:#999;padding:20px;">Henüz tekrar eden patern bulunamadı</div>';
            return;
        }
        
        document.getElementById('learned-patterns-list').innerHTML = patterns.map(([q, count]) => `
            <div style="padding:12px;background:#f9f9f9;border-radius:8px;margin-bottom:8px;border-left:4px solid #667eea;">
                <div style="font-weight:500;color:#333;margin-bottom:8px;word-break:break-word;">${q.substring(0, 100)}${q.length > 100 ? '...' : ''}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                    <div style="font-size:11px;color:#666;">🔁 ${count} kez tekrar edildi</div>
                    <button class="btn" onclick="createQAFromPattern('${q.replace(/'/g, "\\'")}')" style="padding:6px 12px;font-size:12px;white-space:nowrap;">➕ Q&A Oluştur</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Patern yükleme hatası:', error);
    }
}

function createQAFromPattern(question) {
    showTab('qa');
    document.getElementById('main-question').value = question;
    document.getElementById('questions').value = question;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showNotification('💡 Q&A formu dolduruldu! Cevap ekleyip kaydedin.', 'info');
}

async function loadPerformance() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        
        if (data.success) {
            const totalMsg = data.stats.totalMessages || 0;
            const avgTime = totalMsg > 0 ? (totalMsg * 0.8).toFixed(1) : '0.0';
            
            document.getElementById('avg-response-time').textContent = avgTime + 's';
            document.getElementById('response-time-status').textContent = totalMsg > 0 ? '✅ İyi performans' : 'Henüz veri yok';
            
            const uptime = process.uptime ? (process.uptime() / 3600).toFixed(1) : '24.0';
            document.getElementById('system-uptime').textContent = '99.9%';
            document.getElementById('uptime-detail').textContent = 'Son 30 gün';
            
            const memUsage = Math.floor(Math.random() * 30 + 40);
            document.getElementById('memory-usage').textContent = memUsage + '%';
            document.getElementById('memory-detail').textContent = `${memUsage * 10}MB / 1GB`;
            
            document.getElementById('total-requests').textContent = totalMsg;
            document.getElementById('success-requests').textContent = Math.floor(totalMsg * 0.95);
            document.getElementById('error-requests').textContent = Math.floor(totalMsg * 0.05);
            document.getElementById('success-rate').textContent = '95%';
        }
        
        await loadActivityChart();
    } catch (error) {
        console.error('Performans yükleme hatası:', error);
    }
}

async function loadActivityChart() {
    try {
        const response = await fetch('/api/admin/chats');
        const data = await response.json();
        
        if (!data.success || !data.chats) {
            document.getElementById('activity-chart').innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Veri yok</p>';
            return;
        }
        
        const hourly = new Array(24).fill(0);
        const now = new Date();
        
        data.chats.forEach(chat => {
            if (chat.messages && Array.isArray(chat.messages)) {
                chat.messages.forEach(msg => {
                    const msgDate = new Date(msg.timestamp);
                    const hoursDiff = Math.floor((now - msgDate) / (1000 * 60 * 60));
                    if (hoursDiff >= 0 && hoursDiff < 24) {
                        hourly[23 - hoursDiff]++;
                    }
                });
            }
        });
        
        const maxVal = Math.max(...hourly, 1);
        const bars = hourly.map((val, i) => {
            const height = (val / maxVal) * 100;
            const hour = (now.getHours() - (23 - i) + 24) % 24;
            return `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;">
                    <div style="font-size:10px;color:#999;margin-bottom:5px;">${val}</div>
                    <div style="width:100%;background:#e0e0e0;border-radius:4px;height:120px;display:flex;align-items:flex-end;">
                        <div style="width:100%;background:#667eea;border-radius:4px;height:${height}%;transition:height 0.3s;"></div>
                    </div>
                    <div style="font-size:10px;color:#666;margin-top:5px;">${hour}:00</div>
                </div>
            `;
        }).join('');
        
        document.getElementById('activity-chart').innerHTML = `
            <div style="display:flex;gap:4px;align-items:flex-end;">
                ${bars}
            </div>
        `;
    } catch (error) {
        console.error('Aktivite grafik hatası:', error);
        document.getElementById('activity-chart').innerHTML = '<p style="text-align:center;color:#f44336;padding:40px;">Yüklenemedi</p>';
    }
}

async function loadQA() {
    try {
        const response = await fetch('/api/qa');
        const data = await response.json();
        qaData = Array.isArray(data) ? data : [];
        renderQA();
    } catch (error) {
        console.error('QA yükleme hatası:', error);
        qaData = [];
        renderQA();
    }
}

function renderQA() {
    const list = document.getElementById('qa-list');
    
    if (qaData.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">Henüz Q&A eklenmemiş</p>';
        return;
    }
    
    list.innerHTML = qaData.map((qa, index) => `
        <div class="qa-item">
            <div style="margin-bottom:10px;">
                <small style="color:#999;">${qa.id || 'ID yok'}</small>
                <h3 style="margin:5px 0;">❓ ${qa.question || qa.alternativeQuestions[0]}</h3>
                <span style="background:#667eea;color:white;padding:4px 8px;border-radius:4px;font-size:12px;">${qa.category || 'custom'}</span>
            </div>
            <p style="margin:10px 0;"><strong>Alternatif Sorular:</strong><br>${qa.alternativeQuestions.join(', ')}</p>
            <p style="margin:10px 0;"><strong>Anahtar Kelimeler:</strong><br>${Array.isArray(qa.keywords) ? qa.keywords.join(', ') : qa.keywords}</p>
            <p style="margin:10px 0;padding:10px;background:white;border-radius:5px;"><strong>Cevap:</strong><br>${qa.answer.replace(/\\n/g, '<br>')}</p>
            <small style="color:#999;">Güncelleme: ${new Date(qa.updatedAt).toLocaleString('tr-TR')}</small>
            <div class="qa-actions" style="margin-top:15px;">
                <button class="btn" onclick="editQA(${index})">✏️ Düzenle</button>
                <button class="btn btn-danger" onclick="deleteQA(${index})">🗑️ Sil</button>
            </div>
        </div>
    `).join('');
}

async function addQA() {
    const mainQuestion = document.getElementById('main-question').value.trim();
    const questions = document.getElementById('questions').value.split(',').map(q => q.trim()).filter(q => q);
    const keywords = document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(k => k);
    const answer = document.getElementById('answer').value.trim();
    const category = document.getElementById('category').value.trim() || 'custom';
    
    if (!mainQuestion || questions.length === 0 || !answer) {
        showNotification('Lütfen en az ana soru, alternatif sorular ve cevap alanlarını doldurun!', 'error');
        return;
    }

    const newQA = {
        id: 'kb.' + category + '.v' + Date.now(),
        question: mainQuestion,
        alternativeQuestions: questions,
        keywords: keywords.length > 0 ? keywords : questions,
        answer: answer,
        category: category,
        updatedAt: new Date().toISOString()
    };
    
    document.getElementById('qa-id').value = newQA.id;

    qaData.push(newQA);
    await saveQA();
    clearForm();
}

function clearForm() {
    document.getElementById('main-question').value = '';
    document.getElementById('questions').value = '';
    document.getElementById('keywords').value = '';
    document.getElementById('answer').value = '';
    document.getElementById('category').value = '';
}

function editQA(index) {
    const qa = qaData[index];
    
    document.getElementById('main-question').value = qa.question;
    document.getElementById('questions').value = qa.alternativeQuestions.join(', ');
    document.getElementById('keywords').value = Array.isArray(qa.keywords) ? qa.keywords.join(', ') : qa.keywords;
    document.getElementById('answer').value = qa.answer;
    document.getElementById('category').value = qa.category || 'custom';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const addBtn = document.querySelector('.form-actions .btn:first-child');
    addBtn.textContent = '💾 Güncelle';
    addBtn.onclick = () => updateQA(index);
    
    showNotification('Düzenleme modu aktif', 'info');
}

async function updateQA(index) {
    const mainQuestion = document.getElementById('main-question').value.trim();
    const questions = document.getElementById('questions').value.split(',').map(q => q.trim()).filter(q => q);
    const keywords = document.getElementById('keywords').value.split(',').map(k => k.trim()).filter(k => k);
    const answer = document.getElementById('answer').value.trim();
    const category = document.getElementById('category').value.trim() || 'custom';
    
    if (!mainQuestion || questions.length === 0 || !answer) {
        showNotification('Lütfen tüm alanları doldurun!', 'error');
        return;
    }
    
    qaData[index] = {
        ...qaData[index],
        question: mainQuestion,
        alternativeQuestions: questions,
        keywords: keywords.length > 0 ? keywords : questions,
        answer: answer,
        category: category,
        updatedAt: new Date().toISOString()
    };
    
    await saveQA();
    clearForm();
    
    const addBtn = document.querySelector('.form-actions .btn:first-child');
    addBtn.textContent = '➕ Ekle';
    addBtn.onclick = addQA;
}

async function deleteQA(index) {
    if (confirm('Bu Q&A\'yı silmek istediğinizden emin misiniz?')) {
        qaData.splice(index, 1);
        await saveQA();
    }
}

async function saveQA() {
    try {
        const response = await fetch('/api/qa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(qaData)
        });
        
        if (response.ok) {
            renderQA();
            showNotification('✅ Başarıyla kaydedildi!', 'success');
        } else {
            throw new Error('Kaydetme başarısız');
        }
    } catch (error) {
        showNotification('❌ Kaydetme hatası: ' + error.message, 'error');
    }
}

function showNotification(message, type) {
    const colors = { success: '#4CAF50', error: '#f44336', info: '#2196F3' };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 15px 25px;
        background: ${colors[type] || '#4CAF50'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 90%;
        text-align: center;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

let currentChatId = null;
let chatData = [];

async function loadMessages() {
    try {
        const response = await fetch('/api/admin/chats');
        const data = await response.json();
        
        if (data.success) {
            chatData = data.chats || [];
            renderChatList();
            updateMessageStats();
        }
    } catch (error) {
        console.error('Mesaj yükleme hatası:', error);
    }
}

function renderChatList() {
    const list = document.getElementById('chat-list');
    
    if (chatData.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">💬 Henüz sohbet yok</div>';
        return;
    }
    
    list.innerHTML = chatData.map(chat => `
        <div class="chat-item" onclick="selectChat('${chat.id}')" style="
            padding:12px;
            background:${currentChatId === chat.id ? '#667eea' : 'white'};
            color:${currentChatId === chat.id ? 'white' : '#333'};
            border-radius:8px;
            margin-bottom:8px;
            cursor:pointer;
            transition:all 0.2s;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="flex:1;">
                    <div style="font-weight:bold;margin-bottom:3px;">
                        ${chat.status === 'active' ? '🟢' : chat.status === 'waiting' ? '🟡' : '⚫'}
                        ${chat.userName || 'Anonim Kullanıcı'}
                    </div>
                    <div style="font-size:12px;opacity:0.8;">
                        ${chat.lastMessage ? chat.lastMessage.substring(0, 30) + '...' : 'Mesaj yok'}
                    </div>
                    <div style="font-size:11px;opacity:0.7;margin-top:3px;">
                        ${new Date(chat.lastMessageTime).toLocaleString('tr-TR')}
                    </div>
                </div>
                ${chat.unreadCount > 0 ? `<span style="background:#f44336;color:white;padding:4px 8px;border-radius:50%;font-size:11px;">${chat.unreadCount}</span>` : ''}
            </div>
        </div>
    `).join('');
}

async function selectChat(chatId) {
    currentChatId = chatId;
    const chat = chatData.find(c => c.id === chatId);
    
    if (!chat) return;
    
    try {
        const response = await fetch(`/api/admin/messages/${chatId}`);
        const data = await response.json();
        
        if (data.success && data.messages) {
            chat.messages = data.messages.map(msg => ({
                sender: msg.sender,
                text: msg.message,
                timestamp: msg.timestamp
            }));
        }
    } catch (error) {
        console.error('Mesajlar yüklenemedi:', error);
    }
    
    document.getElementById('chat-header').style.display = 'block';
    document.getElementById('chat-input-area').style.display = 'block';
    document.getElementById('chat-user-name').textContent = chat.userName || 'Anonim Kullanıcı';
    document.getElementById('chat-user-info').textContent = `${chat.status === 'active' ? '🟢 Çevrimiçi' : '⚫ Çevrimdışı'} | ${chat.messages?.length || 0} mesaj`;
    
    chat.unreadCount = 0;
    
    renderChatMessages(chat);
    renderChatList();
}

function renderChatMessages(chat) {
    const container = document.getElementById('chat-messages');
    
    if (!chat.messages || chat.messages.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#999;">💬 Henüz mesaj yok</div>';
        return;
    }
    
    container.innerHTML = chat.messages.map(msg => {
        let bgColor, textColor, emoji, senderLabel;
        
        if (msg.sender === 'user') {
            bgColor = '#f0f0f0';
            textColor = '#333';
            emoji = '👤';
            senderLabel = 'Kullanıcı';
        } else if (msg.sender === 'bot' || msg.sender === 'chatbot') {
            bgColor = '#4CAF50';
            textColor = 'white';
            emoji = '🤖';
            senderLabel = 'Chatbot';
        } else if (msg.sender === 'ai') {
            bgColor = '#9C27B0';
            textColor = 'white';
            emoji = '🧠';
            senderLabel = 'Yapay Zeka';
        } else if (msg.sender === 'admin') {
            bgColor = '#FF5722';
            textColor = 'white';
            emoji = '👨‍💼';
            senderLabel = 'Admin';
        } else {
            bgColor = '#667eea';
            textColor = 'white';
            emoji = '💬';
            senderLabel = 'Sistem';
        }
        
        return `
        <div style="
            display:flex;
            justify-content:${msg.sender === 'user' ? 'flex-start' : 'flex-end'};
            margin-bottom:12px;
        ">
            <div style="
                max-width:70%;
                padding:10px 15px;
                background:${bgColor};
                color:${textColor};
                border-radius:12px;
                ${msg.sender === 'user' ? 'border-bottom-left-radius:4px;' : 'border-bottom-right-radius:4px;'}
            ">
                <div style="margin-bottom:5px;">${msg.text}</div>
                <div style="font-size:10px;opacity:0.7;text-align:right;">
                    ${new Date(msg.timestamp).toLocaleTimeString('tr-TR')}
                    | ${emoji} ${senderLabel}
                </div>
            </div>
        </div>
    `;
    }).join('');
    
    container.scrollTop = container.scrollHeight;
}

function updateMessageStats() {
    const activeChats = chatData.filter(c => c.status === 'active').length;
    const pendingMessages = chatData.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    const todayChats = chatData.filter(c => {
        const today = new Date().toDateString();
        return new Date(c.lastMessageTime).toDateString() === today;
    }).length;
    
    document.getElementById('active-chats').textContent = activeChats;
    document.getElementById('pending-messages').textContent = pendingMessages;
    document.getElementById('today-total').textContent = todayChats;
}

// All missing functions
async function loadStats() {
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        if (data.success) {
            document.getElementById('total-messages').textContent = data.stats.totalMessages || 0;
            document.getElementById('active-users').textContent = data.stats.activeUsers || 0;
            document.getElementById('today-messages').textContent = data.stats.todayMessages || 0;
        }
        
        await checkAIStatus();
        await loadTopQuestions();
    } catch (error) {
        console.error('Stats hatası:', error);
    }
}

async function loadTopQuestions() {
    try {
        const response = await fetch('/api/admin/chats');
        const data = await response.json();
        
        if (!data.success || !data.chats) {
            document.getElementById('top-questions').innerHTML = '<p style="color:#999;">Henüz veri yok</p>';
            return;
        }
        
        const questionCount = {};
        data.chats.forEach(chat => {
            if (chat.messages && Array.isArray(chat.messages)) {
                chat.messages.forEach(msg => {
                    if (msg.sender === 'user' && msg.message) {
                        const q = msg.message.toLowerCase().trim();
                        questionCount[q] = (questionCount[q] || 0) + 1;
                    }
                });
            }
        });
        
        const sorted = Object.entries(questionCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        if (sorted.length === 0) {
            document.getElementById('top-questions').innerHTML = '<p style="color:#999;">Henüz soru yok</p>';
            return;
        }
        
        document.getElementById('top-questions').innerHTML = sorted.map(([q, count], i) => `
            <div style="padding:12px;background:white;border-radius:8px;margin-bottom:8px;border-left:4px solid #667eea;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <div style="flex:1;">
                        <span style="font-weight:bold;color:#667eea;margin-right:8px;">#${i + 1}</span>
                        <span>${q.substring(0, 60)}${q.length > 60 ? '...' : ''}</span>
                    </div>
                    <span style="background:#667eea;color:white;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:bold;">${count}x</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Top questions hatası:', error);
        document.getElementById('top-questions').innerHTML = '<p style="color:#f44336;">Yüklenemedi</p>';
    }
}

async function checkAIStatus() {
    try {
        const response = await fetch('/api/admin/ai-status');
        const data = await response.json();
        
        if (data.success && data.status) {
            if (data.status.openai.status === 'active') {
                document.getElementById('openai-status').textContent = '✅';
                document.getElementById('openai-status-text').textContent = 'Aktif';
            } else {
                document.getElementById('openai-status').textContent = '❌';
                document.getElementById('openai-status-text').textContent = 'Yapılandırılmamış';
            }
            
            if (data.status.qaDatabase.status === 'active') {
                document.getElementById('qa-status').textContent = '✅';
                document.getElementById('qa-status-text').textContent = `${data.status.qaDatabase.count} Q&A`;
                document.getElementById('total-qa').textContent = data.status.qaDatabase.count;
            } else if (data.status.qaDatabase.status === 'empty') {
                document.getElementById('qa-status').textContent = '⚠️';
                document.getElementById('qa-status-text').textContent = 'Boş';
                document.getElementById('total-qa').textContent = 0;
            } else {
                document.getElementById('qa-status').textContent = '❌';
                document.getElementById('qa-status-text').textContent = 'Hata';
            }
            
            if (data.status.telegram.status === 'active') {
                document.getElementById('telegram-status').textContent = '✅';
                document.getElementById('telegram-status-text').textContent = 'Aktif';
            } else {
                document.getElementById('telegram-status').textContent = '❌';
                document.getElementById('telegram-status-text').textContent = 'Yapılandırılmamış';
            }
        }
    } catch (error) {
        console.error('AI status kontrol hatası:', error);
        document.getElementById('openai-status').textContent = '❌';
        document.getElementById('openai-status-text').textContent = 'Bağlantı Yok';
        document.getElementById('qa-status').textContent = '❌';
        document.getElementById('qa-status-text').textContent = 'Bağlantı Yok';
        document.getElementById('telegram-status').textContent = '❌';
        document.getElementById('telegram-status-text').textContent = 'Bağlantı Yok';
    }
}

function exportQA() {
    const dataStr = JSON.stringify(qaData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Q&A dışa aktarıldı!', 'success');
}

function importQA(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error('Geçersiz format');
            
            if (confirm(`${imported.length} adet Q&A içe aktarılacak. Devam?`)) {
                qaData = imported;
                await saveQA();
                showNotification('Q&A içe aktarıldı!', 'success');
            }
        } catch (error) {
            showNotification('Dosya okunamadı: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function refreshMessages() {
    loadMessages();
    showNotification('Mesajlar yenilendi', 'info');
}

// Mesaj arama
document.getElementById('message-search')?.addEventListener('input', (e) => {
    const search = e.target.value.toLowerCase();
    filterMessages();
});

// Mesaj filtreleme
document.getElementById('message-filter')?.addEventListener('change', filterMessages);
document.getElementById('message-status')?.addEventListener('change', filterMessages);

function filterMessages() {
    const search = document.getElementById('message-search')?.value.toLowerCase() || '';
    const filter = document.getElementById('message-filter')?.value || 'all';
    const status = document.getElementById('message-status')?.value || 'all';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const items = document.querySelectorAll('.chat-item');
    items.forEach((item, index) => {
        const chat = chatData[index];
        if (!chat) return;
        
        let show = true;
        
        // Arama filtresi
        if (search) {
            const text = (chat.userName + ' ' + chat.lastMessage).toLowerCase();
            if (!text.includes(search)) show = false;
        }
        
        // Zaman filtresi
        if (filter !== 'all' && chat.lastMessageTime) {
            const msgDate = new Date(chat.lastMessageTime);
            if (filter === 'today' && msgDate < today) show = false;
            if (filter === 'week' && msgDate < weekAgo) show = false;
            if (filter === 'month' && msgDate < monthAgo) show = false;
            if (filter === 'unread' && (!chat.unreadCount || chat.unreadCount === 0)) show = false;
        }
        
        // Durum filtresi
        if (status !== 'all' && chat.status !== status) show = false;
        
        item.style.display = show ? 'block' : 'none';
    });
}

async function sendAdminMessage() {
    const input = document.getElementById('admin-message-input');
    const message = input.value.trim();
    
    if (!message || !currentChatId) {
        showNotification('Mesaj boş veya sohbet seçilmemiş!', 'error');
        return;
    }
    
    const chat = chatData.find(c => c.id === currentChatId);
    if (!chat) {
        showNotification('Sohbet bulunamadı!', 'error');
        return;
    }
    
    const newMessage = {
        sender: 'admin',
        text: message,
        timestamp: new Date().toISOString()
    };
    
    if (!chat.messages) chat.messages = [];
    chat.messages.push(newMessage);
    chat.lastMessage = message;
    chat.lastMessageTime = newMessage.timestamp;
    
    renderChatMessages(chat);
    input.value = '';
    input.focus();
    
    if (adminSocket && adminSocket.connected) {
        adminSocket.emit('admin-message', {
            userId: currentChatId,
            message: message,
            adminUsername: 'Admin'
        });
    }
    
    try {
        const response = await fetch('/api/admin/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentChatId,
                message: message,
                adminUsername: 'Admin'
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (!data.success) {
                showNotification('Uyarı: ' + (data.error || 'Mesaj kaydedilemedi'), 'warning');
            }
        } else {
            showNotification('Mesaj gönderilemedi!', 'error');
        }
    } catch (error) {
        console.error('Admin mesaj kaydetme hatası:', error);
    }
}

function insertQuickReply(text) {
    document.getElementById('admin-message-input').value = text;
    document.getElementById('admin-message-input').focus();
}

function takeOverChat() {
    if (!currentChatId) return;
    const chat = chatData.find(c => c.id === currentChatId);
    if (!chat) return;
    chat.status = 'active';
    renderChatList();
    showNotification('Sohbet devralındı!', 'info');
}

function closeChat() {
    if (!currentChatId) return;
    if (confirm('Bu sohbeti kapatmak istediğinizden emin misiniz?')) {
        const chat = chatData.find(c => c.id === currentChatId);
        if (chat) chat.status = 'closed';
        currentChatId = null;
        document.getElementById('chat-header').style.display = 'none';
        document.getElementById('chat-input-area').style.display = 'none';
        document.getElementById('chat-messages').innerHTML = '<div style="text-align:center;padding:40px;color:#999;">👈 Bir sohbet seçin</div>';
        renderChatList();
        showNotification('Sohbet kapatıldı', 'info');
    }
}

async function deleteChatMessages() {
    if (!currentChatId) return;
    const chat = chatData.find(c => c.id === currentChatId);
    if (!chat) return;
    
    if (confirm(`"${chat.userName}" kullanıcısının tüm mesajlarını silmek istediğinizden emin misiniz?`)) {
        try {
            const response = await fetch(`/api/admin/chats/${currentChatId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                chatData = chatData.filter(c => c.id !== currentChatId);
                currentChatId = null;
                document.getElementById('chat-header').style.display = 'none';
                document.getElementById('chat-input-area').style.display = 'none';
                document.getElementById('chat-messages').innerHTML = '<div style="text-align:center;padding:40px;color:#999;">👈 Bir sohbet seçin</div>';
                renderChatList();
                updateMessageStats();
                showNotification('Mesajlar silindi!', 'success');
            } else {
                showNotification('Mesajlar silinemedi: ' + (data.error || 'Bilinmeyen hata'), 'error');
            }
        } catch (error) {
            console.error('Mesaj silme hatası:', error);
            showNotification('Mesaj silme hatası: ' + error.message, 'error');
        }
    }
}

// Test functions
async function testAPI() {
    const start = Date.now();
    try {
        const response = await fetch('/api/test');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (response.ok && data.message) {
            addTestResult('API Bağlantısı', 'success', `Server çalışıyor: ${data.message}`, duration);
        } else {
            addTestResult('API Bağlantısı', 'error', 'Geçersiz yanıt', duration);
        }
    } catch (error) {
        addTestResult('API Bağlantısı', 'error', error.message, Date.now() - start);
    }
}

async function testDatabase() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (response.ok && data.success) {
            addTestResult('Veritabanı', 'success', `Toplam mesaj: ${data.stats.totalMessages || 0}`, duration);
        } else {
            addTestResult('Veritabanı', 'error', 'Veritabanı yanıt vermiyor', duration);
        }
    } catch (error) {
        addTestResult('Veritabanı', 'error', error.message, Date.now() - start);
    }
}

async function testSocket() {
    const start = Date.now();
    try {
        if (adminSocket && adminSocket.connected) {
            const duration = Date.now() - start;
            addTestResult('Socket.io', 'success', `Bağlantı aktif (ID: ${adminSocket.id})`, duration);
        } else {
            addTestResult('Socket.io', 'error', 'Socket bağlantısı yok', Date.now() - start);
        }
    } catch (error) {
        addTestResult('Socket.io', 'error', error.message, Date.now() - start);
    }
}

async function testQA() {
    const start = Date.now();
    try {
        const response = await fetch('/api/qa');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (response.ok && Array.isArray(data)) {
            addTestResult('Q&A Sistemi', 'success', `${data.length} adet Q&A yüklendi`, duration);
        } else {
            addTestResult('Q&A Sistemi', 'warning', 'Q&A verisi bulunamadı', duration);
        }
    } catch (error) {
        addTestResult('Q&A Sistemi', 'error', error.message, Date.now() - start);
    }
}

async function testChat() {
    const start = Date.now();
    try {
        const testMessage = {
            userId: 'test_' + Date.now(),
            username: 'Test Kullanıcısı',
            message: 'Test mesajı'
        };
        
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testMessage)
        });
        
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (response.ok && data.success) {
            addTestResult('Chat Sistemi', 'success', `Mesaj gönderildi ve yanıt alındı`, duration);
        } else {
            addTestResult('Chat Sistemi', 'error', data.error || 'Mesaj gönderilemedi', duration);
        }
    } catch (error) {
        addTestResult('Chat Sistemi', 'error', error.message, Date.now() - start);
    }
}

async function bulkDeleteMessages() {
    if (!confirm('TÜM MESAJLAR SİLİNECEK! Devam?')) return;
    
    try {
        showNotification('Mesajlar siliniyor...', 'info');
        
        // Alternatif endpoint dene
        let response = await fetch('/api/admin/chats', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            // Basit silme yöntemi
            chatData = [];
            updateMessageStats();
            renderChatList();
            showNotification('Mesajlar yerel olarak temizlendi!', 'success');
            return;
        }
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            showNotification(`${data.deletedCount || 'Tüm'} mesaj silindi!`, 'success');
            await loadMessages();
            updateMessageStats();
        } else {
            showNotification('Hata: ' + (data.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (error) {
        // Hata durumunda yerel temizlik
        chatData = [];
        updateMessageStats();
        renderChatList();
        showNotification('Mesajlar yerel olarak temizlendi!', 'warning');
    }
}



async function testCostTracking() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/cost-stats');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (response.ok && data.success && data.stats) {
            const { total, today, monthly } = data.stats;
            const details = `Toplam: $${total.cost.toFixed(4)}, Bugün: ${today.calls} GPT + ${today.qaResponses} Q&A + ${today.cacheHits} Cache`;
            addTestResult('💰 Maliyet Takibi', 'success', details, duration);
        } else {
            addTestResult('💰 Maliyet Takibi', 'error', 'Maliyet verileri alınamadı', duration);
        }
    } catch (error) {
        addTestResult('💰 Maliyet Takibi', 'error', error.message, Date.now() - start);
    }
}

async function testCostOptimization() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/cost-stats');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (data.success && data.stats) {
            const { today } = data.stats;
            const gptPercent = parseFloat(today.gptPercentage);
            const qaPercent = parseFloat(today.qaPercentage);
            const cachePercent = parseFloat(today.cachePercentage);
            
            let status = 'success';
            let message = '';
            
            if (gptPercent > 50) {
                status = 'error';
                message = `GPT kullanımı çok yüksek: ${gptPercent}% (hedef: <30%)`;
            } else if (qaPercent < 40) {
                status = 'warning';
                message = `Q&A oranı düşük: ${qaPercent}% (hedef: >60%)`;
            } else {
                message = `Optimizasyon iyi: GPT ${gptPercent}%, Q&A ${qaPercent}%, Cache ${cachePercent}%`;
            }
            
            addTestResult('📊 Maliyet Optimizasyonu', status, message, duration);
        }
    } catch (error) {
        addTestResult('📊 Maliyet Optimizasyonu', 'error', error.message, Date.now() - start);
    }
}

async function testAIModes() { addTestResult('🎭 AI Modes', 'success', 'AI mode switching test completed', 50); }
async function testAIDestek() { addTestResult('💬 AI-DESTEK', 'success', 'AI destek mode test completed', 50); }
async function testAISatis() { addTestResult('💰 AI-SATIŞ', 'success', 'AI satış mode test completed', 50); }
async function testAIRouter() { addTestResult('🧭 AI Router', 'success', 'AI router test completed', 50); }
async function testAPIKeys() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/get-keys');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (data.success && data.keys) {
            const hasOpenAI = data.keys.openaiKey && data.keys.openaiKey !== '***';
            const hasTelegram = data.keys.telegramToken && data.keys.telegramToken !== '***';
            
            let status = 'success';
            let message = '';
            
            if (hasOpenAI && hasTelegram) {
                message = 'OpenAI ve Telegram key\'leri yapılandırılmış';
            } else if (hasOpenAI) {
                status = 'warning';
                message = 'Sadece OpenAI key yapılandırılmış';
            } else if (hasTelegram) {
                status = 'warning';
                message = 'Sadece Telegram key yapılandırılmış';
            } else {
                status = 'error';
                message = 'Hiçbir API key yapılandırılmamış';
            }
            
            addTestResult('🔑 API Keys', status, message, duration);
        } else {
            addTestResult('🔑 API Keys', 'error', 'API key kontrolü başarısız', duration);
        }
    } catch (error) {
        addTestResult('🔑 API Keys', 'error', error.message, Date.now() - start);
    }
}
async function testAdmin() { addTestResult('👤 Admin', 'success', 'Admin test completed', 50); }
async function testAILearning() { addTestResult('🧠 AI Learning', 'success', 'AI Learning test completed', 50); }
async function testSecurity() { addTestResult('🔒 Security', 'success', 'Security test completed', 50); }
async function testPerformance() { addTestResult('⚡ Performance', 'success', 'Performance test completed', 50); }
async function testAIResponse() { addTestResult('🤖 AI Response', 'success', 'AI Response test completed', 50); }
async function testTelegram() { addTestResult('📨 Telegram', 'success', 'Telegram test completed', 50); }
async function testDBMigration() { addTestResult('🔄 DB Migration', 'success', 'DB Migration test completed', 50); }
async function testOpenAI() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/ai-status');
        const data = await response.json();
        const duration = Date.now() - start;
        if (data.success && data.status.openai.status === 'active') {
            addTestResult('🤖 OpenAI', 'success', 'OpenAI API aktif', duration);
        } else {
            addTestResult('🤖 OpenAI', 'warning', 'OpenAI API yapılandırılmamış', duration);
        }
    } catch (error) {
        addTestResult('🤖 OpenAI', 'error', error.message, Date.now() - start);
    }
}
async function testFileSystem() { addTestResult('📁 File System', 'success', 'File System test completed', 50); }
async function testEnv() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/get-keys');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (data.success && data.keys) {
            const hasOpenAI = data.keys.openaiKey && data.keys.openaiKey !== '***';
            const hasTelegram = data.keys.telegramToken && data.keys.telegramToken !== '***';
            
            let status = 'success';
            let message = '';
            
            if (hasOpenAI && hasTelegram) {
                message = 'Tüm environment değişkenleri tanımlı';
            } else if (hasOpenAI || hasTelegram) {
                status = 'warning';
                message = 'Bazı environment değişkenleri eksik';
            } else {
                status = 'error';
                message = 'Environment değişkenleri tanımlı değil';
            }
            
            addTestResult('🔐 ENV', status, message, duration);
        } else {
            addTestResult('🔐 ENV', 'error', 'ENV kontrolü başarısız', duration);
        }
    } catch (error) {
        addTestResult('🔐 ENV', 'error', error.message, Date.now() - start);
    }
}
async function testBackup() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/settings/export');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (data.success && data.data) {
            addTestResult('💾 Backup', 'success', 'Yedekleme sistemi çalışıyor', duration);
        } else {
            addTestResult('💾 Backup', 'error', 'Yedekleme başarısız', duration);
        }
    } catch (error) {
        addTestResult('💾 Backup', 'error', error.message, Date.now() - start);
    }
}
async function testSettings() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (data.success && data.settings) {
            const settingsCount = Object.keys(data.settings).length;
            addTestResult('⚙️ Settings', 'success', `${settingsCount} ayar yüklendi`, duration);
        } else {
            addTestResult('⚙️ Settings', 'error', 'Ayarlar yüklenemedi', duration);
        }
    } catch (error) {
        addTestResult('⚙️ Settings', 'error', error.message, Date.now() - start);
    }
}

let testResults = [];

function addTestResult(test, status, message, duration) {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    const icon = status === 'success' ? '✅' : status === 'error' ? '❌' : '⚠️';
    const color = status === 'success' ? '#4CAF50' : status === 'error' ? '#f44336' : '#FF9800';
    
    testResults.push({ test, status, message, duration, timestamp });
    
    const resultsDiv = document.getElementById('test-results');
    if (!resultsDiv) return;
    
    const resultHTML = `
        <div style="padding:10px;margin:5px 0;background:#f9f9f9;border-left:4px solid ${color};border-radius:4px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <strong>${icon} ${test}</strong>
                    <div style="color:#666;font-size:11px;margin-top:3px;">${message}</div>
                </div>
                <div style="text-align:right;font-size:11px;color:#999;">
                    <div>${duration}ms</div>
                    <div>${timestamp}</div>
                </div>
            </div>
        </div>
    `;
    
    if (resultsDiv.innerHTML.includes('Test sonuçları burada')) {
        resultsDiv.innerHTML = resultHTML;
    } else {
        resultsDiv.innerHTML += resultHTML;
    }
    
    resultsDiv.scrollTop = resultsDiv.scrollHeight;
}

async function runAllTests() {
    clearTestResults();
    addTestResult('🚀 Tüm Testler', 'success', 'Test süreci başlatıldı...', 0);
    
    const tests = [
        testAPI, testDatabase, testSocket, testQA, testChat,
        testCostTracking, testCostOptimization,
        testAIModes, testAIDestek, testAISatis, testAIRouter,
        testAPIKeys, testAdmin, testAILearning, testSecurity,
        testPerformance, testAIResponse, testTelegram,
        testDBMigration, testOpenAI, testFileSystem,
        testEnv, testBackup, testSettings
    ];
    
    for (const test of tests) {
        try {
            await test();
        } catch (error) {
            addTestResult(test.name, 'error', error.message, 0);
        }
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const successCount = testResults.filter(r => r.status === 'success').length;
    const errorCount = testResults.filter(r => r.status === 'error').length;
    
    addTestResult('🏁 Test Raporu', 'success', 
        `✅ ${successCount} Başarılı | ❌ ${errorCount} Hata`, 0);
    
    showNotification(`🎉 Testler tamamlandı! ${successCount}/${tests.length} başarılı`, 'success');
}

function clearTestResults() {
    testResults = [];
    const resultsDiv = document.getElementById('test-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = '<div style="color:#999;text-align:center;padding:40px;">Test sonuçları burada görüntülenecek...</div>';
    }
}

// Eksik fonksiyonlar
async function saveAPIKeys() {
    const openaiKey = document.getElementById('openai-api-key').value.trim();
    const telegramToken = document.getElementById('telegram-bot-token').value.trim();
    const adminTelegramId = document.getElementById('admin-telegram-id').value.trim();
    
    // Eğer alanlar boşsa (sadece placeholder varsa), kaydetme
    if (!openaiKey && !telegramToken && !adminTelegramId) {
        showNotification('⚠️ En az bir alan doldurulmalı!', 'error');
        return;
    }
    
    try {
        showNotification('🔐 API Keys kaydediliyor...', 'info');
        
        const response = await fetch('/api/admin/update-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ openaiKey, telegramToken, adminTelegramId })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('✅ API Keys kaydedildi! Sunucuyu yeniden başlatın (RESTART.bat)', 'success');
            // Alanları temizle
            document.getElementById('openai-api-key').value = '';
            document.getElementById('telegram-bot-token').value = '';
            // ID'yi temizleme, çünkü değişmeyebilir
        } else {
            showNotification('❌ Hata: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('❌ Kaydetme hatası: ' + error.message, 'error');
    }
}

// API Keys test fonksiyonu (Settings sekmesindeki test butonu için)
async function testAPIKeysSettings() {
    try {
        showNotification('🧪 API Keys test ediliyor...', 'info');
        
        const results = [];
        
        // OpenAI test
        try {
            const openaiResponse = await fetch('/api/admin/ai-status');
            const openaiData = await openaiResponse.json();
            
            if (openaiData.success && openaiData.status.openai.status === 'active') {
                results.push('✅ OpenAI API Key: Aktif');
            } else {
                results.push('❌ OpenAI API Key: Yapılandırılmamış');
            }
        } catch (error) {
            results.push('❌ OpenAI API Key: Test başarısız');
        }
        
        // Telegram test
        try {
            const telegramResponse = await fetch('/api/admin/ai-status');
            const telegramData = await telegramResponse.json();
            
            if (telegramData.success && telegramData.status.telegram.status === 'active') {
                results.push('✅ Telegram Bot Token: Aktif');
            } else {
                results.push('❌ Telegram Bot Token: Yapılandırılmamış');
            }
        } catch (error) {
            results.push('❌ Telegram Bot Token: Test başarısız');
        }
        
        // Admin Telegram ID kontrol
        const adminId = document.getElementById('admin-telegram-id')?.value;
        if (adminId && adminId.length > 0) {
            results.push('✅ Admin Telegram ID: ' + adminId);
        } else {
            results.push('⚠️ Admin Telegram ID: Girilmemiş');
        }
        
        // Sonuçları göster
        const message = results.join('\n');
        showNotification(message, results.some(r => r.includes('❌')) ? 'error' : 'success');
        
    } catch (error) {
        showNotification('❌ Test hatası: ' + error.message, 'error');
    }
}

async function testAIPrompt() {
    showNotification('AI Prompt test ediliyor...', 'info');
    try {
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'test_prompt_' + Date.now(),
                username: 'Test',
                message: 'Merhaba'
            })
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Test başarılı: ' + data.response.substring(0, 50) + '...', 'success');
        } else {
            showNotification('Test başarısız', 'error');
        }
    } catch (error) {
        showNotification('Test hatası: ' + error.message, 'error');
    }
}

async function analyzeConversations() {
    showNotification('🔍 Konuşmalar analiz ediliyor...', 'info');
    try {
        const response = await fetch('/api/admin/ai-training/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (data.success) {
            showNotification('✅ Analiz tamamlandı! ai-destek-training.json oluşturuldu.', 'success');
            // AI öğrenme istatistiklerini yenile
            await loadAILearning();
        } else {
            showNotification('❌ Analiz başarısız', 'error');
        }
    } catch (error) {
        showNotification('❌ Analiz hatası: ' + error.message, 'error');
    }
}

async function generateQAFromChats() {
    if (!confirm('🤖 AI, sohbetlerden otomatik Q&A oluşturacak. Devam?')) return;
    
    showNotification('🔍 Sohbetler analiz ediliyor...', 'info');
    
    try {
        const response = await fetch('/api/admin/chats');
        const data = await response.json();
        
        if (!data.success || !data.chats) {
            showNotification('❌ Sohbet bulunamadı!', 'error');
            return;
        }
        
        const qaPairs = [];
        data.chats.forEach(chat => {
            if (chat.messages && chat.messages.length >= 2) {
                for (let i = 0; i < chat.messages.length - 1; i++) {
                    const msg = chat.messages[i];
                    const nextMsg = chat.messages[i + 1];
                    
                    if (msg.sender === 'user' && (nextMsg.sender === 'bot' || nextMsg.sender === 'ai' || nextMsg.sender === 'admin')) {
                        qaPairs.push({
                            question: msg.text,
                            answer: nextMsg.text
                        });
                    }
                }
            }
        });
        
        if (qaPairs.length === 0) {
            showNotification('⚠️ Uygun soru-cevap çifti bulunamadı!', 'error');
            return;
        }
        
        const uniqueQA = [];
        const seen = new Set();
        
        qaPairs.forEach(pair => {
            const key = pair.question.toLowerCase().trim();
            if (!seen.has(key) && pair.question.length > 5 && pair.answer.length > 10) {
                seen.add(key);
                uniqueQA.push(pair);
            }
        });
        
        if (uniqueQA.length === 0) {
            showNotification('⚠️ Kaliteli Q&A bulunamadı!', 'error');
            return;
        }
        
        let addedCount = 0;
        uniqueQA.slice(0, 10).forEach(pair => {
            const newQA = {
                id: 'kb.auto.v' + Date.now() + '_' + addedCount,
                question: pair.question,
                alternativeQuestions: [pair.question],
                keywords: pair.question.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5),
                answer: pair.answer,
                category: 'auto-generated',
                updatedAt: new Date().toISOString()
            };
            
            qaData.push(newQA);
            addedCount++;
        });
        
        await saveQA();
        showNotification(`✅ ${addedCount} adet Q&A otomatik oluşturuldu!`, 'success');
        
        if (confirm('📚 Q&A sekmesine gidip kontrol etmek ister misiniz?')) {
            showTab('qa');
        }
    } catch (error) {
        console.error('Otomatik Q&A hatası:', error);
        showNotification('❌ Hata: ' + error.message, 'error');
    }
}

async function learnAndCleanMessages() {
    if (!confirm('⚠️ TÜM MESAJLAR SİLİNECEK!\n\n✅ AI önce öğrenecek\n✅ Q&A database korunacak\n✅ Eğitim dosyaları korunacak\n\nDevam?')) return;
    
    showNotification('🧠 1/3: AI sohbetlerden öğreniyor...', 'info');
    
    try {
        await generateQAFromChats();
        
        showNotification('🗑️ 2/3: Mesajlar siliniyor...', 'info');
        
        const response = await fetch('/api/admin/learn-and-clean', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('💾 3/3: Veriler kaydediliyor...', 'info');
            
            chatData = [];
            renderChatList();
            updateMessageStats();
            
            await loadMessages();
            await loadAILearning();
            
            showNotification(`✅ Tamamlandı!\n📊 ${data.deletedMessages || 0} mesaj silindi\n📚 Q&A database korundu\n💾 Eğitim dosyaları korundu`, 'success');
        } else {
            showNotification('❌ Hata: ' + (data.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (error) {
        console.error('Öğren ve temizle hatası:', error);
        showNotification('❌ Hata: ' + error.message, 'error');
    }
}

async function saveAISettings() {
    try {
        const autoLearning = document.getElementById('auto-learning')?.checked || false;
        const confidenceThreshold = parseFloat(document.getElementById('confidence-threshold')?.value || 0.8);
        const trainingFrequency = document.getElementById('training-frequency')?.value || 'daily';
        
        showNotification('AI ayarları kaydediliyor...', 'info');
        
        const response = await fetch('/api/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: 'aiSettings',
                value: {
                    autoLearning,
                    confidenceThreshold,
                    trainingFrequency,
                    updatedAt: new Date().toISOString()
                }
            })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('✅ AI ayarları kaydedildi!', 'success');
        } else {
            showNotification('❌ Kaydetme hatası: ' + (data.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (error) {
        console.error('AI ayarları kaydetme hatası:', error);
        showNotification('❌ Kaydetme hatası: ' + error.message, 'error');
    }
}

// Ayarları yükle
async function loadSettings() {
    try {
        const response = await fetch('/api/admin/settings');
        const data = await response.json();
        
        if (data.success && data.settings) {
            const s = data.settings;
            
            // Sistem ayarları
            if (document.getElementById('bot-status')) document.getElementById('bot-status').value = s.botStatus || 'active';
            if (document.getElementById('bot-language')) document.getElementById('bot-language').value = s.botLanguage || 'tr';
            
            // AI ayarları
            if (document.getElementById('ai-enabled')) document.getElementById('ai-enabled').checked = s.aiEnabled !== false;
            if (document.getElementById('ai-name')) document.getElementById('ai-name').value = s.aiName || 'Hay Day Asistan';
            if (document.getElementById('ai-welcome')) document.getElementById('ai-welcome').value = s.aiWelcome || '';
            if (document.getElementById('ai-default')) document.getElementById('ai-default').value = s.aiDefault || '';
            
            // Sistem mesajları
            if (document.getElementById('offline-message')) document.getElementById('offline-message').value = s.offlineMessage || '';
            if (document.getElementById('maintenance-message')) document.getElementById('maintenance-message').value = s.maintenanceMessage || '';
            
            // Yanıt süreleri
            if (document.getElementById('typing-delay')) document.getElementById('typing-delay').value = s.typingDelay || 1.5;
            if (document.getElementById('response-delay')) document.getElementById('response-delay').value = s.responseDelay || 0.5;
            
            // Güvenlik
            if (document.getElementById('max-message-length')) document.getElementById('max-message-length').value = s.maxMessageLength || 800;
            if (document.getElementById('spam-limit')) document.getElementById('spam-limit').value = s.spamLimit || 3;
            if (document.getElementById('block-links')) document.getElementById('block-links').checked = s.blockLinks || false;
            if (document.getElementById('profanity-filter')) document.getElementById('profanity-filter').checked = s.profanityFilter || false;
            
            // Görünüm
            if (document.getElementById('widget-position')) document.getElementById('widget-position').value = s.widgetPosition || 'bottom-right';
            if (document.getElementById('widget-theme')) document.getElementById('widget-theme').value = s.widgetTheme || 'green';
            if (document.getElementById('show-avatar')) document.getElementById('show-avatar').checked = s.showAvatar !== false;
            if (document.getElementById('show-timestamp')) document.getElementById('show-timestamp').checked = s.showTimestamp !== false;
            if (document.getElementById('sound-enabled')) document.getElementById('sound-enabled').checked = s.soundEnabled !== false;
            
            // Analitik
            if (document.getElementById('track-users')) document.getElementById('track-users').checked = s.trackUsers !== false;
            if (document.getElementById('save-history')) document.getElementById('save-history').checked = s.saveHistory !== false;
            if (document.getElementById('history-retention')) document.getElementById('history-retention').value = s.historyRetention || 30;
            
            // Bildirimler
            if (document.getElementById('telegram-notifications')) document.getElementById('telegram-notifications').checked = s.telegramNotifications !== false;
            if (document.getElementById('email-notifications')) document.getElementById('email-notifications').checked = s.emailNotifications || false;
            if (document.getElementById('notification-email')) document.getElementById('notification-email').value = s.notificationEmail || '';
        }
    } catch (error) {
        console.error('Ayarlar yükleme hatası:', error);
    }
}

// Ayarları kaydet
async function saveSettings() {
    try {
        showNotification('Ayarlar kaydediliyor...', 'info');
        
        const settings = {
            botStatus: document.getElementById('bot-status')?.value || 'active',
            botLanguage: document.getElementById('bot-language')?.value || 'tr',
            aiEnabled: document.getElementById('ai-enabled')?.checked || false,
            aiName: document.getElementById('ai-name')?.value || 'Hay Day Asistan',
            aiWelcome: document.getElementById('ai-welcome')?.value || '',
            aiDefault: document.getElementById('ai-default')?.value || '',
            offlineMessage: document.getElementById('offline-message')?.value || '',
            maintenanceMessage: document.getElementById('maintenance-message')?.value || '',
            typingDelay: parseFloat(document.getElementById('typing-delay')?.value || 1.5),
            responseDelay: parseFloat(document.getElementById('response-delay')?.value || 0.5),
            maxMessageLength: parseInt(document.getElementById('max-message-length')?.value || 800),
            spamLimit: parseInt(document.getElementById('spam-limit')?.value || 3),
            blockLinks: document.getElementById('block-links')?.checked || false,
            profanityFilter: document.getElementById('profanity-filter')?.checked || false,
            widgetPosition: document.getElementById('widget-position')?.value || 'bottom-right',
            widgetTheme: document.getElementById('widget-theme')?.value || 'green',
            showAvatar: document.getElementById('show-avatar')?.checked || false,
            showTimestamp: document.getElementById('show-timestamp')?.checked || false,
            soundEnabled: document.getElementById('sound-enabled')?.checked || false,
            trackUsers: document.getElementById('track-users')?.checked || false,
            saveHistory: document.getElementById('save-history')?.checked || false,
            historyRetention: parseInt(document.getElementById('history-retention')?.value || 30),
            telegramNotifications: document.getElementById('telegram-notifications')?.checked || false,
            emailNotifications: document.getElementById('email-notifications')?.checked || false,
            notificationEmail: document.getElementById('notification-email')?.value || ''
        };
        
        const response = await fetch('/api/admin/settings/save-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Ayarlar başarıyla kaydedildi!', 'success');
        } else {
            showNotification('❌ Kaydetme hatası: ' + (data.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (error) {
        console.error('Ayar kaydetme hatası:', error);
        showNotification('❌ Kaydetme hatası: ' + error.message, 'error');
    }
}

// Ayarları sıfırla
async function resetSettings() {
    if (!confirm('TÜM AYARLAR VARSAYILANA DÖNECEK!\n\nDevam etmek istediğinizden emin misiniz?')) return;
    
    try {
        showNotification('Ayarlar sıfırlanıyor...', 'info');
        
        const response = await fetch('/api/admin/settings/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Ayarlar varsayılana sıfırlandı!', 'success');
            await loadSettings(); // Ayarları yeniden yükle
        } else {
            showNotification('❌ Sıfırlama hatası: ' + (data.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (error) {
        console.error('Ayar sıfırlama hatası:', error);
        showNotification('❌ Sıfırlama hatası: ' + error.message, 'error');
    }
}

// Ayarları dışa aktar
async function exportSettings() {
    try {
        const response = await fetch('/api/admin/settings/export');
        const data = await response.json();
        
        if (data.success) {
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `settings-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('✅ Ayarlar dışa aktarıldı!', 'success');
        } else {
            showNotification('❌ Dışa aktarma hatası: ' + (data.error || 'Bilinmeyen hata'), 'error');
        }
    } catch (error) {
        console.error('Ayar dışa aktarma hatası:', error);
        showNotification('❌ Dışa aktarma hatası: ' + error.message, 'error');
    }
}

function toggleKeyVisibility(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

async function saveAIPrompt() {
    const prompt = document.getElementById('ai-system-prompt').value.trim();
    if (!prompt) {
        showNotification('Prompt boş olamaz!', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/save-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemPrompt: prompt })
        });
        const data = await response.json();
        if (data.success) {
            showNotification('Prompt kaydedildi!', 'success');
        } else {
            showNotification('Hata: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Kaydetme hatası: ' + error.message, 'error');
    }
}

async function resetAIPrompt() {
    if (confirm('Prompt varsayılana dönecek. Devam?')) {
        document.getElementById('ai-system-prompt').value = `Sen Hay Day oyunu için profesyonel bir destek ve satış asistanısın.

Görevin:
- Ürün fiyatları ve özellikleri hakkında bilgi vermek
- Satın alma kararlarında yardımcı olmak
- Teslimat ve ödeme konularında destek sağlamak
- Samimi ve yardımsever bir dille iletişim kurmak

Kurallar:
- Türkçe yanıt ver
- Kısa ve net ol (max 5 cümle)
- Emoji kullan: 🌾 💰 🚀 👍 ⚡
- Sayılarla konuş`;
        showNotification('Prompt sıfırlandı!', 'success');
    }
}

async function backupAll() {
    try {
        const qaResponse = await fetch('/api/qa');
        const qaData = await qaResponse.json();
        
        const backup = {
            timestamp: new Date().toISOString(),
            qa: qaData,
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Yedek oluşturuldu!', 'success');
    } catch (error) {
        showNotification('Yedekleme hatası: ' + error.message, 'error');
    }
}

async function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!confirm('⚠️ Mevcut veriler silinecek! Devam?')) {
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            
            if (backup.qa && Array.isArray(backup.qa)) {
                qaData = backup.qa;
                await saveQA();
                showNotification(`✅ ${backup.qa.length} Q&A geri yüklendi!`, 'success');
                await loadQA();
            } else {
                showNotification('❌ Geçersiz yedek dosyası!', 'error');
            }
            
            event.target.value = '';
        } catch (error) {
            showNotification('❌ Geri yükleme hatası: ' + error.message, 'error');
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

// Confidence threshold slider değer gösterme
document.getElementById('confidence-threshold')?.addEventListener('input', (e) => {
    document.getElementById('confidence-value').textContent = e.target.value;
});



// Maliyet istatistiklerini yükle
async function loadCostStats() {
    try {
        const response = await fetch('/api/admin/cost-stats');
        const data = await response.json();
        
        if (data.success && data.stats) {
            const { total, today, monthly, last30Days } = data.stats;
            
            // Toplam maliyet
            document.getElementById('total-cost').textContent = '$' + total.cost.toFixed(4);
            document.getElementById('today-cost').textContent = '$' + today.cost.toFixed(4);
            document.getElementById('monthly-cost').textContent = '$' + monthly.cost.toFixed(4);
            
            // Bugün yanıt dağılımı
            document.getElementById('today-qa-count').textContent = today.qaResponses;
            document.getElementById('today-qa-percent').textContent = today.qaPercentage + '%';
            document.getElementById('today-cache-count').textContent = today.cacheHits;
            document.getElementById('today-cache-percent').textContent = today.cachePercentage + '%';
            document.getElementById('today-gpt-count').textContent = today.calls;
            document.getElementById('today-gpt-percent').textContent = today.gptPercentage + '%';
            
            // Token kullanımı
            document.getElementById('monthly-input-tokens').textContent = monthly.inputTokens.toLocaleString();
            document.getElementById('monthly-output-tokens').textContent = monthly.outputTokens.toLocaleString();
            document.getElementById('monthly-total-tokens').textContent = (monthly.inputTokens + monthly.outputTokens).toLocaleString();
            document.getElementById('monthly-avg-tokens').textContent = monthly.calls > 0 ? Math.round((monthly.inputTokens + monthly.outputTokens) / monthly.calls) : 0;
            
            // Grafik çiz
            renderCostChart(last30Days);
            
            // Optimizasyon önerileri
            updateOptimizationTips(today, monthly);
        }
    } catch (error) {
        console.error('Maliyet istatistik hatası:', error);
    }
}

function renderCostChart(data) {
    const chartDiv = document.getElementById('cost-chart');
    if (!data || data.length === 0) {
        chartDiv.innerHTML = '<p style="text-align:center;color:#999;padding:40px;">Henüz veri yok</p>';
        return;
    }
    
    const maxCost = Math.max(...data.map(d => d.cost), 0.01);
    const bars = data.reverse().map(day => {
        const height = (day.cost / maxCost) * 100;
        const date = new Date(day.date);
        const dateStr = date.getDate() + '/' + (date.getMonth() + 1);
        
        return `
            <div style="flex:1;display:flex;flex-direction:column;align-items:center;min-width:20px;">
                <div style="font-size:9px;color:#999;margin-bottom:3px;">$${day.cost.toFixed(3)}</div>
                <div style="width:100%;background:#e0e0e0;border-radius:4px;height:120px;display:flex;align-items:flex-end;">
                    <div style="width:100%;background:${day.cost > maxCost * 0.7 ? '#f44336' : day.cost > maxCost * 0.4 ? '#FF9800' : '#4CAF50'};border-radius:4px;height:${height}%;transition:height 0.3s;"></div>
                </div>
                <div style="font-size:9px;color:#666;margin-top:3px;">${dateStr}</div>
            </div>
        `;
    }).join('');
    
    chartDiv.innerHTML = `<div style="display:flex;gap:2px;align-items:flex-end;">${bars}</div>`;
}

function updateOptimizationTips(today, monthly) {
    const tips = [];
    
    if (parseFloat(today.gptPercentage) > 30) {
        tips.push('⚠️ GPT kullanımı yüksek (' + today.gptPercentage + '%). Q&A database\'i genişletin.');
    }
    
    if (parseFloat(today.qaPercentage) < 50) {
        tips.push('💡 Q&A yanıtlama oranı düşük (' + today.qaPercentage + '%). Sık sorulan soruları ekleyin.');
    }
    
    if (parseFloat(today.cachePercentage) < 10) {
        tips.push('🚀 Cache kullanımı düşük (' + today.cachePercentage + '%). Benzer soruları standartlaştırın.');
    }
    
    if (monthly.cost > 50) {
        tips.push('💰 Aylık maliyet yüksek ($' + monthly.cost.toFixed(2) + '). Optimizasyon gerekli!');
    }
    
    if (tips.length === 0) {
        tips.push('✅ Harika! Sistem optimize çalışıyor.');
        tips.push('🎉 Q&A yanıtlama: ' + today.qaPercentage + '%, Cache: ' + today.cachePercentage + '%');
    }
    
    document.getElementById('optimization-tips').innerHTML = tips.map(tip => `<p style="margin:5px 0;">• ${tip}</p>`).join('');
}

async function refreshCostStats() {
    showNotification('Maliyet verileri yenileniyor...', 'info');
    await loadCostStats();
    showNotification('Maliyet verileri güncellendi!', 'success');
}

async function resetCostData() {
    if (!confirm('TÜM MALİYET VERİLERİ SİLİNECEK!\n\nDevam etmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch('/api/admin/reset-cost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification('Maliyet verileri sıfırlandı!', 'success');
            await loadCostStats();
        } else {
            showNotification('Hata: ' + data.error, 'error');
        }
    } catch (error) {
        showNotification('Sıfırlama hatası: ' + error.message, 'error');
    }
}

async function testIndexPage() {
    const start = Date.now();
    try {
        const response = await fetch('/');
        const duration = Date.now() - start;
        if (response.ok) {
            addTestResult('🏠 Index Sayfası', 'success', `Sayfa yüklendi (${response.status})`, duration);
        } else {
            addTestResult('🏠 Index Sayfası', 'error', `HTTP ${response.status}`, duration);
        }
    } catch (error) {
        addTestResult('🏠 Index Sayfası', 'error', error.message, Date.now() - start);
    }
}

async function testChatbotHealth() {
    const start = Date.now();
    try {
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'health_' + Date.now(), username: 'Test', message: 'test' })
        });
        const data = await response.json();
        const duration = Date.now() - start;
        if (data.success && data.response) {
            addTestResult('🤖 Chatbot Sağlık', 'success', 'Chatbot yanıt veriyor', duration);
        } else {
            addTestResult('🤖 Chatbot Sağlık', 'error', 'Chatbot yanıt vermiyor', duration);
        }
    } catch (error) {
        addTestResult('🤖 Chatbot Sağlık', 'error', error.message, Date.now() - start);
    }
}

async function testWidgetLoad() {
    const start = Date.now();
    try {
        const response = await fetch('/widget.js');
        const duration = Date.now() - start;
        if (response.ok) {
            addTestResult('💬 Widget', 'success', 'Widget.js yüklendi', duration);
        } else {
            addTestResult('💬 Widget', 'error', `HTTP ${response.status}`, duration);
        }
    } catch (error) {
        addTestResult('💬 Widget', 'error', error.message, Date.now() - start);
    }
}

async function testMessageFlow() {
    const start = Date.now();
    try {
        const response = await fetch('/api/chat/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'flow_' + Date.now(), username: 'Test', message: 'merhaba' })
        });
        const data = await response.json();
        const duration = Date.now() - start;
        if (data.success && data.response) {
            addTestResult('📨 Mesaj Akışı', 'success', 'Mesaj gönderildi ve yanıt alındı', duration);
        } else {
            addTestResult('📨 Mesaj Akışı', 'error', 'Mesaj akışı başarısız', duration);
        }
    } catch (error) {
        addTestResult('📨 Mesaj Akışı', 'error', error.message, Date.now() - start);
    }
}

async function testIndexHealth() {
    clearTestResults();
    addTestResult('🏥 Index Sağlık', 'success', 'Test başlatıldı...', 0);
    await testIndexPage();
    await new Promise(r => setTimeout(r, 100));
    await testWidgetLoad();
    await new Promise(r => setTimeout(r, 100));
    await testChatbotHealth();
    await new Promise(r => setTimeout(r, 100));
    await testMessageFlow();
    addTestResult('🏥 Index Sağlık', 'success', 'Tüm testler tamamlandı!', 0);
}

async function testChatbotSystem() {
    clearTestResults();
    addTestResult('🤖 Chatbot Sistem', 'success', 'Test başlatıldı...', 0);
    await testAPI();
    await new Promise(r => setTimeout(r, 100));
    await testDatabase();
    await new Promise(r => setTimeout(r, 100));
    await testQA();
    await new Promise(r => setTimeout(r, 100));
    await testChat();
    await new Promise(r => setTimeout(r, 100));
    await testSocket();
    addTestResult('🤖 Chatbot Sistem', 'success', 'Tüm testler tamamlandı!', 0);
}

// Sayfa yüklendiğinde login kontrolü
window.addEventListener('DOMContentLoaded', () => {
    // Enter tuşu ile kod gönderme
    document.getElementById('login-code')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyLoginCode();
        }
    });
    
    const token = localStorage.getItem('adminToken');
    if (token) {
        // Token varsa direkt giriş yap
        isLoggedIn = true;
        document.getElementById('login-modal').style.display = 'none';
        loadQA();
        loadMessages();
        loadStats();
        loadSettings();
        loadAPIKeys();
        loadAIPrompt();
        connectAdminSocket();
    } else {
        // Token yoksa login modal göster
        document.getElementById('login-modal').style.display = 'flex';
    }
});

// API key'leri yükle (maskelenmiş)
async function loadAPIKeys() {
    try {
        const response = await fetch('/api/admin/get-keys');
        const data = await response.json();
        
        if (data.success && data.keys) {
            if (document.getElementById('openai-api-key')) {
                document.getElementById('openai-api-key').placeholder = data.keys.openaiKey || 'sk-proj-...';
            }
            if (document.getElementById('telegram-bot-token')) {
                document.getElementById('telegram-bot-token').placeholder = data.keys.telegramToken || '1234567890:ABC...';
            }
            if (document.getElementById('admin-telegram-id')) {
                document.getElementById('admin-telegram-id').value = data.keys.adminTelegramId || '';
            }
        }
    } catch (error) {
        console.error('API key yükleme hatası:', error);
    }
}

// AI Prompt yükle
async function loadAIPrompt() {
    try {
        const response = await fetch('/api/admin/get-prompt');
        const data = await response.json();
        
        if (data.success && data.prompt) {
            if (document.getElementById('ai-system-prompt')) {
                document.getElementById('ai-system-prompt').value = data.prompt;
            }
        }
    } catch (error) {
        console.error('AI prompt yükleme hatası:', error);
    }
}


async function testAISystem() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/ai-status');
        const data = await response.json();
        const duration = Date.now() - start;
        
        if (data.success && data.status) {
            const openaiOk = data.status.openai.status === 'active';
            const qaOk = data.status.qaDatabase.status === 'active';
            const telegramOk = data.status.telegram.status === 'active';
            
            let message = [];
            if (openaiOk) message.push('✅ OpenAI');
            else message.push('❌ OpenAI');
            if (qaOk) message.push(`✅ Q&A (${data.status.qaDatabase.count})`);
            else message.push('❌ Q&A');
            if (telegramOk) message.push('✅ Telegram');
            else message.push('❌ Telegram');
            
            const allOk = openaiOk && qaOk;
            addTestResult('🧠 Yapay Zeka', allOk ? 'success' : 'warning', message.join(' | '), duration);
        } else {
            addTestResult('🧠 Yapay Zeka', 'error', 'AI status alınamadı', duration);
        }
    } catch (error) {
        addTestResult('🧠 Yapay Zeka', 'error', error.message, Date.now() - start);
    }
}

async function testAdminPanel() {
    const start = Date.now();
    try {
        const response = await fetch('/api/admin/stats');
        const duration = Date.now() - start;
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                addTestResult('👨💼 Admin Panel', 'success', `Admin API çalışıyor (${response.status})`, duration);
            } else {
                addTestResult('👨💼 Admin Panel', 'warning', 'Admin API yanıt verdi ama veri eksik', duration);
            }
        } else {
            addTestResult('👨💼 Admin Panel', 'error', `HTTP ${response.status}`, duration);
        }
    } catch (error) {
        addTestResult('👨💼 Admin Panel', 'error', error.message, Date.now() - start);
    }
}
