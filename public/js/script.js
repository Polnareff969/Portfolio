document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  
  // Theme Handler
  const setDisplayTheme = (theme) => {
    html.setAttribute('data-theme', theme);
    themeBtn.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('theme', theme);
  }

  setDisplayTheme(localStorage.getItem('theme') || 'dark');

  themeBtn?.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setDisplayTheme(next);
  });

  // Dynamic Content Loading
  const loadContent = (id, url, renderer) => {
    const el = document.getElementById(id);
    if (!el) return;

    fetch(url).then(r => r.json()).then(data => {
      if (!data.length) {
        el.innerHTML = `<div style="padding: 100px 0; opacity: 0.3">No entries found in ${id.replace('-',' ')}.</div>`;
        return;
      }
      el.innerHTML = data.map(renderer).join('');
    });
  };

  // Renderers
  loadContent('photos-grid', '/api/photos', p => `
    <div class="photo-card">
      <img src="${p.public_url}">
      <div style="margin-top:15px; font-size:0.8rem">${p.caption || ''}</div>
    </div>
  `);

  loadContent('philosophy-list', '/api/philosophy', p => `
    <div class="list-item">
      <div class="item-meta">${new Date(p.created_at).getFullYear()}</div>
      <div class="item-body">
        <h2>${p.title}</h2>
        <p>${p.content}</p>
      </div>
    </div>
  `);

  loadContent('tools-list', '/api/tools', t => `
    <div class="list-item">
      <div class="item-meta">Utility</div>
      <div class="item-body">
        <h2>${t.name}</h2>
        <p>${t.description}</p>
        <a href="${t.url}" style="color:var(--text); font-size:0.8rem; text-decoration:none; border-bottom:1px solid">Link ↗</a>
      </div>
    </div>
  `);
});
