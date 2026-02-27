import { User } from '@privy-io/server-auth';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
