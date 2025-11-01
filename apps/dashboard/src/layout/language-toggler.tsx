import { Button } from "@packages/ui/components/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@packages/ui/components/dialog";
import { cn } from "@packages/ui/lib/utils";
import { Globe } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export function LanguageToggler() {
   const { i18n } = useTranslation();
   const [open, setOpen] = useState(false);

   const languages = useMemo(
      () => [
         { code: "en", flag: "🇺🇸", name: "English" },
         { code: "pt", flag: "🇧🇷", name: "Português" },
      ],
      [],
   );

   const currentLanguageDisplay = useMemo(() => {
      const baseLangCode = i18n.language?.split("-")[0] || "en";
      return (
         languages.find((lang) => lang.code === baseLangCode)?.name || "English"
      );
   }, [i18n.language, languages]);

   const handleLanguageChange = async (lang: string) => {
      if (i18n.language === lang) {
         setOpen(false);
         return;
      }

      try {
         await i18n.changeLanguage(lang);
         setOpen(false);
      } catch (error) {
         console.error("Failed to change language:", error);
      }
   };

   return (
      <Dialog onOpenChange={setOpen} open={open}>
         <DialogTrigger asChild>
            <Button
               className="flex flex-col gap-2 justify-center items-center p-4 w-full h-full bg-background/50 backdrop-blur-sm"
               variant="outline"
            >
               <Globe className="w-6 h-6" />
               <span>Language</span>
               <span className="text-xs text-muted-foreground">
                  {currentLanguageDisplay}
               </span>
            </Button>
         </DialogTrigger>
         <DialogContent className="rounded-lg md:max-w-sm">
            <DialogHeader>
               <DialogTitle>Language</DialogTitle>
               <DialogDescription>
                  Select your preferred language
               </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
               {languages.map((lang) => (
                  <Button
                     className={cn(
                        "w-full justify-start text-left font-normal",
                        currentLanguageDisplay === lang.name &&
                           "bg-primary text-primary-foreground",
                     )}
                     key={lang.code}
                     onClick={() => handleLanguageChange(lang.code)}
                     variant={
                        currentLanguageDisplay === lang.name
                           ? "default"
                           : "outline"
                     }
                  >
                     <span className="mr-2">{lang.flag}</span>
                     <span>{lang.name}</span>
                     {currentLanguageDisplay === lang.name && (
                        <span className="ml-auto font-semibold">✓</span>
                     )}
                  </Button>
               ))}
            </div>
         </DialogContent>
      </Dialog>
   );
}
