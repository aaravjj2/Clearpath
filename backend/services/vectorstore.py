from typing import List

import chromadb
from chromadb.utils import embedding_functions

# In-memory for hackathon; swap to PersistentClient for production
client = chromadb.Client()


def get_or_create_collection(document_id: str):
    return client.get_or_create_collection(
        name=f"doc_{document_id}",
        embedding_function=embedding_functions.DefaultEmbeddingFunction()
    )


def index_document(document_id: str, clauses_text: List[str], clause_ids: List[str]) -> None:
    if not clauses_text or not clause_ids:
        return
    collection = get_or_create_collection(document_id)
    collection.add(documents=clauses_text, ids=clause_ids)


def query_document(document_id: str, query: str, n_results: int = 3) -> List[str]:
    collection = get_or_create_collection(document_id)
    results = collection.query(query_texts=[query], n_results=n_results)
    docs = results.get("documents", [])
    return docs[0] if docs else []
