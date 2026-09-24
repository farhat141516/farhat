document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.querySelector('#login-status');
  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
  });
  const result = await response.json();
  if (!response.ok) { status.textContent = result.message; return; }
  location.href = '/admin';
});
