// @ts-nocheck
// Renders the top navigation bar based on the logged-in user's role.
// Each protected page should include:
//   <header class="header" id="app-header"></header>
// and set window.IV_ACTIVE_PAGE to highlight the current link (optional).

function renderNavbar() {
  const header = document.getElementById('app-header');
  if (!header) return;

  const user = getUser();
  const active = window.IV_ACTIVE_PAGE || '';

  let links = '';

  if (user && user.role === 'student') {
    links = `
      <a href="/student/home.html" class="${active === 'home' ? 'active' : ''}">
        <i class="fa-solid fa-house"></i> Home
      </a>
      <a href="/student/create-post.html" class="${active === 'create' ? 'active' : ''}">
        <i class="fa-regular fa-square-plus"></i> New Complaint
      </a>
      <a href="/student/chat.html" class="${active === 'chat' ? 'active' : ''}">
        <i class="fa-solid fa-message"></i> Messages
      </a>
      <button class="nav-link" id="logout-btn"><i class="fa-solid fa-sign-out-alt"></i> Logout</button>
    `;
  } else if (user && user.role === 'staff') {
    links = `
      <a href="/staff/dashboard.html" class="${active === 'dashboard' ? 'active' : ''}">
        <i class="fa-solid fa-list-check"></i> Complaints
      </a>
      <a href="/staff/chat.html" class="${active === 'chat' ? 'active' : ''}">
        <i class="fa-solid fa-message"></i> Messages
      </a>
      <button class="nav-link" id="logout-btn"><i class="fa-solid fa-sign-out-alt"></i> Logout</button>
    `;
  }

  header.innerHTML = `
    <div class="navbar">
      <div class="nav-brand">
        <span class="logo-dot"></span> InsightVox
        ${user ? `<span class="nav-role-badge">${escapeHtml(user.role)}</span>` : ''}
      </div>
      <ul class="nav-links">
        ${links}
        <li><button class="theme-toggle" aria-label="Toggle theme"></button></li>
      </ul>
    </div>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  initThemeToggle();
}

document.addEventListener('DOMContentLoaded', renderNavbar);
