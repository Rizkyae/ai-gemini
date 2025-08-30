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

    // --- Pengaturan API ---
    // PASTIKAN INI API KEY GEMINI ANDA YANG VALID. JANGAN MEMBAGIKAN KEY INI SECARA PUBLIK.
    const apiKey = 'AIzaSyBco_NWz7SagOZ2YMC7CyFXUMg0e_yajv4'; 
    let currentModel = aiModelSelect.value; 

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
             initialChatMessage.innerHTML = '<p>Halo! Saya Mas Riski. Anda bisa bertanya atau mengirimkan file kepada saya.</p>';
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

    function addMessageToData(content, sender, type = 'text', filePreview = null, fileObject = null, aiImageURL = null) {
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
            timestamp: new Date().toISOString()
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
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("Ukuran file terlalu besar! Maksimal 5MB.");
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

    // --- FUNGSI BARU DAN FUNGSI YANG DIPERBARUI ---

    const youtubeApiKey = 'AIzaSyC6Fl1VhgNkqlPr3nN17XRBzFv6ZHptiBw'; 

    async function getYouTubeVideoDetails(videoId) {
        try {
            const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`);
            if (!response.ok) {
                const errorData = await response.json();
                console.error("YouTube API Error Response:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const snippet = data.items[0].snippet;
                return {
                    title: snippet.title,
                    description: snippet.description,
                    tags: snippet.tags
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching YouTube video details:", error);
            return null;
        }
    }

    function embedYouTubeLinks(text) {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?/g;
        return text.replace(youtubeRegex, (match, videoId) => {
            return `<div class="youtube-embed-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        });
    }

    /**
     * FUNGSI DIPERBAIKI: `addMessageToDOM` sekarang sudah benar dan dapat menampilkan gambar AI.
     */
    function addMessageToDOM(message, sender, type = 'text', filePreviewUrl = null, fileObject = null, aiImageURL = null, timestamp = null) {
        const messageRow = document.createElement('div');
        messageRow.classList.add('message-row', sender);

        const avatar = document.createElement('img');
        if (sender === 'bot') {
            avatar.src = 'anim.gif';
            avatar.alt = 'AI Avatar';
        } else {
            avatar.src = 'user.gif';
            avatar.alt = 'User Avatar';
        }
        avatar.classList.add('avatar');
        messageRow.appendChild(avatar);

        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message', sender);

        let contentHTML = '';

        // Logika untuk menampilkan pratinjau file yang dikirim oleh USER
        if (filePreviewUrl && sender === 'user') { // Hanya tampilkan file preview untuk pengirim user
            let isImage = false;
            if (fileObject) {
                isImage = fileObject.mimeType.startsWith('image/');
            } else {
                isImage = filePreviewUrl.startsWith('data:image/');
            }

            if (isImage) {
                contentHTML += `<div class="sent-file-preview"><img src="${filePreviewUrl}" alt="Pratinjau Gambar"></div>`;
            } else {
                const fileName = fileObject ? fileObject.name : 'Dokumen';
                contentHTML += `<div class="sent-file-preview-doc"><i class="fas fa-file-alt"></i><span>${fileName}</span></div>`;
            }
        }

        // Logika untuk menampilkan gambar yang dikirim oleh AI
        if (aiImageURL && sender === 'bot') {
            contentHTML += `<div class="ai-image-response"><img src="${aiImageURL}" alt="Gambar dari AI"></div>`;
        }

        // Menambahkan teks pesan (pastikan ini di bawah gambar jika ada)
        if (message) {
            const processedMessage = embedYouTubeLinks(message);
            contentHTML += marked.parse(processedMessage);
        }

        chatMessage.innerHTML = contentHTML;

        // Menambahkan timestamp
        const timeStamp = document.createElement('span');
        const messageDate = timestamp ? new Date(timestamp) : new Date();
        timeStamp.classList.add('message-time');
        timeStamp.textContent = messageDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        chatMessage.appendChild(timeStamp);

        messageRow.appendChild(chatMessage);
        chatBox.appendChild(messageRow);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function getAIResponse(conversationParts) { 
        let modelToUse;
        if (currentModel === 'gen-z') {
            modelToUse = 'gemini-1.5-flash'; // Menggunakan flash untuk kecepatan
            console.log("Menggunakan model untuk Gen Z:", modelToUse);
        } else if (currentModel === 'normal') {
            modelToUse = 'gemini-2.5-flash';
            console.log("Menggunakan model untuk Normal AI:", modelToUse);
        } else {
            modelToUse = 'gemini-pro';
            console.log("Menggunakan model default:", modelToUse);
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "contents": conversationParts 
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Response:", errorData);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                if (data.candidates[0].content.parts[0].text) {
                    return data.candidates[0].content.parts[0].text.trim();
                }
            }
            return "Maaf, saya tidak dapat memberikan respons yang valid.";
        } catch (error) {
            console.error("Error fetching AI response:", error);
            return "Waduh, sorry banget bro. Gagal nyambung nih, coba ganti model AI";
        }
    }

    async function handleSend() {
        const userMessage = userInput.value.trim();
        if (userMessage === '' && !attachedFile) return;

        if (currentChatId === null) {
            startNewChat();
        }
        
        const filePreviewForDOM = attachedFile ? `data:${attachedFile.mimeType};base64,${attachedFile.base64}` : null;
        addMessageToData(userMessage, 'user', 'text', filePreviewForDOM, attachedFile);

        userInput.value = '';
        clearFilePreview();

        addMessageToDOM("lagi mikir bentar...", 'bot');

        const currentChat = chats.find(c => c.id === currentChatId);
        const conversationHistoryForAPI = [];

        let personaPrompt = '';
        console.log("Current Model Selected:", currentModel);
        if (currentModel === 'gen-z') {
            personaPrompt = `React as Riski, your AI bestie. Your personality is super chill, helpful, and you talk like a true Gen Z from Indonesia. Use casual Indonesian and mix in English slang (e.g., 'literally', 'spill', 'no cap', 'YGY', 'bestie'). Use emojis. Always keep the previous conversation in mind. Jika diminta 'berikan gambar', respons dengan teks dan URL gambar placeholder, contohnya: 'Nih, bestie, ada gambar bagus buat kamu! [GAMBAR: https://placehold.co/400x300.png?text=Contoh+Gambar+AI]'.`;
        } else if (currentModel === 'normal') {
            personaPrompt = `You are Mas Riski, a helpful and friendly AI assistant. Respond in clear, concise, and polite Indonesian. Be polite, formal where appropriate, and do not use slang or emojis unless explicitly asked. Always keep the previous conversation in mind. Jika diminta 'berikan gambar', respons dengan teks dan URL gambar placeholder, contohnya: 'Baik, ini adalah contoh gambar yang saya temukan: [GAMBAR: https://placehold.co/400x300.png?text=Contoh+Gambar+AI]'.`;
        }
        console.log("Persona Prompt Generated:", personaPrompt);
        
        if (personaPrompt) {
            conversationHistoryForAPI.push({
                "role": "user",
                "parts": [{ "text": personaPrompt }]
            });
        }

        const MAX_HISTORY_MESSAGES = 10;
        const messagesToSend = currentChat && currentChat.messages ? currentChat.messages.slice(-MAX_HISTORY_MESSAGES) : [];

        for (const msg of messagesToSend) {
            const contentParts = [];
            let processedText = msg.content; 

            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?/g;
            const matches = [...(msg.content || '').matchAll(youtubeRegex)]; 

            if (matches.length > 0) {
                for (const match of matches) {
                    const videoId = match[1];
                    const videoDetails = await getYouTubeVideoDetails(videoId); 
                    if (videoDetails) {
                        processedText = (processedText || '') + `\n\n[INFO VIDEO YOUTUBE: Judul: "${videoDetails.title}", Deskripsi: "${videoDetails.description ? videoDetails.description.substring(0, Math.min(videoDetails.description.length, 100)) + '...' : 'Tidak ada deskripsi.'}"]`;
                    }
                }
            }

            if (processedText) {
                contentParts.push({ "text": processedText });
            }
            if (msg.fileObject) {
                contentParts.push({
                    "inline_data": {
                        "mime_type": msg.fileObject.mimeType,
                        "data": msg.fileObject.base64
                    }
                });
            }
            
            if (contentParts.length > 0) {
                conversationHistoryForAPI.push({
                    "role": msg.sender === 'user' ? "user" : "model",
                    "parts": contentParts
                });
            }
        }

        const aiRawResponse = await getAIResponse(conversationHistoryForAPI);

        // Hapus pesan "lagi mikir bentar..."
        if (chatBox.lastChild && chatBox.lastChild.querySelector('.chat-message') && chatBox.lastChild.querySelector('.chat-message').textContent === "lagi mikir bentar...") {
            chatBox.removeChild(chatBox.lastChild);
        }
        
        // Cek lagi untuk kasus "edit foto" atau "ganti background" setelah mendapatkan respons AI
        if (userMessage.toLowerCase().includes('edit foto') || userMessage.toLowerCase().includes('ganti background')) {
             const staticMessage = "Wah bestie, aku belum bisa bantu edit-edit foto gitu. Aku cuma bisa bantuin ngobrol, kasih info, atau analisis gambar/dokumen aja. Kalau mau edit foto, coba pake aplikasi editing foto khusus ya! 🙏";
             addMessageToDOM(staticMessage, 'bot', 'text', null, null, null, new Date().toISOString());
             addMessageToData(staticMessage, 'bot');
             return; 
        }

        // --- Logika untuk mendeteksi dan menampilkan gambar dari respons AI ---
        let finalAIMessage = aiRawResponse;
        let aiImageURL = null;
        const imagePattern = /\[GAMBAR:\s*(https?:\/\/[^\s\]]+\.(?:png|jpe?g|gif|webp|svg))\]/i;
        const match = aiRawResponse.match(imagePattern);

        if (match && match[1]) {
            aiImageURL = match[1];
            // Hapus placeholder gambar dari teks pesan akhir
            finalAIMessage = aiRawResponse.replace(imagePattern, '').trim();
        }
        
        const now = new Date().toISOString();
        addMessageToDOM(finalAIMessage, 'bot', 'text', null, null, aiImageURL, now);
        addMessageToData(finalAIMessage, 'bot', 'text', null, null, aiImageURL);
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
    newChatBtn.addEventListener('click', startNewChat);
    uploadDocBtn.addEventListener('click', () => docInput.click());
    uploadImgBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleFileSelect);
    docInput.addEventListener('change', handleFileSelect);

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Apakah anda yakin ingin menghapus pesan ini?!")) {
            chats = [];
            localStorage.removeItem('ai-chat-history');
            currentChatId = null;
            startNewChat();
            console.log("Riwayat obrolan telah dihapus!");
        }
    });

    aiModelSelect.addEventListener('change', (e) => {
        currentModel = e.target.value;
        console.log(`Model AI diubah menjadi: ${currentModel}`);
    });

    // --- Inisialisasi Aplikasi ---
    loadChats();
    renderHistory();
    renderChatBox();
});
