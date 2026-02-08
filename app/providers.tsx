// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * Providers Component
 * Wraps the app with necessary context providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
	// Create QueryClient instance (per request in SSR, singleton in CSR)
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// Standardmäßig 5 Minuten Cache
						staleTime: 5 * 60 * 1000,
						// Retry bei Fehlern
						retry: 2,
						// Refetch beim Window-Fokus
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{/* DevTools nur in Development */}
			{process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
		</QueryClientProvider>
	);
}
