// script.js (Versi Groq AI - Tanpa Login)
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

    // --- PENGATURAN API GROQ ---
    // !!! PENTING: Ganti dengan API Key Groq Anda dari console.groq.com !!!
    const apiKey = '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'; 

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
             initialAvatar.src = 'anim.gif'; // Pastikan file ini ada
             initialAvatar.alt = 'AI Avatar';
             initialAvatar.classList.add('avatar');
             initialMessageRow.appendChild(initialAvatar);

             const initialChatMessage = document.createElement('div');
             initialChatMessage.classList.add('chat-message', 'bot');
             initialChatMessage.innerHTML = '<p>Halo! Saya Mas Riski (via Groq AI). Mau ngobrol apa hari ini?</p>';
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
        
        // Validasi Ukuran File (Max 4MB untuk Base64 aman)
        if (file.size > 4 * 1024 * 1024) { 
            alert("Ukuran file terlalu besar! Maksimal 4MB untuk Groq Vision.");
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
    const youtubeApiKey = 'AIzaSyC6Fl1VhgNkqlPr3nN17XRBzFv6ZHptiBw'; // Biarkan YouTube API Key tetap

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

    // --- FUNGSI UTAMA AI (GROQ) ---

    async function getAIResponse(messages, hasImage = false) { 
        let modelToUse;

        // Logika Pemilihan Model Groq
        if (hasImage) {
            // Jika ada gambar, WAJIB pakai model Vision
            modelToUse = 'llama-3.2-90b-vision-preview'; 
        } else {
            // Jika teks saja, sesuaikan dengan pilihan user
            if (currentModel === 'gen-z') {
                modelToUse = 'llama-3.3-70b-versatile'; // Model paling seimbang & pintar
            } else if (currentModel === 'normal') {
                modelToUse = 'llama3-8b-8192'; // Sangat cepat
            } else {
                modelToUse = 'llama-3.3-70b-versatile';
            }
        }

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}` // Menggunakan Bearer Token untuk Groq
                },
                body: JSON.stringify({
                    "messages": messages,
                    "model": modelToUse,
                    "temperature": 0.7,
                    "max_tokens": 1024
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Groq API Error:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content.trim();
            }
            return "Maaf, tidak ada respons dari Groq.";
        } catch (error) {
            console.error("Error fetching AI response:", error);
            return "Waduh, koneksi ke Groq gagal nih. Cek API Key atau koneksi internetmu.";
        }
    }

    async function handleSend() {
        const userMessage = userInput.value.trim();
        if (userMessage === '' && !attachedFile) return;

        if (currentChatId === null) startNewChat();
        
        const filePreviewForDOM = attachedFile ? `data:${attachedFile.mimeType};base64,${attachedFile.base64}` : null;
        const userTimestamp = new Date().toISOString();

        // 1. Tampilkan pesan user
        addMessageToData(userMessage, 'user', 'text', filePreviewForDOM, attachedFile, null, userTimestamp);
        addMessageToDOM(userMessage, 'user', 'text', filePreviewForDOM, attachedFile, null, userTimestamp);

        userInput.value = '';
        clearFilePreview();

        // 2. Loading...
        const thinkingMessage = "Lagi mikir bentar...";
        addMessageToDOM(thinkingMessage, 'bot');

        // 3. Persiapkan History untuk API Groq
        const currentChat = chats.find(c => c.id === currentChatId);
        const conversationHistoryForAPI = [];

        // System Prompt (Persona)
        let systemContent = '';
        if (currentModel === 'gen-z') {
            systemContent = `You are Riski, a Gen Z AI assistant from Indonesia. Speak Indonesian with slang like 'literally', 'bestie', 'jujurly'. Be helpful but super chill.`;
        } else {
            systemContent = `You are Mas Riski, a helpful and polite Indonesian AI assistant.`;
        }
        
        conversationHistoryForAPI.push({ "role": "system", "content": systemContent });

        const MAX_HISTORY_MESSAGES = 6; // Jangan terlalu banyak agar tidak boros token
        const messagesToSend = currentChat && currentChat.messages ? currentChat.messages.slice(-MAX_HISTORY_MESSAGES) : [];

        let isImagePresentInRequest = false;

        // Loop pesan untuk format Groq/OpenAI
        for (const msg of messagesToSend) {
            let role = msg.sender === 'user' ? 'user' : 'assistant';
            let content = msg.content || "";

            // Cek YouTube Links
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})/g;
            const matches = [...content.matchAll(youtubeRegex)];
            for (const match of matches) {
                const videoDetails = await getYouTubeVideoDetails(match[1]);
                if (videoDetails) {
                    content += `\n[Context: Video YouTube berjudul "${videoDetails.title}"]`;
                }
            }

            if (msg.fileObject && msg.fileObject.mimeType.startsWith('image/')) {
                // Format Vision untuk Groq (Llama 3.2 Vision)
                isImagePresentInRequest = true;
                conversationHistoryForAPI.push({
                    "role": role,
                    "content": [
                        { "type": "text", "text": content },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": `data:${msg.fileObject.mimeType};base64,${msg.fileObject.base64}`
                            }
                        }
                    ]
                });
            } else {
                // Format Teks Biasa
                conversationHistoryForAPI.push({
                    "role": role,
                    "content": content
                });
            }
        }

        // 4. Kirim ke Groq
        const aiRawResponse = await getAIResponse(conversationHistoryForAPI, isImagePresentInRequest);

        // 5. Hapus Loading
        if (chatBox.lastChild && chatBox.lastChild.textContent.includes(thinkingMessage)) {
            chatBox.removeChild(chatBox.lastChild);
        }
        
        // Cek permintaan edit foto (tetap hardcoded karena LLM tidak bisa edit pixel)
        if (userMessage.toLowerCase().includes('edit foto')) {
             const staticMessage = "Sorry bestie, aku belum bisa edit pixel foto langsung. Cuma bisa analisis isinya aja!";
             const t = new Date().toISOString();
             addMessageToData(staticMessage, 'bot', 'text', null, null, null, t);
             addMessageToDOM(staticMessage, 'bot', 'text', null, null, null, t);
             return; 
        }

        // 6. Tampilkan Respon
        let finalAIMessage = aiRawResponse;
        let aiImageURL = null;
        // Cek apakah ada pola gambar (jika Groq disuruh generate link placeholder)
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
    uploadDocBtn.addEventListener('click', () => docInput.click()); // Dokumen mungkin tidak terbaca oleh Llama Vision
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
