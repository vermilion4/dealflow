import json
import re
import httpx
from app.config import settings


class AiriaClient:
    """Direct HTTP wrapper for the Airia pipeline execution API."""

    def __init__(self):
        self.api_key = settings.AIRIA_API_KEY
        self.base_url = settings.AIRIA_BASE_URL.rstrip("/")

    async def execute_pipeline(
        self,
        pipeline_id: str,
        user_input: str,
    ) -> dict:
        """Execute an Airia pipeline and return the parsed result."""
        url = f"{self.base_url}/v1/PipelineExecution/{pipeline_id}"

        payload = {
            "userInput": user_input,
        }

        headers = {
            "X-API-Key": self.api_key,
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()

        # The SDK returns .result, the raw API returns "result" key
        output = result.get("result", result.get("output", ""))

        # If output is a RAG chunks dict (Data Store connected to Output instead
        # of AI Model), try to find the actual AI output in other response fields
        if isinstance(output, dict) and "Chunks" in output:
            # Look for the AI model's text output in alternative fields
            for key in ("content", "response", "message", "text", "answer"):
                alt = result.get(key)
                if alt and isinstance(alt, str):
                    output = self._extract_json(alt)
                    break
            # If we still have chunks, keep them (pipeline misconfiguration)

        if isinstance(output, str):
            output = self._extract_json(output)

        return {
            "raw_response": result,
            "output": output,
            "execution_id": result.get("executionIdentifier", ""),
        }

    @staticmethod
    def _extract_json(text: str):
        """Extract JSON from AI responses that may include preamble text and code fences."""
        # Try 1: Extract JSON from ```json ... ``` code block
        match = re.search(r"```(?:json)?\s*\n([\s\S]*?)\n```", text)
        if match:
            try:
                return json.loads(match.group(1))
            except (json.JSONDecodeError, TypeError):
                pass

        # Try 2: Find first { ... } or [ ... ] block in the text
        for start_char, end_char in [("{", "}"), ("[", "]")]:
            start = text.find(start_char)
            if start == -1:
                continue
            depth = 0
            for i in range(start, len(text)):
                if text[i] == start_char:
                    depth += 1
                elif text[i] == end_char:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start:i + 1])
                        except (json.JSONDecodeError, TypeError):
                            break

        # Try 3: Direct parse of the whole string
        try:
            return json.loads(text.strip())
        except (json.JSONDecodeError, TypeError):
            return text


airia_client = AiriaClient()
