import { authApi } from './auth';
import { booksApi } from './books';
import { donationsApi } from './donations';
import { drivesApi } from './drives';
import { schoolsApi } from './schools';
import { statsApi } from './stats';
import { uploadsApi } from './uploads';
import { usersApi } from './users';

export { ApiError, session } from './client';
export { authApi, booksApi, donationsApi, drivesApi, schoolsApi, statsApi, uploadsApi, usersApi };

// One object with every endpoint, so screens can call api.listBooks(), api.donate() and so on.
export const api = {
  ...authApi,
  ...booksApi,
  ...donationsApi,
  ...drivesApi,
  ...schoolsApi,
  ...statsApi,
  ...uploadsApi,
  ...usersApi,
};
