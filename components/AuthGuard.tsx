'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';

const PUBLIC_PATHS = ['/', '/login', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();
    const { currentUser } = useAppSelector((state) => state.user);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // 1. Check if user is already in Redux
            if (currentUser) {
                setIsLoading(false);
                return;
            }

            // 2. Check for token in localStorage
            const token = localStorage.getItem('accessToken');
            if (!token) {
                if (!PUBLIC_PATHS.includes(pathname)) {
                    router.push('/login');
                }
                setIsLoading(false);
                return;
            }

            // 3. If token exists but no user in Redux, fetch user details
            try {
                const res = await fetch('http://localhost:3001/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    dispatch(setUser(data.user));
                    setIsLoading(false);
                    return;
                } else {
                    // Token invalid or expired
                    localStorage.removeItem('accessToken');
                    if (!PUBLIC_PATHS.includes(pathname)) {
                        router.push('/login');
                    }
                }
            } catch (error) {
                console.error('Auth check failed', error);
                if (!PUBLIC_PATHS.includes(pathname)) {
                    router.push('/login');
                }
            }

            setIsLoading(false);
        };

        checkAuth();
    }, [currentUser, pathname, router, dispatch]);

    // Show nothing while checking auth on protected routes
    if (isLoading && !PUBLIC_PATHS.includes(pathname)) {
        return null;
    }

    return <>{children}</>;
}
