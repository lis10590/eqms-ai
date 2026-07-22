from google import genai

# Make sure your GEMINI_API_KEY environment variable is set
client = genai.Client(api_key="AQ.Ab8RN6LlJyxwszBgGTDJy4F0JAqOtlLzQdaQ2bxwWKxvXEFVqQ")

print("Available Models for Generate Content:")
for model in client.models.list():
    # Filter to show only models that support content generation
    if 'generateContent' in model.supported_actions:
        print(model.name)