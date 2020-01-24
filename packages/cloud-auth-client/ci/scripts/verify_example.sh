#!/bin/bash

# this script is meant to be run from the root directory of the package

print_major_header_line() {
    echo "\n============================================================"
}

# setup directory variables
ORIGINAL_WORKING_DIR=$PWD
echo original working directory: $ORIGINAL_WORKING_DIR
EXAMPLE_WORKING_DIR=$ORIGINAL_WORKING_DIR/examples/cloud-auth-client-react-example

# unlinking local packages
yarn unlink
cd $EXAMPLE_WORKING_DIR
yarn unlink @splunkdev/cloud-auth-client

# transpiling
cd $ORIGINAL_WORKING_DIR
(yarn tsc > /dev/null || true)

# linking local packages by temporarily removing local dependencies from package and linking
yarn link
cp $EXAMPLE_WORKING_DIR/package.json $EXAMPLE_WORKING_DIR/package.json.orig
cd $EXAMPLE_WORKING_DIR
yarn remove @splunkdev/cloud-auth-client
yarn link @splunkdev/cloud-auth-client

# verify install and build
yarn clean
yarn
yarn build

EXAMPLE_BUILD_EXIT_CODE=$?
if [ $EXAMPLE_BUILD_EXIT_CODE -ne 0 ]
then
    print_major_header_line
    echo "Failed to build example ..."
    print_major_header_line
    exit $EXAMPLE_BUILD_EXIT_CODE
fi

cp $EXAMPLE_WORKING_DIR/package.json.orig $EXAMPLE_WORKING_DIR/package.json
rm -rf $EXAMPLE_WORKING_DIR/package.json.orig
