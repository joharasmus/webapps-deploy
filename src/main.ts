import * as core from '@actions/core';
import * as fs from 'node:fs';
import * as utility from './utility';

import { Document, DOMParser } from '@xmldom/xmldom';
import { WebClient, WebRequest } from 'azure-actions-webclient/WebClient';

var xPathSelect = require('xpath').select;

export async function main() {
  let publishProfileContent = core.getInput('publish-profile');
  let packageInput = core.getInput('package');

  let publishProfileXml: Document = new DOMParser().parseFromString(publishProfileContent, "application/xml");

  let uri = xPathSelect("string(//publishProfile/@publishUrl)", publishProfileXml, true);
  uri = `https://${uri}`;

  let username = xPathSelect("string(//publishProfile/@userName)", publishProfileXml, true);
  core.setSecret(username);

  let password = xPathSelect("string(//publishProfile/@userPWD)", publishProfileXml, true)
  core.setSecret(password);

  let webPackage = utility.findfiles(packageInput)[0];  // Always use the first package
  let tempPackagePath = webPackage + ".zip";
  await utility.archiveFolder(webPackage, tempPackagePath);

  const accessToken = Buffer.from(username + ':' + password).toString('base64');
  
  let deploymentDetails = await oneDeploy(tempPackagePath, uri, accessToken);
  console.log(deploymentDetails);
}

async function oneDeploy(webPackage: string, scmUri: string, accessToken: string): Promise<any> {
  
  let client = new WebClient();
  
  let httpRequest: WebRequest = {
    method: 'POST',
    uri: scmUri + '/api/publish?async=true&type=zip&clean=true&restart=true',
    headers: {
      'Authorization': `Basic ${accessToken}`,
      'Content-Type': 'application/octet-stream'
    },
    body: fs.createReadStream(webPackage)
  };
  
  let response = await client.sendRequest(httpRequest);
  
  if (response.statusCode != 202)
    throw response;
  
  let pollRequest: WebRequest = {
    method: 'GET',
    uri: response.headers.location,
    headers: {
      'Authorization': `Basic ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8'
    }
  };
  
  while (true) {
    await new Promise(_ => setTimeout(_, 1000));
    
    let response = await client.sendRequest(pollRequest);
    
    if (response.statusCode == 202)
      continue;
    
    if (response.statusCode == 200)
      return response.body;
    
    throw response; //another statuscode indicates something is wrong
  }
}

main();