from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone']
        read_only_fields = ['id']

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
        # or specify fields = ['id', 'title', 'description', 'date', 'event_type', ...]
