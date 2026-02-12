// script.js (Versi DeepSeek AI - Text Only)
document.addEventListener('DOMContentLoaded', () => {

    // --- Elemen DOM ---
    const sendButton = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const historyList = document.getElementById('history-list');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const uploadDocBtn = document.getElementById('upload-doc-btn');
    const uploadImgBtn = document.getElementById('upload-img-btn');
    const imageInput = document.getElementById('image-input');
    const docInput = document.getElementById('doc-input');
    const filePreviewContainer = document.getElementById('file-preview-container');
    const aiModelSelect = document.getElementById('ai-model-select');

    // --- PENGATURAN API DEEPSEEK ---
    // !!! PENTING: Ganti dengan API Key DeepSeek Anda (sk-...) !!!
    const apiKey = 'sk-85888d43310344cab5e0ff07db382e8a'; 
    const apiUrl = 'https://api.deepseek.com/chat/completions';

    let currentModel = aiModelSelect ? aiModelSelect.value : 'gen-z';

    // --- State Management ---
    let chats = [];
    let currentChatId = null;
    let attachedFile = null;

    // --- Fungsi Pengelola Riwayat ---
    function loadChats() {
        const savedChats = localStorage.getItem('ai-chat-history');
        if (savedChats) {
            chats = JSON.parse(savedChats);
        }
        if (chats.length > 0) {
            currentChatId = chats[0].id;
        } else {
            startNewChat();
        }
    }

    function saveChats() {
        localStorage.setItem('ai-chat-history', JSON.stringify(chats));
    }

    function renderHistory() {
        historyList.innerHTML = '';
        if (chats.length === 0) {
            historyList.innerHTML = '<li><a href="#" class="disabled">Tidak ada riwayat</a></li>';
        } else {
            chats.forEach(chat => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.innerHTML = `<i class="far fa-comment-dots"></i> ${chat.title}`;
                a.dataset.chatId = chat.id;
                if (chat.id === currentChatId) {
                    a.classList.add('active');
                }
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentChatId = chat.id;
                    renderChatBox();
                    renderHistory();
                });
                li.appendChild(a);
                historyList.appendChild(li);
            });
        }
    }

    function renderChatBox() {
        chatBox.innerHTML = '';
        const currentChat = chats.find(c => c.id === currentChatId);
        if (!currentChat || currentChat.messages.length === 0) {
             const initialMessageRow = document.createElement('div');
             initialMessageRow.classList.add('message-row', 'bot');

             const initialAvatar = document.createElement('img');
             initialAvatar.src = 'anim.gif'; 
             initialAvatar.alt = 'AI Avatar';
             initialAvatar.classList.add('avatar');
             initialMessageRow.appendChild(initialAvatar);

             const initialChatMessage = document.createElement('div');
             initialChatMessage.classList.add('chat-message', 'bot');
             initialChatMessage.innerHTML = '<p>Halo! Saya Mas Riski (via DeepSeek). Ada yang bisa saya bantu?</p>';
             initialMessageRow.appendChild(initialChatMessage);
             chatBox.appendChild(initialMessageRow);
        }

        if (currentChat && currentChat.messages) {
            currentChat.messages.forEach(msg => {
                addMessageToDOM(msg.content, msg.sender, msg.type, msg.filePreview, msg.fileObject, msg.aiImageURL, msg.timestamp); 
            });
        }
    }

    function startNewChat() {
        const newChatId = `chat-${Date.now()}`;
        const newChat = {
            id: newChatId,
            title: 'Chat Baru',
            messages: []
        };
        chats.unshift(newChat);
        currentChatId = newChatId;
        userInput.value = '';
        clearFilePreview();
        renderChatBox();
        renderHistory();
        saveChats();
    }

    function addMessageToData(content, sender, type = 'text', filePreview = null, fileObject = null, aiImageURL = null, timestamp = null) {
        let currentChat = chats.find(c => c.id === currentChatId);
        if (!currentChat) {
            startNewChat();
            currentChat = chats.find(c => c.id === currentChatId);
        }
        
        currentChat.messages.push({
            sender,
            content,
            type,
            filePreview,
            fileObject,
            aiImageURL,
            timestamp: timestamp || new Date().toISOString()
        });

        if (currentChat.messages.length === 1) {
            currentChat.title = content ? (content.substring(0, 30) + (content.length > 30 ? '...' : '')) : (fileObject ? `File: ${fileObject.name.substring(0, 20)}...` : 'Chat Baru');
            renderHistory();
        }
        saveChats();
    }

    function clearFilePreview() {
        attachedFile = null;
        filePreviewContainer.innerHTML = '';
    }

    function renderFilePreview(fileData) {
        clearFilePreview();
        attachedFile = fileData;
        const previewWrapper = document.createElement('div');
        previewWrapper.className = 'file-preview-item';
        
        // DeepSeek belum support gambar, kita beri peringatan visual saja
        if (fileData.mimeType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = `data:${fileData.mimeType};base64,${fileData.base64}`;
            previewWrapper.appendChild(img);
        } else {
            previewWrapper.innerHTML = `<i class="fas fa-file-alt" style="font-size: 40px; color: #888;"></i><p style="margin:0 10px;">${fileData.name}</p>`;
        }
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-file-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = clearFilePreview;
        previewWrapper.appendChild(removeBtn);
        filePreviewContainer.appendChild(previewWrapper);
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) { 
            alert("Ukuran file terlalu besar! Maksimal 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            renderFilePreview({
                name: file.name,
                mimeType: file.type,
                base64: base64String
            });
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    }

    // --- FUNGSI UTILS ---
    const youtubeApiKey = 'AIzaSyC6Fl1VhgNkqlPr3nN17XRBzFv6ZHptiBw'; 

    async function getYouTubeVideoDetails(videoId) {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`);
            if (!response.ok) return null;
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const snippet = data.items[0].snippet;
                return {
                    title: snippet.title,
                    description: snippet.description
                };
            }
            return null;
        } catch (error) {
            console.error("YouTube Error:", error);
            return null;
        }
    }

    function embedYouTubeLinks(text) {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?/g;
        return text.replace(youtubeRegex, (match, videoId) => {
            return `<div class="youtube-embed-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
        });
    }

    function addMessageToDOM(message, sender, type = 'text', filePreviewUrl = null, fileObject = null, aiImageURL = null, timestamp = null) {
        const messageRow = document.createElement('div');
        messageRow.classList.add('message-row', sender);

        const avatar = document.createElement('img');
        avatar.src = sender === 'bot' ? 'anim.gif' : 'user.gif';
        avatar.alt = sender + ' Avatar';
        avatar.classList.add('avatar');
        messageRow.appendChild(avatar);

        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message', sender);

        let contentHTML = '';
        if (filePreviewUrl && sender === 'user') {
            let isImage = fileObject ? fileObject.mimeType.startsWith('image/') : filePreviewUrl.startsWith('data:image/');
            if (isImage) {
                contentHTML += `<div class="sent-file-preview"><img src="${filePreviewUrl}" alt="Pratinjau Gambar"></div>`;
            } else {
                const fileName = fileObject ? fileObject.name : 'Dokumen';
                contentHTML += `<div class="sent-file-preview-doc"><i class="fas fa-file-alt"></i><span>${fileName}</span></div>`;
            }
        }
        if (aiImageURL && sender === 'bot') {
            contentHTML += `<div class="ai-image-response"><img src="${aiImageURL}" alt="Gambar dari AI"></div>`;
        }
        if (message) {
            const processedMessage = embedYouTubeLinks(message);
            if (typeof marked !== 'undefined') {
                contentHTML += marked.parse(processedMessage);
            } else {
                contentHTML += `<p>${processedMessage}</p>`;
            }
        }

        chatMessage.innerHTML = contentHTML;

        const timeStamp = document.createElement('span');
        const messageDate = timestamp ? new Date(timestamp) : new Date();
        timeStamp.classList.add('message-time');
        timeStamp.textContent = messageDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        chatMessage.appendChild(timeStamp);

        messageRow.appendChild(chatMessage);
        chatBox.appendChild(messageRow);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // --- FUNGSI UTAMA AI (DEEPSEEK) ---

    async function getAIResponse(messages) { 
        try {
            // DeepSeek kompatibel dengan format OpenAI
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    "model": "deepseek-chat", // Menggunakan DeepSeek-V3
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                    "stream": false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("DeepSeek API Error:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content.trim();
            }
            return "DeepSeek tidak memberikan respons.";
        } catch (error) {
            console.error("Error fetching AI response:", error);
            return "Waduh, koneksi ke DeepSeek gagal nih. Cek API Key atau internetmu.";
        }
    }

    async function handleSend() {
        const userMessage = userInput.value.trim();
        if (userMessage === '' && !attachedFile) return;

        if (currentChatId === null) startNewChat();
        
        const filePreviewForDOM = attachedFile ? `data:${attachedFile.mimeType};base64,${attachedFile.base64}` : null;
        const userTimestamp = new Date().toISOString();

        // 1. Tampilkan pesan user di layar
        addMessageToData(userMessage, 'user', 'text', filePreviewForDOM, attachedFile, null, userTimestamp);
        addMessageToDOM(userMessage, 'user', 'text', filePreviewForDOM, attachedFile, null, userTimestamp);

        userInput.value = '';
        clearFilePreview();

        // 2. CEK FILE: DeepSeek Tidak Support Gambar
        if (attachedFile && attachedFile.mimeType.startsWith('image/')) {
            const warningMessage = "Maaf, DeepSeek AI saat ini hanya bisa memproses teks. Saya belum bisa melihat gambar.";
            const t = new Date().toISOString();
            // Jeda sedikit biar terasa natural
            setTimeout(() => {
                addMessageToData(warningMessage, 'bot', 'text', null, null, null, t);
                addMessageToDOM(warningMessage, 'bot', 'text', null, null, null, t);
            }, 500);
            return; // Hentikan proses, jangan kirim ke API
        }

        // 3. Loading...
        const thinkingMessage = "DeepSeek lagi mikir...";
        addMessageToDOM(thinkingMessage, 'bot');

        // 4. Persiapkan History
        const currentChat = chats.find(c => c.id === currentChatId);
        const conversationHistoryForAPI = [];

        // System Prompt (Persona)
        let systemContent = '';
        if (currentModel === 'gen-z') {
            systemContent = `Kamu adalah Riski, teman AI Gen Z dari Indonesia. Gunakan bahasa gaul Indonesia yang santai (seperti 'literally', 'bestie', 'jujurly', 'wkwk'). Jadilah sangat membantu tapi tetap asik. Jangan terlalu kaku.`;
        } else {
            systemContent = `Anda adalah Mas Riski, asisten AI yang sopan, ramah, dan membantu dalam Bahasa Indonesia yang baik dan jelas.`;
        }
        
        conversationHistoryForAPI.push({ "role": "system", "content": systemContent });

        const MAX_HISTORY_MESSAGES = 10;
        const messagesToSend = currentChat && currentChat.messages ? currentChat.messages.slice(-MAX_HISTORY_MESSAGES) : [];

        // Loop pesan untuk format API
        for (const msg of messagesToSend) {
            let role = msg.sender === 'user' ? 'user' : 'assistant';
            let content = msg.content || "";

            // Lewati pesan yang berisi gambar (karena DeepSeek text-only)
            if (msg.fileObject && msg.fileObject.mimeType.startsWith('image/')) {
                continue; 
            }

            // Cek YouTube Links (Context Injection)
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/g;
            const matches = [...content.matchAll(youtubeRegex)];
            for (const match of matches) {
                const videoDetails = await getYouTubeVideoDetails(match[1]);
                if (videoDetails) {
                    content += `\n[Context: Video YouTube berjudul "${videoDetails.title}"]`;
                }
            }

            conversationHistoryForAPI.push({
                "role": role,
                "content": content
            });
        }

        // 5. Kirim ke DeepSeek
        const aiRawResponse = await getAIResponse(conversationHistoryForAPI);

        // 6. Hapus Loading
        if (chatBox.lastChild && chatBox.lastChild.textContent.includes(thinkingMessage)) {
            chatBox.removeChild(chatBox.lastChild);
        }

        // 7. Tampilkan Respon
        let finalAIMessage = aiRawResponse;
        let aiImageURL = null;
        
        // Cek pola gambar placeholder (jika diminta user)
        const imagePattern = /\[GAMBAR:\s*(https?:\/\/[^\s\]]+)\]/i;
        const match = aiRawResponse.match(imagePattern);
        if (match && match[1]) {
            aiImageURL = match[1];
            finalAIMessage = aiRawResponse.replace(imagePattern, '').trim();
        }
        
        const aiTimestamp = new Date().toISOString();
        addMessageToData(finalAIMessage, 'bot', 'text', null, null, aiImageURL, aiTimestamp);
        addMessageToDOM(finalAIMessage, 'bot', 'text', null, null, aiImageURL, aiTimestamp);
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
    newChatBtn.addEventListener('click', startNewChat);
    
    // Tombol Upload tetap ada, tapi nanti diblokir di handleSend jika gambar
    uploadDocBtn.addEventListener('click', () => docInput.click()); 
    uploadImgBtn.addEventListener('click', () => imageInput.click());
    
    imageInput.addEventListener('change', handleFileSelect);
    docInput.addEventListener('change', handleFileSelect);

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Yakin hapus riwayat?")) {
            chats = [];
            localStorage.removeItem('ai-chat-history');
            currentChatId = null;
            startNewChat();
        }
    });

    if(aiModelSelect) {
        aiModelSelect.addEventListener('change', (e) => {
            currentModel = e.target.value;
        });
    }

    // --- Init ---
    loadChats();
    renderHistory();
    renderChatBox();
});
