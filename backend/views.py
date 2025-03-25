from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, get_user_model

from .serializers import UserSerializer, EventSerializer  #UPDATED import
from .models import Event  #NEW import

User = get_user_model()

class UserRegisterView(APIView):
    def post(self, request):
        # Extract data from request
        email = request.data.get('email')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        password = request.data.get('password')
        password2 = request.data.get('password2')
        
        # Basic validation
        if not email or not first_name or not last_name or not password:
            return Response(
                {'message': 'All fields are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if password != password2:
            return Response(
                {'message': 'Passwords do not match'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {'message': 'Email already registered'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        try:
            user = User.objects.create_user(
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password
            )
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {'message': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserLoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Please provide both email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user = authenticate(request, email=email, password=password)
        
        if user:
            # Return user data
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_200_OK
            )
        
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

# List or create events
class EventListCreateView(APIView):
    def get(self, request):
        """Return a list of all events."""
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Create a new event."""
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save()  # saves the new event to DB
            return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
