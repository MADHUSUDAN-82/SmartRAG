import re
from PyPDF2 import PdfReader

def extract_pdf_text(file_path: str) -> str:
    reader = PdfReader(file_path)
    text_parts = []

    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_parts.append(text.strip())

    return "\n".join(text_parts)
