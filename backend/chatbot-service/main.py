from fastapi import FastAPI
from pydantic import BaseModel
from chatbot import (
    load_courses,
    load_students,
    assign_courses_to_students,
    load_university,
    eliza,
)
import json
from pathlib import Path

app = FastAPI()

bot = None               # original bot (students/courses/departments)
bennett_kb = {}          # custom Bennett knowledge base (JSON)


class ChatRequest(BaseModel):
    message: str
    studentId: str | None = None


# -----------------------------
# Load Bennett knowledge
# -----------------------------
def load_bennett_kb():
    """
    Loads bennett_knowledge.json from the current directory.
    """
    global bennett_kb
    kb_path = Path(__file__).parent / "bennett_knowledge.json"
    if kb_path.exists():
        try:
            with kb_path.open("r", encoding="utf-8") as f:
                bennett_kb = json.load(f)
            print("Loaded Bennett knowledge base.")
        except Exception as e:
            print(f"Failed to load Bennett knowledge base: {e}")
            bennett_kb = {}
    else:
        print("bennett_knowledge.json not found. Running without custom KB.")
        bennett_kb = {}


# -----------------------------
# Keyword-based answers
# -----------------------------
def answer_from_bennett_kb(message: str) -> str | None:
    """
    Very simple keyword-based intent recognition.
    Returns a short direct answer string if we can handle the question here,
    otherwise returns None so we can fall back to the original chatbot.
    """
    if not bennett_kb:
        return None

    low = message.lower()

    # Admissions process / how to apply
    if any(word in low for word in ["admission", "admissions", "apply", "application", "how to get admission"]):
        if "last date" in low or "deadline" in low:
            return bennett_kb.get("admissions_last_date")
        return bennett_kb.get("admissions_process")

    # Eligibility for B.Tech
    if "eligibility" in low and any(w in low for w in ["btech", "b.tech", "engineering"]):
        return bennett_kb.get("btech_eligibility")

    # Fees for B.Tech
    if any(word in low for word in ["fee", "fees", "tuition", "cost", "college fees"]):
        if any(w in low for w in ["btech", "b.tech", "engineering"]):
            return bennett_kb.get("btech_fees")
        return bennett_kb.get("btech_fees")

    # Hostel information
    if "hostel" in low or "accommodation" in low or "room" in low:
        if "fee" in low or "fees" in low or "cost" in low:
            return bennett_kb.get("hostel_fees")
        return bennett_kb.get("hostel_info")

    # Scholarships
    if "scholarship" in low or "scholarships" in low or "financial aid" in low:
        return bennett_kb.get("scholarships")

    # Placements / packages
    if "placement" in low or "placements" in low or "package" in low or "ctc" in low or "job" in low:
        if "average" in low:
            return bennett_kb.get("average_package")
        if "highest" in low or "max" in low:
            return bennett_kb.get("highest_package")
        return bennett_kb.get("placements_overview")

    # Campus location / address
    if "where is" in low or "location" in low or "address" in low or "located" in low:
        if "bennett" in low or "university" in low or "campus" in low:
            return bennett_kb.get("campus_location")

    # Transport / how to reach
    if "how to reach" in low or "transport" in low or "bus" in low or "metro" in low:
        return bennett_kb.get("transport")

    # Student life / clubs
    if "club" in low or "clubs" in low or "student life" in low or "campus life" in low:
        return bennett_kb.get("student_life")

    # Contact admissions
    if "contact" in low and "admission" in low:
        return bennett_kb.get("contact_admissions")

    # Website
    if "website" in low or "official site" in low:
        return bennett_kb.get("website")

    return None


# -----------------------------
# Startup: load everything
# -----------------------------
@app.on_event("startup")
def startup_event():
    """
    Initialise:
    - Bennett knowledge JSON (our custom FAQs)
    - CSV-based university chatbot (students/courses/departments)
    """
    global bot
    print("Starting chatbot service...")
    load_bennett_kb()

    load_courses()
    load_students()
    assign_courses_to_students()
    load_university()
    bot = eliza()
    print("Chatbot initialised with CSV data and Bennett KB.")


# -----------------------------
# Main chat endpoint (NO escalation)
# -----------------------------
@app.post("/chat")
def chat(req: ChatRequest):
    """
    1) Try Bennett keyword-based FAQ answers.
    2) If nothing matches, fall back to the original CSV chatbot.
    3) Always return a reply; no escalation logic.
    """
    global bot
    user_msg = (req.message or "").strip()

    if not user_msg:
        return {
            "reply": "I’m a Bennett University assistant. Please type a question about admissions, fees, hostel, placements, courses or campus life.",
            "studentId": req.studentId,
        }

    # 1) Try our Bennett knowledge base (JSON)
    kb_answer = answer_from_bennett_kb(user_msg)
    if kb_answer:
        return {
            "reply": kb_answer,
            "studentId": req.studentId,
        }

    # 2) Fall back to original chatbot logic (students/courses/departments)
    reply = bot.respond(user_msg)

    return {
        "reply": reply,
        "studentId": req.studentId,
    }
