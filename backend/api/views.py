from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import generics, status
from django.conf import settings
from django.http import StreamingHttpResponse
import json
from rest_framework_simplejwt.tokens import RefreshToken
import os
from google import genai
from google.genai.types import Content, Part, GenerateContentConfig
from .models import Conversation, Message
from .serializers import RegisterSerializer, UserSerializer, ConversationSerializer
from django.contrib.auth.models import User
from django.contrib.auth import authenticate

# Limite de mensagens de histórico para controlar custos de tokens
MAX_HISTORY_MESSAGES = 20

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    authentication_classes = ()
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

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

class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
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
            title = user_message[:60] if user_message else 'Nova Conversa'
            conversation = Conversation.objects.create(user=request.user, title=title)
            
        # Save user message
        user_msg_instance = Message.objects.create(conversation=conversation, role='user', content=user_message)

        try:
            client = genai.Client(api_key=api_key)
            system_prompt = "Você é um assistente especialista para vendedores chamado PocketPitch AI. Seja prático, rápido e focado em vendas."

            # Build multi-turn conversation history from database
            history_messages = (
                Message.objects
                .filter(conversation=conversation)
                .exclude(id=user_msg_instance.id)
                .order_by('timestamp')[:MAX_HISTORY_MESSAGES]
            )

            contents = []
            for msg in history_messages:
                role = 'user' if msg.role == 'user' else 'model'
                contents.append(
                    Content(role=role, parts=[Part.from_text(text=msg.content)])
                )

            # Append current user message
            contents.append(
                Content(role='user', parts=[Part.from_text(text=user_message)])
            )
            
            # Start generator logic for SSE
            def event_stream():
                try:
                    response = client.models.generate_content_stream(
                        model='gemini-2.5-flash',
                        contents=contents,
                        config=GenerateContentConfig(
                            system_instruction=system_prompt,
                        ),
                    )
                    full_ai_content = ""
                    for chunk in response:
                        if chunk.text:
                            full_ai_content += chunk.text
                            # Format line as SSE data
                            yield f"data: {json.dumps({'content': chunk.text})}\n\n"
                    
                    # Save AI message when done
                    Message.objects.create(conversation=conversation, role='ai', content=full_ai_content)
                    
                    # Final event
                    yield f"data: {json.dumps({'done': True, 'conversation_id': conversation.id})}\n\n"
                except Exception as stream_err:
                    yield f"data: {json.dumps({'error': str(stream_err)})}\n\n"
                    yield f"data: {json.dumps({'done': True, 'conversation_id': conversation.id})}\n\n"

            return StreamingHttpResponse(event_stream(), content_type='text/event-stream')
            
        except Exception as e:
            return Response({"error": str(e)}, status=500)
