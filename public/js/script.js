// THEME TOGGLE
const html = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

if (themeToggle) {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
}

// LOAD PHOTOS (for index.html and art.html)
const photosGrid = document.getElementById('photos-grid');
if (photosGrid) {
  fetch('/api/photos')
    .then(res => res.json())
    .then(photos => {
      if (photos.length === 0) {
        photosGrid.innerHTML = '<p style="text-align:center;padding:40px;opacity:0.6;">📭 No photos uploaded yet</p>';
        return;
      }
      photosGrid.innerHTML = photos.map(p => `
        <div class="photo-card">
          <img src="${p.public_url}" alt="${p.caption || ''}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\'background:var(--accent);width:100%;height:220px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold\'>Image Error</div>'">
          ${p.caption ? `<div class="photo-caption">${p.caption}</div>` : ''}
        </div>
      `).join('');
    })
    .catch(() => {
      photosGrid.innerHTML = '<p style="text-align:center;padding:40px;color:#6b2d2d;">Failed to load photos</p>';
    });
}