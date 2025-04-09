from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, get_user_model
from rest_framework.permissions import IsAuthenticated
from django.http import Http404
from .serializers import UserSerializer, EventSerializer, QuizSerializer, QuestionSerializer, MaterialSerializer
from .models import Event, EventNotification, Quiz, Question, QuestionOption, Material
import json

User = get_user_model()


class UserRegisterView(APIView):
    def get(self, request):
        """Return a list of all users."""
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        # Extract data from request
        email = request.data.get("email")
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        password = request.data.get("password")
        password2 = request.data.get("password2")

        # Basic validation
        if not email or not first_name or not last_name or not password:
            return Response(
                {"message": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != password2:
            return Response(
                {"message": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {"message": "Email already registered"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create user
        try:
            user = User.objects.create_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
            )
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"message": str(e)}, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.authtoken.models import Token


class UserLoginView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response(
                {"error": "Please provide both email and password"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, email=email, password=password)

        if user:
            token, _ = Token.objects.get_or_create(user=user)

            return Response(
                {
                    "token": token.key,
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )

class UserProfileView(APIView):
    """
    View to retrieve the currently authenticated user's profile
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return the authenticated user's information"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request):
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get events categorized by user role:
        - Events the user is organizing
        - Events the user is speaking at
        - Events the user is attending
        """
        user = request.user
        
        # Get events for each role category
        organized_events = Event.objects.filter(organizers=user)
        speaking_events = Event.objects.filter(speakers=user)
        attending_events = Event.objects.filter(attendees=user)
        
        # Serialize each event category
        organized_serializer = EventSerializer(organized_events, many=True, context={"request": request})
        speaking_serializer = EventSerializer(speaking_events, many=True, context={"request": request})
        attending_serializer = EventSerializer(attending_events, many=True, context={"request": request})
        
        # Return structured response with categorized events
        return Response({
            "organized_events": organized_serializer.data,
            "speaking_events": speaking_serializer.data,
            "attending_events": attending_serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new event and add current user as organizer."""
        # Make a mutable copy of the request data
        data = request.data.copy()
        
        # Ensure ticket_price is properly formatted as Decimal
        if 'ticket_price' in data:
            try:
                # Convert to Decimal to avoid floating point issues
                from decimal import Decimal
                data['ticket_price'] = Decimal(str(data['ticket_price']))
            except (ValueError, decimal.InvalidOperation):
                # Default to 0 if invalid
                data['ticket_price'] = Decimal('0.00')
        
        # Extract and process quizzes data
        quizzes_data = []
        if 'quizzes' in data:
            # Handle string JSON data (from form data)
            if isinstance(data['quizzes'], str):
                try:
                    quizzes_data = json.loads(data['quizzes'])
                except json.JSONDecodeError:
                    return Response({"error": "Invalid quiz data format"}, 
                                   status=status.HTTP_400_BAD_REQUEST)
            else:
                quizzes_data = data['quizzes']
                
        # Process materials
        materials_data = []
        if request.FILES:
            files = request.FILES.getlist('files')
            materials_meta = []
            
            # Process materials metadata if provided
            if 'materials' in data and isinstance(data['materials'], str):
                try:
                    materials_meta = json.loads(data['materials'])
                except json.JSONDecodeError:
                    return Response({"error": "Invalid materials data format"}, 
                                   status=status.HTTP_400_BAD_REQUEST)
            
            # Create materials data structure
            for i, file in enumerate(files):
                material = {
                    'file': file,
                    'title': file.name,  # Default to filename
                    'visible': False     # Default visibility
                }
                
                # Override with metadata if available
                if i < len(materials_meta):
                    if 'name' in materials_meta[i]:
                        material['title'] = materials_meta[i]['name']
                    if 'visible' in materials_meta[i]:
                        material['visible'] = materials_meta[i]['visible']
                
                materials_data.append(material)
        
        # If organizers are provided, process them
        if 'organizers' in data:
            # Convert to list if it's not already
            organizers = data.getlist('organizers') if hasattr(data, 'getlist') else data.get('organizers', [])
            
            # Convert to a set to remove duplicates
            organizer_ids = set(int(org_id) for org_id in organizers if str(org_id).isdigit())
            
            # Update the request data
            data['organizers'] = list(organizer_ids)
        
        # Create the event first without quizzes and materials
        event_data = {k: v for k, v in data.items() if k not in ['quizzes', 'materials', 'files']}
        serializer = EventSerializer(data=event_data)
        
        if serializer.is_valid():
            # Save the event
            event = serializer.save()
            
            # Add the current user as an organizer
            event.add_organizer(request.user)
            
            # Create quizzes and questions
            for quiz_data in quizzes_data:
                if not quiz_data.get('visible', False):
                    continue  # Skip quizzes marked as not visible
                    
                quiz = Quiz.objects.create(
                    event=event,
                    title=quiz_data.get('title', 'Untitled Quiz'),
                    visible=True
                )
                
                # Create questions for this quiz
                for question_data in quiz_data.get('questions', []):
                    question_type = question_data.get('type', 'multiple_choice')
                    
                    question = Question.objects.create(
                        quiz=quiz,
                        question_text=question_data.get('question', ''),
                        question_type=question_type
                    )
                    
                    # Create options based on question type
                    if question_type == 'multiple_choice':
                        options = question_data.get('options', [])
                        correct_answer_index = question_data.get('correctAnswer', 0)
                        
                        for i, option_text in enumerate(options):
                            if not option_text.strip():
                                continue  # Skip empty options
                                
                            QuestionOption.objects.create(
                                question=question,
                                option_text=option_text,
                                is_correct=(i == correct_answer_index)
                            )
                    
                    elif question_type == 'true_false':
                        correct_answer = question_data.get('correctAnswer', 0)
                        
                        # Create True option
                        QuestionOption.objects.create(
                            question=question,
                            option_text='True',
                            is_correct=(correct_answer == 0)
                        )
                        
                        # Create False option
                        QuestionOption.objects.create(
                            question=question,
                            option_text='False',
                            is_correct=(correct_answer == 1)
                        )
            
            # Create materials
            for material_data in materials_data:
                if not material_data.get('visible', False):
                    continue  # Skip materials marked as not visible
                    
                Material.objects.create(
                    event=event,
                    title=material_data.get('title', 'Untitled Material'),
                    file=material_data.get('file'),
                    visible=True
                )
            
            # Return the updated event data
            return Response(
                EventSerializer(event, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        try:
            return Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        """Return details of a specific event with quizzes and materials."""
        event = self.get_object(pk)
        serializer = EventSerializer(event, context={"request": request})
        
        # Get quizzes for this event
        quizzes = Quiz.objects.filter(event=event)
        quiz_serializer = QuizSerializer(quizzes, many=True)
        
        # Get materials for this event
        materials = Material.objects.filter(event=event)
        material_serializer = MaterialSerializer(materials, many=True)
        
        # Combine all data
        response_data = serializer.data
        response_data['quizzes'] = quiz_serializer.data
        response_data['materials'] = material_serializer.data
        
        return Response(response_data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """Update an existing event, including quizzes and materials."""
        event = self.get_object(pk)
        
        # Check if user is allowed to edit this event
        if not event.is_organizer(request.user):
            return Response(
                {"error": "Only organizers can edit this event."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Make a mutable copy of the request data
        data = request.data.copy()
        
        # Handle organizers list to ensure current user remains an organizer
        if 'organizers' in data:
            # Get the organizers from the request
            organizers = data.getlist('organizers') if hasattr(data, 'getlist') else data.get('organizers', [])
            
            # Convert to a set of integers and make sure the current user is included
            organizer_ids = set(int(org_id) for org_id in organizers if str(org_id).isdigit())
            organizer_ids.add(request.user.id)
            
            # Update the request data
            data['organizers'] = list(organizer_ids)
        
        # Update basic event information
        event_data = {k: v for k, v in data.items() if k not in ['quizzes', 'materials', 'files']}
        serializer = EventSerializer(event, data=event_data, partial=True, context={"request": request})
        
        if serializer.is_valid():
            updated_event = serializer.save()
            
            # Double-check to make sure the current user is still an organizer
            if not updated_event.is_organizer(request.user):
                updated_event.add_organizer(request.user)
            
            # Handle quizzes update if provided
            if 'quizzes' in data:
                quizzes_data = []
                if isinstance(data['quizzes'], str):
                    try:
                        quizzes_data = json.loads(data['quizzes'])
                    except json.JSONDecodeError:
                        return Response({"error": "Invalid quiz data format"}, 
                                      status=status.HTTP_400_BAD_REQUEST)
                else:
                    quizzes_data = data['quizzes']
                
                # Update quizzes (delete and recreate for simplicity)
                Quiz.objects.filter(event=updated_event).delete()
                
                # Create new quizzes
                for quiz_data in quizzes_data:
                    if not quiz_data.get('visible', False):
                        continue  # Skip quizzes marked as not visible
                        
                    quiz = Quiz.objects.create(
                        event=updated_event,
                        title=quiz_data.get('title', 'Untitled Quiz'),
                        visible=True
                    )
                    
                    # Create questions for this quiz
                    for question_data in quiz_data.get('questions', []):
                        question_type = question_data.get('type', 'multiple_choice')
                        
                        question = Question.objects.create(
                            quiz=quiz,
                            question_text=question_data.get('question', ''),
                            question_type=question_type
                        )
                        
                        # Create options based on question type
                        if question_type == 'multiple_choice':
                            options = question_data.get('options', [])
                            correct_answer_index = question_data.get('correctAnswer', 0)
                            
                            for i, option_text in enumerate(options):
                                if not option_text.strip():
                                    continue  # Skip empty options
                                    
                                QuestionOption.objects.create(
                                    question=question,
                                    option_text=option_text,
                                    is_correct=(i == correct_answer_index)
                                )
                        
                        elif question_type == 'true_false':
                            correct_answer = question_data.get('correctAnswer', 0)
                            
                            # Create True option
                            QuestionOption.objects.create(
                                question=question,
                                option_text='True',
                                is_correct=(correct_answer == 0)
                            )
                            
                            # Create False option
                            QuestionOption.objects.create(
                                question=question,
                                option_text='False',
                                is_correct=(correct_answer == 1)
                            )
            
            # Handle materials update if files are provided
            if request.FILES:
                files = request.FILES.getlist('files')
                materials_meta = []
                
                # Process materials metadata if provided
                if 'materials' in data and isinstance(data['materials'], str):
                    try:
                        materials_meta = json.loads(data['materials'])
                    except json.JSONDecodeError:
                        return Response({"error": "Invalid materials data format"}, 
                                       status=status.HTTP_400_BAD_REQUEST)
                
                # Update approach: delete existing ones and create new ones
                if 'replace_materials' in data and data['replace_materials'] == 'true':
                    Material.objects.filter(event=updated_event).delete()
                
                # Create new materials
                for i, file in enumerate(files):
                    material = {
                        'file': file,
                        'title': file.name,  # Default to filename
                        'visible': False     # Default visibility
                    }
                    
                    # Override with metadata if available
                    if i < len(materials_meta):
                        if 'name' in materials_meta[i]:
                            material['title'] = materials_meta[i]['name']
                        if 'visible' in materials_meta[i]:
                            material['visible'] = materials_meta[i]['visible']
                    
                    if material.get('visible', False):
                        Material.objects.create(
                            event=updated_event,
                            title=material.get('title', 'Untitled Material'),
                            file=material.get('file'),
                            visible=True
                        )
            
            # Return the updated event with all related data
            return Response(
                EventSerializer(updated_event, context={"request": request}).data, 
                status=status.HTTP_200_OK
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Delete an event and all associated quizzes and materials."""
        event = self.get_object(pk)
        
        # Check if user is allowed to delete this event
        if not event.is_organizer(request.user):
            return Response(
                {"error": "Only organizers can delete this event."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Delete will cascade to related objects due to on_delete=models.CASCADE
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MarkEventAsViewedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
            notif, _ = EventNotification.objects.get_or_create(
                user=request.user, event=event
            )
            notif.is_viewed = True
            notif.save()
            return Response({"success": True})
        except Event.DoesNotExist:
            return Response(
                {"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND
            )
        
class QuizDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        try:
            return Quiz.objects.get(pk=pk)
        except Quiz.DoesNotExist:
            raise Http404
    
    def get(self, request, pk):
        """Retrieve a specific quiz with its questions and options."""
        quiz = self.get_object(pk)
        
        # Check if user has access to this quiz
        event = quiz.event
        if not (event.is_organizer(request.user) or event.is_attendee(request.user)):
            return Response({"error": "You don't have access to this quiz."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        serializer = QuizSerializer(quiz)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        """Delete a quiz."""
        quiz = self.get_object(pk)
        
        # Check if user is allowed to delete this quiz
        if not quiz.event.is_organizer(request.user):
            return Response({"error": "Only organizers can delete quizzes."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        quiz.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class MaterialDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        try:
            return Material.objects.get(pk=pk)
        except Material.DoesNotExist:
            raise Http404
    
    def get(self, request, pk):
        """Retrieve a specific material."""
        material = self.get_object(pk)
        
        # Check if user has access to this material
        event = material.event
        if not (event.is_organizer(request.user) or event.is_attendee(request.user)):
            return Response({"error": "You don't have access to this material."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        serializer = MaterialSerializer(material)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def delete(self, request, pk):
        """Delete a material."""
        material = self.get_object(pk)
        
        # Check if user is allowed to delete this material
        if not material.event.is_organizer(request.user):
            return Response({"error": "Only organizers can delete materials."}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        material.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        search_term = request.query_params.get('search', '')
        if search_term:
            users = User.objects.filter(
                models.Q(first_name__icontains=search_term) |
                models.Q(last_name__icontains=search_term) |
                models.Q(email__icontains=search_term)
            )[:10]  # Limit results
            serializer = UserSerializer(users, many=True)
            return Response(serializer.data)
        return Response([])