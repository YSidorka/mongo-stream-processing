import { Writable } from 'stream';
import { AnyBulkWriteOperation, Collection } from 'mongodb';
import { CHUNK_SIZE, CHUNK_DL, SYNC_DOC_ID } from '../config';

export class MongoWritableStream<T extends { _id: any }> extends Writable {

  private readonly buffer: Array<T>;
  private timer: NodeJS.Timeout | undefined;
  private resumeToken: Object | undefined;

  constructor(private readonly target: Collection<T>) {
    super({ objectMode: true });
    this.buffer = [];
    this.timer = setInterval(this.insertChunk.bind(this), CHUNK_DL);
  }

  _write(
    chunk: { doc: T, token?: Object | null },
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.buffer.push(chunk.doc);
    if (chunk.token) this.resumeToken = chunk.token;

    if (this.buffer.length >= CHUNK_SIZE ) {
      this.insertChunk().then(() => callback())
    } else {
      callback();
    }
  }

  _final(callback: (error?: Error | null) => void): void {
    this.insertChunk().then(() => {
      this.timer && clearInterval(this.timer);
      this.timer = undefined;
      callback();
    });
  }

  private async insertChunk() {
    if (!this.buffer.length) return;

    const bulk = this.createBulk(this.buffer);
    await this.target.bulkWrite(bulk);
    if (this.resumeToken) await this.updateSyncToken(this.resumeToken);
    this.buffer.length = 0;
  }

  private createBulk(docs: T[]): AnyBulkWriteOperation<T>[] {
    return docs.map(
      (doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: doc },
          upsert: true,
        },
      }) as AnyBulkWriteOperation<T>,
    );
  }

  private async updateSyncToken(token: Object | null): Promise<void> {
    await this.target.updateOne(
      // @ts-ignore
      { _id: SYNC_DOC_ID },
      { $set: { token } },
      { upsert: true }
    ).catch((err) => {
      console.log(err);
    });
  }
}

export default MongoWritableStream;
