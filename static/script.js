// Global variables
let campaigns = [];
let filteredCampaigns = [];
let currentUser = null;

// DOM elements
const campaignForm = document.getElementById('campaignForm');
const campaignsList = document.getElementById('campaignsList');
const loadingMessage = document.getElementById('loadingMessage');
const noCampaignsMessage = document.getElementById('noCampaignsMessage');
const statusFilter = document.getElementById('statusFilter');
const searchInput = document.getElementById('searchInput');
const clearFiltersBtn = document.getElementById('clearFilters');
const editModal = document.getElementById('editModal');
const deleteModal = document.getElementById('deleteModal');
const editForm = document.getElementById('editForm');
const notification = document.getElementById('notification');

// Dashboard elements
const totalCampaignsEl = document.getElementById('totalCampaigns');
const activeCampaignsEl = document.getElementById('activeCampaigns');
const pausedCampaignsEl = document.getElementById('pausedCampaigns');
const completedCampaignsEl = document.getElementById('completedCampaigns');

// Authentication functions
async function checkAuth() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            currentUser = await response.json();
            updateUserInfo();
            return true;
        } else {
            window.location.href = '/';
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/';
        return false;
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

function updateUserInfo() {
    if (currentUser) {
        // Update header with user info
        const header = document.querySelector('header h1');
        if (header) {
            header.innerHTML = `
                <i class="fas fa-chart-line"></i> Campaign Tracker
                <div class="user-info">
                    <span>Welcome, ${currentUser.name}</span>
                    <button onclick="logout()" class="btn btn-small btn-secondary">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            `;
        }
    }
}

// API functions
async function fetchCampaigns() {
    try {
        const response = await fetch('/api/campaigns');
        if (!response.ok) throw new Error('Failed to fetch campaigns');
        campaigns = await response.json();
        filteredCampaigns = [...campaigns];
        renderCampaigns();
        updateDashboard();
    } catch (error) {
        showNotification('Error loading campaigns: ' + error.message, 'error');
    }
}

async function addCampaign(campaignData) {
    try {
        const response = await fetch('/api/campaigns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(campaignData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add campaign');
        }
        
        const newCampaign = await response.json();
        campaigns.push(newCampaign);
        applyFilters();
        showNotification('Campaign added successfully!', 'success');
        return newCampaign;
    } catch (error) {
        showNotification('Error adding campaign: ' + error.message, 'error');
        throw error;
    }
}

async function updateCampaign(campaignId, status) {
    try {
        const response = await fetch(`/api/campaigns/${campaignId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update campaign');
        }
        
        const updatedCampaign = await response.json();
        const index = campaigns.findIndex(c => c.id === campaignId);
        if (index !== -1) {
            campaigns[index] = updatedCampaign;
        }
        applyFilters();
        showNotification('Campaign status updated successfully!', 'success');
        return updatedCampaign;
    } catch (error) {
        showNotification('Error updating campaign: ' + error.message, 'error');
        throw error;
    }
}

async function deleteCampaign(campaignId) {
    try {
        const response = await fetch(`/api/campaigns/${campaignId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete campaign');
        }
        
        campaigns = campaigns.filter(c => c.id !== campaignId);
        applyFilters();
        showNotification('Campaign deleted successfully!', 'success');
    } catch (error) {
        showNotification('Error deleting campaign: ' + error.message, 'error');
        throw error;
    }
}

async function fetchDashboard() {
    try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching dashboard:', error);
        return null;
    }
}

// UI functions
function renderCampaigns() {
    loadingMessage.style.display = 'none';
    
    if (filteredCampaigns.length === 0) {
        campaignsList.innerHTML = '';
        noCampaignsMessage.style.display = 'block';
        return;
    }
    
    noCampaignsMessage.style.display = 'none';
    
    campaignsList.innerHTML = filteredCampaigns.map(campaign => `
        <div class="campaign-card" data-id="${campaign.id}">
            <div class="campaign-header">
                <h3 class="campaign-name">${escapeHtml(campaign.name)}</h3>
                <span class="campaign-status status-${campaign.status.toLowerCase()}">${campaign.status}</span>
            </div>
            <div class="campaign-details">
                <div class="detail-item">
                    <i class="fas fa-user"></i>
                    <span>${escapeHtml(campaign.client)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(campaign.start_date)}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span>Created: ${formatDate(campaign.created_at)}</span>
                </div>
            </div>
            <div class="campaign-actions">
                <button class="btn btn-small btn-primary" onclick="openEditModal('${campaign.id}', '${campaign.status}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-small btn-danger" onclick="openDeleteModal('${campaign.id}', '${campaign.name}', '${campaign.client}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function updateDashboard() {
    const active = campaigns.filter(c => c.status === 'Active').length;
    const paused = campaigns.filter(c => c.status === 'Paused').length;
    const completed = campaigns.filter(c => c.status === 'Completed').length;
    
    totalCampaignsEl.textContent = campaigns.length;
    activeCampaignsEl.textContent = active;
    pausedCampaignsEl.textContent = paused;
    completedCampaignsEl.textContent = completed;
}

function applyFilters() {
    filteredCampaigns = campaigns.filter(campaign => {
        const statusMatch = !statusFilter.value || campaign.status === statusFilter.value;
        const searchMatch = !searchInput.value || 
            campaign.name.toLowerCase().includes(searchInput.value.toLowerCase()) ||
            campaign.client.toLowerCase().includes(searchInput.value.toLowerCase());
        
        return statusMatch && searchMatch;
    });
    
    renderCampaigns();
}

function openEditModal(campaignId, currentStatus) {
    document.getElementById('editCampaignId').value = campaignId;
    document.getElementById('editStatus').value = currentStatus;
    editModal.style.display = 'block';
}

function openDeleteModal(campaignId, campaignName, clientName) {
    document.getElementById('confirmDelete').dataset.campaignId = campaignId;
    document.getElementById('deleteCampaignPreview').innerHTML = `
        <strong>${escapeHtml(campaignName)}</strong><br>
        <small>Client: ${escapeHtml(clientName)}</small>
    `;
    deleteModal.style.display = 'block';
}

function closeModals() {
    editModal.style.display = 'none';
    deleteModal.style.display = 'none';
}

function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Event listeners
campaignForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(campaignForm);
    const campaignData = {
        name: formData.get('name'),
        client: formData.get('client'),
        start_date: formData.get('start_date'),
        status: formData.get('status')
    };
    
    try {
        await addCampaign(campaignData);
        campaignForm.reset();
    } catch (error) {
        // Error already handled in addCampaign
    }
});

editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const campaignId = document.getElementById('editCampaignId').value;
    const status = document.getElementById('editStatus').value;
    
    try {
        await updateCampaign(campaignId, status);
        closeModals();
    } catch (error) {
        // Error already handled in updateCampaign
    }
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
    const campaignId = document.getElementById('confirmDelete').dataset.campaignId;
    
    try {
        await deleteCampaign(campaignId);
        closeModals();
    } catch (error) {
        // Error already handled in deleteCampaign
    }
});

document.getElementById('cancelEdit').addEventListener('click', closeModals);
document.getElementById('cancelDelete').addEventListener('click', closeModals);

statusFilter.addEventListener('change', applyFilters);
searchInput.addEventListener('input', applyFilters);

clearFiltersBtn.addEventListener('click', () => {
    statusFilter.value = '';
    searchInput.value = '';
    applyFilters();
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeModals();
    }
    if (e.target === deleteModal) {
        closeModals();
    }
});

// Close modals with X button
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', closeModals);
});

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const isAuthenticated = await checkAuth();
    if (!isAuthenticated) {
        return;
    }
    
    fetchCampaigns();
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
});