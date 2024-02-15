import { pbkdf2Sync, pbkdf2 } from 'crypto';
import { promisify } from 'util';
const pbkdf2Async = promisify(pbkdf2);

const SECRET_KEY = 'qwerty';

function encrypt(message: string) {
  let str = pbkdf2Sync(SECRET_KEY, message, 1, 4, 'sha256').toString('hex');

  const result = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    result[i] = (code > 47 && code < 58) ? String.fromCharCode(code + 17) : str[i];
  }
  return result.join('');
}

async function encryptAsync(message: string) {
  let str:any = await pbkdf2Async(SECRET_KEY, message, 1, 4, 'sha256');
  str = str.toString('hex');

  const result = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    result[i] = (code > 47 && code < 58) ? String.fromCharCode(code + 17) : str[i];
  }
  return result.join('');
}

export {
  encrypt,
  encryptAsync
};
