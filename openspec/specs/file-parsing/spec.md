# File Parsing Specification

## Purpose

Extract structured dietary data from user-uploaded files (PDF, TXT, JSON) to pre-populate meal plan generation parameters. Reduces manual data entry and allows users to provide complex preferences via document upload.

## Requirements

### Requirement: File Upload Handling

The system MUST accept file uploads via Server Action with `useActionState`. Supported formats SHALL be: PDF (text-based), TXT, and JSON. Maximum file size MUST be 5MB.

#### Scenario: Valid file upload

- GIVEN user selects a valid file (PDF/TXT/JSON, under 5MB)
- WHEN user submits the upload
- THEN the system validates file type and size
- AND the system stores the file temporarily in `/tmp` or memory
- AND the system triggers the parsing process

#### Scenario: Invalid file type

- GIVEN user selects an unsupported file type (e.g., .docx, .png)
- WHEN user attempts to upload
- THEN the system rejects the upload immediately
- AND the system displays: "Unsupported file type. Please upload PDF, TXT, or JSON files only."
- AND the file is NOT stored or processed

#### Scenario: File exceeds size limit

- GIVEN user selects a file larger than 5MB
- WHEN user attempts to upload
- THEN the system rejects the upload
- AND the system displays: "File too large. Maximum size is 5MB."
- AND the user is prompted to upload a smaller file

#### Scenario: Image-based PDF upload

- GIVEN user uploads a scanned PDF (image-based, no extractable text)
- WHEN the parsing process attempts text extraction
- THEN the system detects no extractable text
- AND the system displays: "Could not read this PDF. Please upload a text-based PDF or try TXT/JSON format."
- AND the system falls back to manual question flow

### Requirement: File Content Parsing

The system SHALL parse file content based on file type: (1) JSON: direct parsing, (2) TXT: raw text extraction, (3) PDF: text extraction via `pdf-parse`. After extraction, the system MUST use OpenAI to identify and structure dietary data.

#### Scenario: JSON file with valid structure

- GIVEN user uploads a JSON file with dietary data
- WHEN the system parses the file
- THEN the system directly extracts fields matching the dietary profile schema
- AND the system validates extracted data against schema
- AND the system displays extracted data for user confirmation

#### Scenario: TXT file with unstructured preferences

- GIVEN user uploads a TXT file containing free-text dietary notes
- WHEN the system extracts text and sends to OpenAI
- THEN OpenAI identifies structured data (restrictions, calories, preferences)
- AND the system displays extracted fields with confidence indicators
- AND the system allows user to correct any misinterpretations

#### Scenario: PDF with mixed content

- GIVEN user uploads a text-based PDF with dietary information
- WHEN the system extracts text and sends to OpenAI
- THEN the system identifies structured dietary data
- AND the system handles multi-page documents
- AND the system merges data from all pages into a single profile

### Requirement: Data Extraction and Mapping

The system MUST map extracted data to the dietary profile schema: `dietaryRestrictions`, `calorieGoal`, `mealFrequency`, `foodPreferences`, `disallowedFoods`. Fields that cannot be confidently extracted SHALL be marked as missing.

#### Scenario: Complete data extraction

- GIVEN uploaded file contains all required dietary fields
- WHEN OpenAI extraction completes
- THEN all fields are populated with extracted values
- AND the system displays: "Found all required information!"
- AND the system proceeds to confirmation step

#### Scenario: Partial data extraction

- GIVEN uploaded file contains only some dietary fields (e.g., restrictions but no calorie goal)
- WHEN OpenAI extraction completes
- THEN the system populates available fields
- AND the system marks missing fields explicitly
- AND the chat flow continues with questions only for missing fields

#### Scenario: Conflicting data in file

- GIVEN uploaded file contains conflicting information (e.g., "vegan" and "eat chicken daily")
- WHEN the system detects the conflict
- THEN the system flags the conflict for user review
- AND the system displays: "We found conflicting information. Please clarify:"
- AND the system asks the user to resolve the conflict via chat

### Requirement: Extracted Data Confirmation

The system SHALL display all extracted data to the user for confirmation before proceeding with meal plan generation. User MUST explicitly confirm or correct the extracted data.

#### Scenario: User confirms extracted data

- GIVEN extracted data is displayed
- WHEN user clicks "Confirm" or types confirmation
- THEN the system accepts the extracted data as valid
- AND the system proceeds to meal plan generation (if all fields present)
- OR the system continues with missing-field questions

#### Scenario: User corrects extracted data

- GIVEN extracted data shows incorrect calorie goal (e.g., 200 instead of 2000)
- WHEN user types correction (e.g., "Actually, it's 2000 calories")
- THEN the system updates the field with the corrected value
- AND the system confirms the correction
- AND the system continues the flow

### Requirement: Parsing Error Handling

The system MUST handle parsing failures gracefully. If parsing fails completely, the system SHALL fall back to manual question flow without losing the uploaded file context.

#### Scenario: Complete parsing failure

- GIVEN file parsing fails (e.g., corrupted file, unreadable format)
- WHEN the error is caught
- THEN the system displays: "Could not read this file. Let's gather your preferences manually."
- AND the system initiates the standard question flow
- AND the system retains knowledge that user attempted file upload

#### Scenario: OpenAI extraction timeout

- GIVEN OpenAI extraction takes longer than 30 seconds
- WHEN the timeout is reached
- THEN the system displays: "Taking longer than expected to read your file. You can continue with manual questions."
- AND the system offers to continue with manual questions
- AND the system continues background parsing asynchronously

## Acceptance Criteria

1. File upload accepts PDF, TXT, JSON up to 5MB
2. Invalid file types rejected with clear error message
3. Text extraction works for text-based PDFs, TXT, and JSON
4. Image-based PDFs detected and rejected with helpful message
5. OpenAI extraction identifies dietary fields from unstructured text
6. Extracted data displayed for user confirmation before use
7. Partial extraction triggers targeted follow-up questions
8. Parsing failures fall back to manual question flow

## Validation Rules

| Validation | Rule |
|------------|------|
| File type | MUST be `.pdf`, `.txt`, or `.json` (case-insensitive) |
| File size | MUST be ≤ 5MB |
| JSON structure | If JSON, MUST be valid JSON; invalid JSON shows parse error |
| PDF text content | PDF MUST contain extractable text; image-only PDFs rejected |
| Extracted calorie goal | If extracted, MUST be between 1000 and 4000; out-of-range values flagged for confirmation |
| Dietary restrictions | If extracted, MUST map to supported restriction types; unknown types flagged for clarification |
