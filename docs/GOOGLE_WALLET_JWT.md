# Google Wallet JWT Structure Documentation

## Overview

Google Wallet uses JWT (JSON Web Token) format for securely transmitting pass data. This document explains the JWT structure, requirements, and how to generate valid JWTs for different pass types.

## JWT Structure

A Google Wallet JWT consists of three parts separated by dots:

```
header.payload.signature
```

### 1. Header

The header specifies the algorithm and token type:

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

- `alg`: Must be "RS256" (RSA signature with SHA-256)
- `typ`: Must be "JWT"

### 2. Payload (Claims)

The payload contains the pass data and metadata:

```json
{
  "iss": "service-account@project.iam.gserviceaccount.com",
  "aud": "google",
  "typ": "savetowallet",
  "iat": 1234567890,
  "origins": [],
  "payload": {
    // Pass-specific data here
  }
}
```

#### Required Claims

- `iss` (Issuer): Your service account email
- `aud` (Audience): Must be "google"
- `typ` (Type): Must be "savetowallet"
- `iat` (Issued At): Unix timestamp
- `origins`: Array of allowed origins (empty for mobile)
- `payload`: Contains the actual pass data

### 3. Signature

The signature is created using RS256 algorithm with your service account's private key.

## Pass Types

### Generic Pass

Most flexible pass type for general use:

```json
{
  "payload": {
    "genericObjects": [
      {
        "id": "ISSUER_ID.OBJECT_ID",
        "classId": "ISSUER_ID.CLASS_ID",
        "genericType": "GENERIC_TYPE_UNSPECIFIED",
        "hexBackgroundColor": "#4285f4",
        "logo": {
          "sourceUri": {
            "uri": "https://example.com/logo.png"
          }
        },
        "cardTitle": {
          "defaultValue": {
            "language": "en",
            "value": "My Pass"
          }
        },
        "header": {
          "defaultValue": {
            "language": "en",
            "value": "Header Text"
          }
        },
        "barcode": {
          "type": "QR_CODE",
          "value": "12345678"
        },
        "state": "ACTIVE"
      }
    ]
  }
}
```

### Event Ticket

For concerts, sports events, conferences:

```json
{
  "payload": {
    "eventTicketObjects": [
      {
        "id": "ISSUER_ID.OBJECT_ID",
        "classId": "ISSUER_ID.CLASS_ID",
        "state": "ACTIVE",
        "seatInfo": {
          "seat": {
            "defaultValue": {
              "language": "en",
              "value": "A123"
            }
          },
          "row": {
            "defaultValue": {
              "language": "en",
              "value": "5"
            }
          },
          "section": {
            "defaultValue": {
              "language": "en",
              "value": "General"
            }
          }
        },
        "barcode": {
          "type": "QR_CODE",
          "value": "TICKET123456"
        },
        "ticketHolderName": "John Doe",
        "validTimeInterval": {
          "start": {
            "date": "2024-12-25T19:00:00Z"
          }
        }
      }
    ],
    "eventTicketClasses": [
      {
        "id": "ISSUER_ID.CLASS_ID",
        "issuerName": "Event Organizer",
        "eventName": {
          "defaultValue": {
            "language": "en",
            "value": "Concert Name"
          }
        },
        "venue": {
          "name": {
            "defaultValue": {
              "language": "en",
              "value": "Arena Name"
            }
          },
          "address": {
            "defaultValue": {
              "language": "en",
              "value": "123 Main St"
            }
          }
        },
        "dateTime": {
          "start": "2024-12-25T19:00:00Z"
        },
        "reviewStatus": "UNDER_REVIEW",
        "hexBackgroundColor": "#FF5733"
      }
    ]
  }
}
```

### Loyalty Card

For membership and rewards programs:

```json
{
  "payload": {
    "loyaltyObjects": [
      {
        "id": "ISSUER_ID.OBJECT_ID",
        "classId": "ISSUER_ID.CLASS_ID",
        "state": "ACTIVE",
        "accountId": "member-12345",
        "accountName": "John Doe",
        "barcode": {
          "type": "QR_CODE",
          "value": "MEMBER12345"
        },
        "loyaltyPoints": {
          "balance": {
            "int": 500
          },
          "label": "Points"
        }
      }
    ],
    "loyaltyClasses": [
      {
        "id": "ISSUER_ID.CLASS_ID",
        "issuerName": "Company Name",
        "programName": "Rewards Program",
        "programLogo": {
          "sourceUri": {
            "uri": "https://example.com/logo.png"
          }
        },
        "reviewStatus": "UNDER_REVIEW",
        "hexBackgroundColor": "#4285f4",
        "accountIdLabel": "Member ID",
        "accountNameLabel": "Member Name"
      }
    ]
  }
}
```

### Boarding Pass

For flight tickets:

```json
{
  "payload": {
    "flightObjects": [
      {
        "id": "ISSUER_ID.OBJECT_ID",
        "classId": "ISSUER_ID.CLASS_ID",
        "state": "ACTIVE",
        "passengerName": "John Doe",
        "boardingAndSeatingInfo": {
          "boardingGroup": "A",
          "seatNumber": "12A",
          "boardingPosition": "23"
        },
        "reservationInfo": {
          "confirmationCode": "ABC123"
        },
        "barcode": {
          "type": "AZTEC",
          "value": "FLIGHT123456"
        }
      }
    ],
    "flightClasses": [
      {
        "id": "ISSUER_ID.CLASS_ID",
        "issuerName": "Airline Name",
        "reviewStatus": "UNDER_REVIEW",
        "localScheduledDepartureDateTime": "2024-12-25T10:00:00",
        "flightHeader": {
          "carrier": {
            "carrierIataCode": "AA"
          },
          "flightNumber": "123"
        },
        "origin": {
          "airportIataCode": "SFO",
          "terminal": "2",
          "gate": "G3"
        },
        "destination": {
          "airportIataCode": "LAX",
          "terminal": "5",
          "gate": "B2"
        }
      }
    ]
  }
}
```

### Gift Card

For store credit and gift cards:

```json
{
  "payload": {
    "giftCardObjects": [
      {
        "id": "ISSUER_ID.OBJECT_ID",
        "classId": "ISSUER_ID.CLASS_ID",
        "state": "ACTIVE",
        "balance": {
          "micros": 50000000,
          "currencyCode": "USD"
        },
        "cardNumber": "1234 5678 9012 3456",
        "pin": "1234",
        "barcode": {
          "type": "QR_CODE",
          "value": "GIFT123456"
        }
      }
    ],
    "giftCardClasses": [
      {
        "id": "ISSUER_ID.CLASS_ID",
        "issuerName": "Store Name",
        "reviewStatus": "UNDER_REVIEW",
        "programLogo": {
          "sourceUri": {
            "uri": "https://example.com/logo.png"
          }
        },
        "hexBackgroundColor": "#00BCD4"
      }
    ]
  }
}
```

### Transit Pass

For public transportation:

```json
{
  "payload": {
    "transitObjects": [
      {
        "id": "ISSUER_ID.OBJECT_ID",
        "classId": "ISSUER_ID.CLASS_ID",
        "state": "ACTIVE",
        "passengerType": "ADULT",
        "passengerNames": "John Doe",
        "ticketLeg": {
          "originStationCode": "STATION_A",
          "destinationStationCode": "STATION_B",
          "departureDateTime": "2024-12-25T08:00:00Z",
          "arrivalDateTime": "2024-12-25T09:30:00Z"
        },
        "barcode": {
          "type": "QR_CODE",
          "value": "TRANSIT123456"
        }
      }
    ],
    "transitClasses": [
      {
        "id": "ISSUER_ID.CLASS_ID",
        "issuerName": "Transit Authority",
        "reviewStatus": "UNDER_REVIEW",
        "logo": {
          "sourceUri": {
            "uri": "https://example.com/logo.png"
          }
        },
        "transitType": "TRAIN",
        "hexBackgroundColor": "#009688"
      }
    ]
  }
}
```

## Common Fields

### Barcode Types

- `QR_CODE`: Most common, good for long data
- `AZTEC`: Compact 2D barcode
- `CODE_128`: 1D barcode for short data
- `CODE_39`: Alphanumeric 1D barcode
- `EAN_13`: European Article Number
- `EAN_8`: Shorter EAN
- `ITF_14`: Shipping/logistics
- `PDF_417`: High capacity 2D barcode
- `UPC_A`: Universal Product Code

### State Values

- `ACTIVE`: Pass is active and usable
- `COMPLETED`: Pass has been used
- `EXPIRED`: Pass is expired
- `INACTIVE`: Pass is temporarily disabled

### Localization

All text fields support localization:

```json
{
  "header": {
    "defaultValue": {
      "language": "en",
      "value": "English Text"
    },
    "translatedValues": [
      {
        "language": "es",
        "value": "Texto en Español"
      },
      {
        "language": "fr",
        "value": "Texte en Français"
      }
    ]
  }
}
```

## Security Requirements

### Service Account Setup

1. Create a service account in Google Cloud Console
2. Grant "Google Wallet API Service Agent" role
3. Generate and download private key (JSON format)
4. Use the private key to sign JWTs

### JWT Signing

```javascript
const jwt = require('jsonwebtoken');
const privateKey = require('./service-account-key.json');

const claims = {
  iss: privateKey.client_email,
  aud: 'google',
  typ: 'savetowallet',
  iat: Math.floor(Date.now() / 1000),
  origins: [],
  payload: {
    /* pass data */
  },
};

const token = jwt.sign(claims, privateKey.private_key, {
  algorithm: 'RS256',
});
```

## Testing

### Demo Mode

- Passes show "[TEST ONLY]" watermark
- Only visible to authorized test users
- No production access required

### Production Mode

- Requires approved Google Wallet issuer account
- Passes visible to all users
- Must pass Google's review process

## Size Limitations

- Maximum JWT size: 200KB
- Image URLs must be HTTPS
- Images should be optimized for mobile
- Recommended logo size: 660x660px
- Recommended hero image: 1032x336px

## Best Practices

1. **Use HTTPS for all URLs**: Required for security
2. **Optimize images**: Reduce load times
3. **Include fallback text**: For accessibility
4. **Test on real devices**: Emulators may not show all features
5. **Handle errors gracefully**: Check for wallet availability
6. **Keep JWTs fresh**: Generate new ones as needed
7. **Use appropriate pass types**: Match the use case
8. **Localize content**: Support multiple languages
9. **Version your classes**: Use semantic versioning
10. **Monitor usage**: Track pass additions and updates

## Error Codes

Common errors when adding passes:

- `ERROR_CODE_INVALID_JWT`: Malformed or expired JWT
- `ERROR_CODE_MISSING_FIELDS`: Required fields missing
- `ERROR_CODE_INVALID_ISSUER`: Issuer not authorized
- `ERROR_CODE_CLASS_NOT_FOUND`: Referenced class doesn't exist
- `ERROR_CODE_DUPLICATE_ID`: Object ID already exists
- `ERROR_CODE_INVALID_STATE`: Invalid state transition

## Resources

- [Google Wallet API Documentation](https://developers.google.com/wallet)
- [Pass Builder Tool](https://developers.google.com/wallet/generic/resources/pass-builder)
- [JWT Debugger](https://jwt.io/)
- [Google Pay & Wallet Console](https://pay.google.com/business/console)
- [Codelabs Tutorial](https://codelabs.developers.google.com/add-to-wallet-web)

## Support

For Google Wallet API issues:

- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-wallet-api)
- [Issue Tracker](https://issuetracker.google.com/issues/new?component=192561)
- [Developer Community](https://developers.google.com/community)
