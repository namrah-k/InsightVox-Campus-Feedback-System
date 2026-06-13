// @ts-nocheck

function renderMessage(msg) {
  const senderLabel = msg.senderRole === 'staff' ? 'Staff' : 'Student';
  const sideClass = msg.senderRole === 'staff' ? 'from-staff' : 'from-student';

  return `
    <div class="message ${sideClass}">
      <div class="message-sender">${senderLabel}</div>
      <div class="message-text">
        ${msg.text ? escapeHtml(msg.text) : ''}
        ${msg.image ? `<img src="${escapeHtml(msg.image)}" alt="Attached image" />` : ''}
      </div>
      <div class="message-timestamp">${formatTime(msg.createdAt)}</div>
    </div>
  `;
}

function renderMessages(container, messages) {
  if (!messages.length) {
    container.innerHTML = '<p class="page-subtitle" style="text-align:center;">No messages yet. Say hello!</p>';
    return;
  }
  container.innerHTML = messages.map(renderMessage).join('');
  container.scrollTop = container.scrollHeight;
}

// Reads an image file and returns a base64 data URL
function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
