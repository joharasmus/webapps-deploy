import * as core from '@actions/core';
import * as utility from 'azure-actions-utility/utility';
import * as zipUtility from 'azure-actions-utility/ziputility';

import { Document, DOMParser } from '@xmldom/xmldom';
import { Package } from 'azure-actions-utility/packageUtility';
import { Kudu } from './Kudu';

var xPathSelect = require('xpath').select;

export async function main() {
  let publishProfileContent = core.getInput('publish-profile');
  let packageInput = core.getInput('package');

  let appPackage = new Package(packageInput);

  let dom: Document = new DOMParser().parseFromString(publishProfileContent, "application/xml");

  let uri = xPathSelect("string(//publishProfile/@publishUrl)", dom, true);
  uri = `https://${uri}`;

  let username = xPathSelect("string(//publishProfile/@userName)", dom, true);
  core.setSecret(username);

  let password = xPathSelect("string(//publishProfile/@userPWD)", dom, true)
  core.setSecret(password);

  let webPackage = appPackage.getPath();
  let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
  webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;

  const accessToken = Buffer.from(username + ':' + password).toString('base64');
  
  let queryParameters: Array<string> = [
    'deployer=GITHUB_ONE_DEPLOY',
    'type=zip',
    'clean=true',
    'restart=true'
  ];

  let deploymentDetails = await Kudu.oneDeploy(webPackage, queryParameters, uri, accessToken);
  console.log(deploymentDetails);
}

main();