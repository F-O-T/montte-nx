import { Switch } from "@packages/ui/components/switch";
import { useEffect, useState } from "react";

interface BillingToggleProps {
	id?: string;
	showDiscount?: boolean;
}

export function BillingToggle({
	id = "pricing-toggle",
	showDiscount = true,
}: BillingToggleProps) {
	const [isYearly, setIsYearly] = useState(true);

	useEffect(() => {
		function handleBillingChange(e: CustomEvent<{ isYearly: boolean }>) {
			setIsYearly(e.detail.isYearly);
		}

		window.addEventListener(
			"billing-toggle-change",
			handleBillingChange as EventListener,
		);

		return () => {
			window.removeEventListener(
				"billing-toggle-change",
				handleBillingChange as EventListener,
			);
		};
	}, []);

	useEffect(() => {
		const monthlyEls = document.querySelectorAll(".price-monthly");
		const yearlyEls = document.querySelectorAll(".price-yearly");

		monthlyEls.forEach((el) => el.classList.toggle("hidden", isYearly));
		yearlyEls.forEach((el) => el.classList.toggle("hidden", !isYearly));
	}, [isYearly]);

	const handleChange = (checked: boolean) => {
		setIsYearly(checked);

		window.dispatchEvent(
			new CustomEvent("billing-toggle-change", {
				detail: { isYearly: checked },
			}),
		);
	};

	return (
		<div className="flex items-center gap-4">
			<span
				className={`text-sm font-medium transition-colors ${
					!isYearly ? "text-foreground" : "text-muted-foreground"
				}`}
			>
				Mensal
			</span>

			<Switch
				id={id}
				checked={isYearly}
				onCheckedChange={handleChange}
			/>

			<span
				className={`text-sm font-medium transition-colors ${
					isYearly ? "text-foreground" : "text-muted-foreground"
				}`}
			>
				Anual
			</span>

			{showDiscount && isYearly && (
				<span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
					Economize 17%
				</span>
			)}
		</div>
	);
}
