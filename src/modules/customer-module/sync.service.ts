import { pipeline } from 'stream/promises';
import { ChangeStream, Collection, ResumeToken } from 'mongodb';
import CustomerType from './customer.type';
import { SYNC_DOC_ID } from '../config';
import { anonymizeCustomer, chunkTransform, docTransform } from './customer.service';
import SyncTokenType from '../mongo-module/sync-token.type';
import TransformStream from '../mongo-module/transform.stream';
import MongoWritableStream from '../mongo-module/writable.stream';

class SyncService {

  private changeStream: ChangeStream | undefined;

  constructor(
    private readonly source: Collection<CustomerType>,
    private readonly target: Collection<CustomerType>,
    private readonly tokenCollection: Collection<SyncTokenType>
  ) {}

  async fullSync(): Promise<void> {
    const cursor = this.source.find();
    console.log('Sync all...');
    await pipeline(
      cursor.stream(),
      new TransformStream(anonymizeCustomer),
      new TransformStream(docTransform),
      new MongoWritableStream(this.target)
    );
  }

  async watch(): Promise<void> {
    const stream = await this.createChangeStream();
    console.log('Listening for changes...');
    await pipeline(
      stream.stream(),
      new TransformStream(chunkTransform),
      new MongoWritableStream(this.target, this.updateSyncToken.bind(this)),
    );
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
    const doc = await this.tokenCollection.findOne<SyncTokenType>({ _id: SYNC_DOC_ID });
    return doc?.token;
  }

  private async updateSyncToken(token: any): Promise<void> {
    await this.tokenCollection.updateOne(
      { _id: SYNC_DOC_ID },
      { $set: { token } },
      { upsert: true }
    );
    return;
  }

  async destroy(): Promise<void> {
    await this.changeStream?.close();
    this.changeStream = undefined;
  }
}

export default SyncService
