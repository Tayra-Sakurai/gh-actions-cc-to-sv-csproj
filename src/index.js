import * as core from "@actions/core";
import * as github from "@actions/github";
import { CommitParser } from "conventional-commits-parser";
import { readFileSync } from "node:fs";

try {
  const commitMessage = core.getInput('commit-message');
  core.info(`Commit Message: ${commitMessage}`);
  const parser = new CommitParser();
  const commitData = parser.parse(commitMessage);
  const domParser = new DOMParser();
  const filePaths = core.getInput('project-paths').split('\n');
  for (const filePath of filePaths) {
    if (!filePath)
      continue;
    core.info(`Reading: ${filePath}...`);
    let xml = readFileSync(filePath, 'utf8');
    core.info(`Read ${filePath}.`);
    xml = xml.replace(/^\ufeff/, '');
    core.info(contentJson);
    const xmlDoc = domParser.parseFromString(xml, 'text/xml');
    const packageVersionTag = xmlDoc.querySelector('PackageVersion').innerHTML;
  }
} catch (error) {
  core.setFailed(error.message);
}
