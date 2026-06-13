// @ts-nocheck

const conversationListEl = document.getElementById('conversation-list');
const chatMessages = document.getElementById('chat-messages');
const chatHeaderBar = document.getElementById('chat-header-bar');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const imageUploadInput = document.getElementById('image-upload');

let activeStudentId = null;
let activeStudentName = '';
let pollTimer = null;

function renderConversationList(conversations) {
  if (!conversations.length) {
    conversationListEl.innerHTML = '<p class="page-subtitle" style="padding: 10px;">No conversations yet.</p>';
    return;
  }

  conversationListEl.innerHTML = conversations
    .map((c) => {
      const preview = c.lastImage ? '📷 Image' : (c.lastMessage || '');
      return `
        <div class="conversation-item ${c.studentId === activeStudentId ? 'active' : ''}" data-student-id="${c.studentId}" data-student-name="${escapeHtml(c.name)}">
          <div class="conv-name">${escapeHtml(c.name)}</div>
          <div class="conv-preview">${escapeHtml(preview)}</div>
        </div>
      `;
    })
    .join('');
}

async function loadConversations() {
  try {
    const { conversations } = await Messages.conversations();
    renderConversationList(conversations);
  } catch (err) {
    conversationListEl.innerHTML = `<p class="error-text">${escapeHtml(err.message)}</p>`;
  }
}

async function openConversation(studentId, studentName) {
  activeStudentId = studentId;
  activeStudentName = studentName;
  chatHeaderBar.innerHTML = `<i class="fa-solid fa-user-graduate"></i> ${escapeHtml(studentName)}`;
  chatForm.classList.remove('hidden');

  document.querySelectorAll('.conversation-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.studentId === studentId);
  });

  await loadThread();
}

async function loadThread() {
  if (!activeStudentId) return;
  try {
    const { messages } = await Messages.thread(activeStudentId);
    renderMessages(chatMessages, messages);
  } catch (err) {
    chatMessages.innerHTML = `<p class="error-text">${escapeHtml(err.message)}</p>`;
  }
}

conversationListEl.addEventListener('click', (e) => {
  const item = e.target.closest('.conversation-item');
  if (!item) return;
  openConversation(item.dataset.studentId, item.dataset.studentName);
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!activeStudentId) return;

  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  try {
    await Messages.send({ text, studentId: activeStudentId });
    await loadThread();
    await loadConversations();
  } catch (err) {
    alert(err.message);
  }
});

imageUploadInput.addEventListener('change', async () => {
  const file = imageUploadInput.files[0];
  if (!file || !activeStudentId) return;

  try {
    const dataUrl = await readImageAsDataUrl(file);
    await Messages.send({ image: dataUrl, text: '', studentId: activeStudentId });
    imageUploadInput.value = '';
    await loadThread();
    await loadConversations();
  } catch (err) {
    alert(err.message);
  }
});

if (currentUser) {
  loadConversations();
  pollTimer = setInterval(() => {
    loadConversations();
    if (activeStudentId) loadThread();
  }, 8000);
}

window.addEventListener('beforeunload', () => {
  if (pollTimer) clearInterval(pollTimer);
});
