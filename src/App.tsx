import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import ProcessGroupSelector from './components/ProcessGroupSelector/ProcessGroupSelector';
import KnowledgeAreaSelector from './components/KnowledgeAreaSelector/KnowledgeAreaSelector';
import ToolSelector from './components/ToolSelector/ToolSelector';
import AnswerOptions from './components/AnswerOptions/AnswerOptions';
import ScoreDisplay from './components/ScoreDisplay';
import ProcessGroupScores from './components/ProcessGroupScores';
import DebugSummary from './components/DebugSummary/DebugSummary';
import { QAResponseIndividual } from './utils/questionService';
import { QuestionManager, QuestionManagerState } from './utils/questionManager';
import { retrieveRecordsFromFile } from './utils/questionService';

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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
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
  const [showDebugModal, setShowDebugModal] = useState<boolean>(false);
  const [showRetrievedQuestionsModal, setShowRetrievedQuestionsModal] = useState<boolean>(false);
  const [retrievedQuestions, setRetrievedQuestions] = useState<QAResponseIndividual[]>([]);
  const [isLoadingRetrieved, setIsLoadingRetrieved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    retrieveQuestions: async ({ count }) => {
      try {
        const questions = await retrieveRecordsFromFile({
          processGroup: selectedProcessGroup,
          knowledgeArea: selectedKnowledgeArea,
          tool: selectedTool,
          count
        });
        return questions;
      } catch (error) {
        console.error('Error retrieving questions:', error);
        throw error;
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
      } catch (error) {
        console.error('Failed to load initial questions:', error);
        setError(error instanceof Error ? error.message : 'Failed to load questions');
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

  // Debug and review handlers
  const handleRetrieveClick = async () => {
    setShowRetrievedQuestionsModal(true);
    setIsLoadingRetrieved(true);
    setError(null);

    try {
      const questions = await retrieveRecordsFromFile({
        processGroup: selectedProcessGroup,
        knowledgeArea: selectedKnowledgeArea,
        tool: selectedTool,
        count: 100
      });
      setRetrievedQuestions(questions);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to retrieve questions');
      setRetrievedQuestions([]);
    } finally {
      setIsLoadingRetrieved(false);
    }
  };

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

  // Render
  return (
    <ErrorBoundary fallback={<div>Something went wrong. Please refresh the page.</div>}>
    <div className="App">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {!(managerState.isLoading && managerState.responseArray.length === 0) && (
          <h1 className="header">PMP Mock Question Generator</h1>
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
            <div className="selectors-container">
              <div>
                <div className="labels-container">
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
              </div>
            </div>
              <div className="main-content">
            <div className="content-container">
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
                    onReview={() => setShowRetrievedQuestionsModal(true)}
                    onRetrieve={handleRetrieveClick}
                    onDebug={() => setShowDebugModal(true)}
                    responseArray={managerState.responseArray}
                    currentIndex={managerState.currentIndex}
            />
                </div>
                <div className="process-scores-container">
                  <h3>Process Group Scores</h3>
                  <ProcessGroupScores 
                    scores={calculateProcessGroupScores()} 
                    totalAttempted={managerState.responseArray.filter(q => q.is_attempted).length}
                  />
                </div>
              </div>

              {/* Modals */}
              {showRetrievedQuestionsModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 32,
                    minWidth: 800,
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                  boxShadow: '0 4px 32px rgba(0,0,0,0.15)'
                }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 24,
                      borderBottom: '1px solid #e0e0e0',
                      paddingBottom: 16
                    }}>
                      <h2 style={{margin: 0}}>Retrieved Questions</h2>
                      <button 
                        onClick={() => setShowRetrievedQuestionsModal(false)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          background: '#0071e3',
                          color: 'white',
                          border: 'none',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>

                    <div style={{
                      background: '#f5f5f5',
                      padding: 16,
                      borderRadius: 8,
                      marginBottom: 24
                    }}>
                      <h3 style={{margin: '0 0 12px 0'}}>Filters Applied:</h3>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12}}>
                        <div>
                          <strong>Process Group:</strong>
                          <div>{selectedProcessGroup === 'all' ? 'All Process Groups' : selectedProcessGroup}</div>
                        </div>
                        <div>
                          <strong>Knowledge Area:</strong>
                          <div>{selectedKnowledgeArea === 'all' ? 'All Knowledge Areas' : selectedKnowledgeArea}</div>
                        </div>
                        <div>
                          <strong>Tool:</strong>
                          <div>{selectedTool === 'all' ? 'All Tools' : selectedTool}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
                      {retrievedQuestions.map((q, index) => (
                        <div key={q.id} style={{
                          border: '1px solid #e0e0e0',
                          borderRadius: 8,
                          padding: 20,
                          background: '#fff'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 16,
                            paddingBottom: 12,
                            borderBottom: '1px solid #e0e0e0'
                          }}>
                            <h3 style={{margin: 0}}>Question {index + 1}</h3>
                            <div style={{fontSize: 14, color: '#666'}}>ID: {q.id}</div>
                          </div>

                          <div style={{marginBottom: 20}}>
                            <div style={{fontWeight: 500, marginBottom: 8}}>Question:</div>
                            <div style={{lineHeight: 1.5}}>{q.question_pmp}</div>
                          </div>

                          <div style={{marginBottom: 20}}>
                            <div style={{fontWeight: 500, marginBottom: 8}}>Options:</div>
                            <div style={{display: 'grid', gap: 8}}>
                              <div style={{padding: 8, background: '#f8f8f8', borderRadius: 4}}>
                                <strong>A.</strong> {q.OPTION_A}
                              </div>
                              <div style={{padding: 8, background: '#f8f8f8', borderRadius: 4}}>
                                <strong>B.</strong> {q.OPTION_B}
                              </div>
                              <div style={{padding: 8, background: '#f8f8f8', borderRadius: 4}}>
                                <strong>C.</strong> {q.OPTION_C}
                              </div>
                              <div style={{padding: 8, background: '#f8f8f8', borderRadius: 4}}>
                                <strong>D.</strong> {q.OPTION_D}
                              </div>
                            </div>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 16,
                            background: '#f5f5f5',
                            padding: 16,
                            borderRadius: 8
                          }}>
                            <div>
                              <strong>Process Group:</strong>
                              <div>{q.process_group}</div>
                            </div>
                            <div>
                              <strong>Knowledge Area:</strong>
                              <div>{q.knowledge_area}</div>
                            </div>
                            <div>
                              <strong>Tool:</strong>
                              <div>{q.tool}</div>
                            </div>
                          </div>

                          {q.suggested_read && (
                            <div style={{marginTop: 16}}>
                              <strong>Suggested Reading:</strong>
                              <div style={{marginTop: 4, fontSize: 14}}>{q.suggested_read}</div>
                            </div>
                          )}

                          {q.concepts_to_understand && (
                            <div style={{marginTop: 16}}>
                              <strong>Concepts to Understand:</strong>
                              <div style={{marginTop: 4, fontSize: 14}}>{q.concepts_to_understand}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {showDebugModal && (
                <DebugSummary
                  onClose={() => setShowDebugModal(false)}
                  responseArray={managerState.responseArray}
                  retrieveRecordsFromFile={retrieveRecordsFromFile}
                />
            )}
          </>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default App;
