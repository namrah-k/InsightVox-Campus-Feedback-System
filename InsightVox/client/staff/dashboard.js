// @ts-nocheck

const postsList = document.getElementById('posts-list');
const tabTrending = document.getElementById('tab-trending');
const tabRecent = document.getElementById('tab-recent');
const statusFilter = document.getElementById('status-filter');

let currentSort = 'trending';

async function loadPosts() {
  postsList.innerHTML = '<p class="loading-text">Loading posts...</p>';
  try {
    const { posts } = await Posts.list(currentSort, statusFilter.value);

    if (!posts.length) {
      postsList.innerHTML = `
        <div class="empty-state">
          <h3>No complaints found</h3>
          <p>Try a different filter, or check back later.</p>
        </div>
      `;
      return;
    }

    postsList.innerHTML = posts
      .map((post) => renderPostCard(post, currentUser, { showStatusControl: true }))
      .join('');
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

statusFilter.addEventListener('change', loadPosts);

bindPostCardEvents(postsList);

if (currentUser) {
  loadPosts();
}
