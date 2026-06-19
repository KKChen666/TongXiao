"""Entry point to start the TongXiao backend server."""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

if __name__ == "__main__":
    import uvicorn
    from config import SERVER_HOST, SERVER_PORT

    # 生产环境建议 RELOAD=false，通过 docker restart 来更新
    reload = os.environ.get("RELOAD", "false").lower() == "true"

    uvicorn.run(
        "main:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=reload,
        app_dir=backend_dir,
    )
