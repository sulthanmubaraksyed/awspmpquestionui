import React from 'react';

interface ProcessGroupScore {
  processGroup: string;
  correctAnswers: number;
  totalQuestions: number;
}

interface ProcessGroupScoresProps {
  scores: ProcessGroupScore[];
  totalAttempted: number;
}

const ProcessGroupScores: React.FC<ProcessGroupScoresProps> = ({ scores, totalAttempted }) => {
  const getScoreColor = (percentage: number) => {
    // Keep grey until 10 questions are attempted
    if (totalAttempted < 10) return '#808080'; // Grey color
    
    if (percentage < 67) return '#ff4d4d'; // Red for < 67%
    if (percentage <= 76) return '#90EE90'; // Light green for 67-76%
    return '#006400'; // Dark green for > 76%
  };

  const getScoreMessage = (percentage: number) => {
    if (totalAttempted < 10) return 'Complete 10 questions to see your score';
    
    if (percentage < 67) return 'Needs Improvement';
    if (percentage <= 76) return 'Good Progress';
    return 'Excellent!';
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '12px'
    }}>
      {scores.map((score) => {
        const percentage = score.totalQuestions > 0 ? (score.correctAnswers / score.totalQuestions) * 100 : 0;
        const backgroundColor = getScoreColor(percentage);
        // Always use black text when grey (less than 10 questions)
        const textColor = totalAttempted < 10 ? '#000000' : (percentage <= 76.00 ? '#000000' : '#ffffff');

        return (
          <div
            key={score.processGroup}
            className="score-card"
            style={{
              backgroundColor,
              color: textColor,
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease-in-out',
              cursor: 'pointer',
              opacity: totalAttempted < 10 ? 0.8 : 1
            }}
          >
            <div style={{ 
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <span style={{ 
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                {score.processGroup}
              </span>
              <span style={{ 
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                {totalAttempted < 10 ? '-' : `${percentage.toFixed(1)}%`}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem'
            }}>
              <span>
                {totalAttempted < 10 ? 'Complete 10 questions' : `${score.correctAnswers}/${score.totalQuestions} correct`}
              </span>
              <span style={{ fontStyle: 'italic' }}>
                {getScoreMessage(percentage)}
              </span>
            </div>
          </div>
        );
      })}
      <style>
        {`
          .score-card:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }
        `}
      </style>
    </div>
  );
};

export default ProcessGroupScores; 