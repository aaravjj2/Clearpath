"""
Vector store service for ClearPath using ChromaDB.

Uses in-memory ChromaDB for hackathon; swap to PersistentClient for production.
Each document gets its own collection keyed by document_id.
"""

import logging
from typing import List

import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger("clearpath.vectorstore")

# In-memory for hackathon; swap to PersistentClient for production.
# PersistentClient example:
#   client = chromadb.PersistentClient(path="./chroma_db")
client = chromadb.Client()

_DEFAULT_EF = embedding_functions.DefaultEmbeddingFunction()


def get_or_create_collection(document_id: str):
    """Get or create a ChromaDB collection for a document."""
    return client.get_or_create_collection(
        name=f"doc_{document_id}",
        embedding_function=_DEFAULT_EF,
    )


def index_document(document_id: str, clauses_text: List[str], clause_ids: List[str]) -> None:
    """Add clause texts and their IDs to the document's vector collection."""
    if not clauses_text or not clause_ids:
        logger.warning("index_document called with empty clauses for doc %s", document_id)
        return
    if len(clauses_text) != len(clause_ids):
        raise ValueError("clauses_text and clause_ids must have the same length")
    collection = get_or_create_collection(document_id)
    collection.add(documents=clauses_text, ids=clause_ids)
    logger.info("Indexed %d clauses for document %s", len(clauses_text), document_id)


def query_document(document_id: str, query: str, n_results: int = 3) -> List[str]:
    """Query the vector store; caps n_results to the actual collection size."""
    collection = get_or_create_collection(document_id)
    count = collection.count()
    if count == 0:
        return []
    safe_n = min(n_results, count)
    results = collection.query(query_texts=[query], n_results=safe_n)
    docs = results.get("documents", [])
    return docs[0] if docs else []


def delete_document(document_id: str) -> bool:
    """Delete a document's collection from the vector store. Returns True if deleted."""
    try:
        client.delete_collection(f"doc_{document_id}")
        logger.info("Deleted vector collection for document %s", document_id)
        return True
    except Exception as e:
        logger.warning("Could not delete collection for %s: %s", document_id, e)
        return False
