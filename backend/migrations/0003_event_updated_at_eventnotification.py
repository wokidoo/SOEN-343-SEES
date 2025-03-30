# Generated by Django 5.1.6 on 2025-03-30 23:17

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('backend', '0002_alter_event_attendees_alter_event_organizers_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.CreateModel(
            name='EventNotification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_viewed', models.BooleanField(default=False)),
                ('notified_at', models.DateTimeField(auto_now_add=True)),
                ('event', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='backend.event')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'unique_together': {('user', 'event')},
            },
        ),
    ]
