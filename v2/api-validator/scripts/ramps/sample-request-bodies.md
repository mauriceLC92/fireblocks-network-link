# Sample CreateRamp Request Bodies

These request bodies are schema-valid against the Fireblocks Network Link API validator.
Replace `partnerId`, `apiKey`, and `idempotencyKey` with real values before use.

The asset ID `ba215aa5-454d-4415-a575-8078e3dfeb4c` is the registered USDC asset in the
Fireblocks Network Link environment and is used for all crypto legs below.

---

## 1. MoMo On-Ramp — TZS → USDC

Mobile money collection in Tanzania, settled to a blockchain address.

```json
{
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
  "amount": "100000",
  "partnerId": "<your-partner-id>",
  "apiKey": "<your-api-key>",
  "type": "OnRamp",
  "from": {
    "asset": {
      "nationalCurrencyCode": "TZS",
      "testAsset": true
    },
    "transferMethod": "Momo",
    "provider": "m-pesa",
    "mobilePhoneNumber": "+255712345678",
    "email": "sender@example.com"
  },
  "to": {
    "asset": {
      "assetId": "ba215aa5-454d-4415-a575-8078e3dfeb4c"
    },
    "transferMethod": "PublicBlockchain",
    "address": "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe"
  },
  "participantsIdentification": {
    "originator": {
      "externalReferenceId": "user-tz-001",
      "entityType": "Individual",
      "participantRelationshipType": "FirstParty",
      "fullName": {
        "firstName": "Amina",
        "lastName": "Hassan"
      },
      "dateOfBirth": "1990-04-12",
      "phone": "+255712345678",
      "email": "sender@example.com",
      "postalAddress": {
        "streetName": "Samora Avenue",
        "buildingNumber": "10",
        "postalCode": "11101",
        "city": "Dar es Salaam",
        "subdivision": "Dar es Salaam Region",
        "district": "Ilala",
        "country": "TZ"
      }
    },
    "beneficiary": {
      "externalReferenceId": "user-tz-001",
      "entityType": "Individual",
      "participantRelationshipType": "FirstParty",
      "fullName": {
        "firstName": "Amina",
        "lastName": "Hassan"
      },
      "dateOfBirth": "1990-04-12",
      "postalAddress": {
        "streetName": "Samora Avenue",
        "buildingNumber": "10",
        "postalCode": "11101",
        "city": "Dar es Salaam",
        "subdivision": "Dar es Salaam Region",
        "district": "Ilala",
        "country": "TZ"
      }
    }
  }
}
```

**Notes:**
- `provider` must be one of: `m-pesa`, `airtel`, `mtn`, `tigo`, `orange`, `wave`. MTN is active in Tanzania.
- `mobilePhoneNumber` and `email` are required for Momo transfers.
- `executionDetails` is optional. Include it to pin a previously generated quote:
  ```json
  "executionDetails": { "type": "Quote", "quoteId": "<quote-id>" }
  ```

---

## 2. MoMo Off-Ramp — USDC → KES

Crypto sent by Fireblocks, disbursed via M-Pesa to a Kenya mobile number.

```json
{
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440001",
  "amount": "17",
  "partnerId": "<your-partner-id>",
  "apiKey": "<your-api-key>",
  "type": "OffRamp",
  "from": {
    "asset": {
      "assetId": "ba215aa5-454d-4415-a575-8078e3dfeb4c"
    },
    "transferMethod": "PublicBlockchain"
  },
  "to": {
    "asset": {
      "nationalCurrencyCode": "KES",
      "testAsset": true
    },
    "transferMethod": "Momo",
    "provider": "m-pesa",
    "mobilePhoneNumber": "+254712345678",
    "email": "recipient@example.com",
    "accountHolder": {
      "name": "John Kamau"
    }
  },
  "participantsIdentification": {
    "originator": {
      "externalReferenceId": "user-ke-orig-001",
      "entityType": "Individual",
      "participantRelationshipType": "FirstParty",
      "fullName": {
        "firstName": "John",
        "lastName": "Kamau"
      },
      "dateOfBirth": "1988-07-23",
      "phone": "+254712345678",
      "email": "recipient@example.com",
      "postalAddress": {
        "streetName": "Kenyatta Avenue",
        "buildingNumber": "5",
        "postalCode": "00100",
        "city": "Nairobi",
        "subdivision": "Nairobi County",
        "district": "Nairobi",
        "country": "KE"
      }
    },
    "beneficiary": {
      "externalReferenceId": "user-ke-ben-001",
      "entityType": "Individual",
      "participantRelationshipType": "FirstParty",
      "fullName": {
        "firstName": "John",
        "lastName": "Kamau"
      },
      "dateOfBirth": "1988-07-23",
      "phone": "+254712345678",
      "email": "recipient@example.com",
      "postalAddress": {
        "streetName": "Kenyatta Avenue",
        "buildingNumber": "5",
        "postalCode": "00100",
        "city": "Nairobi",
        "subdivision": "Nairobi County",
        "district": "Nairobi",
        "country": "KE"
      }
    }
  }
}
```

**Notes:**
- `to.accountHolder` is **required** by the Fireblocks schema (`MobileMoneyAddressBeneficiaryInfo`). Always include it.
- If not provided in the request, the service now falls back to the beneficiary name automatically, but it is best practice to include it explicitly.
- `to.email` is required for Momo off-ramp.

---

## 3. LBT On-Ramp — NGN → USDC

Bank transfer collection in Nigeria, settled to a blockchain address.

```json
{
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440002",
  "amount": "10000",
  "partnerId": "<your-partner-id>",
  "apiKey": "<your-api-key>",
  "type": "OnRamp",
  "from": {
    "asset": {
      "nationalCurrencyCode": "NGN",
      "testAsset": true
    },
    "transferMethod": "Lbt",
    "email": "sender@example.com"
  },
  "to": {
    "asset": {
      "assetId": "ba215aa5-454d-4415-a575-8078e3dfeb4c"
    },
    "transferMethod": "PublicBlockchain",
    "address": "0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe"
  },
  "participantsIdentification": {
    "originator": {
      "externalReferenceId": "user-ng-001",
      "entityType": "Individual",
      "participantRelationshipType": "FirstParty",
      "fullName": {
        "firstName": "Chidi",
        "lastName": "Okonkwo"
      },
      "dateOfBirth": "1985-11-30",
      "phone": "+2348012345678",
      "email": "sender@example.com",
      "postalAddress": {
        "streetName": "Broad Street",
        "buildingNumber": "22",
        "postalCode": "101001",
        "city": "Lagos",
        "subdivision": "Lagos State",
        "district": "Lagos Island",
        "country": "NG"
      }
    },
    "beneficiary": {
      "externalReferenceId": "user-ng-001",
      "entityType": "Individual",
      "participantRelationshipType": "FirstParty",
      "fullName": {
        "firstName": "Chidi",
        "lastName": "Okonkwo"
      },
      "dateOfBirth": "1985-11-30",
      "postalAddress": {
        "streetName": "Broad Street",
        "buildingNumber": "22",
        "postalCode": "101001",
        "city": "Lagos",
        "subdivision": "Lagos State",
        "district": "Lagos Island",
        "country": "NG"
      }
    }
  }
}
```

**Notes:**
- For LBT on-ramp, the `paymentInstructions` returned in the response contain the bank account details the user must transfer to (account number, bank name, bank code, reference ID). These come from the payments service collection.
- `from.mobilePhoneNumber` and `from.provider` are not needed for LBT.
- For ZAR (South Africa), `from.successRedirectUrl` is **required** by the service validator.

---

## 4. LBT Off-Ramp — USDC → ZAR

Crypto sent by Fireblocks, disbursed via bank transfer to a South Africa account.

```json
{
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440003",
  "amount": "100",
  "partnerId": "<your-partner-id>",
  "apiKey": "<your-api-key>",
  "type": "OffRamp",
  "from": {
    "asset": {
      "assetId": "ba215aa5-454d-4415-a575-8078e3dfeb4c"
    },
    "transferMethod": "PublicBlockchain"
  },
  "to": {
    "asset": {
      "nationalCurrencyCode": "ZAR",
      "testAsset": true
    },
    "transferMethod": "Lbt",
    "accountNumber": "1234567890",
    "bankName": "First National Bank",
    "bankCode": "051001",
    "referenceId": "ZAR-2025-001",
    "accountHolder": {
      "name": "Sarah van der Merwe",
      "country": "ZA"
    }
  },
  "participantsIdentification": {
    "originator": {
      "externalReferenceId": "user-za-orig-001",
      "entityType": "Individual",
      "participantRelationshipType": "FirstParty",
      "fullName": {
        "firstName": "Sarah",
        "lastName": "van der Merwe"
      },
      "dateOfBirth": "1992-03-15",
      "phone": "+27812345678",
      "email": "sarah@example.com",
      "postalAddress": {
        "streetName": "Long Street",
        "buildingNumber": "88",
        "postalCode": "8001",
        "city": "Cape Town",
        "subdivision": "Western Cape",
        "district": "City Bowl",
        "country": "ZA"
      }
    },
    "beneficiary": {
      "externalReferenceId": "user-za-ben-001",
      "entityType": "Individual",
      "participantRelationshipType": "FirstParty",
      "fullName": {
        "firstName": "Sarah",
        "lastName": "van der Merwe"
      },
      "dateOfBirth": "1992-03-15",
      "phone": "+27812345678",
      "email": "sarah@example.com",
      "postalAddress": {
        "streetName": "Long Street",
        "buildingNumber": "88",
        "postalCode": "8001",
        "city": "Cape Town",
        "subdivision": "Western Cape",
        "district": "City Bowl",
        "country": "ZA"
      }
    }
  }
}
```

**Notes:**
- `to.accountHolder` is **required** by the Fireblocks schema (`LocalBankTransferAddress`). Always include it.
- `to.bankCode` is **required** by the Fireblocks schema. The service now falls back to `''` if omitted, but it should always be provided for real disbursements.
- `to.bankName` must match a network that the provider configured. Ask the provider which bank names they accept for the currency you send.
- `to.referenceId` is optional but recommended for reconciliation.

---

## Valid MoMo Provider Values

The Fireblocks schema restricts `provider` to the following exact strings:

| Value | Network |
|---|---|
| `m-pesa` | Safaricom M-Pesa (Kenya, Tanzania) |
| `airtel` | Airtel Money (Uganda, Zambia, Rwanda, etc.) |
| `mtn` | MTN MoMo (Ghana, Uganda, Cameroon, etc.) |
| `tigo` | Tigo Pesa (Tanzania, Ghana) |
| `orange` | Orange Money (Senegal, Côte d'Ivoire, etc.) |
| `wave` | Wave (Senegal, Côte d'Ivoire) |

The service normalises common aliases (e.g. `mpesa` → `m-pesa`, `mtn money` → `mtn`) but it is
best practice to send the canonical value directly.
