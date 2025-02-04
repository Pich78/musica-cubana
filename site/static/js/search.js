document.addEventListener('DOMContentLoaded', () => {
  // Initialize search
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const tagFilters = document.getElementById('tagFilters');
  const latestSongs = document.getElementById('latestSongs');
  const searchResults = document.getElementById('searchResults');

  // Load initial data
  let allSongs = [];
  let currentTags = new Set();

  // Render latest songs
  function renderLatest() {
      latestSongs.innerHTML = window.__LATEST_SONGS.map(song => `
          <article class="song-card">
              <h3><a href="${song.path}">${song.title}</a></h3>
              <div class="meta">
                  <span class="artist">${song.artist}</span>
                  <span class="year">${song.year}</span>
              </div>
              <div class="tags">${song.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
          </article>
      `).join('');
  }

  // Render tag filters
  function renderTags() {
      tagFilters.innerHTML = window.__ALL_TAGS.map(tag => `
          <button class="tag-filter ${currentTags.has(tag) ? 'active' : ''}" 
                  data-tag="${tag}"
                  onclick="toggleTag('${tag}')">
              ${tag}
          </button>
      `).join('');
  }

  // Initial render
  renderLatest();
  renderTags();

  // Search functionality
  function performSearch() {
      const query = searchInput.value.toLowerCase();
      const filtered = allSongs.filter(song => {
          const matchText = `${song.title} ${song.artist} ${song.tags.join(' ')}`.toLowerCase();
          const matchTags = currentTags.size === 0 || 
                           song.tags.some(tag => currentTags.has(tag));
          
          return matchTags && matchText.includes(query);
      });

      searchResults.innerHTML = filtered.map(song => `
          <article class="song-card">
              <h3><a href="${song.path}">${song.title}</a></h3>
              <div class="meta">
                  <span class="artist">${song.artist}</span>
                  <span class="year">${song.year}</span>
              </div>
              <div class="tags">${song.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
          </article>
      `).join('');
  }

  // Event listeners
  searchButton.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
  });

  // Tag filtering
  window.toggleTag = (tag) => {
      if (currentTags.has(tag)) {
          currentTags.delete(tag);
      } else {
          currentTags.add(tag);
      }
      renderTags();
      performSearch();
  };
});

// Initialize data from template
window.__LATEST_SONGS = {{ latest_songs|tojson }};
window.__ALL_TAGS = {{ all_tags|tojson }};