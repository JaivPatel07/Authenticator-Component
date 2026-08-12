
from django.urls import path

from .views import registerView

urlpatterns = [
    path('api/register/', registerView, name='register'),
]