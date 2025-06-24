# Question Validity Toggle Feature

## Overview
A new UI component has been added to allow users to toggle the validity status of questions. This feature is positioned below the Process Group Scores display and provides an intuitive way to mark questions as valid or invalid.

## Features

### QuestionValidityToggle Component
- **Location**: `src/components/QuestionValidityToggle/QuestionValidityToggle.tsx`
- **Purpose**: Provides a visual toggle for the `is_valid` field of the current question
- **Positioning**: Displayed below the Process Group Scores in the right sidebar

### Key Features
1. **Visual Toggle**: Material-UI Switch component with clear visual indicators
2. **Color Coding**: 
   - Green theme for valid questions
   - Red theme for invalid questions
3. **Real-time Updates**: Changes are immediately reflected in the UI
4. **Service Integration**: Automatically calls the `saveResponseToFile` service to persist changes
5. **Question ID Display**: Shows the current question ID for reference
6. **Disabled State**: Toggle is disabled when no question is loaded

### Technical Implementation

#### Component Props
```typescript
interface QuestionValidityToggleProps {
  isValid: boolean;                    // Current validity state
  onValidityChange: (isValid: boolean) => void;  // Callback for changes
  questionId?: string;                 // Optional question ID for display
  disabled?: boolean;                  // Whether toggle is disabled
}
```

#### Integration Points
1. **App.tsx**: 
   - Import and render the component
   - Handle validity changes via `handleValidityToggle` function
   - Update both in-memory state and service

2. **QuestionManager**: 
   - Updates internal state when validity changes
   - Maintains consistency across the application

3. **QuestionService**: 
   - `saveResponseToFile` function handles persistence
   - Includes `is_valid` field in service calls

### User Experience
- **Intuitive Design**: Clear visual distinction between valid/invalid states
- **Immediate Feedback**: Changes are visible instantly
- **Persistent Storage**: Changes are saved to the backend service
- **Error Handling**: Graceful handling of service failures with optimistic updates

### Styling
- Uses Material-UI components for consistent design
- Responsive design that works on different screen sizes
- Hover effects and smooth transitions
- Color-coded states for easy identification

## Usage
1. Navigate to any question in the application
2. Look for the "Question Validity" section below the Process Group Scores
3. Toggle the switch to change the validity status
4. The change is automatically saved to the service
5. Visual feedback confirms the current state

## Technical Notes
- The component uses Material-UI's Switch component for the toggle
- Changes are handled asynchronously with proper error handling
- The feature integrates seamlessly with existing question management flow
- All changes are logged for debugging purposes 