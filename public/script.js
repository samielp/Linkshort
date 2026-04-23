// Helper for API calls
const API_BASE = '/api';

// Load recent links on homepage
if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    fetchLinks().then(links => {
        const recent = links.slice(0, 10);
        const container = document.getElementById('recentLinks');
        container.innerHTML = recent.map(link => `
            <div class="border-b pb-2">
                <a href="/${link.slug}" target="_blank" class="text-indigo-600">${window.location.origin}/${link.slug}</a>
                <p class="text-sm text-gray-500">${link.original_url.substring(0, 80)}... (${link.clicks} clicks) – ${link.category}</p>
            </div>
        `).join('');
    });
}

// Shorten form
const form = document.getElementById('shortenForm');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('url').value;
        const customSlug = document.getElementById('customSlug').value;
        const category = document.getElementById('category').value;
        const res = await fetch(`${API_BASE}/shorten`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, customSlug, category })
        });
        const data = await res.json();
        const resultDiv = document.getElementById('result');
        if (res.ok) {
            resultDiv.innerHTML = `<div class="bg-green-100 p-3 rounded">✅ Short URL: <a href="${data.shortUrl}" target="_blank" class="text-indigo-600">${data.shortUrl}</a></div>`;
            resultDiv.classList.remove('hidden');
            setTimeout(() => location.reload(), 1500);
        } else {
            resultDiv.innerHTML = `<div class="bg-red-100 p-3 rounded">❌ Error: ${data.error}</div>`;
            resultDiv.classList.remove('hidden');
        }
    });
}

// Dashboard: load links & categories
if (window.location.pathname === '/dashboard' || window.location.pathname === '/dashboard.html') {
    loadDashboard();
    document.getElementById('categoryFilter').addEventListener('change', () => loadDashboard());
}

async function loadDashboard() {
    const category = document.getElementById('categoryFilter').value;
    const links = await fetchLinks(category !== 'all' ? `?category=${category}` : '');
    const container = document.getElementById('linksTable');
    if (!container) return;
    
    // Update category filter dropdown
    const allCats = [...new Set(links.map(l => l.category))];
    const filterSelect = document.getElementById('categoryFilter');
    const currentVal = filterSelect.value;
    filterSelect.innerHTML = '<option value="all">All categories</option>' + allCats.map(c => `<option value="${c}" ${currentVal === c ? 'selected' : ''}>${c}</option>`).join('');
    
    container.innerHTML = `
        <table class="min-w-full bg-white">
            <thead>
                <tr><th class="py-2 px-4 border-b">Short URL</th><th class="py-2 px-4 border-b">Original URL</th><th class="py-2 px-4 border-b">Category</th><th class="py-2 px-4 border-b">Clicks</th><th class="py-2 px-4 border-b">Actions</th></tr>
            </thead>
            <tbody>
                ${links.map(link => `
                    <tr>
                        <td class="py-2 px-4 border-b"><a href="/${link.slug}" target="_blank" class="text-indigo-600">/${link.slug}</a></td>
                        <td class="py-2 px-4 border-b truncate max-w-xs">${link.original_url}</td>
                        <td class="py-2 px-4 border-b">${link.category}</td>
                        <td class="py-2 px-4 border-b">${link.clicks}</td>
                        <td class="py-2 px-4 border-b">
                            <button onclick="editLink('${link.slug}', '${link.original_url}', '${link.category}')" class="text-blue-600 mr-2">Edit</button>
                            <button onclick="deleteLink('${link.slug}')" class="text-red-600">Delete</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function fetchLinks(query = '') {
    const res = await fetch(`${API_BASE}/links${query}`);
    return res.json();
}

window.editLink = (slug, url, category) => {
    document.getElementById('editSlug').value = slug;
    document.getElementById('editUrl').value = url;
    document.getElementById('editCategory').value = category;
    document.getElementById('editModal').classList.remove('hidden');
    document.getElementById('editModal').style.display = 'flex';
};

document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('editModal').classList.add('hidden');
});
document.getElementById('saveEdit')?.addEventListener('click', async () => {
    const slug = document.getElementById('editSlug').value;
    const original_url = document.getElementById('editUrl').value;
    const category = document.getElementById('editCategory').value;
    const res = await fetch(`${API_BASE}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, original_url, category })
    });
    if (res.ok) {
        alert('Updated successfully');
        document.getElementById('editModal').classList.add('hidden');
        loadDashboard();
    } else {
        alert('Update failed');
    }
});

window.deleteLink = async (slug) => {
    if (!confirm('Delete this link?')) return;
    const res = await fetch(`${API_BASE}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
    });
    if (res.ok) {
        loadDashboard();
    } else {
        alert('Delete failed');
    }
};
