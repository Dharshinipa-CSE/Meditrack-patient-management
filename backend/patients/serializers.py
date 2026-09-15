import re

from rest_framework import serializers

from .models import Patient


class PatientSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = Patient
        fields = [
            'id', 'patient_id', 'name', 'age', 'gender', 'contact_number',
            'email', 'diagnosis', 'doctor_assigned', 'status', 'admission_date',
            'owner', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        return value.strip()

    def validate_patient_id(self, value):
        if not value.strip():
            raise serializers.ValidationError("Patient ID cannot be empty.")
        return value.strip()

    def validate_age(self, value):
        if value <= 0 or value > 130:
            raise serializers.ValidationError("Enter a realistic age (1-130).")
        return value

    def validate_contact_number(self, value):
        if not re.fullmatch(r'\d{7,15}', value):
            raise serializers.ValidationError("Contact number must contain 7-15 digits only.")
        return value

    def validate_diagnosis(self, value):
        if not value.strip():
            raise serializers.ValidationError("Diagnosis cannot be empty.")
        return value.strip()

    def validate_doctor_assigned(self, value):
        if not value.strip():
            raise serializers.ValidationError("Assigned doctor cannot be empty.")
        return value.strip()
