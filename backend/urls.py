from django.contrib import admin
from django.urls import path
from .views import (
    UserRegisterView,
    UserLoginView,
    EventListCreateView,
    EventRetrieveUpdateDestroyView
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", UserRegisterView.as_view(), name="user-register"),
    path("api/login/", UserLoginView.as_view(), name="user-login"),
    path("api/events/", EventListCreateView.as_view(), name="events-list-create"),
    path("api/events/<int:pk>/", EventRetrieveUpdateDestroyView.as_view(), name="event-detail"),
]
