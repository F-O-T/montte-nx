import type { Polar } from "@polar-sh/sdk";
import type { EventCreateCustomer } from "@polar-sh/sdk/models/components/eventcreatecustomer.js";
export const MODELS = {
   "deepseek-v3.1-terminus": "deepseek/deepseek-chat-v3.1-terminus",
   "gpt-5-mini": "openai/gpt-5-mini",
   "grok-4-fast": "x-ai/grok-4-fast",
} as const;
export const POLAR_BILLING_EVENTS = {
   CREDIT: "credit",
} as const;

export const USAGE_TYPE = {
   DB_OPERATIONS: "db_operations",
   LLM: "llm_usage",
   RAG_OPERATIONS: "rag_operations",
   WEB_SEARCH: "web_search",
} as const;

export const BILLING_CONFIG = {
   llmPricePerMillionTokens: 2.5, // $2.5 per 1M tokens
   rag_usage: 0.05,
   webSearchCost: 0.0008, // $0.08 cents per search
};

interface IngestBillingParams {
   externalCustomerId: string;
   metadata: EventCreateCustomer["metadata"];
}
export async function getCustomerState(
   client: Polar,
   externalId: IngestBillingParams["externalCustomerId"],
) {
   return await client.customers.getStateExternal({
      externalId,
   });
}

export async function ingestBilling(
   client: Polar,
   params: IngestBillingParams,
) {
   await client.events.ingest({
      events: [
         {
            externalCustomerId: params.externalCustomerId,
            metadata: params.metadata,
            name: POLAR_BILLING_EVENTS.CREDIT,
         },
      ],
   });
}
export const createAiUsageMetadata = (params: {
   inputTokens: number;
   outputTokens: number;
   effort: keyof typeof MODELS;
}) => {
   const creditsDebited = params.inputTokens + params.outputTokens;
   return {
      credits_debited: creditsDebited,
      effort: params.effort,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
      usage_type: USAGE_TYPE.LLM,
   };
};
export const createWebSearchUsageMetadata = (params: {
   method: "crawl" | "search" | "advanced";
}) => {
   let costMultiplier = 1;
   if (params.method === "crawl" || params.method === "advanced") {
      costMultiplier = 2;
   }

   const actualCost = BILLING_CONFIG.webSearchCost * costMultiplier;
   const tokenEquivalent = convertWebSearchCostToTokens(actualCost);

   return {
      actual_cost: actualCost,
      credits_debited: tokenEquivalent,
      method: params.method,
      usage_type: USAGE_TYPE.WEB_SEARCH,
   };
};

export const createRagUsageMetadata = (params: { agentId: string }) => {
   const cost = convertRagOperationCostToTokens(BILLING_CONFIG.rag_usage);
   return {
      agent_id: params.agentId,
      credits_debited: cost,
      usage_type: USAGE_TYPE.RAG_OPERATIONS,
   };
};

function convertRagOperationCostToTokens(cost: number): number {
   const tokens = (cost / BILLING_CONFIG.rag_usage) * 1000000;
   return Math.round(tokens);
}

function convertWebSearchCostToTokens(cost: number): number {
   const tokens = (cost / BILLING_CONFIG.llmPricePerMillionTokens) * 1000000;
   return Math.round(tokens);
}
