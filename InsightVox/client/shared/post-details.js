// @ts-nocheck
// Shared logic for the post-details page (used by both /student and /staff
// versions). Expects `currentUser` to already be set on the page via
// requireRole(), and a #post-detail / #comments-list / #comment-form
// to exist in the DOM.

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

const postDetailEl = document.getElementById('post-detail');
const commentsListEl = document.getElementById('comments-list');
const commentFormEl = document.getElementById('comment-form');
const commentTextEl = document.getElementById('comment-text');
const commentErrorEl = document.getElementById('comment-error');

function backUrl() {
  return currentUser.role === 'staff' ? '/staff/dashboard.html' : '/student/home.html';
}

function renderComment(comment) {
  const canDelete = currentUser.role === 'staff' ||
    (comment.author && (comment.author._id || comment.author.id) == (currentUser.id || currentUser._id));

  const roleBadge = comment.author && comment.author.role === 'staff'
    ? '<span class="badge badge-category">Staff</span>'
    : '';

  return `
    <div class="comment" data-comment-id="${comment._id}">
      <div class="comment-header">
        <span class="comment-author">${escapeHtml(comment.author?.name || 'Unknown')} ${roleBadge}</span>
        <span class="comment-time">${formatTime(comment.createdAt)}</span>
      </div>
      <p class="comment-text">${escapeHtml(comment.text)}</p>
      ${canDelete ? `<button class="comment-delete" data-comment-id="${comment._id}">Delete</button>` : ''}
    </div>
  `;
}

async function loadPost() {
  if (!postId) {
    postDetailEl.innerHTML = `<div class="empty-state"><h3>No post specified</h3><a href="${backUrl()}">Go back</a></div>`;
    commentFormEl.classList.add('hidden');
    return;
  }

  try {
    const { post, comments } = await Posts.get(postId);

    postDetailEl.innerHTML = renderPostCard(post, currentUser, {
      linkTitle: false,
      showStatusControl: currentUser.role === 'staff',
      fullDescription: true,
      extraClass: 'post-detail-card',
    });

    if (comments.length) {
      commentsListEl.innerHTML = comments.map(renderComment).join('');
    } else {
      commentsListEl.innerHTML = '<p class="page-subtitle">No comments yet. Be the first to respond.</p>';
    }
  } catch (err) {
    postDetailEl.innerHTML = `<div class="empty-state"><h3>Couldn't load post</h3><p>${escapeHtml(err.message)}</p></div>`;
    commentFormEl.classList.add('hidden');
  }
}

bindPostCardEvents(postDetailEl, {
  onDeleted: () => {
    window.location.href = backUrl();
  },
});

commentFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  commentErrorEl.textContent = '';
  const text = commentTextEl.value.trim();
  if (!text) return;

  const submitBtn = commentFormEl.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const { comment } = await Comments.add(postId, text);

    if (commentsListEl.querySelector('.page-subtitle')) {
      commentsListEl.innerHTML = '';
    }
    commentsListEl.insertAdjacentHTML('beforeend', renderComment(comment));
    commentTextEl.value = '';

    // update comment count on the card
    const countLink = postDetailEl.querySelector('.comment-count-link');
    if (countLink) {
      const current = commentsListEl.querySelectorAll('.comment').length;
      countLink.innerHTML = `<i class="fa-regular fa-comment"></i> ${current} comment${current === 1 ? '' : 's'}`;
    }
  } catch (err) {
    commentErrorEl.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

commentsListEl.addEventListener('click', async (e) => {
  const delBtn = e.target.closest('.comment-delete');
  if (!delBtn) return;

  if (!confirm('Delete this comment?')) return;

  const commentId = delBtn.dataset.commentId;
  delBtn.disabled = true;

  try {
    await Comments.remove(commentId);
    const el = commentsListEl.querySelector(`.comment[data-comment-id="${commentId}"]`);
    if (el) el.remove();

    if (!commentsListEl.querySelector('.comment')) {
      commentsListEl.innerHTML = '<p class="page-subtitle">No comments yet. Be the first to respond.</p>';
    }

    const countLink = postDetailEl.querySelector('.comment-count-link');
    if (countLink) {
      const current = commentsListEl.querySelectorAll('.comment').length;
      countLink.innerHTML = `<i class="fa-regular fa-comment"></i> ${current} comment${current === 1 ? '' : 's'}`;
    }
  } catch (err) {
    alert(err.message);
    delBtn.disabled = false;
  }
});

if (currentUser) {
  loadPost();
}
