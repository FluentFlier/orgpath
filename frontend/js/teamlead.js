// js/teamlead.js
(async function () {
  const API_BASE = "http://localhost:8080/api";

  // 1. Get REAL token and user from sessionStorage
  const token = sessionStorage.getItem('orgpath_token');
  const userJson = sessionStorage.getItem('orgpath_user');
  
  if (!token || !userJson) {
    location.href = 'index.html';
    return;
  }

  let user;
  try {
    user = JSON.parse(userJson);
  } catch {
    location.href = 'index.html';
    return;
  }

  // 2. Auth check
  if (user.role !== 'lead') {
    location.href = (user.role === 'employee')
      ? 'employee-dashboard.html'
      : (user.role === 'company')
        ? 'company-dashboard.html'
        : 'index.html';
    return;
  }

  // 3. Populate Topbar name + initials
  const leadName = document.getElementById('leadName');
  const avatarInitials = document.getElementById('avatarInitials');
  
  if (leadName && user.first_name) {
    leadName.textContent = `${user.first_name} ${user.last_name || ''}`;
  }
  
  if (avatarInitials && user.first_name) {
    const initials = (user.first_name[0] || '') + (user.last_name ? user.last_name[0] : '');
    avatarInitials.textContent = initials.toUpperCase();
    
    const smallLogo = document.querySelector('.side-logo-small');
    if (smallLogo) smallLogo.textContent = (initials || 'O').toUpperCase();
  }

  // 4. Logout button
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    sessionStorage.clear();
    location.href = 'index.html';
  });

  // 5. Sidebar collapse logic
  const COLLAPSE_KEY = 'orgi_side_collapsed';
  function applyCollapsedState() {
    const collapsed = sessionStorage.getItem(COLLAPSE_KEY) === '1';
    document.body.classList.toggle('side-collapsed', collapsed);
  }
  applyCollapsedState();

  document.getElementById('btn-collapse')?.addEventListener('click', () => {
    const now = !(sessionStorage.getItem(COLLAPSE_KEY) === '1');
    sessionStorage.setItem(COLLAPSE_KEY, now ? '1' : '0');
    applyCollapsedState();
  });

  // 6. Fetch real dashboard data
  async function loadTeamLeadDashboard() {
    try {
      console.log("Fetching dashboard data...");
      const res = await fetch(`${API_BASE}/teamlead/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load dashboard");
      }

      const data = await res.json();
      console.log("Data received:", data);
      
      // Safe element updates
      const elSize = document.getElementById('kpiTeamSize');
      const elHealth = document.getElementById('kpiHealth');
      const elAvg = document.getElementById('kpiAvg');
      const elComp = document.getElementById('kpiCompletion');

      if(elSize) elSize.textContent = data.teamSize;
      if(elHealth) elHealth.textContent = `${data.healthScore}%`;
      if(elAvg) elAvg.textContent = `${data.avgOverallScore}%`;
      if(elComp) elComp.textContent = `${data.completionRate}%`;

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      // Only show alert if it's a real API error, not a network/dom glitch
      if (!err.message.includes("match the expected pattern")) {
          alert(`Dashboard Error: ${err.message}`);
      }
    }
  }

  await loadTeamLeadDashboard();

})();