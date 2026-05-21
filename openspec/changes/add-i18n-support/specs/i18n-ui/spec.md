# i18n-ui Specification

## Purpose

Provides multi-language UI infrastructure using next-intl with locale-aware routing, message extraction, and locale persistence.

## Requirements

### Requirement: Locale Routing Infrastructure

The system MUST route all pages through a `[locale]` dynamic segment supporting 'es' (default) and 'en'.

#### Scenario: User accesses root URL

- GIVEN user navigates to `/`
- WHEN middleware detects browser locale is 'en'
- THEN redirect to `/en`
- AND set locale cookie for future visits

#### Scenario: User accesses locale-prefixed URL

- GIVEN user navigates to `/es/recetas`
- WHEN locale segment is 'es'
- THEN render recipes page in Spanish
- AND locale is available to all components via context

#### Scenario: Unsupported locale requested

- GIVEN user navigates to `/fr/recetas`
- WHEN locale 'fr' is not in supported locales
- THEN redirect to default locale '/es/recetas'

### Requirement: UI String Extraction

The system MUST extract all user-facing strings to `messages/en.json` and `messages/es.json` files.

#### Scenario: Server Component renders translated text

- GIVEN a server component needs "Recetas" label
- WHEN component calls `getTranslations()` for 'common' namespace
- THEN returns `{ title: "Recetas" }` for locale 'es'
- AND returns `{ title: "Recipes" }` for locale 'en'

#### Scenario: Client Component renders translated text

- GIVEN a client component needs button label
- WHEN component calls `useTranslations()` hook
- THEN returns translated string based on current locale
- AND re-renders on locale change

#### Scenario: Missing translation key

- GIVEN translation key does not exist in message file
- WHEN component requests the key
- THEN return the key itself as fallback
- AND log warning in development mode only

### Requirement: Locale Preference Persistence

The system MUST store user locale preference in Profile model and cookie.

#### Scenario: Authenticated user changes locale

- GIVEN user is logged in with locale 'es'
- WHEN user switches to 'en' via locale switcher
- THEN update Profile.locale to 'en' in database
- AND set locale cookie to 'en'
- AND re-render UI in English

#### Scenario: Unauthenticated user locale preference

- GIVEN user is not logged in
- WHEN user selects locale 'en'
- THEN store locale in cookie only
- AND persist to Profile on next login

### Requirement: Locale-Aware Date Formatting

The system MUST format dates using locale-specific conventions.

#### Scenario: Date displayed in Spanish

- GIVEN current locale is 'es'
- WHEN rendering date May 21, 2026
- THEN display as "21 de mayo de 2026"

#### Scenario: Date displayed in English

- GIVEN current locale is 'en'
- WHEN rendering date May 21, 2026
- THEN display as "May 21, 2026"
