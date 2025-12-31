from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx

app = FastAPI()

NEXTJS_URL = "http://localhost:3000"

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_to_nextjs(request: Request, path: str):
    """Proxy all requests to Next.js"""
    try:
        async with httpx.AsyncClient() as client:
            # Build the target URL
            url = f"{NEXTJS_URL}/{path}"
            if request.query_params:
                url += f"?{request.query_params}"
            
            # Get request body if present
            body = None
            if request.method in ["POST", "PUT", "PATCH"]:
                body = await request.body()
            
            # Forward headers (except host)
            headers = dict(request.headers)
            headers.pop("host", None)
            
            # Make the proxied request
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                timeout=30.0
            )
            
            # Return the response
            return JSONResponse(
                content=response.json() if response.headers.get("content-type", "").startswith("application/json") else {"message": response.text},
                status_code=response.status_code,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Headers": "*"
                }
            )
    except httpx.HTTPError as e:
        return JSONResponse(
            content={"error": f"Proxy error: {str(e)}"},
            status_code=502
        )
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=500
        )

@app.get("/")
async def root():
    return {"status": "ok", "message": "Backend proxy to Next.js"}
