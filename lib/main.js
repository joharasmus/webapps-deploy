
import * as fs from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';

import { Archiver } from './core.js';
import { setSecret } from './actionscore.js';
import { HttpClient } from './HttpClient.js';

import { select as xPathSelect } from 'xpath';

function getInput(name) {
  const val = process.env[name];
  return val.trim();
}

async function main() {
  let publishProfileContent = getInput('INPUT_PUBLISH-PROFILE');
  let packageInput = getInput('INPUT_PACKAGE');

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
  
  let cont = true;
  let responseBody;

  while (cont) {
    await new Promise(res => setTimeout(res, 3000));
    
    responseBody = httpClient.request('GET', pollUri, '', headers).then(response =>
    {
      console.log(response.message.statusCode);

      if (response.message.statusCode == 200) {
        let respBody = response.readBody().then(rb => rb);
        cont = false;
        return respBody;
      }

      if (response.message.statusCode != 202)
        throw response;
    });
  }

  return responseBody;
}

await main();