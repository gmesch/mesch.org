const CLIENT_ID = '984348095409-se00lmqecpjf4mfoldhtf7bciprelcki.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA3Bzd1U5oLKC8lx1TtLS8kLQOJLOFfCuk';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let initAuth = false;
let initApi = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */
function loadApi() {
  gapi.load('client', loadApiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function loadApiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  initApi = true;
  maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function loadAuth() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined later
  });
  initAuth = true;
  maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
  if (initAuth && initApi) {
    if (gapi.client.getToken() !== null) {
      login();
    } else {
      document.getElementById('authorize_button').style.visibility = 'visible';
    }
  }
}

/**
 *  Sign in the user upon button click.
 */
function login() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    document.getElementById('signout_button').style.visibility = 'visible';
    document.getElementById('authorize_button').innerText = 'Refresh';
    await listFiles();
  };

  if (gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({prompt: 'consent'});
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({prompt: ''});
  }
}

/**
 *  Sign out the user upon button click.
 */
function logout() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
    document.getElementById('content').innerText = '';
    document.getElementById('authorize_button').innerText = 'Authorize';
    document.getElementById('signout_button').style.visibility = 'hidden';
  }
}

/**
 * Print metadata for first 10 files.
 */
async function listFiles() {
  let response;
  try {
    response = await gapi.client.drive.files.list({
      'pageSize': 10,
      'fields': 'files(id, name, mimeType, thumbnailLink)',
      'q': "mimeType contains 'image/'",
    });
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }
  const files = response.result.files;
  if (!files || files.length == 0) {
    document.getElementById('content').innerText = 'No files found.';
    return;
  }
  // Flatten to string to display
  const output = files.reduce(
    (str, file) => `<div>${str}${file.name} (${file.mimeType} ${file.id}) <img src="${file.thumbnailLink}"></div>\n`,
    '<h2>Files</h2>');
  document.getElementById('content').innerHTML = output;
}
