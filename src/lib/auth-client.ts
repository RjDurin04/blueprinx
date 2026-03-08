import { createAuthClient } from "better-auth/react";
import { jwtClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [
        jwtClient()
    ],
    fetchOptions: {
        // Prevents multiple get-session requests from firing simultaneously
        // by reusing the in-flight promise and caching the result slightly.
        onSuccess: async () => {
            // No-op success handler just to allow the config
        }
    }
});

// Extract commonly used hooks and functions for easy importing
export const { useSession, signIn, signUp, signOut, requestPasswordReset, resetPassword } = authClient;
