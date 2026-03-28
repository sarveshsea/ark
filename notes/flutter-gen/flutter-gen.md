---
name: flutter-gen
description: Flutter and Dart widget generation -- transforms Memoire component specs into Flutter widgets with Material 3, Riverpod state management, and responsive layouts
category: generate
activateOn: component-creation
freedomLevel: high
tags: [flutter, dart, material3, riverpod, widgets, codegen]
version: 1.0.0
---

# Flutter Generator -- Memoire Spec to Dart Widget

Transforms Memoire component specs into production-ready Flutter widgets. Uses Material Design 3, strict typing, Riverpod for state, and the Atomic Design hierarchy mapped to Flutter conventions.

---

## Atomic Design Mapping to Flutter

| Atomic Level | Flutter Widget Type | Output Directory | Example |
|--------------|-------------------|------------------|---------|
| atom | `StatelessWidget` | `lib/ui/atoms/` | `MButton`, `MAvatar`, `MBadge` |
| molecule | `StatelessWidget` | `lib/ui/molecules/` | `SearchField`, `UserChip` |
| organism | `StatefulWidget` or `ConsumerWidget` | `lib/ui/organisms/` | `DataTable`, `NavigationRail` |
| template | `StatelessWidget` (layout) | `lib/ui/templates/` | `DashboardLayout`, `AuthLayout` |
| page | `ConsumerWidget` | `lib/pages/` | `HomePage`, `SettingsPage` |

### Rules

- Atoms are always `StatelessWidget`. No dependencies on other atoms. Pure input/output via constructor parameters.
- Molecules compose 2-5 atoms. Still prefer `StatelessWidget` unless internal UI state (e.g., focus, hover) is required.
- Organisms may use `ConsumerWidget` (Riverpod) or `StatefulWidget` for local state. Manage data fetching at this level.
- Templates define layout structure with `Slot` parameters (child widgets). Never contain real data.
- Pages wire templates to providers and real data sources.

---

## Material Design 3 Token Mapping

Map Memoire design tokens to Material 3 `ThemeData` and `ColorScheme`.

```dart
// Global tokens -> ColorScheme
final colorScheme = ColorScheme.fromSeed(
  seedColor: const Color(0xFF6750A4), // --color-primary
  brightness: Brightness.light,
);

// Alias tokens -> ThemeData extensions
final theme = ThemeData(
  useMaterial3: true,
  colorScheme: colorScheme,
  textTheme: const TextTheme(
    displayLarge: TextStyle(fontSize: 57, fontWeight: FontWeight.w400),
    titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
    bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
    labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
  ),
);
```

### Custom Token Extensions

For tokens that go beyond Material 3 defaults, use `ThemeExtension`:

```dart
@immutable
class MemoireTokens extends ThemeExtension<MemoireTokens> {
  final double radiusSm;
  final double radiusMd;
  final double radiusLg;
  final double spacingUnit;

  const MemoireTokens({
    this.radiusSm = 4.0,
    this.radiusMd = 8.0,
    this.radiusLg = 16.0,
    this.spacingUnit = 8.0,
  });

  @override
  MemoireTokens copyWith({double? radiusSm, double? radiusMd, double? radiusLg, double? spacingUnit}) {
    return MemoireTokens(
      radiusSm: radiusSm ?? this.radiusSm,
      radiusMd: radiusMd ?? this.radiusMd,
      radiusLg: radiusLg ?? this.radiusLg,
      spacingUnit: spacingUnit ?? this.spacingUnit,
    );
  }

  @override
  ThemeExtension<MemoireTokens> lerp(covariant ThemeExtension<MemoireTokens>? other, double t) {
    if (other is! MemoireTokens) return this;
    return MemoireTokens(
      radiusSm: lerpDouble(radiusSm, other.radiusSm, t)!,
      radiusMd: lerpDouble(radiusMd, other.radiusMd, t)!,
      radiusLg: lerpDouble(radiusLg, other.radiusLg, t)!,
      spacingUnit: lerpDouble(spacingUnit, other.spacingUnit, t)!,
    );
  }
}
```

Access in widgets: `Theme.of(context).extension<MemoireTokens>()!.radiusMd`

---

## Layout Patterns

| Spec Layout | Flutter Widget | Notes |
|-------------|---------------|-------|
| `horizontal` | `Row` | Use `MainAxisAlignment` and `CrossAxisAlignment` |
| `vertical` | `Column` | Default for most card/list layouts |
| `stack` | `Stack` + `Positioned` | For overlapping elements, badges on avatars |
| `wrap` | `Wrap` | For tag lists, chip groups |
| `grid` | `GridView.builder` | For card grids, image galleries |
| `responsive` | `LayoutBuilder` | Breakpoint-driven layout switching |

### Responsive Breakpoints

```dart
class Breakpoints {
  static const double mobile = 600;
  static const double tablet = 900;
  static const double desktop = 1200;
}

// Usage in LayoutBuilder
LayoutBuilder(
  builder: (context, constraints) {
    if (constraints.maxWidth < Breakpoints.mobile) return MobileLayout();
    if (constraints.maxWidth < Breakpoints.tablet) return TabletLayout();
    return DesktopLayout();
  },
)
```

---

## State Management -- Riverpod

### Provider Mapping from Spec

| Spec State Type | Riverpod Provider | Use Case |
|----------------|-------------------|----------|
| static data | `Provider` | Constants, computed values |
| async data | `FutureProvider` / `AsyncNotifierProvider` | API calls, database reads |
| stream | `StreamProvider` | WebSocket, realtime data |
| mutable local | `StateProvider` | Toggle, form field, counter |
| complex state | `NotifierProvider` | Multi-field state with methods |

### Example Provider

```dart
@riverpod
class UserList extends _$UserList {
  @override
  FutureOr<List<User>> build() async {
    return await ref.read(userRepositoryProvider).fetchAll();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => ref.read(userRepositoryProvider).fetchAll());
  }
}
```

### Bloc Alternative

When using Bloc instead of Riverpod:

```dart
// Event
sealed class UserEvent {}
class LoadUsers extends UserEvent {}

// State
sealed class UserState {}
class UserLoading extends UserState {}
class UserLoaded extends UserState { final List<User> users; UserLoaded(this.users); }
class UserError extends UserState { final String message; UserError(this.message); }

// Bloc
class UserBloc extends Bloc<UserEvent, UserState> {
  UserBloc(this._repository) : super(UserLoading()) {
    on<LoadUsers>(_onLoad);
  }
  final UserRepository _repository;
  Future<void> _onLoad(LoadUsers event, Emitter<UserState> emit) async {
    emit(UserLoading());
    try {
      final users = await _repository.fetchAll();
      emit(UserLoaded(users));
    } catch (e) {
      emit(UserError(e.toString()));
    }
  }
}
```

---

## Asset Handling

- Images: place in `assets/images/`, reference via `Image.asset('assets/images/logo.png')`
- SVG icons: use `flutter_svg` package, place in `assets/icons/`
- Fonts: declare in `pubspec.yaml` under `fonts:`, map to `TextStyle`
- Platform-specific: use `Platform.isIOS` / `Platform.isAndroid` or `defaultTargetPlatform`

---

## Example: Spec to Dart Output

### Input Spec (JSON)

```json
{
  "name": "StatusBadge",
  "atomicLevel": "atom",
  "description": "Colored badge showing status text",
  "props": [
    { "name": "label", "type": "string", "required": true },
    { "name": "variant", "type": "enum", "values": ["success", "warning", "error", "info"], "default": "info" }
  ],
  "tokens": {
    "borderRadius": "radius.sm",
    "paddingX": "spacing.2",
    "paddingY": "spacing.1",
    "fontSize": "text.xs"
  }
}
```

### Output Dart

```dart
import 'package:flutter/material.dart';

enum StatusBadgeVariant { success, warning, error, info }

class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.label,
    this.variant = StatusBadgeVariant.info,
  });

  final String label;
  final StatusBadgeVariant variant;

  Color _backgroundColor(ColorScheme colors) => switch (variant) {
    StatusBadgeVariant.success => colors.primaryContainer,
    StatusBadgeVariant.warning => colors.tertiaryContainer,
    StatusBadgeVariant.error  => colors.errorContainer,
    StatusBadgeVariant.info   => colors.secondaryContainer,
  };

  Color _foregroundColor(ColorScheme colors) => switch (variant) {
    StatusBadgeVariant.success => colors.onPrimaryContainer,
    StatusBadgeVariant.warning => colors.onTertiaryContainer,
    StatusBadgeVariant.error  => colors.onErrorContainer,
    StatusBadgeVariant.info   => colors.onSecondaryContainer,
  };

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final tokens = Theme.of(context).extension<MemoireTokens>()!;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: tokens.spacingUnit,
        vertical: tokens.spacingUnit * 0.5,
      ),
      decoration: BoxDecoration(
        color: _backgroundColor(colors),
        borderRadius: BorderRadius.circular(tokens.radiusSm),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: _foregroundColor(colors),
        ),
      ),
    );
  }
}
```

---

## File Generation Conventions

| Artifact | Naming | Location |
|----------|--------|----------|
| Widget file | `snake_case.dart` | `lib/ui/{level}/` |
| Provider file | `snake_case_provider.dart` | `lib/providers/` |
| Model file | `snake_case.dart` | `lib/models/` |
| Test file | `snake_case_test.dart` | `test/ui/{level}/` |
| Barrel export | `{level}.dart` | `lib/ui/{level}/` |

### Codegen Checklist

1. Read spec JSON and validate with Zod schema
2. Determine atomic level and output directory
3. Map design tokens to Material 3 / ThemeExtension references
4. Generate widget class with typed constructor parameters
5. Generate provider if spec declares state
6. Generate widget test with golden image setup
7. Update barrel export file
8. Run `dart format` and `dart analyze` on output
