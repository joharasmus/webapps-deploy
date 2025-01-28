
import * as fs from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';

import { Archiver } from './core.js';
import { setSecret } from './actionscore.js';
import { HttpClient } from './HttpClient.js';

import { select as xPathSelect } from 'xpath';

function getInput(name) {
  const val = process.env[`INPUT_${name.toUpperCase()}`];
  return val.trim();
}

async function main() {
  let publishProfileContent = getInput('publish-profile');
  let packageInput = getInput('package');

  let publishProfileXml = new DOMParser().parseFromString(publishProfileContent, "application/xml");

  let uri = xPathSelect("string(//publishProfile/@publishUrl)", publishProfileXml, true);
  uri = `https://${uri}`;

  let username = xPathSelect("string(//publishProfile/@userName)", publishProfileXml, true);
  setSecret(username);

  let password = xPathSelect("string(//publishProfile/@userPWD)", publishProfileXml, true)
  setSecret(password);

  let zipPackagePath = packageInput + ".zip";
  let output = fs.createWriteStream(zipPackagePath);
  let archive = new Archiver();
  archive.pipe(output);
  await archive.directory(packageInput);

  const accessToken = Buffer.from(username + ':' + password).toString('base64');
  
  let deploymentDetails = await oneDeploy(zipPackagePath, uri, accessToken);
  console.log(deploymentDetails);
}

async function oneDeploy(webPackage, scmUri, accessToken) {

  let httpClient = new HttpClient();

  let requestUri = scmUri + '/api/publish?async=true&type=zip&clean=true&restart=true';
  let headers = {
    'authorization': `Basic ${accessToken}`,
    'content-type': 'application/octet-stream'
  };
  let body = fs.createReadStream(webPackage)
  
  let response = await httpClient.request('POST', requestUri, body, headers);
  
  if (response.message.statusCode != 202)
    throw response;

  let pollUri = response.message.headers.location;
  headers = {
    'authorization': `Basic ${accessToken}`,
    'content-type': 'application/json; charset=utf-8'
  }
  
  while (true) {
    await new Promise(_ => setTimeout(_, 1000));
    
    httpClient.request('GET', pollUri, '', headers).then(response => 
      {
        if (response.message.statusCode != 200 && response.message.statusCode != 202)
          throw response;

        return response
      }).then(response =>
      {
        if (response.message.statusCode == 202)
          Promise.reject('202');

        let responseBody = response.readBody();
        return responseBody;
      }).catch(err => {});
  }
}

main();