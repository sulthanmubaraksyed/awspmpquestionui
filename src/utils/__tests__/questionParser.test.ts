import { getQuestionAndAnswers } from '../questionParser';

describe('getQuestionAndAnswers', () => {
    const validResponse = {
        parsed_question: {
            Question: "1. Scenario: You are managing a project to develop a new software application...",
            OPTION_A: "Start implementing the approved changes immediately...",
            OPTION_B: "Communicate the changes to all stakeholders...",
            OPTION_C: "Focus on hiring a new team member first...",
            OPTION_D: "Reject the approved changes..."
        }
    };

    it('should successfully parse a valid question object', () => {
        const result = getQuestionAndAnswers(validResponse);
        
        expect(result).toEqual({
            question: validResponse.parsed_question.Question,
            optionA: validResponse.parsed_question.OPTION_A,
            optionB: validResponse.parsed_question.OPTION_B,
            optionC: validResponse.parsed_question.OPTION_C,
            optionD: validResponse.parsed_question.OPTION_D
        });
    });

    it('should trim whitespace from all fields', () => {
        const responseWithWhitespace = {
            parsed_question: {
                Question: "  Test question  ",
                OPTION_A: "  Option A  ",
                OPTION_B: "  Option B  ",
                OPTION_C: "  Option C  ",
                OPTION_D: "  Option D  "
            }
        };

        const result = getQuestionAndAnswers(responseWithWhitespace);
        
        expect(result).toEqual({
            question: "Test question",
            optionA: "Option A",
            optionB: "Option B",
            optionC: "Option C",
            optionD: "Option D"
        });
    });

    it('should throw error when parsed_question is missing', () => {
        const invalidResponse = {} as any;
        
        expect(() => {
            getQuestionAndAnswers(invalidResponse);
        }).toThrow('Invalid question format: Missing required fields');
    });

    it('should throw error when any required field is missing', () => {
        const incompleteResponse = {
            parsed_question: {
                Question: "Test question",
                OPTION_A: "Option A",
                OPTION_B: "Option B",
                // Missing OPTION_C and OPTION_D
            }
        } as any;

        expect(() => {
            getQuestionAndAnswers(incompleteResponse);
        }).toThrow('Invalid question format: Missing required fields');
    });

    it('should handle empty strings after trimming', () => {
        const responseWithEmptyStrings = {
            parsed_question: {
                Question: "   ",
                OPTION_A: "  ",
                OPTION_B: "  ",
                OPTION_C: "  ",
                OPTION_D: "  "
            }
        };

        const result = getQuestionAndAnswers(responseWithEmptyStrings);
        
        expect(result).toEqual({
            question: "",
            optionA: "",
            optionB: "",
            optionC: "",
            optionD: ""
        });
    });
}); 