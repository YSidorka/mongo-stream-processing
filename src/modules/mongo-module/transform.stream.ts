import { Transform, TransformCallback } from 'stream';

class TransformStream extends Transform {
  private actionFn: Function;

  constructor(actionFn: Function) {
    super({ objectMode: true });
    this.actionFn = actionFn;
  }

  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    if (!chunk) return callback();
    callback(null, this.actionFn(chunk));
  }
}

export default TransformStream;
