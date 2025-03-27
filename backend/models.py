from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError

class UserManager(BaseUserManager):
    # Custom user manager to use email as the unique identifier instead of username

    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
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

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, first_name, last_name, password, **extra_fields)


class User(AbstractUser):
    username = None  
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def __str__(self):
        return f"{self.first_name} {self.last_name}" if self.first_name else self.email

    def get_organized_events(self):
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
        max_length=10,
        choices=EVENT_TYPES,
        default="in_person"
    )
    location = models.CharField(max_length=255, blank=True, null=True)
    virtual_location = models.URLField(blank=True, null=True)

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
        self.attendees.remove(user)

    def is_organizer(self, user):
        return self.organizers.filter(id=user.id).exists()

    def is_speaker(self, user):
        return self.speakers.filter(id=user.id).exists()

    def is_attendee(self, user):
        return self.attendees.filter(id=user.id).exists()

    def clean(self):
        """Ensure correct fields are filled based on event type."""
        if self.event_type == "virtual" and not self.virtual_location:
            raise ValidationError({
                "virtual_location": "A virtual event must have a virtual location (e.g., Zoom link)."
            })
        if self.event_type == "in_person" and not self.location:
            raise ValidationError({
                "location": "An in-person event must have a physical location."
            })
        if self.event_type == "hybrid" and (not self.location or not self.virtual_location):
            raise ValidationError(
                "A hybrid event must have both a physical and virtual location."
            )

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()})"
