#!/bin/bash

# this script is meant to be run from the root directory of the package

# setup directory variables
ORIGINAL_WORKING_DIR=$PWD
echo original working directory: $ORIGINAL_WORKING_DIR
PACKAGE_NAME="${PWD##*/}"
echo package to generate third party credits for: $PACKAGE_NAME
TMP_WORKING_DIR=$PWD/../tmp/$PACKAGE_NAME
echo temporary working directory: $TMP_WORKING_DIR

# make a copy of the package
mkdir -p $TMP_WORKING_DIR
cp -R $PWD/. $TMP_WORKING_DIR

# copy the yarn.lock from the root
cp $PWD/../../yarn.lock $TMP_WORKING_DIR/yarn.lock

# install and run third-party-licenses target
cd $TMP_WORKING_DIR
yarn install
yarn run third-party-licenses:generate

# copy the updated THIRD-PARTY-CREDITS.md
cd $ORIGINAL_WORKING_DIR
cp $TMP_WORKING_DIR/THIRD-PARTY-CREDITS.md $ORIGINAL_WORKING_DIR/THIRD-PARTY-CREDITS.md

# cleanup temp dir
rm -rf $TMP_WORKING_DIR

# CI steps
if [[ $CI == true ]]
then
    if [ "$(git diff --exit-code $ORIGINAL_WORKING_DIR/THIRD-PARTY-CREDITS.md)" ]
    then
        echo "Change detected in THIRD-PARTY-CREDITS.md.  Please rerun the third-party-licenses npm target and check in the changes to the file."
        exit 1
    fi
fi
