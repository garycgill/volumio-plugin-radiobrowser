#!/bin/bash
echo "Installing RadioBrowser Plugin dependencies"
sudo apt-get update
sudo apt-get -y install --no-install-recommends curl
cd /data/plugins/music_service/radiobrowser
npm install
echo "plugininstallend"
