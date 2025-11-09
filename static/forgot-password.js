// Forgot password page JavaScript
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const notification = document.getElementById('notification');

// Utility functions
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
    }
    return true;
}

// API function
async function forgotPassword(email) {
    try {
        const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to send reset link');
        }
        
        // Store the reset token for demo purposes
        const resetToken = data.reset_token;
        
        showNotification(`Reset token generated: ${resetToken}`, 'success');
        
        // Redirect to reset password page with token
        setTimeout(() => {
            window.location.href = `/reset-password?token=${resetToken}`;
        }, 2000);
        
        return data;
    } catch (error) {
        showNotification('Failed to send reset link: ' + error.message, 'error');
        throw error;
    }
}

// Form submission
forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(forgotPasswordForm);
    const email = formData.get('email');
    
    try {
        validateEmail(email);
        await forgotPassword(email);
    } catch (error) {
        // Error already handled in forgotPassword
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Add loading animation to form
    const form = document.querySelector('.auth-form');
    form.style.opacity = '0';
    form.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        form.style.transition = 'all 0.6s ease';
        form.style.opacity = '1';
        form.style.transform = 'translateY(0)';
    }, 300);
});
