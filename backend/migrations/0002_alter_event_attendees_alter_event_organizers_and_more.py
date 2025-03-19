# Generated by Django 5.1.6 on 2025-03-19 22:41

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("backend", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="event",
            name="attendees",
            field=models.ManyToManyField(
                blank=True, related_name="attendees", to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AlterField(
            model_name="event",
            name="organizers",
            field=models.ManyToManyField(
                blank=True, related_name="organizers", to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AlterField(
            model_name="event",
            name="speakers",
            field=models.ManyToManyField(
                blank=True, related_name="speakers", to=settings.AUTH_USER_MODEL
            ),
        ),
    ]
