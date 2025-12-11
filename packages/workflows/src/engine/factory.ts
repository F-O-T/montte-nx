import type { EvaluatorConfig } from "@f-o-t/condition-evaluator";
import { createEvaluator } from "@f-o-t/condition-evaluator";
import type { DatabaseInstance } from "@packages/database/client";

export type WorkflowEngineConfig = {
   db: DatabaseInstance;
   evaluatorConfig?: Partial<EvaluatorConfig>;
};

export type WorkflowEngine = {
   evaluator: ReturnType<typeof createEvaluator>;
   db: DatabaseInstance;
};

export function createWorkflowEngine(
   config: WorkflowEngineConfig,
): WorkflowEngine {
   const evaluator = createEvaluator(config.evaluatorConfig ?? {});

   return {
      db: config.db,
      evaluator,
   };
}
