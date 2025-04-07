from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, get_user_model
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer, EventSerializer  # UPDATED import
from .models import Event, EventNotification  # NEW import

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


# List or create events
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
        
        # If organizers are provided, make sure we don't duplicate the current user
        if 'organizers' in data:
            # Convert to list if it's not already
            organizers = data.getlist('organizers') if hasattr(data, 'getlist') else data.get('organizers', [])
            
            # Convert to a set to remove duplicates
            organizer_ids = set(int(org_id) for org_id in organizers if str(org_id).isdigit())
            
            # Don't include the current user as they'll be added automatically
            organizer_ids = [org_id for org_id in organizer_ids if org_id != request.user.id]
            
            # Update the request data
            data['organizers'] = organizer_ids
        
        serializer = EventSerializer(data=data)
        if serializer.is_valid():
            # Save the event
            event = serializer.save()
            
            # Add the current user as an organizer
            event.add_organizer(request.user)
            
            return Response(
                EventSerializer(event, context={"request": request}).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Detail view for a single event
class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_object(self, pk):
        try:
            return Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        """Return details of a specific event."""
        event = self.get_object(pk)
        serializer = EventSerializer(event, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """Update an existing event."""
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
        
        serializer = EventSerializer(event, data=data, partial=True, context={"request": request})
        if serializer.is_valid():
            updated_event = serializer.save()
            
            # Double-check to make sure the current user is still an organizer
            if not updated_event.is_organizer(request.user):
                updated_event.add_organizer(request.user)
            
            return Response(
                EventSerializer(updated_event, context={"request": request}).data, 
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Delete an event."""
        event = self.get_object(pk)
        
        # Check if user is allowed to delete this event
        if not event.is_organizer(request.user):
            return Response(
                {"error": "Only organizers can delete this event."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
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