from django.conf import settings
from django.db import models


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    STATUS_CHOICES = [
        ('ADMITTED', 'Admitted'),
        ('TREATMENT', 'Under Treatment'),
        ('DISCHARGED', 'Discharged'),
    ]

    # Each record remembers which logged-in staff user created it.
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='patients')

    patient_id = models.CharField(max_length=30, unique=True, help_text="Hospital registration/ID number")
    name = models.CharField(max_length=150)
    age = models.PositiveSmallIntegerField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    contact_number = models.CharField(max_length=15)
    email = models.EmailField(blank=True)
    diagnosis = models.CharField(max_length=255)
    doctor_assigned = models.CharField(max_length=150)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ADMITTED')
    admission_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.patient_id} - {self.name}"
