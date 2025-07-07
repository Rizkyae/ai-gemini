// script.js (Lengkap dengan Perbaikan Terakhir & Konsisten untuk Persona AI)

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
    // !!! PENTING: GANTI INI DENGAN API KEY GEMINI ANDA YANG VALID DAN LENGKAP !!!
    const apiKey = 'AIzaSyCRHGWVFSMxik8rH8J7Obi6dZSmu9fn72A'; // Contoh: 'AIzaSyC0dE_kEy_HeRe_FoR_ReAl_ApI'

    // currentModel sekarang adalah model Gemini API yang FIX, tidak berubah dari dropdown.
    let currentModel = 'gemini-2.5-flash'; // <--- KOREKSI: Gunakan model Gemini API yang tetap
                                         // Anda bisa ganti ke 'gemini-1.5-pro' jika mau.

    // --- State Management ---
    let chats = [];
    let currentChatId = null;
    let attachedFile = null;
    // currentSelectedPersona diinisialisasi dari nilai default dropdown (misal: "gen-z")
    let currentSelectedPersona = aiModelSelect.value; // <--- INI BENAR UNTUK PERSONA

    // Definisikan persona prompts (Pastikan kunci cocok dengan value di index.html)
    const personaPrompts = {
        "gen-z": `React as Riski, your AI bestie. Your personality is super chill, helpful, and you talk like a true Gen Z from Indonesia. Use casual Indonesian and mix in English slang (e.g., 'literally', 'spill', 'no cap', 'YGY', 'bestie'). Use emojis. Always keep the previous conversation in mind.`,
        "normal": `You are a helpful and respectful AI assistant from Indonesia. Provide clear, concise, and polite answers. Avoid using slang or excessive emojis. Always keep the previous conversation in mind.`
    };

    // --- Fungsi Pengelola Riwayat ---
    // ... (fungsi loadChats, saveChats, startNewChat, renderHistory, renderChatBox Anda) ...

    // --- Fungsi Utilitas UI ---
    // ... (fungsi addMessageToDOM, addMessageToData, clearFilePreview, handleFileSelect, displayFilePreview Anda) ...

    // --- Fungsi Komunikasi API Gemini ---
    async function getAIResponse(history) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`; // currentModel digunakan di sini

        // ... (sisanya fungsi getAIResponse Anda) ...
    }

    // --- Fungsi Utama Pengiriman Pesan ---
    async function handleSend() {
        // ... (bagian awal handleSend Anda) ...

        // Tambahkan persona prompt yang relevan di awal percakapan
        const conversationHistoryForAPI = []; // Pastikan ini kosong sebelum ditambah persona
        conversationHistoryForAPI.push({
            "role": "user",
            "parts": [{
                // Gunakan persona yang dipilih dari dropdown, fallback ke 'normal' jika tidak ditemukan
                "text": personaPrompts[currentSelectedPersona] || personaPrompts["normal"]
            }]
        });

        // ... (loop melalui pesan-pesan yang ada di currentChat untuk conversationHistoryForAPI) ...
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
        // !!! KOREKSI INI !!!
        // Cukup ubah currentSelectedPersona di sini, BUKAN currentModel.
        currentSelectedPersona = e.target.value; 
        console.log(`Persona AI diubah menjadi: ${currentSelectedPersona}`);
        // Anda bisa tambahkan logika lain jika perlu.
    }); 

    // --- Inisialisasi Aplikasi ---
    // Ini harus di luar event listener
    loadChats(); 
    renderHistory();
    renderChatBox();
}); // Penutup akhir dari DOMContentLoaded
