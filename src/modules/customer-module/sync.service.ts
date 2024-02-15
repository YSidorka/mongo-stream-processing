import { pipeline } from 'stream';
import { ChangeStream, Collection, ResumeToken } from 'mongodb';

import CustomerType from './customer.type';
import { SYNC_DOC_ID } from '../config';
import { anonymizeCustomer, getFullDocument } from './customer.service';

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
        new TransformStream(getFullDocument),
        new TransformStream(anonymizeCustomer),
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
    this.changeStream.on('change', async () => {
      await this.updateSyncToken(); // TODO need to change
    });

    await this.updateSyncToken();
    return this.changeStream;
  }

  private async findResumeToken(): Promise<ResumeToken | undefined> {
    const doc = await this.target.findOne<SyncTokenType>({ _id: SYNC_DOC_ID });
    return doc?.token;
  }

  private async updateSyncToken(): Promise<void> {
    if (!this.changeStream) return;
    await this.target.updateOne(
      { _id: SYNC_DOC_ID },
      // @ts-ignore
      { $set: { token: this.changeStream.resumeToken } },
      { upsert: true }
    ).catch((err) => {
      console.log(err);
    });
  }

  async destroy(): Promise<void> {
    await this.updateSyncToken();
    await this.changeStream?.close();
    this.changeStream = undefined;
  }
}

export default SyncService
