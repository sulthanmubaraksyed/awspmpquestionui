import React, { useState, useEffect } from 'react';
import { QAResponseIndividual } from '../../utils/questionService';
import styles from './EditResponseDialog.module.css';

interface EditResponseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentResponse: QAResponseIndividual | null;
  onSave: (updatedResponse: QAResponseIndividual) => Promise<void>;
  userRole: string;
}

type AnalysisField = keyof NonNullable<QAResponseIndividual['analysis']>;

const EditResponseDialog: React.FC<EditResponseDialogProps> = ({
  isOpen,
  onClose,
  currentResponse,
  onSave,
  userRole
}) => {
  const [editedResponse, setEditedResponse] = useState<QAResponseIndividual | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

  useEffect(() => {
    if (currentResponse) {
      setEditedResponse({ ...currentResponse });
    }
  }, [currentResponse]);

  if (!isOpen || !editedResponse) return null;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(editedResponse.id);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const handleChange = (field: keyof QAResponseIndividual, value: any) => {
    setEditedResponse((prev: QAResponseIndividual | null) => prev ? { ...prev, [field]: value } : null);
  };

  const handleAnalysisChange = (field: AnalysisField, value: any) => {
    setEditedResponse((prev: QAResponseIndividual | null) => {
      if (!prev) return null;
      const currentAnalysis = prev.analysis || {
        option_a_result: '',
        option_b_result: '',
        option_c_result: '',
        option_d_result: '',
        process_group: '',
        knowledge_area: '',
        tool: '',
        suggested_read: '',
        concepts_to_understand: ''
      };
      return {
        ...prev,
        analysis: {
          ...currentAnalysis,
          [field]: value
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedResponse) return;

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editedResponse);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Edit Response</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.idSection}>
            <div className={styles.idField}>
              <label>Question ID:</label>
              <div className={styles.idInputGroup}>
                <input
                  type="text"
                  value={editedResponse.id}
                  disabled
                  className={styles.idInput}
                />
                <button
                  type="button"
                  onClick={handleCopyId}
                  className={styles.copyButton}
                >
                  {copySuccess || 'Copy ID'}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3>Basic Information</h3>
            <div className={styles.field}>
              <label>Question:</label>
              <textarea
                value={editedResponse.question_pmp}
                onChange={(e) => handleChange('question_pmp', e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label>Option A:</label>
              <textarea
                value={editedResponse.OPTION_A}
                onChange={(e) => handleChange('OPTION_A', e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label>Option B:</label>
              <textarea
                value={editedResponse.OPTION_B}
                onChange={(e) => handleChange('OPTION_B', e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label>Option C:</label>
              <textarea
                value={editedResponse.OPTION_C}
                onChange={(e) => handleChange('OPTION_C', e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label>Option D:</label>
              <textarea
                value={editedResponse.OPTION_D}
                onChange={(e) => handleChange('OPTION_D', e.target.value)}
                className={styles.textarea}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3>Analysis</h3>
            <div className={styles.field}>
              <label>Option A Result:</label>
              <textarea
                value={editedResponse.analysis?.option_a_result || ''}
                onChange={(e) => handleAnalysisChange('option_a_result', e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label>Option B Result:</label>
              <textarea
                value={editedResponse.analysis?.option_b_result || ''}
                onChange={(e) => handleAnalysisChange('option_b_result', e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label>Option C Result:</label>
              <textarea
                value={editedResponse.analysis?.option_c_result || ''}
                onChange={(e) => handleAnalysisChange('option_c_result', e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label>Option D Result:</label>
              <textarea
                value={editedResponse.analysis?.option_d_result || ''}
                onChange={(e) => handleAnalysisChange('option_d_result', e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label>Process Group:</label>
              <input
                type="text"
                value={editedResponse.analysis?.process_group || ''}
                onChange={(e) => handleAnalysisChange('process_group', e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label>Knowledge Area:</label>
              <input
                type="text"
                value={editedResponse.analysis?.knowledge_area || ''}
                onChange={(e) => handleAnalysisChange('knowledge_area', e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label>Tool:</label>
              <input
                type="text"
                value={editedResponse.analysis?.tool || ''}
                onChange={(e) => handleAnalysisChange('tool', e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label>Suggested Read:</label>
              <textarea
                value={editedResponse.analysis 
                  ? (Array.isArray(editedResponse.analysis.suggested_read)
                    ? editedResponse.analysis.suggested_read.join('\n')
                    : editedResponse.analysis.suggested_read || '')
                  : ''}
                onChange={(e) => handleAnalysisChange('suggested_read', e.target.value.split('\n'))}
                className={styles.textarea}
                placeholder="Enter each suggestion on a new line"
              />
            </div>

            <div className={styles.field}>
              <label>Concepts to Understand:</label>
              <textarea
                value={editedResponse.analysis?.concepts_to_understand || ''}
                onChange={(e) => handleAnalysisChange('concepts_to_understand', e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.field}>
              <label>Additional Notes:</label>
              <textarea
                value={editedResponse.analysis?.additional_notes || ''}
                onChange={(e) => handleAnalysisChange('additional_notes', e.target.value)}
                className={styles.textarea}
              />
            </div>
          </div>

          {userRole === 'Admin' && (
            <div className={styles.field}>
              <label>Is Verified:</label>
              <select
                value={editedResponse.is_verified ? 'true' : 'false'}
                onChange={(e) => handleChange('is_verified', e.target.value === 'true')}
                className={styles.select}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditResponseDialog; 