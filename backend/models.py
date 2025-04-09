from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError
    
class UserManager(BaseUserManager):
    # Custom user manager to use email as the unique identifier instead of username

    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        # Create and return a regular user with an email and password
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(
            email=email, first_name=first_name, last_name=last_name, **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self, email, first_name, last_name, password=None, **extra_fields
    ):
        """Create and return a superuser."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)

        return self.create_user(email, first_name, last_name, password, **extra_fields)


class User(AbstractUser):
    username = None  # Remove username field since we use email
    first_name = models.CharField(max_length=255)  # Required
    last_name = models.CharField(max_length=255)  # Required
    email = models.EmailField(unique=True)  # Use email as username
    phone = models.CharField(max_length=15, blank=True, null=True)  # Optional

    USERNAME_FIELD = "email"  # Set email as the unique identifier
    REQUIRED_FIELDS = ["first_name", "last_name"]  # Fields required in createsuperuser

    objects = UserManager()  # Assign the custom user manager

    def __str__(self):
        return f"{self.first_name} {self.last_name}" if self.first_name else self.email

    def get_organized_events(self):
        # Returns all events where the user is an organizer
        return self.organizers.all()

class Event(models.Model):
    EVENT_TYPES = [
        ("in_person", "In-Person"),
        ("virtual", "Virtual"),
        ("hybrid", "Hybrid"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    date = models.DateTimeField()
    event_type = models.CharField(
        max_length=10, choices=EVENT_TYPES, default="in_person"
    )
    location = models.CharField(max_length=255, blank=True, null=True)
    virtual_location = models.URLField(
        blank=True, null=True
    )  # Virtual link (Zoom, etc.)
    ticket_price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)

    # Many-to-many relationships with User for different roles
    organizers = models.ManyToManyField(User, related_name="organizers", blank=True)
    attendees = models.ManyToManyField(User, related_name="attendees", blank=True)
    speakers = models.ManyToManyField(User, related_name="speakers", blank=True)

    def add_organizer(self, user):
        self.organizers.add(user)

    def add_speaker(self, user):
        self.speakers.add(user)

    def add_attendee(self, user):
        self.attendees.add(user)

    def remove_organizer(self, user):
        self.organizers.remove(user)

    def remove_speaker(self, user):
        self.speakers.remove(user)

    def remove_attendee(self, user):
        self.speakers.remove(user)

    def is_organizer(self, user):
        return self.organizers.filter(id=user.id).exists()

    def is_speaker(self, user):
        return self.speakers.filter(id=user.id).exists()

    def is_attendee(self, user):
        return self.attendees.filter(id=user.id).exists()
    
    def add_quiz(self, title, visible=False):
        """Create and add a new quiz to this event."""
        return Quiz.objects.create(event=self, title=title, visible=visible)

    def add_material(self, title, file, visible=False):
        """Create and add a new material to this event."""
        return Material.objects.create(event=self, title=title, file=file, visible=visible)

    def clean(self):
        """Ensure correct fields are filled based on event type."""
        if self.event_type == "virtual" and not self.virtual_location:
            raise ValidationError(
                {
                    "virtual_location": "A virtual event must have a virtual location (e.g., Zoom link)."
                }
            )

        if self.ticket_price < 0:
            raise ValidationError(
                {"ticket_price": "Ticket price cannot be negative."}
            )
        
        if self.event_type == "in_person" and not self.location:
            raise ValidationError(
                {"location": "An in-person event must have a physical location."}
            )

        if self.event_type == "hybrid" and (
            not self.location or not self.virtual_location
        ):
            raise ValidationError(
                "A hybrid event must have both a physical and virtual location."
            )

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()})"


class EventNotification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    is_viewed = models.BooleanField(default=False)
    notified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "event")

# Ticket model
class Ticket(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tickets')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='tickets')
    purchase_date = models.DateTimeField(auto_now_add=True)
    is_paid = models.BooleanField(default=False)

    def __str__(self):
        return f"Ticket for {self.user.email} - {self.event.title}"
    
class Payment(models.Model):
    ticket = models.OneToOneField(Ticket, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_method = models.CharField(max_length=50)  # e.g. "credit_card", "paypal", etc.
    transaction_id = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"Payment of {self.amount} for {self.ticket}"
# Quiz-related models
class Quiz(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    visible = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.event.title}"

class Question(models.Model):
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    
    def __str__(self):
        return f"{self.question_text[:30]}..."

class QuestionOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options')
    option_text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.option_text} - {'Correct' if self.is_correct else 'Incorrect'}"

# For materials/files
class Material(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='materials')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='event_materials/')
    visible = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} - {self.event.title}"

class UserQuizResponse(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_responses')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='user_responses')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.user} - {self.quiz.title}"

class UserQuestionAnswer(models.Model):
    quiz_response = models.ForeignKey(UserQuizResponse, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.ForeignKey(QuestionOption, on_delete=models.CASCADE, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.quiz_response.user} - {self.question.question_text[:20]}"