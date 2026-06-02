const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient = null;

function waitForScripts(timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (window.gapi && window.google) { resolve(); return; }
    const start = Date.now();
    const t = setInterval(() => {
      if (window.gapi && window.google) { clearInterval(t); resolve(); }
      else if (Date.now() - start > timeout) { clearInterval(t); reject(new Error('Google scripts timed out')); }
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

/**
 * Request an OAuth token.
 * silent=true → no popup, uses existing Google session (works after first consent).
 * silent=false → shows full consent screen on first use, account picker on repeat.
 */
export function requestToken(silent = false) {
  return new Promise((resolve, reject) => {
    tokenClient.callback = (resp) => {
      if (resp.error) { reject(new Error(resp.error_description || resp.error)); return; }
      resolve(resp);
    };
    tokenClient.requestAccessToken({ prompt: silent ? '' : 'consent' });
  });
}

export function signOut() {
  const token = window.gapi.client.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
}

export function isAuthenticated() {
  return !!(window.gapi?.client?.getToken?.());
}

function getToken() {
  return window.gapi.client.getToken().access_token;
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
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
  return resp.arrayBuffer();
}

export async function createFile(name, data) {
  const meta = {
    name,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
  form.append('file', new Blob([data], { type: meta.mimeType }));
  const resp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: form }
  );
  if (!resp.ok) throw new Error(`Create failed: ${resp.status}`);
  return resp.json();
}

export async function updateFile(fileId, data) {
  const resp = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: data,
    }
  );
  if (!resp.ok) throw new Error(`Update failed: ${resp.status}`);
  return resp.json();
}
