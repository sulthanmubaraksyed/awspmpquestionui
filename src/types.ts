export interface QAResponseIndividual {
  id: string;
  question_pmp: string;
  options_pmp: {
    OPTION_A: string;
    OPTION_B: string;
    OPTION_C: string;
    OPTION_D: string;
  };
  OPTION_A: string;
  OPTION_B: string;
  OPTION_C: string;
  OPTION_D: string;
  option_a_result: string;
  option_b_result: string;
  option_c_result: string;
  option_d_result: string;
  process_group: string;
  knowledge_area: string;
  tool: string;
  suggested_read: string;
  concepts_to_understand: string;
  is_attempted: boolean;
  question_type: string;
  selected_option: string;
  analysis: {
    option_a_result: string;
    option_b_result: string;
    option_c_result: string;
    option_d_result: string;
    process_group: string;
    knowledge_area: string;
    tool: string;
    suggested_read: string | string[];
    concepts_to_understand: string;
    additional_notes?: string;
  };
  is_verified: boolean;
  did_user_get_it_right?: boolean;
}

export interface RetrieveParams {
  processGroup: string;
  knowledgeArea: string;
  tool: string;
  count?: number;
} 