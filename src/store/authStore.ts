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
		window.localStorage.removeItem('email');
		window.localStorage.removeItem('role');
		window.localStorage.removeItem('userEmail');
		window.localStorage.removeItem('userRole');
		clearStoredToken();
		return;
	}

	setStoredToken(session.token);
	window.localStorage.setItem('email', session.user.email);
	window.localStorage.setItem('role', session.user.role);
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
	login: (credentials: LoginCredentials) => Promise<AuthSession>;
	loginAdmin: (credentials: LoginCredentials) => Promise<AuthSession>;
	loginEmployee: (credentials: LoginCredentials) => Promise<AuthSession>;
	registerAdmin: (payload: RegisterPayload) => Promise<unknown>;
	registerEmployee: (payload: RegisterEmployeePayload) => Promise<unknown>;
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
			login: async (credentials) => {
				const nextSession = await authService.login(credentials);
				persistSession(nextSession);
				setSession(nextSession);
				return nextSession;
			},
			loginAdmin: async (credentials) => {
				const nextSession = await authService.login(credentials);
				persistSession(nextSession);
				setSession(nextSession);
				return nextSession;
			},
			loginEmployee: async (credentials) => {
				const nextSession = await authService.login(credentials);
				persistSession(nextSession);
				setSession(nextSession);
				return nextSession;
			},
			registerAdmin: async (payload) => {
				return authService.registerAdmin(payload);
			},
			registerEmployee: async (payload) => {
				return authService.registerAdmin(payload);
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
