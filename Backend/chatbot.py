import os
import re
import shutil
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List
from dotenv import load_dotenv
# from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings,ChatGoogleGenerativeAI
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, START, END
from typing import TypedDict
from langchain_community.vectorstores import FAISS
from retriever import initialize_retriever, query_retriever
# from langchain_openai import ChatOpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.tools.tavily_search import TavilySearchResults
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://smart-rag.vercel.app"],  # ya frontend URL do
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PDF_PATH = "CSEIT261277.pdf"
# PDF_PATH = "book2.pdf"

UPLOAD_DIR = "uploaded_pdfs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
# -------------------------------
# GLOBAL INIT
# -------------------------------
retriever = None
faiss_cache = {}
chat_history = []
current_pdf_path = None

# embeddings = HuggingFaceEmbeddings(
#     model_name="sentence-transformers/all-MiniLM-L6-v2"
# )
embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")

# -------------------------------
# REQUEST MODEL
# -------------------------------
class ChatRequest(BaseModel):
    query: str

# llm = ChatOpenAI(
#     base_url="https://openrouter.ai/api/v1",
#     api_key=os.getenv("OPENROUTER_API_KEY"),
#     model="openai/gpt-4o-mini",
#     temperature=0
# )

llm = ChatGoogleGenerativeAI(model="models/gemini-2.5-flash",temperature = 0)

def split_chunks(text_chunks: list[str],chunk_size: int = 400,chunk_overlap: int = 80) -> list[str]:
    """
    Split BM25 retrieved chunks into smaller chunks
    for FAISS embedding + semantic search.

    Args:
        text_chunks: BM25 retrieved large chunks 
        chunk_size: Size of semantic chunks
        chunk_overlap: Overlap between chunks

    Returns:
        List of smaller semantic chunks
    """

    if not text_chunks:
        return []

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        is_separator_regex=False,
    )

    # combine BM25 chunks
    combined_text = "\n\n".join(text_chunks)

    # split into smaller chunks
    chunks = splitter.split_text(combined_text)

    # remove empty chunks
    chunks = [chunk.strip() for chunk in chunks if chunk.strip()]

    return chunks

# -------------------------------
# INIT (RUN ONCE)
# -------------------------------

graph = None

def initialize(pdf_path: str):
    global retriever, graph, current_pdf_path

    retriever = initialize_retriever(pdf_path)
    graph = build_graph()
    current_pdf_path = pdf_path


# @app.on_event("startup")
# def startup_event():
#     initialize()


# -------------------------------
# STATE
# -------------------------------
class ChatState(TypedDict):
    original_query: str
    rewritten_query: str
    intent: str
    context: str
    response: str
    chat_history: List[dict]

# -------------------------------
# LIGHT CONTEXT REFINEMENT
# -------------------------------
def light_refine_chunks(chunks: List[str],min_sentence_length: int = 5) -> List[str]:

    refined_chunks = []

    for chunk in chunks:

        # normalize spaces
        chunk = re.sub(r"\s+", " ", chunk).strip()

        # split into sentences
        sentences = re.split(
            r"(?<=[.!?])\s+",
            chunk
        )

        cleaned_sentences = []
        seen = set()

        for sentence in sentences:

            sentence = sentence.strip()

            # remove tiny/noisy sentences
            if len(sentence) < min_sentence_length:
                continue

            # remove duplicate sentences
            normalized = sentence.lower()

            if normalized in seen:
                continue

            seen.add(normalized)

            cleaned_sentences.append(sentence)

        # reconstruct chunk
        refined_chunk = " ".join(cleaned_sentences).strip()

        if refined_chunk:
            refined_chunks.append(refined_chunk)

    return refined_chunks

# -------------------------------
# Rewrite Query
# -------------------------------
def rewrite_query(state: ChatState) -> ChatState:

    original_query = state["original_query"]

    prompt = ChatPromptTemplate.from_template("""
        You are an intelligent conversational query rewriting system for RAG retrieval.

        Your tasks:

        1. Rewrite the user's latest query into a COMPLETE STANDALONE QUERY
        2. Use chat history when necessary
        3. Resolve references like:
        - it
        - they
        - this
        - that
        - these
        - its
        4. Correct spelling mistakes
        5. Fix typing errors
        6. Expand ONLY common casual abbreviations:
        - b/w → between
        - diff → difference
        - abt → about
        7. Remove unnecessary filler words
        8. Preserve technical terms
        9. Preserve original meaning
        10. Detect user intent

        INTENT TYPES:
        - qa
        - generation

        Generation means:
        - quizzes
        - MCQs
        - notes
        - assignments
        - summaries
        - question generation

        IMPORTANT:
        - For generation queries:
        rewrite ONLY the actual topic for retrieval

        Examples:

        Chat:
        User: what is gradient descent

        Current Query:
        how it is used to optimize algorithm

        Output:
        QUERY: how is gradient descent used to optimize algorithm
        INTENT: qa

        ---

        Chat:
        User: explain neural networks

        Current Query:
        what are its advantages

        Output:
        QUERY: what are advantages of neural networks
        INTENT: qa

        ---

        Chat:
        User: create mcq on linear regression

        Current Query:
        generate 10 questions

        Output:
        QUERY: linear regression
        INTENT: generation

        ---

        Chat:
        User: diff bitween inference in lds and learning in lds

        Output:
        QUERY: difference between inference in lds and learning in lds
        INTENT: qa

        Return ONLY in this exact format:

        QUERY: <rewritten query>
        INTENT: <qa or generation>

        Chat History:
        {chat_history}

        Current Query:
        {query}
        """
    )

    chain = prompt | llm

    response = chain.invoke({
        "query": original_query,
        "chat_history": format_chat_history(
            state.get("chat_history", [])
        )
    })

    text = response.content.strip()

    query_match = re.search(r"QUERY:\s*(.*)", text)
    intent_match = re.search(r"INTENT:\s*(.*)", text)

    rewritten_query = (
        query_match.group(1).strip()
        if query_match else original_query
    )

    intent = (
        intent_match.group(1).strip().lower()
        if intent_match else "qa"
    )

    state["rewritten_query"] = rewritten_query
    state["intent"] = intent

    return state

# -------------------------------
# TAVILY WEB SEARCH TOOL
# -------------------------------
web_search_tool = TavilySearchResults(
    max_results=3
)

# -------------------------------
# WEB SEARCH
# -------------------------------
def search_web(query: str) -> str:

    try:

        results = web_search_tool.invoke({
            "query": query
        })

        web_contexts = []

        for r in results:

            content = r.get("content", "")

            if content:
                web_contexts.append(content)

        return "\n\n".join(web_contexts)

    except Exception as e:

        print("Web Search Error:", e)

        return ""
    
# -------------------------------
# FORMAT CHAT HISTORY
# -------------------------------
def format_chat_history(
    chat_history: List[dict],
    max_turns: int = 5
) -> str:
    """
    Convert recent conversation turns into text
    for prompt injection.
    """

    if not chat_history:
        return ""

    recent_turns = chat_history[-max_turns:]
    lines = []

    for turn in recent_turns:
        lines.append(f"User: {turn['user']}")
        lines.append(f"Assistant: {turn['assistant']}")

    return "\n".join(lines)


# -------------------------------
# MAIN RAG LOGIC
# -------------------------------
def chat_node(state: ChatState) -> ChatState:
    original_query = state["original_query"]

    query = state["rewritten_query"] or state["original_query"]

    intent = state["intent"]

    # Memory
    chat_history = state.get("chat_history", [])
    history_text = format_chat_history(chat_history)

    #BM25 (fast filter)
    bm25_chunks = query_retriever(retriever, query, top_k=15)

    # light refinement before embeddings
    bm25_chunks = light_refine_chunks(bm25_chunks)
    

    if not bm25_chunks:
        return {
            "original_query": original_query,
            "rewritten_query": query,
            "intent": intent,
            "context": "",
            "response": "I don't know",
            "chat_history": state.get("chat_history", [])
        }
    

    # CACHE KEY
    key = hash("".join(bm25_chunks))

    if key in faiss_cache:
        faiss_store = faiss_cache[key]
    else:
        docs = [Document(page_content=c) for c in bm25_chunks]
        faiss_store = FAISS.from_documents(docs, embeddings)
        # faiss_store.save_local("FAISS_DB")
        # print(docs)
        faiss_cache[key] = faiss_store

    # Semantic search
    results = faiss_store.similarity_search(query,k=5)
    local_context = "\n\n".join([doc.page_content for doc in results])

    web_context = ""

    if not results or len(results) < 2:
        print("\n[Fallback Web Search Enabled]\n")
        web_context = search_web(original_query)

    parts = []

    if local_context:
        parts.append("LOCAL:\n" + local_context)

    if web_context:
        parts.append("WEB:\n" + web_context)

    context = "\n\n".join(parts)
       

    # -------------------------------
    # GENERATION PROMPT
    # -------------------------------
    if intent == "generation":

        prompt = ChatPromptTemplate.from_template(
        """
        You are a helpful AI assistant.

        Your task is to generate content
        STRICTLY using the provided context.

        IMPORTANT RULES:
        - Use ONLY the information available
        in the provided context.
        - Do NOT use outside knowledge.
        - Do NOT add unrelated information.
        - You MAY generate:
        - questions
        - answers
        - quizzes
        - summaries
        - notes
        - educational content
        IF they are grounded in the context.
        - Rephrase and restructure information
        naturally when needed.
        - If the context contains partial information,
        generate the best possible response
        using ONLY available information.
        - Only say:
        "I don't know based on the provided context."
        when the context is completely unrelated.

        Previous Conversation:
        {chat_history}

        Context:
        {context}

        User Request:
        {question}

        Generated Response:
        """
        )
    else:

        prompt = ChatPromptTemplate.from_template(
        """
        You are a polite and helpful AI assistant.

        Answer the question using ONLY the provided context.

        Guidelines:
        - Use ONLY the provided context.
        - Prefer LOCAL DOCUMENT CONTEXT first.
        - Use WEB SEARCH CONTEXT only if needed.
        - Do not use outside knowledge.
        - Do not make up facts.
        - Keep answers concise and natural.
        - If answer is unavailable, say:
        "I don't know based on the available information."

        Previous Conversation:
        {chat_history}

        Context:
        {context}

        Question:
        {question}

        Helpful Answer:
        """
        )

    chain = prompt | llm
    response = chain.invoke({
        "chat_history": history_text,
        "context": context,
        "question": original_query
    })
    chat_history.append({
        "user": original_query,
        "assistant": response.content
    })

    # Keep only the most recent 10 turns
    chat_history = chat_history[-10:]

    return {
        "original_query": original_query,
        "rewritten_query": query,
        "intent": intent,
        "context": context,
        "response": response.content,
        "chat_history": chat_history
    }


# -------------------------------
# GRAPH
# -------------------------------
def build_graph():
    graph = StateGraph(ChatState)
    graph.add_node("rewrite_query", rewrite_query)
    graph.add_node("chat", chat_node)
    graph.add_edge(START, "rewrite_query")
    graph.add_edge("rewrite_query", "chat")
    graph.add_edge("chat", END)
    return graph.compile()


# -------------------------------
# CHAT LOOP
# -------------------------------
def chatbot_loop():
    graph = build_graph()

    chat_history = []

    print("Chatbot Ready (type 'quit')\n")

    while True:
        query = input("You: ").strip()

        if query.lower() in ["quit", "exit"]:
            print("Goodbye!")
            break

        state = {
            "original_query": query,
            "rewritten_query": query,
            "intent": "qa",
            "context": "",
            "response": "",
            "chat_history": chat_history
        }

        # invoke graph and capture result
        result = graph.invoke(state)
        chat_history = result["chat_history"]

        # print chatbot response
        print("\nBot:", result["response"])
        print()


# -------------------------------
# RUN
# -------------------------------
if __name__ == "__main__":
    initialize()
    chatbot_loop()


@app.get("/")
def home():
    return {"message": "working"}

# -------------------------------
# CHAT ROUTE
# -------------------------------
@app.post("/chat")
def chat(request: ChatRequest):

    global chat_history, retriever

    if retriever is None:
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF first"
        )

    state = {
        "original_query": request.query,
        "rewritten_query": request.query,
        "intent": "qa",
        "context": "",
        "response": "",
        "chat_history": chat_history
    }

    result = graph.invoke(state)

    chat_history = result["chat_history"]

    return {
        "response": result["response"]
    }

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):

    global faiss_cache, chat_history

    # validate pdf
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # save path
    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    # save uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # clear old cache/history
    faiss_cache.clear()
    chat_history.clear()

    # initialize new retriever
    initialize(file_path)

    return {
        "message": "PDF uploaded successfully",
        "filename": file.filename
    }