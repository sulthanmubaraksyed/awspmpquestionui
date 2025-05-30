import json

# Valid knowledge areas and process groups
VALID_KNOWLEDGE_AREAS = [
    "Integration", "Scope", "Schedule", "Cost", "Quality",
    "Resource", "Communications", "Risk", "Procurement", "Stakeholder Management"
]

VALID_PROCESS_GROUPS = [
    "Initiating", "Planning", "Executing",
    "Monitoring and Controlling", "Closing"
]

# A mapping of tools to process group and knowledge area
tool_mapping = {
    "SWOT_analysis": ("Planning", "Risk"),
    "advertising": ("Executing", "Procurement"),
    "affinity_diagrams": ("Planning", "Scope"),
    "alternatives_analysis": ("Planning", "Scope"),
    "analogous_estimation": ("Planning", "Cost"),
    "assumption_and_constraint_analysis": ("Planning", "Scope"),
    "audits": ("Executing", "Quality"),
    "autocratic_decision_making": ("Executing", "Resource"),
    "benchmarking": ("Planning", "Quality"),
    "bidder_conferences": ("Executing", "Procurement"),
    "bottom_up_estimation": ("Planning", "Cost"),
    "brainstorming": ("Planning", "Risk"),
    "burndown_chart": ("Monitoring and Controlling", "Schedule"),
    "cause_and_effect_diagrams": ("Planning", "Quality"),
    "change_control_tools": ("Monitoring and Controlling", "Integration"),
    "check_sheets": ("Executing", "Quality"),
    "checklists": ("Executing", "Quality"),
    "claims_administration": ("Monitoring and Controlling", "Procurement"),
    "colocation": ("Executing", "Resource"),
    "communication_methods": ("Executing", "Communications"),
    "communication_skills": ("Executing", "Communications"),
    "communication_technology": ("Executing", "Communications"),
    "contracts": ("Planning", "Procurement"),
    "control_charts": ("Monitoring and Controlling", "Quality"),
    "cost_benefit_analysis": ("Planning", "Cost"),
    "critical_path_method": ("Planning", "Schedule"),
    "data_analysis": ("Monitoring and Controlling", "Integration"),
    "data_gathering": ("Planning", "Risk"),
    "delphi_technique": ("Planning", "Risk"),
    "design_for_x": ("Executing", "Quality"),
    "document_analysis": ("Planning", "Scope"),
    "earned_value_analysis": ("Monitoring and Controlling", "Cost"),
    "expected_monetary_value_analysis": ("Planning", "Risk"),
    "expert_judgment": ("Initiating", "Integration"),
    "facilitation": ("Planning", "Stakeholder Management"),
    "flowcharts": ("Planning", "Quality"),
    "group_decision_making_techniques": ("Executing", "Resource"),
    "hierarchical_charts": ("Planning", "Resource"),
    "histogram": ("Monitoring and Controlling", "Quality"),
    "independent_cost_estimates": ("Planning", "Procurement"),
    "information_radiator": ("Executing", "Communications"),
    "inspections": ("Monitoring and Controlling", "Quality"),
    "interpersonal_and_team_skills": ("Executing", "Stakeholder Management"),
    "interviews": ("Initiating", "Stakeholder Management"),
    "kanban_board": ("Executing", "Schedule"),
    "lead_and_lag": ("Planning", "Schedule"),
    "matrix_diagrams": ("Planning", "Quality"),
    "meetings": ("Initiating", "Integration"),
    "mind_mapping": ("Planning", "Scope"),
    "monte_carlo_simulation": ("Planning", "Risk"),
    "multi_criteria_decision_analysis": ("Planning", "Procurement"),
    "negotiation": ("Executing", "Resource"),
    "parametric_estimation": ("Planning", "Cost"),
    "pareto_chart": ("Monitoring and Controlling", "Quality"),
    "performance_reporting": ("Monitoring and Controlling", "Communications"),
    "performance_reviews": ("Monitoring and Controlling", "Cost"),
    "preassigned_resources": ("Planning", "Resource"),
    "probability_and_impact_matrix": ("Planning", "Risk"),
    "procurement_negotiation": ("Executing", "Procurement"),
    "product_breakdown_structure": ("Planning", "Scope"),
    "progressive_elaboration": ("Planning", "Integration"),
    "project_management_information_system": ("Executing", "Integration"),
    "raci_chart": ("Planning", "Resource"),
    "requirements_traceability_matrix": ("Planning", "Scope"),
    "reserve_analysis": ("Planning", "Cost"),
    "resource_leveling": ("Planning", "Resource"),
    "resource_smoothing": ("Planning", "Resource"),
    "responsibility_assignment_matrix": ("Planning", "Resource"),
    "risk_data_quality_assessment": ("Planning", "Risk"),
    "risk_probability_and_impact_assessment": ("Planning", "Risk"),
    "rolling_wave_planning": ("Planning", "Schedule"),
    "scatter_diagrams": ("Monitoring and Controlling", "Quality"),
    "scheduling_tools": ("Planning", "Schedule"),
    "sensitivity_analysis": ("Planning", "Risk"),
    "source_selection_analysis": ("Planning", "Procurement"),
    "stakeholder_analysis": ("Initiating", "Stakeholder Management"),
    "stakeholder_engagement_assessment_matrix": ("Monitoring and Controlling", "Stakeholder Management"),
    "tailoring": ("Initiating", "Integration"),
    "test_and_inspection_planning": ("Planning", "Quality"),
    "three_point_estimation": ("Planning", "Cost"),
    "trend_analysis": ("Monitoring and Controlling", "Cost"),
    "value_stream_mapping": ("Executing", "Quality"),
    "variance_analysis": ("Monitoring and Controlling", "Cost"),
    "virtual_teams": ("Executing", "Resource"),
    "voting": ("Planning", "Resource"),
    "work_breakdown_structure": ("Planning", "Scope"),
    "Team_Charter": ("Initiating", "Resource"),
}

# Convert to JSON structure
json_output = [
    {
        "Process Group": pg,
        "Knowledge Area": ka,
        "Tool": tool
    }
    for tool, (pg, ka) in tool_mapping.items()
]

# Save to file
with open("processGroup_knowledgeArea_ToolsMapping.json", "w") as f:
    json.dump(json_output, f, indent=2)

print("✅ JSON file 'processGroup_knowledgeArea_ToolsMapping.json' has been created.") 