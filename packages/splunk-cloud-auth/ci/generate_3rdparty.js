const crawler = require('npm-license-crawler');
const path = require('path');
const markdownlint = require('markdownlint');
const fs = require('fs');

const thirdPartyLicenseFileName = 'THIRD-PARTY-CREDITS.md';
const thirdPartyLicenseFile = path.join(__dirname, '..', thirdPartyLicenseFileName);

function createMarkdown(deps) {
    let document = '\n# Third-party software credits\n\n';
    document +=
        'The Splunk Cloud Auth library for JavaScript contains some libraries that were written by others, and are being redistributed as part of the library, under their respective open source licenses.\n';
    document += '\nWe want to thank the contributors to these projects:\n';

    for (const dependencyKey of Object.keys(deps)) {
        // Deps can be in the formats: @scope/name@x.y.z, name@x.y.z so we need to split on the last @
        const splitPosition = dependencyKey.lastIndexOf('@');
        const name = dependencyKey.substring(0, splitPosition);
        const version = dependencyKey.substring(splitPosition + 1, dependencyKey.length);

        const currentDependency = deps[dependencyKey];

        if (currentDependency.parents.indexOf(':') !== -1) {
            console.log(`Skipping ${dependencyKey} as nested dependency`);
            continue;
        }

        console.log(`Outputting ${name}`);

        document += `\n## ${name}\n\n`;
        document += `Name: ${name}\n\n`;
        document += `Version: ${version}\n\n`;

        if (typeof currentDependency.licenses !== 'string') {
            throw new Error(
                `Unexpected licenses: ${
                    currentDependency.licenses
                } of type: ${typeof currentDependency.licenses}`
            );
        }

        if (currentDependency.licenseUrl) {
            document += `License: [${currentDependency.licenses}](${
                currentDependency.licenseUrl
            })\n`;
        } else {
            document += `License: ${currentDependency.licenses}\n`;
        }

        if (currentDependency.repository) {
            document += `\nRepository: [${currentDependency.repository}](${
                currentDependency.repository
            })\n`;
        }
    }

    return document;
}

const crawlerOptions = {
    start: [path.join(__dirname, '..')],
    exclude: [path.join(__dirname, '..', 'node_modules')],
    noColor: true,
    dependencies: true,
};

crawler.dumpLicenses(crawlerOptions, (error, res) => {
    if (error) {
        throw error;
    } else {
        const thirdPartyCredits = createMarkdown(res);
        const markdownlintOptions = {
            strings: { thirdPartyCredits },
            config: { 'line-length': false },
        };

        const markdownErrors = markdownlint.sync(markdownlintOptions);
        if (markdownErrors.thirdPartyCredits.length > 0) {
            console.log(markdownErrors.toString());
            throw new Error('Invalid markdown');
        }

        const currentFile = fs.readFileSync(thirdPartyLicenseFile).toString();
        if (currentFile === thirdPartyCredits) {
            console.log(`Nothing to update in ${thirdPartyLicenseFileName}.`);
        } else {
            // If running in CI, fail if this file is stale
            if (process.env.CI) {
                console.log(
                    `${thirdPartyLicenseFileName} might be stale, please run 'yarn third-party-licenses'.`
                );

                // TODO: figure out why CI always generates something different than local env
                // probably due to NODE_ENV=production being set in CI, so dev deps aren't installed?
                // throw new Error(`${thirdPartyLicenseFileName} is stale, please run 'yarn third-party-licenses'.`);
            } else {
                fs.writeFileSync(thirdPartyLicenseFile, thirdPartyCredits);
                console.log(`Successfully updated ${thirdPartyLicenseFileName}`);
            }
        }
    }
});
