import React, { useState } from 'react';
import { QAResponseIndividual } from '../../types/index';
import { config, buildApiUrl } from '../../config';
import styles from './RetrieveQuestionDialog.module.css';

interface RetrieveQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RetrieveQuestionDialog: React.FC<RetrieveQuestionDialogProps> = ({
  isOpen,
  onClose
}) => {
  const [questionId, setQuestionId] = useState<string>('');
  const [retrievedQuestion, setRetrievedQuestion] = useState<QAResponseIndividual | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleRetrieve = async () => {
    console.log('=== Retrieve from Service Button Clicked ===');
    console.log('Question ID to retrieve:', questionId.trim());
    
    if (!questionId.trim()) {
      setError('Please enter a question ID');
      return;
    }

    console.log('=== RetrieveQuestionDialog Debug Log ===');
    console.log('Question ID entered:', questionId.trim());
    console.log('API Config:', {
      baseUrl: config.baseUrl,
      apiKey: config.apiKey ? '***' : 'Not Set'
    });

    setIsLoading(true);
    setError(null);
    setRetrievedQuestion(null);

    try {
      // Call the getQuestion endpoint directly
      const url = buildApiUrl(config.API_ENDPOINTS.GET_QUESTION, {
        id: questionId.trim()
      });
      console.log('API Request URL:', url);
      console.log('API Request Headers:', {
        'X-API-Key': config.apiKey ? '***' : 'Not Set',
        'Content-Type': 'application/json'
      });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        if (response.status === 404) {
          const errorMsg = `Question with ID "${questionId.trim()}" not found`;
          console.log('Error (404):', errorMsg);
          setError(errorMsg);
        } else {
          const errorMsg = `Failed to retrieve question: ${response.status}`;
          console.log('Error (HTTP):', errorMsg);
          throw new Error(errorMsg);
        }
        return;
      }

      const data = await response.json();
      console.log('API Response Data (raw):', data);
      console.log('API Response Data type:', typeof data);
      console.log('API Response Data keys:', Object.keys(data));
      
      // Extract the question from the response (backend wraps it in a 'question' property)
      const question = data.question;
      if (!question) {
        throw new Error('No question data found in response');
      }
      
      // Log the structure of the question
      console.log('Question data structure analysis:');
      console.log('- Has id:', !!question.id);
      console.log('- Has question_pmp:', !!question.question_pmp);
      console.log('- Has options_pmp:', !!question.options_pmp);
      console.log('- Has analysis:', !!question.analysis);
      
      if (question.analysis) {
        console.log('- Analysis keys:', Object.keys(question.analysis));
        console.log('- Process group:', question.analysis.process_group);
        console.log('- Knowledge area:', question.analysis.knowledge_area);
        console.log('- Tool:', question.analysis.tool);
        console.log('- Additional notes:', question.analysis.additional_notes);
      }
      
      if (question.options_pmp) {
        console.log('- Options keys:', Object.keys(question.options_pmp));
      }

      console.log('Setting retrievedQuestion to:', question);
      setRetrievedQuestion(question);
      console.log('retrievedQuestion state updated');
      
    } catch (err) {
      console.log('Exception caught:', err);
      console.log('Exception type:', typeof err);
      console.log('Exception message:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Failed to retrieve question');
    } finally {
      setIsLoading(false);
      console.log('Loading state set to false');
    }
  };

  const handleSave = async () => {
    if (!retrievedQuestion) {
      setError('No question to save');
      return;
    }

    console.log('=== Save Changes Button Clicked ===');
    console.log('Question ID to save:', retrievedQuestion.id);
    console.log('Process Group:', retrievedQuestion.analysis?.process_group);

    setIsSaving(true);
    setError(null);

    try {
      const url = buildApiUrl(config.API_ENDPOINTS.SAVE_RESPONSE);
      
      console.log('Save API Request URL:', url);
      console.log('Save API Request Headers:', {
        'X-API-Key': config.apiKey ? '***' : 'Not Set',
        'Content-Type': 'application/json'
      });

      const saveData = {
        id: retrievedQuestion.id,
        question_pmp: retrievedQuestion.question_pmp,
        options_pmp: retrievedQuestion.options_pmp,
        is_attempted: retrievedQuestion.is_attempted,
        selected_option: retrievedQuestion.selected_option,
        question_type: retrievedQuestion.question_type,
        is_valid: retrievedQuestion.is_valid,
        process_group: retrievedQuestion.analysis?.process_group,
        analysis: retrievedQuestion.analysis
      };

      console.log('Save API Request Data:', saveData);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      console.log('Save API Response Status:', response.status);

      if (!response.ok) {
        const errorMsg = `Failed to save question: ${response.status}`;
        console.log('Save Error (HTTP):', errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Save API Response Data:', data);

      // Show success message
      console.log('Question saved successfully');
      
    } catch (err) {
      console.log('Save Exception caught:', err);
      console.log('Save Exception type:', typeof err);
      console.log('Save Exception message:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Failed to save question');
    } finally {
      setIsSaving(false);
      console.log('Save loading state set to false');
    }
  };

  const handleClose = () => {
    setQuestionId('');
    setRetrievedQuestion(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Retrieve Question</h2>
          <button className={styles.closeButton} onClick={handleClose}>&times;</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.inputSection}>
            <label htmlFor="questionId">Question ID:</label>
            <div className={styles.inputGroup}>
              <input
                id="questionId"
                type="text"
                className={styles.input}
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                placeholder="Enter question ID"
                disabled={isLoading}
              />
              <button
                className={styles.retrieveButton}
                onClick={handleRetrieve}
                disabled={isLoading || !questionId.trim()}
              >
                {isLoading ? 'Retrieving...' : 'Retrieve from Service'}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          {retrievedQuestion && (() => {
            console.log('Rendering retrievedQuestion:', retrievedQuestion);
            console.log('retrievedQuestion.analysis:', retrievedQuestion.analysis);
            return (
              <div className={styles.resultSection}>
                <h3>Question Details</h3>
                <div className={styles.questionInfo}>
                  <div className={styles.metadataRow}>
                    <div className={styles.metadataItem}>
                      <label>ID:</label>
                      <span>{retrievedQuestion.id}</span>
                    </div>
                    <div className={styles.metadataItem}>
                      <label>Process Group:</label>
                      <span>{retrievedQuestion.analysis?.process_group || 'Not specified'}</span>
                    </div>
                    <div className={styles.metadataItem}>
                      <label>Knowledge Area:</label>
                      <span>{retrievedQuestion.analysis?.knowledge_area || 'Not specified'}</span>
                    </div>
                    <div className={styles.metadataItem}>
                      <label>Tool:</label>
                      <span>{retrievedQuestion.analysis?.tool || 'Not specified'}</span>
                    </div>
                    <div className={styles.metadataItem}>
                      <label>Is Valid:</label>
                      <span>{retrievedQuestion.is_valid ? 'True' : 'False'}</span>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label>Question:</label>
                    <div className={styles.questionText}>{retrievedQuestion.question_pmp}</div>
                  </div>
                  <div className={styles.field}>
                    <label>Options:</label>
                    <div className={styles.options}>
                      <div><strong>A:</strong> {retrievedQuestion.options_pmp?.OPTION_A || 'Not available'}</div>
                      <div><strong>B:</strong> {retrievedQuestion.options_pmp?.OPTION_B || 'Not available'}</div>
                      <div><strong>C:</strong> {retrievedQuestion.options_pmp?.OPTION_C || 'Not available'}</div>
                      <div><strong>D:</strong> {retrievedQuestion.options_pmp?.OPTION_D || 'Not available'}</div>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label>Analysis:</label>
                    <div className={styles.analysis}>
                      <div><strong>Option A:</strong> {retrievedQuestion.analysis?.option_a_result || 'Not available'}</div>
                      <div><strong>Option B:</strong> {retrievedQuestion.analysis?.option_b_result || 'Not available'}</div>
                      <div><strong>Option C:</strong> {retrievedQuestion.analysis?.option_c_result || 'Not available'}</div>
                      <div><strong>Option D:</strong> {retrievedQuestion.analysis?.option_d_result || 'Not available'}</div>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label>Concepts to Understand:</label>
                    <div className={styles.concepts}>{retrievedQuestion.analysis?.concepts_to_understand || 'Not available'}</div>
                  </div>
                  <div className={styles.field}>
                    <label>Suggested Read:</label>
                    <div className={styles.suggestedRead}>
                      {retrievedQuestion.analysis?.suggested_read ? (
                        Array.isArray(retrievedQuestion.analysis.suggested_read) 
                          ? retrievedQuestion.analysis.suggested_read.map((item, index) => (
                              <div key={index}>{item}</div>
                            ))
                          : retrievedQuestion.analysis.suggested_read
                      ) : 'Not available'}
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label>Additional Notes:</label>
                    <div className={styles.additionalNotes}>
                      {retrievedQuestion.analysis?.additional_notes || 'No additional notes available'}
                    </div>
                  </div>
                </div>
                
                {/* Debug Section - Raw API Response */}
                <div className={styles.debugSection}>
                  <h4>Debug Information</h4>
                  <details>
                    <summary>Raw API Response Data</summary>
                    <pre className={styles.debugData}>
                      {JSON.stringify(retrievedQuestion, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            );
          })()}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
          >
            Close
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isSaving || !retrievedQuestion}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetrieveQuestionDialog; 