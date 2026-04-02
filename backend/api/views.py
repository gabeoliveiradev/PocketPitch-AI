from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
import google.generativeai as genai
import os
from .models import Conversation, Message

class ChatCompletionView(APIView):
    # For MVP, allowing any to avoid setting up JWT if not strictly needed now.
    # In real app with user login: permission_classes = [IsAuthenticated]
    permission_classes = [AllowAny] 

    def post(self, request):
        user_message = request.data.get('message')
        
        # MOCK IF KEY NOT PROVIDED YET
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key or api_key == '':
            return Response({"content": "Mock IA: " + user_message[::-1] + " (Chave Gemini não configurada)"})

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-pro')
            
            # Simple context engineering for MVP
            system_prompt = "Você é um assistente especialista para vendedores chamado PocketPitch AI. Seja prático, rápido e focado em vendas."
            full_prompt = f"{system_prompt}\n\nVendedor: {user_message}\nIA:"
            
            response = model.generate_content(full_prompt)
            
            # TODO: save to DB (Conversation / Message models)
            
            return Response({"content": response.text})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
