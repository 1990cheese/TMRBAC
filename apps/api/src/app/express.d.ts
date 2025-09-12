// express.d.ts
import { Request } from 'express';
import { SessionData} from 'express-session';

declare module 'express-session-serve-static-core' {
  interface SessionData {
    user?: {
      userId: string;
      username: string;
      roles: string[];
    };
  }
}

declare module 'express-serve-static-core' {

    interface User {
        userId: string;
        username: string;
        roles: string[];
    }

    interface Request {
        session: import('express-session-serve-static-core').Session & Partial<import('express-session').SessionData>;
        user?: User;
    }
}