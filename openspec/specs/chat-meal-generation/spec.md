# Chat Meal Generation Specification

## Purpose

Conversational interface for meal plan creation that progressively collects user requirements through chat, validates inputs before AI generation, and provides real-time streaming feedback. Replaces error-prone one-click generation with guided data collection.

## Requirements

### Requirement: Chat Session Initialization

The system MUST initialize a chat session when user navigates to the meal plan generation chat interface. The session SHALL maintain state for the duration of the interaction and track collected dietary profile fields.

#### Scenario: New chat session created

- GIVEN user navigates to `/meal-plans/generate/chat`
- WHEN the page loads
- THEN the system initializes a new chat session with empty message history
- AND the system displays a welcome message explaining the meal plan generation process

#### Scenario: Chat session state persistence

- GIVEN user has answered 2 questions in the chat
- WHEN user refreshes the page
- THEN the chat session state is lost (ephemeral sessions only)
- AND user must restart the conversation

### Requirement: Progressive Question Flow

The system SHALL ask questions progressively to collect dietary requirements, requesting only information not already provided. The question flow MUST prioritize: (1) dietary restrictions, (2) calorie goals, (3) meal frequency, (4) food preferences, (5) disallowed foods.

#### Scenario: Complete question flow without file upload

- GIVEN user has not uploaded a file
- WHEN user initiates chat-based generation
- THEN the system asks about dietary restrictions first
- AND after each answer, the system asks the next required question
- AND generation begins only after all required fields are collected (max 5 questions)

#### Scenario: Skip answered questions after file upload

- GIVEN user uploaded a file containing calorie goal and dietary restrictions
- WHEN file parsing completes
- THEN the system displays extracted data for confirmation
- AND the system skips questions about already-provided fields
- AND the system asks only about missing fields (e.g., food preferences)

#### Scenario: User provides unsolicited information

- GIVEN user volunteers calorie goal in response to first question about restrictions
- WHEN user submits the message
- THEN the system extracts and stores the calorie goal
- AND the system acknowledges the information
- AND the system skips the calorie goal question later in the flow

### Requirement: Streaming Chat Responses

The system MUST use Vercel AI SDK to stream chat responses in real-time. The interface SHALL display a typing indicator while the AI is generating a response.

#### Scenario: Normal streaming response

- GIVEN user submits a message
- WHEN the AI endpoint processes the request
- THEN the UI displays a typing indicator
- AND the response appears incrementally as tokens arrive
- AND the complete response is displayed within 5 seconds

#### Scenario: Streaming timeout handling

- GIVEN the AI endpoint takes longer than 30 seconds to respond
- WHEN the timeout threshold is reached
- THEN the system displays an error message
- AND the system offers to retry the request
- AND the chat session remains active

### Requirement: Meal Plan Generation Trigger

The system MUST trigger meal plan generation only after all required dietary profile fields are collected and validated. Generation SHALL call the existing `generateDiet()` function with validated parameters.

#### Scenario: All required fields collected

- GIVEN user has answered all required questions
- WHEN the last question is answered
- THEN the system displays a confirmation message
- AND the system calls `generateDiet()` with collected parameters
- AND the system shows a loading state during generation

#### Scenario: Validation failure before generation

- GIVEN user provides invalid input (e.g., negative calories)
- WHEN user submits the invalid value
- THEN the system displays a validation error message
- AND the system asks the question again
- AND generation is NOT triggered until valid input is provided

### Requirement: Generation Result Display

The system SHALL display the generated meal plan in a structured format upon successful generation. If generation fails, the system MUST show a user-friendly error message.

#### Scenario: Successful meal plan generation

- GIVEN `generateDiet()` returns a valid meal plan
- WHEN generation completes
- THEN the system displays the meal plan with meals organized by day
- AND the system offers options to save, regenerate, or export
- AND the chat interface remains available for follow-up questions

#### Scenario: Generation fails with validation error

- GIVEN `generateDiet()` fails Zod validation
- WHEN the error is caught
- THEN the system displays: "Could not generate meal plan. Let's adjust your requirements."
- AND the system identifies which field caused the failure
- AND the system re-asks the specific question about that field

## Acceptance Criteria

1. Chat interface loads at `/meal-plans/generate/chat` with welcome message
2. Progressive question flow collects max 5 required fields
3. Streaming responses display with typing indicator
4. Generation triggers only after all required fields are validated
5. Successful generation displays structured meal plan
6. Failed generation shows specific error and re-prompts for correction
7. Existing generate button remains functional throughout

## Validation Rules

| Field | Type | Validation |
|-------|------|------------|
| Dietary restrictions | string[] | MUST be from predefined list (vegetarian, vegan, gluten-free, etc.) |
| Calorie goal | number | MUST be between 1000 and 4000 |
| Meal frequency | number | MUST be between 2 and 6 meals per day |
| Food preferences | string[] | MAY be empty; if provided, MUST be non-empty strings |
| Disallowed foods | string[] | MAY be empty; if provided, MUST be non-empty strings |
