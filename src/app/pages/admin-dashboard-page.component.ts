import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AdminStats, Complaint, ComplaintService, ManagedComplaintStatus } from '../services/complaint.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card table-card">
      <div class="table-header">
        <h2>Admin Dashboard</h2>
        <button class="btn" type="button" (click)="refreshDashboard()" [disabled]="loading">Refresh</button>
      </div>

      <div class="stats-grid">
        <article class="stats-card stats-total">
          <p>Total Complaints</p>
          <h3>{{ stats.totalComplaints }}</h3>
        </article>
        <article class="stats-card stats-pending">
          <p>Pending Complaints</p>
          <h3>{{ stats.pendingComplaints }}</h3>
        </article>
        <article class="stats-card stats-resolved">
          <p>Resolved Complaints</p>
          <h3>{{ stats.resolvedComplaints }}</h3>
        </article>
        <article class="stats-card stats-rejected">
          <p>Rejected Complaints</p>
          <h3>{{ stats.rejectedComplaints }}</h3>
        </article>
      </div>

      <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

      <div class="table-wrap" *ngIf="!loading && complaints.length > 0; else emptyState">
        <table>
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let complaint of complaints">
              <td>{{ complaint.trackingId }}</td>
              <td>{{ complaint.title }}</td>
              <td>{{ complaint.category }}</td>
              <td>
                <span class="status" [class]="'status status-' + getStatusClass(complaint.status)">
                  {{ complaint.status }}
                </span>
              </td>
              <td>{{ complaint.createdAt | date: 'medium' }}</td>
              <td>
                <div class="status-actions">
                  <select [(ngModel)]="complaint.status" [ngModelOptions]="{ standalone: true }">
                    <option *ngFor="let status of statusOptions" [value]="status">{{ status }}</option>
                  </select>
                  <button class="btn small" (click)="saveStatus(complaint)" type="button">Save</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #emptyState>
        <p class="sub loading-indicator" *ngIf="loading">
          <span class="spinner" aria-hidden="true"></span>
          Loading complaints...
        </p>
        <p class="sub" *ngIf="!loading">No complaints available.</p>
      </ng-template>
    </section>
  `,
  styles: [
    `
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.75rem;
        margin: 1rem 0;
      }

      .stats-card {
        border-radius: 0.8rem;
        padding: 0.85rem;
        border: 1px solid #d5dce8;
      }

      .stats-card p {
        margin: 0;
        font-size: 0.88rem;
      }

      .stats-card h3 {
        margin: 0.4rem 0 0;
        font-size: 1.45rem;
      }

      .stats-total {
        background: #f2f4f7;
        color: #4e5968;
      }

      .stats-pending {
        background: #e6efff;
        color: #1f4599;
      }

      .stats-resolved {
        background: #e5f7eb;
        color: #1d6b3a;
      }

      .stats-rejected {
        background: #ffe8e8;
        color: #a11818;
      }

      @media (max-width: 900px) {
        .stats-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 520px) {
        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  ]
})
export class AdminDashboardPageComponent implements OnInit {
  loading = false;
  errorMessage = '';
  complaints: Complaint[] = [];
  stats: AdminStats = {
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    rejectedComplaints: 0
  };
  readonly statusOptions: ManagedComplaintStatus[] = ['UNDER_REVIEW', 'RESOLVED', 'REJECTED'];

  constructor(private readonly complaintService: ComplaintService) {}

  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    this.loadStats();
    this.loadComplaints();
  }

  loadStats(): void {
    this.complaintService.getAdminStats().subscribe({
      next: (response: AdminStats) => {
        this.stats = response;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error?.error?.message ?? 'Unable to load dashboard statistics.';
      }
    });
  }

  loadComplaints(): void {
    this.loading = true;
    this.errorMessage = '';

    this.complaintService.getAllComplaints().subscribe({
      next: (response: Complaint[]) => {
        this.complaints = response;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error?.error?.message ?? 'Unable to load complaints.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  saveStatus(complaint: Complaint): void {
    this.errorMessage = '';
    const status = complaint.status as ManagedComplaintStatus;

    const shouldUpdate = window.confirm(`Update complaint ${complaint.trackingId} status to ${status}?`);
    if (!shouldUpdate) {
      return;
    }

    this.complaintService.updateStatus(complaint.trackingId, status).subscribe({
      next: (updated: Complaint) => {
        complaint.status = updated.status;
        this.loadStats();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error?.error?.message ?? 'Unable to update complaint status.';
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUBMITTED':
        return 'submitted';
      case 'UNDER_REVIEW':
        return 'under-review';
      case 'RESOLVED':
        return 'resolved';
      case 'REJECTED':
        return 'rejected';
      default:
        return 'submitted';
    }
  }
}
