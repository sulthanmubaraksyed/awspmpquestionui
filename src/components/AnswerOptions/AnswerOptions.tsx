import React from 'react';
import styles from './AnswerOptions.module.css';

interface AnswerOptionsProps {
    options: {
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
    };
    selectedOption: string;
    onOptionChange: (option: string) => void;
    isAnswerSubmitted: boolean;
    isCorrect: boolean;
    onSubmit: () => void;
    onPrevious: () => void;
    onNext: () => void;
    isFirstQuestion: boolean;
    isLastQuestion: boolean;
    responseArray: any[];
    currentIndex: number;
    onRetrieve: () => void;
}

const AnswerOptions: React.FC<AnswerOptionsProps> = ({
    options,
    selectedOption,
    onOptionChange,
    isAnswerSubmitted,
    isCorrect,
    onSubmit,
    onPrevious,
    onNext,
    isFirstQuestion,
    isLastQuestion,
    responseArray,
    currentIndex,
    onRetrieve
}) => {
    const optionsList = [
        { key: 'A', value: options.optionA },
        { key: 'B', value: options.optionB },
        { key: 'C', value: options.optionC },
        { key: 'D', value: options.optionD }
    ];

    // Get current response
    const current = responseArray?.[currentIndex];
    const isAttempted = current?.is_attempted;
    const selectedOptionFinal = isAttempted ? current?.selected_option : selectedOption;
    const didUserGetItRight = current?.did_user_get_it_right;

    console.log('AnswerOptions render:', {
        currentIndex,
        isAttempted,
        selectedOptionFinal,
        didUserGetItRight,
        isLastQuestion,
        currentQuestionId: current?.id
    });

    const getOptionStyle = (key: string) => {
        if (!isAttempted || selectedOptionFinal !== key) return {};
        if (didUserGetItRight === true) {
            return { backgroundColor: '#2e7d32', color: 'white' };
        } else if (didUserGetItRight === false) {
            return { backgroundColor: '#d32f2f', color: 'white' };
        }
        return {};
    };

    return (
        <div className={styles['options-container']}>
            <div className={styles['option-group']}>
                {optionsList.map(({ key, value }) => (
                    <label 
                        key={key} 
                        className={styles['option-item']}
                        style={getOptionStyle(key)}
                    >
                        <input
                            type="radio"
                            name="answer"
                            value={key}
                            checked={selectedOptionFinal === key}
                            onChange={(e) => onOptionChange(e.target.value)}
                            className={styles['radio-input']}
                            disabled={isAttempted}
                        />
                        <span className={styles['option-label']} style={getOptionStyle(key)}>
                            <strong>{key}. </strong> {value}
                        </span>
                    </label>
                ))}
            </div>
            <div className={styles['buttons-container']}>
                <button
                    className={`${styles['nav-button']} ${styles['prev-button']}`}
                    onClick={onPrevious}
                    disabled={isFirstQuestion}
                >
                    Previous
                </button>
                <button
                    className={styles['apple-submit-button']}
                    onClick={onSubmit}
                    disabled={!selectedOption || isAttempted}
                >
                    Submit
                </button>
                <button
                    className={`${styles['nav-button']} ${styles['next-button']}`}
                    onClick={onNext}
                    disabled={!isAttempted || isLastQuestion}
                >
                    Next
                  </button>
                    <button
                        className={styles['apple-submit-button']}
                        style={{ marginLeft: 12, background: '#34c759' }}
                        onClick={onRetrieve}
                        type="button"
                    >
                        Retrieve
                    </button>
            </div>
        </div>
    );
};

export default AnswerOptions; 