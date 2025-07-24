import React from 'react';

interface OverallStatsProps {
  totalAttempted: number;
  correctAnswers: number;
}

const OverallStats: React.FC<OverallStatsProps> = ({ totalAttempted, correctAnswers }) => {
  const incorrectAnswers = totalAttempted - correctAnswers;
  const correctPercentage = totalAttempted > 0 ? (correctAnswers / totalAttempted) * 100 : 0;
  
  // Calculate the progress ring parameters
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = totalAttempted > 0 ? (correctAnswers / totalAttempted) * circumference : 0;
  
  return (
    <div style={{ marginTop: '20px' }}>
      {/* Circular Progress Widget */}
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div style={{ 
          position: 'relative',
          width: '120px',
          height: '120px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Background circle */}
            <circle 
              cx="60" 
              cy="60" 
              r={radius} 
              stroke="#e6e6e6" 
              strokeWidth="10" 
              fill="none" 
            />
            {/* Progress circle */}
            <circle 
              cx="60" 
              cy="60" 
              r={radius} 
              stroke="#4CAF50" 
              strokeWidth="10" 
              fill="none" 
              strokeDasharray={circumference} 
              strokeDashoffset={circumference - progress}
              transform="rotate(-90 60 60)" 
              strokeLinecap="round"
            />
          </svg>
          <div style={{ 
            position: 'absolute',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333' }}>
              {correctPercentage.toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              Success Rate
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '10px',
        textAlign: 'center'
      }}>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#e8f5e9', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid #c8e6c9'
        }}>
          <div style={{ color: '#2e7d32', fontWeight: 'bold', marginBottom: '5px' }}>Correct</div>
          <div style={{ fontSize: '1.8rem', color: '#2e7d32', fontWeight: 'bold' }}>{correctAnswers}</div>
          <div style={{ fontSize: '0.8rem', color: '#2e7d32' }}>answers</div>
        </div>
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid #ffcdd2'
        }}>
          <div style={{ color: '#c62828', fontWeight: 'bold', marginBottom: '5px' }}>Incorrect</div>
          <div style={{ fontSize: '1.8rem', color: '#c62828', fontWeight: 'bold' }}>{incorrectAnswers}</div>
          <div style={{ fontSize: '0.8rem', color: '#c62828' }}>answers</div>
        </div>
      </div>
      
      {/* Total Attempted */}
      <div style={{ 
        marginTop: '10px',
        padding: '10px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ fontWeight: 'bold', color: '#555' }}>Total Questions Attempted</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>{totalAttempted}</div>
      </div>
    </div>
  );
};

export default OverallStats;