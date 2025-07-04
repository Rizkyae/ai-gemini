// --- Pengaturan Dasar ---
const sendButton = document.getElementById('send-btn');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// TAMBAHAN: Pengaturan untuk tombol dan input file
const uploadDocBtn = document.getElementById('upload-doc-btn');
const uploadImgBtn = document.getElementById('upload-img-btn');
const imageInput = document.getElementById('image-input');
const docInput = document.getElementById('doc-input');


// ▼▼▼ MASUKKAN API KEY GOOGLE ANDA DI SINI ▼▼▼
const apiKey = 'AIzaSyCRHGWVFSMxik8rH8J7Obi6dZSmu9fn72A';
const model = 'gemini-2.5-pro';
const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

// --- Fungsi Utama ---

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
            const errorData = await response.json();
            console.error("Error from API:", errorData);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error("Error fetching AI response:", error);
        return "Maaf, terjadi kesalahan saat menghubungi Mas Riski.";
    }
}

function addMessage(message, sender, type = 'text') {
    const messageRow = document.createElement('div');
    messageRow.classList.add('message-row', sender);

    const chatMessage = document.createElement('div');
    chatMessage.classList.add('chat-message', sender);
    
    // MODIFIKASI: Menampilkan pesan file atau teks
    if (type === 'file') {
        chatMessage.classList.add('file-info');
        chatMessage.innerHTML = `<i class="fas fa-file-alt"></i> <p>${message}</p>`;
    } else {
        const p = document.createElement('p');
        p.textContent = message;
        chatMessage.appendChild(p);
    }

    if (sender === 'bot') {
        const avatar = document.createElement('gif');
        avatar.src = 'anim.gif';
        avatar.alt = 'anim';
        avatar.classList.add('avatar');
        messageRow.appendChild(avatar);
    }
    
    messageRow.appendChild(chatMessage);
    chatBox.appendChild(messageRow);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function handleSend() {
    const userMessage = userInput.value.trim();
    if (userMessage === '') return;
    addMessage(userMessage, 'user');
    userInput.value = '';
    
    // Tampilkan pesan loading bot
    const loadingRow = document.createElement('div');
    loadingRow.classList.add('message-row', 'bot');
    loadingRow.innerHTML = `
        <img src="anim.gif" alt="anim" class="avatar">
        <div class="chat-message bot"><p>berpikir...</p></div>
    `;
    chatBox.appendChild(loadingRow);
    chatBox.scrollTop = chatBox.scrollHeight;

    const aiMessage = await getAIResponse(userMessage);
    loadingRow.querySelector('p').innerHTML = marked.parse(aiMessage);
    
}

// TAMBAHAN: Fungsi untuk menangani file yang dipilih
function handleFileSelect(event, fileType) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name;
    const message = `${fileName}`;
    addMessage(message, 'user', 'file');

    // Di sini seharusnya ada logika untuk MENGUNGGAH file ke server.
    // Untuk saat ini, kita hanya akan meminta konfirmasi dari bot.
    const prompt = `Pengguna baru saja mengunggah file bernama "${fileName}". Berikan respons bahwa kamu telah menerimanya dan akan memeriksanya.`;
    
    // Tampilkan pesan loading bot
    const loadingRow = document.createElement('div');
    loadingRow.classList.add('message-row', 'bot');
    loadingRow.innerHTML = `
        <img src="anim.gif" alt="AI Avatar" class="avatar">
        <div class="chat-message bot"><p>berpikir...</p></div>
    `;
    chatBox.appendChild(loadingRow);
    chatBox.scrollTop = chatBox.scrollHeight;

    getAIResponse(prompt).then(aiMessage => {
        loadingRow.querySelector('p').innerHTML = marked.parse(aiMessage);
    });

    // Reset input file agar bisa memilih file yang sama lagi
    event.target.value = '';
}


// --- Event Listeners ---
sendButton.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleSend();
    }
});

// TAMBAHAN: Event listener untuk tombol dan input file
uploadDocBtn.addEventListener('click', () => docInput.click());
uploadImgBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (event) => handleFileSelect(event, 'image'));
docInput.addEventListener('change', (event) => handleFileSelect(event, 'document'));