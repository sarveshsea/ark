# Demo Scripts

These are the demos to keep reusing in README, npm, and launch posts. Lead with the code-first `0.13.0` demo.

## 60-second 0.13 code-first demo

Goal: show that Memoire starts from an existing shadcn/Tailwind app, no Figma required.

```bash
npm i -g @sarveshsea/memoire

# 1. Diagnose real UI debt in the current app
memi diagnose --no-write

# 2. Extract tokens and write an auditable report
memi tokens --from ./src --report --no-inferred

# 3. Package the improved system as an installable registry
memi publish --name @demo/ds
```

Talk track:

- start from code instead of a blank canvas
- show the design debt score and highest-impact issues
- show token coverage, mode coverage, duplicate values, and recommendations
- end on a registry package developers can install with `memi add`

Screen beats:

1. Open a real shadcn/Tailwind app with visible inconsistency.
2. Run `memi diagnose --no-write` and zoom into score, issues, and next moves.
3. Run `memi tokens --from ./src --report --no-inferred` and open `generated/tokens/token-extraction.report.md`.
4. Run `memi publish --name @demo/ds` and end on the install command.

## 60-second terminal demo

Goal: show the whole loop in one screen.

```bash
npm i -g @sarveshsea/memoire
memi diagnose --no-write
memi tokens --from ./src --report
memi publish --name @demo/ds
memi add Button --from @demo/ds
memi view @demo/ds/Button --print
```

Talk track:

- diagnose a real app
- extract the system from code
- publish the improved system to npm
- install a real component into a shadcn app
- open the component source or package surface

## 60-second tweakcn demo

Goal: show that tweakcn is a first-class workflow, not a one-off flag.

```bash
memi theme import ./tweakcn-export.css --name "Acme Theme"
memi theme validate "Acme Theme"
memi theme preview "Acme Theme"
memi theme publish "Acme Theme" --package @demo/theme
memi add Button --from @demo/theme
```

Talk track:

- import a tweakcn theme
- validate and preview it
- publish it as an installable package
- install a component from the published registry

## Recording notes

- Prefer the scoped npm package page over the website until the components index is healthy.
- Keep the terminal font large enough that `publish`, `theme publish`, and `add` are readable on mobile.
- End both demos on a real install command, not a dashboard or settings page.
