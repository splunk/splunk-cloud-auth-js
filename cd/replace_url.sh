echo "Replacing project urls in repo... (CHANGELOG, README, etc.)"
yarn replace $CI_PROJECT_URL $GITHUB_PROJECT_URL . --exclude=packages/**/node_modules/*
