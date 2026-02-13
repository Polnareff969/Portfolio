function showTab(tabId) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId + '-tab').classList.add('active');
    event.currentTarget.classList.add('active');
    loadAdminData(tabId);
}

async function loadAdminData(type) {
    const list = document.getElementById(`${type}-admin-list`);
    const res = await fetch(`/api/${type}`);
    const data = await res.json();
    list.innerHTML = data.map(item => `
        <div class="admin-item">
            <span>${item.title || item.name || item.filename}</span>
            <button onclick="deleteItem('${type}', ${item.id})">Delete</button>
        </div>
    `).join('');
}

async function deleteItem(type, id) {
    if (!confirm('Delete?')) return;
    await fetch(`/api/${type}/${id}`, { method: 'DELETE' });
    loadAdminData(type);
}

// Initial Load
loadAdminData('photos');

// Form Handlers
document.getElementById('photo-form').onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('photo', document.getElementById('photo-file').files[0]);
    formData.append('caption', document.getElementById('photo-caption').value);
    await fetch('/api/upload', { method: 'POST', body: formData });
    location.reload();
};

document.getElementById('tool-form').onsubmit = async (e) => {
    e.preventDefault();
    const body = {
        name: document.getElementById('tool-name').value,
        url: document.getElementById('tool-url').value,
        description: document.getElementById('tool-desc').value
    };
    await fetch('/api/tools', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body) 
    });
    location.reload();
};

document.getElementById('philosophy-form').onsubmit = async (e) => {
    e.preventDefault();
    const body = {
        title: document.getElementById('philosophy-title').value,
        content: document.getElementById('philosophy-content').value
    };
    await fetch('/api/philosophy', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body) 
    });
    location.reload();
};

document.getElementById('misc-form').onsubmit = async (e) => {
    e.preventDefault();
    const body = {
        title: document.getElementById('misc-title').value,
        content: document.getElementById('misc-content').value,
        url: document.getElementById('misc-url').value
    };
    await fetch('/api/misc', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body) 
    });
    location.reload();
};
