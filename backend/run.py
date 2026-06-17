"""Entry point to start the TongXiao backend server."""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    import uvicorn
    from config import SERVER_HOST, SERVER_PORT
    uvicorn.run(
        "main:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=True,
        app_dir=backend_dir,
    )
