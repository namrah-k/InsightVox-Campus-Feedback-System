// @ts-nocheck
// Renders complaint "post" cards and wires up their interactive bits
// (support/disagree votes, delete, status change). Used by both the
// student feed and the staff dashboard.

function statusLabel(status) {
  switch (status) {
    case 'in-progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    default:
      return 'Pending';
  }
}

function mediaHtml(post) {
  if (!post.mediaUrl) return '';
  const src = resolveMediaUrl(post.mediaUrl);
  if (post.mediaType === 'video') {
    return `<video class="post-media" controls src="${escapeHtml(src)}"></video>`;
  }
  return `<img class="post-media" src="${escapeHtml(src)}" alt="Complaint attachment" />`;
}

/**
 * @param {object} post - post object from the API (list or single)
 * @param {object} user - current logged-in user { id, role, ... }
 * @param {object} [opts]
 * @param {boolean} [opts.linkTitle=true] - wrap title in a link to details page
 * @param {boolean} [opts.showStatusControl=false] - show staff status dropdown
 */
function renderPostCard(post, user, opts = {}) {
  const { linkTitle = true, showStatusControl = false, fullDescription = false, extraClass = '' } = opts;

  const supports = post.supports || [];
  const disagrees = post.disagrees || [];
  const supportCount = post.supportCount !== undefined ? post.supportCount : supports.length;
  const disagreeCount = post.disagreeCount !== undefined ? post.disagreeCount : disagrees.length;
  const commentCount = post.commentCount !== undefined ? post.commentCount : 0;

  const userId = user && (user.id || user._id);
  const hasSupported = supports.some((id) => (id._id || id).toString() === userId);
  const hasDisagreed = disagrees.some((id) => (id._id || id).toString() === userId);

  const detailsUrl = `${user.role === 'staff' ? '/staff' : '/student'}/post-details.html?id=${post._id}`;

  const titleHtml = linkTitle
    ? `<a href="${detailsUrl}">${escapeHtml(post.title)}</a>`
    : escapeHtml(post.title);

  const isOwner = post.author && (post.author._id || post.author.id || post.author) == userId;
  const canDelete = isOwner || user.role === 'staff';

  const statusControl = showStatusControl
    ? `
      <select class="filter-select status-select" data-post-id="${post._id}">
        <option value="pending" ${post.status === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="in-progress" ${post.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
        <option value="resolved" ${post.status === 'resolved' ? 'selected' : ''}>Resolved</option>
      </select>
    `
    : '';

  const statusClass = `status-${post.status || 'pending'}`;
  const caseId = `VX-${(post._id || '').toString().slice(-6).toUpperCase()}`;

  return `
    <article class="post-card ${statusClass} ${extraClass}" data-post-id="${post._id}">
      <div class="post-card-header">
        <div>
          <div class="post-title">${titleHtml}</div>
          <div class="post-meta">
            <span class="case-id">${caseId}</span>
            <span class="badge badge-category">${escapeHtml(post.category || 'General')}</span>
            <span class="badge badge-status ${post.status || 'pending'}">${statusLabel(post.status)}</span>
            <span>by ${escapeHtml(post.author?.name || 'Unknown')}</span>
            <span>· ${formatTime(post.createdAt)}</span>
          </div>
        </div>
      </div>

      <p class="post-description">${escapeHtml(fullDescription ? post.description : truncate(post.description, 220))}</p>
      ${mediaHtml(post)}

      <div class="post-footer">
        <div class="vote-group">
          <button class="vote-btn support ${hasSupported ? 'active' : ''}" data-action="support" data-post-id="${post._id}">
            <i class="fa-solid fa-thumbs-up"></i> Support <span>${supportCount}</span>
          </button>
          <button class="vote-btn disagree ${hasDisagreed ? 'active' : ''}" data-action="disagree" data-post-id="${post._id}">
            <i class="fa-solid fa-thumbs-down"></i> Disagree <span>${disagreeCount}</span>
          </button>
        </div>

        <div class="post-actions">
          <a class="comment-count-link" href="${detailsUrl}">
            <i class="fa-regular fa-comment"></i> ${commentCount} comment${commentCount === 1 ? '' : 's'}
          </a>
          ${statusControl}
          ${canDelete ? `<button class="btn btn-sm btn-danger" data-action="delete" data-post-id="${post._id}"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
      </div>
    </article>
  `;
}

function truncate(text, max) {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max).trim() + '...';
}

/**
 * Wires up support/disagree/delete/status-change clicks for all post
 * cards inside `container` using event delegation, so it works even
 * after re-rendering the list.
 *
 * @param {HTMLElement} container
 * @param {object} options
 * @param {Function} [options.onDeleted] - called with postId after a successful delete
 */
function bindPostCardEvents(container, options = {}) {
  const { onDeleted } = options;

  container.addEventListener('click', async (e) => {
    const voteBtn = e.target.closest('[data-action="support"], [data-action="disagree"]');
    if (voteBtn) {
      const postId = voteBtn.dataset.postId;
      const action = voteBtn.dataset.action;
      voteBtn.disabled = true;
      try {
        const result = action === 'support' ? await Posts.support(postId) : await Posts.disagree(postId);
        const card = container.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (card) {
          const supportBtn = card.querySelector('[data-action="support"]');
          const disagreeBtn = card.querySelector('[data-action="disagree"]');
          supportBtn.querySelector('span').textContent = result.supportCount;
          disagreeBtn.querySelector('span').textContent = result.disagreeCount;
          supportBtn.classList.toggle('active', result.supported);
          disagreeBtn.classList.toggle('active', result.disagreed);
        }
      } catch (err) {
        alert(err.message);
      } finally {
        voteBtn.disabled = false;
      }
      return;
    }

    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (deleteBtn) {
      const postId = deleteBtn.dataset.postId;
      if (!confirm('Delete this post and all of its comments? This cannot be undone.')) return;
      deleteBtn.disabled = true;
      try {
        await Posts.remove(postId);
        const card = container.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (card) card.remove();
        if (onDeleted) onDeleted(postId);
      } catch (err) {
        alert(err.message);
        deleteBtn.disabled = false;
      }
      return;
    }
  });

  container.addEventListener('change', async (e) => {
    const select = e.target.closest('.status-select');
    if (!select) return;

    const postId = select.dataset.postId;
    const newStatus = select.value;
    select.disabled = true;
    try {
      await Posts.setStatus(postId, newStatus);
      const card = container.querySelector(`.post-card[data-post-id="${postId}"]`);
      if (card) {
        const badge = card.querySelector('.badge-status');
        badge.className = `badge badge-status ${newStatus}`;
        badge.textContent = statusLabel(newStatus);
        card.classList.remove('status-pending', 'status-in-progress', 'status-resolved');
        card.classList.add(`status-${newStatus}`);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      select.disabled = false;
    }
  });
}
