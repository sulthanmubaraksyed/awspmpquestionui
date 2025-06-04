import React from 'react';
import { QAResponseIndividual } from '../../utils/questionService';
import styles from './DebugDialog.module.css';

interface DebugDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questionsData: QAResponseIndividual[];
  responseArray: QAResponseIndividual[];
}

interface Stats {
  processGroup: { [key: string]: number };
  knowledgeArea: { [key: string]: number };
  total: number;
}

const DebugDialog: React.FC<DebugDialogProps> = ({ isOpen, onClose, questionsData, responseArray }) => {
  if (!isOpen) return null;

  const calculateStats = (questions: QAResponseIndividual[]): Stats => {
    const stats: Stats = {
      processGroup: {},
      knowledgeArea: {},
      total: questions.length
    };

    questions.forEach(q => {
      const pg = q.analysis?.process_group || 'Unknown';
      const ka = q.analysis?.knowledge_area || 'Unknown';
      
      stats.processGroup[pg] = (stats.processGroup[pg] || 0) + 1;
      stats.knowledgeArea[ka] = (stats.knowledgeArea[ka] || 0) + 1;
    });

    return stats;
  };

  const questionsDataStats = calculateStats(questionsData);
  const responseArrayStats = calculateStats(responseArray);

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Debug Information</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.section}>
            <h3>All Questions (questionsData)</h3>
            <p>Total Records: {questionsDataStats.total}</p>
            
            <h4>By Process Group:</h4>
            <ul>
              {Object.entries(questionsDataStats.processGroup).map(([pg, count]) => (
                <li key={pg}>{pg}: {count}</li>
              ))}
            </ul>

            <h4>By Knowledge Area:</h4>
            <ul>
              {Object.entries(questionsDataStats.knowledgeArea).map(([ka, count]) => (
                <li key={ka}>{ka}: {count}</li>
              ))}
            </ul>
          </div>

          <div className={styles.section}>
            <h3>Active Questions (responseArray)</h3>
            <p>Total Records: {responseArrayStats.total}</p>
            
            <h4>By Process Group:</h4>
            <ul>
              {Object.entries(responseArrayStats.processGroup).map(([pg, count]) => (
                <li key={pg}>{pg}: {count}</li>
              ))}
            </ul>

            <h4>By Knowledge Area:</h4>
            <ul>
              {Object.entries(responseArrayStats.knowledgeArea).map(([ka, count]) => (
                <li key={ka}>{ka}: {count}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugDialog; 