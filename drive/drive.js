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

    this.apiKey_ = null;
    this.apiKeyApplied_ = null;
    this.clientId_ = null;
    this.clientIdApplied_ = null;

    this.buttonLogin_ = document.getElementById('login');
    this.buttonLogout_ = document.getElementById('logout');

    this.buttonStateHidden_();
  }

  readyApiKey(apiKey) {
    console.log('readyApiKey');
    this.apiKey_ = apiKey;
    this.checkApiKey_();
  }

  atApiKey(fn) {
    this.apiKeyFn_ = fn;
    this.checkApiKey_();
  }

  checkApiKey_() {
    if (!this.apiKey_ || !this.apiKeyFn_) {
      return;
    }

    if (this.apiKeyApplied_ != this.apiKey_) {
      this.apiKeyApplied_ = this.apiKey_;
      this.apiKeyFn_(this.apiKey_);
    }
  }

  readyClientId(clientId) {
    console.log('readyClientId');
    this.clientId_ = clientId;
    this.checkClientId_();
  }

  atClientId(fn) {
    this.clientIdFn_ = fn;
    this.checkClientId_();
  }

  checkClientId_() {
    if (!this.clientId_ || !this.clientIdFn_) {
      return;
    }

    if (this.clientIdApplied_ != this.clientId_) {
      this.clientIdApplied_ = this.clientId_;
      this.clientIdFn_(this.clientId_);
    }
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

  atStart(fn) {
    this.start_ = fn;
    this.checkStart_();
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

  checkStart_() {
    console.log('checkStart');
    if (this.start_ && this.token_) {
      console.log('start');
      this.start_();
    }
  }

  atLogout(fn) {
    this.logout_ = fn;
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
  flow.atApiKey((apiKey) => {
    gapi.load('client', () => {
      gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: [DISCOVERY_DOC],
      }).then(() => {
        flow.readyApi();
      });
    });
  });
}

function onLoadAuth() {
  flow.atClientId((clientId) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: '', // defined again before requestAccessToken() is called.
    });
    flow.readyAuth(tokenClient);
  });
}

function init() {
  document.getElementById('apikey').value = localStorage.getItem('apikey');
  document.getElementById('client').value = localStorage.getItem('client');

  flow.readyClientId(document.getElementById('client').value);
  flow.readyApiKey(document.getElementById('apikey').value);
}

function setup(event) {
  console.log('setup');
  localStorage.setItem('apikey', document.getElementById('apikey').value);
  localStorage.setItem('client', document.getElementById('client').value);
  event.preventDefault();

  flow.readyClientId(document.getElementById('client').value);
  flow.readyApiKey(document.getElementById('apikey').value);
}

function login() {
  if (gapi.client.getToken() === null) {
    flow.newAccessToken();
  } else {
    flow.refreshAccessToken();
  }
}

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

  const response = await gapi.client.drive.files.list(request);
  if (pageToken) {
    localStorage.setItem('page_token', pageToken);
  } else {
    localStorage.removeItem('page_token');
  }

  console.log(JSON.stringify(request, null, 2));
  console.log(JSON.stringify(response.result, null, 2));

  if (response.result.nextPageToken) {
    pageToken = response.result.nextPageToken;
  } else {
    pageToken = null;
  }

  const input = new JsEvalContext(response.result);
  const output = document.getElementById('content');
  jstProcess(input, output);
}

function clearFiles() {
  pageToken = null;
  localStorage.removeItem('page_token');
  document.getElementById('content').innerHTML = '';
}

flow.atStart(listFiles);
flow.atLogout(clearFiles);
