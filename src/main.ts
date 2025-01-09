import * as core from '@actions/core';
import * as fs from 'node:fs';

import { Document, DOMParser } from '@xmldom/xmldom';
let { Archiver } = require('../lib/core');
import { HttpClient } from 'typed-rest-client/HttpClient';

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

  let zipPackagePath = packageInput + ".zip";
  let output = fs.createWriteStream(zipPackagePath);
  let archive = new Archiver();
  archive.pipe(output);
  await archive.directory(packageInput);

  const accessToken = Buffer.from(username + ':' + password).toString('base64');
  
  let deploymentDetails = await oneDeploy(zipPackagePath, uri, accessToken);
  console.log(deploymentDetails);
}

async function oneDeploy(webPackage: string, scmUri: string, accessToken: string): Promise<any> {

  let httpClient = new HttpClient(undefined);

  let requestUri = scmUri + '/api/publish?async=true&type=zip&clean=true&restart=true';
  let headers = {
    'Authorization': `Basic ${accessToken}`,
    'Content-Type': 'application/octet-stream'
  };
  let body = fs.createReadStream(webPackage)
  
  let response = await httpClient.request('POST', requestUri, body, headers);
  
  if (response.message.statusCode != 202)
    throw response;

  let pollUri = response.message.headers.location;
  headers = {
    'Authorization': `Basic ${accessToken}`,
    'Content-Type': 'application/json; charset=utf-8'
  }
  
  while (true) {
    await new Promise(_ => setTimeout(_, 1000));
    
    let response = await httpClient.request('GET', pollUri, '', headers);
    
    if (response.message.statusCode == 202)
      continue;
    
    if (response.message.statusCode == 200)
      return await response.readBody();
    
    throw response; //another statuscode indicates something is wrong
  }
}

main();