import { Transform, TransformCallback } from 'stream';

class TransformStream extends Transform {
  private actionFn: Function;

  constructor(actionFn: Function) {
    super({ objectMode: true });
    this.actionFn = actionFn;
    // @ts-ignore
    // this.actionFn = ((doc) => doc);
  }

  _transform(
    doc: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    if (!doc) return callback();
    callback(null, this.actionFn(doc));
  }
}

export default TransformStream;
