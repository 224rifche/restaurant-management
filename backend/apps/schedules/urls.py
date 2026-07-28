from rest_framework.routers import DefaultRouter
from .views import (
    WeeklyAssignmentViewSet, ShiftScheduleViewSet,
    SauceValidationViewSet, ScheduleChangeRequestViewSet,
)

router = DefaultRouter(trailing_slash=False)
router.register(r'schedules', WeeklyAssignmentViewSet, basename='schedule')
router.register(r'shifts', ShiftScheduleViewSet, basename='shift')
router.register(r'sauce-validations', SauceValidationViewSet, basename='sauce-validation')
router.register(r'schedule-requests', ScheduleChangeRequestViewSet, basename='schedule-request')

urlpatterns = router.urls
