########################################################################################################################
# Usage
#
# replace_url.sh
#   - Replaces references to internal mirrored repository url with the public facing repository url
#
########################################################################################################################


echo "Replacing project urls in repo... (CHANGELOG, README, etc.)"
yarn replace $CI_PROJECT_URL $GITHUB_PROJECT_URL * -r --include="*.md,*.txt,*.ts" --exclude="node_modules/*,*/package-lock.json,*.lock"
