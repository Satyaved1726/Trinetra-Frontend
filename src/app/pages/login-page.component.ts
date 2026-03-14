import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="card form-card">
      <h2>Login</h2>
      <p class="sub">Sign in to access complaint management</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" placeholder="you@company.com" />

        <label for="password">Password</label>
        <input id="password" type="password" formControlName="password" placeholder="Enter password" />

        <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

        <button class="btn primary full" type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Signing in...' : 'Login' }}
        </button>
      </form>

      <p class="inline-link">
        New here?
        <a routerLink="/register">Create an account</a>
      </p>
    </section>
  `
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        const token = response?.token ?? response?.jwt ?? response?.accessToken;

        if (!token) {
          this.errorMessage = 'Login succeeded but no token was returned by the server.';
          this.loading = false;
          return;
        }

        this.authService.storeToken(token);
        void this.router.navigate(['/admin']);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error?.error?.message ?? 'Invalid credentials. Please try again.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
