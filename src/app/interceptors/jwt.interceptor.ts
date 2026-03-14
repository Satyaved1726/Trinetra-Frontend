import { HttpInterceptorFn } from '@angular/common/http';

const excludedPaths = [
  '/auth/login',
  '/auth/register',
  '/api/complaints/anonymous',
  '/api/complaints/track'
];

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const shouldSkipAuthHeader = excludedPaths.some((path) => req.url.includes(path));

  if (shouldSkipAuthHeader) {
    return next(req);
  }

  const token = localStorage.getItem('trinetra_token');

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
