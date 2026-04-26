from django.urls import path
from .views import EnrollView, AuthenticateView, StatusView

urlpatterns = [
    path("enroll/",         EnrollView.as_view(),          name="enroll"),
    path("authenticate/",   AuthenticateView.as_view(),    name="authenticate"),
    path("status/<str:username>/", StatusView.as_view(),   name="status"),
]
