from django.urls import path
from .views import ChatCompletionView

urlpatterns = [
    path('chat/', ChatCompletionView.as_view(), name='chat'),
]
