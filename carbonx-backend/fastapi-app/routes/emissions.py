from fastapi import APIRouter, HTTPException
from models import Emission
from utils import crypto, openlca_client
from db import get_connection
import subprocess, json

router = APIRouter(prefix="/emissions", tags=["Emissions"])

@router.post("/submit")
def submit_emission(data: Emission):
    try:
        conn = get_connection()
        cur = conn.cursor()
        encrypted = crypto.encrypt_value(str(data.value))
        cur.execute("""
            INSERT INTO emissions (company_id, category, emission_value)
            VALUES (%s, %s, %s)
        """, (data.company_id, data.category, encrypted))
        conn.commit()
        conn.close()
        return {"status": "success", "message": "Emission data stored securely."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/aggregate")
def aggregate():
    try:
        result = subprocess.run(
            ["java", "-jar", "/fresco-smpc/target/fresco-smpc.jar"],
            capture_output=True, text=True
        )
        return json.loads(result.stdout)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Aggregation failed: {e}")

@router.get("/openlca/{category}")
def get_lca_data(category: str):
    return openlca_client.get_emission_factor(category)
