#!/bin/bash

PACKAGES_DIR=$CI_PROJECT_DIR/packages
COVERAGE_DIR=$CI_PROJECT_DIR/coverage

# Aggregating all package coverage artifacts under a root coverage directory
rm -rf $COVERAGE_DIR
cd $PACKAGES_DIR
for PACKAGE in */ ; do
    if [ -d "$PACKAGES_DIR/$PACKAGE/coverage" ]
    then
        echo "Coverage artifacts found for $PACKAGE"
        mkdir -p $CI_PROJECT_DIR/coverage/$PACKAGE
        cp -r $PACKAGES_DIR/$PACKAGE/coverage/* $CI_PROJECT_DIR/coverage/$PACKAGE || true
        if [ "$PACKAGE" != "cloud-auth-client/" ]
        then
            sed "s,SF:src,SF:$PACKAGES_DIR/$PACKAGE\src,g" $CI_PROJECT_DIR/coverage/$PACKAGE/lcov.info > $CI_PROJECT_DIR/coverage/$PACKAGE/lcov.info.mod
            mv $CI_PROJECT_DIR/coverage/$PACKAGE/lcov.info.mod $CI_PROJECT_DIR/coverage/$PACKAGE/lcov.info
        fi
    fi
done

cd $CI_PROJECT_DIR
ls -a $CI_PROJECT_DIR/coverage
echo "All coverage artifacts aggregated at the root under 'coverage' directory"
