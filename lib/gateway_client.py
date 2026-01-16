import os
import requests
import json

def gateway_client(endpoint, method="GET", headers=None, body=None, params=None):
    """
    SecureX Gateway Client (Python/Backend)
    Strictly Routes all traffic through SecureX Gateway.
    """
    api_key = os.environ.get("SECUREX_API_KEY")
    
    # HARD FAIL protection (Backend)
    if not api_key:
        raise ValueError("CRITICAL: SECUREX_API_KEY is missing! Request blocked.")

    gateway_url = "https://gateway.devlooper.co.in"
    
    # Standardize path
    path = endpoint if endpoint.startswith("/") else f"/{endpoint}"
    url = f"{gateway_url}{path}"

    if not url.startswith(gateway_url):
        raise Exception(f"Security Violation: Attempted to bypass SecureX Gateway. Target: {url}")

    request_headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }
    
    if headers:
        request_headers.update(headers)

    # Debug Log
    print(f"[SecureX Debug] Routing to: {url} (x-api-key present)")

    data_payload = None
    if body and isinstance(body, dict):
        data_payload = json.dumps(body)

    try:
        response = requests.request(
            method=method,
            url=url,
            headers=request_headers,
            data=data_payload,
            params=params,
            timeout=10 # Reasonable timeout
        )
        
        response.raise_for_status()
        return response.json()
    
    except requests.exceptions.RequestException as e:
        print(f"SecureX Gateway Request Failed: {e}")
        raise e
