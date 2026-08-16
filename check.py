from google import genai
import os
from dotenv import load_dotenv

# Load your .env file so the API key is available
load_dotenv()

# Initialize the new SDK client
client = genai.Client() 

print("Available models:")
# Fetch and print all available model names
for model in client.models.list():
    print(model.name)