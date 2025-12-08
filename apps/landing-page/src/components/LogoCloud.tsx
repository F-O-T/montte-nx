"use client";

import { cn } from "@packages/ui/lib/utils";
import { motion } from "motion/react";

const logos = [
   {
      alt: "Nubank",
      src: "https://html.tailus.io/blocks/customers/nvidia.svg",
   },
   {
      alt: "Itau",
      src: "https://html.tailus.io/blocks/customers/column.svg",
   },
   {
      alt: "Bradesco",
      src: "https://html.tailus.io/blocks/customers/github.svg",
   },
   {
      alt: "Santander",
      src: "https://html.tailus.io/blocks/customers/nike.svg",
   },
   {
      alt: "Inter",
      src: "https://html.tailus.io/blocks/customers/lemonsqueezy.svg",
   },
   {
      alt: "C6 Bank",
      src: "https://html.tailus.io/blocks/customers/laravel.svg",
   },
];

interface LogoCloudProps {
   className?: string;
}

export default function LogoCloud({ className }: LogoCloudProps) {
   return (
      <div className={cn("w-full overflow-hidden", className)}>
         <p className="text-xs text-muted-foreground text-center mb-4">
            Integracao com os principais bancos
         </p>
         <div className="relative">
            <motion.div
               animate={{ x: "-50%" }}
               className="flex gap-12"
               initial={{ x: "0%" }}
               transition={{
                  duration: 25,
                  ease: "linear",
                  repeat: Number.POSITIVE_INFINITY,
               }}
            >
               {[...logos, ...logos].map((logo, index) => (
                  <div
                     className="flex shrink-0 items-center justify-center"
                     key={`${logo.alt}-${index}`}
                  >
                     <img
                        alt={logo.alt}
                        className="h-5 w-auto opacity-50 hover:opacity-100 transition-opacity dark:invert"
                        src={logo.src}
                     />
                  </div>
               ))}
            </motion.div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
         </div>
      </div>
   );
}
