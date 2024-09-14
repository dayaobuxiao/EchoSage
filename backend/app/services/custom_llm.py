from langchain.llms.base import LLM
from typing import Any, List, Optional, Dict
import requests
from pydantic import Field
import logging

class CustomAPILLM(LLM):
    api_url: str = Field(..., description="API URL for the custom LLM")
    api_key: str = Field(..., description="API key for authentication")

    def __init__(self, api_url: str, api_key: str):
        super().__init__()
        self.api_url = api_url
        self.api_key = api_key

    # def _call(self, prompt: str, stop: Optional[List[str]] = None) -> str:
    #     headers = {
    #         "Authorization": f"Bearer {self.api_key}",
    #         "Content-Type": "application/json"
    #     }
    #     data = {
    #         "model": "glm-4",
    #         "messages": [{"role": "user", "content": prompt}],
    #         "max_tokens": 4096,
    #         "stop": stop,
    #         "stream": True,
    #     }
    #     response = requests.post(self.api_url, headers=headers, json=data)
    #     if response.status_code == 200:
    #         return response.json()['choices'][0]['text'].strip()
    #     else:
    #         raise ValueError(f"Error from API: {response.text}")

    def _call(self, prompt: str, stop: Optional[List[str]] = None) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "glm-4",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 4096,
            "stop": stop,
            "stream": False,
        }
        try:
            response = requests.post(self.api_url, headers=headers, json=data)
            response.raise_for_status()

            logging.info(f"API Response: {response.text}")

            json_response = response.json()
            logging.info(f"JSON Response: {json_response}")

            if 'choices' in json_response and len(json_response['choices']) > 0:
                choice = json_response['choices'][0]
                if 'message' in choice and 'content' in choice['message']:
                    return choice['message']['content'].strip()
                elif 'text' in choice:
                    return choice['text'].strip()
                else:
                    logging.error(f"Unexpected choice structure: {choice}")
                    return "Error: Unexpected API response structure"
            else:
                logging.error(f"Unexpected API response structure: {json_response}")
                return "Error: Unexpected API response structure"
        except requests.exceptions.RequestException as e:
            logging.error(f"API request failed: {str(e)}")
            return f"Error: API request failed - {str(e)}"
        except ValueError as e:
            logging.error(f"JSON decode error: {str(e)}")
            return f"Error: Invalid JSON response - {str(e)}"
        except KeyError as e:
            logging.error(f"KeyError in API response: {str(e)}")
            return f"Error: Unexpected API response structure - {str(e)}"

    @property
    def _llm_type(self) -> str:
        return "custom_api"

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        """Get the identifying parameters."""
        return {"api_url": self.api_url}