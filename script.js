// script.js (Lengkap dengan Perbaikan Kritis)

document.addEventListener('DOMContentLoaded', () => {

    // --- Elemen DOM ---
    const sendButton = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const historyList = document.getElementById('history-list');
    const newChatBtn = document.getElementById('new-chat-btn');
    const uploadDocBtn = document.getElementById('upload-doc-btn');
    const uploadImgBtn = document.getElementById('upload-img-btn');
    const imageInput = document.getElementById('image-input');
    const docInput = document.getElementById('doc-input');
    const filePreviewContainer = document.getElementById('file-preview-container');

    // --- Pengaturan API ---
    const apiKey = 'AIzaSyBco_NWz7SagOZ2YMC7CyFXUMg0e_yajv4'; // PASTIKAN INI API KEY ANDA YANG VALID
    const model = 'gemini-1.5-flash';
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // --- State Management ---
    let chats = [];
    let currentChatId = null;
    let attachedFile = null;

    // --- Fungsi Pengelola Riwayat ---
    function loadChats() { const savedChats = localStorage.getItem('ai-chat-history'); if (savedChats) { chats = JSON.parse(savedChats); } if (chats.length > 0) { currentChatId = chats[0].id; } else { startNewChat(); } }
    function saveChats() { localStorage.setItem('ai-chat-history', JSON.stringify(chats)); }
    function renderHistory() { historyList.innerHTML = ''; if (chats.length === 0) { historyList.innerHTML = '<li><a href="#" class="disabled">Tidak ada riwayat</a></li>'; } else { chats.forEach(chat => { const li = document.createElement('li'); const a = document.createElement('a'); a.href = '#'; a.innerHTML = `<i class="far fa-comment-dots"></i> ${chat.title}`; a.dataset.chatId = chat.id; if (chat.id === currentChatId) { a.classList.add('active'); } a.addEventListener('click', (e) => { e.preventDefault(); currentChatId = chat.id; renderChatBox(); renderHistory(); }); li.appendChild(a); historyList.appendChild(li); }); } }
    function renderChatBox() { chatBox.innerHTML = ''; const currentChat = chats.find(c => c.id === currentChatId); if (currentChat && currentChat.messages) { currentChat.messages.forEach(msg => { addMessageToDOM(msg.content, msg.sender, msg.type, msg.filePreview); }); } }
    function startNewChat() { currentChatId = null; userInput.value = ''; clearFilePreview(); renderChatBox(); renderHistory(); }
    function addMessageToData(content, sender, type = 'text', filePreview = null) { let currentChat = chats.find(c => c.id === currentChatId); if (!currentChat) return; currentChat.messages.push({ sender, content, type, filePreview }); saveChats(); }
    function clearFilePreview() { attachedFile = null; filePreviewContainer.innerHTML = ''; }
    function renderFilePreview(fileData) { clearFilePreview(); attachedFile = fileData; const previewWrapper = document.createElement('div'); previewWrapper.className = 'file-preview-item'; if (fileData.mimeType.startsWith('image/')) { const img = document.createElement('img'); img.src = `data:${fileData.mimeType};base64,${fileData.base64}`; previewWrapper.appendChild(img); } else { previewWrapper.innerHTML = `<i class="fas fa-file-alt" style="font-size: 40px; color: #888;"></i><p style="margin:0 10px;">${fileData.name}</p>`; } const removeBtn = document.createElement('button'); removeBtn.className = 'remove-file-btn'; removeBtn.innerHTML = '×'; removeBtn.onclick = clearFilePreview; previewWrapper.appendChild(removeBtn); filePreviewContainer.appendChild(previewWrapper); }
    function handleFileSelect(event) { const file = event.target.files[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { alert("Ukuran file terlalu besar! Maksimal 5MB."); return; } const reader = new FileReader(); reader.onloadend = () => { const base64String = reader.result.split(',')[1]; renderFilePreview({ name: file.name, mimeType: file.type, base64: base64String }); }; reader.readAsDataURL(file); event.target.value = ''; }
    
    // --- FUNGSI BARU DAN FUNGSI YANG DIPERBARUI ---

    function embedYouTubeLinks(text) {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})(?:\S+)?/g;
        return text.replace(youtubeRegex, (match, videoId) => {
            return `<div class="youtube-embed-wrapper"><iframe src="https://www.youtube.com/embed/$${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        });
    }

    /**
     * FUNGSI DIPERBAIKI: `addMessageToDOM` sekarang sudah benar.
     */
    function addMessageToDOM(message, sender, type = 'text', filePreviewUrl = null, fileObject = null) {
    const messageRow = document.createElement('div');
    messageRow.classList.add('message-row', sender);

    // Menambahkan avatar untuk BOT atau USER
    const avatar = document.createElement('img');
    if (sender === 'bot') {
        avatar.src = 'anim.gif'; // Avatar untuk AI
        avatar.alt = 'AI Avatar';
    } else {
        avatar.src = 'user.gif'; // GANTI dengan path ke gambar avatar pengguna Anda
        avatar.alt = 'User Avatar';
    }
    avatar.classList.add('avatar');
    messageRow.appendChild(avatar);
    
    const chatMessage = document.createElement('div');
    chatMessage.classList.add('chat-message', sender);
    
    let contentHTML = '';

    // Logika baru untuk menampilkan pratinjau file
    if (filePreviewUrl) {
        let isImage = false;
        // Cek tipe file jika informasi file lengkap tersedia (saat baru dikirim)
        if (fileObject) { 
           isImage = fileObject.mimeType.startsWith('image/');
        // Jika tidak, tebak dari URL (saat memuat dari riwayat)
        } else { 
           isImage = filePreviewUrl.startsWith('data:image/');
        }

        if (isImage) {
            // Jika file adalah gambar, tampilkan gambar
            contentHTML += `<div class="sent-file-preview"><img src="${filePreviewUrl}" alt="Pratinjau Gambar"></div>`;
        } else {
            // Jika bukan gambar, tampilkan ikon dan nama file
            const fileName = fileObject ? fileObject.name : 'Dokumen';
            contentHTML += `<div class="sent-file-preview-doc"><i class="fas fa-file-alt"></i><span>${fileName}</span></div>`;
        }
    }

    // Menambahkan teks pesan
    if (message) {
        const processedMessage = embedYouTubeLinks(message);
        contentHTML += marked.parse(processedMessage);
    }
    
    chatMessage.innerHTML = contentHTML;
    
    messageRow.appendChild(chatMessage);
    
    chatBox.appendChild(messageRow);
    chatBox.scrollTop = chatBox.scrollHeight;
}

    async function getAIResponse(parts) { try { const response = await fetch(apiURL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ "contents": [{ "parts": parts }] }) }); if (!response.ok) { const errorData = await response.json(); console.error("API Error Response:", errorData); throw new Error(`HTTP error! status: ${response.status}`); } const data = await response.json(); if (data.candidates && data.candidates.length > 0) { if (data.candidates[0].content.parts[0].text) { return data.candidates[0].content.parts[0].text.trim(); } } return "Maaf, saya tidak dapat memberikan respons yang valid."; } catch (error) { console.error("Error fetching AI response:", error); return "Waduh, sorry banget, bestie. Gagal nyambung nih, servernya lagi rewel."; } }
    
    async function handleSend() {
        const userMessage = userInput.value.trim();
        if (userMessage === '' && !attachedFile) return;

        if (currentChatId === null) {
            currentChatId = `chat-${Date.now()}`;
            const title = userMessage ? (userMessage.substring(0, 30) + '...') : (attachedFile ? `File: ${attachedFile.name}` : 'Chat Baru');
            const newChat = { id: currentChatId, title: title, messages: [] };
            chats.unshift(newChat);
            renderHistory();
        }

        const filePreviewForDOM = attachedFile ? `data:${attachedFile.mimeType};base64,${attachedFile.base64}` : null;
       addMessageToDOM(userMessage, 'user', 'text', filePreviewForDOM, attachedFile); 
        addMessageToData(userMessage, 'user', 'text', filePreviewForDOM);
        
        const parts = [];
        let personaPrompt = `React as Riski, your AI bestie. Your personality is super chill, helpful, and you talk like a true Gen Z from Indonesia. Use casual Indonesian and mix in some English slang (e.g., 'literally', 'spill', 'no cap', 'YGY', 'bestie'). Use emojis.`;

        if (attachedFile && userMessage) {
            personaPrompt += ` The user uploaded a file and asked: "${userMessage}". Answer based on the file. Gaskeun!`;
        } else if (attachedFile) {
            personaPrompt += ` The user just uploaded this file. Describe it or say something cool about it in your style. Spill the tea!`;
        } else {
            personaPrompt += ` Answer the user's question: "${userMessage}". Gaskeun!`;
        }
        
        parts.push({ "text": personaPrompt });

        if (attachedFile) {
            parts.push({
                "inline_data": {
                    "mime_type": attachedFile.mimeType,
                    "data": attachedFile.base64
                }
            });
        }

        userInput.value = '';
        clearFilePreview();
        
        addMessageToDOM("lagi mikir bentar...", 'bot');
        const aiMessage = await getAIResponse(parts);

        chatBox.removeChild(chatBox.lastChild);
        addMessageToDOM(aiMessage, 'bot');
        addMessageToData(aiMessage, 'bot');
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
    newChatBtn.addEventListener('click', startNewChat);
    uploadDocBtn.addEventListener('click', () => docInput.click());
    uploadImgBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleFileSelect);
    docInput.addEventListener('change', handleFileSelect);

    // --- Inisialisasi Aplikasi ---
    loadChats();
    renderHistory();
    renderChatBox();
});
