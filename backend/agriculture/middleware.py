import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log the request
        auth_header = request.headers.get('Authorization', 'None')
        print(f"👉 {request.method} {request.path}")
        print(f"   Auth Header: {auth_header}")
        
        response = self.get_response(request)
        
        return response
