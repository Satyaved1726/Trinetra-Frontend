import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `
    <section class="card form-card not-found-card">
      <h2>Page not found</h2>
      <p class="sub">The page you are looking for does not exist.</p>
      <a class="btn primary" routerLink="/">Go to Home</a>
    </section>
  `,
  styles: [
    `
      .not-found-card {
        text-align: center;
      }

      .not-found-card .btn {
        width: auto;
        margin-top: 0.75rem;
      }
    `
  ]
})
export class NotFoundPageComponent {}
