import { Writable } from 'stream';
import { AnyBulkWriteOperation, Collection } from 'mongodb';
import { CHUNK_SIZE, CHUNK_DL } from '../config';

export class MongoWritableStream<T extends { _id: any }> extends Writable {
  private readonly buffer: Array<T>;
  private timer: NodeJS.Timeout | undefined;
  private resumeToken: Object | undefined;

  constructor(
    private readonly target: Collection<T>,
    private tokenActionFn?: Function
  ) {
    super({ objectMode: true });
    this.buffer = [];
    this.timer = setInterval(this.insertChunk.bind(this), CHUNK_DL);
  }

  _write(
    chunk: { doc: T; token?: Object | null },
    encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ): void {
    this.buffer.push(chunk.doc);
    if (chunk.token) this.resumeToken = chunk.token;

    if (this.buffer.length >= CHUNK_SIZE) {
      this.insertChunk().then(() => callback()).catch((err) => callback(err));
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
    const buffer = [...this.buffer];
    this.buffer.length = 0;

    if (!buffer.length) return;
    const bulk = this.createBulk(buffer);
    await this.target.bulkWrite(bulk);
    if (this.resumeToken && this.tokenActionFn) await this.tokenActionFn(this.resumeToken);
    buffer.length = 0;
  }

  private createBulk(docs: T[]): AnyBulkWriteOperation<T>[] {
    return docs.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: doc },
        upsert: true,
      },
    }));
  }
}

export default MongoWritableStream;
