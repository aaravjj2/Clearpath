#!/usr/bin/env python3
"""
Seed script: POST example documents to the ClearPath API for dev testing.

Usage:
    cd backend && python scripts/seed_example.py
"""

import httpx
import sys

BASE_URL = "http://localhost:8000"

EXAMPLES = [
    {
        "name": "Sample Lease Agreement",
        "text": (
            "1. Rent. Tenant shall pay Landlord $1,500/month on the 1st.\n"
            "2. Early Termination. Tenant forfeits all deposits and owes remaining rent.\n"
            "3. Landlord Entry. Landlord may enter without notice at any time.\n"
            "4. Maintenance. Tenant responsible for all structural repairs over $500."
        ),
    },
    {
        "name": "Employment Contract",
        "text": (
            "1. Non-Compete. Employee agrees not to work for any competitor globally for 5 years.\n"
            "2. At-Will. Employment may be terminated at any time without notice or reason.\n"
            "3. IP Assignment. All IP created at any time belongs exclusively to Employer."
        ),
    },
]


def main() -> None:
    for example in EXAMPLES:
        print(f"Uploading: {example['name']}")
        resp = httpx.post(
            f"{BASE_URL}/api/documents/upload",
            data={"text": example["text"]},
            timeout=30,
        )
        if resp.status_code == 200:
            doc_id = resp.json()["document_id"]
            print(f"  ✓ document_id={doc_id}")
            print(f"    Analysis: {BASE_URL}/api/documents/{doc_id}/stream")
        else:
            print(f"  ✗ Error {resp.status_code}: {resp.text}", file=sys.stderr)


if __name__ == "__main__":
    main()
