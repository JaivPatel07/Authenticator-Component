
from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import registerView, loginView, LogoutView, UserView, RequestPasswordResetView, ConfirmPasswordResetView, OTPVerifyView, GoogleLoginView, GitHubLoginView

urlpatterns = [
    path('api/register/', registerView.as_view(), name='register'),
    path('api/login/', loginView.as_view(), name='login'),
    path('api/login/verify/', OTPVerifyView.as_view(), name='login_verify'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/user/', UserView.as_view(), name='user'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/password-reset/', RequestPasswordResetView.as_view(), name='password_reset'),
    path('api/password-reset-confirm/', ConfirmPasswordResetView.as_view(), name='password_reset_confirm'),
    path('api/auth/google/', GoogleLoginView.as_view(), name='google_login'),
    path('api/auth/github/', GitHubLoginView.as_view(), name='github_login'),
]