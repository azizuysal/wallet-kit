#!/usr/bin/env node

/* eslint-env node */

/**
 * JWT Generator for Google Wallet Testing
 *
 * This script generates test JWTs for Google Wallet passes.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const deepMerge = (target, source) => {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
};

/**
 * Base64url encode
 */
function base64url(buffer) {
  return buffer
    .toString('base64')
    .replace(/[=]/g, '')
    .replace(/\+/g, '-')
    .replace(/[/]/g, '_');
}

/**
 * Create JWT header
 */
function createHeader() {
  return {
    alg: 'RS256',
    typ: 'JWT',
  };
}

/**
 * Create JWT claims for a pass
 */
function createPassClaims(config, defaultPayloadPath) {
  const classId =
    config.classId || `${config.issuerId}.demo_class_${Date.now()}`;
  const objectId =
    config.objectId || `${config.issuerId}.demo_object_${Date.now()}`;

  const now = Math.floor(Date.now() / 1000);

  const defaultPayload = JSON.parse(
    fs.readFileSync(defaultPayloadPath, 'utf8')
  );

  const claims = {
    iss: config.serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: now,
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
    return deepMerge(claims, customPayload);
  }

  return claims;
}

/**
 * Get private key from config
 */
function getPrivateKey(config) {
  if (config.privateKey) {
    console.log('✅ Using private key from config or environment variable');
    return config.privateKey;
  }

  if (config.keyFile) {
    console.log(`✅ Loading private key from file: ${config.keyFile}`);
    const keyPath = config.keyFile;

    if (keyPath.endsWith('.json')) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        if (serviceAccount.private_key) {
          return serviceAccount.private_key;
        } else {
          console.error('❌ No private_key found in JSON file');
          process.exit(1);
        }
      } catch (error) {
        console.error('❌ Error reading JSON key file:', error.message);
        process.exit(1);
      }
    } else {
      return fs.readFileSync(keyPath, 'utf8');
    }
  }

  console.error('\n⚠️  No private key found!');
  process.exit(1);
}

/**
 * Sign JWT with RS256
 */
function signJWT(claims, privateKey) {
  const header = createHeader();
  const encodedHeader = base64url(Buffer.from(JSON.stringify(header)));
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
  const encodedSignature = base64url(signature);
  return `${signingInput}.${encodedSignature}`;
}

/**
 * Main function
 */
function main() {
  const envConfig = {
    issuerId: process.env.GOOGLE_WALLET_ISSUER_ID,
    serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT,
    classId: process.env.GOOGLE_WALLET_CLASS_ID,
    privateKey: process.env.GOOGLE_WALLET_PRIVATE_KEY,
    keyFile: process.env.GOOGLE_WALLET_KEY_FILE,
    demoMode: process.env.GOOGLE_WALLET_DEMO_MODE
      ? process.env.GOOGLE_WALLET_DEMO_MODE !== 'false'
      : undefined,
  };

  const argv = yargs(hideBin(process.argv))
    .config(envConfig)
    .usage('Usage: $0 [options]')
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
    })
    .option('payloadFile', {
      alias: 'p',
      describe: 'Path to a JSON file with custom payload data',
      type: 'string',
    })
    .option('issuerId', {
      describe: 'Google Wallet Issuer ID',
      type: 'string',
    })
    .option('serviceAccountEmail', {
      describe: 'Google Cloud service account email',
      type: 'string',
    })
    .option('classId', {
      describe: 'Google Wallet Class ID',
      type: 'string',
    })
    .option('privateKey', {
      describe: 'The private key itself',
      type: 'string',
    })
    .option('keyFile', {
      describe: 'Path to the private key file',
      type: 'string',
    })
    .option('demoMode', {
      describe: 'Enable or disable demo mode',
      type: 'boolean',
      default: true,
    })
    .demandOption(
      ['issuerId', 'serviceAccountEmail'],
      'Please provide an issuer ID and service account email'
    )
    .help().argv;

  let claims;
  let defaultPayloadPath;

  switch (argv.type) {
    case 'event':
      defaultPayloadPath = path.join(__dirname, 'event-payload.json');
      console.log('📎 Generating Event Ticket JWT...');
      break;
    case 'loyalty':
      defaultPayloadPath = path.join(__dirname, 'loyalty-payload.json');
      console.log('💳 Generating Loyalty Card JWT...');
      break;
    case 'generic':
    default:
      defaultPayloadPath = path.join(__dirname, 'generic-payload.json');
      console.log('🎫 Generating Generic Pass JWT...');
      break;
  }

  claims = createPassClaims(argv, defaultPayloadPath);

  const privateKey = getPrivateKey(argv);
  const jwt = signJWT(claims, privateKey);

  if (argv.output) {
    const outputPath = path.resolve(argv.output);
    fs.writeFileSync(outputPath, jwt);
    console.log(`✅ JWT saved to: ${outputPath}`);
  } else {
    console.log('\n📋 JWT Token:');
    console.log('─'.repeat(80));
    console.log(jwt);
    console.log('─'.repeat(80));
  }
}

if (require.main === module) {
  main();
}
