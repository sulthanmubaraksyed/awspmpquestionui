import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface ScoreDisplayProps {
  correctAnswers: number;
  totalQuestions: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ correctAnswers, totalQuestions }) => {
  const percentage = (correctAnswers / totalQuestions) * 100;
  
  const getScoreColor = (score: number) => {
    if (score <= 66.00) return '#ff4d4d'; // Red for <= 66.00%
    if (score <= 76.00) return '#90EE90'; // Light green for 67-76%
    return '#006400'; // Dark green for > 76%
  };

  const getScoreMessage = (score: number) => {
    if (score <= 66.00) return 'Needs Improvement';
    if (score <= 76.00) return 'Good Progress';
    return 'Excellent!';
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        m: 2, 
        textAlign: 'center',
        backgroundColor: getScoreColor(percentage),
        color: percentage <= 76.00 ? '#000000' : '#ffffff',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 6
        }
      }}
    >
      <Typography variant="h4" gutterBottom>
        Your Score
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <Typography variant="h2" component="div" sx={{ fontWeight: 'bold' }}>
          {correctAnswers}
        </Typography>
        <Typography variant="h4" component="div">
          / {totalQuestions}
        </Typography>
      </Box>
      <Typography variant="h5" sx={{ mt: 2 }}>
        {percentage.toFixed(1)}%
      </Typography>
      <Typography variant="h6" sx={{ mt: 1, fontStyle: 'italic' }}>
        {getScoreMessage(percentage)}
      </Typography>
    </Paper>
  );
};

export default ScoreDisplay; 