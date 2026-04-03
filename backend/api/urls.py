from django.urls import path
from .views import (
    ChatCompletionView, 
    RegisterView, 
    LoginView, 
    LogoutView, 
    UserProfileView,
    ConversationListView, 
    ConversationDetailView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('conversations/', ConversationListView.as_view(), name='conversation_list'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation_detail'),
    path('chat/', ChatCompletionView.as_view(), name='chat'),
]
