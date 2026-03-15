import { createContext, createElement, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import { clearStoredToken, setStoredToken } from '@/services/httpClient';
import { authService } from '@/services/authService';
import type {
	AuthSession,
	AuthUser,
	LoginCredentials,
	RegisterEmployeePayload,
	RegisterPayload,
	UserRole
} from '@/types/auth';

const SESSION_KEY = 'trinetra_session';

function parseStoredSession() {
	const value = window.localStorage.getItem(SESSION_KEY);
	if (!value) {
		return null;
	}

	try {
		return JSON.parse(value) as AuthSession;
	} catch {
		return null;
	}
}

function persistSession(session: AuthSession | null) {
	if (!session) {
		window.localStorage.removeItem(SESSION_KEY);
		window.localStorage.removeItem('userEmail');
		window.localStorage.removeItem('userRole');
		clearStoredToken();
		return;
	}

	setStoredToken(session.token);
	window.localStorage.setItem('userEmail', session.user.email);
	window.localStorage.setItem('userRole', session.user.role);
	window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

interface AuthStoreValue {
	token: string | null;
	user: AuthUser | null;
	role: UserRole | null;
	isAuthenticated: boolean;
	isAdmin: boolean;
	isEmployee: boolean;
	loginAdmin: (credentials: LoginCredentials) => Promise<void>;
	loginEmployee: (credentials: LoginCredentials) => Promise<void>;
	registerAdmin: (payload: RegisterPayload) => Promise<void>;
	registerEmployee: (payload: RegisterEmployeePayload) => Promise<void>;
	logout: () => void;
}

const AuthStoreContext = createContext<AuthStoreValue | null>(null);

export function AuthStoreProvider({ children }: PropsWithChildren) {
	const [session, setSession] = useState<AuthSession | null>(() => parseStoredSession());

	const value = useMemo<AuthStoreValue>(
		() => ({
			token: session?.token ?? null,
			user: session?.user ?? null,
			role: session?.user.role ?? null,
			isAuthenticated: Boolean(session?.token),
			isAdmin: session?.user.role === 'ADMIN',
			isEmployee: session?.user.role === 'EMPLOYEE',
			loginAdmin: async (credentials) => {
				const nextSession = await authService.loginAdmin(credentials);
				persistSession(nextSession);
				setSession(nextSession);
			},
			loginEmployee: async (credentials) => {
				const nextSession = await authService.loginEmployee(credentials);
				persistSession(nextSession);
				setSession(nextSession);
			},
			registerAdmin: async (payload) => {
				await authService.registerAdmin(payload);
			},
			registerEmployee: async (payload) => {
				await authService.registerEmployee(payload);
			},
			logout: () => {
				persistSession(null);
				setSession(null);
			}
		}),
		[session]
	);

	return createElement(AuthStoreContext.Provider, { value }, children);
}

export function useAuthStore() {
	const context = useContext(AuthStoreContext);
	if (!context) {
		throw new Error('useAuthStore must be used within an AuthStoreProvider.');
	}

	return context;
}
