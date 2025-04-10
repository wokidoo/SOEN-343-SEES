import os
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal
from django.utils import timezone
from django.core.files.base import ContentFile

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

# Import your models after Django setup
from django.contrib.auth import get_user_model
from backend.models import (  # Change 'app' to your app name
    Event, EventNotification, Quiz, Question, QuestionOption,
    Material, Ticket, Payment, UserQuizResponse, UserQuestionAnswer
)

User = get_user_model()

# Clear existing data (comment this out if you don't want to delete existing data)
def clear_data():
    print("Clearing existing data...")
    # Delete in reverse order of dependencies
    UserQuestionAnswer.objects.all().delete()
    UserQuizResponse.objects.all().delete()
    Payment.objects.all().delete()
    Ticket.objects.all().delete()
    QuestionOption.objects.all().delete()
    Question.objects.all().delete()
    Quiz.objects.all().delete()
    Material.objects.all().delete()
    EventNotification.objects.all().delete()
    Event.objects.all().delete()
    User.objects.exclude(is_superuser=True).delete()  # Keep superuser

# Create users
def create_users():
    print("Creating users...")
    users = []
    
    # Admin user
    admin = User.objects.create_superuser(
        email="admin@example.com",
        first_name="Admin",
        last_name="User",
        password="adminpassword123"
    )
    users.append(admin)
    
    # Regular users
    user_data = [
        {
            "email": "sarah.johnson@example.com",
            "first_name": "Sarah",
            "last_name": "Johnson",
            "password": "password123",
            "phone": "555-123-4567"
        },
        {
            "email": "michael.smith@example.com",
            "first_name": "Michael",
            "last_name": "Smith",
            "password": "password123",
            "phone": "555-987-6543"
        },
        {
            "email": "jennifer.williams@example.com",
            "first_name": "Jennifer",
            "last_name": "Williams",
            "password": "password123",
            "phone": "555-876-5432"
        },
        {
            "email": "david.brown@example.com",
            "first_name": "David",
            "last_name": "Brown",
            "password": "password123",
            "phone": "555-765-4321"
        },
        {
            "email": "lisa.davis@example.com",
            "first_name": "Lisa",
            "last_name": "Davis",
            "password": "password123",
            "phone": "555-654-3210"
        },
        {
            "email": "robert.miller@example.com", 
            "first_name": "Robert",
            "last_name": "Miller",
            "password": "password123",
            "phone": "555-543-2109"
        },
        {
            "email": "emily.wilson@example.com",
            "first_name": "Emily",
            "last_name": "Wilson",
            "password": "password123",
            "phone": "555-432-1098"
        },
        {
            "email": "james.moore@example.com",
            "first_name": "James",
            "last_name": "Moore",
            "password": "password123",
            "phone": "555-321-0987"
        },
        {
            "email": "olivia.taylor@example.com",
            "first_name": "Olivia",
            "last_name": "Taylor",
            "password": "password123",
            "phone": "555-210-9876"
        }
    ]
    
    for data in user_data:
        user = User.objects.create_user(
            email=data["email"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            password=data["password"],
            phone=data["phone"]
        )
        users.append(user)
    
    return users

# Create events
def create_events(users):
    print("Creating events...")
    events = []
    
    event_data = [
        {
            "title": "Annual Tech Conference 2025",
            "description": "Join us for the biggest tech event of the year featuring keynotes from industry leaders, hands-on workshops, and networking opportunities.",
            "date": timezone.now() + timedelta(days=30),
            "event_type": "in_person",
            "location": "Tech Convention Center, 123 Innovation Ave, San Francisco, CA",
            "virtual_location": None,
            "ticket_price": Decimal("149.99"),
            "organizers": [users[0], users[1]],
            "speakers": [users[2], users[3], users[4]],
            "attendees": [users[5], users[6], users[7], users[8]]
        },
        {
            "title": "Virtual Marketing Workshop",
            "description": "Learn the latest digital marketing strategies and tools in this interactive virtual workshop led by industry experts.",
            "date": timezone.now() + timedelta(days=15),
            "event_type": "virtual",
            "location": None,
            "virtual_location": "https://zoom.us/j/123456789",
            "ticket_price": Decimal("49.99"),
            "organizers": [users[2]],
            "speakers": [users[3]],
            "attendees": [users[0], users[4], users[5], users[6]]
        },
        {
            "title": "Hybrid Business Summit",
            "description": "A comprehensive business summit covering leadership, innovation, and growth strategies with both in-person and virtual attendance options.",
            "date": timezone.now() + timedelta(days=45),
            "event_type": "hybrid",
            "location": "Business Center, 456 Corporate Blvd, New York, NY",
            "virtual_location": "https://teams.microsoft.com/l/meetup-join/123456789",
            "ticket_price": Decimal("199.99"),
            "organizers": [users[0], users[3]],
            "speakers": [users[1], users[4], users[7]],
            "attendees": [users[2], users[5], users[6], users[8]]
        },
        {
            "title": "Free Community Networking Event",
            "description": "Connect with professionals in your community and expand your network at this casual, free event.",
            "date": timezone.now() + timedelta(days=7),
            "event_type": "in_person",
            "location": "Community Center, 789 Social St, Austin, TX",
            "virtual_location": None,
            "ticket_price": Decimal("0.00"),
            "organizers": [users[4]],
            "speakers": [users[0]],
            "attendees": [users[1], users[2], users[3], users[5], users[6], users[7], users[8]]
        },
        {
            "title": "Data Science Bootcamp",
            "description": "An intensive three-day bootcamp covering Python, data analysis, machine learning, and visualization techniques.",
            "date": timezone.now() + timedelta(days=60),
            "event_type": "hybrid",
            "location": "Learning Center, 101 Education Ave, Seattle, WA",
            "virtual_location": "https://zoom.us/j/987654321",
            "ticket_price": Decimal("299.99"),
            "organizers": [users[5], users[6]],
            "speakers": [users[0], users[2], users[8]],
            "attendees": [users[1], users[3], users[4], users[7]]
        }
    ]
    
    for data in event_data:
        event = Event.objects.create(
            title=data["title"],
            description=data["description"],
            date=data["date"],
            event_type=data["event_type"],
            location=data["location"],
            virtual_location=data["virtual_location"],
            ticket_price=data["ticket_price"]
        )
        
        # Add organizers, speakers, and attendees
        for organizer in data["organizers"]:
            event.add_organizer(organizer)
        
        for speaker in data["speakers"]:
            event.add_speaker(speaker)
        
        for attendee in data["attendees"]:
            event.add_attendee(attendee)
            
            # Create tickets for attendees
            ticket = Ticket.objects.create(
                user=attendee,
                event=event,
                is_paid=True
            )
            
            # Create payment records for paid events
            if event.ticket_price > 0:
                Payment.objects.create(
                    ticket=ticket,
                    amount=event.ticket_price,
                    payment_method='credit_card',
                    transaction_id=f"txn_{event.id}_{attendee.id}_{random.randint(100000, 999999)}"
                )
        
        events.append(event)
    
    return events

# Create notifications
def create_notifications(events, users):
    print("Creating notifications...")
    for event in events:
        for user in random.sample(list(users), k=min(3, len(users))):
            # Skip if user is already an attendee or organizer
            if event.is_attendee(user) or event.is_organizer(user):
                continue
                
            EventNotification.objects.create(
                user=user,
                event=event,
                is_viewed=random.choice([True, False])
            )

# Create quizzes
def create_quizzes(events):
    print("Creating quizzes...")
    quizzes = []
    
    quiz_data = [
        {
            "event": events[0],  # Annual Tech Conference
            "title": "Technology Trends Quiz",
            "visible": True,
            "questions": [
                {
                    "text": "Which of the following is NOT a current trend in artificial intelligence?",
                    "type": "multiple_choice",
                    "options": [
                        {"text": "Generative AI", "correct": False},
                        {"text": "Quantum Neural Networks", "correct": True},
                        {"text": "Large Language Models", "correct": False},
                        {"text": "Computer Vision", "correct": False}
                    ]
                },
                {
                    "text": "Blockchain technology is primarily used only for cryptocurrency.",
                    "type": "true_false",
                    "options": [
                        {"text": "True", "correct": False},
                        {"text": "False", "correct": True}
                    ]
                },
                {
                    "text": "Which cloud service model provides the most control over the infrastructure?",
                    "type": "multiple_choice",
                    "options": [
                        {"text": "SaaS", "correct": False},
                        {"text": "PaaS", "correct": False},
                        {"text": "IaaS", "correct": True},
                        {"text": "XaaS", "correct": False}
                    ]
                }
            ]
        },
        {
            "event": events[1],  # Virtual Marketing Workshop
            "title": "Digital Marketing Assessment",
            "visible": True,
            "questions": [
                {
                    "text": "What is the primary goal of SEO?",
                    "type": "multiple_choice",
                    "options": [
                        {"text": "Increasing paid advertising", "correct": False},
                        {"text": "Improving search engine rankings", "correct": True},
                        {"text": "Creating social media content", "correct": False},
                        {"text": "Email marketing optimization", "correct": False}
                    ]
                },
                {
                    "text": "A/B testing is a method for comparing two versions of a webpage or app to determine which performs better.",
                    "type": "true_false",
                    "options": [
                        {"text": "True", "correct": True},
                        {"text": "False", "correct": False}
                    ]
                }
            ]
        },
        {
            "event": events[4],  # Data Science Bootcamp
            "title": "Python Basics Quiz",
            "visible": True,
            "questions": [
                {
                    "text": "Which of the following is NOT a Python data type?",
                    "type": "multiple_choice",
                    "options": [
                        {"text": "List", "correct": False},
                        {"text": "Dictionary", "correct": False},
                        {"text": "Tuple", "correct": False},
                        {"text": "Array", "correct": True}
                    ]
                },
                {
                    "text": "In Python, indentation is used to define code blocks.",
                    "type": "true_false",
                    "options": [
                        {"text": "True", "correct": True},
                        {"text": "False", "correct": False}
                    ]
                },
                {
                    "text": "What function is used to get the length of a list in Python?",
                    "type": "multiple_choice",
                    "options": [
                        {"text": "size()", "correct": False},
                        {"text": "length()", "correct": False},
                        {"text": "len()", "correct": True},
                        {"text": "count()", "correct": False}
                    ]
                }
            ]
        },
        {
            "event": events[4],  # Data Science Bootcamp
            "title": "Machine Learning Concepts",
            "visible": True,
            "questions": [
                {
                    "text": "Which of the following is an unsupervised learning algorithm?",
                    "type": "multiple_choice",
                    "options": [
                        {"text": "Linear Regression", "correct": False},
                        {"text": "K-means Clustering", "correct": True},
                        {"text": "Random Forest", "correct": False},
                        {"text": "Support Vector Machines", "correct": False}
                    ]
                },
                {
                    "text": "Overfitting occurs when a model performs well on training data but poorly on new data.",
                    "type": "true_false",
                    "options": [
                        {"text": "True", "correct": True},
                        {"text": "False", "correct": False}
                    ]
                }
            ]
        }
    ]
    
    for data in quiz_data:
        quiz = Quiz.objects.create(
            event=data["event"],
            title=data["title"],
            visible=data["visible"]
        )
        
        # Create questions
        for question_data in data["questions"]:
            question = Question.objects.create(
                quiz=quiz,
                question_text=question_data["text"],
                question_type=question_data["type"]
            )
            
            # Create options
            for option_data in question_data["options"]:
                QuestionOption.objects.create(
                    question=question,
                    option_text=option_data["text"],
                    is_correct=option_data["correct"]
                )
        
        quizzes.append(quiz)
    
    return quizzes

# Create materials (dummy files)
def create_materials(events):
    print("Creating materials...")
    
    # Create a dummy PDF content (not a real PDF, just some text)
    sample_pdf_content = ContentFile(b'This is a sample PDF file content.')
    sample_presentation_content = ContentFile(b'This is a sample presentation content.')
    sample_document_content = ContentFile(b'This is a sample document content.')
    
    materials_data = [
        {
            "event": events[0],  # Annual Tech Conference
            "title": "Conference Schedule",
            "filename": "conference_schedule.pdf",
            "content": sample_pdf_content,
            "visible": True
        },
        {
            "event": events[0],  # Annual Tech Conference
            "title": "Speaker Biographies",
            "filename": "speaker_bios.pdf",
            "content": sample_pdf_content,
            "visible": True
        },
        {
            "event": events[1],  # Virtual Marketing Workshop
            "title": "Marketing Strategy Presentation",
            "filename": "marketing_strategy.pptx",
            "content": sample_presentation_content,
            "visible": True
        },
        {
            "event": events[2],  # Hybrid Business Summit
            "title": "Business Plan Template",
            "filename": "business_plan_template.docx",
            "content": sample_document_content,
            "visible": True
        },
        {
            "event": events[4],  # Data Science Bootcamp
            "title": "Python Cheat Sheet",
            "filename": "python_cheatsheet.pdf",
            "content": sample_pdf_content,
            "visible": True
        },
        {
            "event": events[4],  # Data Science Bootcamp
            "title": "Data Analysis Workbook",
            "filename": "data_analysis.xlsx",
            "content": sample_document_content,
            "visible": True
        }
    ]
    
    for data in materials_data:
        material = Material.objects.create(
            event=data["event"],
            title=data["title"],
            visible=data["visible"]
        )
        
        # Save the file
        material.file.save(data["filename"], data["content"])
    
# Create quiz responses
def create_quiz_responses(quizzes, users):
    print("Creating quiz responses...")
    
    for quiz in quizzes:
        # Get attendees of the event
        attendees = quiz.event.attendees.all()
        
        # For each attendee, create a quiz response
        for attendee in attendees:
            # Randomly decide if the user has taken the quiz
            if random.choice([True, False]):
                # Create quiz response
                response = UserQuizResponse.objects.create(
                    user=attendee,
                    quiz=quiz,
                    started_at=timezone.now() - timedelta(days=random.randint(1, 5)),
                    completed_at=timezone.now() - timedelta(days=random.randint(0, 1)),
                    score=0  # Will calculate below
                )
                
                correct_count = 0
                # Create answers for each question
                for question in Question.objects.filter(quiz=quiz):
                    # Get options for this question
                    options = QuestionOption.objects.filter(question=question)
                    
                    # Randomly select an option
                    selected_option = random.choice(list(options))
                    
                    # Create the answer
                    answer = UserQuestionAnswer.objects.create(
                        quiz_response=response,
                        question=question,
                        selected_option=selected_option,
                        is_correct=selected_option.is_correct
                    )
                    
                    if selected_option.is_correct:
                        correct_count += 1
                
                # Update the score
                total_questions = Question.objects.filter(quiz=quiz).count()
                if total_questions > 0:
                    score_percentage = int((correct_count / total_questions) * 100)
                    response.score = score_percentage
                    response.save()

# Main function to run everything
def populate_db():
    clear_data()
    users = create_users()
    events = create_events(users)
    create_notifications(events, users)
    quizzes = create_quizzes(events)
    create_materials(events)
    create_quiz_responses(quizzes, users)
    
    print("Database population completed successfully!")

if __name__ == "__main__":
    populate_db()