import { Button } from "@packages/ui/components/button";
import { useNavigate } from "@tanstack/react-router";
import { Download, XIcon } from "lucide-react";
import { Suspense, useCallback, useState } from "react";
import type { ExportOptions, ExportStep } from "../types";
import { getExportSteps } from "../types";
import { AccountStep } from "./account-step";
import { ExportingStep } from "./exporting-step";
import { OptionsStep } from "./options-step";

interface ExportWizardProps {
	slug: string;
	initialStep?: ExportStep;
	initialBankAccountId?: string;
}

export function ExportWizard({
	slug,
	initialStep = "select-account",
	initialBankAccountId,
}: ExportWizardProps) {
	const navigate = useNavigate();

	// State
	const [step, setStep] = useState<ExportStep>(initialStep);
	const [bankAccountId, setBankAccountId] = useState<string | null>(
		initialBankAccountId ?? null,
	);
	const [options, setOptions] = useState<ExportOptions>({
		format: "ofx",
		startDate: null,
		endDate: null,
		typeFilter: "all",
	});

	// Navigation
	const steps = getExportSteps();
	const currentStepIndex = steps.indexOf(step);
	const totalSteps = steps.length;

	const handleCancel = useCallback(() => {
		navigate({
			params: { slug },
			to: "/$slug/bank-accounts",
		});
	}, [navigate, slug]);

	const handleBack = useCallback(() => {
		const prevIndex = currentStepIndex - 1;
		const prevStep = steps[prevIndex];
		if (prevIndex >= 0 && prevStep) {
			setStep(prevStep);
		} else {
			handleCancel();
		}
	}, [currentStepIndex, steps, handleCancel]);

	const goToStep = useCallback((nextStep: ExportStep) => {
		setStep(nextStep);
	}, []);

	// Step handlers
	const handleAccountSelected = useCallback(
		(accountId: string) => {
			setBankAccountId(accountId);
			goToStep("options");
		},
		[goToStep],
	);

	const handleOptionsComplete = useCallback(
		(exportOptions: ExportOptions) => {
			setOptions(exportOptions);
			goToStep("exporting");
		},
		[goToStep],
	);

	const handleExportComplete = useCallback(() => {
		if (bankAccountId) {
			navigate({
				params: { slug, bankAccountId },
				to: "/$slug/bank-accounts/$bankAccountId",
			});
		} else {
			navigate({
				params: { slug },
				to: "/$slug/bank-accounts",
			});
		}
	}, [navigate, slug, bankAccountId]);

	// Step indicator
	const StepIndicator = () => (
		<div className="flex items-center gap-4">
			<div className="flex items-center gap-1.5">
				{Array.from({ length: totalSteps }).map((_, index) => (
					<div
						className={`h-1 w-8 rounded-full transition-colors duration-300 ${
							index <= currentStepIndex ? "bg-primary" : "bg-muted"
						}`}
						key={index}
					/>
				))}
			</div>
			<span className="text-sm text-muted-foreground whitespace-nowrap">
				{currentStepIndex + 1} de {totalSteps}
			</span>
		</div>
	);

	const getStepTitle = () => {
		switch (step) {
			case "select-account":
				return "Selecionar Conta";
			case "options":
				return "Configurar Exportação";
			case "exporting":
				return "Exportando...";
			default:
				return "";
		}
	};

	const getStepDescription = () => {
		switch (step) {
			case "select-account":
				return "Escolha a conta bancária para exportar as transações";
			case "options":
				return "Defina o formato, período e tipo de transações a exportar";
			case "exporting":
				return `Gerando arquivo ${options.format.toUpperCase()} com as transações...`;
			default:
				return "";
		}
	};

	return (
		<div className="min-h-screen flex flex-col">
			<header className="p-4 border-b">
				<div className="max-w-3xl mx-auto flex items-center justify-between">
					<Button
						className="gap-2"
						onClick={handleCancel}
						size="sm"
						variant="ghost"
					>
						<XIcon className="size-4" />
						Cancelar
					</Button>
					<StepIndicator />
					<div className="w-20" />
				</div>
			</header>

			<div className="flex-1 flex flex-col items-center p-4">
				<div className="w-full max-w-3xl space-y-8">
					<div className="text-center space-y-2">
						<div className="flex justify-center mb-4">
							<div className="p-4 rounded-full bg-primary/10">
								<Download className="size-8 text-primary" />
							</div>
						</div>
						<h1 className="text-3xl font-semibold font-serif">
							{getStepTitle()}
						</h1>
						<p className="text-muted-foreground text-sm">
							{getStepDescription()}
						</p>
					</div>

					<div className="space-y-4">
						{step === "select-account" && (
							<Suspense
								fallback={
									<div className="space-y-3">
										{[1, 2, 3].map((i) => (
											<div
												className="h-20 w-full rounded-lg bg-muted animate-pulse"
												key={i}
											/>
										))}
									</div>
								}
							>
								<AccountStep
									initialBankAccountId={initialBankAccountId}
									onSelect={handleAccountSelected}
								/>
							</Suspense>
						)}

						{step === "options" && bankAccountId && (
							<OptionsStep
								initialOptions={options}
								onBack={handleBack}
								onComplete={handleOptionsComplete}
							/>
						)}

						{step === "exporting" && bankAccountId && (
							<ExportingStep
								bankAccountId={bankAccountId}
								onComplete={handleExportComplete}
								onError={handleBack}
								options={options}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
