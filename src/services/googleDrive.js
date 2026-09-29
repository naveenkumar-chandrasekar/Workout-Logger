const SCOPES        = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const TOKEN_KEY     = 'wl_gtoken';

let tokenClient = null;

// ── Script loading ─────────────────────────────────────────────────────────

function waitForScripts(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (window.gapi && window.google) { resolve(); return; }
    const start = Date.now();
    const t = setInterval(() => {
      if (window.gapi && window.google) { clearInterval(t); resolve(); }
      else if (Date.now() - start > timeout) {
        clearInterval(t);
        reject(new Error('Google scripts timed out'));
      }
    }, 150);
  });
}

export async function initGapiClient() {
  await waitForScripts();
  return new Promise((resolve, reject) => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
        resolve();
      } catch (e) { reject(e); }
    });
  });
}

export function initGis(clientId) {
  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: SCOPES,
    callback: () => {},
  });
}

// ── Token persistence ──────────────────────────────────────────────────────
// We save the raw access_token + expiry in sessionStorage (tab-scoped, cleared
// on tab close). On refresh we inject it directly into gapi — zero GIS call,
// zero popup. Only when the token has expired do we ask the user to sign in.

function saveToken(accessToken, expiresIn) {
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify({
    access_token: accessToken,
    expires_at:   Date.now() + Number(expiresIn || 3600) * 1000,
  }));
}

/**
 * Restore the saved token into gapi without any network call or popup.
 * Returns true if a valid token was found and injected.
 */
export function restoreToken() {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return false;

    const { access_token, expires_at } = JSON.parse(raw);
    if (!access_token) return false;

    // Reject if expired or within 2 min of expiry
    if (Date.now() > expires_at - 120_000) {
      clearStoredToken();
      return false;
    }

    // Inject directly — no popup, no network
    window.gapi.client.setToken({ access_token });
    return true;
  } catch {
    return false;
  }
}

export function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function tokenExpiresAt() {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw).expires_at : 0;
  } catch { return 0; }
}

// ── Auth ───────────────────────────────────────────────────────────────────

/**
 * Show the Google sign-in popup (only ever called when there is no valid
 * cached token — i.e., first sign-in or after token expiry).
 */
export function requestToken() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) {
        reject(new Error(resp.error_description || resp.error));
        return;
      }
      // Save the token immediately so the next refresh is popup-free
      saveToken(resp.access_token, resp.expires_in);
      resolve(resp);
    };
    // 'consent' on first use, '' on re-auth (avoids consent re-prompt)
    const hasStored = !!sessionStorage.getItem(TOKEN_KEY);
    tokenClient.requestAccessToken({ prompt: hasStored ? '' : 'consent' });
  });
}

export function signOut() {
  const token = window.gapi.client.getToken();
  if (token?.access_token) {
    window.google.accounts.oauth2.revoke(token.access_token);
  }
  window.gapi.client.setToken('');
  clearStoredToken();
}

// ── Drive API ──────────────────────────────────────────────────────────────

function accessToken() {
  return window.gapi.client.getToken()?.access_token;
}

export async function findFileByName(name) {
  const resp = await window.gapi.client.drive.files.list({
    q: `name='${name}' and trashed=false`,
    fields: 'files(id,name)',
    spaces: 'drive',
  });
  return resp.result.files?.[0] ?? null;
}

export async function downloadFile(fileId) {
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken()}` } }
  );
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
  return resp.arrayBuffer();
}

export async function createFile(name, data) {
  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name, mimeType: mime })], { type: 'application/json' }));
  form.append('file',     new Blob([data], { type: mime }));
  const resp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    { method: 'POST', headers: { Authorization: `Bearer ${accessToken()}` }, body: form }
  );
  if (!resp.ok) throw new Error(`Create failed: ${resp.status}`);
  return resp.json();
}

export async function updateFile(fileId, data) {
  const resp = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method:  'PATCH',
      headers: {
        Authorization:  `Bearer ${accessToken()}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: data,
    }
  );
  if (!resp.ok) throw new Error(`Update failed: ${resp.status}`);
  return resp.json();
}
