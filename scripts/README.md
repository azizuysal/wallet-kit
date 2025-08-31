# JWT Generator Script

## Overview

The `generate-jwt.js` script generates JWT tokens for Google Wallet passes. It requires a private key to sign the tokens, which must be provided via environment variables for security.

## Setup

### 1. Set Your Private Key

You have two options:

#### Option A: Environment Variable (Recommended for CI/CD)

```bash
export GOOGLE_WALLET_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAK...
-----END RSA PRIVATE KEY-----"
```

#### Option B: Key File (Recommended for Local Development)

```bash
export GOOGLE_WALLET_KEY_FILE="/path/to/your/private-key.pem"
```

### 2. Configure Your Issuer Details (Optional)

```bash
# Your Google Wallet Issuer ID
export GOOGLE_WALLET_ISSUER_ID="3388000000022205871"

# Your service account email
export GOOGLE_WALLET_SERVICE_ACCOUNT="wallet-service@project.iam.gserviceaccount.com"

# Set to 'false' for production (removes [TEST ONLY] watermark)
export GOOGLE_WALLET_DEMO_MODE="true"
```

## Usage

### Generate a Generic Pass

```bash
node scripts/generate-jwt.js generic
```

### Generate an Event Ticket

```bash
node scripts/generate-jwt.js event
```

### Generate a Loyalty Card

```bash
node scripts/generate-jwt.js loyalty
```

### Save to File

```bash
node scripts/generate-jwt.js generic output.jwt
```

## For Testing Only

If you just want to test the script structure (without Google Wallet), you can generate a demo RSA key:

```bash
# Generate a test key (this won't work with actual Google Wallet)
openssl genrsa -out demo-key.pem 2048

# Use it with the script
export GOOGLE_WALLET_KEY_FILE="demo-key.pem"
node scripts/generate-jwt.js generic
```

## For Production

For actual Google Wallet integration, you need:

1. **Google Cloud Project** with Wallet API enabled
2. **Service Account** with appropriate permissions
3. **Google Wallet Issuer Account** (create at [Google Pay & Wallet Console](https://pay.google.com/business/console))
4. **Real Private Key** from your service account

### Getting a Real Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to IAM & Admin → Service Accounts
4. Create or select a service account
5. Create a new key (JSON format)
6. Extract the private key from the JSON file

## Security Notes

⚠️ **NEVER commit private keys to version control**
⚠️ **Always use environment variables or secure key management**
⚠️ **Rotate keys regularly**
⚠️ **Use different keys for development and production**

## Environment Variables Summary

| Variable                        | Description                   | Required |
| ------------------------------- | ----------------------------- | -------- |
| `GOOGLE_WALLET_PRIVATE_KEY`     | RSA private key string        | Yes\*    |
| `GOOGLE_WALLET_KEY_FILE`        | Path to private key file      | Yes\*    |
| `GOOGLE_WALLET_ISSUER_ID`       | Your Google Wallet Issuer ID  | No       |
| `GOOGLE_WALLET_SERVICE_ACCOUNT` | Service account email         | No       |
| `GOOGLE_WALLET_DEMO_MODE`       | Set to 'false' for production | No       |

\* One of these is required
