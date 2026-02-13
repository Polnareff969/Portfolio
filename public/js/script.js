document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle
    const html = document.documentElement;
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    html.setAttribute('data-theme', savedTheme);
    if(themeBtn) themeBtn.textContent = savedTheme === 'dark' ? 'Light' : 'Dark';

    themeBtn?.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        themeBtn.textContent = next === 'dark' ? 'Light' : 'Dark';
    });

    // 2. Observer for Fade-in
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
            }
        });
    }, { threshold: 0.1 });

    // 3. Dynamic Data Loading
    const photosGrid = document.getElementById('photos-grid');
    const toolsGrid = document.getElementById('tools-grid');
    const philContainer = document.getElementById('philosophy-container');

    // Load Photos (Index & Art)
    if (photosGrid) {
        fetch('/api/photos').then(r => r.json()).then(data => {
            photosGrid.innerHTML = data.map(p => `
                <div class="photo-card">
                    <img src="${p.public_url}" loading="lazy">
                    <div class="photo-caption">${p.caption || ''}</div>
                </div>
            `).join('');
            document.querySelectorAll('.photo-card').forEach(el => observer.observe(el));
        });
    }

    // Load Tools
    if (toolsGrid) {
        fetch('/api/tools').then(r => r.json()).then(data => {
            toolsGrid.innerHTML = data.map(t => `
                <div class="list-item">
                    <div class="item-body">
                        <h3>${t.name}</h3>
                        <p>${t.description || ''}</p>
                    </div>
                    <div class="item-meta">
                        <a href="${t.url}" class="item-link">Visit →</a>
                    </div>
                </div>
            `).join('');
        });
    }

    // Load Philosophy
    if (philContainer) {
        fetch('/api/philosophy').then(r => r.json()).then(data => {
            philContainer.innerHTML = data.map(p => `
                <article class="list-item">
                    <div class="item-body">
                        <h2>${p.title}</h2>
                        <p>${p.content}</p>
                    </div>
                    <div class="item-meta">${new Date(p.created_at).toLocaleDateString()}</div>
                </article>
            `).join('');
        });
    }
});
