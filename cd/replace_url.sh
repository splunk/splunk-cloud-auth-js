echo "Replacing project urls in repo... (CHANGELOG, README, etc.)"
yarn replace $CI_PROJECT_URL $GITHUB_PROJECT_URL * -r --include="*.md,*.txt,*.ts,*.json" --exclude="node_modules/*,*/package-lock.json,*.lock"
