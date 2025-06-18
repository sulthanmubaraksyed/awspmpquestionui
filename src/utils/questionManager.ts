import { QAResponseIndividual } from '../types';

export interface QuestionManagerState {
  questionsData: QAResponseIndividual[];
  responseArray: QAResponseIndividual[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  filterKey: string;
}

export interface QuestionManagerConfig {
  onStateChange: (state: QuestionManagerState) => void;
  retrieveQuestions: (params: {
    count: number;
    processGroup: string;
    knowledgeArea: string;
    tool: string;
  }) => Promise<QAResponseIndividual[]>;
}

export class QuestionManager {
  private state: QuestionManagerState;
  private config: QuestionManagerConfig;

  constructor(config: QuestionManagerConfig) {
    console.log('🏗️ QUESTION MANAGER: Constructor called');
    this.config = config;
    this.state = {
      questionsData: [],
      responseArray: [],
      currentIndex: 0,
      isLoading: false,
      error: null,
      filterKey: 'all:all:all'
    };
    console.log('🏗️ QUESTION MANAGER: Initialized with state:', this.state);
  }

  private updateState(newState: Partial<QuestionManagerState>) {
    this.state = { ...this.state, ...newState };
    this.config.onStateChange(this.state);
  }

  async loadInitialQuestions(
    processGroup: string,
    knowledgeArea: string,
    tool: string
  ): Promise<void> {
    console.log('🚀 QUESTION MANAGER: loadInitialQuestions called with:', {
      processGroup,
      knowledgeArea,
      tool
    });
    
    const filterKey = `${processGroup}:${knowledgeArea}:${tool}`;
    
    this.updateState({
      isLoading: true,
      error: null,
      filterKey
    });

    try {
      console.log('📡 QUESTION MANAGER: Calling retrieveQuestions with count: 250');
      const questions = await this.config.retrieveQuestions({
        count: 250,
        processGroup,
        knowledgeArea,
        tool
      });

      console.log('📥 QUESTION MANAGER: Received', questions.length, 'questions from service');

      const responseArray = questions.map(q => ({
        ...q,
        is_attempted: false,
        selected_option: '',
        did_user_get_it_right: undefined
      }));

      this.updateState({
        questionsData: questions,
        responseArray,
        currentIndex: 0,
        isLoading: false
      });
      
      console.log('✅ QUESTION MANAGER: Successfully loaded', responseArray.length, 'questions');
    } catch (error) {
      console.error('❌ QUESTION MANAGER ERROR:', error);
      this.updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  submitAnswer(selectedOption: string): void {
    if (this.state.currentIndex >= this.state.responseArray.length) {
      return;
    }

    const currentQuestion = this.state.responseArray[this.state.currentIndex];
    if (!currentQuestion || currentQuestion.is_attempted) {
      return;
    }

    const correctOption = this.getCorrectOption(currentQuestion);
    const didUserGetItRight = selectedOption === correctOption;

    const updatedResponseArray = [...this.state.responseArray];
    updatedResponseArray[this.state.currentIndex] = {
      ...currentQuestion,
      is_attempted: true,
      selected_option: selectedOption,
      did_user_get_it_right: didUserGetItRight
    };

    this.updateState({
      responseArray: updatedResponseArray
    });
  }

  moveToPreviousQuestion(): void {
    if (this.state.currentIndex > 0) {
      this.updateState({
        currentIndex: this.state.currentIndex - 1
      });
    }
  }

  async moveToNextQuestion(): Promise<void> {
    if (this.state.currentIndex < this.state.responseArray.length - 1) {
      this.updateState({
        currentIndex: this.state.currentIndex + 1
      });
    } else {
      // Load more questions if we're at the end
      const filterParts = this.state.filterKey.split(':');
      await this.loadInitialQuestions(filterParts[0], filterParts[1], filterParts[2]);
    }
  }

  updateQuestionInState(updatedQuestion: QAResponseIndividual): void {
    const updatedResponseArray = [...this.state.responseArray];
    const questionIndex = updatedResponseArray.findIndex(q => q.id === updatedQuestion.id);
    
    if (questionIndex !== -1) {
      updatedResponseArray[questionIndex] = updatedQuestion;
      this.updateState({
        responseArray: updatedResponseArray
      });
    }
  }

  private getCorrectOption(question: QAResponseIndividual): string {
    const { analysis } = question;
    if (analysis.option_a_result.startsWith('CORRECT')) return 'A';
    if (analysis.option_b_result.startsWith('CORRECT')) return 'B';
    if (analysis.option_c_result.startsWith('CORRECT')) return 'C';
    if (analysis.option_d_result.startsWith('CORRECT')) return 'D';
    return 'A'; // Default fallback
  }

  cleanup(): void {
    // Cleanup logic if needed
  }
} 