# backend/management/commands/send_event_reminders.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from backend.models import Event
from datetime import timedelta

class Command(BaseCommand):
    help = 'Send email reminders for upcoming events'

    def handle(self, *args, **kwargs):
        now = timezone.now()
        # Define the reminder window (e.g., events starting in the next 24 hours)
        reminder_time = now + timedelta(hours=24)
        upcoming_events = Event.objects.filter(date__gte=now, date__lte=reminder_time)

        for event in upcoming_events:
            for attendee in event.attendees.all():
                subject = f"Reminder: {event.title} is coming up soon!"
                message = (
                    f"Hello {attendee.first_name},\n\n"
                    f"This is a reminder for the event '{event.title}' happening on {event.date}.\n\n"
                    "We look forward to seeing you there!\n\n"
                    "Best regards,\n"
                    "No Reply"
                )
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [attendee.email],
                    fail_silently=False,
                )
        self.stdout.write(self.style.SUCCESS("Event reminders sent successfully."))
