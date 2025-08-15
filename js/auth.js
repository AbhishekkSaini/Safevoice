// Authentication handling
import { signIn, signUp, signOut, onAuthStateChange, showNotification } from './supabase-client.js';

// Initialize auth handling
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthHandlers();
    
    // Listen for auth state changes
    onAuthStateChange((user, event) => {
        if (event === 'SIGNED_IN') {
            showNotification('Welcome back!', 'success');
        } else if (event === 'SIGNED_OUT') {
            showNotification('Logged out successfully', 'success');
        }
    });
});

function initializeAuthHandlers() {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Logout button handler
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navigation auth buttons
    const loginBtns = document.querySelectorAll('#loginBtn, #mobileLoginBtn');
    const signupBtns = document.querySelectorAll('#signupBtn, #mobileSignupBtn');
    
    loginBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    });
    
    signupBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = 'signup.html';
        });
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Show loading state
    submitBtn.textContent = 'Signing In...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await signIn(email, password);
        
        if (error) {
            throw error;
        }
        
        showNotification('Login successful!', 'success');
        
        // Redirect to dashboard or home
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message || 'Login failed', 'error');
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const form = e.target;
    const firstName = form.firstName.value;
    const lastName = form.lastName.value;
    const email = form.email.value;
    const phone = form.phone.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }
    
    // Validate password strength
    if (!isPasswordStrong(password)) {
        showNotification('Password must be at least 8 characters with uppercase and number', 'error');
        return;
    }
    
    // Show loading state
    submitBtn.textContent = 'Creating Account...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await signUp(email, password, {
            first_name: firstName,
            last_name: lastName,
            phone: phone
        });
        
        if (error) {
            throw error;
        }
        
        showNotification('Account created successfully! Please check your email for verification.', 'success');
        
        // Redirect to login
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('Signup error:', error);
        showNotification(error.message || 'Signup failed', 'error');
        
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function handleLogout() {
    try {
        const { error } = await signOut();
        
        if (error) {
            throw error;
        }
        
        // Redirect to home page
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

function isPasswordStrong(password) {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /\d/.test(password);
}

// Password strength indicator for signup page
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordStrength);
    }
});

function updatePasswordStrength() {
    const password = document.getElementById('password').value;
    const length = document.getElementById('length');
    const uppercase = document.getElementById('uppercase');
    const number = document.getElementById('number');
    
    if (!length || !uppercase || !number) return;
    
    // Check length
    updateRequirement(length, password.length >= 8, '8+ characters');
    
    // Check uppercase
    updateRequirement(uppercase, /[A-Z]/.test(password), 'Uppercase');
    
    // Check number
    updateRequirement(number, /\d/.test(password), 'Number');
}

function updateRequirement(element, isValid, text) {
    const icon = isValid ? 'check' : 'x';
    const colorClass = isValid ? 'text-green-500' : 'text-red-500';
    
    element.innerHTML = `<i data-lucide="${icon}" class="w-3 h-3 ${colorClass} mr-1"></i><span class="${colorClass}">${text}</span>`;
    
    // Re-initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}