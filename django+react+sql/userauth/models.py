from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):     # if we use User then we need to write AUTH_USER_MODEL = "userauth.User" in settings.py else we got error of two User 1 our and other django User model
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20,unique=True,null=True,blank=True)
    is_verified = models.BooleanField( default=False)
    updated_at = models.DateTimeField( auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def __str__(self):
        return self.email