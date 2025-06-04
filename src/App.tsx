import React, { useState, useEffect } from 'react';
import './App.css';
import ProcessGroupSelector from './components/ProcessGroupSelector/ProcessGroupSelector';
import KnowledgeAreaSelector from './components/KnowledgeAreaSelector/KnowledgeAreaSelector';
import ToolSelector from './components/ToolSelector/ToolSelector';
import AnswerOptions from './components/AnswerOptions/AnswerOptions';
import ProcessGroupScores from './components/ProcessGroupScores';
import EditResponseDialog from './components/EditResponseDialog/EditResponseDialog';
import { QAResponseIndividual } from './types';
import { QuestionManager, QuestionManagerState } from './utils/questionManager';
import { retrieveRecordsFromFile, saveResponseToFile } from './utils/questionService';
import DebugDialog from './components/DebugDialog/DebugDialog';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: React.ErrorInfo) {
    // Log error to console but don't store it
    console.error('Error caught by boundary');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function App() {
  // State for filters
  const [selectedProcessGroup, setSelectedProcessGroup] = useState<string>('all');
  const [selectedKnowledgeArea, setSelectedKnowledgeArea] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<string>('all');

  // State for UI
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [userRole] = useState<string>('Admin'); // Default to Admin role

  // State for current question
  const [currentQuestion, setCurrentQuestion] = useState<QAResponseIndividual | null>(null);
  const [currentOptions, setCurrentOptions] = useState<{
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
  }>({
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: ''
  });
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Question manager state
  const [managerState, setManagerState] = useState<QuestionManagerState>({
    questionsData: [],
    responseArray: [],
    currentIndex: 0,
    isLoading: false,
    error: null,
    filterKey: 'all:all:all'
  });

  // Question Manager instance
  const [questionManager] = useState(() => new QuestionManager({
    onStateChange: (state) => {
      setManagerState(state);
      const currentQ = state.responseArray[state.currentIndex];
      setCurrentQuestion(currentQ || null);
      if (currentQ) {
        setCurrentOptions({
          optionA: currentQ.OPTION_A || '',
          optionB: currentQ.OPTION_B || '',
          optionC: currentQ.OPTION_C || '',
          optionD: currentQ.OPTION_D || ''
        });
      }
      setSelectedOption('');
      setIsSubmitting(false);
      setError(state.error);
      setIsLoading(state.isLoading);
    },
    retrieveQuestions: async ({ count }: { count: number }): Promise<QAResponseIndividual[]> => {
      try {
        setIsLoading(true);
        const questions = await retrieveRecordsFromFile({
          processGroup: selectedProcessGroup,
          knowledgeArea: selectedKnowledgeArea,
          tool: selectedTool,
          count
        });
        setIsLoading(false);
        return questions || [];
      } catch {
        setIsLoading(false);
        setError('Failed to load questions');
        return [];
      }
    }
  }));

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      questionManager.cleanup();
    };
  }, [questionManager]);

  // Load initial questions when filters change
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        await questionManager.loadInitialQuestions(
          selectedProcessGroup,
          selectedKnowledgeArea,
          selectedTool
        );
      } catch (err) {
        console.error('Failed to load initial questions:', err);
        setError(err instanceof Error ? err.message : String(err));
      }
    };

    loadQuestions();
  }, [selectedProcessGroup, selectedKnowledgeArea, selectedTool, questionManager]);

  // Filter change handlers
  const handleToolChange = (newTool: string) => {
    setSelectedTool(newTool);
    if (newTool !== 'all') {
      setSelectedProcessGroup('all');
      setSelectedKnowledgeArea('all');
    }
  };

  const handleProcessGroupChange = (newProcessGroup: string) => {
    setSelectedProcessGroup(newProcessGroup);
    if (newProcessGroup !== 'all') {
      setSelectedTool('all');
    }
  };

  const handleKnowledgeAreaChange = (newKnowledgeArea: string) => {
    setSelectedKnowledgeArea(newKnowledgeArea);
    if (newKnowledgeArea !== 'all') {
      setSelectedTool('all');
    }
  };

  // Question navigation and submission handlers
  const handleSubmit = () => {
    if (!selectedOption) {
      setError('Please select an option');
      return;
    }

    questionManager.submitAnswer(selectedOption);
  };

  const handlePrevious = () => {
    questionManager.moveToPreviousQuestion();
  };

  const handleNext = async () => {
    try {
      await questionManager.moveToNextQuestion();
    } catch (error) {
      console.error('Failed to move to next question:', error);
    }
  };

  // Calculate process group scores
  const calculateProcessGroupScores = () => {
    const processGroups = ['Initiating', 'Planning', 'Executing', 'Monitoring and Controlling', 'Closing'];
    return processGroups.map(group => {
      const groupQuestions = managerState.responseArray.filter(q => q.process_group === group);
      const attemptedQuestions = groupQuestions.filter(q => q.is_attempted);
      const correctAnswers = attemptedQuestions.filter(q => q.did_user_get_it_right === true).length;
      return {
        processGroup: group,
        correctAnswers,
        totalQuestions: attemptedQuestions.length
      };
    });
  };

  // Handle retrieve and save
  const handleRetrieve = () => {
    setShowEditDialog(true);
  };

  const handleSaveResponse = async (updatedResponse: QAResponseIndividual) => {
    try {
      // Update in-memory state
      const updatedArray = managerState.responseArray.map(response => 
        response.id === updatedResponse.id ? updatedResponse : response
      );
      
      // Update the question manager state
      setManagerState(prev => ({
        ...prev,
        responseArray: updatedArray
      }));

      // Save to file
      await saveResponseToFile(updatedResponse);

      // Update current question if it's the one being edited
      if (currentQuestion?.id === updatedResponse.id) {
        setCurrentQuestion(updatedResponse);
        setCurrentOptions({
          optionA: updatedResponse.OPTION_A,
          optionB: updatedResponse.OPTION_B,
          optionC: updatedResponse.OPTION_C,
          optionD: updatedResponse.OPTION_D
        });
      }
    } catch (error) {
      console.error('Failed to save response:', error);
      throw error;
    }
  };

  const [showDebugDialog, setShowDebugDialog] = useState<boolean>(false);

  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please refresh the page.</div>}>
      <div className="App">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {!(managerState.isLoading && managerState.responseArray.length === 0) && (
            <header className="app-header">
              <div className="header-content">
                <h1>PMP Questions</h1>
              </div>
            </header>
          )}
          {managerState.isLoading && managerState.responseArray.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 80, fontSize: 24 }}>
              <div className="spinner" />
              <div style={{marginTop: 24}}>
                Bear with us. We are loading your PMP Questions..
              </div>
            </div>
          ) : (
            <>
              <div className="main-content">
                <div className="content-container">
                  <div className="filter-container">
                    <ProcessGroupSelector
                      value={selectedProcessGroup}
                      onChange={setSelectedProcessGroup}
                      onValueChange={handleProcessGroupChange}
                    />
                    <KnowledgeAreaSelector
                      value={selectedKnowledgeArea}
                      onChange={setSelectedKnowledgeArea}
                      onValueChange={handleKnowledgeAreaChange}
                    />
                    <ToolSelector
                      value={selectedTool}
                      onChange={setSelectedTool}
                      onToolChange={handleToolChange}
                      selectedProcessGroup={selectedProcessGroup}
                      selectedKnowledgeArea={selectedKnowledgeArea}
                    />
                  </div>
                  <div className="question-container">
                    <div className="question-label">
                      Question {managerState.currentIndex + 1}
                    </div>
                    {managerState.error && (
                      <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                        {managerState.error}
                      </div>
                    )}
                    <textarea
                      className="question-area"
                      value={currentQuestion?.question_pmp || ''}
                      readOnly
                      placeholder={isLoading ? "Loading..." : "PMP Question"}
                    />
                  </div>
                  <AnswerOptions
                    options={currentOptions}
                    selectedOption={selectedOption}
                    onOptionChange={setSelectedOption}
                    isAnswerSubmitted={isSubmitting}
                    isCorrect={currentQuestion?.did_user_get_it_right === true}
                    onSubmit={handleSubmit}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    isFirstQuestion={managerState.currentIndex === 0}
                    isLastQuestion={managerState.currentIndex === managerState.responseArray.length - 1}
                    responseArray={managerState.responseArray}
                    currentIndex={managerState.currentIndex}
                    onRetrieve={handleRetrieve}
                  />
                </div>
                <div className="process-scores-container">
                  <h3>Process Group Scores</h3>
                  <ProcessGroupScores 
                    scores={calculateProcessGroupScores()} 
                    totalAttempted={managerState.responseArray.filter(q => q.is_attempted).length}
                  />
                  <button 
                    className="debug-button"
                    onClick={() => setShowDebugDialog(true)}
                    style={{
                      marginTop: '20px',
                      padding: '8px 16px',
                      backgroundColor: '#f0f0f0',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%',
                      fontSize: '14px'
                    }}
                  >
                    Show Debug Information
                  </button>
                </div>
              </div>
            </>
          )}

          {showEditDialog && currentQuestion && (
            <EditResponseDialog
              isOpen={showEditDialog}
              onClose={() => setShowEditDialog(false)}
              currentResponse={currentQuestion}
              onSave={handleSaveResponse}
              userRole={userRole}
            />
          )}

          <DebugDialog
            isOpen={showDebugDialog}
            onClose={() => setShowDebugDialog(false)}
            questionsData={managerState.questionsData}
            responseArray={managerState.responseArray}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
