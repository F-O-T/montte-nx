import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
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
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Category } from "./categories-page";

const ICON_MAP = {
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
};

interface CategoriesTableProps {
   categories: Category[];
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
   if (categories.length === 0) {
      return (
         <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
               <h3 className="text-lg font-semibold">No categories yet</h3>
               <p className="text-muted-foreground">
                  Create your first category to get started organizing your
                  transactions.
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className="rounded-md border">
         <Table>
            <TableHeader>
               <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Icon</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {categories.map((category) => {
                  const IconComponent =
                     ICON_MAP[category.icon as keyof typeof ICON_MAP];
                  return (
                     <TableRow key={category.id}>
                        <TableCell className="font-medium">
                           {category.name}
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <div
                                 className="w-4 h-4 rounded-full border"
                                 style={{ backgroundColor: category.color }}
                              />
                              <span className="text-sm text-muted-foreground">
                                 {category.color}
                              </span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              {IconComponent && (
                                 <IconComponent className="h-4 w-4" />
                              )}
                              <Badge variant="outline">{category.icon}</Badge>
                           </div>
                        </TableCell>
                        <TableCell>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <Button
                                    className="h-8 w-8 p-0"
                                    variant="ghost"
                                 >
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                 </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                 <DropdownMenuItem>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </TableCell>
                     </TableRow>
                  );
               })}
            </TableBody>
         </Table>
      </div>
   );
}
