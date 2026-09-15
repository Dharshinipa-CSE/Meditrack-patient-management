// ---------------------------------------------------------------
// auth.js
// Handles the register and login forms. There is NO default/demo
// login — every user must register their own account first, and
// only their own valid credentials will authenticate them.
// ---------------------------------------------------------------

function showAlert(message, type = 'error') {
  const box = document.getElementById('alertBox');
  if (!box) return;
  box.textContent = message;
  box.className = `alert ${type}`;
}

function clearFieldErrors(formEl) {
  formEl.querySelectorAll('small.error').forEach(el => {
    el.textContent = '';
    el.style.display = 'none';
  });
}

function setFieldError(fieldName, message) {
  const el = document.getElementById(`${fieldName}Error`);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Redirect logged-in users away from auth pages straight to the dashboard.
(function redirectIfLoggedIn() {
  if (localStorage.getItem('authToken')) {
    window.location.href = 'dashboard.html';
  }
})();

// ---------------- LOGIN ----------------
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(loginForm);
    document.getElementById('alertBox').style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    let hasError = false;
    if (!username) { setFieldError('username', 'Username is required.'); hasError = true; }
    if (!password) { setFieldError('password', 'Password is required.'); hasError = true; }
    if (hasError) return;

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.non_field_errors ? data.non_field_errors[0]
                  : (data.detail || 'Invalid username or password.');
        showAlert(msg, 'error');
        return;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.username);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAlert('Could not reach the server. Is the Django backend running on ' + API_BASE_URL + '?', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Log In';
    }
  });
}

// ---------------- REGISTER ----------------
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(registerForm);
    document.getElementById('alertBox').style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;

    let hasError = false;
    if (username.length < 3) { setFieldError('username', 'Username must be at least 3 characters.'); hasError = true; }
    if (!isValidEmail(email)) { setFieldError('email', 'Enter a valid email address.'); hasError = true; }
    if (password.length < 6) { setFieldError('password', 'Password must be at least 6 characters.'); hasError = true; }
    if (password !== password2) { setFieldError('password2', 'Passwords do not match.'); hasError = true; }
    if (hasError) return;

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, password2 }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Map server-side field errors onto the form.
        let shown = false;
        ['username', 'email', 'password', 'password2'].forEach(field => {
          if (data[field]) {
            setFieldError(field, Array.isArray(data[field]) ? data[field][0] : data[field]);
            shown = true;
          }
        });
        if (!shown) showAlert(data.detail || 'Registration failed. Please check your details.', 'error');
        return;
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('username', data.username);
      window.location.href = 'dashboard.html';
    } catch (err) {
      showAlert('Could not reach the server. Is the Django backend running on ' + API_BASE_URL + '?', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Register';
    }
  });
}
