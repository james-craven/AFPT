const CONFIG = Object.freeze({
  apiVersion: '2026-03-10',
  branch: 'clean-rebuild',
  dataPath: '14WS-500/data.json',
  owner: 'james-craven',
  repo: 'AFPT',
});

const DATA_URL = '/14ws-500/data.json';
const TOKEN_KEY = 'pfra.14ws500.githubToken';

const els = {
  panel: document.querySelector('.admin-panel'),
  form: document.getElementById('mileage-form'),
  token: document.getElementById('github-token'),
  rememberToken: document.getElementById('remember-token'),
  miles: document.getElementById('miles-input'),
  note: document.getElementById('status-note-input'),
  refresh: document.getElementById('refresh-current'),
  submit: document.getElementById('submit-update'),
  status: document.getElementById('admin-status'),
  currentTotal: document.getElementById('current-total'),
  currentUpdated: document.getElementById('current-updated'),
  commitLink: document.getElementById('commit-link'),
};

const milesFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function setStatus(message, tone = '') {
  if (els.status) els.status.textContent = message;
  if (els.panel) {
    if (tone) els.panel.dataset.tone = tone;
    else delete els.panel.dataset.tone;
  }
}

function setBusy(isBusy) {
  if (els.submit) els.submit.disabled = isBusy;
  if (els.refresh) els.refresh.disabled = isBusy;
}

function normalizeMiles(value) {
  const miles = Number(value);
  if (!Number.isFinite(miles) || miles < 0) {
    throw new Error('Enter a non-negative mileage total.');
  }

  return Math.round(miles * 10) / 10;
}

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? dateTimeFormatter.format(date) : '--';
}

function renderCurrent(data) {
  const total = normalizeMiles(data.totalMiles || 0);
  if (els.currentTotal) els.currentTotal.textContent = milesFormatter.format(total);
  if (els.currentUpdated) els.currentUpdated.textContent = formatDateTime(data.updatedAt);
  if (els.miles) els.miles.value = String(total);
  if (els.note) els.note.value = data.statusNote || '';
}

function encodedRepoPath() {
  return CONFIG.dataPath.split('/').map(encodeURIComponent).join('/');
}

function repoContentsUrl({ includeRef = false } = {}) {
  const url = `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${encodedRepoPath()}`;
  if (!includeRef) return url;
  const params = new URLSearchParams({ ref: CONFIG.branch });
  return `${url}?${params}`;
}

function requestHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': CONFIG.apiVersion,
  };
}

async function parseGitHubError(response) {
  let detail = '';
  try {
    const body = await response.json();
    detail = body.message ? ` ${body.message}` : '';
  } catch {
    detail = '';
  }

  if (response.status === 401) return 'GitHub rejected the token.';
  if (response.status === 403) return `GitHub blocked the update.${detail}`;
  if (response.status === 404) return 'GitHub could not find the repo, branch, or file for this token.';
  if (response.status === 409) return 'The file changed while updating. Refresh and try again.';
  if (response.status === 422) return `GitHub could not validate the commit.${detail}`;
  return `GitHub request failed with status ${response.status}.${detail}`;
}

async function githubRequest(url, options, token) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...requestHeaders(token),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await parseGitHubError(response));
  }

  return response.json();
}

function base64EncodeUtf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function base64DecodeUtf8(content) {
  const binary = atob(String(content || '').replace(/\s/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

async function loadPublicData({ quiet = false } = {}) {
  if (!quiet) setStatus('Loading current total...');
  const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Current total request failed: ${response.status}`);
  const data = await response.json();
  renderCurrent(data);
  if (!quiet) setStatus('Current total loaded.', 'ok');
  return data;
}

function saveTokenPreference(token) {
  try {
    if (els.rememberToken?.checked) {
      window.localStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // Private browsing storage failures should not block the update.
  }
}

function restoreToken() {
  try {
    const localToken = window.localStorage.getItem(TOKEN_KEY);
    const sessionToken = window.sessionStorage.getItem(TOKEN_KEY);
    const token = localToken || sessionToken || '';
    if (els.token) els.token.value = token;
    if (els.rememberToken) els.rememberToken.checked = Boolean(localToken);
  } catch {
    // Token restore is a convenience only.
  }
}

async function fetchGitHubData(token) {
  const file = await githubRequest(repoContentsUrl({ includeRef: true }), { method: 'GET' }, token);
  const data = JSON.parse(base64DecodeUtf8(file.content));
  return { data, sha: file.sha };
}

async function commitGitHubData(token, data, sha) {
  const content = base64EncodeUtf8(`${JSON.stringify(data, null, 2)}\n`);
  const message = `Update 14WS mileage to ${data.totalMiles} miles`;
  return githubRequest(repoContentsUrl(), {
    body: JSON.stringify({
      branch: CONFIG.branch,
      content,
      message,
      sha,
    }),
    method: 'PUT',
  }, token);
}

function setCommitLink(url) {
  if (!els.commitLink) return;
  if (!url) {
    els.commitLink.hidden = true;
    els.commitLink.removeAttribute('href');
    return;
  }

  els.commitLink.href = url;
  els.commitLink.hidden = false;
}

async function handleSubmit(event) {
  event.preventDefault();
  setCommitLink('');

  const token = els.token?.value.trim() || '';
  if (!token) {
    setStatus('Enter a GitHub token.', 'error');
    els.token?.focus();
    return;
  }

  let miles;
  try {
    miles = normalizeMiles(els.miles?.value);
  } catch (error) {
    setStatus(error.message, 'error');
    els.miles?.focus();
    return;
  }

  setBusy(true);
  saveTokenPreference(token);

  try {
    setStatus('Reading the current GitHub file...');
    const { data, sha } = await fetchGitHubData(token);
    const nextData = {
      ...data,
      statusNote: els.note?.value.trim() || data.statusNote || 'September unit mileage',
      totalMiles: miles,
      updatedAt: new Date().toISOString(),
    };

    setStatus('Committing mileage update...');
    const result = await commitGitHubData(token, nextData, sha);
    setCommitLink(result.commit?.html_url || '');
    renderCurrent(nextData);
    setStatus('Committed. Refresh the challenge page after deployment finishes.', 'ok');
  } catch (error) {
    setStatus(error.message || 'Mileage update failed.', 'error');
  } finally {
    setBusy(false);
  }
}

restoreToken();
els.form?.addEventListener('submit', handleSubmit);
els.refresh?.addEventListener('click', () => {
  setCommitLink('');
  setBusy(true);
  loadPublicData()
    .catch((error) => setStatus(error.message || 'Unable to load current total.', 'error'))
    .finally(() => setBusy(false));
});

loadPublicData().catch((error) => {
  setStatus(error.message || 'Unable to load current total.', 'error');
});
