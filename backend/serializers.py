from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event, EventNotification, Quiz, Question, QuestionOption, Material

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "first_name", "last_name", "phone"]
        read_only_fields = ["id"]


# Serializers for Quiz-related models
class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text', 'is_correct']


class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, required=False)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'options']
    
    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        
        for option_data in options_data:
            QuestionOption.objects.create(question=question, **option_data)
        
        return question


class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, required=False)
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'visible', 'questions']
    
    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)
        
        for question_data in questions_data:
            options_data = question_data.pop('options', [])
            question = Question.objects.create(quiz=quiz, **question_data)
            
            for option_data in options_data:
                QuestionOption.objects.create(question=question, **option_data)
        
        return quiz


class MaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = Material
        fields = ['id', 'title', 'file', 'visible']


# Event Serializer
class EventSerializer(serializers.ModelSerializer):
    has_unread_update = serializers.SerializerMethodField()
    quizzes = QuizSerializer(many=True, required=False)
    materials = MaterialSerializer(many=True, required=False)
    
    class Meta:
        model = Event
        fields = "__all__"  # includes has_unread_update, quizzes, materials
    
    def get_has_unread_update(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        return EventNotification.objects.filter(
            user=user, event=obj, is_viewed=False
        ).exists()
    
    def create(self, validated_data):
        # Extract nested data
        quizzes_data = validated_data.pop('quizzes', [])
        materials_data = validated_data.pop('materials', [])
        
        # Get organizers and speakers
        organizers_data = validated_data.pop('organizers', [])
        speakers_data = validated_data.pop('speakers', [])
        
        # Create the event
        event = Event.objects.create(**validated_data)
        
        # Add organizers and speakers
        if organizers_data:
            event.organizers.set(organizers_data)
        if speakers_data:
            event.speakers.set(speakers_data)
        
        # Create quizzes
        for quiz_data in quizzes_data:
            questions_data = quiz_data.pop('questions', [])
            quiz = Quiz.objects.create(event=event, **quiz_data)
            
            # Create questions for each quiz
            for question_data in questions_data:
                options_data = question_data.pop('options', [])
                question = Question.objects.create(quiz=quiz, **question_data)
                
                # Create options for each question
                for option_data in options_data:
                    QuestionOption.objects.create(question=question, **option_data)
        
        # Create materials
        for material_data in materials_data:
            Material.objects.create(event=event, **material_data)
        
        return event
    
    def update(self, instance, validated_data):
        # Similar to create, but handle updating existing related objects
        quizzes_data = validated_data.pop('quizzes', None)
        materials_data = validated_data.pop('materials', None)
        
        # Update basic event fields
        instance = super().update(instance, validated_data)
        
        # Update organizers and speakers if provided
        if 'organizers' in validated_data:
            instance.organizers.set(validated_data.pop('organizers'))
        if 'speakers' in validated_data:
            instance.speakers.set(validated_data.pop('speakers'))
        
        # Update quizzes if provided
        if quizzes_data is not None:
            # Option 1: Replace all quizzes
            instance.quizzes.all().delete()
            
            # Create new quizzes
            for quiz_data in quizzes_data:
                questions_data = quiz_data.pop('questions', [])
                quiz = Quiz.objects.create(event=instance, **quiz_data)
                
                for question_data in questions_data:
                    options_data = question_data.pop('options', [])
                    question = Question.objects.create(quiz=quiz, **question_data)
                    
                    for option_data in options_data:
                        QuestionOption.objects.create(question=question, **option_data)
        
        # Update materials if provided
        if materials_data is not None:
            # Option 1: Replace all materials
            instance.materials.all().delete()
            
            # Create new materials
            for material_data in materials_data:
                Material.objects.create(event=instance, **material_data)
        
        return instance