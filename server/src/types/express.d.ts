declare global {
  namespace Express {
    interface Request {
      user?: { userId?: number; role?: string; [k: string]: unknown };
    }
  }
}

export {};