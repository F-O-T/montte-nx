import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   CommandDialog,
   CommandEmpty,
   CommandGroup,
   CommandInput,
   CommandItem,
   CommandList,
} from "@packages/ui/components/command";
import {
   Field,
   FieldError,
   FieldGroup,
   FieldLabel,
} from "@packages/ui/components/field";
import * as Icons from "lucide-react";
import { useState } from "react";

// All available icons for categories
export const AVAILABLE_ICONS = [
   "home",
   "car",
   "shopping-cart",
   "utensils",
   "coffee",
   "pizza",
   "beer",
   "wine",
   "cocktail",
   "film",
   "music",
   "headphones",
   "gamepad-2",
   "tv",
   "monitor",
   "smartphone",
   "laptop",
   "tablet",
   "camera",
   "video",
   "book",
   "book-open",
   "graduation-cap",
   "pencil",
   "pen-tool",
   "palette",
   "brush",
   "scissors",
   "ruler",
   "calculator",
   "briefcase",
   "tie",
   "shirt",
   "shopping-bag",
   "credit-card",
   "banknote",
   "piggy-bank",
   "wallet",
   "receipt",
   "tag",
   "tags",
   "gift",
   "package",
   "truck",
   "plane",
   "train",
   "bus",
   "bike",
   "anchor",
   "ship",
   "rocket",
   "helicopter",
   "building",
   "store",
   "warehouse",
   "factory",
   "office-building",
   "apartment",
   "house",
   "cabin",
   "tent",
   "hotel",
   "bed",
   "bath",
   "toilet",
   "sink",
   "shower",
   "heart",
   "lungs",
   "bone",
   "brain",
   "eye",
   "ear",
   "nose",
   "mouth",
   "stethoscope",
   "pill",
   "syringe",
   "thermometer",
   "bandage",
   "crutch",
   "wheelchair",
   "activity",
   "heart-pulse",
   "droplet",
   "tint",
   "zap",
   "flashlight",
   "battery",
   "plug",
   "lightbulb",
   "candle",
   "lamp",
   "chandelier",
   "fan",
   "wind",
   "cloud",
   "cloud-rain",
   "cloud-snow",
   "sun",
   "moon",
   "star",
   "cloud-lightning",
   "umbrella",
   "snowflake",
   "thermometer-snowflake",
   "thermometer-sun",
   "waves",
   "fire",
   "flame",
   "campfire",
   "barbecue",
   "chef-hat",
   "cookie",
   "ice-cream",
   "popcorn",
   "cherry",
   "apple",
   "grapes",
   "lemon",
   "orange",
   "carrot",
   "corn",
   "bread-slice",
   "egg",
   "cheese",
   "drumstick-bite",
   "fish",
   "shrimp",
   "crab",
   "octopus",
   "bug",
   "spider",
   "snake",
   "scorpion",
   "bird",
   "cat",
   "dog",
   "rabbit",
   "horse",
   "cow",
   "pig",
   "elephant",
   "lion",
   "tiger",
   "bear",
   "paw-print",
   "leaf",
   "tree",
   "tree-pine",
   "flower",
   "flower-2",
   "rose",
   "tulip",
   "cactus",
   "mushroom",
   "seedling",
   "sprout",
   "grass",
   "wheat",
   "dumbbell",
   "weight",
   "trophy",
   "medal",
   "target",
   "flag",
   "flag-triangle-left",
   "flag-triangle-right",
   "map",
   "map-pin",
   "compass",
   "navigation",
   "route",
   "signpost",
   "traffic-cone",
   "stop-sign",
   "traffic",
   "ambulance",
   "fire-truck",
   "police-car",
   "taxi",
   "motorcycle",
   "scooter",
   "subway",
   "tram",
   "satellite",
   "sailboat",
   "rowing",
   "surfing",
   "swimming",
   "skiing",
   "snowboarding",
   "hiking",
   "climbing",
   "camping",
   "bonfire",
   "axe",
   "hammer",
   "wrench",
   "screwdriver",
   "drill",
   "saw",
   "paintbrush",
   "paint-roller",
   "paint-bucket",
   "hard-hat",
   "safety-goggles",
   "glasses",
   "sunglasses",
   "volume-2",
   "volume-x",
   "volume-1",
   "volume",
   "mic",
   "mic-off",
   "video-off",
   "phone",
   "phone-off",
   "message-square",
   "message-circle",
   "mail",
   "mail-open",
   "send",
   "paperclip",
   "file",
   "file-text",
   "folder",
   "folder-open",
   "archive",
   "trash-2",
   "trash",
   "recycle",
   "download",
   "upload",
   "share",
   "share-2",
   "link",
   "link-2",
   "unlink",
   "external-link",
   "copy",
   "clipboard",
   "move",
   "maximize-2",
   "minimize-2",
   "fullscreen",
   "fullscreen-exit",
   "zoom-in",
   "zoom-out",
   "search",
   "filter",
   "sliders",
   "settings",
   "cog",
   "lock",
   "unlock",
   "key",
   "shield",
   "shield-check",
   "shield-x",
   "shield-off",
   "user",
   "user-check",
   "user-x",
   "user-minus",
   "user-plus",
   "users",
   "user-cog",
   "user-shield",
   "users-2",
   "user-circle",
   "id-card",
   "bell",
   "bell-off",
   "bell-ring",
   "calendar",
   "calendar-days",
   "clock",
   "timer",
   "timer-reset",
   "watch",
   "alarm-clock",
   "hourglass",
   "sunrise",
   "sunset",
   "cloud-sun",
   "cloud-moon",
   "droplets",
   "bolt",
   "battery-charging",
   "battery-full",
   "battery-low",
   "battery-medium",
   "battery-warning",
   "restaurant",
   "mug",
   "dollar-sign",
   "euro",
   "pound-sterling",
   "yen",
   "trending-up",
   "trending-down",
   "bar-chart",
   "pie-chart",
   "school",
   "library",
   "backpack",
   "award",
   "fuel",
   "parachute",
   "antenna",
   "modem",
   "router",
   "printer",
   "scanner",
   "joystick",
] as const;

export type AvailableIcon = (typeof AVAILABLE_ICONS)[number];

// Create icon components mapping
const iconComponents: Record<string, any> = {};
AVAILABLE_ICONS.forEach((iconName) => {
   // Convert kebab-case to PascalCase for Lucide icons
   const pascalCaseName = iconName
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");

   // Try to get the icon component from Lucide
   const IconComponent = (Icons as any)[pascalCaseName];
   if (IconComponent) {
      iconComponents[iconName] = IconComponent;
   }
});

// Group icons by category
const iconCategories = [
   {
      icons: [
         "credit-card",
         "banknote",
         "wallet",
         "piggy-bank",
         "receipt",
         "calculator",
         "briefcase",
         "tie",
         "shopping-cart",
         "shopping-bag",
         "tag",
         "tags",
         "gift",
         "package",
         "dollar-sign",
         "euro",
         "pound-sterling",
         "yen",
         "trending-up",
         "trending-down",
         "bar-chart",
         "pie-chart",
         "activity",
      ],
      name: "Finance & Business",
   },
   {
      icons: [
         "utensils",
         "coffee",
         "pizza",
         "beer",
         "wine",
         "cocktail",
         "chef-hat",
         "cookie",
         "ice-cream",
         "popcorn",
         "cherry",
         "apple",
         "grapes",
         "lemon",
         "orange",
         "carrot",
         "corn",
         "bread-slice",
         "egg",
         "cheese",
         "drumstick-bite",
         "fish",
         "shrimp",
         "crab",
         "octopus",
         "restaurant",
         "mug",
      ],
      name: "Food & Dining",
   },
   {
      icons: [
         "car",
         "truck",
         "motorcycle",
         "bicycle",
         "bus",
         "taxi",
         "plane",
         "train",
         "subway",
         "tram",
         "ship",
         "anchor",
         "helicopter",
         "rocket",
         "scooter",
         "fuel",
         "map-pin",
         "navigation",
         "compass",
         "route",
      ],
      name: "Transportation",
   },
   {
      icons: [
         "home",
         "house",
         "building",
         "apartment",
         "hotel",
         "bed",
         "bath",
         "toilet",
         "sink",
         "shower",
         "lamp",
         "lightbulb",
         "candle",
         "fire",
         "flame",
         "fan",
         "wind",
         "thermometer",
         "plug",
         "battery",
      ],
      name: "Home & Living",
   },
   {
      icons: [
         "film",
         "music",
         "headphones",
         "gamepad-2",
         "tv",
         "monitor",
         "smartphone",
         "laptop",
         "tablet",
         "camera",
         "video",
         "radio",
         "speaker",
         "microphone",
         "play",
         "pause",
         "skip-back",
         "skip-forward",
         "repeat",
         "shuffle",
      ],
      name: "Entertainment & Media",
   },
   {
      icons: [
         "book",
         "book-open",
         "graduation-cap",
         "pencil",
         "pen-tool",
         "palette",
         "brush",
         "ruler",
         "calculator",
         "school",
         "library",
         "backpack",
         "award",
         "trophy",
         "medal",
         "target",
         "flag",
      ],
      name: "Education & Work",
   },
   {
      icons: [
         "heart",
         "lungs",
         "bone",
         "brain",
         "eye",
         "ear",
         "nose",
         "mouth",
         "stethoscope",
         "pill",
         "syringe",
         "thermometer",
         "bandage",
         "crutch",
         "wheelchair",
         "dumbbell",
         "weight",
         "activity",
         "heart-pulse",
         "droplet",
      ],
      name: "Health & Fitness",
   },
   {
      icons: [
         "leaf",
         "tree",
         "tree-pine",
         "flower",
         "flower-2",
         "rose",
         "tulip",
         "cactus",
         "mushroom",
         "seedling",
         "sprout",
         "grass",
         "wheat",
         "sun",
         "moon",
         "star",
         "cloud",
         "cloud-rain",
         "cloud-snow",
         "umbrella",
         "snowflake",
         "waves",
         "fire",
         "flame",
         "campfire",
      ],
      name: "Nature & Environment",
   },
   {
      icons: [
         "dog",
         "cat",
         "rabbit",
         "horse",
         "cow",
         "pig",
         "elephant",
         "lion",
         "tiger",
         "bear",
         "paw-print",
         "bird",
         "fish",
         "whale",
         "dolphin",
         "shark",
         "butterfly",
         "bee",
         "ant",
         "spider",
         "bug",
         "snake",
      ],
      name: "Animals",
   },
   {
      icons: [
         "smartphone",
         "laptop",
         "tablet",
         "monitor",
         "desktop",
         "cpu",
         "hard-drive",
         "database",
         "server",
         "cloud",
         "wifi",
         "bluetooth",
         "usb",
         "battery",
         "charger",
         "headphones",
         "speaker",
         "camera",
         "video",
         "gamepad",
         "joystick",
         "mouse",
         "keyboard",
         "printer",
         "scanner",
         "router",
         "modem",
         "satellite",
         "antenna",
      ],
      name: "Technology & Tools",
   },
];

// Icon Selector Dialog Component
interface IconSelectorDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSelectIcon: (icon: AvailableIcon) => void;
   selectedIcon?: AvailableIcon;
}

function IconSelectorDialog({
   open,
   onOpenChange,
   onSelectIcon,
   selectedIcon,
}: IconSelectorDialogProps) {
   const [searchQuery, setSearchQuery] = useState("");

   const handleSelectIcon = (iconName: AvailableIcon) => {
      onSelectIcon(iconName);
      onOpenChange(false);
      setSearchQuery("");
   };

   const filteredCategories = iconCategories
      .map((category) => ({
         ...category,
         icons: category.icons.filter((icon) =>
            icon.toLowerCase().includes(searchQuery.toLowerCase()),
         ),
      }))
      .filter((category) => category.icons.length > 0);

   return (
      <CommandDialog onOpenChange={onOpenChange} open={open}>
         <CommandInput
            onValueChange={setSearchQuery}
            placeholder="Search for an icon..."
            value={searchQuery}
         />
         <CommandList>
            <CommandEmpty>No icons found.</CommandEmpty>

            {filteredCategories.map((category) => (
               <CommandGroup heading={category.name} key={category.name}>
                  {category.icons.map((iconName) => {
                     const IconComponent = iconComponents[iconName];
                     const isSelected = selectedIcon === iconName;

                     if (!IconComponent) return null;

                     return (
                        <CommandItem
                           className="flex items-center gap-2"
                           key={iconName}
                           onSelect={() => handleSelectIcon(iconName)}
                           value={iconName}
                        >
                           <IconComponent className="h-4 w-4" />
                           <span className="flex-1">{iconName}</span>
                           {isSelected && (
                              <Badge variant="secondary">Selected</Badge>
                           )}
                        </CommandItem>
                     );
                  })}
               </CommandGroup>
            ))}
         </CommandList>
      </CommandDialog>
   );
}

// Icon Selector Button Component
interface IconSelectorButtonProps {
   selectedIcon?: AvailableIcon;
   onSelectIcon: (icon: AvailableIcon) => void;
   variant?: "default" | "outline" | "ghost" | "secondary";
   size?: "default" | "sm" | "lg" | "icon";
   placeholder?: string;
   disabled?: boolean;
}

function IconSelectorButton({
   selectedIcon,
   onSelectIcon,
   variant = "outline",
   size = "default",
   placeholder = "Select an icon",
   disabled = false,
}: IconSelectorButtonProps) {
   const [dialogOpen, setDialogOpen] = useState(false);

   const SelectedIconComponent = selectedIcon
      ? iconComponents[selectedIcon]
      : null;

   return (
      <>
         <Button
            className="justify-start"
            disabled={disabled}
            onClick={() => setDialogOpen(true)}
            size={size}
            variant={variant}
         >
            {SelectedIconComponent ? (
               <>
                  <SelectedIconComponent className="h-4 w-4 mr-2" />
                  <span className="truncate">{selectedIcon}</span>
               </>
            ) : (
               <>
                  <Icons.Smile className="h-4 w-4 mr-2" />
                  <span className="truncate">{placeholder}</span>
               </>
            )}
            <Icons.ChevronDown className="h-4 w-4 ml-auto" />
         </Button>

         <IconSelectorDialog
            onOpenChange={setDialogOpen}
            onSelectIcon={onSelectIcon}
            open={dialogOpen}
            selectedIcon={selectedIcon}
         />
      </>
   );
}

// Icon Selector Field Component (for form integration)
interface IconSelectorFieldProps {
   value?: AvailableIcon;
   onChange: (value: AvailableIcon) => void;
   isInvalid?: boolean;
   errors?: string[];
}

export function IconSelectorField({
   value,
   onChange,
   isInvalid = false,
   errors = [],
}: IconSelectorFieldProps) {
   return (
      <Field data-invalid={isInvalid}>
         <FieldLabel>Icon</FieldLabel>
         <IconSelectorButton
            onSelectIcon={onChange}
            placeholder="Select an icon"
            selectedIcon={value}
         />
         {isInvalid && <FieldError errors={errors} />}
      </Field>
   );
}

// Legacy IconSelector for backward compatibility
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
   return (
      <IconSelectorField
         errors={errors}
         isInvalid={isInvalid}
         onChange={onChange}
         value={value as AvailableIcon}
      />
   );
}

// Hook for easier integration
interface UseIconSelectorProps {
   defaultIcon?: AvailableIcon;
}

export function useIconSelector({ defaultIcon }: UseIconSelectorProps = {}) {
   const [selectedIcon, setSelectedIcon] = useState<AvailableIcon | undefined>(
      defaultIcon,
   );

   return {
      IconSelectorButton: (
         props: Omit<
            React.ComponentProps<typeof IconSelectorButton>,
            "selectedIcon" | "onSelectIcon"
         >,
      ) => (
         <IconSelectorButton
            onSelectIcon={setSelectedIcon}
            selectedIcon={selectedIcon}
            {...props}
         />
      ),
      selectedIcon,
      setSelectedIcon,
   };
}
