// Handle Google SSO Response
window.handleCredentialResponse = async (response) => {
  console.log("Google JWT:", response.credential);
  const API_BASE = "http://localhost:8080/api";

  try {
    // Send the Google token to our backend
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: response.credential }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Google login failed");

    // Success! Save token and redirect
    sessionStorage.setItem("orgpath_token", data.token);
    sessionStorage.setItem("orgpath_user", JSON.stringify(data.user));

    // Redirect based on role
    if (data.user.role === 'lead') window.location.href = 'teamlead-dashboard.html';
    else if (data.user.role === 'company') window.location.href = 'company-dashboard.html';
    else window.location.href = 'employee-dashboard.html';

  } catch (err) {
    alert(`SSO Error: ${err.message}`);
  }
};

// ========== LOGIN / REGISTER PAGE ==========
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE = "http://localhost:8080/api";

  // --- Panel/Tab switching ---
  const panels = {
    login: document.getElementById('panel-login'),
    create: document.getElementById('panel-create'),
  };
  const tabs = document.querySelectorAll('.tab');
  const titleEl = document.getElementById('pageTitle') || document.querySelector('.page-title');

  function show(mode) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === mode));
    Object.entries(panels).forEach(([k, el]) => el.classList.toggle('hidden', k !== mode));
    titleEl.textContent = (mode === 'login') ? 'Login' : 'Register';
  }
  tabs.forEach(t => t.addEventListener('click', () => show(t.dataset.tab)));
  const hash = (location.hash || '').toLowerCase();
  show(hash.includes('create') ? 'create' : 'login');

  // --- reCAPTCHA ---
  const fakeCaptcha = document.getElementById('fake-captcha');
  const createBtn = document.querySelector('#panel-create .btn.btn-green');
  const captchaError = document.getElementById('captcha-error');
  function updateCreateEnabled() {
    if (!createBtn) return;
    const ok = !!fakeCaptcha?.checked;
    createBtn.disabled = !ok;
    if (captchaError) captchaError.classList.toggle('show', !ok);
  }
  updateCreateEnabled();
  fakeCaptcha?.addEventListener('change', updateCreateEnabled);

  
  // --- REAL REGISTER LOGIC ---
  const createForm = document.getElementById('create-form');
  
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault(); 
      if (!fakeCaptcha?.checked) {
        if (captchaError) {
          captchaError.classList.add('show');
          captchaError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          alert('Please verify that you are not a robot.');
        }
        return;
      }
      const formData = new FormData(createForm);
      const firstName = formData.get('name');
      const lastName = formData.get('lastName'); 
      const email = formData.get('email');
      const password = formData.get('password');
      const referralCode = formData.get('referral');

      createBtn.disabled = true;
      createBtn.textContent = "Creating Account...";

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
            referralCode
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create account");

        // SUCCESS! Save the REAL token and user
        sessionStorage.setItem("orgpath_token", data.token);
        sessionStorage.setItem("orgpath_user", JSON.stringify(data.user));

        // ** NEW REDIRECT LOGIC **
        if (data.user.role === 'employee') {
          window.location.href = 'employee-dashboard.html';
        } else if (data.user.role === 'lead') {
          window.location.href = 'teamlead-dashboard.html';
        } else if (data.user.role === 'company') {
          window.location.href = 'company-dashboard.html';
        } else {
          window.location.href = 'employee-dashboard.html';
        }
        
      } catch (err) {
        alert(`Registration Error: ${err.message}`);
        createBtn.disabled = false;
        createBtn.textContent = "Create Account";
      }
    });
  }

  // --- REAL LOGIN LOGIC ---
  const loginForm = document.getElementById('login-form');
  const loginBtn = loginForm?.querySelector('button[type="submit"]');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(loginForm);
      const identifier = formData.get('identifier');
      const password = formData.get('password');

      if (!identifier || !password) {
        alert("Please enter your email/username and password.");
        return;
      }

      if(loginBtn) loginBtn.disabled = true;
      if(loginBtn) loginBtn.textContent = "Logging in...";

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to log in");

        // SUCCESS! Save the REAL token and user
        sessionStorage.setItem("orgpath_token", data.token);
        sessionStorage.setItem("orgpath_user", JSON.stringify(data.user));

        // ** NEW REDIRECT LOGIC **
        if (data.user.role === 'employee') {
          window.location.href = 'employee-dashboard.html';
        } else if (data.user.role === 'lead') {
          window.location.href = 'teamlead-dashboard.html';
        } else if (data.user.role === 'company') {
          window.location.href = 'company-dashboard.html';
        } else {
          window.location.href = 'employee-dashboard.html';
        }

      } catch (err) {
        alert(`Login Error: ${err.message}`);
        if(loginBtn) loginBtn.disabled = false;
        if(loginBtn) loginBtn.textContent = "Login";
      }
    });
  }
});