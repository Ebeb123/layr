# Graph Report - CLOTHE PICKER  (2026-11-08)

## Corpus Check
- Corpus is ~7,090 words - fits in a single context window. You may not need a graph.

## Summary
- 223 nodes · 467 edges · 10 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.81)
- Token cost: 47,976 input · 0 output

## Community Hubs (Navigation)
- Package Dependencies
- Wardrobe and Outfit Screens
- App Config (app.json)
- Outfit Suggestion Engine
- Item Editing UI
- Add Item Pipeline
- Database and Profile
- Expo Project Rules
- Tab Navigation
- TypeScript Config

## God Nodes (most connected - your core abstractions)
1. `OutfitPreviewScreen()` - 14 edges
2. `expo-sqlite` - 13 edges
3. `expo` - 12 edges
4. `react-native` - 12 edges
5. `AddItemScreen()` - 11 edges
6. `react` - 10 edges
7. `Occasion` - 10 edges
8. `Weather` - 10 edges
9. `Item` - 10 edges
10. `expo-router` - 9 edges

## Surprising Connections (you probably didn't know these)
- `choicesFor()` --calls--> `candidates()`  [EXTRACTED]
  src/app/outfit/preview.tsx → src/lib/suggest.ts
- `AddItemScreen()` --calls--> `ColorField()`  [EXTRACTED]
  src/app/(tabs)/add.tsx → src/components/ColorField.tsx
- `AddItemScreen()` --calls--> `TagPicker()`  [EXTRACTED]
  src/app/(tabs)/add.tsx → src/components/TagPicker.tsx
- `WardrobeScreen()` --calls--> `TagPicker()`  [EXTRACTED]
  src/app/(tabs)/index.tsx → src/components/TagPicker.tsx
- `OutfitsScreen()` --calls--> `TagPicker()`  [EXTRACTED]
  src/app/(tabs)/outfits.tsx → src/components/TagPicker.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Expo Toolchain Workflow (CLI, Router, EAS, CNG)** — agents_expo_cli_commands, agents_expo_router, agents_eas, agents_continuous_native_generation, agents_development_build [INFERRED 0.85]

## Communities (10 total, 0 thin omitted)

### Community 0 - "Package Dependencies"
Cohesion: 0.05
Nodes (51): dependencies, expo@~58.0.23, expo-constants@~58.0.15, expo-dev-client@~58.0.18, expo-file-system@~58.0.13, expo-font@~58.0.11, expo-image-manipulator@~58.0.16, expo-image-picker@~58.0.10 (+43 more)

### Community 1 - "Wardrobe and Outfit Screens"
Cohesion: 0.12
Nodes (32): react-native, OutfitPreviewScreen(), choicesFor(), remove(), save(), SLOTS, styles, styles (+24 more)

### Community 2 - "App Config (app.json)"
Cohesion: 0.07
Nodes (26): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, package, permissions, predictiveBackGestureEnabled (+18 more)

### Community 3 - "Outfit Suggestion Engine"
Cohesion: 0.20
Nodes (20): hexToHsl(), Hsl, hueGap(), isBright(), isNeutral(), outfitScore(), pairScore(), askGemini() (+12 more)

### Community 4 - "Item Editing UI"
Cohesion: 0.16
Nodes (17): EditItemScreen(), confirmDelete(), save(), styles, ColorField(), isHex(), PRESETS, Props (+9 more)

### Community 5 - "Add Item Pipeline"
Cohesion: 0.23
Nodes (14): AddItemScreen(), pickPhoto(), save(), Button(), styles, addItem(), canRemoveBackground, removeBackground() (+6 more)

### Community 6 - "Database and Profile"
Cohesion: 0.23
Nodes (9): expo-sqlite, ProfileScreen(), save(), SKIN_TONES, styles, getProfile(), saveProfile(), migrate() (+1 more)

### Community 7 - "Expo Project Rules"
Cohesion: 0.21
Nodes (10): AGENTS.md (Project Agent Instructions), app.json and Config Plugins, Continuous Native Generation (ios/android), Development Build (vs Expo Go), EAS (Build, Submit, Update), Expo CLI Commands (install, start, lint, doctor), Expo llms.txt Docs Index, Expo/React Native Mobile App (+2 more)

### Community 8 - "Tab Navigation"
Cohesion: 0.29
Nodes (7): expo-router@~58.0.30, react@19.3.0, expo-router, react, icon(), IconName, TabLayout()

### Community 9 - "TypeScript Config"
Cohesion: 0.29
Nodes (6): expo/tsconfig.base, compilerOptions, paths, strict, extends, include

## Knowledge Gaps
- **5 isolated node(s):** `expo/tsconfig.base`, `package.json (expo major version)`, `Expo llms.txt Docs Index`, `Expo Router (src/app routes)`, `app.json and Config Plugins`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 63 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-sqlite` connect `Database and Profile` to `Package Dependencies`, `Wardrobe and Outfit Screens`, `Item Editing UI`, `Add Item Pipeline`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **What connects `expo/tsconfig.base`, `package.json (expo major version)`, `Expo llms.txt Docs Index` to the rest of the system?**
  _5 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.053544494720965306 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `Wardrobe and Outfit Screens` to `Package Dependencies`, `Item Editing UI`, `Add Item Pipeline`, `Database and Profile`, `Tab Navigation`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `Wardrobe and Outfit Screens` be split into smaller, more focused modules?**
  _Cohesion score 0.11585365853658537 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Package Dependencies` to `Tab Navigation`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `App Config (app.json)` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._