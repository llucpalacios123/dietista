# i18n-data Specification

## Purpose

Provides database schema and OpenAI pipeline for translating meal plan templates, meals, recipes, and food options across Spanish and English.

## Requirements

### Requirement: Translation Schema Extension

The system MUST add nullable `translations Json?` field to Meal, MealPlanTemplate, MealTemplate, FoodOption, and Recipe models.

#### Scenario: Template with translations stored

- GIVEN a MealPlanTemplate in Spanish
- WHEN English translation is generated
- THEN store as `{ "en": { "name": "...", "description": "..." } }`
- AND Spanish content remains in base fields

#### Scenario: Query returns locale-specific content

- GIVEN template has Spanish base fields and English translations
- WHEN API requests template with locale 'en'
- THEN merge base fields with `translations.en` values
- AND return fully English response

#### Scenario: Missing translation fallback

- GIVEN template has no English translation
- WHEN API requests locale 'en'
- THEN return Spanish base fields
- AND mark as `isTranslated: false` in response

### Requirement: OpenAI Translation Pipeline

The system MUST translate existing Spanish templates to English using OpenAI API.

#### Scenario: Batch translation script runs

- GIVEN 50 Spanish meal templates exist
- WHEN translation script executes with OpenAI
- THEN generate English translations preserving nutritional info
- AND store in `translations.en` field for each template

#### Scenario: Translation preserves structure

- GIVEN template has nested meal data (breakfast, lunch, dinner)
- WHEN translating to English
- THEN maintain exact JSON structure
- AND translate only user-visible strings, not IDs

#### Scenario: Translation quality validation

- GIVEN a translated template
- WHEN validation checks run
- THEN verify all required fields are translated
- AND flag for human review if nutritional values changed

### Requirement: Locale-Aware Meal Generation

The system MUST generate new meal plans in the user's locale using OpenAI.

#### Scenario: New meal plan in English

- GIVEN user locale is 'en'
- WHEN meal generation prompt executes
- THEN OpenAI generates English meal names and descriptions
- AND store in base fields (Spanish) and `translations.en`

#### Scenario: New meal plan in Spanish

- GIVEN user locale is 'es'
- WHEN meal generation prompt executes
- THEN OpenAI generates Spanish content (Carla Bozal style)
- AND store in base fields only

#### Scenario: Bilingual meal plan storage

- GIVEN meal plan generated for English user
- WHEN storing to database
- THEN save Spanish in base fields (default)
- AND save English in `translations.en`
- AND both locales available for future queries
