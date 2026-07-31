#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const deepMerge = (target, source) => {
  for (const [key, value] of Object.entries(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`Unsafe payload property: ${key}`);
    }
    if (
      isPlainObject(value) &&
      Object.hasOwn(target, key) &&
      isPlainObject(target[key])
    ) {
      deepMerge(target[key], value);
    } else {
      Object.defineProperty(target, key, {
        configurable: true,
        enumerable: true,
        value,
        writable: true,
      });
    }
  }
  return target;
};

const ensureGenericClasses = (payload, existingClassId) => {
  if (!Array.isArray(payload.genericObjects)) {
    return;
  }
  if (payload.genericObjects.length === 0) {
    throw new Error('Generic payload must contain at least one object');
  }

  if (existingClassId) {
    for (const object of payload.genericObjects) {
      object.classId = existingClassId;
    }
    return;
  }

  const classIds = [
    ...new Set(
      payload.genericObjects.map((object) => {
        if (typeof object.classId !== 'string' || object.classId.length === 0) {
          throw new Error('Every generic object must contain a classId');
        }
        return object.classId;
      })
    ),
  ];
  const definitions = Array.isArray(payload.genericClasses)
    ? payload.genericClasses
    : [];
  const definedIds = new Set(definitions.map((definition) => definition.id));
  for (const classId of classIds) {
    if (!definedIds.has(classId)) {
      definitions.push({ id: classId });
    }
  }
  payload.genericClasses = definitions;
};

function base64url(buffer) {
  return buffer
    .toString('base64')
    .replace(/[=]/g, '')
    .replace(/\+/g, '-')
    .replace(/[/]/g, '_');
}

function createPassClaims(config, defaultPayloadPath) {
  const classId =
    config.classId || `${config.issuerId}.demo_class_${Date.now()}`;
  const objectId =
    config.objectId || `${config.issuerId}.demo_object_${Date.now()}`;
  const defaultPayload = JSON.parse(
    fs.readFileSync(defaultPayloadPath, 'utf8')
  );
  const claims = {
    iss: config.serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [],
    payload: defaultPayload.payload,
  };

  if (claims.payload.genericObjects) {
    claims.payload.genericObjects[0].id = objectId;
    claims.payload.genericObjects[0].classId = classId;
    if (config.demoMode) {
      claims.payload.genericObjects[0].header.defaultValue.value =
        '[TEST ONLY]';
    }
  } else if (claims.payload.eventTicketObjects) {
    claims.payload.eventTicketObjects[0].id = objectId;
    claims.payload.eventTicketObjects[0].classId = classId;
    claims.payload.eventTicketClasses[0].id = classId;
    if (config.demoMode) {
      claims.payload.eventTicketClasses[0].eventName.defaultValue.value =
        '[TEST ONLY] ' +
        (claims.payload.eventTicketClasses[0].eventName.defaultValue.value ||
          'Event');
    }
  } else if (claims.payload.loyaltyObjects) {
    claims.payload.loyaltyObjects[0].id = objectId;
    claims.payload.loyaltyObjects[0].classId = classId;
    claims.payload.loyaltyClasses[0].id = classId;
    if (config.demoMode) {
      claims.payload.loyaltyClasses[0].programName =
        '[TEST ONLY] ' +
        (claims.payload.loyaltyClasses[0].programName || 'Loyalty Program');
    }
  }

  if (config.payloadFile) {
    const customPayload = JSON.parse(
      fs.readFileSync(config.payloadFile, 'utf8')
    );
    if (
      !isPlainObject(customPayload) ||
      !isPlainObject(customPayload.payload)
    ) {
      throw new Error(
        'Custom payload file must be an object containing a "payload" object'
      );
    }
    const protectedClaims = Object.keys(customPayload).filter(
      (key) => key !== 'payload'
    );
    if (protectedClaims.length > 0) {
      throw new Error(
        `Custom payload file cannot override protected JWT claims: ${protectedClaims.join(
          ', '
        )}`
      );
    }

    deepMerge(claims.payload, customPayload.payload);
  }

  ensureGenericClasses(claims.payload, config.classId);
  return claims;
}

function loadSigningCredentials(config) {
  const environmentKey = process.env.GOOGLE_WALLET_PRIVATE_KEY;
  if (environmentKey && config.keyFile) {
    throw new Error(
      'Signing credentials are ambiguous: set either GOOGLE_WALLET_PRIVATE_KEY or --keyFile, not both'
    );
  }
  if (!environmentKey && !config.keyFile) {
    throw new Error(
      'Signing credentials are missing: set GOOGLE_WALLET_PRIVATE_KEY or provide --keyFile'
    );
  }

  if (environmentKey) {
    if (!config.serviceAccountEmail) {
      throw new Error(
        'A service account email is required with GOOGLE_WALLET_PRIVATE_KEY'
      );
    }
    return {
      privateKey: environmentKey,
      serviceAccountEmail: config.serviceAccountEmail,
    };
  }

  const keyPath = path.resolve(config.keyFile);
  let source;
  try {
    source = fs.readFileSync(keyPath, 'utf8');
  } catch {
    throw new Error(`Signing credential file is unreadable: ${keyPath}`);
  }

  if (!keyPath.toLowerCase().endsWith('.json')) {
    if (!config.serviceAccountEmail) {
      throw new Error(
        'A service account email is required with a PEM key file'
      );
    }
    return {
      privateKey: source,
      serviceAccountEmail: config.serviceAccountEmail,
    };
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(source);
  } catch {
    throw new Error(`Service-account JSON is invalid: ${keyPath}`);
  }
  if (
    typeof serviceAccount.private_key !== 'string' ||
    serviceAccount.private_key.length === 0 ||
    typeof serviceAccount.client_email !== 'string' ||
    serviceAccount.client_email.length === 0
  ) {
    throw new Error(
      `Service-account JSON must contain private_key and client_email: ${keyPath}`
    );
  }
  if (
    config.serviceAccountEmail &&
    config.serviceAccountEmail !== serviceAccount.client_email
  ) {
    throw new Error(
      'The configured service account email does not match the credential file'
    );
  }
  return {
    privateKey: serviceAccount.private_key,
    serviceAccountEmail: serviceAccount.client_email,
  };
}

function signJWT(claims, privateKey) {
  const encodedHeader = base64url(
    Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  );
  const encodedClaims = base64url(Buffer.from(JSON.stringify(claims)));
  const signingInput = `${encodedHeader}.${encodedClaims}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign({
    key: privateKey,
    format: 'pem',
    type: 'pkcs8',
  });
  return `${signingInput}.${base64url(signature)}`;
}

function main() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 [options]')
    .strict()
    .option('type', {
      alias: 't',
      describe: 'Type of pass to generate',
      choices: ['generic', 'event', 'loyalty'],
      default: 'generic',
    })
    .option('output', {
      alias: 'o',
      describe: 'Path to save the JWT to',
      type: 'string',
      demandOption: true,
    })
    .option('payloadFile', {
      alias: 'p',
      describe: 'Path to a JSON file with custom payload data',
      type: 'string',
    })
    .option('issuerId', {
      describe: 'Google Wallet Issuer ID',
      type: 'string',
      default: process.env.GOOGLE_WALLET_ISSUER_ID,
      demandOption: true,
    })
    .option('serviceAccountEmail', {
      describe: 'Google Cloud service account email',
      type: 'string',
      default: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT,
    })
    .option('classId', {
      describe: 'Google Wallet Class ID',
      type: 'string',
      default: process.env.GOOGLE_WALLET_CLASS_ID,
    })
    .option('keyFile', {
      describe: 'Path to a PEM key or service-account JSON file',
      type: 'string',
      default: process.env.GOOGLE_WALLET_KEY_FILE,
    })
    .option('demoMode', {
      describe: 'Mark generated pass content as test-only',
      type: 'boolean',
      default: process.env.GOOGLE_WALLET_DEMO_MODE === 'true',
    })
    .help()
    .parseSync();

  try {
    const credentials = loadSigningCredentials(argv);
    const payloadFilename =
      argv.type === 'event'
        ? 'event-payload.json'
        : argv.type === 'loyalty'
          ? 'loyalty-payload.json'
          : 'generic-payload.json';
    const claims = createPassClaims(
      { ...argv, serviceAccountEmail: credentials.serviceAccountEmail },
      path.join(__dirname, payloadFilename)
    );
    const jwt = signJWT(claims, credentials.privateKey);
    const outputPath = path.resolve(argv.output);
    fs.writeFileSync(outputPath, jwt, { mode: 0o600 });
    fs.chmodSync(outputPath, 0o600);
    console.log(`JWT saved to ${outputPath}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  createPassClaims,
};
