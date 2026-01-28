# Refactor Colors to Single Source of Truth

The goal is to eliminate hardcoded hex values in `app/` and `constants/` and make `tailwind.config.js` the single source of truth for colors.

## Tasks

### 1. Update `constants/theme.ts`
-   **Goal:** Replace hardcoded hex strings with values derived from `tailwind.config.js`.
-   **Method:** Import `resolveConfig` from `tailwindcss/resolveConfig` and the tailwind config itself.
-   **Challenge:** `resolveConfig` is a Node.js utility and might not work in the React Native runtime.
-   **Alternative:** Since we can't easily use Tailwind runtime resolution in RN without heavy polyfills, we should **manually sync** the palette in `constants/theme.ts` to match `tailwind.config.js` values exactly, or create a shared JSON token file.
-   **Decided Approach:** Create a shared constant file `constants/colors.ts` that exports the palette objects used in `tailwind.config.js`. Then `tailwind.config.js` imports from there, and `constants/theme.ts` imports from there.
-   **Wait:** The user wants `tailwind.config.js` to be the source.
-   **Better Approach:** We will extract the color object from `tailwind.config.js` into `constants/colors.ts` (or similar) so both the Tailwind config and the App runtime can import the **exact same object**.
    1.  Create `constants/palette.ts` with the color definitions (cream, sage, warm, etc.).
    2.  Update `tailwind.config.js` to import this palette.
    3.  Update `constants/theme.ts` to use values from `constants/palette.ts`.

### 2. Update `app/(tabs)/_layout.tsx`
-   Replace hardcoded hex values with imports from `constants/palette.ts` (or `constants/theme.ts` if we map them there).
-   `tabBarActiveTintColor`:
    -   Dark: `#A8BD9C` -> `palette.sage[300]`
    -   Light: `#6B8B5E` -> `palette.sage[500]`
-   `backgroundColor`:
    -   Dark: `#EBE4D8` -> `palette.cream.dark`
    -   Light: `#F5F0E8` -> `palette.cream.DEFAULT`

### 3. Verify
-   Ensure no errors in Metro.
-   Ensure styles look correct.
