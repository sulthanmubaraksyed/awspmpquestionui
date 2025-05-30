import { QAResponseIndividual } from './questionService';

// Constants
const INITIAL_LOAD_COUNT = 100;
const RESPONSE_ARRAY_SIZE = 3;
const MIN_QUESTIONS_THRESHOLD = 3;
const MAX_QUESTIONS_DATA_SIZE = 500; // Maximum number of questions to keep in memory

// Interfaces
export interface QuestionManagerState {
  questionsData: QAResponseIndividual[];
  responseArray: QAResponseIndividual[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  filterKey: string; // Track current filter combination
}

export interface QuestionManagerActions {
  onStateChange: (state: QuestionManagerState) => void;
  retrieveQuestions: (params: { count: number }) => Promise<QAResponseIndividual[]>;
}

// Helper functions
function validateQuestion(question: QAResponseIndividual): boolean {
  if (!question.id || !question.question_pmp) return false;
  
  if (question.question_type === "Option") {
    return !!(question.option_a_result && question.option_b_result && 
              question.option_c_result && question.option_d_result &&
              question.OPTION_A && question.OPTION_B &&
              question.OPTION_C && question.OPTION_D);
  }
  return true;
}

function getRandomQuestions(questions: QAResponseIndividual[], count: number): QAResponseIndividual[] {
  if (questions.length <= count) return [...questions];
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getUnattemptedQuestions(questions: QAResponseIndividual[]): QAResponseIndividual[] {
  return questions.filter(q => !q.is_attempted);
}

function generateFilterKey(processGroup: string, knowledgeArea: string, tool: string): string {
  return `${processGroup}:${knowledgeArea}:${tool}`;
}

// Question Manager class
export class QuestionManager {
  private state: QuestionManagerState;
  private actions: QuestionManagerActions;
  private questionIds: Set<string>; // Track unique question IDs

  constructor(actions: QuestionManagerActions) {
    this.state = {
      questionsData: [],
      responseArray: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      filterKey: 'all:all:all'
    };
    this.actions = actions;
    this.questionIds = new Set();
  }

  private updateState(newState: Partial<QuestionManagerState>) {
    this.state = { ...this.state, ...newState };
    this.actions.onStateChange(this.state);
  }

  private cleanupOldQuestions() {
    // Keep only the most recent questions up to MAX_QUESTIONS_DATA_SIZE
    if (this.state.questionsData.length > MAX_QUESTIONS_DATA_SIZE) {
      const recentQuestions = this.state.questionsData.slice(-MAX_QUESTIONS_DATA_SIZE);
      this.state.questionsData = recentQuestions;
      // Update questionIds set
      this.questionIds = new Set(recentQuestions.map(q => q.id));
    }
  }

  private validateAndDeduplicateQuestions(questions: QAResponseIndividual[]): QAResponseIndividual[] {
    const validQuestions: QAResponseIndividual[] = [];
    const seenIds = new Set<string>();

    for (const question of questions) {
      if (!validateQuestion(question)) {
        console.warn(`Invalid question skipped: ${question.id}`);
        continue;
      }

      if (seenIds.has(question.id)) {
        console.warn(`Duplicate question skipped: ${question.id}`);
        continue;
      }

      seenIds.add(question.id);
      validQuestions.push(question);
    }

    return validQuestions;
  }

  async loadInitialQuestions(processGroup: string, knowledgeArea: string, tool: string): Promise<void> {
    const newFilterKey = generateFilterKey(processGroup, knowledgeArea, tool);
    
    // If filters haven't changed and we have questions, don't reload
    if (newFilterKey === this.state.filterKey && this.state.questionsData.length > 0) {
      return;
    }

    this.updateState({ 
      isLoading: true, 
      error: null,
      filterKey: newFilterKey,
      questionsData: [],
      responseArray: [],
      currentIndex: 0
    });
    this.questionIds.clear();

    try {
      // Load initial questions directly using retrieveQuestions
      const questions = await this.actions.retrieveQuestions({ count: INITIAL_LOAD_COUNT });
      const validQuestions = this.validateAndDeduplicateQuestions(questions);
      
      if (validQuestions.length === 0) {
        throw new Error('No valid questions found');
      }

      // Update questionIds set
      validQuestions.forEach(q => this.questionIds.add(q.id));

      // Update state with all questions in questionsData and first 3 in responseArray
      this.updateState({
        questionsData: validQuestions,
        responseArray: validQuestions.slice(0, RESPONSE_ARRAY_SIZE), // Take first 3 questions
        currentIndex: 0,
        isLoading: false
      });
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to load questions',
        isLoading: false
      });
    }
  }

  async loadMoreQuestions(): Promise<void> {
    if (this.state.isLoading) return;

    const unattemptedCount = getUnattemptedQuestions(this.state.responseArray).length;
    if (unattemptedCount >= MIN_QUESTIONS_THRESHOLD) return;

    this.updateState({ isLoading: true, error: null });
    try {
      const questions = await this.actions.retrieveQuestions({ count: INITIAL_LOAD_COUNT });
      const validQuestions = this.validateAndDeduplicateQuestions(questions);
      
      if (validQuestions.length === 0) {
        throw new Error('No valid questions found');
      }

      // Filter out questions that are already in our sets
      const newQuestions = validQuestions.filter(q => !this.questionIds.has(q.id));
      
      // Add new question IDs to our set
      newQuestions.forEach(q => this.questionIds.add(q.id));

      // Update questionsData with new questions and cleanup if needed
      const updatedQuestionsData = [...this.state.questionsData, ...newQuestions];
      this.updateState({
        questionsData: updatedQuestionsData,
        responseArray: [...this.state.responseArray, ...getRandomQuestions(newQuestions, RESPONSE_ARRAY_SIZE)],
        isLoading: false
      });

      this.cleanupOldQuestions();
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to load more questions',
        isLoading: false
      });
    }
  }

  moveToPreviousQuestion(): void {
    if (this.state.currentIndex > 0) {
      this.updateState({ currentIndex: this.state.currentIndex - 1 });
    }
  }

  async moveToNextQuestion(): Promise<void> {
    if (this.state.currentIndex < this.state.responseArray.length - 1) {
      this.updateState({ currentIndex: this.state.currentIndex + 1 });
    }

    // Check if we need to load more questions
    const unattemptedCount = getUnattemptedQuestions(this.state.responseArray).length;
    if (unattemptedCount < MIN_QUESTIONS_THRESHOLD) {
      await this.loadMoreQuestions();
    }
  }

  submitAnswer(selectedOption: string): void {
    if (!selectedOption) {
      this.updateState({ error: 'Please select an option' });
      return;
    }

    const currentQuestion = this.state.responseArray[this.state.currentIndex];
    if (!currentQuestion) return;

    // Update the current question's state
    const updatedQuestion = {
      ...currentQuestion,
      is_attempted: true,
      selected_option: selectedOption,
      whatuserselected: (() => {
        switch (selectedOption) {
          case 'A': return currentQuestion.option_a_result;
          case 'B': return currentQuestion.option_b_result;
          case 'C': return currentQuestion.option_c_result;
          case 'D': return currentQuestion.option_d_result;
          default: return '';
        }
      })(),
      did_user_get_it_right: (() => {
        const result = (() => {
          switch (selectedOption) {
            case 'A': return currentQuestion.option_a_result;
            case 'B': return currentQuestion.option_b_result;
            case 'C': return currentQuestion.option_c_result;
            case 'D': return currentQuestion.option_d_result;
            default: return '';
          }
        })();
        return result.trim().startsWith('CORRECT');
      })()
    };

    const updatedResponseArray = [...this.state.responseArray];
    updatedResponseArray[this.state.currentIndex] = updatedQuestion;

    // Also update the question in questionsData
    const updatedQuestionsData = this.state.questionsData.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );

    this.updateState({
      responseArray: updatedResponseArray,
      questionsData: updatedQuestionsData,
      error: null
    });
  }

  getCurrentQuestion(): QAResponseIndividual | null {
    return this.state.responseArray[this.state.currentIndex] || null;
  }

  // Cleanup method to be called when component unmounts
  cleanup(): void {
    this.questionIds.clear();
    this.updateState({
      questionsData: [],
      responseArray: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      filterKey: 'all:all:all'
    });
  }
} 