// --- UI Element Selectors ---
const userIconLink = document.querySelector('.user-icon-link');
const authModal = document.getElementById('auth-modal');
const closeModalBtn = authModal.querySelector('.close-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const messageBox = document.getElementById('message-box');
const authStatusText = document.getElementById('auth-status-text');
// انتخاب دکمه خروج که در فایل HTML اضافه شده است
const logoutBtn = document.getElementById('logout-btn');

// --- Functions ---
function showMessage(message, type = 'success') {
    messageBox.textContent = message;
    messageBox.className = ''; // Reset classes
    messageBox.classList.add('message-box', type);
    messageBox.style.display = 'block';
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}

// Function to update UI based on authentication status
function updateUI(username) {
    if (username) {
        // اگر کاربر وارد شده است، نام او را نمایش داده و دکمه خروج را فعال می‌کنیم
        authStatusText.textContent = `سلام، ${username}`;
        // دکمه ورود/ثبت‌نام را غیرفعال می‌کنیم
        userIconLink.style.pointerEvents = 'none';
        // دکمه خروج را نمایش می‌دهیم
        logoutBtn.style.display = 'block';
    } else {
        // اگر کاربر خارج شده است، متن را به حالت اولیه برمی‌گردانیم و دکمه خروج را پنهان می‌کنیم
        authStatusText.textContent = 'ورود / ثبت‌نام';
        // دکمه ورود/ثبت‌نام را فعال می‌کنیم تا بتوان روی آن کلیک کرد
        userIconLink.style.pointerEvents = 'auto';
        // دکمه خروج را پنهان می‌کنیم
        logoutBtn.style.display = 'none';
    }
}

// Function to check authentication status on page load
async function checkAuthStatus() {
    try {
        const response = await fetch('http://localhost:3000/check-auth', {
            credentials: 'include' // این خط برای ارسال کوکی با درخواست اضافه شده است
        });
        const data = await response.json();

        if (response.ok && data.isAuthenticated) {
            updateUI(data.username);
        } else {
            updateUI(null);
        }
    } catch (error) {
        console.error('Error checking authentication status:', error);
        updateUI(null);
    }
}

// --- Event Listeners ---
// Run checkAuthStatus when the page loads
window.addEventListener('load', checkAuthStatus);

// Show auth modal on user icon click
userIconLink.addEventListener('click', (e) => {
    e.preventDefault();
    authModal.style.display = 'flex';
});

// Hide auth modal
closeModalBtn.addEventListener('click', () => {
    authModal.style.display = 'none';
});

// Hide modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
    }
});

// Switch between login and register forms
showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
});

showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'flex';
});

// Handle login form submissions
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm.querySelector('#login-email').value;
    const password = loginForm.querySelector('#login-password').value;

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include' // این خط برای ارسال و دریافت کوکی اضافه شده است
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message, 'success');
            updateUI(data.user.username);
            setTimeout(() => {
                authModal.style.display = 'none';
            }, 1000);
        } else {
            showMessage(`خطا: ${data.message}`, 'error');
        }
    } catch (error) {
        showMessage('خطا در اتصال به سرور. لطفاً از اجرای سرور اطمینان حاصل کنید.', 'error');
        console.error('خطا در ارسال درخواست:', error);
    }
});

// Handle register form submission (with database connection)
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('register-email');
    const passwordInput = document.getElementById('register-password');

    if (!emailInput || !passwordInput) {
        showMessage('خطا: فیلدهای ایمیل یا رمز عبور یافت نشدند.', 'error');
        console.error("Error: Email or password fields not found in the form.");
        return;
    }

    const username = emailInput.value;
    const password = passwordInput.value;

    try {
        const response = await fetch('http://localhost:3000/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include' // برای دریافت کوکی پس از ثبت‌نام
        });

        const data = await response.json();

        if (response.ok) {
            showMessage(data.message, 'success');
            console.log('ثبت نام موفقیت‌آمیز:', data);
            updateUI(data.user.username);
            setTimeout(() => {
                authModal.style.display = 'none';
            }, 1000);
        } else {
            showMessage(`خطا: ${data.message}`, 'error');
            console.error('خطای سرور:', data);
        }
    } catch (error) {
        showMessage('خطا در اتصال به سرور. لطفاً از اجرای سرور اطمینان حاصل کنید.', 'error');
        console.error('خطا در ارسال درخواست:', error);
    }
});

// Handle logout button click
logoutBtn.addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:3000/logout', {
            method: 'POST',
            credentials: 'include' // ارسال کوکی برای خروج
        });
        if (response.ok) {
            showMessage('با موفقیت از حساب خارج شدید.', 'success');
            updateUI(null); // به روزرسانی UI
        }
    } catch (error) {
        showMessage('خطا در خروج از حساب. لطفاً دوباره امتحان کنید.', 'error');
        console.error('Logout error:', error);
    }
});
