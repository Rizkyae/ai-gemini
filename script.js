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

    // --- Pengaturan API ---
    const apiKey = 'AIzaSyCRHGWVFSMxik8rH8J7Obi6dZSmu9fn72A'; // GANTI DENGAN API KEY ANDA
    const model = 'gemini-1.5-flash'; // Menggunakan model yang lebih cepat dan efisien
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // --- State Management (Pengelola Data) ---
    let chats = [];
    let currentChatId = null;

    /**
     * Memuat semua chat dari localStorage.
     */
    function loadChats() {
        const savedChats = localStorage.getItem('ai-chat-history');
        if (savedChats) {
            chats = JSON.parse(savedChats);
        }
        if (chats.length > 0) {
            currentChatId = chats[0].id; // Muat chat terakhir (yang pertama di array)
        } else {
            startNewChat(); // Jika tidak ada riwayat, mulai chat baru
        }
    }

    /**
     * Menyimpan semua chat ke localStorage.
     */
    function saveChats() {
        localStorage.setItem('ai-chat-history', JSON.stringify(chats));
    }

    /**
     * Merender daftar riwayat di sidebar.
     */
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
                    renderHistory(); // Untuk update highlight .active
                });
                li.appendChild(a);
                historyList.appendChild(li);
            });
        }
    }

    /**
     * Merender pesan di chat box sesuai currentChatId.
     */
    function renderChatBox() {
        chatBox.innerHTML = '';
        const currentChat = chats.find(c => c.id === currentChatId);
        if (currentChat && currentChat.messages) {
            currentChat.messages.forEach(msg => {
                addMessageToDOM(msg.content, msg.sender, msg.type);
            });
        } else {
            // Tampilkan pesan selamat datang jika ini chat baru
            addMessageToDOM("Halo! Saya Mas Riski. Anda bisa bertanya atau mengirimkan file kepada saya.", 'bot');
        }
    }

    /**
     * Fungsi untuk memulai sesi chat baru.
     */
    function startNewChat() {
        currentChatId = null; // Tandai bahwa ini adalah chat baru yang belum disimpan
        userInput.value = '';
        renderChatBox();
        renderHistory();
    }

    /**

     * Menambahkan pesan ke tampilan DOM (chat box).
     * @param {string} message - Isi pesan.
     * @param {string} sender - 'user' atau 'bot'.
     * @param {string} type - 'text' atau 'file'.
     */
    function addMessageToDOM(message, sender, type = 'text') {
        const messageRow = document.createElement('div');
        messageRow.classList.add('message-row', sender);

        const avatar = document.createElement('img');
        avatar.src = 'anim.gif';
        avatar.alt = sender === 'bot' ? 'AI Avatar' : 'User Avatar';
        avatar.classList.add('avatar');
        // Sembunyikan avatar user untuk desain yang lebih bersih
        if(sender === 'user') avatar.style.display = 'none'; 
        
        const chatMessage = document.createElement('div');
        chatMessage.classList.add('chat-message', sender);

        if (type === 'file') {
            chatMessage.classList.add('file-info');
            chatMessage.innerHTML = `<i class="fas fa-file-alt"></i> <p>${message}</p>`;
        } else {
            chatMessage.innerHTML = marked.parse(message); // Gunakan marked.parse untuk merender markdown
        }

        if (sender === 'bot') {
            messageRow.appendChild(avatar);
        }
        messageRow.appendChild(chatMessage);
        chatBox.appendChild(messageRow);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    /**
     * Menambahkan pesan ke array data dan menyimpannya.
     * @param {string} content - Isi pesan.
     * @param {string} sender - 'user' atau 'bot'.
     * @param {string} type - 'text' atau 'file'.
     */
    function addMessageToData(content, sender, type = 'text') {
        let currentChat = chats.find(c => c.id === currentChatId);
        if (!currentChat) return;
        currentChat.messages.push({ sender, content, type });
        saveChats();
    }
    
    /**
     * Mengirim prompt ke API Gemini dan mendapatkan respons.
     * @param {string} prompt - Teks prompt yang akan dikirim.
     * @returns {Promise<string>} Respons dari AI.
     */
    async function getAIResponse(prompt) {
        try {
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "contents": [{ "parts": [{ "text": prompt }] }]
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
             if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text.trim();
            } else {
                 return "Maaf, saya tidak dapat memberikan respons saat ini.";
            }
        } catch (error) {
            console.error("Error fetching AI response:", error);
            return "Maaf, terjadi kesalahan saat menghubungi Mas Riski.";
        }
    }
    
    /**
     * Logika utama saat tombol Kirim ditekan.
     */
    async function handleSend() {
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        // Jika ini adalah chat baru, buat entri baru di 'chats'
        if (currentChatId === null) {
            currentChatId = `chat-${Date.now()}`;
            const newChat = {
                id: currentChatId,
                title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''), // Judul dari pesan pertama
                messages: []
            };
            chats.unshift(newChat); // Tambahkan ke awal array agar muncul di paling atas
        }
        
        addMessageToDOM(userMessage, 'user');
        addMessageToData(userMessage, 'user');
        userInput.value = '';
        renderHistory(); // Update riwayat dengan judul baru

        // Tampilkan pesan loading
        addMessageToDOM("berpikir...", 'bot');

        const promptUntukRiski = `Kamu adalah asisten AI bernama "Mas Riski". Jawab pertanyaan pengguna: "${userMessage}"`;
        const aiMessage = await getAIResponse(promptUntukRiski);

        // Hapus pesan "berpikir..." dan ganti dengan respons AI
        chatBox.removeChild(chatBox.lastChild); 
        addMessageToDOM(aiMessage, 'bot');
        addMessageToData(aiMessage, 'bot');
    }

    function handleFileSelect(event, fileType) {
        const file = event.target.files[0];
        if (!file) return;

        const fileName = file.name;
        
        // Logika sama seperti handleSend, buat chat baru jika diperlukan
        if (currentChatId === null) {
            currentChatId = `chat-${Date.now()}`;
            const newChat = {
                id: currentChatId,
                title: `File: ${fileName}`,
                messages: []
            };
            chats.unshift(newChat);
        }

        addMessageToDOM(fileName, 'user', 'file');
        addMessageToData(fileName, 'user', 'file');
        renderHistory();

        addMessageToDOM("menerima file...", 'bot');

        const prompt = `Sebagai "Mas Riski", konfirmasi bahwa kamu menerima file "${fileName}" dan akan memeriksanya.`;
        getAIResponse(prompt).then(aiMessage => {
            chatBox.removeChild(chatBox.lastChild);
            addMessageToDOM(aiMessage, 'bot');
            addMessageToData(aiMessage, 'bot');
        });

        event.target.value = '';
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
    newChatBtn.addEventListener('click', startNewChat);

    uploadDocBtn.addEventListener('click', () => docInput.click());
    uploadImgBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (event) => handleFileSelect(event, 'image'));
    docInput.addEventListener('change', (event) => handleFileSelect(event, 'document'));

    // --- Inisialisasi Aplikasi ---
    loadChats();
    renderHistory();
    renderChatBox();
});