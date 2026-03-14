import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComplaintService } from '../services/complaint.service';

@Component({
  selector: 'app-submit-complaint-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="card form-card">
      <h2>Submit Complaint</h2>
      <p class="sub">Share details safely. Your identity can remain hidden.</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label for="title">Title</label>
        <input id="title" type="text" formControlName="title" placeholder="Brief complaint summary" />

        <label for="description">Description</label>
        <textarea id="description" rows="5" formControlName="description" placeholder="Describe what happened"></textarea>

        <label for="category">Category</label>
        <select id="category" formControlName="category">
          <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
        </select>

        <label class="checkbox-row">
          <input type="checkbox" formControlName="isAnonymous" />
          <span>Submit anonymously</span>
        </label>

        <label for="evidence">Upload Evidence (optional)</label>
        <input
          id="evidence"
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          (change)="onEvidenceSelected($event)"
        />
        <p class="sub loading-indicator" *ngIf="uploadingEvidence">
          <span class="spinner" aria-hidden="true"></span>
          Uploading evidence...
        </p>
        <p class="sub" *ngIf="uploadedFileName && !uploadingEvidence">Uploaded: {{ uploadedFileName }}</p>

        <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

        <button class="btn primary full" type="submit" [disabled]="form.invalid || loading || uploadingEvidence">
          <span *ngIf="loading" class="spinner" aria-hidden="true"></span>
          {{ loading ? 'Submitting...' : 'Submit Complaint' }}
        </button>
      </form>

      <div class="success" *ngIf="submittedMessage">
        <p>{{ submittedMessage }}</p>
        <p *ngIf="trackingId"><strong>Tracking ID:</strong> {{ trackingId }}</p>
      </div>
    </section>
  `
})
export class SubmitComplaintPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly complaintService = inject(ComplaintService);

  loading = false;
  errorMessage = '';
  submittedMessage = '';
  trackingId = '';
  evidenceUrl = '';
  uploadedFileName = '';
  uploadingEvidence = false;

  readonly categories = ['Harassment', 'Corruption', 'Discrimination', 'Workplace Abuse', 'Other'];

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    category: [this.categories[0], Validators.required],
    isAnonymous: [false]
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.submittedMessage = '';
    this.trackingId = '';

    const { isAnonymous, ...payload } = this.form.getRawValue();
    const finalPayload = this.evidenceUrl ? { ...payload, evidenceUrl: this.evidenceUrl } : payload;
    const request$ = isAnonymous
      ? this.complaintService.submitAnonymousComplaint(finalPayload)
      : this.complaintService.submitComplaint(finalPayload);

    request$.subscribe({
      next: (response: { message?: string; trackingId?: string }) => {
        this.submittedMessage = response?.message ?? 'Complaint submitted successfully';
        this.trackingId = response?.trackingId ?? '';
        this.form.reset({
          title: '',
          description: '',
          category: this.categories[0],
          isAnonymous: false
        });
        this.evidenceUrl = '';
        this.uploadedFileName = '';
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error?.error?.message ?? 'Unable to submit complaint right now.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  onEvidenceSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Only PNG, JPEG, and PDF files are allowed.';
      input.value = '';
      return;
    }

    this.uploadingEvidence = true;
    this.errorMessage = '';

    this.complaintService.uploadEvidence(file).subscribe({
      next: (response: { url: string }) => {
        this.evidenceUrl = response.url;
        this.uploadedFileName = file.name;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error?.error?.message ?? 'Evidence upload failed. Please try again.';
        this.evidenceUrl = '';
        this.uploadedFileName = '';
      },
      complete: () => {
        this.uploadingEvidence = false;
      }
    });
  }
}
