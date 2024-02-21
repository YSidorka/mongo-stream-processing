import { MongoClient } from 'mongodb';
import {
  SOURCE_COLLECTION,
  TARGET_COLLECTION,
  TOKEN_COLLECTION,
  DB_URI,
  FULL_SYNC_FLAG,
} from './modules/config';
import CustomerType from './modules/customer-module/customer.type';
import SyncService from './modules/customer-module/sync.service';
import SyncTokenType from './modules/mongo-module/sync-token.type';

const dbClient = new MongoClient(DB_URI);

async function sync() {
  await dbClient.connect();
  const db = dbClient.db();
  const source = db.collection<CustomerType>(SOURCE_COLLECTION);
  const target = db.collection<CustomerType>(TARGET_COLLECTION);
  const token = db.collection<SyncTokenType>(TOKEN_COLLECTION);
  const syncService = new SyncService(source, target, token);

  if (FULL_SYNC_FLAG) {
    await syncService.fullSync();
    await syncService.destroy();
  } else {
    await syncService.watch();
  }
}

sync()
  .then(() => {
    console.log(`Synchronization finished`);
  })
  .catch(console.error)
  .finally(async () => {
    await dbClient.close();
    console.log('Finally...');
  });
