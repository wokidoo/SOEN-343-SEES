from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event  #for Event model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone']
        read_only_fields = ['id']

# Serializer for the Event model
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'
