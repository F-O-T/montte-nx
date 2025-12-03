# Bank Accounts & Bank Account Details Standardization Plan

## Overview
This plan outlines the standardization of both bank accounts page and bank account details page to improve UX consistency, add missing functionality, and implement competitor-inspired features.

## Requirements Summary

### 1. Toggle Groups Standardization
- **Current State**: Bank accounts page has no icons in toggles, transactions page has icons
- **Target**: Both pages should use toggle groups with icons, spacing, and consistent styling
- **Pattern**: Follow the provided example with `spacing={2}`, icons, and colored states

### 2. Clear Filters Button
- **Current State**: Bank accounts page uses `variant="ghost"`
- **Target**: Change to `variant="outline"` for consistency

### 3. Actions Visibility
- **Current State**: Actions are visible on bank account details page
- **Target**: Ensure consistent action visibility across both pages

### 4. Transaction Expanded Content
- **Current State**: Shows redundant information (amount, category, type, date) that's already in table
- **Target**: Focus on category splits when transaction is divided, remove redundant info

### 5. Import OFX Button
- **Current State**: Simple button with no functionality
- **Target**: Convert to dropdown menu "Importar extrato" with OFX option

### 6. Empty States
- **Current State**: Filters hidden when no data and no active filters
- **Target**: Always show filters, even on empty states

### 7. Sort Select Removal
- **Current State**: Unclear "Ordenar por" select on bank accounts page
- **Target**: Remove entirely

### 8. Month Selector UX
- **Current State**: Feels out of place inline with search
- **Target**: Integrate with time chips in same row, remove today button

### 9. Bulk Selection Improvements
- **Current State**: Missing alert dialogs, bad styling (primary background)
- **Target**: Add confirmation dialogs, improve styling to be less intrusive

### 10. Bank Account Expanded Content
- **Current State**: Missing edit button and active/inactive toggle
- **Target**: Add edit button and active/inactive toggle with confirmation

### 11. Date Filtering for Stats
- **Current State**: No date filtering on bank account stats
- **Target**: Add TimePeriodChips + MonthSelector in header, mutually exclusive

## Implementation Details

### Files to Modify

#### Core UI Components
- `packages/ui/src/components/month-selector.tsx` - Remove today button
- `packages/ui/src/components/selection-action-bar.tsx` - Improve styling, add icon+text to clear button

#### Bank Accounts Page
- `apps/dashboard/src/pages/bank-accounts/ui/bank-accounts-list-section.tsx` - Remove sort, standardize toggles, show filters on empty
- `apps/dashboard/src/pages/bank-accounts/ui/bank-accounts-table-columns.tsx` - Add edit button to expanded content, add active/inactive toggle

#### Bank Account Details Page
- `apps/dashboard/src/pages/bank-account-details/ui/bank-account-details-page.tsx` - Add time chips + month selector
- `apps/dashboard/src/pages/bank-account-details/ui/bank-account-stats.tsx` - Add date filtering
- `apps/dashboard/src/pages/bank-account-details/ui/bank-account-charts.tsx` - Add date filtering
- `apps/dashboard/src/pages/bank-account-details/ui/bank-account-recent-transactions-section.tsx` - Ensure proper integration

#### Transaction Components
- `apps/dashboard/src/pages/transactions/ui/transactions-table-columns.tsx` - Improve expanded content

### Key Changes

#### 1. Toggle Groups Standardization
```tsx
// Pattern to follow
<ToggleGroup type="multiple" variant="outline" spacing={2} size="sm">
  <ToggleGroupItem value="star" className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-yellow-500">
    <StarIcon /> Star
  </ToggleGroupItem>
</ToggleGroup>
```

#### 2. Date Filtering Integration
- TimePeriodChips and MonthSelector in same row
- Mutual exclusion: selecting one disables the other
- Applied to stats, charts, and transactions sections

#### 3. Selection Action Bar Improvements
- Change from primary background to outline/secondary style
- Clear button shows both icon and text
- Add confirmation dialogs for all bulk actions

#### 4. Import Dropdown
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Importar extrato</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Importar OFX</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Implementation Order

1. **UI Components** - Month selector, selection action bar
2. **Bank Accounts Page** - Remove sort, standardize toggles, bulk actions
3. **Bank Account Details Page** - Date filtering, import dropdown
4. **Transaction Content** - Improve expanded content
5. **Empty States** - Show filters always

## Testing Checklist

- [ ] Toggle groups work consistently across pages
- [ ] Clear filters button is outlined
- [ ] Actions are visible on both pages
- [ ] Transaction expanded content shows category splits
- [ ] Import dropdown functions
- [ ] Filters visible on empty states
- [ ] Sort select removed
- [ ] Month selector integrated with time chips
- [ ] Bulk selection has confirmations and better styling
- [ ] Bank account expanded has edit and active/inactive toggle
- [ ] Date filtering works on stats and charts

## Questions for Clarification

1. **Selection bar style**: What specific style instead of primary background?
2. **Date filtering placement**: Where exactly should TimePeriodChips + MonthSelector appear?
3. **Import dropdown**: Any other import options besides OFX?</content>
<parameter name="filePath">BANK_ACCOUNTS_STANDARDIZATION_PLAN.md