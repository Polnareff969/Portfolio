document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  
  // Theme Toggle
  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  if(themeBtn) themeBtn.textContent = savedTheme === 'dark' ? 'LIGHT' : 'DARK';

  themeBtn?.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeBtn.textContent = next === 'dark' ? 'LIGHT' : 'DARK';
  });

  // Scroll Reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('reveal');
    });
  }, { threshold: 0.05 });

  // Data Fetching Logic
  const endpoints = {
    'photos-grid': '/api/photos',
    'tools-list': '/api/tools',
    'philosophy-list': '/api/philosophy',
    'misc-list': '/api/misc'
  };

  Object.entries(endpoints).forEach(([id, url]) => {
    const container = document.getElementById(id);
    if (!container) return;

    fetch(url).then(r => r.json()).then(data => {
      if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-dim">Empty collection.</p>';
        return;
      }

      if (id === 'photos-grid') {
        container.innerHTML = data.map(p => `
          <div class="photo-card">
            <img src="${p.public_url}" alt="">
            <div class="photo-caption">${p.caption || ''}</div>
          </div>
        `).join('');
        document.querySelectorAll('.photo-card').forEach(el => observer.observe(el));
      } 
      
      else if (id === 'tools-list') {
        container.innerHTML = data.map(t => `
          <div class="list-item">
            <div class="item-body">
              <h2>${t.name}</h2>
              <p>${t.description || ''}</p>
              <a href="${t.url}" target="_blank" class="item-link">Explore →</a>
            </div>
          </div>
        `).join('');
      }

      else if (id === 'philosophy-list') {
        container.innerHTML = data.map(p => `
          <div class="list-item">
            <div class="item-body">
              <h2>${p.title}</h2>
              <p>${p.content}</p>
            </div>
            <div class="item-meta">${new Date(p.created_at).toLocaleDateString(undefined, {year:'numeric', month:'short'})}</div>
          </div>
        `).join('');
      }

      else if (id === 'misc-list') {
        container.innerHTML = data.map(m => `
          <div class="list-item">
            <div class="item-body">
              <h2>${m.title}</h2>
              <p>${m.content || ''}</p>
              ${m.url ? `<a href="${m.url}" target="_blank" class="item-link">Source →</a>` : ''}
            </div>
          </div>
        `).join('');
      }
    });
  });
});
