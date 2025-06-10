import React, { useState, useEffect } from 'react';
import './App.css';
import ProcessGroupSelector from './components/ProcessGroupSelector/ProcessGroupSelector';
import KnowledgeAreaSelector from './components/KnowledgeAreaSelector/KnowledgeAreaSelector';
import ToolSelector from './components/ToolSelector/ToolSelector';
import AnswerOptions from './components/AnswerOptions/AnswerOptions';
import ProcessGroupScores from './components/ProcessGroupScores';
import EditResponseDialog from './components/EditResponseDialog/EditResponseDialog';
import RetrieveQuestionDialog from './components/RetrieveQuestionDialog/RetrieveQuestionDialog';
import { QAResponseIndividual } from './types/index';
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showEditDialog, setShowEditDialog] = useState<boolean>(false);
  const [showRetrieveDialog, setShowRetrieveDialog] = useState<boolean>(false);
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
          optionA: currentQ.options_pmp.OPTION_A || '',
          optionB: currentQ.options_pmp.OPTION_B || '',
          optionC: currentQ.options_pmp.OPTION_C || '',
          optionD: currentQ.options_pmp.OPTION_D || ''
        });
      }
      setSelectedOption('');
      setIsSubmitting(false);
      setIsLoading(state.isLoading);
    },
    retrieveQuestions: async ({ count, processGroup, knowledgeArea, tool }: { 
      count: number;
      processGroup: string;
      knowledgeArea: string;
      tool: string;
    }): Promise<QAResponseIndividual[]> => {
      try {
        setIsLoading(true);
        const questions = await retrieveRecordsFromFile({
          processGroup,
          knowledgeArea,
          tool,
          count
        });
        setIsLoading(false);
        return questions || [];
      } catch {
        setIsLoading(false);
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
      const groupQuestions = managerState.responseArray.filter(q => q.analysis.process_group === group);
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
    console.log('=== Save Changes Flow Started ===');
    console.log('Updated Response:', {
      id: updatedResponse.id,
      question_pmp: updatedResponse.question_pmp?.substring(0, 50) + '...',
      is_valid: updatedResponse.is_valid,
      process_group: updatedResponse.analysis?.process_group,
      knowledge_area: updatedResponse.analysis?.knowledge_area,
      tool: updatedResponse.analysis?.tool,
      additional_notes: updatedResponse.analysis?.additional_notes
    });
    
    try {
      console.log('Setting isSubmitting to true');
      setIsSubmitting(true);
      
      console.log('Step 1: Updating QuestionManager internal state');
      // Update the QuestionManager's internal state FIRST
      questionManager.updateQuestionInState(updatedResponse);
      console.log('✅ QuestionManager state updated');
      
      console.log('Step 2: Updating current question and options');
      // Update the current question and options
      setCurrentQuestion(updatedResponse);
      setCurrentOptions({
        optionA: updatedResponse.options_pmp.OPTION_A,
        optionB: updatedResponse.options_pmp.OPTION_B,
        optionC: updatedResponse.options_pmp.OPTION_C,
        optionD: updatedResponse.options_pmp.OPTION_D
      });
      console.log('✅ Current question and options updated');

      console.log('Step 3: Checking if filters need updating');
      // Update filters if they've changed
      if (updatedResponse.analysis.process_group !== selectedProcessGroup ||
          updatedResponse.analysis.knowledge_area !== selectedKnowledgeArea ||
          updatedResponse.analysis.tool !== selectedTool) {
        console.log('Filters changed, updating...');
        setSelectedProcessGroup(updatedResponse.analysis.process_group);
        setSelectedKnowledgeArea(updatedResponse.analysis.knowledge_area);
        setSelectedTool(updatedResponse.analysis.tool);
        console.log('✅ Filters updated');
      } else {
        console.log('No filter changes needed');
      }
      
      console.log('Step 4: Closing dialog');
      // Close the dialog
      setShowEditDialog(false);
      console.log('✅ Dialog closed');
      
      console.log('Step 5: Calling saveResponseToFile service');
      // Call the service AFTER updating in-memory structures
      await saveResponseToFile(updatedResponse);
      console.log('✅ saveResponseToFile service call completed successfully');
      
      console.log('=== Save Changes Flow Completed Successfully ===');
      
    } catch (error) {
      console.error('❌ Error in handleSaveResponse:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      // If the service call fails, we might want to revert the in-memory changes
      // For now, we'll keep the optimistic update
    } finally {
      console.log('Setting isSubmitting to false');
      setIsSubmitting(false);
      console.log('=== Save Changes Flow Ended ===');
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
                    className="retrieve-question-button"
                    onClick={() => setShowRetrieveDialog(true)}
                    style={{
                      marginTop: '20px',
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      border: '1px solid #0056b3',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%',
                      fontSize: '14px',
                      color: 'white'
                    }}
                  >
                    Retrieve A Question
                  </button>
                  <button 
                    className="debug-button"
                    onClick={() => setShowDebugDialog(true)}
                    style={{
                      marginTop: '12px',
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

          <RetrieveQuestionDialog
            isOpen={showRetrieveDialog}
            onClose={() => setShowRetrieveDialog(false)}
          />

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
