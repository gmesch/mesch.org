#!/usr/bin/env bash

set -e
set -u
set -o pipefail

cd $(dirname $0)

pip install -r requirements.in

declare -r PORT=8443
declare -r KEY=key.pem
declare -r CERT=cert.pem
declare -r DIRECTORY=..

if [[ ! -r $KEY || ! -r $CERT ]]; then
  openssl req -x509 -newkey rsa:2048 -keyout "${KEY}" -out "${CERT}" -days 365
fi

python httpd.py \
  --host='' \
  --port="${PORT}" \
  --key="${KEY}" \
  --cert="${CERT}" \
  --directory="${DIRECTORY}"
