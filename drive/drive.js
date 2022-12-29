const CLIENT_ID = '984348095409-se00lmqecpjf4mfoldhtf7bciprelcki.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA3Bzd1U5oLKC8lx1TtLS8kLQOJLOFfCuk';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'].join(' ');

class Flow {
  constructor(document) {
    this.document_ = document;
    this.readyApi_ = false;
    this.tokenClient_ = null;
    this.token_ = null;
    this.start_ = null;
    this.logout_ = null;

    this.buttonLogin_ = document.getElementById('login');
    this.buttonLogout_ = document.getElementById('logout');

    this.buttonStateHidden_();
  }

  readyApi() {
    console.log('readyApi');
    this.readyApi_ = true;
    this.checkToken_();
  }

  readyAuth(tokenClient) {
    console.log('readyAuth');
    this.tokenClient_ = tokenClient;
    this.checkToken_();
  }

  atStart(fn) {
    this.start_ = fn;
    this.checkStart_();
  }

  atLogout(fn) {
    this.logout_ = fn;
  }

  checkStart_() {
    console.log('checkStart');
    if (this.start_ && this.token_) {
      console.log('start');
      this.start_();
    }
  }

  checkToken_() {
    if (!this.readyApi_ || !this.tokenClient_) {
      return;
    }

    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      this.useAccessToken_(accessToken);
    } else {
      this.noAccessToken_();
    }
  }

  useAccessToken_(accessToken) {
    console.log('useAccessToken ' + JSON.stringify(accessToken));
    gapi.client.setToken({'access_token': accessToken});
    this.buttonStateLogin_();
    this.token_ = accessToken;
    this.checkStart_();
  }

  noAccessToken_() {
    console.log('noAccessToken');
    this.buttonStateLogout_();
  }

  newAccessToken() {
    console.log('newAccessToken');
    this.getAccessToken_({prompt: 'consent'});
  }

  refreshAccessToken() {
    console.log('refreshAccessToken');
    this.getAccessToken_({prompt: ''});
  }

  revokeAccessToken() {
    console.log('revokeAccessToken');
    // NOTE: getToken() does NOT return the access token directly.
    const token = gapi.client.getToken();
    if (token === null) {
      return;
    }

    google.accounts.oauth2.revoke(token.access_token); // cf. NOTE above.
    gapi.client.setToken('');
    localStorage.removeItem('access_token');

    this.buttonStateLogout_();

    if (this.logout_) {
      this.logout_();
    }
  }

  getAccessToken_(opts) {
    const flow = this;
    this.tokenClient_.callback = async (tokenResponse) => {
      if (tokenResponse.error !== undefined) {
        throw (tokenResponse);
      }

      console.log('tokenResponse: ' + JSON.stringify(tokenResponse));

      // Automatically updated.
      console.log('gapi.client.getToken(): ' + JSON.stringify(gapi.client.getToken()));

      const accessToken = tokenResponse.access_token;
      localStorage.setItem('access_token', accessToken);
      flow.buttonStateLogin_();

      this.token_ = accessToken;
      this.checkStart_();
    };

    this.tokenClient_.requestAccessToken(opts);
  }

  buttonStateHidden_() {
    this.buttonLogin_.style.visibility = 'hidden';
    this.buttonLogout_.style.visibility = 'hidden';
  }

  buttonStateLogin_() {
    this.buttonLogin_.style.visibility = '';
    this.buttonLogin_.innerText = 'Refresh';
    this.buttonLogout_.style.visibility = '';
  }

  buttonStateLogout_() {
    this.buttonLogin_.style.visibility = '';
    this.buttonLogin_.innerText = 'Authorize';
    this.buttonLogout_.style.visibility = '';
  }
}

const flow = new Flow(document);

function onLoadApi() {
  gapi.load('client', () => {
    gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    }).then(() => {
      flow.readyApi();
    });
  });
}

function onLoadAuth() {
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // defined again before requestAccessToken() is called.
  });
  flow.readyAuth(tokenClient);
}

/**
 *  Sign in the user upon button click.
 */
function login() {
  if (gapi.client.getToken() === null) {
    flow.newAccessToken();
  } else {
    flow.refreshAccessToken();
  }
}

/**
 *  Sign out the user upon button click.
 */
function logout() {
  flow.revokeAccessToken();
}

let pageToken = localStorage.getItem('page_token');

async function resetFiles() {
  pageToken = null;
  await listFiles();
}

async function listFiles() {
  let request = {
    pageSize: 10,
    fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink)',
    q: "mimeType contains 'image/'",
  };

  if (pageToken) {
    request.pageToken = pageToken;
  }

  let response;
  try {
    response = await gapi.client.drive.files.list(request);
    if (pageToken) {
      localStorage.setItem('page_token', pageToken);
    } else {
      localStorage.removeItem('page_token');
    }
  } catch (err) {
    document.getElementById('content').innerText = err.message;
    return;
  }

  console.log(JSON.stringify(request, null, 2));
  console.log(JSON.stringify(response.result, null, 2));

  const files = response.result.files;
  if (!files || files.length == 0) {
    document.getElementById('content').innerText = 'No files found.';
    return;
  }

  if (response.result.nextPageToken) {
    pageToken = response.result.nextPageToken;
  } else {
    pageToken = null;
  }

  const output = files.reduce(
    (str, file) => `<div>${str}${file.name} (${file.mimeType} ${file.id}) <a href="${file.webViewLink}"><img src="${file.thumbnailLink}"></a></div>\n`,
    '<h2>Files</h2>');
  document.getElementById('content').innerHTML = output +
    '<div><button onclick="listFiles()">More</button> ' +
    '<button onclick="resetFiles()">Reset</button></div>';
}

function clearFiles() {
  pageToken = null;
  localStorage.removeItem('page_token');
  document.getElementById('content').innerHTML = '';
}

flow.atStart(listFiles);
flow.atLogout(clearFiles);
