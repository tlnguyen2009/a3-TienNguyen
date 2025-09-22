// public/js/login.js

const form   = document.getElementById('loginForm');
const errBox = document.getElementById('loginError');
const params = new URLSearchParams(location.search);
const next   = params.get('next') || '/'; //get "next" params from the redirection

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errBox.textContent = '';

  const username = e.target.elements.username.value.trim(); // name="username"
  const password = e.target.elements.password.value;        // name="password"

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      // show server message if available, else generic
      let msg = 'Login failed';
      try { 
        msg = (await res.text()) || msg; 
      } catch {}
      
      errBox.textContent = msg;
      return;
    }

    //extract user and token and save it in local storage
    const { token, user } = await res.json();
    localStorage.setItem('token', token);
    
    if (user) localStorage.setItem('user', JSON.stringify(user));

    // auto-resume any pending score submission
    const pending = sessionStorage.getItem('pendingScore');
    if (pending) {
      try {
        await fetch('/submit', {
          method: 'POST',
          headers: {
            'Content-Type':'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: pending // already a JSON string
        });
      } catch (_) {
        // ignore errors here; user still gets logged in
      }
      sessionStorage.removeItem('pendingScore');
    }

    location.href = next; // go back to the game
  } catch (err) {
    errBox.textContent = 'Network error. Please try again.';
  }
});
