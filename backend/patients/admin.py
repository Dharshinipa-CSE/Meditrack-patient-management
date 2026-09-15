from django.contrib import admin
from .models import Patient


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('patient_id', 'name', 'age', 'gender', 'status', 'doctor_assigned', 'admission_date', 'owner')
    search_fields = ('name', 'patient_id', 'diagnosis', 'doctor_assigned')
    list_filter = ('status', 'gender')
