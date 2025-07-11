// script.js (Diadaptasi untuk tampilan CosmoChat)

document.addEventListener('DOMContentLoaded', () => {

    // --- Elemen DOM ---
    const sendButton = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const typingIndicator = document.getElementById('typing-indicator'); // Tambahkan ini
    
    // Elemen sidebar lama (dikomentari jika sidebar dihapus dari HTML)
    // const historyList = document.getElementById('history-list');
    // const newChatBtn = document.getElementById('new-chat-btn');
    // const clearHistoryBtn = document.getElementById('clear-history-btn');
    // const aiModelSelect = document.getElementById('ai-model-select');

    const uploadDocBtn = document.getElementById('upload-doc-btn');
    const uploadImgBtn = document.getElementById('upload-img-btn');
    const imageInput = document.getElementById('image-input');
    const docInput = document.getElementById('doc-input');
    const filePreviewContainer = document.getElementById('file-preview-container');

    // --- Pengaturan API ---
    // PASTIKAN INI API KEY GEMINI ANDA YANG VALID. JANGAN MEMBAGIKAN KEY INI SECARA PUBLIK.
    const apiKey = 'AIzaSyBco_NWz7SagOZ2YMC7CyFXUMg0e_yajv4'; 
    // let currentModel = aiModelSelect ? aiModelSelect.value : 'gemini-pro'; // Sesuaikan jika aiModelSelect tidak ada
    let currentModel = 'gemini-2.5-flash'; // Default ke gemini-pro jika tidak ada pilihan model

    // --- State Management ---
    let chats = [];
    let currentChatId = null;
    let attachedFile = null; // Menyimpan file yang akan dikirim

    // --- Fungsi Pengelola Waktu ---
    function getCurrentTime() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    }

    // --- Fungsi Pengelola Riwayat ---
    function loadChats() {
        const savedChats = localStorage.getItem('ai-chat-history');
        if (savedChats) {
            chats = JSON.parse(savedChats);
            if (chats.length > 0) {
                currentChatId = chats[0].id; // Load the first chat by default
                renderChat(currentChatId);
                // renderHistory(); // Akan error jika historyList tidak ada
            } else {
                startNewChat();
            }
        } else {
            startNewChat();
        }
    }

    function saveChats() {
        localStorage.setItem('ai-chat-history', JSON.stringify(chats));
    }

    function renderChat(chatId) {
        chatBox.innerHTML = ''; // Kosongkan chatbox
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            chat.messages.forEach(msg => {
                addMessageToDOM(msg.text, msg.sender, msg.type, msg.fileData, msg.fileName, msg.imageURL, false);
            });
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    /*
    // renderHistory() akan diaktifkan jika elemen sidebar diaktifkan kembali
    function renderHistory() {
        historyList.innerHTML = '';
        if (chats.length === 0) {
            historyList.innerHTML = '<li class="text-gray-500 text-sm">Belum ada riwayat chat.</li>';
            return;
        }
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
            li.dataset.chatId = chat.id;
            li.innerHTML = `
                <i class="fas fa-comment"></i>
                <span class="chat-title">${chat.title}</span>
                <button class="delete-chat-btn" data-chat-id="${chat.id}"><i class="fas fa-times"></i></button>
            `;
            li.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-chat-btn') && !e.target.closest('.delete-chat-btn')) {
                    currentChatId = chat.id;
                    renderChat(currentChatId);
                    renderHistory(); // Update active state
                }
            });
            historyList.appendChild(li);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-chat-btn').forEach(button => {
            button.onclick = (e) => {
                e.stopPropagation(); // Prevent activating chat when deleting
                const chatIdToDelete = e.target.closest('.delete-chat-btn').dataset.chatId;
                if (confirm('Yakin ingin menghapus chat ini?')) {
                    chats = chats.filter(c => c.id !== chatIdToDelete);
                    saveChats();
                    if (currentChatId === chatIdToDelete) {
                        currentChatId = null;
                        startNewChat();
                    } else {
                        renderHistory();
                    }
                }
            };
        });
    }
    */

    function addMessageToData(text, sender, type, fileData = null, fileName = null, imageURL = null) {
        if (!currentChatId) {
            startNewChat();
        }
        const chat = chats.find(c => c.id === currentChatId);
        if (chat) {
            chat.messages.push({
                text: text,
                sender: sender,
                timestamp: getCurrentTime(),
                type: type,
                fileData: fileData,
                fileName: fileName,
                imageURL: imageURL
            });
            saveChats();
        }
    }

    // --- FUNGSI UTAMA UNTUK MENAMBAHKAN PESAN KE DOM (DIADAPTASI UNTUK COSMOCHAT STYLE) ---
    function addMessageToDOM(text, sender, type = 'text', fileData = null, fileName = null, imageURL = null, isNew = true) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-enter flex ${sender === 'user' ? 'justify-end' : ''} space-x-3`;

        let avatarHtml = '';
        let messageContentHtml = '';
        let bubbleClass = '';
        let timestampClass = '';

        if (sender === 'user') {
            avatarHtml = `
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                        <i class="fas fa-user-astronaut text-white"></i>
                    </div>
                </div>`;
            bubbleClass = 'bg-indigo-600/70 backdrop-blur-sm p-4 rounded-2xl max-w-[80%] border border-indigo-700 rounded-tr-none';
            timestampClass = 'text-xs text-indigo-200 mt-2 text-right';
        } else { // bot
            avatarHtml = `
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                        <img src="anim.gif" alt="AI Avatar" class="w-7 h-7 rounded-full">
                    </div>
                </div>`;
            bubbleClass = 'bg-gray-800/70 backdrop-blur-sm p-4 rounded-2xl max-w-[80%] border border-gray-700 chat-bubble rounded-tl-none';
            timestampClass = 'text-xs text-gray-400 mt-2';
        }

        let contentHtml = '';
        if (type === 'text') {
            // Menggunakan marked untuk merender markdown
            contentHtml = marked.parse(text || '');
        } else if (type === 'image' && imageURL) {
            contentHtml = `
                <div class="image-wrapper">
                    <img src="${imageURL}" alt="Uploaded image" class="max-w-full h-auto rounded-md">
                </div>`;
            // For image-only messages, remove padding/background from bubble if desired.
            // Add 'image-only' class to the bubbleClass for custom styling
            if (!text || text.trim() === '') { // If there's no text content along with image
                 bubbleClass += ' image-only';
                 // Ensure the background and padding are transparent for image-only
                 bubbleClass = bubbleClass.replace('bg-gray-800/70', 'bg-transparent').replace('bg-indigo-600/70', 'bg-transparent')
                                .replace('p-4', 'p-1').replace('border', ''); // Remove border for clean image bubble
            }
        } else if (type === 'document' && fileName) {
            contentHtml = `
                <div class="sent-file-preview-doc">
                    <i class="fas fa-file-alt"></i>
                    <span>${fileName}</span>
                </div>`;
        }

        // Handle YouTube embeds (if your AI returns YouTube links)
        const youtubePattern = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([\w-]{11})(?:\S+)?/g;
        let youtubeMatch;
        let finalContentHtml = contentHtml; // Start with the rendered text/file/image content

        while ((youtubeMatch = youtubePattern.exec(text)) !== null) {
            const videoId = youtubeMatch[1];
            const embedHtml = `
                <div class="youtube-embed-wrapper mt-2">
                    <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>`;
            finalContentHtml += embedHtml; // Append YouTube embed after text/file/image
        }

        messageContentHtml = `
            <div class="${bubbleClass}">
                ${finalContentHtml}
                <p class="${timestampClass}">${getCurrentTime()}</p>
            </div>`;

        if (sender === 'user') {
            messageDiv.innerHTML = messageContentHtml + avatarHtml;
        } else { // bot
            messageDiv.innerHTML = avatarHtml + messageContentHtml;
        }

        chatBox.appendChild(messageDiv);
        if (isNew) {
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    // --- Fungsi Pengelola File ---
    function handleFileSelect(event) {
        const files = event.target.files;
        if (files.length > 0) {
            attachedFile = files[0];
            filePreviewContainer.innerHTML = ''; // Clear previous preview
            filePreviewContainer.classList.remove('hidden');

            const fileItem = document.createElement('div');
            fileItem.classList.add('file-preview-item', 'bg-gray-800/70', 'p-2', 'rounded-md', 'flex', 'items-center', 'space-x-2', 'text-sm', 'text-gray-300');

            if (attachedFile.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = URL.createObjectURL(attachedFile);
                img.classList.add('w-10', 'h-10', 'object-cover', 'rounded-md');
                fileItem.appendChild(img);
            } else {
                const icon = document.createElement('i');
                icon.classList.add('fas', 'fa-file-alt', 'text-indigo-400');
                fileItem.appendChild(icon);
            }

            const fileNameSpan = document.createElement('span');
            fileNameSpan.textContent = attachedFile.name;
            fileItem.appendChild(fileNameSpan);

            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-file-btn', 'text-gray-400', 'hover:text-red-500');
            removeBtn.innerHTML = '<i class="fas fa-times-circle"></i>';
            removeBtn.addEventListener('click', () => {
                attachedFile = null;
                filePreviewContainer.innerHTML = '';
                filePreviewContainer.classList.add('hidden');
                imageInput.value = ''; // Clear input to allow re-selecting same file
                docInput.value = ''; // Clear input
            });
            fileItem.appendChild(removeBtn);
            filePreviewContainer.appendChild(fileItem);
        } else {
            attachedFile = null;
            filePreviewContainer.innerHTML = '';
            filePreviewContainer.classList.add('hidden');
        }
    }

    // --- Fungsi Kirim Pesan ---
    async function handleSend() {
        const userMessage = userInput.value.trim();
        if (!userMessage && !attachedFile) return;

        // Show user's message
        const fileType = attachedFile ? (attachedFile.type.startsWith('image/') ? 'image' : 'document') : 'text';
        const fileDataURL = attachedFile ? URL.createObjectURL(attachedFile) : null;
        const fileName = attachedFile ? attachedFile.name : null;

        addMessageToDOM(userMessage, 'user', fileType, attachedFile ? attachedFile.name : null, fileName, fileDataURL);
        addMessageToData(userMessage, 'user', fileType, attachedFile ? attachedFile.name : null, fileName, fileDataURL);

        // Clear input and file
        userInput.value = '';
        attachedFile = null;
        filePreviewContainer.innerHTML = '';
        filePreviewContainer.classList.add('hidden');
        imageInput.value = '';
        docInput.value = '';

        // Show typing indicator
        typingIndicator.classList.remove('hidden');
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            // Call Gemini API
            const response = await getGeminiResponse(userMessage);
            addMessageToDOM(response, 'bot', 'text', null, null, null); // AI response is always text for now
            addMessageToData(response, 'bot', 'text', null, null, null);
        } catch (error) {
            console.error('Error fetching Gemini response:', error);
            addMessageToDOM('Oops! Terjadi kesalahan saat menghubungi AI. Coba lagi nanti.', 'bot', 'text', null, null, null);
            addMessageToData('Oops! Terjadi kesalahan saat menghubungi AI. Coba lagi nanti.', 'bot', 'text', null, null, null);
        } finally {
            typingIndicator.classList.add('hidden');
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    }

    // --- Integrasi Gemini API ---
    async function getGeminiResponse(prompt) {
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;

        let requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        };

        // Jika ada file terlampir, tambahkan ke request body
        if (attachedFile) {
            const base64Data = await readFileAsBase64(attachedFile);
            const mimeType = attachedFile.type;

            // Untuk model multi-modal seperti gemini-pro-vision, jika Anda menggunakannya
            // Jika hanya gemini-pro, file image tidak bisa langsung diproses
            // Asumsi di sini kita kirim image untuk model yang mendukung (misal gemini-pro-vision)
            requestBody.contents[0].parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(`API request failed with status ${response.status}: ${errorData.error ? errorData.error.message : 'Unknown error'}`);
        }

        const data = await response.json();
        let aiRawResponse = data.candidates[0].content.parts[0].text;

        // Mendeteksi dan mengekstrak placeholder gambar dari respons AI jika ada
        const imagePattern = /\[gambar:([^\]]+?)\]/i; // Regex untuk [gambar:url_gambar]
        let aiImageURL = null;
        const match = aiRawResponse.match(imagePattern);
        if (match && match[1]) {
            aiImageURL = match[1];
            // Hapus placeholder gambar dari teks pesan akhir
            aiRawResponse = aiRawResponse.replace(imagePattern, '').trim();
        }

        return aiRawResponse;
    }

    // Helper untuk membaca file sebagai Base64
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Ambil hanya bagian base64
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    function startNewChat() {
        const newChat = {
            id: 'chat-' + Date.now(),
            title: 'Percakapan Baru', // Or generate a title based on first message
            messages: []
        };
        chats.unshift(newChat); // Add to the beginning
        currentChatId = newChat.id;
        saveChats();
        chatBox.innerHTML = ''; // Clear chat display
        addMessageToDOM('Halo, space explorer! 🌌 Saya Mas Riski, AI pendamping Anda untuk menjelajahi alam semesta pengetahuan. Apa yang ingin Anda jelajahi hari ini?', 'bot', 'text', null, null, null);
        addMessageToData('Halo, space explorer! 🌌 Saya Mas Riski, AI pendamping Anda untuk menjelajahi alam semesta pengetahuan. Apa yang ingin Anda jelajahi hari ini?', 'bot', 'text', null, null, null);
        // renderHistory(); // Akan error jika historyList tidak ada
    }

    // --- Event Listeners ---
    sendButton.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Tambahkan !e.shiftKey agar Shift+Enter bisa newline
            e.preventDefault(); // Mencegah newline default
            handleSend();
        }
    });

    // Event listeners untuk tombol upload file
    uploadDocBtn.addEventListener('click', () => docInput.click());
    uploadImgBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleFileSelect);
    docInput.addEventListener('change', handleFileSelect);

    /*
    // Event listeners untuk sidebar (dikomentari jika elemen tidak ada di HTML)
    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChat);
    }
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm("Yakin mau hapus semua riwayat obrolanmu? Ini bakal permanen lho!")) {
                chats = [];
                localStorage.removeItem('ai-chat-history');
                currentChatId = null;
                startNewChat();
                // renderHistory(); // Akan error jika historyList tidak ada
                console.log("Riwayat obrolan telah dihapus!");
            }
        });
    }
    if (aiModelSelect) {
        aiModelSelect.addEventListener('change', (e) => {
            currentModel = e.target.value;
            console.log(`Model AI diubah menjadi: ${currentModel}`);
        });
    }
    */

    // --- Star Generation (dari cosmo.html, dipindahkan ke sini untuk kerapian) ---
    const universe = document.getElementById('universe');
    if (universe) { // Pastikan elemen #universe ada
        const starsCount = 200;
        for (let i = 0; i < starsCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            const size = Math.random() * 2 + 1;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.setProperty('--duration', `${Math.random() * 5 + 3}s`);
            star.style.animationDelay = `${Math.random() * 5}s`;
            universe.appendChild(star);
        }
    }

    // --- Inisialisasi Aplikasi ---
    loadChats();
    // renderHistory(); // Akan error jika historyList tidak ada
});
