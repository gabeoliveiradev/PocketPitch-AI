from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics, status
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
import os
from google import genai
from .models import Conversation, Message
from .serializers import RegisterSerializer, UserSerializer, ConversationSerializer
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            tokens = get_tokens_for_user(user)
            response = Response({
                "message": "Login successful",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE'],
                value=tokens["access"],
                expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            response.set_cookie(
                key=settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'],
                value=tokens["refresh"],
                expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
                secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
                httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
                samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
            )
            return response
        else:
            return Response({"error": "Invalid username or password"}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        response = Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH'])
        return response

class UserProfileView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(UserSerializer(request.user).data)

class ConversationListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user).order_by('-updated_at')

class ConversationDetailView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

class ChatCompletionView(APIView):
    permission_classes = [IsAuthenticated] 

    def post(self, request):
        user_message = request.data.get('message')
        conversation_id = request.data.get('conversation_id')
        
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key or api_key == '':
            return Response({"error": "Chave Gemini não configurada"}, status=500)

        # Get or create conversation
        if conversation_id:
            try:
                conversation = Conversation.objects.get(id=conversation_id, user=request.user)
            except Conversation.DoesNotExist:
                return Response({"error": "Conversation not found"}, status=404)
        else:
            conversation = Conversation.objects.create(user=request.user)
            
        # Save user message
        Message.objects.create(conversation=conversation, role='user', content=user_message)

        try:
            client = genai.Client(api_key=api_key)
            
            system_prompt = "Você é um assistente especialista para vendedores chamado PocketPitch AI. Seja prático, rápido e focado em vendas."
            
            # Fetch conversation history for context (optional logic, but basic MVP is just appending)
            # For simplicity, we just send the system prompt + user message
            full_prompt = f"{system_prompt}\n\nVendedor: {user_message}\nIA:"
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=full_prompt,
            )
            
            ai_content = response.text
            
            # Save AI message
            Message.objects.create(conversation=conversation, role='ai', content=ai_content)
            
            return Response({"content": ai_content, "conversation_id": conversation.id})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
