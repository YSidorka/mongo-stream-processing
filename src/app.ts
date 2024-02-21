import { scheduler } from 'node:timers/promises';
import { MongoClient } from 'mongodb';
import {
  SOURCE_COLLECTION,
  DB_URI,
  GEN_INTERVAL,
} from './modules/config';
import CustomerType from './modules/customer-module/customer.type';
import { gererateCustomers } from './modules/customer-module/customer.service';

const dbClient = new MongoClient(DB_URI);

async function app() {
  await dbClient.connect();
  const db = dbClient.db();
  const source = db.collection<CustomerType>(SOURCE_COLLECTION);

  while (true) {
    const customers = await gererateCustomers();
    await source.insertMany(customers);
    await scheduler.wait(GEN_INTERVAL);
  }
}

app()
  .then(() => {
    console.log('Processing...');
  })
  .catch(console.error)
  .finally(async () => {
    await dbClient.close();
    console.log('Finally...');
  });
