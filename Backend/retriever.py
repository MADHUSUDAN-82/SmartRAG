from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from utils import extract_pdf_text


def chunk_text(text: str, chunk_size=1200, chunk_overlap=200):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    chunks = splitter.split_text(text)
    return [c for c in chunks if c.strip()]


def build_bm25_retriever(chunks):
    docs = [Document(page_content=c) for c in chunks]
    return BM25Retriever.from_documents(docs)


def initialize_retriever(file_path: str):
    text = extract_pdf_text(file_path)
    chunks = chunk_text(text)
    return build_bm25_retriever(chunks)


def query_retriever(retriever, query, top_k):
    retriever.k = top_k
    results = retriever.invoke(query)
    return [doc.page_content for doc in results]