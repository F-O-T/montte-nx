import { Button } from "@packages/ui/components/button";
import {
   Command,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import { Field, FieldError, FieldLabel } from "@packages/ui/components/field";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   Activity,
   Apple,
   Banknote,
   Bike,
   BookOpen,
   Briefcase,
   Building,
   Bus,
   Car,
   ChefHat,
   Coffee,
   DollarSign,
   Dumbbell,
   Film,
   Gamepad2,
   Gift,
   GraduationCap,
   Heart,
   Home,
   Laptop,
   MapPin,
   Music,
   Palette,
   Pill,
   Plane,
   Scissors,
   ShoppingBag,
   Smartphone,
   Stethoscope,
   Store,
   Train,
   TreePine,
   Trophy,
   Tv,
   Umbrella,
   Utensils,
   Wrench,
   Zap,
} from "lucide-react";
import { useState } from "react";

const ICONS = [
   { name: "Activity", icon: Activity, category: "Lifestyle" },
   { name: "Apple", icon: Apple, category: "Food" },
   { name: "Banknote", icon: Banknote, category: "Finance" },
   { name: "Bike", icon: Bike, category: "Transport" },
   { name: "BookOpen", icon: BookOpen, category: "Education" },
   { name: "Briefcase", icon: Briefcase, category: "Work" },
   { name: "Building", icon: Building, category: "Real Estate" },
   { name: "Bus", icon: Bus, category: "Transport" },
   { name: "Car", icon: Car, category: "Transport" },
   { name: "ChefHat", icon: ChefHat, category: "Food" },
   { name: "Coffee", icon: Coffee, category: "Food" },
   { name: "DollarSign", icon: DollarSign, category: "Finance" },
   { name: "Dumbbell", icon: Dumbbell, category: "Health" },
   { name: "Film", icon: Film, category: "Entertainment" },
   { name: "Gamepad2", icon: Gamepad2, category: "Entertainment" },
   { name: "Gift", icon: Gift, category: "Shopping" },
   { name: "GraduationCap", icon: GraduationCap, category: "Education" },
   { name: "Heart", icon: Heart, category: "Health" },
   { name: "Home", icon: Home, category: "Home" },
   { name: "Laptop", icon: Laptop, category: "Technology" },
   { name: "MapPin", icon: MapPin, category: "Travel" },
   { name: "Music", icon: Music, category: "Entertainment" },
   { name: "Palette", icon: Palette, category: "Art" },
   { name: "Pill", icon: Pill, category: "Health" },
   { name: "Plane", icon: Plane, category: "Travel" },
   { name: "Scissors", icon: Scissors, category: "Services" },
   { name: "ShoppingBag", icon: ShoppingBag, category: "Shopping" },
   { name: "Smartphone", icon: Smartphone, category: "Technology" },
   { name: "Stethoscope", icon: Stethoscope, category: "Health" },
   { name: "Store", icon: Store, category: "Shopping" },
   { name: "Train", icon: Train, category: "Transport" },
   { name: "TreePine", icon: TreePine, category: "Nature" },
   { name: "Trophy", icon: Trophy, category: "Sports" },
   { name: "Tv", icon: Tv, category: "Entertainment" },
   { name: "Umbrella", icon: Umbrella, category: "Weather" },
   { name: "Utensils", icon: Utensils, category: "Food" },
   { name: "Wrench", icon: Wrench, category: "Maintenance" },
   { name: "Zap", icon: Zap, category: "Utilities" },
];

interface IconSelectorProps {
   value: string;
   onChange: (value: string) => void;
   isInvalid?: boolean;
   errors?: any[];
}

export function IconSelector({
   value,
   onChange,
   isInvalid,
   errors,
}: IconSelectorProps) {
   const [open, setOpen] = useState(false);
   const selectedIcon = ICONS.find((icon) => icon.name === value);

   return (
      <Field data-invalid={isInvalid}>
         <FieldLabel>Icon</FieldLabel>
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
               >
                  {selectedIcon ? (
                     <div className="flex items-center gap-2">
                        <selectedIcon.icon className="h-4 w-4" />
                        <span className="text-sm">{selectedIcon.name}</span>
                     </div>
                  ) : (
                     <span className="text-muted-foreground">
                        Select an icon...
                     </span>
                  )}
                  <div className="ml-auto h-4 w-4 shrink-0 opacity-50">▼</div>
               </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
               <Command>
                  <CommandInput placeholder="Search icons..." />
                  <CommandList>
                     <CommandEmpty>No icons found.</CommandEmpty>
                     {Object.entries(
                        ICONS.reduce(
                           (acc, icon) => {
                              if (!acc[icon.category]) {
                                 acc[icon.category] = [];
                              }
                              acc[icon.category]!.push(icon);
                              return acc;
                           },
                           {} as Record<string, typeof ICONS>,
                        ),
                     ).map(([category, icons]) => (
                        <CommandGroup key={category} heading={category}>
                           {icons.map((icon) => (
                              <CommandItem
                                 key={icon.name}
                                 value={icon.name}
                                 onSelect={() => {
                                    onChange(icon.name);
                                    setOpen(false);
                                 }}
                                 className="flex items-center gap-2"
                              >
                                 <icon.icon className="h-4 w-4" />
                                 <span>{icon.name}</span>
                              </CommandItem>
                           ))}
                        </CommandGroup>
                     ))}
                  </CommandList>
               </Command>
            </PopoverContent>
         </Popover>
         {isInvalid && <FieldError errors={errors} />}
      </Field>
   );
}
