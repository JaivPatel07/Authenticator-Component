from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from django.contrib.auth import logout
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTP
import random
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
import urllib.parse
import urllib.request
import json



# Create your views here.

class registerView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully'},status=201)   

        return Response(serializer.errors, status=400)

class loginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Generate 6-digit OTP code
        otp_code = f"{random.randint(100000, 999999)}"
        
        # Save OTP to database
        OTP.objects.create(user=user, code=otp_code)
        
        # Send OTP email
        subject = "Your Login Verification Code"
        message = f"Hello,\n\nYour login verification OTP is: {otp_code}\n\nIt is valid for 5 minutes."
        
        send_mail(
            subject,
            message,
            None,  # Uses DEFAULT_FROM_EMAIL
            [user.email],
            fail_silently=False,
        )
        
        return Response({
            'otp_required': True,
            'email': user.email,
            'message': 'Verification code has been sent to your email.'
        }, status=status.HTTP_200_OK)


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email and OTP code are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check latest unused OTP created in the last 5 minutes
        expiry_time = timezone.now() - timedelta(minutes=5)
        otp_record = OTP.objects.filter(
            user=user,
            code=otp,
            is_used=False,
            created_at__gte=expiry_time
        ).order_by('-created_at').first()
        
        if not otp_record:
            return Response({'error': 'Invalid or expired verification code.'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp_record.is_used = True
        otp_record.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
        

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            logout(request)
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class UserView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        data = request.data
        
        if 'username' in data:
            username = data['username']
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                return Response({'error': 'Username is already taken.'}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username
            
        if 'password' in data and 'old_password' in data:
            if not user.check_password(data['old_password']):
                return Response({'error': 'Incorrect old password.'}, status=status.HTTP_400_BAD_REQUEST)
            if len(data['password']) < 8:
                return Response({'error': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(data['password'])
            
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    def delete(self, request):
        user = request.user
        user.delete()
        return Response({'message': 'Account deleted successfully.'}, status=status.HTTP_200_OK)


from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail

class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Use frontend url from settings/env or fallback to localhost
            frontend_url = getattr(settings, 'CORS_ALLOWED_ORIGINS', ['http://localhost:5173'])[0]
            reset_link = f"{frontend_url}/reset-password/{uidb64}/{token}"
            
            subject = "Password Reset Requested"
            message = f"Hello,\n\nYou requested a password reset. Please use the link below to reset your password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email."
            
            send_mail(
                subject,
                message,
                None,  # Uses DEFAULT_FROM_EMAIL
                [email],
                fail_silently=False,
            )
        except User.DoesNotExist:
            # For security, do not reveal if user does not exist
            pass
            
        return Response({'message': 'If an account with this email exists, a password reset link has been sent.'}, status=status.HTTP_200_OK)


class ConfirmPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        password = request.data.get('password')
        
        if not all([uidb64, token, password]):
            return Response({'error': 'All fields (uidb64, token, password) are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Token has expired or is invalid.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(password)
        user.save()
        return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)


class GoogleLoginView(APIView):
    """Exchange Google OAuth code for JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code')
        redirect_uri = request.data.get('redirect_uri', f"{settings.FRONTEND_URL}/auth/callback/google")

        if not code:
            return Response({'error': 'Authorization code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Step 1: Exchange code for Google access token
        token_data = urllib.parse.urlencode({
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code',
        }).encode()

        try:
            token_req = urllib.request.Request(
                'https://oauth2.googleapis.com/token',
                data=token_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                method='POST'
            )
            with urllib.request.urlopen(token_req) as resp:
                token_json = json.loads(resp.read().decode())
            access_token = token_json.get('access_token')
        except Exception as e:
            return Response({'error': f'Failed to exchange code with Google: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Get user info from Google
        try:
            userinfo_req = urllib.request.Request(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            with urllib.request.urlopen(userinfo_req) as resp:
                userinfo = json.loads(resp.read().decode())
        except Exception as e:
            return Response({'error': f'Failed to fetch user info from Google: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        email = userinfo.get('email')
        name = userinfo.get('name', '')

        if not email:
            return Response({'error': 'Could not retrieve email from Google.'}, status=status.HTTP_400_BAD_REQUEST)

        # Step 3: Find or create user
        action = request.data.get('action', 'login')
        username_base = email.split('@')[0]
        
        try:
            user = User.objects.get(email=email)
            created = False
        except User.DoesNotExist:
            if action == 'login':
                return Response({'error': 'Account does not exist. Please sign up first.'}, status=status.HTTP_400_BAD_REQUEST)
            user = User.objects.create(
                email=email,
                username=username_base,
                first_name=name.split(' ')[0] if name else '',
                last_name=' '.join(name.split(' ')[1:]) if name else '',
                is_verified=True,
            )
            created = True

        # Step 4: Return JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'created': created,
        }, status=status.HTTP_200_OK)


class GitHubLoginView(APIView):
    """Exchange GitHub OAuth code for JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        code = request.data.get('code')

        if not code:
            return Response({'error': 'Authorization code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Step 1: Exchange code for GitHub access token
        token_data = urllib.parse.urlencode({
            'code': code,
            'client_id': settings.GITHUB_CLIENT_ID,
            'client_secret': settings.GITHUB_CLIENT_SECRET,
        }).encode()

        try:
            token_req = urllib.request.Request(
                'https://github.com/login/oauth/access_token',
                data=token_data,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                method='POST'
            )
            with urllib.request.urlopen(token_req) as resp:
                token_json = json.loads(resp.read().decode())
            access_token = token_json.get('access_token')
        except Exception as e:
            return Response({'error': f'Failed to exchange code with GitHub: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Get user info from GitHub
        try:
            userinfo_req = urllib.request.Request(
                'https://api.github.com/user',
                headers={
                    'Authorization': f'Bearer {access_token}',
                    'Accept': 'application/json',
                }
            )
            with urllib.request.urlopen(userinfo_req) as resp:
                userinfo = json.loads(resp.read().decode())
        except Exception as e:
            return Response({'error': f'Failed to fetch user info from GitHub: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Step 3: Get user's primary email (GitHub may not expose it in user info)
        email = userinfo.get('email')
        if not email:
            try:
                emails_req = urllib.request.Request(
                    'https://api.github.com/user/emails',
                    headers={
                        'Authorization': f'Bearer {access_token}',
                        'Accept': 'application/json',
                    }
                )
                with urllib.request.urlopen(emails_req) as resp:
                    emails = json.loads(resp.read().decode())
                primary = next((e for e in emails if e.get('primary') and e.get('verified')), None)
                email = primary['email'] if primary else None
            except Exception:
                pass

        if not email:
            return Response({'error': 'Could not retrieve a verified email from GitHub. Please make your email public or verify it.'}, status=status.HTTP_400_BAD_REQUEST)

        login_name = userinfo.get('login', email.split('@')[0])
        name = userinfo.get('name', '') or ''

        # Step 4: Find or create user
        action = request.data.get('action', 'login')
        try:
            user = User.objects.get(email=email)
            created = False
        except User.DoesNotExist:
            if action == 'login':
                return Response({'error': 'Account does not exist. Please sign up first.'}, status=status.HTTP_400_BAD_REQUEST)
            user = User.objects.create(
                email=email,
                username=login_name,
                first_name=name.split(' ')[0] if name else '',
                last_name=' '.join(name.split(' ')[1:]) if name else '',
                is_verified=True,
            )
            created = True

        # Step 5: Return JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data,
            'created': created,
        }, status=status.HTTP_200_OK)