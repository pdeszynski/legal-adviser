from fastapi import FastAPI

app = FastAPI(title="Legal AI Engine")

@app.get("/")
async def root():
    return {"message": "Legal AI Engine Running"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
