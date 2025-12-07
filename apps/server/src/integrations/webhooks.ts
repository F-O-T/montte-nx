import crypto from "node:crypto";
import type { DatabaseInstance } from "@packages/database/client";
import { organization } from "@packages/database/schema";
import { serverEnv as env } from "@packages/environment/server";
import { emitWebhookReceivedEvent } from "@packages/rules-engine/queue";
import { eq } from "drizzle-orm";

export type WebhookRequest = {
   body: unknown;
   headers: Record<string, string | undefined>;
   rawBody?: string;
};

export type WebhookResult = {
   success: boolean;
   message: string;
   eventId?: string;
};

function getHeaderValue(
   headers: Record<string, string | undefined>,
   key: string,
): string | undefined {
   const lowerKey = key.toLowerCase();
   for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === lowerKey) {
         return v;
      }
   }
   return undefined;
}

function verifyStripeSignature(
   payload: string,
   signature: string,
   secret: string,
): boolean {
   const parts = signature.split(",");
   const timestampPart = parts.find((p) => p.startsWith("t="));
   const v1Part = parts.find((p) => p.startsWith("v1="));

   if (!timestampPart || !v1Part) {
      return false;
   }

   const timestamp = timestampPart.slice(2);
   const expectedSignature = v1Part.slice(3);

   const signedPayload = `${timestamp}.${payload}`;
   const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

   const tolerance = 300;
   const timestampAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);

   if (timestampAge > tolerance) {
      return false;
   }

   return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(expectedSignature),
   );
}

function verifyAsaasSignature(
   payload: string,
   signature: string,
   secret: string,
): boolean {
   const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

   return crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature),
   );
}

function extractStripeOrganizationId(
   body: Record<string, unknown>,
): string | undefined {
   const data = body.data as Record<string, unknown> | undefined;
   const object = data?.object as Record<string, unknown> | undefined;
   const metadata = object?.metadata as Record<string, unknown> | undefined;
   return metadata?.organization_id as string | undefined;
}

function extractAsaasOrganizationId(
   body: Record<string, unknown>,
): string | undefined {
   const payment = body.payment as Record<string, unknown> | undefined;
   return payment?.externalReference as string | undefined;
}

export async function handleStripeWebhook(
   request: WebhookRequest,
   _db: DatabaseInstance,
): Promise<WebhookResult> {
   const signature = getHeaderValue(request.headers, "stripe-signature");

   if (!signature) {
      return {
         message: "Missing Stripe signature",
         success: false,
      };
   }

   const stripeSecret = env.STRIPE_WEBHOOK_SECRET;
   if (!stripeSecret) {
      return {
         message: "Stripe webhook secret not configured",
         success: false,
      };
   }

   const rawBody = request.rawBody || JSON.stringify(request.body);

   if (!verifyStripeSignature(rawBody, signature, stripeSecret)) {
      return {
         message: "Invalid Stripe signature",
         success: false,
      };
   }

   const body = request.body as Record<string, unknown>;
   const eventType = body.type as string;
   const organizationId = extractStripeOrganizationId(body);

   if (!organizationId) {
      return {
         message: "Organization ID not found in webhook payload metadata",
         success: false,
      };
   }

   const headersRecord: Record<string, string> = {};
   for (const [key, value] of Object.entries(request.headers)) {
      if (value) headersRecord[key] = value;
   }

   const job = await emitWebhookReceivedEvent(
      organizationId,
      "stripe",
      eventType,
      body,
      headersRecord,
   );

   return {
      eventId: job.id,
      message: "Stripe webhook received",
      success: true,
   };
}

export async function handleAsaasWebhook(
   request: WebhookRequest,
   _db: DatabaseInstance,
): Promise<WebhookResult> {
   const signature = getHeaderValue(request.headers, "asaas-access-token");

   if (!signature) {
      return {
         message: "Missing Asaas access token",
         success: false,
      };
   }

   const asaasSecret = env.ASAAS_WEBHOOK_SECRET;
   if (!asaasSecret) {
      return {
         message: "Asaas webhook secret not configured",
         success: false,
      };
   }

   const rawBody = request.rawBody || JSON.stringify(request.body);

   if (!verifyAsaasSignature(rawBody, signature, asaasSecret)) {
      return {
         message: "Invalid Asaas signature",
         success: false,
      };
   }

   const body = request.body as Record<string, unknown>;
   const eventType = body.event as string;
   const organizationId = extractAsaasOrganizationId(body);

   if (!organizationId) {
      return {
         message: "Organization ID not found in webhook payload",
         success: false,
      };
   }

   const headersRecord: Record<string, string> = {};
   for (const [key, value] of Object.entries(request.headers)) {
      if (value) headersRecord[key] = value;
   }

   const job = await emitWebhookReceivedEvent(
      organizationId,
      "asaas",
      eventType,
      body,
      headersRecord,
   );

   return {
      eventId: job.id,
      message: "Asaas webhook received",
      success: true,
   };
}

export async function handleCustomWebhook(
   organizationId: string,
   eventType: string,
   request: WebhookRequest,
   db: DatabaseInstance,
): Promise<WebhookResult> {
   const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
   });

   if (!org) {
      return {
         message: "Organization not found",
         success: false,
      };
   }

   const body = request.body as Record<string, unknown>;

   const headersRecord: Record<string, string> = {};
   for (const [key, value] of Object.entries(request.headers)) {
      if (value) headersRecord[key] = value;
   }

   const job = await emitWebhookReceivedEvent(
      organizationId,
      "custom",
      eventType || "custom.event",
      body,
      headersRecord,
   );

   return {
      eventId: job.id,
      message: "Custom webhook received",
      success: true,
   };
}
