import { Routes } from '@angular/router';
import { AdminDashboardPageComponent } from './pages/admin-dashboard-page.component';
import { authGuard } from './guards/auth.guard';
import { LandingPageComponent } from './pages/landing-page.component';
import { LoginPageComponent } from './pages/login-page.component';
import { NotFoundPageComponent } from './pages/not-found-page.component';
import { RegisterPageComponent } from './pages/register-page.component';
import { SubmitComplaintPageComponent } from './pages/submit-complaint-page.component';
import { TrackComplaintPageComponent } from './pages/track-complaint-page.component';

export const routes: Routes = [
	{ path: '', component: LandingPageComponent },
	{ path: 'login', component: LoginPageComponent },
	{ path: 'register', component: RegisterPageComponent },
	{ path: 'submit', component: SubmitComplaintPageComponent, canActivate: [authGuard] },
	{ path: 'track', component: TrackComplaintPageComponent },
	{ path: 'admin', component: AdminDashboardPageComponent, canActivate: [authGuard] },
	{ path: '**', component: NotFoundPageComponent }
];
