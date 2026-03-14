import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="card hero">
      <h1>TRINETRA</h1>
      <p>Anonymous Workplace Reporting System</p>
      <div class="actions">
        <a routerLink="/submit" class="btn primary">Submit Complaint</a>
        <a routerLink="/track" class="btn">Track Complaint</a>
        <a routerLink="/login" class="btn">Login</a>
      </div>
    </section>
  `,
  styles: [
    `
      .hero {
        text-align: center;
        padding: 2.5rem;
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3rem);
        letter-spacing: 0.06em;
      }

      p {
        margin: 0.75rem 0 1.8rem;
        color: #445065;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.85rem;
      }

      .btn {
        text-decoration: none;
      }
    `
  ]
})
export class LandingPageComponent {}
