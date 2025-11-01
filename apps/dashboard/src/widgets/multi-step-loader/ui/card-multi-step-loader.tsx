import { cn } from "@packages/ui/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCheck, CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";

type LoadingState = {
   text: string;
};

const CardLoaderCore = ({
   loadingStates,
   value = 0,
}: {
   loadingStates: LoadingState[];
   value?: number;
}) => {
   return (
      <div className="flex relative justify-start flex-col">
         {loadingStates.map((loadingState, index) => {
            const distance = Math.abs(index - value);
            const opacity = Math.max(1 - distance * 0.2, 0);

            return (
               <motion.div
                  animate={{ opacity: opacity, y: -(value * 20) }}
                  className={cn("text-left flex gap-2 mb-2 text-sm")}
                  initial={{ opacity: 0, y: -(value * 20) }}
                  key={`#card-loader-${index + 1}`}
                  transition={{ duration: 0.3 }}
               >
                  <div className="flex-shrink-0">
                     {index > value && (
                        <CheckIcon className="w-4 h-4 text-muted-foreground" />
                     )}
                     {index <= value && (
                        <CheckCheck
                           className={cn(
                              "w-4 h-4",
                              value === index && "text-green-500",
                              index < value && "text-muted-foreground",
                           )}
                        />
                     )}
                  </div>
                  <span
                     className={cn(
                        "text-muted-foreground",
                        value === index && "text-foreground font-medium",
                     )}
                  >
                     {loadingState.text}
                  </span>
               </motion.div>
            );
         })}
      </div>
   );
};

export const CardMultiStepLoader = ({
   loadingStates,
   loading,
   duration = 2000,
   loop = true,
}: {
   loadingStates: LoadingState[];
   loading?: boolean;
   duration?: number;
   loop?: boolean;
}) => {
   const [currentState, setCurrentState] = useState(0);

   // biome-ignore lint/correctness/useExhaustiveDependencies: <if the current state isnt on the array it dont work>
   useEffect(() => {
      if (!loading || loadingStates.length === 0) {
         setCurrentState(0);
         return;
      }
      const timeout = setTimeout(() => {
         setCurrentState((prevState) =>
            loop
               ? prevState === loadingStates.length - 1
                  ? 0
                  : prevState + 1
               : Math.min(prevState + 1, loadingStates.length - 1),
         );
      }, duration);

      return () => clearTimeout(timeout);
   }, [loading, loop, loadingStates.length, duration, currentState]);

   return (
      <AnimatePresence mode="wait">
         {loading && (
            <motion.div
               animate={{ height: "auto", opacity: 1 }}
               className="overflow-hidden"
               exit={{ height: 0, opacity: 0 }}
               initial={{ height: 0, opacity: 0 }}
               transition={{ duration: 0.2 }}
            >
               <div className="py-4">
                  <CardLoaderCore
                     loadingStates={loadingStates}
                     value={currentState}
                  />
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   );
};
