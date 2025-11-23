// src/types/express.d.ts
import { JwtUser } from '../auth/types/jwt-user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser; // now req.user is typed everywhere
    }
  }
}

// ensure this file is included by tsconfig.json ("include": ["src/**/*"])
export {};
