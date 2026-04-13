from fastapi.middleware.cors import CORSMiddleware


def install_cors(app, allow_origins: list[str]):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
