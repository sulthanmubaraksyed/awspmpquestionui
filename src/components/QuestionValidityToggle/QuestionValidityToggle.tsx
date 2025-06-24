import React from 'react';
import { FormControlLabel, Switch, Paper, Typography, Box } from '@mui/material';
import styles from './QuestionValidityToggle.module.css';

interface QuestionValidityToggleProps {
  isValid: boolean;
  onValidityChange: (isValid: boolean) => void;
  questionId?: string;
  disabled?: boolean;
}

const QuestionValidityToggle: React.FC<QuestionValidityToggleProps> = ({
  isValid,
  onValidityChange,
  questionId,
  disabled = false
}) => {
  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onValidityChange(event.target.checked);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        m: 2, 
        backgroundColor: isValid ? '#e8f5e8' : '#ffe8e8',
        border: `2px solid ${isValid ? '#4caf50' : '#f44336'}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.01)',
          boxShadow: 4
        }
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ 
        color: isValid ? '#2e7d32' : '#d32f2f',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        Question Validity
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ 
          color: isValid ? '#2e7d32' : '#d32f2f',
          fontWeight: '500'
        }}>
          Invalid
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={isValid}
              onChange={handleToggle}
              disabled={disabled}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#4caf50',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  },
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#4caf50',
                },
                '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                  color: '#f44336',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.08)',
                  },
                },
                '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                  backgroundColor: '#f44336',
                },
              }}
            />
          }
          label=""
          sx={{ margin: 0 }}
        />
        
        <Typography variant="body2" sx={{ 
          color: isValid ? '#2e7d32' : '#d32f2f',
          fontWeight: '500'
        }}>
          Valid
        </Typography>
      </Box>
      
      <Typography variant="caption" sx={{ 
        display: 'block', 
        textAlign: 'center', 
        mt: 1,
        color: isValid ? '#2e7d32' : '#d32f2f',
        fontStyle: 'italic'
      }}>
        {isValid ? 'This question is marked as valid' : 'This question is marked as invalid'}
      </Typography>
      
      {questionId && (
        <Typography variant="caption" sx={{ 
          display: 'block', 
          textAlign: 'center', 
          mt: 0.5,
          color: '#666',
          fontSize: '0.7rem'
        }}>
          ID: {questionId}
        </Typography>
      )}
    </Paper>
  );
};

export default QuestionValidityToggle; 