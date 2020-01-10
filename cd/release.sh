#!/bin/sh

########################################################################################################################
# Usage
#
# releash.sh
#   - Uses conventional commits to determine the next version of each package to release
#
# release.sh --custom
#   - Allows you to specify the next version of each package to release
#
########################################################################################################################

print_header_line() {
    echo "\n------------------------------------------------------------"
}

print_major_header_line() {
    echo "\n============================================================"
}

CUSTOM_RELEASE=false
if [[ "$1" == "--custom" ]]
then
    CUSTOM_RELEASE=true
fi

print_header_line
echo "Preparing for release ..."
echo "Running 'git checkout develop' ..."
git checkout develop

print_header_line
echo "Running 'git fetch --all && git pull --all' ..."
git fetch --tags --all && git pull --all

print_header_line
BRANCH_NAME=release/$(date +'%Y-%m-%d_%H-%M-%S')
echo "Checking out a $BRANCH_NAME branch ..."
git checkout -b $BRANCH_NAME
git checkout $BRANCH_NAME

print_header_line
echo "Installing dependencies for tooling ..."
yarn

print_header_line
echo "Building resouces for documentation ..."
yarn build

if [ $CUSTOM_RELEASE == true ]
then
    print_header_line
    echo "Compare develop...master branches to determine versions for each package..."
    echo ""
    echo "Please review all incoming changes and determine the release types of each package. When you are ready type 'Y' and then press [ENTER]."
    echo ""
    echo "Reference:"
    echo "    https://semver.org/"
    echo "    Given a version number MAJOR.MINOR.PATCH, increment the:"
    echo ""
    echo "    MAJOR version when you make incompatible API changes,"
    echo "    MINOR version when you add functionality in a backwards compatible manner, and"
    echo "    PATCH version when you make backwards compatible bug fixes."
    echo ""
    read CONFIRM_MANUAL_REVIEW
    if [[ "$CONFIRM_MANUAL_REVIEW" != "y" ]] && [[ "$CONFIRM_MANUAL_REVIEW" != "Y" ]]
    then
        exit 1
    fi

    yarn lerna version --no-push --include-merged-tags

    LERNA_VERSION_EXIT_CODE=$?
    if [ $LERNA_VERSION_EXIT_CODE -ne 0 ]
    then
        print_header_line
        echo "Showing changes with 'git status' ..."
        git status
        exit $LERNA_VERSION_EXIT_CODE
    fi

    print_major_header_line
    echo "    NOTICE"
    echo "Please update the respective CHANGELOG.MD files for each package before pushing."
else
    print_header_line
    yarn lerna version --conventional-commits --no-push --include-merged-tags --yes

    LERNA_VERSION_EXIT_CODE=$?
    if [ $LERNA_VERSION_EXIT_CODE -ne 0 ]
    then
        print_header_line
        echo "Showing changes with 'git status' ..."
        git status
        exit $LERNA_VERSION_EXIT_CODE
    fi

    print_header_line
    echo "Would you like to push the release branch to the repository? Type 'Y' and then press [ENTER]."
    read PUSH_TO_GIT
    if [[ "$PUSH_TO_GIT" == "y" ]] || [[ "$PUSH_TO_GIT" == "Y" ]]
    then
        print_header_line
        echo "    WARNING"
        echo "Tags created locally ..."
        echo "Pushing branch $BRANCH_NAME ..."
        echo ""
        git push --set-upstream origin $BRANCH_NAME
    else
        print_major_header_line
        echo "    WARNING"
        echo "No changes pushed, tags and branch $BRANCH_NAME only created locally ..."
        echo ""
    fi
fi

print_major_header_line
echo "    NEXT STEPS"
echo ""
echo "1.    Merge the release branch to master"
echo ""
echo "2.    Once the release branch has merged, ensure lerna-generated tags match package.json versions of each package and the merged commit hash"
echo "          - Tag Name Format: @splunkdev/[PACKAGE_NAME]@[VERSION]"
echo "          - Example: @splunkdev/cloud-auth-common@1.0.0"
echo ""
echo "      View local tags:"
echo "          'git tag'"
echo ""
echo "      Delete existing tag:"
echo "          'git tag -d [TAG_NAME]'"
echo ""
echo "      Create new tag:"
echo "          'git tag [TAG_NAME]'"
echo ""
echo "      Update existing tag:"
echo "          'git tag -f [TAG_NAME] [COMMIT_HASH]'"
echo ""
echo "3.    Merge the tags"
echo ""
