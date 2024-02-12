import { faker } from '@faker-js/faker';
import AddressType from './address.type';
import CustomerType from './customer.type';

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

export { createRandomCustomer };
