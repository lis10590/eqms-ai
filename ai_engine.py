import os
from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Literal
from dotenv import load_dotenv

# --- Load Environment Variables ---
load_dotenv() # This reads the .env file and loads the variables into the system
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 1. Define the strict JSON structure
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
    
    # --- NEW: Strict categorical decision for the eQMS workflow ---
    Required_Action: Literal["Close Deviation", "Open Investigation", "Initiate CAPA"] = Field(
        description="The definitive next step required based on the assessment."
    )
    
    Recommended_Action: str = Field(description="Specific recommendation for the correction, investigation focus, or CAPA plan.")
    Justification: str = Field(description="Explanation for the FMEA scoring.")
    
    QA_Narrative_Summary: str = Field(
        description="A cohesive, professional QA assessment paragraph summarizing the event, root cause, risk level, and justifying the Required Action."
    )

def assess_deviation(deviation_text: str, fmea_criteria_text: str) -> str:
    client = genai.Client(api_key=GEMINI_API_KEY)

    # 2. Updated System Instruction with the new logic
    system_instruction = f"""
    You are an expert Quality Assurance Specialist evaluating a deviation report.
    
    Tasks:
    1. Evaluate the FMEA criteria based on the provided scoring guidelines.
    2. Identify the most probable Root Cause using the '5 Whys' approach.
    3. Categorize the root cause appropriately.
    4. Determine the 'Required_Action' based on the rules below.
    5. Write a coherent 'QA_Narrative_Summary' paragraph written from the perspective of a QA professional.
    
    Rules for determining the 'Required_Action':
    - CLOSE DEVIATION: Choose this ONLY if the root cause is known, the incident is isolated (low Occurrence), the RPN is low (e.g., 1-10), and there is zero impact on product quality or safety. A simple correction is sufficient.
    - OPEN INVESTIGATION: Choose this if the root cause is UNKNOWN, if there is potential impact on product quality that must be assessed before closing, or if a minor deviation is showing a recurring trend that needs looking into.
    - INITIATE CAPA: Choose this if the RPN is high (e.g., 20+), the failure is a systemic issue (flawed procedure, recurring equipment failure), or it has a critical impact on product viability requiring permanent preventive changes.
    
    FMEA Scoring Criteria to use for this assessment:
    {fmea_criteria_text}
    """

    try:
            response = client.models.generate_content(
                model='gemini-flash-latest',
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
# Example Execution Block
# ==========================================
if __name__ == "__main__":
    sample_deviation = """
    Deviation Report: 
    During routine morning monitoring, the temperature in CO2 Incubator #3 (used for expanding cell cultures) 
    was recorded at 36.1°C, which is below the acceptable range of 37.0°C ± 0.5°C. The temperature drop 
    lasted for approximately 45 minutes before returning to normal parameters. The incubator door was found 
    slightly ajar. Standard daily checks are in place, and an automated continuous monitoring alarm system 
    is active but was delayed in notifying the staff.
    """

    sample_fmea_criteria = """
    Severity: 1=Negligible, 2=Minor, 3=Moderate, 4=Major (impacts product quality/viability), 5=Critical.
    Occurrence: 1=Rare, 2=Unlikely, 3=Possible (isolated incidents), 4=Likely, 5=Almost Certain.
    Detection: 1=Immediate, 2=Delayed but caught by secondary system, 3=Caught by manual check, 4=Poor, 5=Undetectable.
    """

    print("Sending deviation to Gemini for assessment...\n")
    result = assess_deviation(sample_deviation, sample_fmea_criteria)
    print(result)