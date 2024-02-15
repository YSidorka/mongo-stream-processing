import { pipeline } from 'stream';
import { ChangeStream, Collection, ResumeToken } from 'mongodb';

import CustomerType from './customer.type';
import { SYNC_DOC_ID } from '../config';
import { anonymizeCustomer, chunkTransform } from './customer.service';

import SyncTokenType from '../mongo-module/sync-token.type';
import TransformStream from '../mongo-module/transform.stream';
import MongoWritableStream from '../mongo-module/writable.stream';

class SyncService {

  private changeStream: ChangeStream | undefined;

  constructor(
    private readonly source: Collection<CustomerType>,
    private readonly target: Collection<CustomerType & SyncTokenType>
  ) {}

  async fullSync(): Promise<void> {
    const cursor = this.source.find();
    console.log('Sync all...');
    await new Promise((resolve, reject) => {
      pipeline(
        cursor.stream(),
        new TransformStream(anonymizeCustomer),
        new MongoWritableStream(this.target),
        (err) => {
          err ? reject(err) : resolve(null);
        },
      );
    });
  }

  async watch(): Promise<void> {
    const stream = await this.createChangeStream();
    console.log('Listening for changes...');
    await new Promise((resolve, reject) => {
      pipeline(
        stream.stream(),
        new TransformStream(chunkTransform),
        new MongoWritableStream(this.target),
        (err) => {
          if (err) return reject(err);
          resolve(null);
        },
      );
    });
  }

  private async createChangeStream(): Promise<ChangeStream> {
    if (this.changeStream) return this.changeStream;

    const resumeAfter = await this.findResumeToken();
    this.changeStream = this.source.watch(undefined, {
      resumeAfter,
      fullDocument: 'updateLookup',
    });
    return this.changeStream;
  }

  private async findResumeToken(): Promise<ResumeToken | undefined> {
    const doc = await this.target.findOne<SyncTokenType>({ _id: SYNC_DOC_ID });
    return doc?.token;
  }

  async destroy(): Promise<void> {
    await this.changeStream?.close();
    this.changeStream = undefined;
  }
}

export default SyncService
