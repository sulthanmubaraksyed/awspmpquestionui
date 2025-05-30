import React, { useState, useEffect } from 'react';
import { retrieveRecordsFromFile, QAResponseIndividual } from '../../utils/questionService';

interface DebugSummaryProps {
  onClose: () => void;
  responseArray: QAResponseIndividual[];
  retrieveRecordsFromFile: (params: { processGroup: string; knowledgeArea: string; tool: string; count: number }) => Promise<QAResponseIndividual[]>;
}

const DebugSummary: React.FC<DebugSummaryProps> = ({ onClose, responseArray, retrieveRecordsFromFile }) => {
  const [allQuestions, setAllQuestions] = useState<QAResponseIndividual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const questions = await retrieveRecordsFromFile({
          processGroup: 'all',
          knowledgeArea: 'all',
          tool: 'all',
          count: 100
        });
        setAllQuestions(questions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, [retrieveRecordsFromFile]);

  // Helper function to count by category
  const countByCategory = (items: any[], categoryKey: string) => {
    const counts: { [key: string]: number } = {};
    items.forEach(item => {
      const category = item[categoryKey];
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  };

  // Get counts for responseArray
  const responseProcessGroups = countByCategory(responseArray, 'process_group');
  const responseKnowledgeAreas = countByCategory(responseArray, 'knowledge_area');
  const responseTools = countByCategory(responseArray, 'tool');

  // Get counts for allQuestions
  const allQuestionsProcessGroups = countByCategory(allQuestions, 'process_group');
  const allQuestionsKnowledgeAreas = countByCategory(allQuestions, 'knowledge_area');
  const allQuestionsTools = countByCategory(allQuestions, 'tool');

  // Helper function to render category counts
  const renderCategoryCounts = (title: string, counts: { [key: string]: number }) => (
    <div style={{ marginBottom: '16px' }}>
      <h3 style={{ marginBottom: '8px', color: '#333' }}>{title}</h3>
      <div style={{ display: 'grid', gap: '8px' }}>
        {Object.entries(counts).map(([category, count]) => (
          <div key={category} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: '8px',
            background: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <span style={{ fontWeight: 500 }}>{category}</span>
            <span>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return (
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
          minWidth: 600,
          textAlign: 'center'
        }}>
          <div className="spinner" />
          <div style={{ marginTop: 24 }}>Loading debug information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
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
          minWidth: 600,
          textAlign: 'center',
          color: '#d32f2f'
        }}>
          <h3>Error Loading Debug Information</h3>
          <p>{error}</p>
          <button 
            onClick={onClose}
            style={{
              marginTop: 24,
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
      </div>
    );
  }

  return (
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
        minWidth: 600,
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
          <h2 style={{ margin: 0 }}>Debug Summary</h2>
          <button 
            onClick={onClose}
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

        <div style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: '8px', color: '#333' }}>Total Records</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            background: '#f5f5f5',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontWeight: 500 }}>Response Array</div>
              <div>{responseArray.length} records</div>
            </div>
            <div>
              <div style={{ fontWeight: 500 }}>All Questions</div>
              <div>{allQuestions.length} records</div>
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }}>
          <div>
            <h3 style={{ marginBottom: '16px', color: '#333' }}>Response Array</h3>
            {renderCategoryCounts('Process Groups', responseProcessGroups)}
            {renderCategoryCounts('Knowledge Areas', responseKnowledgeAreas)}
            {renderCategoryCounts('Tools', responseTools)}
          </div>
          <div>
            <h3 style={{ marginBottom: '16px', color: '#333' }}>All Questions</h3>
            {renderCategoryCounts('Process Groups', allQuestionsProcessGroups)}
            {renderCategoryCounts('Knowledge Areas', allQuestionsKnowledgeAreas)}
            {renderCategoryCounts('Tools', allQuestionsTools)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugSummary; 