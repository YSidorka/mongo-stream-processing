import { faker } from '@faker-js/faker';
import AddressType from './address.type';
import CustomerType from './customer.type';
import { encrypt } from '../utils';
import { GEN_CHUNK_LIMIT } from '../config';

async function gererateCustomers(): Promise<CustomerType[]> {
  const result: Array<CustomerType> = [];
  const random = Math.trunc(Math.random() * GEN_CHUNK_LIMIT) + 1;
  for (let i = 0; i < random; i++) result.push(createRandomCustomer());
  return result;
}

function createRandomCustomer(): CustomerType {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName });

  const line1 = faker.location.streetAddress();
  const line2 = faker.location.secondaryAddress();
  const postcode = faker.location.zipCode();

  const city = faker.location.city();
  const state = faker.location.state({ abbreviated: true });
  const country = faker.location.countryCode('alpha-2');

  return {
    firstName,
    lastName,
    email,
    address: { line1, line2, postcode, city, state, country } as AddressType,
    createdAt: new Date(),
  } as CustomerType;
}

function anonymizeCustomer(doc: CustomerType): CustomerType {
  doc.firstName = encrypt(doc.firstName);
  doc.lastName = encrypt(doc.lastName);
  const splitArr = doc.email.split('@');
  doc.email = `${encrypt(splitArr[0])}@${splitArr[1]}`;

  // address
  doc.address.line1 = encrypt(doc.address.line1);
  doc.address.line2 = encrypt(doc.address.line2);
  doc.address.postcode = encrypt(doc.address.postcode);
  return doc;
}

function docTransform(doc: CustomerType): { doc: CustomerType } {
  return { doc };
}

function chunkTransform(chunk: { fullDocument: CustomerType; _id: Object }): {
  doc: CustomerType;
  token: Object;
} {
  return {
    token: chunk._id,
    doc: anonymizeCustomer(chunk.fullDocument),
  };
}

export {
  gererateCustomers,
  createRandomCustomer,
  anonymizeCustomer,
  docTransform,
  chunkTransform,
};
