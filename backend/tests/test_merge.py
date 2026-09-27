from fastapi.testclient import TestClient
import os
import pymupdf
from app.main import app

client = TestClient(app)

def test_merge_endpoint():
    # Make sure test files exist
    assert os.path.exists('test1.pdf')
    assert os.path.exists('test2.pdf')
    
    with open('test1.pdf', 'rb') as f1, open('test2.pdf', 'rb') as f2:
        response = client.post(
            "/api/v1/merge/",
            files=[
                ("files", ("test1.pdf", f1, "application/pdf")),
                ("files", ("test2.pdf", f2, "application/pdf")),
            ]
        )
        
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    
    # Save output to check
    with open("output_test.pdf", "wb") as out_f:
        out_f.write(response.content)
        
    # Check page count
    doc = pymupdf.open("output_test.pdf")
    assert doc.page_count == 2
    doc.close()
