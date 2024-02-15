export const GEN_CHUNK_LIMIT = 10;
export const GEN_INTERVAL = 1000;

export const CHUNK_DL = 1000;
export const CHUNK_SIZE = 1000;
export const SYNC_DOC_ID = '$sync';

export const DB_NAME = 'fundraise';
export const SOURCE_COLLECTION = 'customers';
export const TARGET_COLLECTION = 'customers_anonymised';

export const FULL_SYNC_FLAG = process.argv.includes('--full-reindex');
export const DB_URI = process.env.DB_URI || '';
