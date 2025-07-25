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
    // Show colors based on percentage regardless of question count
    if (percentage < 67) return '#ff4d4d'; // Red for < 67%
    if (percentage <= 76) return '#90EE90'; // Light green for 67-76%
    return '#006400'; // Dark green for > 76%
  };

  const getScoreMessage = (percentage: number) => {
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
        // Only show results if there are attempted questions for this process group
        if (score.totalQuestions === 0) {
          return (
            <div
              key={score.processGroup}
              className="score-card"
              style={{
                backgroundColor: '#f0f0f0',
                color: '#666',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
                cursor: 'default',
                opacity: 0.8
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
                  -
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '0.85rem'
              }}>
                <span>No questions attempted yet</span>
              </div>
            </div>
          );
        }
        
        const percentage = (score.correctAnswers / score.totalQuestions) * 100;
        const backgroundColor = getScoreColor(percentage);
        // Use white text when any question is answered in this process group
        const textColor = score.totalQuestions > 0 ? '#ffffff' : '#000000';

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
              opacity: 1
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
                {`${percentage.toFixed(1)}%`}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.85rem'
            }}>
              <span>
                {`${score.correctAnswers}/${score.totalQuestions} correct`}
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