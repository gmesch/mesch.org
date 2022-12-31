# Drive

## Purpose

One page app to organize photos into folders in drive.

Other purposes:

* Align labels in gmail and folders in drive. Organize saved attachments from
  mail conversaions into folders that correspond to the label of the
  conversation.

## TODO

* load scripts with a loader service
* handle events with jsaction
* maybe use jscompiler and closure to configure jsaction

## Notes

### Make API key and oauth client configurable in the client

* Create a page that lets you store API client and OAuth client in local storage
  of the browser.
* Let the app read API key and OAuth client from local storage.
* Alternative is to supply the keys in URL parameters. This would leak them in
  referrers. So they would need to be taken off the URL and put into local
  storage too.

### Configure a bazel workspace

### Use jsaction to handle events

### Use a loader service to load scripts

### Use jstemplate for rendering content

Add jstemplate as submodule under `/vnd/jstemplate` and use it.

### Tokens for page apps at file:// URLs

Page fully works from `file://` URLs, *except* that Google refuses to issue
tokens to apps running on `file://` URLs. Also, the browser (and the response
from Google API server) disallows pages on `file://` URLs to access responses to
`POST` requests. (Or perhaps to issue post requests to begin with; though this
would be possible with a form, so should not be disallowed from the API.)

Therefore, we issue a public host name for a permanently assigned non-localhost
IP address for the workstation, and serve the page locally at that address over
https. TBD how to obtain a cerficate for that hostname.

The alternative, to serve the page from github, has too long update
cycles. (More than 30 seconds.)

Another alernative, to obtain an app (as opposed to a web page) token and use
that, needs to find a way to send API post requests directly, rather than
through the wrapper library, and probably still doesn't work because the browser
prevents access of the page to the post response.
