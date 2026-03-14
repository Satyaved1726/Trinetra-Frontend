import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export type ManagedComplaintStatus = 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';
export type ComplaintStatus = ManagedComplaintStatus | string;

export interface Complaint {
  trackingId: string;
  title: string;
  description?: string;
  category: string;
  status: ComplaintStatus;
  createdAt: string;
}

export interface SubmitComplaintRequest {
  title: string;
  description: string;
  category: string;
  evidenceUrl?: string;
}

export interface AdminStats {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  rejectedComplaints: number;
}

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly baseUrl = environment.apiUrl;

  submitComplaint(payload: SubmitComplaintRequest): Observable<{ message?: string; trackingId?: string }> {
    return this.http
      .post<{ message?: string; trackingId?: string }>(`${this.baseUrl}/api/complaints/submit`, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleUnauthorized(error)));
  }

  submitAnonymousComplaint(payload: SubmitComplaintRequest): Observable<{ message?: string; trackingId?: string }> {
    return this.http
      .post<{ message?: string; trackingId?: string }>(`${this.baseUrl}/api/complaints/anonymous`, payload)
      .pipe(catchError((error: HttpErrorResponse) => this.handleUnauthorized(error)));
  }

  uploadEvidence(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<{ url: string }>(`${this.baseUrl}/api/complaints/upload`, formData)
      .pipe(catchError((error: HttpErrorResponse) => this.handleUnauthorized(error)));
  }

  trackComplaint(trackingId: string): Observable<Complaint> {
    return this.http
      .get<Complaint>(`${this.baseUrl}/api/complaints/track/${encodeURIComponent(trackingId)}`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleUnauthorized(error)));
  }

  getAllComplaints(): Observable<Complaint[]> {
    return this.http
      .get<Complaint[]>(`${this.baseUrl}/api/complaints/all`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleUnauthorized(error)));
  }

  updateStatus(trackingId: string, status: ManagedComplaintStatus): Observable<Complaint> {
    return this.http
      .put<Complaint>(`${this.baseUrl}/api/complaints/${encodeURIComponent(trackingId)}/status`, { status })
      .pipe(catchError((error: HttpErrorResponse) => this.handleUnauthorized(error)));
  }

  getAdminStats(): Observable<AdminStats> {
    return this.http
      .get<AdminStats>(`${this.baseUrl}/admin/stats`)
      .pipe(catchError((error: HttpErrorResponse) => this.handleUnauthorized(error)));
  }

  private handleUnauthorized(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      this.authService.clearToken();
      void this.router.navigate(['/login']);
    }

    return throwError(() => error);
  }
}
