#!/bin/sh
set -e

cd /backend

mkdir -p out
cp /usr/local/bin/rclone out/
cp rcloneLauncher out/
cp openLastLog.sh out/
chmod 755 -R out
