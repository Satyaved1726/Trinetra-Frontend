import type { Complaint, ComplaintStatus, ManagedComplaintStatus } from '@/types/complaint';

export function formatStatus(status: ComplaintStatus) {
  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (character) => character.toUpperCase());
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function buildComplaintStats(complaints: Complaint[]) {
  const resolved = complaints.filter((complaint) => complaint.status === 'RESOLVED').length;
  const rejected = complaints.filter((complaint) => complaint.status === 'REJECTED').length;
  const open = complaints.filter(
    (complaint) =>
      complaint.status === 'SUBMITTED' ||
      complaint.status === 'UNDER_REVIEW' ||
      complaint.status === 'INVESTIGATING'
  ).length;
  const anonymous = complaints.filter((complaint) => complaint.anonymous).length;

  return {
    totalComplaints: complaints.length,
    openComplaints: open,
    resolvedComplaints: resolved,
    rejectedComplaints: rejected,
    anonymousComplaints: anonymous
  };
}

export function nextManagedStatus(status: ComplaintStatus): ManagedComplaintStatus {
  if (status === 'RESOLVED' || status === 'REJECTED' || status === 'INVESTIGATING') {
    return status;
  }

  return 'UNDER_REVIEW';
}