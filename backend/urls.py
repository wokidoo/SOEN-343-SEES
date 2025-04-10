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
from .views import (
    EventDetailView,
    UserLoginView,
    UserRegisterView,
    EventListCreateView,
    MarkEventAsViewedView,
    UserProfileView,
    QuizDetailView,
    MaterialDetailView,
    UserSearchView,
    StripeCheckoutView,
    stripe_webhook,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/users/", UserRegisterView.as_view(), name="user-register"),
    path("api/login/", UserLoginView.as_view(), name="user-login"),
    path("api/profile/", UserProfileView.as_view(), name="user-profile"),
    path('api/users/search/', UserSearchView.as_view(), name='user-search'),
    path("api/events/", EventListCreateView.as_view(), name="events-list-create"),
    path("api/events/<int:pk>/mark-viewed/", MarkEventAsViewedView.as_view()),
    path("api/events/<int:pk>/", EventDetailView.as_view(), name="event-detail"),
    path('api/quizzes/<int:pk>/', QuizDetailView.as_view(), name='quiz-detail'),
    path('api/materials/<int:pk>/', MaterialDetailView.as_view(), name='material-detail'),
    path('api/events/<int:event_id>/checkout/', StripeCheckoutView.as_view()),
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
]
