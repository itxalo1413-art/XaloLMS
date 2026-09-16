import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Bỏ qua JWT + Roles (endpoint công khai). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
