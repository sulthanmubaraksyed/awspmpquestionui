import React from 'react';
import './ActionButtons.css';

interface ActionButtonsProps {
    onGenerate: () => void;
    onSubmit: () => void;
    onReset?: () => void;
    showReset?: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
    onGenerate,
    onSubmit,
    onReset,
    showReset = false
}) => {
    return (
        <div className="action-buttons-container">
            <button
                className="generate-button"
                onClick={onGenerate}
            >
                Generate
            </button>
            <button
                className="submit-button"
                onClick={onSubmit}
            >
                Submit
            </button>
            {showReset && (
                <button
                    className="reset-button"
                    onClick={onReset}
                >
                    Try Again
                </button>
            )}
        </div>
    );
};

export default ActionButtons; 