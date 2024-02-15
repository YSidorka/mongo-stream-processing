import { ObjectId } from 'mongodb';
import AddressType from './address.type';

type CustomerType = {
  readonly _id: ObjectId | string;
  firstName: string;
  lastName: string;
  email: string;
  address: AddressType;
  createdAt: Date;
};

export default CustomerType;
