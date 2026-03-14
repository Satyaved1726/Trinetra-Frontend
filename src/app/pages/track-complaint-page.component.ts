import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Complaint, ComplaintService } from '../services/complaint.service';

@Component({
  selector: 'app-track-complaint-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card form-card">
      <h2>Track Complaint</h2>
      <p class="sub">Enter your tracking ID to view the latest status.</p>

      <form [formGroup]="form" (ngSubmit)="onTrack()" novalidate>
        <label for="trackingId">Tracking ID</label>
        <input id="trackingId" type="text" formControlName="trackingId" placeholder="TRN-XXXXXX" />

        <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

        <button class="btn primary full" type="submit" [disabled]="form.invalid || loading">
          <span *ngIf="loading" class="spinner" aria-hidden="true"></span>
          {{ loading ? 'Fetching...' : 'Track Complaint' }}
        </button>
      </form>

      <div class="result" *ngIf="complaint">
        <h3>{{ complaint.title }}</h3>
        <p><strong>Category:</strong> {{ complaint.category }}</p>
        <p><strong>Status:</strong> {{ complaint.status }}</p>
        <p><strong>Created At:</strong> {{ complaint.createdAt | date: 'medium' }}</p>

        <div class="timeline" aria-label="Complaint status timeline">
          <div
            *ngFor="let status of statusSteps; let i = index"
            class="timeline-step"
            [class]="'timeline-step timeline-' + getStepState(status)"
          >
            <div class="timeline-marker">
              <span *ngIf="getStepState(status) === 'completed'">&#10003;</span>
              <span *ngIf="getStepState(status) !== 'completed'">{{ i + 1 }}</span>
            </div>
            <div class="timeline-label">{{ formatStatus(status) }}</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .timeline {
        margin-top: 1rem;
        display: grid;
        gap: 0.75rem;
      }

      .timeline-step {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        color: #6b7688;
      }

      .timeline-marker {
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 999px;
        border: 1px solid #d7deea;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        font-size: 0.78rem;
        font-weight: 700;
        background: #f2f4f8;
      }

      .timeline-completed {
        color: #4e5968;
      }

      .timeline-completed .timeline-marker {
        border-color: #ced4dc;
        background: #e9edf1;
      }

      .timeline-current .timeline-marker {
        color: #fff;
      }

      .timeline-current-submitted {
        color: #4e5968;
      }

      .timeline-current-submitted .timeline-marker {
        background: #7d8696;
        border-color: #7d8696;
      }

      .timeline-current-under-review {
        color: #1f4599;
      }

      .timeline-current-under-review .timeline-marker {
        background: #1f59cf;
        border-color: #1f59cf;
      }

      .timeline-current-resolved {
        color: #1d6b3a;
      }

      .timeline-current-resolved .timeline-marker {
        background: #2f9356;
        border-color: #2f9356;
      }

      .timeline-current-rejected {
        color: #a11818;
      }

      .timeline-current-rejected .timeline-marker {
        background: #c72c2c;
        border-color: #c72c2c;
      }

      .timeline-future .timeline-marker {
        background: #f4f6f9;
        border-color: #dce2ec;
      }
    `
  ]
})
export class TrackComplaintPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly complaintService = inject(ComplaintService);

  loading = false;
  errorMessage = '';
  complaint: Complaint | null = null;
  readonly statusSteps = ['SUBMITTED', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED'] as const;

  readonly form = this.fb.nonNullable.group({
    trackingId: ['', [Validators.required, Validators.minLength(3)]]
  });

  onTrack(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.complaint = null;

    const trackingId = this.form.getRawValue().trackingId.trim();

    this.complaintService.trackComplaint(trackingId).subscribe({
      next: (response: Complaint) => {
        this.complaint = response;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error?.error?.message ?? 'No complaint found for this tracking ID.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getStepState(step: (typeof this.statusSteps)[number]): 'completed' | 'current-submitted' | 'current-under-review' | 'current-resolved' | 'current-rejected' | 'future' {
    if (!this.complaint) {
      return 'future';
    }

    const currentStatus = this.complaint.status as string;

    if (currentStatus === 'REJECTED') {
      if (step === 'SUBMITTED' || step === 'UNDER_REVIEW') {
        return 'completed';
      }
      return step === 'REJECTED' ? 'current-rejected' : 'future';
    }

    const statusOrder: Record<string, number> = {
      SUBMITTED: 0,
      UNDER_REVIEW: 1,
      RESOLVED: 2
    };

    const currentIndex = statusOrder[currentStatus] ?? 0;
    const stepIndex = statusOrder[step] ?? 99;

    if (stepIndex < currentIndex) {
      return 'completed';
    }

    if (stepIndex === currentIndex) {
      if (step === 'SUBMITTED') {
        return 'current-submitted';
      }
      if (step === 'UNDER_REVIEW') {
        return 'current-under-review';
      }
      return 'current-resolved';
    }

    return 'future';
  }

  formatStatus(status: string): string {
    return status.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (char) => char.toUpperCase());
  }
}
