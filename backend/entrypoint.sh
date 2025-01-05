#!/bin/sh
set -e

cd /backend

mkdir -p out
mv /rclone out/
cp rcloneLauncher out/
cp openLastLog.sh out/
chmod 755 -R out

entrypoint.sh -l node -d /plugin/proto -o /plugin/proto/out/ts --with-typescript
rm -rf /plugin/py_modules/dependencies
mv /protobuf /plugin/py_modules/dependencies
entrypoint.sh -l python -d /plugin/proto -o /plugin/py_modules/dependencies