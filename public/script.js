// Helper: show toast message
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    if (type === 'error') toast.style.background = '#dc2626';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// API base
const API_BASE = '/api';

// Load recent links on homepage
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    fetchLinks().then(links => {
        const recent = links.slice(0, 8);
        const container = document.getElementById('recentLinks');
        if (container) {
            container.innerHTML = recent.map(link => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:shadow transition">
                    <div class="flex-1">
                        <a href="/${link.slug}" target="_blank" class="text-indigo-600 font-mono text-sm font-semibold">/${link.slug}</a>
                        <p class="text-xs text-gray-500 truncate max-w-xs">${link.original_url}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs bg-indigo-100 px-2 py-1 rounded-full">${link.clicks} clicks</span>
                        <span class="text-xs text-gray-400 ml-2">${link.category}</span>
                    </div>
                </div>
            `).join('');
        }
    }).catch(() => showToast('Failed to load recent links', 'error'));
}

// Shorten form with loading state
const form = document.getElementById('shortenForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = '⏳ Shortening...';
        btn.disabled = true;
        
        const url = document.getElementById('url').value;
        const customSlug = document.getElementById('customSlug').value;
        const category = document.getElementById('category').value;
        
        try {
            const res = await fetch(`${API_BASE}/shorten`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, customSlug, category })
            });
            const data = await res.json();
            const resultDiv = document.getElementById('result');
            if (res.ok) {
                resultDiv.innerHTML = `
                    <div class="bg-green-50 border border-green-200 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <span class="font-semibold">✅ Your short link:</span>
                            <a href="${data.shortUrl}" target="_blank" class="text-indigo-600 font-mono ml-2">${data.shortUrl}</a>
                        </div>
                        <button onclick="navigator.clipboard.writeText('${data.shortUrl}'); showToast('Copied!')" class="text-sm bg-indigo-100 px-3 py-1 rounded-full">📋 Copy</button>
                    </div>
                `;
                resultDiv.classList.remove('hidden');
                setTimeout(() => location.reload(), 2000);
            } else {
                resultDiv.innerHTML = `<div class="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700">❌ ${data.error}</div>`;
                resultDiv.classList.remove('hidden');
            }
        } catch (err) {
            showToast('Network error', 'error');
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}

// Dashboard logic
if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard.html') {
    loadDashboard();
    document.getElementById('categoryFilter').addEventListener('change', () => loadDashboard());
    document.getElementById('refreshBtn')?.addEventListener('click', () => loadDashboard());
}

async function loadDashboard() {
    const category = document.getElementById('categoryFilter').value;
    const container = document.getElementById('linksTable');
    if (!container) return;
    container.innerHTML = '<div class="text-center py-8 text-white">Loading...</div>';
    
    try {
        const links = await fetchLinks(category !== 'all' ? `?category=${category}` : '');
        
        // Update category filter dropdown options
        const allCats = [...new Set(links.map(l => l.category))];
        const filterSelect = document.getElementById('categoryFilter');
        const currentVal = filterSelect.value;
        filterSelect.innerHTML = '<option value="all">📂 All categories</option>' + 
            allCats.map(c => `<option value="${c}" ${currentVal === c ? 'selected' : ''}>📁 ${c}</option>`).join('');
        
        if (links.length === 0) {
            container.innerHTML = '<div class="text-center py-12 text-gray-500">✨ No links yet. Create your first one on the homepage!</div>';
            return;
        }
        
        container.innerHTML = `
            <table class="modern-table">
                <thead>
                    <tr><th>Short URL</th><th>Original URL</th><th>Category</th><th>Clicks</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${links.map(link => `
                        <tr>
                            <td class="font-mono text-sm"><a href="/${link.slug}" target="_blank" class="text-indigo-600 font-semibold">/${link.slug}</a></td>
                            <td class="max-w-xs truncate">${link.original_url}</td>
                            <td><span class="bg-gray-100 px-2 py-1 rounded-full text-xs">${link.category}</span></td>
                            <td class="font-bold">${link.clicks}</td>
                            <td>
                                <button onclick="editLink('${link.slug}', '${escapeHtml(link.original_url)}', '${link.category}')" class="text-blue-600 hover:underline mr-3">Edit</button>
                                <button onclick="deleteLink('${link.slug}')" class="text-red-600 hover:underline">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        container.innerHTML = '<div class="text-center py-8 text-red-200">Failed to load dashboard</div>';
        showToast('Error loading data', 'error');
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
    });
}

async function fetchLinks(query = '') {
    const res = await fetch(`${API_BASE}/links${query}`);
    if (!res.ok) throw new Error('Failed');
    return res.json();
}

window.editLink = (slug, url, category) => {
    document.getElementById('editSlug').value = slug;
    document.getElementById('editUrl').value = url;
    document.getElementById('editCategory').value = category;
    document.getElementById('editModal').style.display = 'flex';
    document.getElementById('editModal').classList.remove('hidden');
};

document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('editModal').classList.add('hidden');
});
document.getElementById('saveEdit')?.addEventListener('click', async () => {
    const slug = document.getElementById('editSlug').value;
    const original_url = document.getElementById('editUrl').value;
    const category = document.getElementById('editCategory').value;
    try {
        const res = await fetch(`${API_BASE}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, original_url, category })
        });
        if (res.ok) {
            showToast('Link updated');
            document.getElementById('editModal').style.display = 'none';
            loadDashboard();
        } else {
            showToast('Update failed', 'error');
        }
    } catch (err) {
        showToast('Error', 'error');
    }
});

window.deleteLink = async (slug) => {
    if (!confirm('Delete this link permanently?')) return;
    try {
        const res = await fetch(`${API_BASE}/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug })
        });
        if (res.ok) {
            showToast('Deleted');
            loadDashboard();
        } else {
            showToast('Delete failed', 'error');
        }
    } catch (err) {
        showToast('Error', 'error');
    }
};

// Make showToast global for copy button
window.showToast = showToast;
