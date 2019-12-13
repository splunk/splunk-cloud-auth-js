#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]
then
    echo "Branch Parameters missing from inputs to change_packages.sh"
    exit 1
fi

SOURCE_BRANCH=$1
MERGE_BRANCH=$2
PACKAGE_DIRECTORY="packages"

# echo $SOURCE_BRANCH .. $MERGE_BRANCH

DIFF_CHANGED_FILES=( $(git diff --name-only "$SOURCE_BRANCH..$MERGE_BRANCH") )
CHANGED_PACKAGES=()

for var in "${DIFF_CHANGED_FILES[@]}"
do
if [[ $var = $PACKAGE_DIRECTORY/* ]]
then
    IFS='/' read -ra PATH_ARR <<< "$var"
    PACKAGE_NAME=${PATH_ARR[1]}
    if [[ ! "${CHANGED_PACKAGES[@]}" =~ "${PACKAGE_NAME}" ]]
    then
        CHANGED_PACKAGES+=($PACKAGE_NAME)
    fi
fi
done

CHANGED_PACKAGES+=('sdf')

echo ${CHANGED_PACKAGES[@]}
