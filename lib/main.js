
import * as fs from 'node:fs';
import { DOMParser } from '@xmldom/xmldom';

import { Archiver } from './core.js';
import { HttpClient } from './HttpClient.js';

import { selectWithResolver as xPathSelect } from 'xpath';


function setSecret(secret) {
  let cmdStr = '::add-mask::' + secret + '\n';
  process.stdout.write(cmdStr);
}

async function main() {
  let publishProfileContent = process.env['INPUT_PUBLISH-PROFILE'];
  let packageInput = process.env['INPUT_PACKAGE'];

  let publishProfileXml = new DOMParser().parseFromString(publishProfileContent, "application/xml");

  let uri = xPathSelect("string(//publishProfile/@publishUrl)", publishProfileXml, null, true);
  uri = `https://${uri}`;

  let username = xPathSelect("string(//publishProfile/@userName)", publishProfileXml, null, true);
  setSecret(username);

  let password = xPathSelect("string(//publishProfile/@userPWD)", publishProfileXml, null, true)
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
    await new Promise(res => setTimeout(res, 1000));
    
    responseBody = httpClient.request('GET', pollUri, '', headers).then(response =>
    {
      console.log(response.message.statusCode);

      if (response.message.statusCode == 200) {
        cont = false;
        let respBody = response.readBody().then(rb => rb);
        return respBody;
      }

      if (response.message.statusCode != 202){
        console.log(response.message.statusMessage);
        throw response;
      }
    });
  }

  return responseBody;
}

await main();