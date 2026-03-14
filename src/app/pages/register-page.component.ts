import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="card form-card">
      <h2>Register</h2>
      <p class="sub">Create an account to manage complaints</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label for="name">Name</label>
        <input id="name" type="text" formControlName="name" placeholder="Your full name" />

        <label for="email">Email</label>
        <input id="email" type="email" formControlName="email" placeholder="you@company.com" />

        <label for="password">Password</label>
        <input id="password" type="password" formControlName="password" placeholder="Create a password" />

        <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

        <button class="btn primary full" type="submit" [disabled]="form.invalid || loading">
          {{ loading ? 'Creating account...' : 'Register' }}
        </button>
      </form>

      <p class="inline-link">
        Already registered?
        <a routerLink="/login">Go to login</a>
      </p>
    </section>
  `
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.form.getRawValue()).subscribe({
      next: () => {
        void this.router.navigate(['/login']);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error?.error?.message ?? 'Registration failed. Please try again.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
