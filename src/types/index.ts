export interface QAResponseIndividual {
  id: string;
  question_pmp: string;
  options_pmp: {
    OPTION_A: string;
    OPTION_B: string;
    OPTION_C: string;
    OPTION_D: string;
  };
  is_attempted: boolean;
  selected_option: string;
  question_type: string;
  is_valid: boolean;
  is_sample: boolean;
  process_group: string;
  analysis: {
    option_a_result: string;
    option_b_result: string;
    option_c_result: string;
    option_d_result: string;
    process_group: string;
    knowledge_area: string;
    tool: string;
    suggested_read: string[];
    concepts_to_understand: string;
    additional_notes?: string;
  };
  did_user_get_it_right?: boolean;
}

export interface RetrieveParams {
  processGroup: string;
  knowledgeArea: string;
  tool: string;
  count?: number;
}

export interface BaseQuestion {
  id: string;
  question_pmp: string;
  options_pmp: {
    OPTION_A: string;
    OPTION_B: string;
    OPTION_C: string;
    OPTION_D: string;
  };
  analysis: {
    option_a_result: string;
    option_b_result: string;
    option_c_result: string;
    option_d_result: string;
    process_group: string;
    knowledge_area: string;
    tool: string;
    suggested_read: string[];
    concepts_to_understand: string;
    additional_notes?: string;
  };
} 