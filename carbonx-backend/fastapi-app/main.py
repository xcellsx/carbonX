from fastapi import FastAPI
from routes import emissions
from db import create_tables

app = FastAPI(title="CarbonX Backend API", version="1.0")

app.include_router(emissions.router)

@app.on_event("startup")
def startup():
    create_tables()

@app.get("/")
def root():
    return {"message": "? CarbonX Backend Running (FastAPI + FRESCO + MySQL)"}
