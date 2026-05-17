const apiUrlInput = document.getElementById('apiUrl');
const apiUrlSelect = document.getElementById('apiUrlSelect');
const setApiUrlButton = document.getElementById('setApiUrl');
const output = document.getElementById('output');
let apiBaseUrl = '';
const USER_EMAIL_DOMAIN = '@anurag.edu.in';

function showResult(data) {
  output.textContent = JSON.stringify(data, null, 2);
}

function showError(error) {
  output.textContent = typeof error === 'string' ? error : JSON.stringify(error, null, 2);
}

function getHeaders() {
  return { 'Content-Type': 'application/json' };
}

function validateApiUrl(url) {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    throw 'API Base URL is required.';
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    throw 'API Base URL must start with http:// or https://';
  }
  if (/[<>]/.test(trimmed) || /your-api-id|your-api/i.test(trimmed)) {
    throw 'Replace the placeholder URL with your actual deployed API Gateway endpoint.';
  }
  return trimmed.replace(/\/$/, '');
}

function getBaseUrl() {
  const url = apiBaseUrl || apiUrlInput.value.trim();
  return validateApiUrl(url);
}

apiUrlSelect.addEventListener('change', () => {
  const selected = apiUrlSelect.value;
  if (selected) {
    apiUrlInput.value = selected;
  }
});

setApiUrlButton.addEventListener('click', () => {
  try {
    apiBaseUrl = validateApiUrl(apiUrlInput.value);
    showResult({ message: 'API URL set', apiBaseUrl });
  } catch (error) {
    showError(error);
  }
});

async function post(path, body) {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  return data;
}

async function get(path) {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw data;
  }
  return data;
}

const signupForm = document.getElementById('signupForm');
const loginForm = document.getElementById('loginForm');
const attendanceForm = document.getElementById('attendanceForm');
const photoForm = document.getElementById('photoForm');
const reportsForm = document.getElementById('reportsForm');

function buildAnuragEmail(value) {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) {
    throw 'Roll number is required.';
  }
  if (cleaned.includes('@')) {
    if (!cleaned.endsWith(USER_EMAIL_DOMAIN)) {
      throw `Email must end with ${USER_EMAIL_DOMAIN}`;
    }
    return cleaned;
  }
  return `${cleaned}${USER_EMAIL_DOMAIN}`;
}

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const rollNo = document.getElementById('signupRollNo').value.trim();
    const email = buildAnuragEmail(rollNo);
    const name = document.getElementById('signupName').value.trim();
    const password = document.getElementById('signupPassword').value;
    const data = await post('/signup', { email, name, password });
    showResult(data);
  } catch (error) {
    showError(error);
  }
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const rollNo = document.getElementById('loginRollNo').value.trim();
    const email = buildAnuragEmail(rollNo);
    const password = document.getElementById('loginPassword').value;
    const data = await post('/login', { email, password });
    showResult(data);
  } catch (error) {
    showError(error);
  }
});

attendanceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const email = document.getElementById('attendanceEmail').value.trim();
    const status = document.getElementById('attendanceStatus').value;
    const timestamp = document.getElementById('attendanceTimestamp').value;
    const location = document.getElementById('attendanceLocation').value.trim();
    const notes = document.getElementById('attendanceNotes').value.trim();
    const data = await post('/attendance', { email, status, timestamp: timestamp ? new Date(timestamp).toISOString() : undefined, location, notes });
    showResult(data);
  } catch (error) {
    showError(error);
  }
});

photoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const email = document.getElementById('photoEmail').value.trim();
    const fileName = document.getElementById('photoFileName').value.trim();
    const fileInput = document.getElementById('photoFile');
    const file = fileInput.files[0];

    if (!file) {
      showError('Please select a photo to upload.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result.split(',')[1];
      const data = await post('/photos', { email, fileName, imageBase64: base64Data });
      showResult(data);
    };
    reader.onerror = () => showError('Unable to read the selected photo.');
    reader.readAsDataURL(file);
  } catch (error) {
    showError(error);
  }
});

reportsForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const email = document.getElementById('reportEmail').value.trim();
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    const query = new URLSearchParams({ email, startDate, endDate });
    const data = await get(`/reports?${query.toString()}`);
    showResult(data);
  } catch (error) {
    showError(error);
  }
});
