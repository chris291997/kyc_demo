export const regulaConfig = {
  documentReader: {
    scenarios: {
      fullProcess: 'FullProcess',
      mrz: 'Mrz',
      barcode: 'Barcode',
      locate: 'Locate',
      ocr: 'Ocr',
    },
    resultTypes: [
      'Status',
      'Text',
      'Images',
      'MrzText',
      'BarcodeText',
      'Graphics',
      'ChosenDocumentType',
    ],
  },
  face: {
    liveness: {
      threshold: 0.5,
    },
    match: {
      threshold: 0.75, // 75% similarity for match
    },
  },
};

export const RegulaFieldTypes = {
  DOCUMENT_NUMBER: 2,
  SURNAME: 3,
  GIVEN_NAMES: 11,
  DATE_OF_BIRTH: 15,
  GENDER: 16,
  NATIONALITY: 17,
  ISSUING_COUNTRY: 19,
  DATE_OF_EXPIRY: 26,
  DATE_OF_ISSUE: 28,
  ISSUING_AUTHORITY: 29,
};

