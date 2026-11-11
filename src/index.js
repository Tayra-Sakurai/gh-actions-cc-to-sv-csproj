import * as core from "@actions/core";
import * as github from "@actions/github";
import { Bumper } from "conventional-recommended-bump";
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

try {
  const bumper = new Bumper();
  bumper.loadPreset('conventionalcommits');
  const tag = core.getInput('tag');
  if (tag)
    bumper.tag(tag);
  const paths = core.getMultilineInput('path');
  const { level } = await bumper.bump();
  for (const path in paths) {
    const content = readFileSync(path, 'utf-8');
    const rawxml = content.replace(/^\xef\xbb\xbf/, '');
    const parser = new DOMParser();
    const xml = parser.parseFromString(rawxml, 'text/xml');
    const versionTagP = xml.querySelector('PackageVersion').innerHTML;
    const versionTagA = xml.querySelector('AssemblyVersion').innerHTML;
    let [ major, minor, patch, ...suffix ] = versionTagP.split(/\.|-/);
    let build = Number.parseInt(versionTagA.split(/\D/)[3]);
    switch (level) {
      case 0:
        if (suffix.length > 0) {
          suffix[1] = suffix.length >= 2 ? String(Number.parseInt(suffix[1]) + 1) : '1';
          build++;
          break;
        }
        build = 0;
        minor = '0';
        patch = '0';
        major = String(Number.parseInt(major) + 1)
        break;
      case 1:
        if (suffix.length > 0) {
          suffix[1] = suffix.length >= 2 ? String(Number.parseInt(suffix[1]) + 1) : '1';
          build++;
          break;
        }
        build = 0;
        patch = '0';
        minor = String(Number.parseInt(minor) + 1);
        break;
      case 2:
        if (suffix.length > 0) {
          suffix[1] = suffix.length >= 2 ? String(Number.parseInt(suffix[1]) + 1) : '1';
          build++;
          break;
        }
        build = 0;
        patch = String(Number.parseInt(patch) + 1);
        break;
      default:
        build++;
        break;
    }
    let newSuffix = suffix.length > 0 ?
      '-' + suffix.join('.') :
      '';
    const newPVersion = `${major}.${minor}.${patch}${newSuffix}`;
    xml.querySelector('PackageVersion').innerHTML = newPVersion;
    const newAVersion = `${major}.${minor}.${patch}.${build}`;
    xml.querySelector('AssemblyVersion').innerHTML = newAVersion;
    xml.querySelector('FileVersion').innerHTML = newAVersion;
    const serializer = new XMLSerializer();
    writeFileSync(path, '\xef\xbb\xbf' + serializer.serializeToString(xml), 'utf-8');
  }
  execSync('git config user.name "github-actions[bot]"', { stdio: 'inherit' });
  execSync('git config user.email "41898282+github-actions[bot]@://github.com"', { stdio: 'inherit' });
  execSync('git add .', { stdio: 'inherit' });

  const status = execSync('git status --porcelain').toString();
  if (status.length > 0) {
    execSync('git commit -m "ci: update version number"', { stdio: 'inherit' });
    execSync('git push', { stdio: 'inherit' });
    core.info('Successfully committed and pushed changes.');
  } else {
    core.info('No changes to commit.');
  }
} catch (error) {
  core.setFailed(error.message);
}
