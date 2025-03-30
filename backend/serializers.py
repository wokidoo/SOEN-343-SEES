from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event, EventNotification  #for Event model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone']
        read_only_fields = ['id']

# Serializer for the Event model
class EventSerializer(serializers.ModelSerializer):
    has_unread_update = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = '__all__'  # includes has_unread_update

    def get_has_unread_update(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return EventNotification.objects.filter(user=user, event=obj, is_viewed=False).exists()

