#!/bin/sh
# Build the zip that users load via "Load unpacked".
# Output: dist/gha-workflows-folder-v<version>.zip containing a top-level
# gha-workflows-folder/ directory with only the files the extension needs.
set -eu

cd "$(dirname "$0")/.."

version=$(node -p 'require("./manifest.json").version')
stage=dist/gha-workflows-folder
zip_path="dist/gha-workflows-folder-v${version}.zip"

rm -rf dist
mkdir -p "$stage"
cp manifest.json content.js content.css "$stage/"
cp -R icons "$stage/"

(cd dist && zip -qrX "$(basename "$zip_path")" gha-workflows-folder)
echo "$zip_path"
