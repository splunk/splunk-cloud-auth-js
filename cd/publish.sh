#!/bin/sh

########################################################################################################################
# Usage
#
# publish.sh
#   - Uses conventional commits to determine the next version of each package to release
#
########################################################################################################################

DEFAULT_REGISTRY=https://$NPM_REGISTRY_URL
REGISTRY=$DEFAULT_REGISTRY
if [[ $# -eq 1 ]]
then
    REGISTRY=$1
fi

echo "Installing dependencies ..."
yarn install

echo "Building package ..."
yarn build

echo "Publishing latest versions of updated packages to ${REGISTRY} ..."
yarn lerna publish from-package --no-git-reset --dist-tag latest --yes --registry=$REGISTRY

if [[ $REGISTRY == $DEFAULT_REGISTRY ]]
then
    echo "Publishing docs to artifactory ..."
    yarn publish:docs
fi
