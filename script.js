// script.js (VERSI TERBARU & TERKOREKSI)

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
    const aiModelSelect = document.getElementById('ai-model-select');

    // --- Pengaturan API ---
    // !!! PENTING: GANTI INI DENGAN API KEY GEMINI ANDA YANG VALID DAN LENGKAP !!!
    const apiKey = 'AIzaSyCRHGWVFSMxik8rH8J7Obi6dZSmu9fn72A'; // Contoh: 'AIzaSyC0dE_kEy_HeRe_FoR_ReAl_ApI'

    // currentModel adalah model Gemini API yang FIX, tidak berubah dari dropdown.
    let currentModel = 'gemini-2.5-flash'; // Gunakan model Gemini API yang tetap (bisa juga 'gemini-1.5-pro')

    // --- State Management ---
    let chats = [];
    let currentChatId = null;
    let attachedFile = null;
    // currentSelectedPersona diinisialisasi dari nilai default dropdown (misal: "gen-z")
    let currentSelectedPersona = aiModelSelect.value; 

    // Definisikan persona prompts (Pastikan kunci cocok dengan value di index.html Anda)
    const personaPrompts = {
        "gen-z": `React as Riski, your AI bestie. Your personality is super chill, helpful, and you talk like a true Gen Z from Indonesia. Use casual Indonesian and mix in English slang (e.g., 'literally', 'spill', 'no cap', 'YGY', 'bestie'). Use emojis. Always keep the previous conversation in mind.`,
        "normal": `You are a helpful and respectful AI assistant from Indonesia. Provide clear, concise, and polite answers. Avoid using slang or excessive emojis. Always keep the previous conversation in mind.`
    };

    // --- Fungsi Pengelola Riwayat ---
    function saveChats() {
        localStorage.setItem('ai-chat-history', JSON.stringify(chats));
    }

    function loadChats() {
        const savedChats = localStorage.getItem('ai-chat-history');
        if (savedChats) {
            chats = JSON.parse(savedChats);
            if (chats.length > 0) {
                currentChatId = chats[chats.length - 1].id;
                renderChatBox();
            }
        }
        renderHistory();
    }

    function startNewChat() {
        const newChatObject = { id: Date.now().toString(), messages: [] };
        currentChatId = newChatObject.id;
        chats.push(newChatObject);
        saveChats();
        renderHistory();
        renderChatBox(); // Bersihkan chatBox dan tampilkan chat baru
        chatBox.innerHTML = `
            <div class="message-row bot">
                <img src="anim.gif" alt="AI Avatar" class="avatar">
                <div class="chat-message bot">
                    <p>Halo! Saya Mas Riski. Anda bisa bertanya atau mengirimkan file kepada saya.</p>
                </div>
            </div>
        `; // Pesan pembuka untuk chat baru
        clearFilePreview();
        return newChatObject; // Mengembalikan objek chat yang baru dibuat
    }

    function renderHistory() {
        historyList.innerHTML = '';
        chats.forEach(chat => {
            const listItem = document.createElement('li');
            listItem.textContent = chat.messages[0]?.text.substring(0, 30) + '...' || `Chat ${chat.id.substring(8)}`;
            listItem.dataset.chatId = chat.id;
            if (chat.id === currentChatId) {
                listItem.classList.add('active');
            }
            listItem.addEventListener('click', () => {
                currentChatId = chat.id;
                renderChatBox();
                renderHistory(); // Perbarui tampilan aktif
            });
            historyList.appendChild(listItem);
        });
    }

    function renderChatBox() {
        chatBox.innerHTML = ''; // Kosongkan chatbox
        if (!currentChatId) {
            return; // Tidak ada chat yang dipilih, biarkan kosong
        }

        const currentChat = chats.find(c => c.id === currentChatId);
        if (currentChat) {
            currentChat.messages.forEach(message => {
                // Jangan render pesan persona prompt atau pesan loading di riwayat
                if (message.text !== (personaPrompts[currentSelectedPersona] || personaPrompts["normal"]) && 
                    message.text !== "lagi mikir bentar...") {
                    addMessageToDOM(message.text, message.sender, message.type, message.filePreview, message.fileData, false);
                }
            });
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // --- Fungsi Utilitas UI ---
    function addMessageToDOM(text, sender, type = 'text', filePreview = null, fileData = null, animate = true) {
        const messageRow = document.createElement('div');
        messageRow.classList.add('message-row', sender);

        const avatar = document.createElement('img');
        avatar.classList.add('avatar');
        avatar.src = sender === 'user' ? 'anim.gif' : 'anim.gif'; // Ganti dengan avatar user jika ada
        avatar.alt = sender === 'user' ? 'User Avatar' : 'AI Avatar';

        const messageContent = document.createElement('div');
        messageContent.classList.add('chat-message', sender);

        if (filePreview && type === 'image') {
            const img = document.createElement('img');
            img.src = filePreview;
            img.classList.add('uploaded-image-preview');
            messageContent.appendChild(img);
        }

        if (type === 'document' && fileData) {
            const docLink = document.createElement('a');
            docLink.href = filePreview; // Base64 URL atau Blob URL
            docLink.download = fileData.fileName || 'document';
            docLink.textContent = `Unduh Dokumen: ${fileData.fileName || 'file'}`;
            docLink.classList.add('document-link');
            messageContent.appendChild(docLink);
        }

        const textNode = document.createElement('p');
        if (sender === 'bot' && typeof marked !== 'undefined') {
            textNode.innerHTML = marked.parse(text);
        } else {
            textNode.textContent = text;
        }
        messageContent.appendChild(textNode);

        if (sender === 'user') {
            messageRow.appendChild(avatar);
            messageRow.appendChild(messageContent);
        } else {
            messageRow.appendChild(avatar);
            messageRow.appendChild(messageContent);
        }

        chatBox.appendChild(messageRow);
        chatBox.scrollTop = chatBox.scrollHeight;

        if (animate) {
            messageRow.style.opacity = 0;
            messageRow.style.transform = 'translateY(20px)';
            setTimeout(() => {
                messageRow.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                messageRow.style.opacity = 1;
                messageRow.style.transform = 'translateY(0)';
            }, 50);
        }
        return messageRow; // Mengembalikan elemen yang baru dibuat
    }

    function addMessageToData(text, sender, type = 'text', filePreview = null, fileData = null) {
        const currentChat = chats.find(c => c.id === currentChatId);
        if (currentChat) {
            currentChat.messages.push({ text, sender, type, filePreview, fileData });
            saveChats();
        }
    }

    function clearFilePreview() {
        filePreviewContainer.innerHTML = '';
        attachedFile = null;
    }

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1];
                attachedFile = {
                    fileName: file.name,
                    mimeType: file.type,
                    base64: base64
                };
                displayFilePreview(file.name, file.type, e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    function displayFilePreview(fileName, mimeType, fileUrl) {
        filePreviewContainer.innerHTML = '';
        const previewElement = document.createElement('div');
        previewElement.classList.add('file-preview');

        if (mimeType.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = fileUrl;
            previewElement.appendChild(img);
        } else {
            const icon = document.createElement('i');
            icon.classList.add('fas', 'fa-file-alt');
            previewElement.appendChild(icon);
        }

        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = fileName;
        previewElement.appendChild(fileNameSpan);

        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '&times;';
        removeBtn.classList.add('remove-file-btn');
        removeBtn.addEventListener('click', clearFilePreview);
        previewElement.appendChild(removeBtn);

        filePreviewContainer.appendChild(previewElement);
    }

    // --- Fungsi Komunikasi API Gemini ---
    async function getAIResponse(history) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: history
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', response.status, response.statusText, errorData);
                // Menangani error spesifik API (misal: API key tidak valid)
                if (response.status === 400 && errorData.error && errorData.error.message.includes('API key not valid')) {
                    return "Maaf, ada masalah dengan API Key Anda. Pastikan itu benar dan valid.";
                }
                return "Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi. (Kode: " + response.status + ")";
            }

            const data = await response.json();
            return data.candidates[0]?.content?.parts[0]?.text || "Maaf, AI tidak dapat memberikan respons.";

        } catch (error) {
            console.error('Network or other error:', error);
            return "Maaf, terjadi kesalahan jaringan atau lainnya. Silakan coba lagi.";
        }
    }

    // --- Fungsi Utama Pengiriman Pesan ---
    async function handleSend() {
        const userMessage = userInput.value.trim();
        if (userMessage === '' && !attachedFile) return;

        let chatToProcess = null;

        // Coba temukan chat yang sudah ada
        if (currentChatId !== null) {
            chatToProcess = chats.find(c => c.id === currentChatId);
        }

        // Jika tidak ada chat yang aktif atau chat yang ditemukan tidak valid, mulai chat baru
        if (!chatToProcess) {
            chatToProcess = startNewChat(); // startNewChat sekarang mengembalikan objek chat
            if (!chatToProcess) {
                console.error("Kesalahan Fatal: Gagal membuat atau menemukan chat saat ini.");
                return;
            }
        }

        const fileType = attachedFile ? (attachedFile.mimeType.startsWith('image/') ? 'image' : 'document') : 'text';
        const filePreviewForDOM = attachedFile ? `data:${attachedFile.mimeType};base64,${attachedFile.base64}` : null;

        addMessageToDOM(userMessage, 'user', fileType, filePreviewForDOM, attachedFile);
        addMessageToData(userMessage, 'user', fileType, filePreviewForDOM, attachedFile);

        userInput.value = '';
        clearFilePreview();

        const loadingMessageElement = addMessageToDOM("lagi mikir bentar...", 'bot'); // Ambil referensi ke elemen loading

        // --- Persiapan Riwayat Percakapan untuk API ---
        const conversationHistoryForAPI = [];

        // Tambahkan persona prompt yang relevan di awal percakapan
        conversationHistoryForAPI.push({
            "role": "user",
            "parts": [{
                "text": personaPrompts[currentSelectedPersona] || personaPrompts["normal"]
            }]
        });

        // Iterasi melalui pesan-pesan yang ada di chatToProcess (ini adalah objek chat yang valid)
        for (const message of chatToProcess.messages) { 
            // Hindari menambahkan pesan loading "lagi mikir bentar..." ke riwayat API
            if (message.sender === 'bot' && message.text === "lagi mikir bentar...") {
                continue;
            }

            const parts = [{ text: message.text }];
            if (message.fileData && message.fileData.base64) {
                parts.push({
                    inlineData: {
                        mimeType: message.fileData.mimeType,
                        data: message.fileData.base64
                    }
                });
            }
            conversationHistoryForAPI.push({
                role: message.sender === 'user' ? 'user' : 'model',
                parts: parts
            });
        }
        // --- Akhir Persiapan Riwayat Percakapan ---

        const aiMessage = await getAIResponse(conversationHistoryForAPI);

        // Hapus pesan "lagi mikir bentar..." menggunakan referensi yang disimpan
        if (loadingMessageElement && chatBox.contains(loadingMessageElement)) {
            chatBox.removeChild(loadingMessageElement);
        }
        
        addMessageToDOM(aiMessage, 'bot');
        addMessageToData(aiMessage, 'bot');
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

    // Event listener untuk perubahan pilihan persona AI
    aiModelSelect.addEventListener('change', (e) => {
        currentSelectedPersona = e.target.value; 
        console.log(`Persona AI diubah menjadi: ${currentSelectedPersona}`);
        // Anda bisa tambahkan logika lain jika perlu.
    }); 

    // --- Inisialisasi Aplikasi ---
    loadChats(); 
    renderHistory();
    renderChatBox();
});
