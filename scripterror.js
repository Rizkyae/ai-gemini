// script.js (Lengkap dengan Perbaikan Terakhir + Fitur AI Menampilkan Gambar)

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
    const apiKey = 'AIzaSyBco_NWz7SagOZ2YMC2CyFXUMg0e_yajv4'; // Ganti dengan API Key Anda yang valid
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
            // Pastikan currentChatId selalu mengarah ke chat yang ada
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
                    renderHistory(); // Render ulang riwayat untuk mengupdate kelas aktif
                });
                li.appendChild(a);
                historyList.appendChild(li);
            });
        }
    }

    function renderChatBox() {
        chatBox.innerHTML = '';
        const currentChat = chats.find(c => c.id === currentChatId);
        
        // Pesan awal ketika chat baru atau kosong
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
                // Pastikan semua properti yang relevan diteruskan
                addMessageToDOM(msg.content, msg.sender, msg.type, msg.filePreview, msg.fileObject, msg.aiImageURL);
            });
        }
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll ke bawah setelah render
    }

    function startNewChat() {
        const newChatId = `chat-${Date.now()}`;
        const newChat = {
            id: newChatId,
            title: 'Chat Baru',
            messages: []
        };
        chats.unshift(newChat); // Tambahkan ke awal array agar muncul di atas
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
            // Ini seharusnya tidak terjadi jika startNewChat() dipanggil dengan benar
            // Tapi sebagai fallback, mulai chat baru
            startNewChat();
            currentChat = chats.find(c => c.id === currentChatId);
        }
        
        // Pastikan tidak menyimpan 'lagi mikir bentar...' ke dalam riwayat permanen
        if (sender === 'bot' && content === "lagi mikir bentar...") {
            return; 
        }

        currentChat.messages.push({
            sender,
            content,
            type,
            filePreview,
            fileObject: fileObject ? { // Hanya simpan data penting dari fileObject
                name: fileObject.name,
                mimeType: fileObject.mimeType,
                base64: fileObject.base64
            } : null,
            aiImageURL
        });

        if (currentChat.messages.length === 1 && sender === 'user') { // Hanya ubah judul jika pesan pertama dari user
            currentChat.title = content ? (content.substring(0, 30) + (content.length > 30 ? '...' : '')) : (fileObject ? `File: ${fileObject.name.substring(0, 20)}...` : 'Chat Baru');
            renderHistory();
        }
        saveChats();
    }

    function clearFilePreview() {
        attachedFile = null;
        filePreviewContainer.innerHTML = '';
        docInput.value = ''; // Reset input file agar bisa upload file yang sama lagi
        imageInput.value = ''; // Reset input file gambar
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
            const icon = document.createElement('i');
            icon.className = 'fas fa-file-alt'; // Icon untuk dokumen
            const fileNameSpan = document.createElement('p');
            fileNameSpan.textContent = fileData.name;
            previewWrapper.appendChild(icon);
            previewWrapper.appendChild(fileNameSpan);
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

        // Batasi ukuran file hingga 5MB
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
        if (file.size > MAX_FILE_SIZE) {
            alert(`Ukuran file terlalu besar! Maksimal ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
            event.target.value = ''; // Clear the input
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
        // event.target.value = ''; // Jangan clear di sini, clear di clearFilePreview()
    }

    // --- FUNGSI BARU DAN FUNGSI YANG DIPERBARUI ---

    const youtubeApiKey = 'AIzaSyC6Fl1VhgNkqlPr3nN17XRBzFv6ZHptiBw'; // Ganti dengan API Key YouTube Anda jika diperlukan

    async function getYouTubeVideoDetails(videoId) {
        if (!youtubeApiKey) {
            console.warn("YouTube API Key tidak ditemukan. Detail video YouTube tidak dapat diambil.");
            return null;
        }
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
        // Regex yang lebih robust untuk menangani berbagai format URL YouTube
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})(?:\S+)?/g;
        return text.replace(youtubeRegex, (match, videoId) => {
            // Gunakan domain yang benar untuk iframe YouTube
            return `<div class="youtube-embed-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        });
    }

    /**
     * FUNGSI DIPERBAIKI: `addMessageToDOM` sekarang sudah benar dan dapat menampilkan gambar AI.
     */
    function addMessageToDOM(message, sender, type = 'text', filePreviewUrl = null, fileObject = null, aiImageURL = null) {
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
        if (filePreviewUrl && sender === 'user') {
            let isImage = fileObject ? fileObject.mimeType.startsWith('image/') : filePreviewUrl.startsWith('data:image/');

            if (isImage) {
                contentHTML += `<div class="sent-file-preview"><img src="${filePreviewUrl}" alt="Pratinjau Gambar"></div>`;
            } else {
                const fileName = fileObject ? fileObject.name : 'Dokumen';
                contentHTML += `<div class="sent-file-preview-doc"><i class="fas fa-file-alt"></i><span>${fileName}</span></div>`;
            }
        }

        // Logika untuk menampilkan gambar yang dikirim oleh AI
        if (aiImageURL && sender === 'bot') {
            // Tambahkan kelas image-only jika hanya ada gambar
            if (!message || message.trim() === '') {
                chatMessage.classList.add('image-only');
            }
            contentHTML += `<div class="ai-image-response"><img src="${aiImageURL}" alt="Gambar dari AI"></div>`;
        }

        // Menambahkan teks pesan (pastikan ini di bawah gambar jika ada)
        if (message) {
            const processedMessage = embedYouTubeLinks(message);
            // marked.parse akan mengonversi Markdown ke HTML
            contentHTML += marked.parse(processedMessage);
        }

        chatMessage.innerHTML = contentHTML;

        messageRow.appendChild(chatMessage);

        chatBox.appendChild(messageRow);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function getAIResponse(conversationParts) { 
        let modelToUse;
        if (currentModel === 'gen-z') {
            modelToUse = 'gemini-2.5-flash'; // Menggunakan flash untuk kecepatan
        } else if (currentModel === 'normal') {
            modelToUse = 'gemini-1.5-flash'; // Menggunakan flash juga untuk normal, bisa ganti ke 'gemini-1.5-pro' jika mau yang lebih powerful tapi mungkin lebih lambat/mahal
        } else {
            modelToUse = 'gemini-pro'; // Default ke flash
        }

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "contents": conversationParts,
                    "safetySettings": [ // Tambahkan safety settings
                        {
                            "category": "HARM_CATEGORY_HARASSMENT",
                            "threshold": "BLOCK_NONE"
                        },
                        {
                            "category": "HARM_CATEGORY_HATE_SPEECH",
                            "threshold": "BLOCK_NONE"
                        },
                        {
                            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            "threshold": "BLOCK_NONE"
                        },
                        {
                            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                            "threshold": "BLOCK_NONE"
                        }
                    ]
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Response:", errorData);
                // Menangani error spesifik dari Gemini API
                if (errorData && errorData.error && errorData.error.message.includes("candidate was blocked due to safety settings")) {
                    return "Maaf, respons ini diblokir karena melanggar kebijakan keselamatan saya. Coba pertanyaan lain ya.";
                }
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
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
            return `Waduh, sorry banget bro. Gagal nyambung nih, coba ganti model AI atau cek koneksi internetmu. Detail Error: ${error.message}`;
        }
    }

    async function handleSend() {
        const userMessage = userInput.value.trim();
        if (userMessage === '' && !attachedFile) return;

        if (currentChatId === null) {
            startNewChat();
        }
        
        const filePreviewForDOM = attachedFile ? `data:${attachedFile.mimeType};base64,${attachedFile.base64}` : null;
        // Tambahkan pesan pengguna ke DOM dan Data
        addMessageToDOM(userMessage, 'user', 'text', filePreviewForDOM, attachedFile);
        addMessageToData(userMessage, 'user', 'text', attachedFile ? attachedFile.base64 : null, attachedFile);


        userInput.value = '';
        clearFilePreview();

        // Tampilkan pesan "lagi mikir bentar..." sementara menunggu respons AI
        const thinkingMessageDom = document.createElement('div');
        thinkingMessageDom.classList.add('message-row', 'bot');
        thinkingMessageDom.innerHTML = `<img src="anim.gif" alt="AI Avatar" class="avatar"><div class="chat-message bot">lagi mikir bentar...</div>`;
        chatBox.appendChild(thinkingMessageDom);
        chatBox.scrollTop = chatBox.scrollHeight;

        const currentChat = chats.find(c => c.id === currentChatId);
        const conversationHistoryForAPI = [];

        let personaPrompt = '';
        if (currentModel === 'gen-z') {
            personaPrompt = `React as Riski, your AI bestie. Your personality is super chill, helpful, and you talk like a true Gen Z from Indonesia. Use casual Indonesian and mix in English slang (e.g., 'literally', 'spill', 'no cap', 'YGY', 'bestie'). Use emojis. Always keep the previous conversation in mind. Jika diminta 'berikan gambar' atau 'tunjukkan foto', respons dengan teks dan URL gambar placeholder yang realistis seperti dari Unsplash atau Placehold.co, contohnya: 'Nih, bestie, ada gambar bagus buat kamu! [GAMBAR: https://images.unsplash.com/photo-1682687982046-e59a43521d9f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w1ODc1NTd8MXwxfGFsbHwxfHx8fHwyfHwxNjk5MjI3Mjc3fA&ixlib=rb-4.0.3&q=80&w=400]'.`;
        } else if (currentModel === 'normal') {
            personaPrompt = `You are Mas Riski, a helpful and friendly AI assistant. Respond in clear, concise, and polite Indonesian. Be polite, formal where appropriate, and do not use slang or emojis unless explicitly asked. Always keep the previous conversation in mind. Jika diminta 'berikan gambar' atau 'tunjukkan foto', respons dengan teks dan URL gambar placeholder yang realistis seperti dari Unsplash atau Placehold.co, contohnya: 'Baik, ini adalah contoh gambar yang saya temukan: [GAMBAR: https://placehold.co/400x300.png?text=Contoh+Gambar+AI]'.`;
        }
        
        // Tambahkan prompt persona sebagai pesan sistem atau pesan pertama
        if (personaPrompt) {
            conversationHistoryForAPI.push({
                "role": "user",
                "parts": [{ "text": personaPrompt }]
            });
            // Tambahkan juga respons 'model' dummy agar percakapan berlanjut dengan persona yang sudah diatur
            conversationHistoryForAPI.push({
                "role": "model",
                "parts": [{ "text": "Oke, saya siap membantu!" }] // Atau respons awal dari AI
            });
        }

        const MAX_HISTORY_MESSAGES = 10;
        // Ambil pesan asli dari chat, filter pesan "lagi mikir bentar..."
        const actualMessages = currentChat.messages.filter(msg => !(msg.sender === 'bot' && msg.content === "lagi mikir bentar..."));
        const messagesToSend = actualMessages.slice(-MAX_HISTORY_MESSAGES);

        for (const msg of messagesToSend) {
            const contentParts = [];
            let processedText = msg.content; 

            // Proses URL YouTube jika ada
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/)|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})(?:\S+)?/g;
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
            if (msg.fileObject && msg.fileObject.base64 && msg.fileObject.mimeType) {
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

        // Hapus pesan "lagi mikir bentar..." dari DOM
        if (chatBox.lastChild === thinkingMessageDom) {
            chatBox.removeChild(chatBox.lastChild);
        }
        
        // Cek lagi untuk kasus "edit foto" atau "ganti background"
        if (userMessage.toLowerCase().includes('edit foto') || userMessage.toLowerCase().includes('ganti background')) {
             const staticMessage = "Wah bestie, aku belum bisa bantu edit-edit foto gitu. Aku cuma bisa bantuin ngobrol, kasih info, atau analisis gambar/dokumen aja. Kalau mau edit foto, coba pake aplikasi editing foto khusus ya! 🙏";
             addMessageToDOM(staticMessage, 'bot');
             addMessageToData(staticMessage, 'bot');
             return; 
        }

        // --- Logika untuk mendeteksi dan menampilkan gambar dari respons AI ---
        let finalAIMessage = aiRawResponse;
        let aiImageURL = null;
        const imagePattern = /\[GAMBAR:\s*(https?:\/\/[^\s\]]+\.(?:png|jpe?g|gif|webp|svg|bmp)(?:\?\S*)?)\]/i; // Regex lebih baik untuk URL
        const match = aiRawResponse.match(imagePattern);

        if (match && match[1]) {
            aiImageURL = match[1];
            // Hapus placeholder gambar dari teks pesan akhir
            finalAIMessage = aiRawResponse.replace(imagePattern, '').trim();
        }

        addMessageToDOM(finalAIMessage, 'bot', 'text', null, null, aiImageURL);
        addMessageToData(finalAIMessage, 'bot', 'text', null, null, aiImageURL);
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Mencegah newline di textarea
            handleSend();
        }
    });
    newChatBtn.addEventListener('click', startNewChat);
    uploadDocBtn.addEventListener('click', () => docInput.click());
    uploadImgBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleFileSelect);
    docInput.addEventListener('change', handleFileSelect);

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm("Yakin mau hapus semua riwayat obrolanmu? Ini bakal permanen lho!")) {
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
        // Anda bisa menambahkan pesan di chatbox bahwa model telah berubah
        // addMessageToDOM(`Model AI telah diubah menjadi "${currentModel === 'gen-z' ? 'Mas Riski (Gen Z)' : 'Mas Riski (Normal AI)'}".`, 'bot');
    });

    // --- Inisialisasi Aplikasi ---
    loadChats();
    renderHistory();
    renderChatBox();
});
