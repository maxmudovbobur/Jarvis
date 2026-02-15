const logText = document.getElementById('logText');
const statusText = document.getElementById('status');
const userInput = document.getElementById('userInput');
const micBtn = document.getElementById('mic-btn');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const sidebarVoiceBtn = document.querySelector('.sidebar-voice-btn');

let isRecording = false;
let currentMode = 'text';
let chatHistory = JSON.parse(localStorage.getItem('jarvis_memory')) || [];

function toggleSidebar() {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

// Ovozni aniqlash
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
    recognition.continuous = true;
    recognition.lang = 'uz-UZ';
    recognition.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        userInput.value = transcript;
        handleTextInput();
    };
}

function toggleVoice() {
    if (isRecording) {
        recognition.stop();
        isRecording = false;
        currentMode = 'text';
        statusText.innerText = "ONLINE";
        updateUI(false);
    } else {
        recognition.start();
        isRecording = true;
        currentMode = 'voice';
        statusText.innerText = "SIZNI ESHITMOQDAMAN...";
        updateUI(true);
        speak("Ovozli protokol faollashtirildi, Ser.");
    }
}

function updateUI(active) {
    micBtn.classList.toggle('pulse', active);
    sidebarVoiceBtn.style.color = active ? "#ff4444" : "";
}

function speak(text) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'uz-UZ'; // O'zbek tili
    window.speechSynthesis.speak(utter);
}

// Groq API - O'zbekcha buyruq bilan
async function getAIResponse(text) {
    const apiKey = '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';
    chatHistory.push({ role: "user", content: text });

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "Siz J.A.R.V.I.S. 4.0 versiyasidasiz. Foydalanuvchiga faqat 'Ser' deb murojaat qiling. Barcha savollarga O'ZBEK tilida javob bering." },
                    ...chatHistory
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (e) { return "Ser, aloqada uzilish yuz berdi."; }
}

async function handleTextInput() {
    const text = userInput.value.trim();
    if (!text) return;

    if(document.getElementById('welcome-screen')) document.getElementById('welcome-screen').style.display = 'none';
    
    addMessageToUI("Siz", text);
    userInput.value = "";
    statusText.innerText = "TAHLIL QILINMOQDA...";

    const response = await getAIResponse(text);
    addMessageToUI("Jarvis", response);
    
    chatHistory.push({ role: "assistant", content: response });
    localStorage.setItem('jarvis_memory', JSON.stringify(chatHistory.slice(-10))); // Xotirani tejash

    if (currentMode === 'voice') speak(response);
    statusText.innerText = "ONLINE";
}

function addMessageToUI(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `display: flex; gap: 15px; margin-bottom: 20px; flex-direction: ${sender === "Jarvis" ? "row" : "row-reverse"}`;
    msgDiv.innerHTML = `
        <div style="width: 35px; height: 35px; border-radius: 50%; background: ${sender === "Jarvis" ? "#00d2ff" : "#5436da"}; display: grid; place-items: center; color: black; font-weight: bold;">${sender[0]}</div>
        <div class="text-content">${text}</div>
    `;
    logText.appendChild(msgDiv);
    logText.scrollTop = logText.scrollHeight;
}

function activateVoiceMode() { if(!isRecording) toggleVoice(); if(window.innerWidth < 768) toggleSidebar(); }
function activateTextMode() { if(isRecording) toggleVoice(); if(window.innerWidth < 768) toggleSidebar(); }
function startNewSession() { localStorage.clear(); location.reload(); }

userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleTextInput(); });