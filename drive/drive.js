const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'].join(' ');

class Script {
  constructor(url) {
    this.url_ = url;
  }

  load(fn) {
    const script = document.createElement('SCRIPT');
    script.addEventListener('load', fn);
    script.src = this.url_;
    document.head.appendChild(script);
  }
}

class FlowCall {
  constructor(name) {
    this.name_ = name;
    this.fn_ = null;
    this.arg_ = null;
    this.argApplied_ = null;
  }

  fn(fn) {
    console.log(`${this.name_}: fn`)
    this.fn_ = fn;
    this.check_();
  }

  arg(arg) {
    console.log(`${this.name_}: arg ${arg}`)
    this.arg_ = arg;
    this.check_();
  }

  check_() {
    console.log(`${this.name_}: check_`)
    if (!this.fn_ || !this.arg_) {
      console.log(`${this.name_}: check_ NO`)
      return;
    }

    if (this.argApplied_ != this.arg_) {
      console.log(`${this.name_}: check_ YES`)
      this.argApplied_ = this.arg_;
      this.fn_(this.arg_);
    } else {
      console.log(`${this.name_}: check_ UNCHANGED`)
    }
  }
}

class Flow {
  constructor() {
    this.readyApi_ = false;
    this.tokenClient_ = null;
    this.token_ = null;
    this.start_ = null;
    this.logout_ = null;

    this.atHide_ = null;
    this.atLogin_ = null;
    this.atLogout_ = null;

    this.stateHide_();
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
    console.log('checkToken_');
    if (!this.readyApi_ || !this.tokenClient_) {
      console.log('checkToken_: No');
      return;
    }

    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      console.log('checkToken_: Use');
      this.useAccessToken_(accessToken);
    } else {
      console.log('checkToken_: Need');
      this.noAccessToken_();
    }
  }

  atStart(fn) {
    console.log('atStart_');
    this.start_ = fn;
    this.checkStart_();
  }

  useAccessToken_(accessToken) {
    console.log(`useAccessToken_: ${JSON.stringify(accessToken)}`);
    gapi.client.setToken({'access_token': accessToken});
    this.stateLogin_();
    this.token_ = accessToken;
    this.checkStart_();
  }

  noAccessToken_() {
    console.log('noAccessToken_');
    this.stateLogout_();
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
    console.log('getAccessToken_');
    const flow = this;
    this.tokenClient_.callback = async (tokenResponse) => {
      if (tokenResponse.error !== undefined) {
        throw tokenResponse;
      }

      console.log('tokenResponse: ' + JSON.stringify(tokenResponse));

      // Automatically updated.
      console.log('gapi.client.getToken(): ' + JSON.stringify(gapi.client.getToken()));

      const accessToken = tokenResponse.access_token;
      localStorage.setItem('access_token', accessToken);
      flow.stateLogin_();

      this.token_ = accessToken;
      this.checkStart_();
    };

    this.tokenClient_.requestAccessToken(opts);
  }

  checkStart_() {
    console.log('checkStart_');
    if (!this.start_ || !this.token_) {
      console.log('checkStart_: No');
      return;
    }

    console.log('checkStart: Yes');
    this.start_();
  }

  atLogout(fn) {
    console.log('atLogout');
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

    this.stateLogout_();

    if (this.logout_) {
      this.logout_();
    }
  }

  atHide(fn) {
    this.atHide_ = fn;
  }

  stateHide_() {
    if (this.atHide_) {
      this.atHide_();
    }
  }

  atLogin(fn) {
    this.atLogin_ = fn;
  }

  stateLogin_() {
    if (this.atLogin_) {
      this.atLogin_();
    }
  }

  atLogout(fn) {
    this.atLogout_ = fn;
  }

  stateLogout_() {
    console.log('buttonStateLogout_');
    if (this.atLogout_) {
      this.atLogout_();
    }
  }
}

class ButtonView {
  constructor(document) {
    this.buttonLogin_ = document.getElementById('login');
    this.buttonLogout_ = document.getElementById('logout');
  }

  hide() {
    console.log('buttonStateHide_');
    this.buttonLogin_.style.visibility = 'hidden';
    this.buttonLogout_.style.visibility = 'hidden';
  }

  login() {
    console.log('buttonStateLogin_');
    this.buttonLogin_.style.visibility = '';
    this.buttonLogin_.innerText = 'Refresh';
    this.buttonLogout_.style.visibility = '';
  }

  logout() {
    console.log('buttonStateLogout_');
    this.buttonLogin_.style.visibility = '';
    this.buttonLogin_.innerText = 'Authorize';
    this.buttonLogout_.style.visibility = '';
  }
}

const flow = new Flow;
const apiKeyCall = new FlowCall('apiKey');
const clientIdCall = new FlowCall('clientId');

function onLoadApi() {
  console.log('onLoadApi');
  apiKeyCall.fn((apiKey) => {
    console.log('onLoadApi: atApiKey');
    gapi.load('client', () => {
      console.log('onLoadApi: atApiKey() gapi.load()');
      gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: [DISCOVERY_DOC],
      }).then(() => {
        console.log('onLoadApi: atApiKey() gapi.load() gapi.client.init()');
        flow.readyApi();
      });
    });
  });
}

function onLoadAuth() {
  console.log('onLoadAuth');
  clientIdCall.fn((clientId) => {
    console.log('onLoadAuth: atClientId()');
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: '', // defined again before requestAccessToken() is called.
    });
    flow.readyAuth(tokenClient);
  });
}

function init() {
  console.log('init');

  const eventContract = new EventContract(document.body);
  eventContract.enableEvent('click');
  eventContract.registerAction('test', (actionFlow) => {
    console.log(actionFlow);
  });

  document.getElementById('apikey').value = localStorage.getItem('apikey');
  document.getElementById('client').value = localStorage.getItem('client');

  clientIdCall.arg(document.getElementById('client').value);
  apiKeyCall.arg(document.getElementById('apikey').value);

  new Script('https://apis.google.com/js/api.js').load(onLoadApi);
  new Script('https://accounts.google.com/gsi/client').load(onLoadAuth);

  const buttonView = new ButtonView(document);
  flow.atStart(listFiles);
  flow.atLogout(clearFiles);
  flow.atHide(() => buttonView.hide());
  flow.atLogin(() => buttonView.login());
  flow.atLogout(() => {
    buttonView.logout();
    clearFiles();
  });
}

function setup(event) {
  console.log('setup');
  localStorage.setItem('apikey', document.getElementById('apikey').value);
  localStorage.setItem('client', document.getElementById('client').value);
  event.preventDefault();

  clientIdCall.arg(document.getElementById('client').value);
  apiKeyCall.arg(document.getElementById('apikey').value);
}

function login() {
  console.log('login');
  if (gapi.client.getToken() === null) {
    flow.newAccessToken();
  } else {
    flow.refreshAccessToken();
  }
}

function logout() {
  console.log('logout');
  flow.revokeAccessToken();
}

let pageToken = localStorage.getItem('page_token');
const jsEvalContext = new JsEvalContext;

async function resetFiles() {
  console.log('resetFiles');
  pageToken = null;
  await listFiles();
}

async function listFiles() {
  console.log('listFiles');
  let request = {
    pageSize: 10,
    fields: 'nextPageToken, files(id, name, mimeType, thumbnailLink, webViewLink)',
    q: "mimeType contains 'image/'",
  };

  if (pageToken) {
    request.pageToken = pageToken;
  }

  try {
    const response = await gapi.client.drive.files.list(request);
    if (pageToken) {
      localStorage.setItem('page_token', pageToken);
    } else {
      localStorage.removeItem('page_token');
    }

    console.log(JSON.stringify(request, null, 2));
    //console.log(JSON.stringify(response.result, null, 2));

    if (response.result.nextPageToken) {
      pageToken = response.result.nextPageToken;
    } else {
      pageToken = null;
    }

    jsEvalContext.setVariable('files', response.result.files);
    const output = document.getElementById('content');
    jstProcess(jsEvalContext, output);

  } catch (e) {
    console.log(e);
    pageToken = null;
    localStorage.removeItem('page_token');
    jsEvalContext.setVariable('files', []);
    const output = document.getElementById('content');
    jstProcess(jsEvalContext, output);
  }
}

function clearFiles() {
  console.log('clearFiles');
  pageToken = null;
  localStorage.removeItem('page_token');

  jsEvalContext.setVariable('files', null);
  const output = document.getElementById('content');
  jstProcess(jsEvalContext, output);
}
