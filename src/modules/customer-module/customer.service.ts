import { faker } from '@faker-js/faker';
import AddressType from './address.type';
import CustomerType from './customer.type';
import { encrypt } from '../utils';

function createRandomCustomer(): CustomerType {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName });

  const line1 = faker.location.streetAddress();
  const line2 = faker.location.secondaryAddress();
  const postcode = faker.location.zipCode();

  const city = faker.location.city();
  const state = faker.location.state();
  const country = faker.location.country();

  return {
    firstName,
    lastName,
    email,
    address: { line1, line2, postcode, city, state, country } as AddressType,
    createdAt: new Date(),
  } as CustomerType;
}

function anonymizeCustomer(doc: CustomerType): { doc: CustomerType } {
  doc.firstName = encrypt(doc.firstName);
  doc.lastName = encrypt(doc.lastName);
  const splitArr = doc.email.split('@');
  doc.email = `${encrypt(splitArr[0])}@${splitArr[1]}`;

  // address
  doc.address.line1 = encrypt(doc.address.line1);
  doc.address.line2 = encrypt(doc.address.line2);
  doc.address.postcode = encrypt(doc.address.postcode);
  return { doc };
}

function chunkTransform(chunk: { fullDocument?: CustomerType, _id: Object }): { doc:CustomerType, token: Object | null } | null {
  if (!chunk?.fullDocument) return null;
  const result = {
    doc: chunk.fullDocument,
    token: chunk._id || null
  };
  return result;
}

export {
  createRandomCustomer,
  anonymizeCustomer,
  chunkTransform
};
