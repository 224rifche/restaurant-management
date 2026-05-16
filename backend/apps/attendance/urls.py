from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, AttendanceRuleViewSet

router = DefaultRouter(trailing_slash=False)
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'rules', AttendanceRuleViewSet, basename='attendance-rules')

urlpatterns = router.urls
