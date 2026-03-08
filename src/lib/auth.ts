import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { Pool } from "pg";

/**
 * Sends an email via the EmailJS REST API.
 * Shared helper used by both password reset and verification flows.
 */
async function sendEmailJSEmail(
    templateId: string,
    templateParams: Record<string, string>
): Promise<void> {
    const emailjsData = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: templateId,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: templateParams,
    };

    try {
        const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailjsData),
        });

        if (!response.ok) {
            console.error(`Failed to send email (template: ${templateId}) via EmailJS`, await response.text());
        }
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`Error sending email (template: ${templateId}):`, errMsg);
    }
}

export const auth = betterAuth({
    database: new Pool({
        // Uses the direct Postgres connection string to Supabase
        connectionString: process.env.DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    }),
    // We are using JWT as the session strategy (Path B)
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache session in a signed cookie for 5 minutes
        },
    },
    rateLimit: {
        window: 60, // Base rate limit: 60 seconds
        max: 100,   // Base max requests
        customRules: {
            "/sign-in/email": {
                window: 60, // 1 minute
                max: 5,     // 5 attempts per minute
            },
            "/sign-up/email": {
                window: 60 * 60, // 1 hour
                max: 5,          // 5 accounts per hour
            },
            "/forget-password": {
                window: 60 * 5,  // 5 minutes
                max: 3,          // 3 requests per 5 minutes
            },
            "/reset-password": {
                window: 60 * 5,  // 5 minutes
                max: 3,          // 3 requests per 5 minutes
            }
        }
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        autoSignIn: false, // Don't sign in automatically after registration if verification is required
        sendResetPassword: async ({ user, url }) => {
            await sendEmailJSEmail(
                process.env.EMAILJS_TEMPLATE_ID_RESET!,
                { email: user.email, reset_link: url }
            );
        },
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
            await sendEmailJSEmail(
                process.env.EMAILJS_TEMPLATE_ID_VERIFY!,
                { email: user.email, verification_link: url }
            );
        },
    },
    plugins: [
        jwt()
    ]
});
