#!/usr/bin/env node

/* eslint-env node */

/**
 * JWT Generator for Google Wallet Testing
 *
 * This script generates test JWTs for Google Wallet passes in demo mode.
 * For production use, you'll need to:
 * 1. Create a service account with proper permissions
 * 2. Update the private key
 * 3. Remove the demo mode restrictions
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Configuration (can be overridden with environment variables)
const CONFIG = {
  // Google Wallet Issuer ID (from environment or default demo value)
  issuerId: process.env.GOOGLE_WALLET_ISSUER_ID || '3388000000022205871',

  // Service account email (from environment or default demo value)
  serviceAccountEmail:
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT ||
    'wallet-service-account@your-project.iam.gserviceaccount.com',

  // Demo mode - set GOOGLE_WALLET_DEMO_MODE=false for production
  demoMode: process.env.GOOGLE_WALLET_DEMO_MODE !== 'false',
};

/**
 * Base64url encode
 */
function base64url(buffer) {
  return buffer
    .toString('base64')
    .replace(/[=]/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
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
 * Create JWT claims for a generic pass
 */
function createGenericPassClaims(options = {}) {
  const classId =
    options.classId || `${CONFIG.issuerId}.demo_class_${Date.now()}`;
  const objectId =
    options.objectId || `${CONFIG.issuerId}.demo_object_${Date.now()}`;

  const now = Math.floor(Date.now() / 1000);

  return {
    iss: CONFIG.serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: now,
    origins: [],
    payload: {
      genericObjects: [
        {
          id: objectId,
          classId: classId,
          genericType: 'GENERIC_TYPE_UNSPECIFIED',
          hexBackgroundColor: '#4285f4',
          logo: {
            sourceUri: {
              uri: 'https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg',
            },
          },
          cardTitle: {
            defaultValue: {
              language: 'en',
              value: 'Test Pass',
            },
          },
          subheader: {
            defaultValue: {
              language: 'en',
              value: 'Demo Mode',
            },
          },
          header: {
            defaultValue: {
              language: 'en',
              value: CONFIG.demoMode ? '[TEST ONLY]' : 'Wallet Kit',
            },
          },
          barcode: {
            type: 'QR_CODE',
            value: `DEMO-${Date.now()}`,
          },
          heroImage: {
            sourceUri: {
              uri: 'https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/google-io-hero-demo-only.jpg',
            },
          },
          textModulesData: [
            {
              header: 'POINTS',
              body: '1234',
              id: 'points',
            },
            {
              header: 'MEMBER',
              body: 'Test User',
              id: 'member',
            },
          ],
          state: 'ACTIVE',
        },
      ],
    },
  };
}

/**
 * Create JWT claims for an event ticket
 */
function createEventTicketClaims(options = {}) {
  const classId =
    options.classId || `${CONFIG.issuerId}.event_class_${Date.now()}`;
  const objectId =
    options.objectId || `${CONFIG.issuerId}.event_object_${Date.now()}`;

  const now = Math.floor(Date.now() / 1000);

  return {
    iss: CONFIG.serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: now,
    origins: [],
    payload: {
      eventTicketObjects: [
        {
          id: objectId,
          classId: classId,
          state: 'ACTIVE',
          seatInfo: {
            seat: {
              defaultValue: {
                language: 'en',
                value: 'A123',
              },
            },
            row: {
              defaultValue: {
                language: 'en',
                value: '5',
              },
            },
            section: {
              defaultValue: {
                language: 'en',
                value: 'General',
              },
            },
          },
          barcode: {
            type: 'QR_CODE',
            value: `EVENT-${Date.now()}`,
          },
          ticketHolderName: 'Test User',
          validTimeInterval: {
            start: {
              date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            },
          },
        },
      ],
      eventTicketClasses: [
        {
          id: classId,
          issuerName: 'Wallet Kit Demo',
          eventName: {
            defaultValue: {
              language: 'en',
              value: 'Test Event',
            },
          },
          venue: {
            name: {
              defaultValue: {
                language: 'en',
                value: 'Demo Venue',
              },
            },
            address: {
              defaultValue: {
                language: 'en',
                value: '123 Demo Street',
              },
            },
          },
          dateTime: {
            start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          },
          reviewStatus: 'UNDER_REVIEW',
          hexBackgroundColor: '#FF5733',
        },
      ],
    },
  };
}

/**
 * Create JWT claims for a loyalty card
 */
function createLoyaltyCardClaims(options = {}) {
  const classId =
    options.classId || `${CONFIG.issuerId}.loyalty_class_${Date.now()}`;
  const objectId =
    options.objectId || `${CONFIG.issuerId}.loyalty_object_${Date.now()}`;

  const now = Math.floor(Date.now() / 1000);

  return {
    iss: CONFIG.serviceAccountEmail,
    aud: 'google',
    typ: 'savetowallet',
    iat: now,
    origins: [],
    payload: {
      loyaltyObjects: [
        {
          id: objectId,
          classId: classId,
          state: 'ACTIVE',
          accountId: 'member-12345',
          accountName: 'Test User',
          barcode: {
            type: 'QR_CODE',
            value: `LOYALTY-${Date.now()}`,
          },
          loyaltyPoints: {
            balance: {
              int: 500,
            },
            label: 'Points',
          },
        },
      ],
      loyaltyClasses: [
        {
          id: classId,
          issuerName: 'Wallet Kit Demo',
          programName: 'Demo Rewards',
          programLogo: {
            sourceUri: {
              uri: 'https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg',
            },
          },
          reviewStatus: 'UNDER_REVIEW',
          hexBackgroundColor: '#4285f4',
          accountIdLabel: 'Member ID',
          accountNameLabel: 'Member Name',
        },
      ],
    },
  };
}

/**
 * Get private key from environment or prompt user
 * In production, use a real service account private key
 */
function getPrivateKey() {
  // Check for environment variable first
  if (process.env.GOOGLE_WALLET_PRIVATE_KEY) {
    console.log(
      '✅ Using private key from GOOGLE_WALLET_PRIVATE_KEY environment variable'
    );
    return process.env.GOOGLE_WALLET_PRIVATE_KEY;
  }

  // Check for key file path
  if (process.env.GOOGLE_WALLET_KEY_FILE) {
    console.log(
      `✅ Loading private key from file: ${process.env.GOOGLE_WALLET_KEY_FILE}`
    );
    return fs.readFileSync(process.env.GOOGLE_WALLET_KEY_FILE, 'utf8');
  }

  // Provide instructions for demo key
  console.log('\n⚠️  No private key found!');
  console.log('\nTo use this script, you need to provide a private key:');
  console.log('\nOption 1: Set environment variable');
  console.log(
    '  export GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."'
  );
  console.log('\nOption 2: Provide key file path');
  console.log('  export GOOGLE_WALLET_KEY_FILE="/path/to/private-key.pem"');
  console.log('\nOption 3: Create a demo key for testing');
  console.log('  You can generate a test key using:');
  console.log('  openssl genrsa -out demo-key.pem 2048');
  console.log('\n📝 Note: For actual Google Wallet integration, you need:');
  console.log('  1. A Google Cloud service account');
  console.log('  2. Google Wallet API enabled');
  console.log('  3. Proper issuer ID and permissions');

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

  const signature = sign.sign(privateKey);
  const encodedSignature = base64url(signature);

  return `${signingInput}.${encodedSignature}`;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'generic';
  const output = args[1] || null;

  let claims;

  switch (type) {
    case 'event':
      claims = createEventTicketClaims();
      console.log('📎 Generating Event Ticket JWT...');
      break;
    case 'loyalty':
      claims = createLoyaltyCardClaims();
      console.log('💳 Generating Loyalty Card JWT...');
      break;
    case 'generic':
    default:
      claims = createGenericPassClaims();
      console.log('🎫 Generating Generic Pass JWT...');
      break;
  }

  const privateKey = getPrivateKey();
  const jwt = signJWT(claims, privateKey);

  if (output) {
    const outputPath = path.resolve(output);
    fs.writeFileSync(outputPath, jwt);
    console.log(`✅ JWT saved to: ${outputPath}`);
  } else {
    console.log('\n📋 JWT Token:');
    console.log('─'.repeat(80));
    console.log(jwt);
    console.log('─'.repeat(80));
  }

  console.log('\n📌 Instructions:');
  console.log('1. This is a DEMO JWT for testing purposes only');
  console.log('2. For production, you need:');
  console.log('   - A real Google Wallet Issuer account');
  console.log('   - A service account with proper permissions');
  console.log(
    '   - Replace the demo private key with your service account key'
  );
  console.log(
    '3. Save this JWT to example/android/app/src/main/assets/samples/'
  );
  console.log('4. Or use it directly in your Android testing');

  if (CONFIG.demoMode) {
    console.log('\n⚠️  Demo Mode: Passes will show [TEST ONLY] watermark');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createGenericPassClaims,
  createEventTicketClaims,
  createLoyaltyCardClaims,
  signJWT,
  base64url,
};
