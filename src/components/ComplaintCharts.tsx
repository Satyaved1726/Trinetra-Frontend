import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Complaint, ComplaintStats } from '@/types/complaint';

ChartJS.register(ArcElement, BarElement, CategoryScale, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip);

export function ComplaintCharts({ complaints, stats }: { complaints: Complaint[]; stats: ComplaintStats }) {
  const categoryCounts = complaints.reduce<Record<string, number>>((accumulator, complaint) => {
    accumulator[complaint.category] = (accumulator[complaint.category] ?? 0) + 1;
    return accumulator;
  }, {});

  const monthlyCounts = complaints.reduce<Record<string, number>>((accumulator, complaint) => {
    const monthLabel = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      year: '2-digit'
    }).format(new Date(complaint.createdAt));

    accumulator[monthLabel] = (accumulator[monthLabel] ?? 0) + 1;
    return accumulator;
  }, {});

  const timelineLabels = Object.keys(monthlyCounts);

  const statusData = {
    labels: ['Open', 'Resolved', 'Rejected'],
    datasets: [
      {
        label: 'Complaints',
        data: [stats.openComplaints, stats.resolvedComplaints, stats.rejectedComplaints],
        backgroundColor: ['#f59e0b', '#10b981', '#f43f5e'],
        borderRadius: 16,
        maxBarThickness: 42
      }
    ]
  };

  const trendData = {
    labels: timelineLabels.length ? timelineLabels : ['No Data'],
    datasets: [
      {
        label: 'Complaints filed',
        data: timelineLabels.length ? Object.values(monthlyCounts) : [0],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.16)',
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        tension: 0.35,
        fill: true
      }
    ]
  };

  const categoryData = {
    labels: Object.keys(categoryCounts).length ? Object.keys(categoryCounts) : ['No Data'],
    datasets: [
      {
        label: 'Categories',
        data: Object.keys(categoryCounts).length ? Object.values(categoryCounts) : [1],
        backgroundColor: ['#0f172a', '#2563eb', '#7c3aed', '#db2777', '#0f766e', '#ea580c']
      }
    ]
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Resolution Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <Bar
            data={statusData}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, ticks: { precision: 0 } }
              }
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Complaint Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <Line
            data={trendData}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, ticks: { precision: 0 } }
              }
            }}
          />
        </CardContent>
      </Card>
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Category Mix</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <Doughnut
            data={categoryData}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom' } },
              cutout: '62%'
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}