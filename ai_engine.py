import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Literal
from dotenv import load_dotenv

# --- Load Environment Variables ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# ==========================================
# 1. DEVIATION MODULE
# ==========================================

class QADeviationAssessment(BaseModel):
    Failure_Mode: str = Field(description="Short description of what went wrong.")
    Root_Cause_Category: Literal["Human Error", "Equipment Failure", "Process/Procedure", "Materials"] = Field(
        description="Categorize the root cause into one of these specific options."
    )
    Root_Cause: str = Field(description="Detailed explanation of the underlying root cause using the 5 Whys approach.")
    Severity: int = Field(description="Score based on FMEA criteria.")
    Occurrence: int = Field(description="Score based on FMEA criteria.")
    Detection: int = Field(description="Score based on FMEA criteria.")
    RPN: int = Field(description="Risk Priority Number (Severity * Occurrence * Detection).")
    Required_Action: Literal["Close Deviation", "Open Investigation", "Initiate CAPA"] = Field(
        description="The definitive next step required based on the assessment."
    )
    Recommended_Action: str = Field(description="Specific recommendation for the correction, investigation focus, or CAPA plan.")
    Justification: str = Field(description="Explanation for the FMEA scoring.")
    QA_Narrative_Summary: str = Field(
        description="A cohesive, professional QA assessment paragraph that MUST begin with the explicit RPN math calculation, followed by the event summary, root cause, risk level, and action justification."
    )

def assess_deviation(deviation_text: str, fmea_criteria_text: str):
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    system_instruction = f"""
    You are an expert Quality Assurance Specialist evaluating a deviation report.
    
    Tasks:
    1. Evaluate the FMEA criteria based on the provided scoring guidelines.
    2. Identify the most probable Root Cause using the '5 Whys' approach.
    3. Categorize the root cause appropriately.
    4. Determine the 'Required_Action' based on the rules below.
    5. Write a coherent 'QA_Narrative_Summary' paragraph written from the perspective of a QA professional.
    
    CRITICAL INSTRUCTION FOR 'QA_Narrative_Summary':
    You MUST begin your narrative by explicitly showing the math used to calculate the RPN. 
    Use this exact format: "RPN Calculation: Severity (X) x Occurrence (Y) x Detection (Z) = [Total]". 
    Immediately following the calculation, provide a 1-2 sentence justification explaining why you chose those specific scores based on the FMEA criteria. Then, provide the rest of your standard QA assessment summary.
    
    Rules for determining the 'Required_Action':
    - CLOSE DEVIATION: Choose this ONLY if the root cause is known, the incident is isolated (low Occurrence), the RPN is low (e.g., 1-10), and there is zero impact on product quality or safety. A simple correction is sufficient.
    - OPEN INVESTIGATION: Choose this if the root cause is UNKNOWN, if there is potential impact on product quality that must be assessed before closing, or if a minor deviation is showing a recurring trend that needs looking into.
    - INITIATE CAPA: Choose this if the RPN is high (e.g., 20+), the failure is a systemic issue (flawed procedure, recurring equipment failure), or it has a critical impact on product viability requiring permanent preventive changes.
    
    FMEA Scoring Criteria to use for this assessment:
    {fmea_criteria_text}
    """

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=deviation_text,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=QADeviationAssessment, 
                temperature=0.2, 
            ),
        )
        return response.parsed 
    except Exception as e:
        print(f"API Error: {e}")
        return None

# ==========================================
# 2. CHANGE CONTROL MODULE
# ==========================================

# Sub-model for tasks to keep the JSON output strictly structured
class ChangeTaskSchema(BaseModel):
    Domain: Literal["Documentation", "Validation", "Training", "Regulatory", "Engineering", "General"] = Field(
        description="The department or category this task belongs to."
    )
    Task_Description: str = Field(description="A clear, actionable task required to implement this change safely.")

# Main schema for the Change Control Assessment
class QAChangeControlAssessment(BaseModel):
    Enhanced_Description: str = Field(
        description="A professionally formatted, audit-ready summary of the proposed change, clearly defining Current State vs. Proposed State."
    )
    Classification: Literal["Minor", "Major", "Critical"] = Field(
        description="Risk level based on quality, process, and compliance impact."
    )
    Classification_Rationale: str = Field(
        description="Brief explanation of why this risk level was chosen, specifically mentioning regulatory or product impact."
    )
    Impact_Areas: list[str] = Field(
        description="List of specific areas affected (e.g., specific SOPs, Equipment, Environmental Monitoring, eQMS systems)."
    )
    Suggested_Tasks: list[ChangeTaskSchema] = Field(
        description="List of actionable tasks required before the change can be closed and verified."
    )

def assess_change_control(title: str, current_state: str, proposed_state: str, justification: str):
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    system_instruction = """
    You are an expert Quality Assurance AI assisting in a biotechnology and advanced biotherapy environment. 
    Evaluate the following Change Control draft. 
    
    Your task is to:
    1. Refine the user's raw input into a clear, audit-ready technical description.
    2. Assess potential risks regarding cleanroom integrity, international compliance standards (such as ISO 14644-1 and EU GMP Annex 1), and overall product quality.
    3. Categorize the change as Minor, Major, or Critical based on GxP impact.
    4. Generate a comprehensive list of actionable execution tasks to ensure compliance (e.g., SOP revisions, equipment re-qualification, personnel training).
    """

    prompt = f"""
    Title: {title}
    Current State: {current_state}
    Proposed State: {proposed_state}
    Justification: {justification}
    """

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=QAChangeControlAssessment, 
                temperature=0.2, 
            ),
        )
        return response.parsed 
    except Exception as e:
        print(f"API Error: {e}")
        return None

# ==========================================
# 3. AI ROOT CAUSE & CAPA INVESTIGATION
# ==========================================

class QAInvestigationSchema(BaseModel):
    Five_Whys: list[str] = Field(
        description="Sequential breakdown of the 5 Whys leading to the underlying systemic failure."
    )
    Root_Cause_Analysis: str = Field(
        description="Comprehensive technical Root Cause Analysis paragraph written from a Senior QA perspective."
    )
    Corrective_Actions: list[str] = Field(
        description="Immediate corrective actions to contain and remedy the active non-conformance."
    )
    Preventive_Actions: list[str] = Field(
        description="Systemic preventive actions (SOP revisions, re-qualifications, engineering controls) to prevent recurrence."
    )
    CAPA_Summary: str = Field(
        description="A cohesive, formatted CAPA summary combining corrective and preventive action steps."
    )

def generate_ai_investigation(deviation_text: str, category: str = "", qa_narrative: str = ""):
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    system_instruction = """
    You are a Principal Quality Assurance Investigator in an advanced biotherapy and biotechnology facility.
    Your objective is to conduct a formal, audit-ready Root Cause Analysis (RCA) and formulate a robust CAPA plan for a logged deviation.

    Methodology:
    1. Perform a rigorous '5 Whys' root cause breakdown moving from the observed symptom to the systemic failure.
    2. Synthesize the findings into a clear, defensible Root Cause Analysis narrative.
    3. Formulate clear Corrective Actions (immediate containment/remediation) and Preventive Actions (long-term systemic prevention).
    """

    prompt = f"""
    Deviation Description: {deviation_text}
    Assigned Category: {category}
    Initial QA Assessment: {qa_narrative}
    """

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=QAInvestigationSchema,
                temperature=0.2,
            ),
        )
        return response.parsed
    except Exception as e:
        print(f"Investigation AI Error: {e}")
        return None