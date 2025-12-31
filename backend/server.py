from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
import httpx

app = FastAPI()

NEXTJS_URL = "http://localhost:3000"

@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def proxy_to_nextjs(request: Request, path: str):
    """Proxy all requests to Next.js"""
    try:
        async with httpx.AsyncClient(follow_redirects=False) as client:
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
            
            # Build response headers
            resp_headers = {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Headers": "*"
            }
            
            # Forward Set-Cookie headers
            if "set-cookie" in response.headers:
                resp_headers["set-cookie"] = response.headers["set-cookie"]
            
            # Handle redirects - return them to the client with cookies
            if response.status_code in [301, 302, 303, 307, 308]:
                location = response.headers.get("location", "/")
                
                # Create redirect response
                redirect_resp = Response(
                    content=None,
                    status_code=response.status_code,
                    headers={
                        "location": location,
                        **resp_headers
                    }
                )
                
                # Copy all Set-Cookie headers
                for cookie in response.headers.get_list("set-cookie"):
                    redirect_resp.headers.append("set-cookie", cookie)
                
                return redirect_resp
            
            # Handle JSON responses
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                return JSONResponse(
                    content=response.json(),
                    status_code=response.status_code,
                    headers=resp_headers
                )
            
            # Handle other responses (HTML, etc.)
            return Response(
                content=response.content,
                status_code=response.status_code,
                media_type=content_type,
                headers=resp_headers
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
