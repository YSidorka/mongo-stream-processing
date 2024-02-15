import { MongoClient } from 'mongodb';

import {
  DB_NAME,
  SOURCE_COLLECTION,
  TARGET_COLLECTION,
  DB_URI,
  FULL_SYNC_FLAG,
} from './modules/config';
import CustomerType from './modules/customer-module/customer.type';

import SyncService from './modules/customer-module/sync.service';
import SyncTokenType from './modules/mongo-module/sync-token.type';

async function sync() {
  const dbClient = new MongoClient(DB_URI);
  await dbClient.connect();
  process.on('exit', dbClient.close);

  const db = dbClient.db(DB_NAME);
  const source = db.collection<CustomerType>(SOURCE_COLLECTION);
  const target = db.collection<CustomerType & SyncTokenType>(TARGET_COLLECTION);

  const syncService = new SyncService(source, target);
  if (FULL_SYNC_FLAG) {
    await syncService.fullSync();
    process.exit(0);
  } else {
    await syncService.watch();
  }

  process.on('exit', async () => {
    // console.log('Final destroy');
    await dbClient.close();
    await syncService.destroy();
  });
}

sync()
  .then(() => {
    console.log(`Synchronization finished`);
  })
  .catch(console.error);
