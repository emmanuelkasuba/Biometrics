from django.urls import path, include

urlpatterns = [
    path("api/biometric/", include("biometric.urls")),
]
