import csv
import re
from collections import defaultdict

# ------------------------------
# Load data from CSV files
# ------------------------------

STUDENT_FILE = "dataset/student_data.csv"
COURSE_FILE = "dataset/course_data.csv"
UNIVERSITY_FILE = "dataset/university_data.csv"

students_by_name = {}
students_by_id = {}
students_by_department = defaultdict(list)
courses_by_dept = defaultdict(list)
university_info = {}

def load_courses():
    """Load courses from course_data.csv"""
    with open(COURSE_FILE, newline="", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if not row or len(row) < 4:
                continue
            name, code, number, url = [col.strip() for col in row]
            # Department prefix from course code (e.g. CSE201 -> CSE)
            dept_prefix = ""
            for ch in code:
                if ch.isdigit():
                    break
                dept_prefix += ch
            dept_prefix = dept_prefix.upper()

            course = {
                "name": name,
                "code": code,
                "number": number,
                "url": url,
                "dept": dept_prefix,
            }
            courses_by_dept[dept_prefix].append(course)

def load_students():
    """Load students from student_data.csv"""
    with open(STUDENT_FILE, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["name"].strip()
            sid = row["id"].strip()
            mail = row["mail"].strip()
            dept = row.get("department", "").strip().upper()
            advisor = row.get("advisor", "").strip()

            student = {
                "name": name,
                "id": sid,
                "mail": mail,
                "department": dept,
                "advisor": advisor,
                # courses added after courses are loaded
                "courses": []
            }

            key_name = name.lower()
            students_by_name[key_name] = student
            students_by_id[sid.upper()] = student
            if dept:
                students_by_department[dept].append(student)

def assign_courses_to_students():
    """
    Simple rule:
    - Each student gets all the courses of their department.
    (Good enough for demo and keeps logic very simple.)
    """
    for student in students_by_name.values():
        dept = student["department"]
        student["courses"] = list(courses_by_dept.get(dept, []))

def load_university():
    """Load university name + URL (currently just Bennett University)"""
    try:
        with open(UNIVERSITY_FILE, newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or len(row) < 2:
                    continue
                name, url = [col.strip() for col in row]
                university_info["name"] = name
                university_info["url"] = url
                break
    except FileNotFoundError:
        university_info["name"] = "the university"
        university_info["url"] = ""

# Load everything at startup
load_courses()
load_students()
assign_courses_to_students()
load_university()

# ------------------------------
# Helper functions
# ------------------------------

def normalise_name(text: str) -> str:
    return text.strip().lower()

def find_student(name_or_id: str):
    """Try to find student by full name or ID like S01."""
    name_or_id = name_or_id.strip()
    if not name_or_id:
        return None

    # Try ID first (e.g., S01)
    sid = name_or_id.upper()
    if sid in students_by_id:
        return students_by_id[sid]

    # Then by name
    key_name = name_or_id.lower()
    return students_by_name.get(key_name)

def map_department_name(raw: str) -> str:
    """Map user phrases to department codes like CSE, AIML, etc."""
    raw = raw.strip().lower()
    if raw in ["cse", "computer science", "computer science & engineering",
               "computer science and engineering"]:
        return "CSE"
    if raw in ["aiml", "ai", "ai & ml", "artificial intelligence", "artificial intelligence & machine learning"]:
        return "AIML"
    if raw in ["ece", "electronics", "electronics and communication",
               "electronics & communication engineering"]:
        return "ECE"
    if raw in ["bca", "computer applications", "bachelor of computer applications"]:
        return "BCA"
    if raw in ["me", "mechanical", "mechanical engineering"]:
        return "ME"
    return raw.upper()

def format_student_details(student):
    lines = [
        f"Student: {student['name']} ({student['id']})",
        f"Department: {student['department']}",
        f"Email: {student['mail']}",
    ]
    if student.get("advisor"):
        lines.append(f"Advisor: {student['advisor']}")
    return "\n".join(lines)

def format_courses_list(courses, header=None):
    if not courses:
        return "No courses found."
    lines = []
    if header:
        lines.append(header)
    for c in courses:
        lines.append(f"- {c['name']} ({c['code']})")
    return "\n".join(lines)

# ------------------------------
# Chatbot class
# ------------------------------

class eliza:
    def __init__(self):
        pass

    def respond(self, text: str) -> str:
        text = text.strip()
        if not text:
            return "Please type a question about students, courses or departments."

        low = text.lower()

        if low == "quit":
            return "Thank you for your questions. Goodbye!"

        # 1) Student ID query
        m = re.search(r"what is the student id of (.+)", low)
        if m:
            name = m.group(1).strip(" ?.")
            student = find_student(name)
            if not student:
                return f"I couldn't find any student named '{name}'."
            return f"Student: {student['name']}\nStudent ID: {student['id']}"

        # 2) Advisor of student
        m = re.search(r"who is the advisor of (.+)", low)
        if m:
            name_or_id = m.group(1).strip(" ?.")
            student = find_student(name_or_id)
            if not student:
                return f"I couldn't find any student matching '{name_or_id}'."
            if not student.get("advisor"):
                return f"No advisor information found for {student['name']}."
            return f"Student: {student['name']} ({student['id']})\nAdvisor: {student['advisor']}"

        # 3) Courses taken by a student
        m = re.search(r"which courses does (.+) take", low)
        if not m:
            m = re.search(r"which courses did (.+) take", low)
        if m:
            name_or_id = m.group(1).strip(" ?.")
            student = find_student(name_or_id)
            if not student:
                return f"I couldn't find any student matching '{name_or_id}'."
            if not student["courses"]:
                return f"No course information found for {student['name']}."
            header = f"Courses for {student['name']} ({student['id']}):"
            return format_student_details(student) + "\n" + format_courses_list(student["courses"], header)

        # 4) Students in a department
        m = re.search(r"show students in (.+) department", low)
        if not m:
            m = re.search(r"list students in (.+) department", low)
        if m:
            dept_raw = m.group(1).strip(" ?.")
            dept_code = map_department_name(dept_raw)
            students = students_by_department.get(dept_code, [])
            if not students:
                return f"No students found in department '{dept_raw}'."
            lines = [f"Students in {dept_code} department:"]
            for s in students:
                lines.append(f"- {s['name']} ({s['id']})")
            return "\n".join(lines)

        # 5) Courses offered by a department
        m = re.search(r"list courses offered by (.+) department", low)
        if not m:
            m = re.search(r"which courses are offered by (.+) department", low)
        if m:
            dept_raw = m.group(1).strip(" ?.")
            dept_code = map_department_name(dept_raw)
            courses = courses_by_dept.get(dept_code, [])
            if not courses:
                return f"No courses found for department '{dept_raw}'."
            header = f"Courses offered by {dept_code} department:"
            return format_courses_list(courses, header)

        # 6) University info
        if "which university" in low or "what is the university" in low:
            if university_info:
                name = university_info.get("name", "the university")
                url = university_info.get("url", "")
                if url:
                    return f"University: {name}\nWebsite: {url}"
                return f"University: {name}"
            return "University information is not available."

        # Fallback
        return (
            "I can help with questions related to Bennett University. "
            "Ask me about admissions, programs, fees, hostels, scholarships, placements or campus life."
        )



# ------------------------------
# Command-line interface
# ------------------------------

def command_interface():
    print('-' * 100)
    uni_name = university_info.get("name", "the University")
    print(f"Welcome to the {uni_name} Chatbot! Type your questions, or 'quit' to exit.")
    print('-' * 100)

    bot = eliza()
    while True:
        try:
            s = input('> ').strip()
        except EOFError:
            break

        if not s:
            print("Please enter a question or type 'quit' to exit.")
            continue

        response = bot.respond(s)
        print(response)
        if s.lower() == "quit":
            break

if __name__ == "__main__":
    command_interface()
