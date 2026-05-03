"""
URL configuration for entry_system project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
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
# entry_system/urls.py

from django.urls import path
from django.http import JsonResponse
from tickets import views


def cron_ping(request):
    """Keep-alive endpoint for FastCron — returns 200 OK so Render stays warm."""
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('', views.landing_page, name='landing'),

    # Authentication URLs (HTML pages – original Django views, untouched)
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard_view, name='dashboard'),

    # Ticket Management URLs (HTML pages)
    path('design/', views.design_configurator, name='design'),
    path('save-design/', views.save_design, name='save_design'),
    path('generate/', views.generate_tickets, name='generate'),
    path('download-tickets/', views.download_tickets_zip, name='download_tickets'),
    path('scanner/', views.gate_scanner, name='scanner'),
    path('api/validate/', views.validate_ticket_api, name='validate'),

    # ── JSON API – consumed by the Next.js frontend ──────────────────────
    path('api/login/', views.api_login, name='api_login'),
    path('api/register/', views.api_register, name='api_register'),
    path('api/logout/', views.api_logout, name='api_logout'),
    path('api/dashboard/', views.api_dashboard, name='api_dashboard'),
    path('api/save-design/', views.api_save_design, name='api_save_design'),
    path('api/generate/', views.api_generate, name='api_generate'),
    path('api/download-tickets/', views.api_download_tickets, name='api_download_tickets'),
    # ── Cron / keep-alive ──────────────────────────────────────────────────
    path('api/cron/ping/', cron_ping, name='cron_ping'),
]
