// Authentication JavaScript
let currentForm = 'login';
let resetToken = '';

// DOM elements
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const forgotPasswordForm = document.getElementById('forgotPasswordForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');

const loginFormElement = document.getElementById('loginFormElement');
const registerFormElement = document.getElementById('registerFormElement');
const forgotPasswordFormElement = document.getElementById('forgotPasswordFormElement');
const resetPasswordFormElement = document.getElementById('resetPasswordFormElement');

const notification = document.getElementById('notification');

// Form links
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const showForgotPasswordLink = document.getElementById('showForgotPassword');
const showLoginFromForgotLink = document.getElementById('showLoginFromForgot');
const showLoginFromResetLink = document.getElementById('showLoginFromReset');

// Utility functions
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

function showForm(formName) {
    // Hide all forms
    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    forgotPasswordForm.classList.remove('active');
    resetPasswordForm.classList.remove('active');
    
    // Show selected form
    switch(formName) {
        case 'login':
            loginForm.classList.add('active');
            break;
        case 'register':
            registerForm.classList.add('active');
            break;
        case 'forgot':
            forgotPasswordForm.classList.add('active');
            break;
        case 'reset':
            resetPasswordForm.classList.add('active');
            break;
    }
    
    currentForm = formName;
}

function clearForms() {
    // Clear all form inputs
    document.querySelectorAll('input').forEach(input => {
        input.value = '';
    });
}

// API functions
async function loginUser(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        showNotification('Login successful! Redirecting...', 'success');
        
        // Redirect to dashboard after successful login
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 1000);
        
        return data;
    } catch (error) {
        showNotification('Login failed: ' + error.message, 'error');
        throw error;
    }
}

async function registerUser(name, email, password) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }
        
        showNotification('Registration successful! Please sign in.', 'success');
        
        // Switch to login form
        setTimeout(() => {
            showForm('login');
            clearForms();
        }, 1500);
        
        return data;
    } catch (error) {
        showNotification('Registration failed: ' + error.message, 'error');
        throw error;
    }
}

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
        resetToken = data.reset_token;
        
        showNotification(`Reset token generated: ${resetToken}`, 'success');
        
        // Switch to reset password form
        setTimeout(() => {
            showForm('reset');
            document.getElementById('resetToken').value = resetToken;
        }, 2000);
        
        return data;
    } catch (error) {
        showNotification('Failed to send reset link: ' + error.message, 'error');
        throw error;
    }
}

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
        
        showNotification('Password reset successful! Please sign in.', 'success');
        
        // Switch to login form
        setTimeout(() => {
            showForm('login');
            clearForms();
        }, 1500);
        
        return data;
    } catch (error) {
        showNotification('Password reset failed: ' + error.message, 'error');
        throw error;
    }
}

// Form validation
function validatePassword(password, confirmPassword) {
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    
    if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }
    
    return true;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
    }
    return true;
}

// Event listeners
loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(loginFormElement);
    const email = formData.get('email');
    const password = formData.get('password');
    
    try {
        validateEmail(email);
        await loginUser(email, password);
    } catch (error) {
        // Error already handled in loginUser
    }
});

registerFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(registerFormElement);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    
    try {
        validateEmail(email);
        validatePassword(password, confirmPassword);
        await registerUser(name, email, password);
    } catch (error) {
        // Error already handled in registerUser
    }
});

forgotPasswordFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(forgotPasswordFormElement);
    const email = formData.get('email');
    
    try {
        validateEmail(email);
        await forgotPassword(email);
    } catch (error) {
        // Error already handled in forgotPassword
    }
});

resetPasswordFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(resetPasswordFormElement);
    const token = formData.get('token');
    const newPassword = formData.get('new_password');
    const confirmNewPassword = formData.get('confirm_new_password');
    
    try {
        validatePassword(newPassword, confirmNewPassword);
        await resetPassword(token, newPassword);
    } catch (error) {
        // Error already handled in resetPassword
    }
});

// Form navigation
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm('register');
    clearForms();
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm('login');
    clearForms();
});

showForgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm('forgot');
    clearForms();
});

showLoginFromForgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm('login');
    clearForms();
});

showLoginFromResetLink.addEventListener('click', (e) => {
    e.preventDefault();
    showForm('login');
    clearForms();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showForm('login');
    
    // Check if there's a reset token in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        showForm('reset');
        document.getElementById('resetToken').value = token;
    }
});
