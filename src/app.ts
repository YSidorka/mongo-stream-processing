import { MongoClient } from 'mongodb';

import {
  DB_NAME,
  SOURCE_COLLECTION,
  DB_URI,
  GEN_CHUNK_LIMIT,
  GEN_INTERVAL,
} from './modules/config';
import CustomerType from './modules/customer-module/customer.type';
import { createRandomCustomer } from './modules/customer-module/customer.service';

async function app() {
  const dbClient = new MongoClient(DB_URI);
  await dbClient.connect();
  process.on('exit', dbClient.close);

  const db = dbClient.db(DB_NAME);
  const source = db.collection<CustomerType>(SOURCE_COLLECTION);

  setInterval(async () => {
    const random = Math.trunc(Math.random() * GEN_CHUNK_LIMIT) + 1;
    const customers: Array<CustomerType> = [];
    for (let i = 0; i < random; i++) customers.push(createRandomCustomer());

    const res = await source.insertMany(customers);
    // console.log(res.insertedIds);
  }, GEN_INTERVAL);
}

app()
  .then(() => {
    console.log('Processing...');
  })
  .catch(console.error);
