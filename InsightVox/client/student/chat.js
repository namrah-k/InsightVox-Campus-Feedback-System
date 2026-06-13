// @ts-nocheck

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const imageUploadInput = document.getElementById('image-upload');

let pollTimer = null;

async function loadMessages() {
  try {
    const { messages } = await Messages.thread(currentUser.id);
    renderMessages(chatMessages, messages);
  } catch (err) {
    chatMessages.innerHTML = `<p class="error-text">${escapeHtml(err.message)}</p>`;
  }
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  try {
    await Messages.send({ text });
    await loadMessages();
  } catch (err) {
    alert(err.message);
  }
});

imageUploadInput.addEventListener('change', async () => {
  const file = imageUploadInput.files[0];
  if (!file) return;

  try {
    const dataUrl = await readImageAsDataUrl(file);
    await Messages.send({ image: dataUrl, text: '' });
    imageUploadInput.value = '';
    await loadMessages();
  } catch (err) {
    alert(err.message);
  }
});

if (currentUser) {
  loadMessages();
  // Lightweight polling so new staff replies show up without a manual refresh
  pollTimer = setInterval(loadMessages, 8000);
}

window.addEventListener('beforeunload', () => {
  if (pollTimer) clearInterval(pollTimer);
});
