"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from .views import EventDetailView, UserLoginView, UserRegisterView, EventListCreateView, MarkEventAsViewedView  # <-- UPDATED import

urlpatterns = [
    path("admin/", admin.site.urls),
    path('api/users/', UserRegisterView.as_view(), name='user-register'),
    path('api/login/', UserLoginView.as_view(), name='user-login'),
    path('api/events/', EventListCreateView.as_view(), name='events-list-create'),
    path('api/events/<int:pk>/mark-viewed/', MarkEventAsViewedView.as_view()),
    path('api/events/<int:pk>/', EventDetailView.as_view(), name='event-detail'),
]

