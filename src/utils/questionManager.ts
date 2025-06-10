import { QAResponseIndividual } from '../types/index';

// Constants
const INITIAL_LOAD_COUNT = 100;
const RESPONSE_ARRAY_SIZE = 10;
const MIN_QUESTIONS_THRESHOLD = 10;
const MAX_QUESTIONS_DATA_SIZE = 500; // Maximum number of questions to keep in memory
const ATTEMPTED_PERCENTAGE_THRESHOLD = 0.6; // 60% threshold for loading more questions
const MIN_ATTEMPTED_COUNT = 100; // Minimum attempted count before loading more from service

// Helper function to generate filter key
function generateFilterKey(processGroup: string, knowledgeArea: string, tool: string): string {
  return `${processGroup}:${knowledgeArea}:${tool}`;
}

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
  retrieveQuestions: (params: { 
    count: number;
    processGroup: string;
    knowledgeArea: string;
    tool: string;
  }) => Promise<QAResponseIndividual[]>;
}

// Helper functions
function validateQuestion(question: QAResponseIndividual): boolean {
  console.log('=== Validating Question ===');
  console.log('Question ID:', question.id);
  console.log('Has question_pmp:', !!question.question_pmp);
  console.log('Question type:', question.question_type);
  console.log('Has analysis:', !!question.analysis);
  console.log('Has options_pmp:', !!question.options_pmp);
  
  if (!question.id || !question.question_pmp) {
    console.log('Validation failed: Missing id or question_pmp');
    return false;
  }
  
  if (question.question_type === "Option") {
    console.log('Checking Option type question...');
    console.log('Analysis object:', question.analysis);
    
    if (!question.analysis) {
      console.log('Validation failed: Missing analysis object');
      return false;
    }
    
    if (!question.options_pmp) {
      console.log('Validation failed: Missing options_pmp object');
      return false;
    }
    
    const hasAnalysisResults = !!(question.analysis.option_a_result && 
                                 question.analysis.option_b_result && 
                                 question.analysis.option_c_result && 
                                 question.analysis.option_d_result);
    
    const hasOptions = !!(question.options_pmp.OPTION_A && 
                         question.options_pmp.OPTION_B &&
                         question.options_pmp.OPTION_C && 
                         question.options_pmp.OPTION_D);
    
    console.log('Has analysis results:', hasAnalysisResults);
    console.log('Has options:', hasOptions);
    console.log('Analysis results:', {
      option_a_result: !!question.analysis.option_a_result,
      option_b_result: !!question.analysis.option_b_result,
      option_c_result: !!question.analysis.option_c_result,
      option_d_result: !!question.analysis.option_d_result
    });
    console.log('Options:', {
      OPTION_A: !!question.options_pmp.OPTION_A,
      OPTION_B: !!question.options_pmp.OPTION_B,
      OPTION_C: !!question.options_pmp.OPTION_C,
      OPTION_D: !!question.options_pmp.OPTION_D
    });
    
    const isValid = hasAnalysisResults && hasOptions;
    console.log('Question validation result:', isValid);
    return isValid;
  }
  
  console.log('Question validation result: true (non-Option type)');
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
    console.log('=== updateState Method Called ===');
    console.log('New state:', newState);
    this.state = { ...this.state, ...newState };
    console.log('State updated, calling onStateChange...');
    this.actions.onStateChange(this.state);
    console.log('✅ updateState completed');
    console.log('=== updateState Method Ended ===');
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
    
    console.log('=== Loading Initial Questions ===');
    console.log('Filter Key:', newFilterKey);
    console.log('Initial Load Count:', INITIAL_LOAD_COUNT);
    
    // If filters haven't changed and we have questions, don't reload
    if (newFilterKey === this.state.filterKey && this.state.questionsData.length > 0) {
      console.log('Filters unchanged, skipping reload');
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
      console.log('Calling retrieveQuestions with count:', INITIAL_LOAD_COUNT);
      const questions = await this.actions.retrieveQuestions({ count: INITIAL_LOAD_COUNT, processGroup, knowledgeArea, tool });
      console.log('Retrieved questions count:', questions.length);
      
      const validQuestions = this.validateAndDeduplicateQuestions(questions);
      console.log('Valid questions count:', validQuestions.length);
      
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
      
      console.log('Initial load completed successfully');
    } catch (error) {
      console.log('Initial load failed:', error);
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to load questions',
        isLoading: false
      });
    }
  }

  async loadMoreQuestions(): Promise<void> {
    if (this.state.isLoading) return;

    // Check if we have enough attempted questions before loading more
    const totalAttemptedCount = this.state.questionsData.filter(q => q.is_attempted).length;
    console.log('=== Load More Questions Check ===');
    console.log('Total attempted count:', totalAttemptedCount);
    console.log('Minimum threshold:', MIN_ATTEMPTED_COUNT);
    
    if (totalAttemptedCount >= MIN_ATTEMPTED_COUNT) {
      console.log('Sufficient attempted questions, skipping load from service');
      return;
    }

    const unattemptedCount = getUnattemptedQuestions(this.state.responseArray).length;
    if (unattemptedCount >= MIN_QUESTIONS_THRESHOLD) {
      console.log('Sufficient unattempted questions in response array, skipping load from service');
      return;
    }

    console.log('Loading more questions from service');
    this.updateState({ isLoading: true, error: null });
    try {
      // Extract current filter values from filterKey
      const [processGroup, knowledgeArea, tool] = this.state.filterKey.split(':');
      const questions = await this.actions.retrieveQuestions({ 
        count: INITIAL_LOAD_COUNT, 
        processGroup, 
        knowledgeArea, 
        tool 
      });
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

    // Check if we need to load more questions to response array
    const attemptedCount = this.state.responseArray.filter(q => q.is_attempted).length;
    const totalCount = this.state.responseArray.length;
    const attemptedPercentage = totalCount > 0 ? attemptedCount / totalCount : 0;
    
    console.log('=== Next Button Check ===');
    console.log('Attempted count:', attemptedCount);
    console.log('Total count:', totalCount);
    console.log('Attempted percentage:', attemptedPercentage);
    console.log('Threshold:', ATTEMPTED_PERCENTAGE_THRESHOLD);
    
    // If attempted percentage is less than 60%, load more questions to response array
    if (attemptedPercentage < ATTEMPTED_PERCENTAGE_THRESHOLD) {
      console.log('Attempted percentage below threshold, loading more questions to response array');
      await this.loadMoreQuestionsToResponseArray();
    }
    
    // Also check if we need to load more questions from service (when attempted count < 100)
    if (attemptedCount < MIN_ATTEMPTED_COUNT) {
      console.log('Attempted count below threshold, checking if we need to load from service');
      await this.loadMoreQuestions();
    }
  }

  async loadMoreQuestionsToResponseArray(): Promise<void> {
    console.log('=== Loading More Questions to Response Array ===');
    
    // Get unattempted questions from questionsData that are not in responseArray
    const responseArrayIds = new Set(this.state.responseArray.map(q => q.id));
    const availableQuestions = this.state.questionsData.filter(q => 
      !responseArrayIds.has(q.id) && !q.is_attempted
    );
    
    console.log('Available questions from questionsData:', availableQuestions.length);
    
    if (availableQuestions.length > 0) {
      // Add more questions to response array
      const questionsToAdd = getRandomQuestions(availableQuestions, RESPONSE_ARRAY_SIZE);
      console.log('Adding questions to response array:', questionsToAdd.length);
      
      this.updateState({
        responseArray: [...this.state.responseArray, ...questionsToAdd]
      });
    } else {
      console.log('No more questions available in questionsData, will load from service');
      // If no questions available in questionsData, load from service
      await this.loadMoreQuestions();
    }
  }

  submitAnswer(selectedOption: string): void {
    const currentQuestion = this.state.responseArray[this.state.currentIndex];
    if (!currentQuestion) return;

    // Update the current question with the selected answer
    const updatedQuestion: QAResponseIndividual = {
      ...currentQuestion,
      is_attempted: true,
      selected_option: selectedOption,
      did_user_get_it_right: this.isAnswerCorrect(selectedOption, currentQuestion)
    };

    // Update both questionsData and responseArray
    const updatedQuestionsData = this.state.questionsData.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );
    
    const updatedResponseArray = this.state.responseArray.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    );

    this.updateState({
      questionsData: updatedQuestionsData,
      responseArray: updatedResponseArray
    });
  }

  updateQuestionInState(updatedQuestion: QAResponseIndividual): void {
    console.log('=== updateQuestionInState Method Called ===');
    console.log('Updated Question:', {
      id: updatedQuestion.id,
      question_pmp: updatedQuestion.question_pmp?.substring(0, 50) + '...',
      is_valid: updatedQuestion.is_valid,
      process_group: updatedQuestion.analysis?.process_group,
      knowledge_area: updatedQuestion.analysis?.knowledge_area,
      tool: updatedQuestion.analysis?.tool
    });
    
    console.log('Current state before update:');
    console.log('questionsData length:', this.state.questionsData.length);
    console.log('responseArray length:', this.state.responseArray.length);
    console.log('currentIndex:', this.state.currentIndex);
    
    try {
      // Update the question in both questionsData and responseArray
      const updatedQuestionsData = this.state.questionsData.map(q => 
        q.id === updatedQuestion.id ? updatedQuestion : q
      );
      
      const updatedResponseArray = this.state.responseArray.map(q => 
        q.id === updatedQuestion.id ? updatedQuestion : q
      );

      console.log('Updated arrays:');
      console.log('updatedQuestionsData length:', updatedQuestionsData.length);
      console.log('updatedResponseArray length:', updatedResponseArray.length);

      this.updateState({
        questionsData: updatedQuestionsData,
        responseArray: updatedResponseArray
      });
      
      console.log('✅ updateQuestionInState completed successfully');
      console.log('=== updateQuestionInState Method Ended ===');
    } catch (error) {
      console.error('❌ Error in updateQuestionInState:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      console.log('=== updateQuestionInState Method Failed ===');
      throw error;
    }
  }

  private isAnswerCorrect(selectedOption: string, question: QAResponseIndividual): boolean {
    // Determine the correct answer based on the analysis
    const analysis = question.analysis;
    if (analysis.option_a_result?.startsWith('CORRECT')) return selectedOption === 'A';
    if (analysis.option_b_result?.startsWith('CORRECT')) return selectedOption === 'B';
    if (analysis.option_c_result?.startsWith('CORRECT')) return selectedOption === 'C';
    if (analysis.option_d_result?.startsWith('CORRECT')) return selectedOption === 'D';
    return false;
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