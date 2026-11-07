import * as core from "@actions/core";
import * as github from "@actions/github";
import { Bumper } from "conventional-recommended-bump";
import { readFileSync, writeFileSync } from "node:fs";

try {
  const bumper = new Bumper()
    .loadPreset('conventionalcommits');
  const tag = core.getInput('tag');
  if (tag) {
    bumper.tag(tag);
  }
  const { level, releaseType } = await bumper.bump();
  const csProjects = core.getMultilineInput('path');
  for (const csproj of csProjects) {
    // Remove the BOM
    const fileContents = readFileSync(csproj, 'utf-8')
      .replace(/^\xef\xbb\xbf/, '');

    const xml =
      /**
       * @type {(string: string, type: "text/xml") => XMLDocument}
       */
      (new DOMParser().parseFromString)(fileContents, 'text/xml');
    const packageVersion = xml.querySelector('PackageVersion');
    packageVersion.innerHTML = packageVersion.innerHTML.replace(
      /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z]+\.\d*)?$/,
      (_, p1, p2, p3, p4) => {
        let [major, minor, patch, suffix] = [p1, p2, p3, p4 ?? ''];
        switch (level) {
          case 0:
            major = String(Number(p1) + 1);
            minor = '0';
            patch = '0';
            break;
          case 1:
            minor = String(Number(p2) + 1);
            patch = '0';
            break;
          case 2:
            patch = String(Number(p3) + 1);
            break;
        }
        return `${major}.${minor}.${patch}${suffix}`;
      }
    );
    const serializer = new XMLSerializer();
    const newContent = '\xef\xbb\xbf' + serializer.serializeToString(xml);
    writeFileSync(csproj, newContent);
  }
  core.setOutput('release-type', releaseType);
} catch (error) {
  core.setFailed(error.message);
}
