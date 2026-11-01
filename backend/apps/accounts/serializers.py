from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserRole

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'ward', 'department', 'avatar_url']
        read_only_fields = ['id', 'role']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'ward', 'role']

    def create(self, validated_data):
        # Default new registrations to CITIZEN role unless explicitly authorized
        role = validated_data.get('role', UserRole.CITIZEN)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            ward=validated_data.get('ward', 'Ward 4 (Central Hospital & Metro Corridor)'),
            role=role,
        )
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(username=username, password=password)
        if not user:
            # Check by email as fallback
            try:
                user_obj = User.objects.get(email=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None

        if not user:
            raise serializers.ValidationError('Invalid municipal credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account is suspended or deactivated.')

        attrs['user'] = user
        return attrs
