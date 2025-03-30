# backend/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Event, EventNotification


@receiver(post_save, sender=Event)
def mark_event_as_unviewed_for_attendees(sender, instance, created, **kwargs):
    if not created:
        for attendee in instance.attendees.all():
            EventNotification.objects.update_or_create(
                user=attendee, event=instance, defaults={"is_viewed": False}
            )
