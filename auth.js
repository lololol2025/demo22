/* WabbleNews - Shared Auth Component */
/* =================================== */

// Session Management
function validateSession() {
    const sessionData = localStorage.getItem('wabblenews_session_token');
    if (!sessionData) return false;
    try {
        const session = JSON.parse(sessionData);
        const expiresAt = new Date(session.expiresAt);
        if (expiresAt < new Date()) {
            handleLogout();
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

function generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function createSession(username) {
    const token = generateSessionToken();
    const sessionData = {
        username: username.toLowerCase(),
        token: token,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    localStorage.setItem('wabblenews_session_token', JSON.stringify(sessionData));
    localStorage.setItem('wabblenews_current_user', username.toLowerCase());
    return token;
}

// Password Hashing
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Username Validation
function validateUsername(username) {
    if (username.startsWith('_')) {
        return { valid: false, error: 'Username cannot start with underscore' };
    }
    if (!/^[a-zA-Z0-9.]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, and dots' };
    }
    if (username.length < 3) {
        return { valid: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
        return { valid: false, error: 'Username must be less than 20 characters' };
    }
    return { valid: true };
}

function usernameExists(username) {
    const accounts = JSON.parse(localStorage.getItem('wabblenews_accounts') || '{}');
    return accounts.hasOwnProperty(username.toLowerCase());
}

// Login Status Check
function checkLoginStatus() {
    if (!validateSession()) {
        const signUpBtn = document.getElementById('signUpBtn');
        const profileBtn = document.getElementById('profileBtn');
        if (signUpBtn) signUpBtn.classList.remove('hidden');
        if (profileBtn) profileBtn.classList.add('hidden');
        return;
    }
    
    const currentUser = localStorage.getItem('wabblenews_current_user');
    if (currentUser) {
        const signUpBtn = document.getElementById('signUpBtn');
        const profileBtn = document.getElementById('profileBtn');
        if (signUpBtn) signUpBtn.classList.add('hidden');
        if (profileBtn) profileBtn.classList.remove('hidden');
        loadProfileData();
    }
}

// Modal Functions
function openAuthModal(mode = 'signup') {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (mode === 'signin') {
            switchToSignIn();
        } else {
            switchToSignUp();
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        const signupForm = document.getElementById('signupForm');
        const signinForm = document.getElementById('signinForm');
        const successMessage = document.getElementById('successMessage');
        if (signupForm) signupForm.reset();
        if (signinForm) signinForm.reset();
        if (successMessage) successMessage.classList.remove('show');
        clearAllErrors();
    }
}

function switchToSignIn() {
    const authContent = document.getElementById('authContent');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const toggleToSignIn = document.getElementById('toggleToSignIn');
    const toggleToSignUp = document.getElementById('toggleToSignUp');
    
    if (authContent) {
        authContent.classList.remove('signup-mode');
        authContent.classList.add('signin-mode');
    }
    if (authTitle) authTitle.textContent = 'Welcome Back';
    if (authSubtitle) authSubtitle.textContent = 'Sign in to your account';
    if (toggleToSignIn) toggleToSignIn.style.display = 'none';
    if (toggleToSignUp) toggleToSignUp.style.display = 'block';
    clearAllErrors();
}

function switchToSignUp() {
    const authContent = document.getElementById('authContent');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const toggleToSignIn = document.getElementById('toggleToSignIn');
    const toggleToSignUp = document.getElementById('toggleToSignUp');
    
    if (authContent) {
        authContent.classList.remove('signin-mode');
        authContent.classList.add('signup-mode');
    }
    if (authTitle) authTitle.textContent = 'Join WabbleNews';
    if (authSubtitle) authSubtitle.textContent = 'Create your account to stay updated';
    if (toggleToSignIn) toggleToSignIn.style.display = 'block';
    if (toggleToSignUp) toggleToSignUp.style.display = 'none';
    clearAllErrors();
}

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
}

// Sign Up Handler
async function handleSignUp(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const signupBtn = document.getElementById('signupSubmitBtn');
    const successMessage = document.getElementById('successMessage');
    
    clearAllErrors();
    if (successMessage) successMessage.classList.remove('show');
    
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        if (usernameError) {
            usernameError.textContent = usernameValidation.error;
            usernameError.classList.add('show');
        }
        return;
    }
    
    if (usernameExists(username)) {
        if (usernameError) {
            usernameError.textContent = 'Username already taken';
            usernameError.classList.add('show');
        }
        return;
    }
    
    if (password.length < 8) {
        if (passwordError) {
            passwordError.textContent = 'Password must be at least 8 characters';
            passwordError.classList.add('show');
        }
        return;
    }
    
    if (password !== confirmPassword) {
        if (confirmPasswordError) {
            confirmPasswordError.textContent = 'Passwords do not match';
            confirmPasswordError.classList.add('show');
        }
        return;
    }
    
    if (signupBtn) {
        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating Account...';
    }
    
    try {
        const hashedPassword = await hashPassword(password);
        const accounts = JSON.parse(localStorage.getItem('wabblenews_accounts') || '{}');
        
        accounts[username.toLowerCase()] = {
            username: username,
            passwordHash: hashedPassword,
            createdAt: new Date().toISOString(),
            profile: { name: '', bio: '', picture: '' }
        };
        
        localStorage.setItem('wabblenews_accounts', JSON.stringify(accounts));
        createSession(username);
        checkLoginStatus();
        
        if (successMessage) successMessage.classList.add('show');
        if (signupBtn) {
            signupBtn.textContent = 'Success!';
            signupBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        }
        
        setTimeout(() => {
            closeAuthModal();
            if (signupBtn) {
                signupBtn.disabled = false;
                signupBtn.textContent = 'Join Now';
                signupBtn.style.background = '';
            }
        }, 1500);
        
    } catch (error) {
        console.error('Error signing up:', error);
        if (signupBtn) {
            signupBtn.disabled = false;
            signupBtn.textContent = 'Join Now';
        }
    }
}

// Sign In Handler
async function handleSignIn(event) {
    event.preventDefault();
    
    const username = document.getElementById('signinUsername').value.trim();
    const password = document.getElementById('signinPassword').value;
    const usernameError = document.getElementById('signinUsernameError');
    const passwordError = document.getElementById('signinPasswordError');
    const signinBtn = document.getElementById('signinSubmitBtn');
    
    clearAllErrors();
    
    if (!username) {
        if (usernameError) {
            usernameError.textContent = 'Username is required';
            usernameError.classList.add('show');
        }
        return;
    }
    
    if (!password) {
        if (passwordError) {
            passwordError.textContent = 'Password is required';
            passwordError.classList.add('show');
        }
        return;
    }
    
    if (!usernameExists(username)) {
        if (usernameError) {
            usernameError.textContent = 'Username not found';
            usernameError.classList.add('show');
        }
        return;
    }
    
    if (signinBtn) {
        signinBtn.disabled = true;
        signinBtn.textContent = 'Signing In...';
    }
    
    try {
        const hashedPassword = await hashPassword(password);
        const accounts = JSON.parse(localStorage.getItem('wabblenews_accounts') || '{}');
        const account = accounts[username.toLowerCase()];
        
        if (!account || account.passwordHash !== hashedPassword) {
            if (passwordError) {
                passwordError.textContent = 'Incorrect password';
                passwordError.classList.add('show');
            }
            if (signinBtn) {
                signinBtn.disabled = false;
                signinBtn.textContent = 'Sign In';
            }
            return;
        }
        
        createSession(username);
        checkLoginStatus();
        
        if (signinBtn) {
            signinBtn.textContent = 'Success!';
            signinBtn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        }
        
        setTimeout(() => {
            closeAuthModal();
            if (signinBtn) {
                signinBtn.disabled = false;
                signinBtn.textContent = 'Sign In';
                signinBtn.style.background = '';
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error signing in:', error);
        if (signinBtn) {
            signinBtn.disabled = false;
            signinBtn.textContent = 'Sign In';
        }
    }
}

// Profile Functions
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadProfileData();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function loadProfileData() {
    const currentUser = localStorage.getItem('wabblenews_current_user');
    if (!currentUser) return;
    
    const accounts = JSON.parse(localStorage.getItem('wabblenews_accounts') || '{}');
    const account = accounts[currentUser];
    
    if (account) {
        const usernameInput = document.getElementById('profileUsername');
        if (usernameInput) usernameInput.value = account.username || currentUser;
        
        if (account.profile) {
            const bio = document.getElementById('profileBio');
            if (bio) bio.value = account.profile.bio || '';
            
            const preview = document.getElementById('profilePicturePreview');
            const icon = document.getElementById('profilePictureIcon');
            
            if (account.profile.picture) {
                if (preview) {
                    preview.src = account.profile.picture;
                    preview.style.display = 'block';
                }
                if (icon) icon.style.display = 'none';
            } else {
                if (preview) preview.style.display = 'none';
                if (icon) icon.style.display = 'block';
            }
        }
        
        updateHeaderProfilePicture(account.profile?.picture);
    }
}

function updateHeaderProfilePicture(pictureUrl) {
    const headerImg = document.getElementById('headerProfileImg');
    const headerIcon = document.getElementById('headerProfileIcon');
    
    if (pictureUrl) {
        if (headerImg) {
            headerImg.src = pictureUrl;
            headerImg.style.display = 'block';
        }
        if (headerIcon) headerIcon.style.display = 'none';
    } else {
        if (headerImg) headerImg.style.display = 'none';
        if (headerIcon) headerIcon.style.display = 'block';
    }
}

function handleLogout() {
    localStorage.removeItem('wabblenews_current_user');
    localStorage.removeItem('wabblenews_session_token');
    checkLoginStatus();
    closeProfileModal();
    switchToSignUp();
}

// Google Sign In (placeholder - requires OAuth setup)
function handleGoogleSignIn() {
    alert('Google Sign-In requires OAuth configuration. Please set up Google Cloud Console credentials.');
}

// Modal Click Outside Handler
function setupModalHandlers() {
    const authModal = document.getElementById('authModal');
    const profileModal = document.getElementById('profileModal');
    
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === this) closeAuthModal();
        });
    }
    
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === this) closeProfileModal();
        });
    }
}

// Initialize Auth
function initAuth() {
    checkLoginStatus();
    setupModalHandlers();
    
    // Session validation interval
    setInterval(() => {
        if (localStorage.getItem('wabblenews_current_user')) {
            if (!validateSession()) {
                checkLoginStatus();
            }
        }
    }, 60000);
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
