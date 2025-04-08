from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Event, EventNotification

@receiver(post_save, sender=Event)
def mark_event_as_unviewed_for_attendees(sender, instance, created, **kwargs):
    if not created:
        for attendee in instance.attendees.all():
            EventNotification.objects.update_or_create(
                user=attendee,
                event=instance,
                defaults={"is_viewed": False},
            )

@receiver(m2m_changed, sender=Event.attendees.through)
def send_event_join_email(sender, instance, action, pk_set, **kwargs):
    if action == "post_add" and pk_set:
        print("m2m_changed signal triggered for attendees:", pk_set)  # Debug print
        for user_id in pk_set:
            try:
                user = instance.attendees.get(pk=user_id)
            except Exception as e:
                print("Error retrieving attendee:", e)
                continue
            subject = f"You're registered for {instance.title}"
            message = (
                f"Hello {user.first_name},\n\n"
                f"Thank you for joining the event '{instance.title}' scheduled on {instance.date}.\n\n"
                "We look forward to your participation! After the event, please use the following link to fill out our feedback questionnaire: "
                "<feedback_link_here>\n\n"
                "Best regards,\n"
                "No Reply"
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )