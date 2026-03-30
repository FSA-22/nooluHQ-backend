import type { IUser } from '../models/users.model.ts';
import type { HydratedDocument } from 'mongoose';

export type PopulatedUser = HydratedDocument<IUser> & {
  profile?: {
    name: string;
    role: string;
  };
};
