import { Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET
export const JWT_EXPIRES = process.env.JWT_EXPIRES ?? '1h'

export function signToken(payload: object) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  const options: jwt.SignOptions = { expiresIn: JWT_EXPIRES as jwt.SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options)
}

