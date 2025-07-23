import React, { useState, useEffect } from 'react';
import { QAResponseIndividual } from '../../types/index';
import { config, buildApiUrl } from '../../config';
import styles from './EditResponseDialog.module.css';
import ProcessGroupSelector from '../ProcessGroupSelector/ProcessGroupSelector';
import KnowledgeAreaSelector from '../KnowledgeAreaSelector/KnowledgeAreaSelector';

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
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (currentResponse) {
      const response = { ...currentResponse };
      // Ensure suggested_read is an array
      if (response.analysis) {
        response.analysis = {
          ...response.analysis,
          suggested_read: Array.isArray(response.analysis.suggested_read)
            ? response.analysis.suggested_read
            : response.analysis.suggested_read
              ? [response.analysis.suggested_read]
              : []
        };
      }
      setEditedResponse(response);
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

  const handleChange = (field: string, value: any) => {
    setEditedResponse(prev => {
      if (!prev) return null;
      const newResponse = { ...prev };
      
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        if (parent === 'analysis' && newResponse.analysis) {
          newResponse.analysis = {
            ...newResponse.analysis,
            [child]: value
          };
        } else if (parent === 'options_pmp' && newResponse.options_pmp) {
          newResponse.options_pmp = {
            ...newResponse.options_pmp,
            [child]: value
          };
        }
      } else {
        // Handle direct fields
        switch (field) {
          case 'is_valid':
            newResponse.is_valid = value === 'true';
            break;
          case 'id':
          case 'question_pmp':
          case 'question_type':
            newResponse[field] = value;
            break;
          default:
            // For any other fields, use type assertion
            (newResponse as any)[field] = value;
        }
      }
      return newResponse;
    });
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

  const handleSuggestedReadChange = (value: string) => {
    const suggestions = value.split('\n').filter(line => line.trim() !== '');
    handleChange('analysis.suggested_read', suggestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('=== EditResponseDialog: Save Changes Button Clicked ===');
    e.preventDefault();
    if (!editedResponse) {
      console.log('❌ No edited response available');
      return;
    }

    console.log('Edited Response before save:', {
      id: editedResponse.id,
      question_pmp: editedResponse.question_pmp?.substring(0, 50) + '...',
      is_valid: editedResponse.is_valid,
      process_group: editedResponse.analysis?.process_group,
      knowledge_area: editedResponse.analysis?.knowledge_area,
      tool: editedResponse.analysis?.tool,
      additional_notes: editedResponse.analysis?.additional_notes
    });

    console.log('Setting isSaving to true');
    setIsSaving(true);
    setError(null);

    try {
      console.log('Calling onSave function...');
      await onSave(editedResponse);
      console.log('✅ onSave completed successfully');
      console.log('Calling onClose...');
      onClose();
      console.log('✅ Dialog closed');
      console.log('=== EditResponseDialog: Save Changes Completed Successfully ===');
    } catch (err) {
      console.error('❌ Error in EditResponseDialog handleSubmit:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      console.log('=== EditResponseDialog: Save Changes Failed ===');
    } finally {
      console.log('Setting isSaving to false');
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editedResponse) {
      setError('No question to delete');
      return;
    }

    console.log('=== EditResponseDialog: Delete Question Button Clicked ===');
    console.log('Question ID to delete:', editedResponse.id);
    console.log('Process Group:', editedResponse.analysis?.process_group);

    setIsDeleting(true);
    setError(null);

    try {
      const url = buildApiUrl(config.API_ENDPOINTS.DELETE_QUESTION, {
        id: editedResponse.id,
        processGroup: editedResponse.analysis?.process_group || ''
      });
      
      console.log('Delete API Request URL:', url);
      console.log('Delete API Request Headers:', {
        'X-API-Key': config.apiKey ? '***' : 'Not Set',
        'Content-Type': 'application/json'
      });

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'X-API-Key': config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      console.log('Delete API Response Status:', response.status);

      if (!response.ok) {
        const errorMsg = `Failed to delete question: ${response.status}`;
        console.log('Delete Error (HTTP):', errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Delete API Response Data:', data);

      // Close the dialog after successful deletion
      console.log('Question deleted successfully, closing dialog');
      onClose();
      
    } catch (err) {
      console.log('Delete Exception caught:', err);
      console.log('Delete Exception type:', typeof err);
      console.log('Delete Exception message:', err instanceof Error ? err.message : String(err));
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    } finally {
      setIsDeleting(false);
      console.log('Delete loading state set to false');
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Edit Response</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.idSection}>
            <div className={styles.idField}>
              <label>Question ID</label>
              <div className={styles.idInputGroup}>
                <input
                  type="text"
                  className={styles.idInput}
                  value={editedResponse.id}
                  readOnly
                />
                <button
                  type="button"
                  className={styles.copyButton}
                  onClick={handleCopyId}
                >
                  Copy ID
                </button>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            {/* Left Column */}
            <div className={styles.section}>
              <h3>Basic Information</h3>
              <div className={styles.field}>
                <label>Process Group</label>
                <select
                  className={styles.select}
                  value={editedResponse.analysis.process_group}
                  onChange={(e) => handleChange('analysis.process_group', e.target.value)}
                >
                  <option value="">Select Process Group</option>
                  <option value="Initiating">Initiating</option>
                  <option value="Planning">Planning</option>
                  <option value="Executing">Executing</option>
                  <option value="Monitoring and Controlling">Monitoring and Controlling</option>
                  <option value="Closing">Closing</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Knowledge Area</label>
                <select
                  className={styles.select}
                  value={editedResponse.analysis.knowledge_area}
                  onChange={(e) => handleChange('analysis.knowledge_area', e.target.value)}
                >
                  <option value="">Select Knowledge Area</option>
                  <option value="Integration">Integration</option>
                  <option value="Scope">Scope</option>
                  <option value="Schedule">Schedule</option>
                  <option value="Cost">Cost</option>
                  <option value="Quality">Quality</option>
                  <option value="Resources">Resources</option>
                  <option value="Communications">Communications</option>
                  <option value="Risk">Risk</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Stakeholders">Stakeholders</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Tool</label>
                <select
                  className={styles.select}
                  value={editedResponse.analysis.tool}
                  onChange={(e) => handleChange('analysis.tool', e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Data Gathering">Data Gathering</option>
                  <option value="Data Analysis">Data Analysis</option>
                  <option value="Decision Making">Decision Making</option>
                  <option value="Communication">Communication</option>
                  <option value="Interpersonal and Team">Interpersonal and Team</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Is Valid</label>
                <select
                  className={styles.select}
                  value={editedResponse.is_valid === undefined ? 'false' : editedResponse.is_valid.toString()}
                  onChange={(e) => handleChange('is_valid', e.target.value)}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Is Sample</label>
                <select
                  className={styles.select}
                  value={editedResponse.is_sample === undefined ? 'false' : editedResponse.is_sample.toString()}
                  onChange={(e) => handleChange('is_sample', e.target.value)}
                >
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className={styles.section}>
              <h3>Question Details</h3>
              <div className={styles.field}>
                <label>Question</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.question_pmp}
                  onChange={(e) => handleChange('question_pmp', e.target.value)}
                  rows={4}
                />
              </div>
              <div className={styles.field}>
                <label>Option A</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.options_pmp.OPTION_A}
                  onChange={(e) => handleChange('options_pmp.OPTION_A', e.target.value)}
                  rows={2}
                />
              </div>
              <div className={styles.field}>
                <label>Option B</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.options_pmp.OPTION_B}
                  onChange={(e) => handleChange('options_pmp.OPTION_B', e.target.value)}
                  rows={2}
                />
              </div>
              <div className={styles.field}>
                <label>Option C</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.options_pmp.OPTION_C}
                  onChange={(e) => handleChange('options_pmp.OPTION_C', e.target.value)}
                  rows={2}
                />
              </div>
              <div className={styles.field}>
                <label>Option D</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.options_pmp.OPTION_D}
                  onChange={(e) => handleChange('options_pmp.OPTION_D', e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            {/* Analysis Section - Full Width */}
            <div className={styles.section} style={{ gridColumn: '1 / -1' }}>
              <h3>Analysis</h3>
              <div className={styles.field}>
                <label>Option A Analysis</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.analysis.option_a_result}
                  onChange={(e) => handleChange('analysis.option_a_result', e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.field}>
                <label>Option B Analysis</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.analysis.option_b_result}
                  onChange={(e) => handleChange('analysis.option_b_result', e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.field}>
                <label>Option C Analysis</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.analysis.option_c_result}
                  onChange={(e) => handleChange('analysis.option_c_result', e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.field}>
                <label>Option D Analysis</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.analysis.option_d_result}
                  onChange={(e) => handleChange('analysis.option_d_result', e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.field}>
                <label>Concepts to Understand</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.analysis.concepts_to_understand}
                  onChange={(e) => handleChange('analysis.concepts_to_understand', e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.field}>
                <label>Suggested Read</label>
                <textarea
                  className={styles.textarea}
                  value={Array.isArray(editedResponse.analysis.suggested_read) 
                    ? editedResponse.analysis.suggested_read.join('\n')
                    : editedResponse.analysis.suggested_read || ''}
                  onChange={(e) => handleSuggestedReadChange(e.target.value)}
                  rows={3}
                  placeholder="Enter each suggestion on a new line"
                />
              </div>
              <div className={styles.field}>
                <label>Additional Notes</label>
                <textarea
                  className={styles.textarea}
                  value={editedResponse.analysis.additional_notes}
                  onChange={(e) => handleChange('analysis.additional_notes', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSaving || isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.deleteButton}
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
            >
              {isDeleting ? 'Deleting...' : 'Delete Question'}
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSaving || isDeleting}
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