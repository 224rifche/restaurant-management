from rest_framework.routers import DefaultRouter
from .views import ScheduleViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'schedules', ScheduleViewSet, basename='schedule')

urlpatterns = router.urls
