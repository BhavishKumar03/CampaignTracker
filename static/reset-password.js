// Reset password page JavaScript
const resetPasswordForm = document.getElementById('resetPasswordForm');
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

function validatePassword(password, confirmPassword) {
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    
    if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }
    
    return true;
}

// API function
async function resetPassword(token, newPassword) {
    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, new_password: newPassword })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Password reset failed');
        }
        
        showNotification('Password reset successful! Redirecting to login...', 'success');
        
        // Redirect to login page after successful reset
        setTimeout(() => {
            window.location.href = '/';
        }, 1500);
        
        return data;
    } catch (error) {
        showNotification('Password reset failed: ' + error.message, 'error');
        throw error;
    }
}

// Password toggle functions
function togglePassword() {
    const passwordInput = document.getElementById('newPassword');
    const toggleButton = document.querySelector('.password-toggle i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.classList.remove('fa-eye');
        toggleButton.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleButton.classList.remove('fa-eye-slash');
        toggleButton.classList.add('fa-eye');
    }
}

function toggleConfirmPassword() {
    const passwordInput = document.getElementById('confirmPassword');
    const toggleButton = document.querySelectorAll('.password-toggle i')[1];
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.classList.remove('fa-eye');
        toggleButton.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleButton.classList.remove('fa-eye-slash');
        toggleButton.classList.add('fa-eye');
    }
}

// Form submission
resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(resetPasswordForm);
    const token = formData.get('token');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_new_password');
    
    try {
        validatePassword(newPassword, confirmPassword);
        await resetPassword(token, newPassword);
    } catch (error) {
        // Error already handled in resetPassword
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
    
    // Check if there's a reset token in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        document.getElementById('token').value = token;
    }
});
