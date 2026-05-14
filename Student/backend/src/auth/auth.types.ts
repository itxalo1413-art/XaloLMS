import type { Role } from '../domain/role';

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  name: string;
};
