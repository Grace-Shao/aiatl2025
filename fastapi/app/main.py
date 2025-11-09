from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(
    title="HypeZone's API",
    description="Backend Documentation"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.get("/", summary="Root Endpoint")
def read_root():
    """
    Root endpoint to verify the API is running.
    """
    return {"message": f"Welcome to HypeZone API!"}
