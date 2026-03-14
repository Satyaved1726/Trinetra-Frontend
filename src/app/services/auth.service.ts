import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly tokenKey = 'trinetra_token';
  private readonly baseUrl = environment.apiUrl;

  login(payload: LoginRequest): Observable<{ token?: string; jwt?: string; accessToken?: string }> {
    return this.http
      .post<{ token?: string; jwt?: string; accessToken?: string }>(`${this.baseUrl}/auth/login`, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleUnauthorized(error)));
  }

  register(payload: RegisterRequest): Observable<unknown> {
    return this.http
      .post(`${this.baseUrl}/auth/register`, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleUnauthorized(error)));
  }

  storeToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  private handleUnauthorized(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      this.clearToken();
      void this.router.navigate(['/login']);
    }

    return throwError(() => error);
  }
}
