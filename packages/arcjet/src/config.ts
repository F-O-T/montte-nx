import arcjet, {
	detectBot,
	fixedWindow,
	shield,
	tokenBucket,
	validateEmail,
} from "@arcjet/bun";
import { serverEnv } from "@packages/environment/server";

const ARCJET_KEY = serverEnv.ARCJET_KEY;

export const arcjetInstance = ARCJET_KEY
	? arcjet({
			key: ARCJET_KEY,
			characteristics: ["ip.src"],
			rules: [
				shield({
					mode: "DRY_RUN",
				}),
			],
		})
	: null;

export const AUTH_RATE_LIMITS = {
	SIGNUP: tokenBucket({
		mode: "DRY_RUN",
		refillRate: 5,
		interval: 3600,
		capacity: 5,
	}),
	LOGIN: tokenBucket({
		mode: "DRY_RUN",
		refillRate: 10,
		interval: 900,
		capacity: 10,
	}),
	PASSWORD_RESET: tokenBucket({
		mode: "DRY_RUN",
		refillRate: 3,
		interval: 3600,
		capacity: 3,
	}),
	GENERAL: tokenBucket({
		mode: "DRY_RUN",
		refillRate: 100,
		interval: 60,
		capacity: 100,
	}),
	OAUTH: fixedWindow({
		mode: "DRY_RUN",
		max: 30,
		window: "1m",
	}),
};

export const BOT_DETECTION = detectBot({
	mode: "DRY_RUN",
	allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
});

export const EMAIL_VALIDATION = validateEmail({
	mode: "DRY_RUN",
	block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
});

export const TRPC_RATE_LIMITS = {
	PUBLIC: tokenBucket({
		mode: "DRY_RUN",
		refillRate: 60,
		interval: 60,
		capacity: 200,
	}),
	PROTECTED: tokenBucket({
		mode: "DRY_RUN",
		refillRate: 100,
		interval: 60,
		capacity: 300,
	}),
};

export function getAuthEndpointRateLimit(pathname: string) {
	if (
		pathname.includes("/sign-up") ||
		pathname.includes("/email-otp/send-verification-otp")
	) {
		return AUTH_RATE_LIMITS.SIGNUP;
	}

	if (
		pathname.includes("/sign-in") ||
		pathname.includes("/email-otp/verify-email")
	) {
		return AUTH_RATE_LIMITS.LOGIN;
	}

	if (
		pathname.includes("/forgot-password") ||
		pathname.includes("/reset-password")
	) {
		return AUTH_RATE_LIMITS.PASSWORD_RESET;
	}

	if (
		pathname.includes("/callback") ||
		pathname.includes("/google") ||
		pathname.includes("/oauth")
	) {
		return AUTH_RATE_LIMITS.OAUTH;
	}

	return AUTH_RATE_LIMITS.GENERAL;
}

export function isSignupEndpoint(pathname: string): boolean {
	return (
		pathname.includes("/sign-up") ||
		pathname.includes("/email-otp/send-verification-otp")
	);
}
