import type { DatabaseInstance } from "@packages/database/client";
import type { ActionConfig, Consequence } from "@packages/database/schema";
import type { Resend } from "resend";
import type { ActionExecutionResult } from "../types/actions";

export type VapidConfig = {
	publicKey: string;
	privateKey: string;
	subject: string;
};

export type ActionHandlerContext = {
	db: DatabaseInstance;
	organizationId: string;
	eventData: Record<string, unknown>;
	ruleId: string;
	dryRun?: boolean;
	resendClient?: Resend;
	vapidConfig?: VapidConfig;
};

export type ActionHandler = {
	type: Consequence["type"];
	execute: (
		consequence: Consequence,
		context: ActionHandlerContext,
	) => Promise<ActionExecutionResult>;
	validate?: (payload: ActionConfig) => {
		valid: boolean;
		errors: string[];
	};
};

export function createActionResult(
	consequence: Consequence,
	success: boolean,
	result?: unknown,
	error?: string,
): ActionExecutionResult {
	return {
		error,
		result,
		success,
		type: consequence.type,
	};
}

export function createSkippedResult(
	consequence: Consequence,
	reason: string,
): ActionExecutionResult {
	return {
		skipReason: reason,
		skipped: true,
		success: true,
		type: consequence.type,
	};
}
