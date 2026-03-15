# UI Components — Base UI primitives (shadcn-style)

All components in `apps/web/src/components/ui/` are thin wrappers around `@base-ui/react` primitives with Tailwind styling via `class-variance-authority` (cva). They follow the shadcn pattern: copy-paste, locally owned, no external component library lock-in.

Utility: `apps/web/src/lib/utils.ts` exports `cn()` — merges class names via `clsx` + `tailwind-merge`.

## Component Inventory

| Component | File | Variants | Key Props | Used By |
|-----------|------|----------|-----------|---------|
| **Button** | `ui/button.tsx` | default, outline, secondary, ghost, destructive, link | `variant`, `size` (default/xs/sm/lg/icon/icon-xs/icon-sm/icon-lg) | All pages, Header, Sidebar, Dialog |
| **Input** | `ui/input.tsx` | -- | Standard `<input>` props | Login, Settings, Header, Sidebar |
| **Label** | `ui/label.tsx` | -- | Standard `<label>` props | Login, Settings, Sidebar |
| **Card** | `ui/card.tsx` | size: default/sm | `size`; sub-components: CardHeader, CardTitle, CardDescription, CardContent, CardAction, CardFooter | Settings |
| **Dialog** | `ui/dialog.tsx` | -- | `showCloseButton`; sub-components: DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose | Settings, Sidebar |
| **DropdownMenu** | `ui/dropdown-menu.tsx` | item variant: default/destructive | `align`, `side`, `sideOffset`; sub-components: Content, Item, Group, Label, Separator, CheckboxItem, RadioGroup, RadioItem, Sub, SubTrigger, SubContent, Shortcut | Feeds (EntryListToolbar) |
| **Badge** | `ui/badge.tsx` | default, secondary, destructive, outline, ghost, link | `variant`, `render` | Sidebar (category feed count) |
| **Tooltip** | `ui/tooltip.tsx` | -- | `side`, `sideOffset`, `align`; sub-components: TooltipProvider, TooltipTrigger, TooltipContent | Sidebar (feed errors), App (provider) |
| **Collapsible** | `ui/collapsible.tsx` | -- | `open`, `onOpenChange`; sub-components: CollapsibleTrigger, CollapsibleContent | Sidebar (category groups) |
| **ScrollArea** | `ui/scroll-area.tsx` | scrollbar orientation: vertical/horizontal | `orientation`; sub-components: ScrollBar | Feeds (entry list, reader), Sidebar |
| **Separator** | `ui/separator.tsx` | orientation: horizontal/vertical | `orientation` | Feeds (reader), Settings |
| **Skeleton** | `ui/skeleton.tsx` | -- | Standard `<div>` props | Feeds (loading states) |

## Notes
- All primitives from `@base-ui/react` (not Radix UI)
- Styling uses Tailwind CSS with CSS custom properties for theming (`--primary`, `--muted`, etc.)
- All components accept `className` prop for extension via `cn()` merge
- `data-slot` attributes on every component for CSS targeting and debugging
