# Google Wallet JWT generator

`generate-jwt.js` creates signed Google Wallet JWT files for local development and dedicated test issuers. Production applications should generate JWTs in a trusted backend. Never ship service-account credentials or private keys in a mobile application.

The command requires an output path and exactly one credential source. It writes the JWT with mode `0600` and never prints the JWT or key material.

## Credential sources

Choose one:

- `--keyFile /path/to/service-account.json`: reads both `private_key` and `client_email` from Google service-account JSON.
- `--keyFile /path/to/private-key.pem` plus `--serviceAccountEmail`: reads a PEM key and an explicitly supplied account email.
- `GOOGLE_WALLET_PRIVATE_KEY` plus `GOOGLE_WALLET_SERVICE_ACCOUNT`: reads the key from the environment and the email from the argument or environment.

The command fails when credential sources are missing, ambiguous, unreadable, invalid, or have conflicting account emails. The former `--privateKey` command-line option is not supported because command arguments can be exposed in process listings and shell history.

Store local credential files outside the repository. `.env*`, PEM/key files, and common credential filenames are ignored and rejected by tracked-file and package-content scans.

## Options

| Option                  | Alias | Description                            | Default                         |
| ----------------------- | ----- | -------------------------------------- | ------------------------------- |
| `--type`                | `-t`  | `generic`, `event`, or `loyalty`       | `generic`                       |
| `--output`              | `-o`  | Required JWT output path               | none                            |
| `--payloadFile`         | `-p`  | JSON merged into the selected template | none                            |
| `--issuerId`            |       | Required Google Wallet issuer ID       | `GOOGLE_WALLET_ISSUER_ID`       |
| `--serviceAccountEmail` |       | Service-account email                  | `GOOGLE_WALLET_SERVICE_ACCOUNT` |
| `--classId`             |       | Existing or test class ID              | `GOOGLE_WALLET_CLASS_ID`        |
| `--keyFile`             |       | PEM or service-account JSON path       | `GOOGLE_WALLET_KEY_FILE`        |
| `--demoMode`            |       | Mark generated content as test-only    | `false`                         |

## Examples

With service-account JSON:

```sh
node scripts/generate-jwt.js \
  --issuerId 1234567890 \
  --keyFile /secure/test-wallet-service-account.json \
  --output /tmp/generic-test.jwt \
  --demoMode
```

With a PEM file:

```sh
node scripts/generate-jwt.js \
  --type event \
  --issuerId 1234567890 \
  --serviceAccountEmail wallet-test@example-project.iam.gserviceaccount.com \
  --keyFile /secure/wallet-test.pem \
  --output /tmp/event-test.jwt \
  --demoMode
```

With environment-managed credentials:

```sh
GOOGLE_WALLET_PRIVATE_KEY="$GOOGLE_WALLET_TEST_PRIVATE_KEY" \
GOOGLE_WALLET_SERVICE_ACCOUNT="wallet-test@example-project.iam.gserviceaccount.com" \
GOOGLE_WALLET_ISSUER_ID="1234567890" \
node scripts/generate-jwt.js --output /tmp/loyalty-test.jwt --type loyalty --demoMode
```

Do not paste private keys directly into a terminal command or chat. Load them from a local secret manager or protected environment file.

## Payload templates

The default templates are `generic-payload.json`, `event-payload.json`, and `loyalty-payload.json`. A `--payloadFile` is deeply merged into the selected template. Prototype-mutating keys are rejected.

Generated sample JWTs are ignored by Git and must not be committed.
