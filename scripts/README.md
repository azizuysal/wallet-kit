# Google Wallet JWT Generator

This script generates signed JWTs for adding passes to Google Wallet. It is designed for testing and development purposes and can be used to create generic passes, event tickets, and loyalty cards.

## Features

- **Multiple Pass Types:** Generate JWTs for generic passes, event tickets, and loyalty cards.
- **Flexible Configuration:** Configure the script using environment variables, a configuration file, or command-line arguments.
- **Custom Payloads:** Use the default pass payloads as a starting point or provide your own custom payload file to create unique passes.
- **Automatic Help Message:** The script provides a detailed help message with all the available options.

## Configuration

The script can be configured in three ways, in the following order of precedence:

1.  **Command-line arguments:** (e.g., `--issuerId 12345`)
2.  **Environment variables:** (e.g., `export GOOGLE_WALLET_ISSUER_ID=12345`)
3.  **Configuration file:** (e.g., a `jwt.config.json` file)

### Command-line Options

| Option                  | Alias | Description                                                 | Type      | Default   | Required |
| ----------------------- | ----- | ----------------------------------------------------------- | --------- | --------- | -------- |
| `--type`                | `-t`  | Type of pass to generate (choices: generic, event, loyalty) | `string`  | `generic` |          |
| `--output`              | `-o`  | Path to save the JWT to                                     | `string`  |           |          |
| `--payloadFile`         | `-p`  | Path to a JSON file with custom payload data                | `string`  |           |          |
| `--issuerId`            |       | Google Wallet Issuer ID                                     | `string`  |           | ✓        |
| `--serviceAccountEmail` |       | Google Cloud service account email                          | `string`  |           | ✓        |
| `--classId`             |       | Google Wallet Class ID                                      | `string`  |           |          |
| `--privateKey`          |       | The private key itself                                      | `string`  |           |          |
| `--keyFile`             |       | Path to the private key file                                | `string`  |           |          |
| `--demoMode`            |       | Enable or disable demo mode                                 | `boolean` | `true`    |          |

### Environment Variables

You can also configure the script using environment variables with the `GOOGLE_WALLET_` prefix. For example:

```bash
export GOOGLE_WALLET_ISSUER_ID="YOUR_ISSUER_ID"
export GOOGLE_WALLET_SERVICE_ACCOUNT="YOUR_SERVICE_ACCOUNT_EMAIL"
export GOOGLE_WALLET_KEY_FILE="/path/to/your/private-key.json"
export GOOGLE_WALLET_CLASS_ID="YOUR_ISSUER_ID.pass-class-01"
```

## Usage

### Generate a Default Generic Pass

```bash
node scripts/generate-jwt.js
```

### Generate an Event Ticket

```bash
node scripts/generate-jwt.js --type event
```

### Generate a Loyalty Card and Save to a File

```bash
node scripts/generate-jwt.js --type loyalty --output loyalty.jwt
```

### Use a Custom Payload File

1.  Copy one of the default payload files (e.g., `generic-payload.json`) to a new file (e.g., `my-pass.json`).
2.  Modify `my-pass.json` with your desired pass data.
3.  Run the script with the `--payloadFile` option:

```bash
node scripts/generate-jwt.js --payloadFile my-pass.json
```

## Default Payloads

This directory contains three default payload files:

- `generic-payload.json`
- `event-payload.json`
- `loyalty-payload.json`

These files are used as the default templates for generating passes. You can use them as a starting point for creating your own custom passes.
