const fs = require('fs');
const os = require('os');
const path = require('path');

const { createPassClaims } = require('../generate-jwt');

const defaultPayloadPath = path.join(__dirname, '..', 'generic-payload.json');

describe('Google Wallet JWT claims', () => {
  let temporaryDirectory;

  beforeEach(() => {
    temporaryDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'wallet-kit-jwt-')
    );
  });

  afterEach(() => {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('includes a class definition for a generated generic class', () => {
    const claims = createPassClaims(
      {
        issuerId: '1234567890',
        serviceAccountEmail: 'wallet@example.test',
        demoMode: true,
      },
      defaultPayloadPath
    );

    expect(claims.payload.genericClasses).toEqual([
      { id: claims.payload.genericObjects[0].classId },
    ]);
  });

  it('references an existing generic class without redefining it', () => {
    const claims = createPassClaims(
      {
        issuerId: '1234567890',
        serviceAccountEmail: 'wallet@example.test',
        classId: '1234567890.existing',
      },
      defaultPayloadPath
    );

    expect(claims.payload.genericObjects[0].classId).toBe(
      '1234567890.existing'
    );
    expect(claims.payload.genericClasses).toBeUndefined();
  });

  it('rejects custom files that override credential identity claims', () => {
    const payloadPath = path.join(temporaryDirectory, 'payload.json');
    fs.writeFileSync(
      payloadPath,
      JSON.stringify({
        iss: 'deleted@example.test',
        payload: { genericObjects: [] },
      })
    );

    expect(() =>
      createPassClaims(
        {
          issuerId: '1234567890',
          serviceAccountEmail: 'wallet@example.test',
          payloadFile: payloadPath,
        },
        defaultPayloadPath
      )
    ).toThrow('Custom payload file cannot override protected JWT claims: iss');
  });

  it('keeps a custom generic object and its generated class consistent', () => {
    const payloadPath = path.join(temporaryDirectory, 'payload.json');
    fs.writeFileSync(
      payloadPath,
      JSON.stringify({
        payload: {
          genericObjects: [
            {
              id: '1234567890.custom_object',
              classId: '1234567890.custom_class',
              state: 'ACTIVE',
            },
          ],
        },
      })
    );

    const claims = createPassClaims(
      {
        issuerId: '1234567890',
        serviceAccountEmail: 'wallet@example.test',
        payloadFile: payloadPath,
      },
      defaultPayloadPath
    );

    expect(claims.payload.genericClasses).toEqual([
      { id: '1234567890.custom_class' },
    ]);
    expect(claims.payload.genericObjects[0].classId).toBe(
      '1234567890.custom_class'
    );
  });

  it('rejects prototype-polluting payload properties', () => {
    const payloadPath = path.join(temporaryDirectory, 'payload.json');
    fs.writeFileSync(
      payloadPath,
      '{"payload":{"__proto__":{"polluted":true}}}'
    );

    expect(() =>
      createPassClaims(
        {
          issuerId: '1234567890',
          serviceAccountEmail: 'wallet@example.test',
          payloadFile: payloadPath,
        },
        defaultPayloadPath
      )
    ).toThrow('Unsafe payload property: __proto__');
    expect({}.polluted).toBeUndefined();
  });
});
