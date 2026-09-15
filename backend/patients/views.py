from django.db.models import Q
from rest_framework import viewsets, permissions
from rest_framework.exceptions import ValidationError

from .models import Patient
from .serializers import PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    """
    Provides list, retrieve, create, update, partial_update, destroy
    for the Patient entity (full CRUD), scoped to the logged-in user.

    Supports ?search=<text> to filter by name, patient ID, diagnosis, or doctor.
    Supports ?status=<ADMITTED|TREATMENT|DISCHARGED> to filter by status.
    """
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Patient.objects.filter(owner=self.request.user)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(patient_id__icontains=search) |
                Q(diagnosis__icontains=search) |
                Q(doctor_assigned__icontains=search)
            )

        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_update(self, serializer):
        patient_id = serializer.validated_data.get('patient_id')
        if patient_id:
            clash = Patient.objects.filter(patient_id=patient_id).exclude(pk=self.get_object().pk)
            if clash.exists():
                raise ValidationError({"patient_id": "A patient with this ID already exists."})
        serializer.save()
