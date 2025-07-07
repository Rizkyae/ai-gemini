// script.js (Lengkap dengan Perbaikan Terakhir)

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
    const aiModelSelect = document.getElementById('ai-model-select'); // Dapatkan elemen select

    // --- Pengaturan API ---
    const apiKey = 'AIzaSyBco_NWz7SagOZ2YMC7CyFXUMg0e_yajv4'; // PASTIKAN INI API KEY GEMINI ANDA YANG VALID
    let currentModel = 'gemini-2.5-flash'; // Inisialisasi model dari nilai default select

    // --- State Management ---
    let chats = [];
    let currentChatId = null;
    let attachedFile = null;
    let currentSelectedPersona = aiModelSelect.value;
    // --- Fungsi Pengelola Riwayat ---
    function loadChats() {
        const savedChats = localStorage.getItem('ai-chat-history');
        if (savedChats) {
            chats = JSON.parse(savedChats);
        }
        // Perbaikan: Jika ada chat yang tersimpan, aktifkan chat terakhir secara default
        if (chats.length > 0) {
            currentChatId = chats[0].id;
        } else {
            startNewChat(); // Jika tidak ada chat, mulai chat baru
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
        // Tambahkan pesan pembuka hanya jika chatbox kosong
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
                // Pastikan pesan yang dirender sudah diproses link YouTubenya
                addMessageToDOM(msg.content, msg.sender, msg.type, msg.filePreview, msg.fileObject);
            });
        }
    }

    function startNewChat() {
        const newChatId = `chat-${Date.now()}`;
        const newChat = {
            id: newChatId,
            title: 'Chat Baru', // Judul awal, akan diperbarui saat pesan pertama
            messages: []
        };
        chats.unshift(newChat); // Tambahkan ke awal array
        currentChatId = newChatId;
        userInput.value = '';
        clearFilePreview();
        renderChatBox(); // Render ulang chatbox untuk chat baru
        renderHistory(); // Render ulang riwayat
        saveChats();
    }

    function addMessageToData(content, sender, type = 'text', filePreview = null, fileObject = null) {
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
            fileObject
        });

        // Perbarui judul chat jika ini pesan pertama di chat baru
        if (currentChat.messages.length === 1) {
            currentChat.title = content ? (content.substring(0, 30) + (content.length > 30 ? '...' : '')) : (fileObject ? `File: ${fileObject.name.substring(0, 20)}...` : 'Chat Baru');
            renderHistory(); // Render ulang riwayat untuk memperbarui judul
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

    // --- PENGATURAN API KEY YOUTUBE ---
    const youtubeApiKey = 'AIzaSyC6Fl1VhgNkqlPr3nN17XRBzFv6ZHptiBw'; // <--- GANTI INI DENGAN API KEY YOUTUBE ANDA YANG VALID

    // Fungsi untuk mendapatkan detail video dari YouTube Data API
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
                    tags: snippet.tags // Array of tags, can be useful
                };
            }
            return null;
        } catch (error) {
            console.error("Error fetching YouTube video details:", error);
            // Kembali ke null untuk kasus gagal agar tidak ada info yang salah ke AI
            return null;
        }
    }

    // Fungsi embedYouTubeLinks diperbaiki dengan URL embed yang standar
    function embedYouTubeLinks(text) {
        // Regex untuk menangkap ID video dari berbagai format URL YouTube
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?/g;
        return text.replace(youtubeRegex, (match, videoId) => {
            // Menggunakan format URL embed YouTube yang benar
            // Protokol HTTPS sangat disarankan
            return `<div class="youtube-embed-wrapper"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
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
            // Pastikan embedYouTubeLinks dipanggil di sini agar URL diubah menjadi iframe
            const processedMessage = embedYouTubeLinks(message);
            contentHTML += marked.parse(processedMessage);
        }

        chatMessage.innerHTML = contentHTML;

        messageRow.appendChild(chatMessage);

        chatBox.appendChild(messageRow);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // Fungsi getAIResponse diperbarui untuk menggunakan currentModel dan riwayat percakapan
    async function getAIResponse(conversationParts) { // Menerima seluruh riwayat sebagai conversationParts
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "contents": conversationParts // Kirim seluruh riwayat di sini
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
const currentChat = chats.find(c => c.id === currentChatId);
    const conversationHistoryForAPI = [];
        
        // Pastikan ada currentChatId, jika tidak, buat yang baru
        if (currentChatId === null) {
            startNewChat();
        }
    
// Contoh di dalam getAIResponse atau handleSend, setelah AI menerima pesan pengguna
if (userMessage.toLowerCase().includes('edit foto') || userMessage.toLowerCase().includes('ganti background')) {
    return "Wah bestie, aku belum bisa bantu edit-edit foto gitu. Aku cuma bisa bantuin ngobrol, kasih info, atau analisis gambar/dokumen aja. Kalau mau edit foto, coba pake aplikasi editing foto khusus ya! 🙏";
}
        const filePreviewForDOM = attachedFile ? `data:${attachedFile.mimeType};base64,${attachedFile.base64}` : null;
        addMessageToDOM(userMessage, 'user', 'text', filePreviewForDOM, attachedFile);
        addMessageToData(userMessage, 'user', 'text', filePreviewForDOM, attachedFile);

        userInput.value = '';
        clearFilePreview();

        addMessageToDOM("lagi mikir bentar...", 'bot');

        // --- Persiapan Riwayat Percakapan untuk API ---
        const currentChat = chats.find(c => c.id === currentChatId);
        const conversationHistoryForAPI = [];

        // Iterasi melalui pesan-pesan yang ada di currentChat
        // Penting: hanya kirim teks, dan jika ada file, format file sebagai inline_data.
        // HANYA pesan yang memiliki 'content' atau 'fileObject' yang relevan untuk API.
        // Batasi jumlah pesan yang dikirim untuk mencegah payload terlalu besar.
        const MAX_HISTORY_MESSAGES = 10; // Contoh: kirim 10 pesan terakhir
        // Pastikan kita tidak mencoba mengambil slice dari array yang tidak ada
        const messagesToSend = currentChat && currentChat.messages ? currentChat.messages.slice(-MAX_HISTORY_MESSAGES) : [];

        // Definisikan persona prompts (Pastikan ini ada dan kunci cocok dengan index.html)
    const personaPrompts = {
        "gen-z": `React as Riski, your AI bestie. Your personality is super chill, helpful, and you talk like a true Gen Z from Indonesia. Use casual Indonesian and mix in English slang (e.g., 'literally', 'spill', 'no cap', 'YGY', 'bestie'). Use emojis. Always keep the previous conversation in mind.`,
        "normal": `You are a helpful and respectful AI assistant from Indonesia. Provide clear, concise, and polite answers. Avoid using slang or excessive emojis. Always keep the previous conversation in mind.`
    };
        
       
         // Perhatikan: Gemini API kadang membutuhkan alternating roles.
         // Jika pesan pertama adalah 'user' (persona prompt), pesan kedua harus 'model'.
         // Untuk percakapan selanjutnya, pastikan bergantian.

        for (const msg of messagesToSend) { // Gunakan for...of untuk async/await
            const contentParts = [];
            let processedText = msg.content; // Inisialisasi

            // Cek jika pesan mengandung link YouTube
            const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]{11})(?:\S+)?/g;
            // Gunakan (msg.content || '') untuk memastikan kita bekerja dengan string
            const matches = [...(msg.content || '').matchAll(youtubeRegex)]; 

            if (matches.length > 0) {
                for (const match of matches) {
                    const videoId = match[1];
                    const videoDetails = await getYouTubeVideoDetails(videoId); // Panggil API YouTube
                    if (videoDetails) {
                        // Tambahkan detail video ke teks pesan yang akan dikirim ke AI
                        // Pastikan processedText tidak null atau undefined saat menambahkan
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
            // Hanya tambahkan jika ada konten atau file
            if (contentParts.length > 0) {
                conversationHistoryForAPI.push({
                    "role": msg.sender === 'user' ? "user" : "model", // Sesuaikan role
                    "parts": contentParts
                });
            }
        }
        // --- Akhir Persiapan Riwayat Percakapan ---

        const aiMessage = await getAIResponse(conversationHistoryForAPI);

        // Hapus pesan "lagi mikir bentar..."
        if (chatBox.lastChild && chatBox.lastChild.querySelector('.chat-message').textContent === "lagi mikir bentar...") {
            chatBox.removeChild(chatBox.lastChild);
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

    // Event listener untuk perubahan pilihan model AI
    aiModelSelect.addEventListener('change', (e) => {
       currentSelectedPersona = e.target.value; // <--- UBAH BARIS INI
                                                 // Sekarang, nilai yang dipilih disimpan ke currentSelectedPersona
        console.log(`Persona AI diubah menjadi: ${currentSelectedPersona}`); // Untuk debugging
        // Anda bisa tambahkan logika lain di sini jika perlu,
        // misalnya mereset chat atau memberikan notifikasi ke pengguna.
    // --- Inisialisasi Aplikasi ---
    loadChats();
    renderHistory();
    renderChatBox(); // Pastikan ini dipanggil setelah loadChats
});
