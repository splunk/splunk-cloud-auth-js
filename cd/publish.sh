#!/bin/sh

echo "Installing dependencies ..."
yarn install

echo "Building package ..."
yarn build

echo "Publishing latest versions of updated packages to artifactory ..."
yarn lerna publish from-package --dist-tag latest

echo "Publishing docs to artifactory ..."
yarn publish:docs
