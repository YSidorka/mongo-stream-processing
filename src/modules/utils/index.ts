import { pbkdf2Sync } from 'crypto';

const SECRET_KEY = 'qwerty';

function encrypt(message: string) {
  return pbkdf2Sync(SECRET_KEY, message, 1, 4, 'sha256').toString('hex');
}

export { encrypt };
