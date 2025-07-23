import React from 'react';
import { FormControlLabel, Switch, Paper, Typography, Box } from '@mui/material';
import styles from './SampleToggle.module.css';

interface SampleToggleProps {
  isSample: boolean;
  onSampleChange: (isSample: boolean) => void;
  questionId?: string;
  disabled?: boolean;
}

const SampleToggle: React.FC<SampleToggleProps> = ({
  isSample,
  onSampleChange,
  questionId,
  disabled = false
}) => {
  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSampleChange(event.target.checked);
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        m: 2, 
        backgroundColor: isSample ? '#e3f2fd' : '#fafafa',
        border: `2px solid ${isSample ? '#2196f3' : '#9e9e9e'}`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.01)',
          boxShadow: 4
        }
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ 
        color: isSample ? '#1976d2' : '#616161',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        Sample Question
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ 
          color: isSample ? '#1976d2' : '#616161',
          fontWeight: '500'
        }}>
          No
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={isSample}
              onChange={handleToggle}
              disabled={disabled}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': {
                  color: '#2196f3',
                  '&:hover': {
                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                  },
                },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#2196f3',
                },
                '& .MuiSwitch-switchBase:not(.Mui-checked)': {
                  color: '#9e9e9e',
                  '&:hover': {
                    backgroundColor: 'rgba(158, 158, 158, 0.08)',
                  },
                },
                '& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track': {
                  backgroundColor: '#9e9e9e',
                },
              }}
            />
          }
          label=""
          sx={{ margin: 0 }}
        />
        
        <Typography variant="body2" sx={{ 
          color: isSample ? '#1976d2' : '#616161',
          fontWeight: '500'
        }}>
          Yes
        </Typography>
      </Box>
      
      <Typography variant="caption" sx={{ 
        display: 'block', 
        textAlign: 'center', 
        mt: 1,
        color: isSample ? '#1976d2' : '#616161',
        fontStyle: 'italic'
      }}>
        {isSample ? 'This question is marked as a sample' : 'This question is not a sample'}
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

export default SampleToggle; 