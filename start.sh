#!/usr/bin/env sh
cd "$(dirname "$0")"
echo "Serving at http://localhost:8767"
python3 -m http.server 8767 --bind 127.0.0.1
