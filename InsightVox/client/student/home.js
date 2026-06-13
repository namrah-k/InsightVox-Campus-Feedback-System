// @ts-nocheck

const postsList = document.getElementById('posts-list');
const tabTrending = document.getElementById('tab-trending');
const tabRecent = document.getElementById('tab-recent');

let currentSort = 'trending';

async function loadPosts() {
  postsList.innerHTML = '<p class="loading-text">Loading posts...</p>';
  try {
    const { posts } = await Posts.list(currentSort);

    if (!posts.length) {
      postsList.innerHTML = `
        <div class="empty-state">
          <h3>No complaints yet</h3>
          <p>Be the first to share something that needs attention.</p>
        </div>
      `;
      return;
    }

    postsList.innerHTML = posts.map((post) => renderPostCard(post, currentUser)).join('');
  } catch (err) {
    postsList.innerHTML = `<div class="empty-state"><h3>Couldn't load posts</h3><p>${escapeHtml(err.message)}</p></div>`;
  }
}

tabTrending.addEventListener('click', () => {
  currentSort = 'trending';
  tabTrending.classList.add('active');
  tabRecent.classList.remove('active');
  loadPosts();
});

tabRecent.addEventListener('click', () => {
  currentSort = 'recent';
  tabRecent.classList.add('active');
  tabTrending.classList.remove('active');
  loadPosts();
});

bindPostCardEvents(postsList);

if (currentUser) {
  loadPosts();
}
