from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
import logging

logger = logging.getLogger(__name__)

def send_ticket_confirmation_email(user_email, user_name, event_title, event_date, ticket_id):
    """
    Send a confirmation email to the user after successful ticket purchase
    """
    try:
        subject = f"Your Ticket Confirmation for {event_title}"
        
        # Create HTML content
        html_message = render_to_string('emails/ticket_confirmation.html', {
            'user_name': user_name,
            'event_title': event_title,
            'event_date': event_date,
            'ticket_id': ticket_id,
        })
        
        # Create plain text version
        plain_message = strip_tags(html_message)
        
        # If HTML template not found, use basic plain text
        if not html_message or html_message.strip() == '':
            plain_message = f"""
            Hello {user_name},

            Thank you for purchasing a ticket for {event_title} on {event_date}.
            
            Your ticket ID is: {ticket_id}
            
            You can view your ticket details in your account.
            
            Thank you,
            SEES Team
            """
            html_message = None
        
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
            html_message=html_message,
            fail_silently=False,
        )
        
        logger.info(f"Ticket confirmation email sent to {user_email} for event {event_title}")
        return True
    except Exception as e:
        logger.error(f"Failed to send confirmation email: {str(e)}")
        return False